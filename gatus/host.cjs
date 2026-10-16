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

// gatus/src/host.ts
var host_exports = {};
__export(host_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(host_exports);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);

// gatus/src/settings.ts
var DEFAULTS = {
  url: "",
  authHeader: "",
  interval: 60,
  threshold: 3,
  groupMin: 3,
  watch: [],
  mute: []
};
var LIMITS = {
  interval: { min: 30, max: 3600 },
  threshold: { min: 1, max: 10 },
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
  const url = typeof o.url === "string" ? o.url.trim().replace(/\/+$/, "") : "";
  return {
    url: isWebUrl(url) ? url : "",
    authHeader: typeof o.authHeader === "string" ? o.authHeader.trim() : "",
    interval: clamp(o.interval, LIMITS.interval, DEFAULTS.interval),
    threshold: clamp(o.threshold, LIMITS.threshold, DEFAULTS.threshold),
    groupMin: clamp(o.groupMin, LIMITS.groupMin, DEFAULTS.groupMin),
    watch: patterns(o.watch),
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
    const [g, n] = slash < 0 ? ["*", p] : [p.slice(0, slash), p.slice(slash + 1)];
    return [glob(g.trim()), glob(n.trim())];
  });
  return (group, name) => res.some(([g, n]) => g.test(group) && n.test(name));
}
function glob(p) {
  const body = p.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${body}$`, "i");
}

// gatus/src/engine.ts
var EMPTY = { incidents: [], quiet: [], checks: 0, failures: 0, lastPoll: null, lastError: null };
var UNREACHABLE_AFTER = 3;
var MAX_QUIET = 200;
function label(c) {
  return c.group ? `${c.group} / ${c.name}` : c.name;
}
function bundle(failing, groupMin) {
  const out = [];
  let left = failing;
  const byName = groupBy(left, (c) => c.name);
  for (const [name, checks] of byName) {
    if (new Set(checks.map((c) => c.group)).size < groupMin) continue;
    const groups = new Set(checks.map((c) => c.group)).size;
    out.push({ id: `name:${name}`, kind: "name", subject: name, title: `${name} failing in ${groups} groups`, checks });
  }
  const named = new Set(out.flatMap((i) => i.checks.map((c) => c.key)));
  left = left.filter((c) => !named.has(c.key));
  const byGroup = groupBy(left, (c) => c.group);
  const grouped = /* @__PURE__ */ new Set();
  for (const [group, checks] of byGroup) {
    if (!group || checks.length < groupMin) continue;
    out.push({ id: `group:${group}`, kind: "group", subject: group, title: `${group}: ${checks.length} checks failing`, checks });
    for (const c of checks) grouped.add(c.key);
  }
  for (const c of left) {
    if (grouped.has(c.key)) continue;
    out.push({ id: `check:${c.key}`, kind: "check", subject: label(c), title: `${label(c)} failing`, checks: [c] });
  }
  return out;
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
function failed(results, n) {
  if (results.length < n) return false;
  return results.slice(-n).every((r) => !r.success);
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
      subject: "Status page",
      title: "Status page unreachable",
      checks: [],
      since: now
    };
    state.incidents = [...prev.incidents, down];
    return { state, opened: [down], resolved: [] };
  }
  const muted = compilePatterns(settings.mute);
  const watched = compilePatterns(settings.watch);
  const failing = [];
  const quiet = [];
  for (const s of outcome.statuses) {
    if (muted(s.group, s.name)) continue;
    const c = { key: s.key, name: s.name, group: s.group };
    const n = watched(s.group, s.name) ? 1 : settings.threshold;
    if (failed(s.results, n)) failing.push(c);
    else if (failed(s.results, 1) && quiet.length < MAX_QUIET) quiet.push(c);
  }
  const alerted = /* @__PURE__ */ new Map();
  for (const i of prev.incidents) for (const c of i.checks) alerted.set(c.key, i.since);
  const failingKeys = new Set(failing.map((c) => c.key));
  const incidents = bundle(failing, settings.groupMin).map((i) => {
    const kept = prevById.get(i.id)?.since;
    const earlier = i.checks.map((c) => alerted.get(c.key)).filter((s) => !!s).sort()[0];
    return { ...i, since: kept ?? earlier ?? now };
  });
  const opened = incidents.filter((i) => !prevById.has(i.id) && i.checks.some((c) => !alerted.has(c.key)));
  const resolved = prev.incidents.filter(
    (i) => i.kind === "unreachable" || !incidents.some((n) => n.id === i.id) && !i.checks.some((c) => failingKeys.has(c.key))
  );
  return {
    state: { incidents, quiet, checks: outcome.statuses.length, failures: 0, lastPoll: now, lastError: null },
    opened,
    resolved
  };
}
function toastFor({ opened, resolved }) {
  const [first, ...rest] = opened.length ? opened : resolved;
  if (!first) return null;
  const isNew = opened.length > 0;
  const shown = first.checks.slice(0, 3).map(label);
  const extra = first.checks.length - shown.length;
  return {
    title: isNew ? first.title : `${first.subject} recovered`,
    tag: isNew ? "Down" : "Recovered",
    body: shown.length ? shown.join(", ") + (extra > 0 ? ` and ${extra} more` : "") : void 0,
    more: rest.length || void 0,
    payload: { incident: first.id }
  };
}
function parseState(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const checkList = (v) => Array.isArray(v) ? v.filter(
    (c) => !!c && typeof c.key === "string" && typeof c.name === "string" && typeof c.group === "string"
  ) : [];
  const kinds = ["name", "group", "check", "unreachable"];
  const incidents = Array.isArray(o.incidents) ? o.incidents.filter(
    (i) => !!i && typeof i.id === "string" && kinds.includes(i.kind) && typeof i.subject === "string" && typeof i.title === "string" && typeof i.since === "string"
  ).map((i) => ({ id: i.id, kind: i.kind, subject: i.subject, title: i.title, since: i.since, checks: checkList(i.checks) })) : [];
  const str = (v) => typeof v === "string" ? v : null;
  const num = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  return {
    incidents,
    quiet: checkList(o.quiet),
    checks: num(o.checks),
    failures: num(o.failures),
    lastPoll: str(o.lastPoll),
    lastError: str(o.lastError)
  };
}

// gatus/src/gatus.ts
var TIMEOUT_MS = 2e4;
async function fetchStatuses(baseUrl, { pageSize, authHeader = "", fetchImpl = fetch, timeoutMs = TIMEOUT_MS }) {
  const url = `${baseUrl}/api/v1/endpoints/statuses?page=1&pageSize=${pageSize}`;
  const headers = { accept: "application/json" };
  if (authHeader) headers.authorization = authHeader;
  const res = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${baseUrl}`);
  return parseStatuses(await res.json());
}
function parseStatuses(raw) {
  if (!Array.isArray(raw)) throw new Error("Not a Gatus status list");
  const out = [];
  for (const e of raw) {
    if (!e || typeof e.key !== "string" || typeof e.name !== "string") continue;
    const results = Array.isArray(e.results) ? e.results.filter((r) => !!r && typeof r.success === "boolean").map((r) => ({ success: r.success, timestamp: String(r.timestamp ?? "") })) : [];
    out.push({ key: e.key, name: e.name, group: typeof e.group === "string" ? e.group : "", results });
  }
  if (raw.length > 0 && out.length === 0) throw new Error("Not a Gatus status list");
  return out;
}

// gatus/src/host.ts
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
    const { authHeader, ...rest } = settings;
    return { ...rest, hasAuth: authHeader !== "" };
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
    const p = fetchStatuses(asked.url, { pageSize: asked.threshold, authHeader: asked.authHeader }).then(
      (statuses) => ({ ok: true, statuses }),
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
    if (typeof patch?.authHeader !== "string") merged.authHeader = settings.authHeader;
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
