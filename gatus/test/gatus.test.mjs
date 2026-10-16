// The alert rules (src/engine.ts), the settings (src/settings.ts) and the read
// of a Gatus server (src/gatus.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { EMPTY, UNREACHABLE_AFTER, parseState, step, toastFor } from "../src/engine.ts";
import { fetchStatuses, parseStatuses } from "../src/gatus.ts";
import { DEFAULTS, compilePatterns, parseSettings } from "../src/settings.ts";

const T = "2026-10-16T12:00:00Z";
const ok = { success: true, timestamp: T };
const bad = { success: false, timestamp: T };
/** A check whose last results are `pattern`, oldest first: "x" failed, "." passed. */
const check = (group, name, pattern) => ({
  key: `${group}_${name}`,
  name,
  group,
  results: [...pattern].map((c) => (c === "x" ? bad : ok)),
});
const settings = (over = {}) => ({ ...DEFAULTS, url: "https://status.test", ...over });
const run = (statuses, prev = EMPTY, over = {}, now = T) => step(prev, { ok: true, statuses }, settings(over), now);
const ids = (list) => list.map((i) => i.id).sort();

test("a check alerts only after `threshold` failures in a row", () => {
  assert.deepEqual(run([check("a", "api", ".xx")]).opened, []);
  const r = run([check("a", "api", "xxx")]);
  assert.deepEqual(ids(r.opened), ["check:a_api"]);
  assert.equal(r.state.incidents[0].title, "a / api failing");
  assert.equal(run([check("a", "api", "xx")]).opened.length, 0, "fewer results than the threshold");
});

test("below the threshold a failing check is listed as quiet, not alerted", () => {
  const r = run([check("a", "api", "..x"), check("a", "web", "...")]);
  assert.deepEqual(r.state.quiet.map((c) => c.key), ["a_api"]);
  assert.equal(r.state.incidents.length, 0);
});

test("a watched check alerts on its first failure", () => {
  const r = run([check("infra", "db", "..x"), check("a", "api", "..x")], EMPTY, { watch: ["infra/*"] });
  assert.deepEqual(ids(r.opened), ["check:infra_db"]);
});

test("a muted check never alerts and is not listed", () => {
  const r = run([check("a", "nightly-sync", "xxx")], EMPTY, { mute: ["nightly-*"] });
  assert.equal(r.state.incidents.length, 0);
  assert.equal(r.state.quiet.length, 0);
});

test("the same check name failing in groupMin groups is one alert", () => {
  const statuses = ["a", "b", "c"].map((g) => check(g, "API", "xxx"));
  const r = run(statuses);
  assert.deepEqual(ids(r.opened), ["name:API"]);
  assert.equal(r.state.incidents[0].title, "API failing in 3 groups");
  assert.equal(run(statuses.slice(0, 2)).opened.length, 2, "two groups stay separate");
});

test("groupMin failing checks in one group are one alert", () => {
  const r = run([check("t", "api", "xxx"), check("t", "web", "xxx"), check("t", "db", "xxx"), check("u", "api", "xxx")]);
  assert.deepEqual(ids(r.opened), ["check:u_api", "group:t"]);
  assert.equal(r.state.incidents.find((i) => i.id === "group:t").title, "t: 3 checks failing");
});

test("a growing incident doesn't alert again; a still-failing check moving to a bundle doesn't either", () => {
  const first = run(["a", "b", "c"].map((g) => check(g, "API", "xxx")));
  const grown = run(["a", "b", "c", "d"].map((g) => check(g, "API", "xxx")), first.state);
  assert.deepEqual(grown.opened, []);
  assert.equal(grown.state.incidents[0].checks.length, 4);

  const one = run([check("t", "api", "xxx")]);
  const bundled = run([check("t", "api", "xxx"), check("t", "web", "xxx"), check("t", "db", "xxx")], one.state);
  assert.deepEqual(ids(bundled.opened), ["group:t"], "new checks in it: news");
  assert.deepEqual(bundled.resolved, [], "the old check is still down");
  const shrunk = run([check("t", "api", "xxx"), check("t", "web", "..."), check("t", "db", "...")], bundled.state);
  assert.deepEqual(shrunk.opened, [], "only checks already alerted on");
  assert.deepEqual(shrunk.resolved, [], "and one of them is still down");
  assert.equal(shrunk.state.incidents[0].since, one.state.incidents[0].since);
});

test("an incident resolves when all its checks pass, with one recovery toast", () => {
  const down = run([check("a", "api", "xxx")]);
  const up = run([check("a", "api", "xx.")], down.state);
  assert.deepEqual(ids(up.resolved), ["check:a_api"]);
  assert.equal(up.state.incidents.length, 0);
  const t = toastFor(up);
  assert.equal(t.title, "a / api recovered");
  assert.equal(t.tag, "Recovered");
});

test("a restart from the saved state doesn't alert again", () => {
  const down = run([check("a", "api", "xxx")]);
  const saved = parseState(JSON.parse(JSON.stringify(down.state)));
  const again = run([check("a", "api", "xxx")], saved);
  assert.deepEqual(again.opened, []);
  assert.deepEqual(again.resolved, []);
});

test("the status page alerts after UNREACHABLE_AFTER failed polls, once, and recovers", () => {
  let s = run([check("a", "api", "xxx")]).state;
  let r;
  for (let i = 0; i < UNREACHABLE_AFTER; i++) {
    r = step(s, { ok: false, error: "timeout" }, settings(), T);
    assert.equal(r.opened.length, i === UNREACHABLE_AFTER - 1 ? 1 : 0);
    s = r.state;
  }
  assert.equal(r.opened[0].id, "unreachable");
  assert.deepEqual(ids(s.incidents), ["check:a_api", "unreachable"], "what was down stays down meanwhile");
  assert.equal(step(s, { ok: false, error: "timeout" }, settings(), T).opened.length, 0, "only once");
  const back = run([check("a", "api", "xxx")], s);
  assert.deepEqual(ids(back.resolved), ["unreachable"]);
  assert.deepEqual(back.opened, []);
  assert.equal(back.state.failures, 0);
});

test("one toast per poll: a new alert wins, the rest is counted", () => {
  const r = run([check("a", "api", "xxx"), check("b", "web", "xxx")]);
  const t = toastFor(r);
  assert.equal(t.tag, "Down");
  assert.equal(t.more, 1);
  assert.deepEqual(t.payload, { incident: r.opened[0].id });
  assert.equal(toastFor({ opened: [], resolved: [] }), null);
  const many = run(["a", "b", "c", "d", "e"].map((g) => check(g, "API", "xxx")));
  assert.equal(toastFor(many).body, "a / API, b / API, c / API and 2 more");
});

test("patterns: group/name with *, case ignored; no slash means any group", () => {
  const m = compilePatterns(["infra/*", "*/API Gerencial", "db-?"]);
  assert.ok(m("INFRA", "anything"));
  assert.ok(m("abs", "api gerencial"));
  assert.ok(!m("abs", "API"));
  assert.ok(m("x", "db-?"), "only * is special");
  assert.ok(!m("x", "db-1"));
});

test("settings are clamped and cleaned", () => {
  assert.deepEqual(parseSettings(undefined), DEFAULTS);
  const s = parseSettings({ url: "https://s.test///", interval: 1, threshold: 99, groupMin: 0, watch: "a\n a \n\nb", mute: [1, "x"] });
  assert.equal(s.url, "https://s.test");
  assert.equal(s.interval, 30);
  assert.equal(s.threshold, 10);
  assert.equal(s.groupMin, 2);
  assert.deepEqual(s.watch, ["a", "b"]);
  assert.deepEqual(s.mute, ["x"]);
  assert.equal(parseSettings({ url: "file:///etc" }).url, "");
});

test("parseStatuses keeps what the rules read and refuses what isn't Gatus", () => {
  const out = parseStatuses([{ key: "k", name: "n", results: [{ success: false, timestamp: T, status: 500 }] }]);
  assert.deepEqual(out, [{ key: "k", name: "n", group: "", results: [{ success: false, timestamp: T }] }]);
  assert.throws(() => parseStatuses({ error: "x" }));
  assert.throws(() => parseStatuses([{ foo: 1 }]));
  assert.deepEqual(parseStatuses([]), []);
});

test("fetchStatuses asks for `pageSize` results and sends the auth header", async () => {
  let seen;
  const server = http.createServer((req, res) => {
    seen = { url: req.url, auth: req.headers.authorization };
    if (req.url.includes("pageSize=9")) {
      res.writeHead(500).end();
      return;
    }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify([check("g", "n", "x")]));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const list = await fetchStatuses(base, { pageSize: 3, authHeader: "Bearer t" });
    assert.equal(seen.url, "/api/v1/endpoints/statuses?page=1&pageSize=3");
    assert.equal(seen.auth, "Bearer t");
    assert.equal(list[0].results[0].success, false);
    await assert.rejects(fetchStatuses(base, { pageSize: 9 }), /HTTP 500/);
  } finally {
    server.close();
  }
});
