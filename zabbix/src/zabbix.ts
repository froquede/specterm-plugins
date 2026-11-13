// One read of a Zabbix server: its active problems, through the JSON-RPC API
// (`trigger.get`, read only). Works with Zabbix 5.4 and later, the versions
// that take an API token as `Authorization: Bearer`.
//
// A server whose certificate has expired can still be read when the user says
// so (`allowExpiredCert`), without giving up the rest of the check: the
// connection is made first, the chain is verified up to a trusted root and
// the name against the address, and only then does the request, with the
// token, go out on it.

import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { X509Certificate } from "node:crypto";
import type { Problem } from "./engine.ts";

export const TIMEOUT_MS = 20_000;
const MAX_BODY = 20 * 1024 * 1024;

export interface RpcOptions {
  token: string;
  allowExpiredCert?: boolean;
  timeoutMs?: number;
  /** Trusted roots, PEM; Node's own when left out. For the tests. */
  roots?: string[];
}

/** The params of the one call this plugin makes: every problem trigger on a
 *  monitored host, with what the rules and the panel show. Severity is the
 *  latest event's, since an operator can change it there. */
export const PROBLEMS_PARAMS = {
  output: ["triggerid", "description", "priority", "lastchange"],
  filter: { value: 1 },
  monitored: true,
  skipDependent: true,
  expandDescription: true,
  selectHosts: ["hostid", "name", "maintenance_status"],
  selectLastEvent: ["eventid", "clock", "acknowledged", "severity"],
  sortfield: "priority",
  sortorder: "DESC",
};

export async function fetchProblems(baseUrl: string, opts: RpcOptions): Promise<Problem[]> {
  return parseProblems(await rpc(baseUrl, "trigger.get", PROBLEMS_PARAMS, opts));
}

export async function rpc(baseUrl: string, method: string, params: unknown, opts: RpcOptions): Promise<unknown> {
  const url = new URL(`${baseUrl}/api_jsonrpc.php`);
  const body = JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 });
  const headers: Record<string, string> = {
    "content-type": "application/json-rpc",
    accept: "application/json",
    "content-length": String(Buffer.byteLength(body)),
  };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;

  const res = await withTimeout(timeoutMs, (signal) => post(url, headers, body, opts, signal));
  if (res.status !== 200) throw new Error(`HTTP ${res.status} from ${url.origin}`);
  let json: { result?: unknown; error?: { message?: string; data?: string } };
  try {
    json = JSON.parse(res.body);
  } catch {
    throw new Error(`Not a Zabbix API answer from ${url.origin}`);
  }
  if (json?.error) throw new Error(`Zabbix: ${[json.error.message, json.error.data].filter(Boolean).join(" ")}`);
  if (!json || !("result" in json)) throw new Error(`Not a Zabbix API answer from ${url.origin}`);
  return json.result;
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(new Error(`No answer in ${Math.round(ms / 1000)} s`)), ms);
  try {
    return await run(ctl.signal);
  } catch (err) {
    // Node reports its own AbortError; the reason says what happened.
    throw ctl.signal.aborted ? ctl.signal.reason : err;
  } finally {
    clearTimeout(t);
  }
}

function post(
  url: URL,
  headers: Record<string, string>,
  body: string,
  opts: RpcOptions,
  signal: AbortSignal
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const fail = (e: unknown) => reject(e instanceof Error ? e : new Error(String(e)));
    const send = (socket?: tls.TLSSocket) => {
      const mod = url.protocol === "https:" ? https : http;
      const req = mod.request(
        url,
        {
          method: "POST",
          headers,
          signal,
          // A fresh agent each time: no pooled connection outlives the
          // settings it was made with. On the expired-certificate path it
          // hands over the socket already checked.
          agent: socket ? oneSocketAgent(mod, socket) : new mod.Agent({ keepAlive: false, ...(opts.roots ? { ca: opts.roots } : {}) }),
        },
        (res) => {
          const chunks: Buffer[] = [];
          let size = 0;
          res.on("data", (c: Buffer) => {
            size += c.length;
            if (size > MAX_BODY) req.destroy(new Error("Answer too large"));
            else chunks.push(c);
          });
          res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf-8") }));
          res.on("error", fail);
        }
      );
      req.on("error", fail);
      req.end(body);
    };
    if (url.protocol !== "https:" || !opts.allowExpiredCert) return send();

    const host = url.hostname.replace(/^\[|\]$/g, "");
    const socket = tls.connect({
      host,
      port: Number(url.port || 443),
      servername: net.isIP(host) ? undefined : host,
      rejectUnauthorized: false,
      ALPNProtocols: ["http/1.1"],
      ...(opts.roots ? { ca: opts.roots } : {}),
    });
    const abort = () => socket.destroy(signal.reason instanceof Error ? signal.reason : new Error("Aborted"));
    signal.addEventListener("abort", abort, { once: true });
    socket.once("close", () => signal.removeEventListener("abort", abort));
    socket.once("error", fail);
    socket.once("secureConnect", () => {
      const problem = checkExpiredOnly(socket, host, opts.roots);
      if (problem) {
        socket.destroy();
        return fail(new Error(`Certificate refused: ${problem}`));
      }
      socket.off("error", fail);
      send(socket);
    });
  });
}

function oneSocketAgent(mod: typeof http | typeof https, socket: tls.TLSSocket): http.Agent {
  const agent = new mod.Agent({ keepAlive: false });
  (agent as unknown as { createConnection: () => tls.TLSSocket }).createConnection = () => socket;
  return agent;
}

let nodeRoots: X509Certificate[] | null = null;

/** Why this connection can't be trusted, or null: either it verified, or its
 *  only fault is an expired certificate, with the chain reaching a trusted
 *  root and the certificate naming this host. */
export function checkExpiredOnly(socket: tls.TLSSocket, host: string, roots?: string[]): string | null {
  if (socket.authorized) return null;
  const why = String(socket.authorizationError ?? "unknown");
  if (why !== "CERT_HAS_EXPIRED") return why;

  const peer = socket.getPeerCertificate(true);
  if (!peer?.raw) return "no certificate";
  const nameError = tls.checkServerIdentity(host, peer);
  if (nameError) return nameError.message;

  // The chain as sent, leaf first; OpenSSL's verdict above is only about the
  // first fault it met, so the signatures are checked again here.
  const chain: X509Certificate[] = [];
  let at: tls.DetailedPeerCertificate | undefined = peer;
  while (at?.raw && chain.length < 10) {
    chain.push(new X509Certificate(at.raw));
    if (!at.issuerCertificate || at.issuerCertificate === at || at.issuerCertificate.raw?.equals(at.raw)) break;
    at = at.issuerCertificate;
  }
  for (let i = 0; i + 1 < chain.length; i++) {
    if (!issuedBy(chain[i], chain[i + 1])) return "broken chain";
    if (i + 1 < chain.length - 1 && !chain[i + 1].ca) return "broken chain";
  }
  const trusted = roots ? roots.map((p) => new X509Certificate(p)) : (nodeRoots ??= tls.rootCertificates.map((p) => new X509Certificate(p)));
  const top = chain[chain.length - 1];
  const anchored = trusted.some(
(r) => r.fingerprint256 === top.fingerprint256 || issuedBy(top, r));
  return anchored ? null : "not issued by a trusted root";
}

/** `cert` names `issuer` as its issuer and carries its signature. (Not
 *  X509Certificate.checkIssued, which also wants matching key identifiers
 *  that a private CA's certificates may not carry.) */
function issuedBy(cert: X509Certificate, issuer: X509Certificate): boolean {
  return cert.issuer === issuer.subject && cert.verify(issuer.publicKey);
}

/** `trigger.get`'s answer as problems. Anything that is not a list is an
 *  error, so a wrong address doesn't read as "all fine". */
export function parseProblems(raw: unknown): Problem[] {
  if (!Array.isArray(raw)) throw new Error("Not a list of Zabbix triggers");
  const out: Problem[] = [];
  for (const t of raw) {
    if (!t || typeof t.triggerid !== "string" || typeof t.description !== "string") continue;
    const host = Array.isArray(t.hosts) ? t.hosts[0] : undefined;
    const ev = t.lastEvent && typeof t.lastEvent === "object" && !Array.isArray(t.lastEvent) ? t.lastEvent : null;
    const severity = Number(ev?.severity ?? t.priority);
    const clock = Number(ev?.clock ?? t.lastchange);
    out.push({
      key: t.triggerid,
      name: t.description,
      host: typeof host?.name === "string" ? host.name : "",
      hostId: typeof host?.hostid === "string" ? host.hostid : "",
      severity: Number.isFinite(severity) ? Math.min(5, Math.max(0, severity)) : 0,
      eventId: typeof ev?.eventid === "string" ? ev.eventid : "",
      since: Number.isFinite(clock) && clock > 0 ? new Date(clock * 1000).toISOString() : "",
      acknowledged: String(ev?.acknowledged ?? "0") === "1",
      maintenance: String(host?.maintenance_status ?? "0") === "1",
    });
  }
  return out;
}
