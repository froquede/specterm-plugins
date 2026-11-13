// The alert rules (src/engine.ts), the settings (src/settings.ts), the read of
// a Zabbix server (src/zabbix.ts), and the "Ask Claude" command line
// (shared/ask-claude.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { EMPTY, UNREACHABLE_AFTER, parseState, step, toastFor } from "../src/engine.ts";
import { fetchProblems, parseProblems, rpc } from "../src/zabbix.ts";
import { DEFAULTS, compilePatterns, parseSettings } from "../src/settings.ts";
import { claudeCommand } from "../../shared/ask-claude.ts";

const T = "2026-11-13T12:00:00Z";
let next = 1;
/** A problem on `host` (whose id is the name), High by default. */
const problem = (host, name, over = {}) => ({
  key: String(next++),
  name,
  host,
  hostId: `h-${host}`,
  severity: 4,
  eventId: String(1000 + next),
  since: T,
  acknowledged: false,
  maintenance: false,
  ...over,
});
const settings = (over = {}) => ({ ...DEFAULTS, url: "https://zabbix.test", ...over });
const run = (problems, prev = EMPTY, over = {}, now = T) => step(prev, { ok: true, problems }, settings(over), now);
const ids = (list) => list.map((i) => i.id).sort();

test("a problem at or above the minimum severity alerts; below it is quiet", () => {
  const high = problem("db", "Disk full");
  const warn = problem("db", "Swap", { severity: 2 });
  const r = run([high, warn]);
  assert.deepEqual(ids(r.opened), [`problem:${high.key}`]);
  assert.equal(r.state.incidents[0].title, "db: Disk full");
  assert.deepEqual(r.state.quiet.map((p) => p.key), [warn.key]);
  assert.equal(r.state.total, 2);
  assert.equal(run([warn], EMPTY, { minSeverity: 2 }).opened.length, 1);
});

test("acknowledged problems and hosts in maintenance are quiet, unless asked", () => {
  const acked = problem("a", "x", { acknowledged: true });
  const maint = problem("b", "y", { maintenance: true });
  const r = run([acked, maint]);
  assert.equal(r.opened.length, 0);
  assert.equal(r.state.quiet.length, 2);
  assert.deepEqual(ids(run([acked, maint], EMPTY, { alertAcknowledged: true }).opened), [`problem:${acked.key}`]);
});

test("a muted problem never alerts and is not listed", () => {
  const r = run([problem("Dev-db", "Down"), problem("Prod-db", "/data: Disk low")], EMPTY, {
    mute: ["Dev-*/*", "*//data:*"],
  });
  assert.equal(r.state.incidents.length, 0);
  assert.equal(r.state.quiet.length, 0);
});

test("the same problem on groupMin hosts is one alert", () => {
  const ps = ["a", "b", "c"].map((h) => problem(h, "Agent unavailable"));
  const r = run(ps);
  assert.deepEqual(ids(r.opened), ["name:Agent unavailable"]);
  assert.equal(r.state.incidents[0].title, "Agent unavailable on 3 hosts");
  assert.equal(run(ps.slice(0, 2)).opened.length, 2, "two hosts stay separate");
});

test("groupMin problems on one host are one alert, the worst severity shown", () => {
  const r = run([problem("pve", "cpu", { severity: 3 }), problem("pve", "mem"), problem("pve", "disk", { severity: 5 }), problem("x", "cpu")], EMPTY, { minSeverity: 3 });
  assert.deepEqual(ids(r.opened).length, 2);
  const host = r.state.incidents.find((i) => i.id === "host:h-pve");
  assert.equal(host.title, "pve: 3 problems");
  assert.equal(host.severity, 5);
  assert.equal(r.state.incidents[0].id, "host:h-pve", "worst first");
});

test("an alert is not repeated, and resolves when its problems clear", () => {
  const p = problem("db", "Down");
  const first = run([p]);
  const again = run([p], first.state);
  assert.equal(again.opened.length, 0);
  assert.equal(again.resolved.length, 0);
  const gone = run([], again.state);
  assert.deepEqual(ids(gone.resolved), [`problem:${p.key}`]);
  assert.equal(gone.state.incidents.length, 0);
});

test("a problem moving into a bundle is neither news nor a recovery", () => {
  const a = problem("a", "Agent");
  const b = problem("b", "Agent");
  const one = run([a, b]);
  const c = problem("c", "Agent");
  const two = run([a, b, c], one.state);
  assert.deepEqual(ids(two.opened), ["name:Agent"], "c is new, so the bundle is news");
  const d = run([a, b], (() => run([a, b, c]).state)());
  assert.equal(d.opened.length, 0, "falling out of a bundle into singles is not news");
  assert.equal(d.resolved.length, 0);
});

test("Zabbix not answering alerts after UNREACHABLE_AFTER polls, once, and recovers", () => {
  let s = EMPTY;
  for (let i = 1; i < UNREACHABLE_AFTER; i++) {
    const r = step(s, { ok: false, error: "boom" }, settings(), T);
    assert.equal(r.opened.length, 0);
    s = r.state;
  }
  const down = step(s, { ok: false, error: "boom" }, settings(), T);
  assert.deepEqual(ids(down.opened), ["unreachable"]);
  assert.equal(step(down.state, { ok: false, error: "boom" }, settings(), T).opened.length, 0);
  const back = run([], down.state);
  assert.deepEqual(ids(back.resolved), ["unreachable"]);
});

test("the toast: the worst new alert first, the rest counted", () => {
  const r = run([problem("a", "warn", { severity: 4 }), problem("b", "disaster", { severity: 5 })]);
  const t = toastFor(r);
  assert.equal(t.title, "b: disaster");
  assert.equal(t.tag, "Problem");
  assert.equal(t.more, 1);
  const gone = toastFor(run([], r.state));
  assert.match(gone.title, /resolved$/);
});

test("a stored state survives a round trip, and garbage starts clean", () => {
  const r = run([problem("a", "x"), problem("a", "y", { severity: 1 })]);
  assert.deepEqual(parseState(JSON.parse(JSON.stringify(r.state))), r.state);
  assert.deepEqual(parseState("nope"), EMPTY);
  assert.deepEqual(parseState({ incidents: [{ id: 1 }], quiet: [null] }).incidents, []);
});

test("settings: clamped, the API path dropped, bad addresses refused", () => {
  const s = parseSettings({ url: " https://z.test/api_jsonrpc.php ", interval: 5, minSeverity: 9, groupMin: "x", allowExpiredCert: "yes" });
  assert.equal(s.url, "https://z.test");
  assert.equal(s.interval, 30);
  assert.equal(s.minSeverity, 5);
  assert.equal(s.groupMin, DEFAULTS.groupMin);
  assert.equal(s.allowExpiredCert, false);
  assert.equal(parseSettings({ url: "file:///etc" }).url, "");
});

test("patterns: host/problem, * wildcard, case ignored", () => {
  const m = compilePatterns(["prod-*/disk*", "Agent unavailable"]);
  assert.ok(m("Prod-Api", "Disk full"));
  assert.ok(m("anything", "agent unavailable"));
  assert.ok(!m("Dev-Api", "Disk full"));
});

test("parseProblems reads trigger.get, preferring the event's severity", () => {
  const ps = parseProblems([
    {
      triggerid: "26080",
      description: "/data: Disk space is critically low",
      priority: "4",
      lastchange: "1793703657",
      hosts: [{ hostid: "10546", name: "Prod-Api-02", maintenance_status: "1" }],
      lastEvent: { eventid: "4772238", acknowledged: "1", clock: "1793703657", severity: "5" },
    },
    { triggerid: "1", description: "No event", priority: "2", lastchange: "0", hosts: [], lastEvent: [] },
  ]);
  assert.deepEqual(ps[0], {
    key: "26080",
    name: "/data: Disk space is critically low",
    host: "Prod-Api-02",
    hostId: "10546",
    severity: 5,
    eventId: "4772238",
    since: new Date(1793703657000).toISOString(),
    acknowledged: true,
    maintenance: true,
  });
  assert.equal(ps[1].severity, 2);
  assert.equal(ps[1].eventId, "");
  assert.throws(() => parseProblems({ jsonrpc: "2.0" }), /Not a list/);
});

// --- against a server --------------------------------------------------------

function fakeZabbix(handler, tlsOpts) {
  const seen = [];
  const listener = (req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ path: req.url, auth: req.headers.authorization ?? null, body: JSON.parse(body || "null") });
      const out = handler(seen.at(-1));
      res.writeHead(out.status ?? 200, { "content-type": "application/json" });
      res.end(typeof out.body === "string" ? out.body : JSON.stringify(out.body));
    });
  };
  const server = tlsOpts ? https.createServer(tlsOpts, listener) : http.createServer(listener);
  return new Promise((r) =>
    server.listen(0, "127.0.0.1", () =>
      r({ server, seen, url: `${tlsOpts ? "https" : "http"}://127.0.0.1:${server.address().port}` })
    )
  );
}

const ok = (result) => () => ({ body: { jsonrpc: "2.0", result, id: 1 } });

test("fetchProblems posts trigger.get with the token as a Bearer header", async () => {
  const z = await fakeZabbix(ok([{ triggerid: "7", description: "Down", priority: "5", lastchange: "1", hosts: [{ hostid: "1", name: "db" }] }]));
  try {
    const ps = await fetchProblems(z.url, { token: "t0k" });
    assert.equal(ps[0].name, "Down");
    assert.equal(z.seen[0].path, "/api_jsonrpc.php");
    assert.equal(z.seen[0].auth, "Bearer t0k");
    assert.equal(z.seen[0].body.method, "trigger.get");
    assert.deepEqual(z.seen[0].body.params.filter, { value: 1 });
  } finally {
    z.server.close();
  }
});

test("an API error, an HTTP error or a non-API page is an error, never 'all fine'", async () => {
  const answers = [
    { body: { jsonrpc: "2.0", error: { code: -32602, message: "Invalid params.", data: "Not authorised." }, id: 1 } },
    { status: 502, body: "bad gateway" },
    { body: "<html>login</html>" },
  ];
  const z = await fakeZabbix(() => answers.shift());
  try {
    await assert.rejects(fetchProblems(z.url, { token: "x" }), /Zabbix: Invalid params. Not authorised./);
    await assert.rejects(fetchProblems(z.url, { token: "x" }), /HTTP 502/);
    await assert.rejects(fetchProblems(z.url, { token: "x" }), /Not a Zabbix API answer/);
  } finally {
    z.server.close();
  }
});

test("a server that never answers times out", async () => {
  const server = http.createServer(() => {});
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    await assert.rejects(rpc(`http://127.0.0.1:${server.address().port}`, "x", {}, { token: "", timeoutMs: 200 }), /No answer/);
  } finally {
    server.closeAllConnections();
    server.close();
  }
});

// --- certificates ------------------------------------------------------------

const fx = (n) => fs.readFileSync(path.join(import.meta.dirname, "fixtures", n), "utf-8");
const roots = [fx("ca.pem")];
const tlsServer = (name) => fakeZabbix(ok([]), { key: fx(`${name}.key`), cert: fx(`${name}.pem`) });

test("an expired certificate is refused unless allowed", async () => {
  const z = await tlsServer("expired");
  try {
    await assert.rejects(rpc(z.url, "x", {}, { token: "t", roots }), /expired/);
    assert.deepEqual(await rpc(z.url, "x", {}, { token: "t", roots, allowExpiredCert: true }), []);
    assert.equal(z.seen.length, 1, "the refused attempt sent nothing");
    assert.equal(z.seen[0].auth, "Bearer t");
  } finally {
    z.server.close();
  }
});

test("allowing expiry still checks the name and the root, before the token goes out", async () => {
  for (const [name, why] of [["expired-wrong-name", /ALTNAME|does not match/i], ["expired-untrusted", /trusted root/]]) {
    const z = await tlsServer(name);
    try {
      await assert.rejects(rpc(z.url, "x", {}, { token: "secret", roots, allowExpiredCert: true }), why, name);
      assert.equal(z.seen.length, 0, `${name}: no request reached the server`);
    } finally {
      z.server.close();
    }
  }
});

test("a valid certificate works either way", async () => {
  const z = await tlsServer("valid");
  try {
    assert.deepEqual(await rpc(z.url, "x", {}, { token: "t", roots }), []);
    assert.deepEqual(await rpc(z.url, "x", {}, { token: "t", roots, allowExpiredCert: true }), []);
  } finally {
    z.server.close();
  }
});

// --- Ask Claude --------------------------------------------------------------

test("the Claude command line takes only text the shell reads literally", () => {
  assert.equal(
    claudeCommand("Look into trigger 30977 (event 3651871) on https://zabbix.example.com:8443/api_jsonrpc.php."),
    'claude "Look into trigger 30977 (event 3651871) on https://zabbix.example.com:8443/api_jsonrpc.php."'
  );
  for (const bad of ['say "hi"', "a $HOME", "a `id`", "a \\ b", "wow!", "line\u0007"]) assert.equal(claudeCommand(bad), null, bad);
});
