"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// zabbix/src/host.ts
var host_exports = {};
__export(host_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(host_exports);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);

// zabbix/src/settings.ts
var DEFAULTS = {
  url: "",
  token: "",
  interval: 60,
  minSeverity: 4,
  groupMin: 3,
  alertAcknowledged: false,
  allowExpiredCert: false,
  mute: []
};
var LIMITS = {
  interval: { min: 30, max: 3600 },
  minSeverity: { min: 0, max: 5 },
  groupMin: { min: 2, max: 100 }
};
var MAX_PATTERNS = 100;
var MAX_PATTERN = 200;
function clamp(value, { min, max }, fallback) {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
function patterns(value) {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : [];
  const out = [];
  for (const p of list) {
    if (typeof p !== "string") continue;
    const t = p.trim().slice(0, MAX_PATTERN);
    if (t && !out.includes(t)) out.push(t);
    if (out.length === MAX_PATTERNS) break;
  }
  return out;
}
function parseSettings(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const url = typeof o.url === "string" ? o.url.trim().replace(/\/+$/, "").replace(/\/api_jsonrpc\.php$/, "") : "";
  return {
    url: isWebUrl(url) ? url : "",
    token: typeof o.token === "string" ? o.token.trim() : "",
    interval: clamp(o.interval, LIMITS.interval, DEFAULTS.interval),
    minSeverity: clamp(o.minSeverity, LIMITS.minSeverity, DEFAULTS.minSeverity),
    groupMin: clamp(o.groupMin, LIMITS.groupMin, DEFAULTS.groupMin),
    alertAcknowledged: o.alertAcknowledged === true,
    allowExpiredCert: o.allowExpiredCert === true,
    mute: patterns(o.mute)
  };
}
function isWebUrl(value) {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}
function compilePatterns(list) {
  const res = list.map((p) => {
    const slash = p.indexOf("/");
    const [h, n] = slash < 0 ? ["*", p] : [p.slice(0, slash), p.slice(slash + 1)];
    return [glob(h.trim()), glob(n.trim())];
  });
  return (host, name) => res.some(([h, n]) => h.test(host) && n.test(name));
}
function glob(p) {
  const body = p.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${body}$`, "i");
}

// zabbix/src/engine.ts
var EMPTY = { incidents: [], quiet: [], total: 0, failures: 0, lastPoll: null, lastError: null };
var UNREACHABLE_AFTER = 3;
var MAX_QUIET = 200;
function label(p) {
  return `${p.host}: ${p.name}`;
}
var maxSeverity = (list) => Math.max(...list.map((p) => p.severity));
function bundle(alerting, groupMin) {
  const out = [];
  for (const [name, problems] of groupBy(alerting, (p) => p.name)) {
    const hosts = new Set(problems.map((p) => p.hostId)).size;
    if (hosts < groupMin) continue;
    out.push({ id: `name:${name}`, kind: "name", subject: name, title: `${name} on ${hosts} hosts`, problems, severity: maxSeverity(problems) });
  }
  const named = new Set(out.flatMap((i) => i.problems.map((p) => p.key)));
  const left = alerting.filter((p) => !named.has(p.key));
  const onHost = /* @__PURE__ */ new Set();
  for (const [, problems] of groupBy(left, (p) => p.hostId)) {
    if (problems.length < groupMin) continue;
    const host = problems[0].host;
    out.push({
      id: `host:${problems[0].hostId}`,
      kind: "host",
      subject: host,
      title: `${host}: ${problems.length} problems`,
      problems,
      severity: maxSeverity(problems)
    });
    for (const p of problems) onHost.add(p.key);
  }
  for (const p of left) {
    if (onHost.has(p.key)) continue;
    out.push({ id: `problem:${p.key}`, kind: "problem", subject: label(p), title: label(p), problems: [p], severity: p.severity });
  }
  return out.sort((a, b) => b.severity - a.severity);
}
function groupBy(list, key) {
  const m = /* @__PURE__ */ new Map();
  for (const t of list) {
    const k = key(t);
    const l = m.get(k);
    if (l) l.push(t);
    else m.set(k, [t]);
  }
  return m;
}
function step(prev, outcome, settings, now) {
  const prevById = new Map(prev.incidents.map((i) => [i.id, i]));
  if (!outcome.ok) {
    const failures = prev.failures + 1;
    const state = { ...prev, failures, lastError: outcome.error };
    if (failures < UNREACHABLE_AFTER || prevById.has("unreachable")) return { state, opened: [], resolved: [] };
    const down = {
      id: "unreachable",
      kind: "unreachable",
      subject: "Zabbix",
      title: "Zabbix unreachable",
      problems: [],
      severity: -1,
      since: now
    };
    state.incidents = [...prev.incidents, down];
    return { state, opened: [down], resolved: [] };
  }
  const muted = compilePatterns(settings.mute);
  const alerting = [];
  const quiet = [];
  for (const p of outcome.problems) {
    if (muted(p.host, p.name)) continue;
    const loud = p.severity >= settings.minSeverity && !p.maintenance && (settings.alertAcknowledged || !p.acknowledged);
    if (loud) alerting.push(p);
    else if (quiet.length < MAX_QUIET) quiet.push(p);
  }
  quiet.sort((a, b) => b.severity - a.severity);
  const alerted = /* @__PURE__ */ new Map();
  for (const i of prev.incidents) for (const p of i.problems) alerted.set(p.key, i.since);
  const alertingKeys = new Set(alerting.map((p) => p.key));
  const incidents = bundle(alerting, settings.groupMin).map((i) => {
    const kept = prevById.get(i.id)?.since;
    const earlier = i.problems.map((p) => alerted.get(p.key)).filter((s) => !!s).sort()[0];
    return { ...i, since: kept ?? earlier ?? now };
  });
  const opened = incidents.filter((i) => !prevById.has(i.id) && i.problems.some((p) => !alerted.has(p.key)));
  const resolved = prev.incidents.filter(
    (i) => i.kind === "unreachable" || !incidents.some((n) => n.id === i.id) && !i.problems.some((p) => alertingKeys.has(p.key))
  );
  return {
    state: { incidents, quiet, total: outcome.problems.length, failures: 0, lastPoll: now, lastError: null },
    opened,
    resolved
  };
}
function toastFor({ opened, resolved }) {
  const [first, ...rest] = opened.length ? [...opened].sort((a, b) => b.severity - a.severity) : resolved;
  if (!first) return null;
  const isNew = opened.length > 0;
  const shown = first.kind === "problem" ? [] : first.problems.slice(0, 3).map(label);
  const extra = first.problems.length - shown.length;
  return {
    title: isNew ? first.title : `${first.subject} resolved`,
    tag: isNew ? "Problem" : "Resolved",
    body: shown.length ? shown.join(", ") + (extra > 0 ? ` and ${extra} more` : "") : void 0,
    more: rest.length || void 0,
    payload: { incident: first.id }
  };
}
function parseState(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const str = (v) => typeof v === "string" ? v : null;
  const num = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  const problemList = (v) => Array.isArray(v) ? v.filter(
    (p) => !!p && typeof p.key === "string" && typeof p.name === "string" && typeof p.host === "string" && typeof p.hostId === "string" && typeof p.severity === "number" && typeof p.eventId === "string" && typeof p.since === "string"
  ).map((p) => ({ ...p, acknowledged: p.acknowledged === true, maintenance: p.maintenance === true })) : [];
  const kinds = ["name", "host", "problem", "unreachable"];
  const incidents = Array.isArray(o.incidents) ? o.incidents.filter(
    (i) => !!i && typeof i.id === "string" && kinds.includes(i.kind) && typeof i.subject === "string" && typeof i.title === "string" && typeof i.since === "string"
  ).map((i) => ({
    id: i.id,
    kind: i.kind,
    subject: i.subject,
    title: i.title,
    since: i.since,
    severity: typeof i.severity === "number" ? i.severity : -1,
    problems: problemList(i.problems)
  })) : [];
  return {
    incidents,
    quiet: problemList(o.quiet),
    total: num(o.total),
    failures: num(o.failures),
    lastPoll: str(o.lastPoll),
    lastError: str(o.lastError)
  };
}

// zabbix/src/zabbix.ts
var import_node_http = __toESM(require("node:http"), 1);
var import_node_https = __toESM(require("node:https"), 1);
var import_node_net = __toESM(require("node:net"), 1);
var import_node_tls = __toESM(require("node:tls"), 1);
var import_node_crypto = require("node:crypto");
var TIMEOUT_MS = 2e4;
var MAX_BODY = 20 * 1024 * 1024;
var PROBLEMS_PARAMS = {
  output: ["triggerid", "description", "priority", "lastchange"],
  filter: { value: 1 },
  monitored: true,
  skipDependent: true,
  expandDescription: true,
  selectHosts: ["hostid", "name", "maintenance_status"],
  selectLastEvent: ["eventid", "clock", "acknowledged", "severity"],
  sortfield: "priority",
  sortorder: "DESC"
};
async function fetchProblems(baseUrl, opts) {
  return parseProblems(await rpc(baseUrl, "trigger.get", PROBLEMS_PARAMS, opts));
}
async function rpc(baseUrl, method, params, opts) {
  const url = new URL(`${baseUrl}/api_jsonrpc.php`);
  const body = JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 });
  const headers = {
    "content-type": "application/json-rpc",
    accept: "application/json",
    "content-length": String(Buffer.byteLength(body))
  };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const res = await withTimeout(timeoutMs, (signal) => post(url, headers, body, opts, signal));
  if (res.status !== 200) throw new Error(`HTTP ${res.status} from ${url.origin}`);
  let json;
  try {
    json = JSON.parse(res.body);
  } catch {
    throw new Error(`Not a Zabbix API answer from ${url.origin}`);
  }
  if (json?.error) throw new Error(`Zabbix: ${[json.error.message, json.error.data].filter(Boolean).join(" ")}`);
  if (!json || !("result" in json)) throw new Error(`Not a Zabbix API answer from ${url.origin}`);
  return json.result;
}
async function withTimeout(ms, run) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(new Error(`No answer in ${Math.round(ms / 1e3)} s`)), ms);
  try {
    return await run(ctl.signal);
  } catch (err) {
    throw ctl.signal.aborted ? ctl.signal.reason : err;
  } finally {
    clearTimeout(t);
  }
}
function post(url, headers, body, opts, signal) {
  return new Promise((resolve, reject) => {
    const fail = (e) => reject(e instanceof Error ? e : new Error(String(e)));
    const send = (socket2) => {
      const mod = url.protocol === "https:" ? import_node_https.default : import_node_http.default;
      const req = mod.request(
        url,
        {
          method: "POST",
          headers,
          signal,
          // A fresh agent each time: no pooled connection outlives the
          // settings it was made with. On the expired-certificate path it
          // hands over the socket already checked.
          agent: socket2 ? oneSocketAgent(mod, socket2) : new mod.Agent({ keepAlive: false, ...opts.roots ? { ca: opts.roots } : {} })
        },
        (res) => {
          const chunks = [];
          let size = 0;
          res.on("data", (c) => {
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
    const socket = import_node_tls.default.connect({
      host,
      port: Number(url.port || 443),
      servername: import_node_net.default.isIP(host) ? void 0 : host,
      rejectUnauthorized: false,
      ALPNProtocols: ["http/1.1"],
      ...opts.roots ? { ca: opts.roots } : {}
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
function oneSocketAgent(mod, socket) {
  const agent = new mod.Agent({ keepAlive: false });
  agent.createConnection = () => socket;
  return agent;
}
var nodeRoots = null;
function checkExpiredOnly(socket, host, roots) {
  if (socket.authorized) return null;
  const why = String(socket.authorizationError ?? "unknown");
  if (why !== "CERT_HAS_EXPIRED") return why;
  const peer = socket.getPeerCertificate(true);
  if (!peer?.raw) return "no certificate";
  const nameError = import_node_tls.default.checkServerIdentity(host, peer);
  if (nameError) return nameError.message;
  const chain = [];
  let at = peer;
  while (at?.raw && chain.length < 10) {
    chain.push(new import_node_crypto.X509Certificate(at.raw));
    if (!at.issuerCertificate || at.issuerCertificate === at || at.issuerCertificate.raw?.equals(at.raw)) break;
    at = at.issuerCertificate;
  }
  for (let i = 0; i + 1 < chain.length; i++) {
    if (!issuedBy(chain[i], chain[i + 1])) return "broken chain";
    if (i + 1 < chain.length - 1 && !chain[i + 1].ca) return "broken chain";
  }
  const trusted = roots ? roots.map((p) => new import_node_crypto.X509Certificate(p)) : nodeRoots ??= import_node_tls.default.rootCertificates.map((p) => new import_node_crypto.X509Certificate(p));
  const top = chain[chain.length - 1];
  const anchored = trusted.some(
    (r) => r.fingerprint256 === top.fingerprint256 || issuedBy(top, r)
  );
  return anchored ? null : "not issued by a trusted root";
}
function issuedBy(cert, issuer) {
  return cert.issuer === issuer.subject && cert.verify(issuer.publicKey);
}
function parseProblems(raw) {
  if (!Array.isArray(raw)) throw new Error("Not a list of Zabbix triggers");
  const out = [];
  for (const t of raw) {
    if (!t || typeof t.triggerid !== "string" || typeof t.description !== "string") continue;
    const host = Array.isArray(t.hosts) ? t.hosts[0] : void 0;
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
      since: Number.isFinite(clock) && clock > 0 ? new Date(clock * 1e3).toISOString() : "",
      acknowledged: String(ev?.acknowledged ?? "0") === "1",
      maintenance: String(host?.maintenance_status ?? "0") === "1"
    });
  }
  return out;
}

// zabbix/src/host.ts
function readJson(file) {
  try {
    return JSON.parse(import_node_fs.default.readFileSync(file, "utf-8"));
  } catch {
    return void 0;
  }
}
function writeJson(file, value, mode = 420) {
  const tmp = `${file}.${process.pid}.tmp`;
  import_node_fs.default.writeFileSync(tmp, JSON.stringify(value, null, 2), { mode });
  import_node_fs.default.renameSync(tmp, file);
}
function activate(ctx) {
  import_node_fs.default.mkdirSync(ctx.storagePath, { recursive: true });
  const configFile = import_node_path.default.join(ctx.storagePath, "config.json");
  const stateFile = import_node_path.default.join(ctx.storagePath, "state.json");
  let settings = parseSettings(readJson(configFile));
  let state = parseState(readJson(stateFile));
  let timer = null;
  let inFlight = null;
  const publicSettings = () => {
    const { token, ...rest } = settings;
    return { ...rest, hasToken: token !== "" };
  };
  const snapshot = () => ({ ...state, configured: settings.url !== "", url: settings.url });
  const publish = () => {
    ctx.setBadge(state.incidents.length || null);
    ctx.emit("changed", snapshot());
  };
  const poll = () => {
    if (!settings.url) return Promise.resolve();
    if (inFlight) return inFlight;
    const asked = settings;
    const p = fetchProblems(asked.url, { token: asked.token, allowExpiredCert: asked.allowExpiredCert }).then(
      (problems) => ({ ok: true, problems }),
      (err) => ({ ok: false, error: err instanceof Error ? err.message : String(err) })
    ).then((outcome) => {
      if (asked !== settings) return;
      const next = step(state, outcome, settings, (/* @__PURE__ */ new Date()).toISOString());
      state = next.state;
      try {
        writeJson(stateFile, state);
      } catch {
      }
      const toast = toastFor(next);
      if (toast) ctx.toast(toast);
      publish();
    });
    inFlight = p;
    void p.finally(() => {
      if (inFlight === p) inFlight = null;
    });
    return p;
  };
  const schedule = () => {
    if (timer !== null) ctx.clearTimer(timer);
    timer = settings.url ? ctx.setInterval(() => void poll(), settings.interval * 1e3) : null;
  };
  ctx.handle("config", () => publicSettings());
  ctx.handle("snapshot", () => snapshot());
  ctx.handle("poll", async () => {
    await poll();
    return snapshot();
  });
  ctx.handle("configure", (patch) => {
    const merged = { ...settings, ...patch };
    if (typeof patch?.token !== "string") merged.token = settings.token;
    const next = parseSettings(merged);
    if (next.url !== settings.url) state = { ...EMPTY };
    settings = next;
    writeJson(configFile, settings, 384);
    import_node_fs.default.chmodSync(configFile, 384);
    inFlight = null;
    schedule();
    publish();
    void poll();
    return publicSettings();
  });
  schedule();
  publish();
  void poll();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
