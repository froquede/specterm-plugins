// What is worth an alert, from one poll of Gatus. Pure: the host feeds it each
// poll's outcome and the state it kept, and gets back the new state and what
// changed, so the tests run every rule without a server or a clock.
//
// A check is failing when its last `threshold` results all failed, or only its
// last one for a check on the watch list. Failing checks are then bundled, so
// one outage is one alert: the same check name failing in `groupMin` groups or
// more, then a group with `groupMin` failing checks or more, then each check
// left on its own.

import { type Settings, compilePatterns } from "./settings.ts";

export interface Result {
  success: boolean;
  timestamp: string;
}

/** One check as Gatus reports it, oldest result first. */
export interface EndpointStatus {
  key: string;
  name: string;
  group: string;
  results: Result[];
}

export interface Check {
  key: string;
  name: string;
  group: string;
}

export type IncidentKind = "name" | "group" | "check" | "unreachable";

export interface Incident {
  id: string;
  kind: IncidentKind;
  /** What is down: a check name, a group, one check, or the status page. */
  subject: string;
  title: string;
  checks: Check[];
  /** When this plugin first alerted on any of its checks. */
  since: string;
}

export interface State {
  incidents: Incident[];
  /** Failing on their last result but not alerted: below the threshold. */
  quiet: Check[];
  checks: number;
  /** Polls in a row that got no answer. */
  failures: number;
  lastPoll: string | null;
  lastError: string | null;
}

export const EMPTY: State = { incidents: [], quiet: [], checks: 0, failures: 0, lastPoll: null, lastError: null };

/** Polls in a row without an answer before the status page itself alerts. */
export const UNREACHABLE_AFTER = 3;
const MAX_QUIET = 200;

export type Outcome = { ok: true; statuses: EndpointStatus[] } | { ok: false; error: string };

export interface Step {
  state: State;
  opened: Incident[];
  resolved: Incident[];
}

export function label(c: Check): string {
  return c.group ? `${c.group} / ${c.name}` : c.name;
}

/** Bundles failing checks into incidents, in the order the header describes. */
export function bundle(failing: Check[], groupMin: number): Omit<Incident, "since">[] {
  const out: Omit<Incident, "since">[] = [];
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
  const grouped = new Set<string>();
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

function groupBy<T>(list: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const t of list) {
    const k = key(t);
    const l = m.get(k);
    if (l) l.push(t);
    else m.set(k, [t]);
  }
  return m;
}

function failed(results: Result[], n: number): boolean {
  if (results.length < n) return false;
  return results.slice(-n).every((r) => !r.success);
}

export function step(prev: State, outcome: Outcome, settings: Settings, now: string): Step {
  const prevById = new Map(prev.incidents.map((i) => [i.id, i]));

  if (!outcome.ok) {
    const failures = prev.failures + 1;
    const state: State = { ...prev, failures, lastError: outcome.error };
    if (failures < UNREACHABLE_AFTER || prevById.has("unreachable")) return { state, opened: [], resolved: [] };
    const down: Incident = {
      id: "unreachable",
      kind: "unreachable",
      subject: "Status page",
      title: "Status page unreachable",
      checks: [],
      since: now,
    };
    state.incidents = [...prev.incidents, down];
    return { state, opened: [down], resolved: [] };
  }

  const muted = compilePatterns(settings.mute);
  const watched = compilePatterns(settings.watch);
  const failing: Check[] = [];
  const quiet: Check[] = [];
  for (const s of outcome.statuses) {
    if (muted(s.group, s.name)) continue;
    const c = { key: s.key, name: s.name, group: s.group };
    const n = watched(s.group, s.name) ? 1 : settings.threshold;
    if (failed(s.results, n)) failing.push(c);
    else if (failed(s.results, 1) && quiet.length < MAX_QUIET) quiet.push(c);
  }

  // A check already alerted on stays alerted while it fails, whatever incident
  // it lands in now: moving between bundles is neither news nor a recovery.
  const alerted = new Map<string, string>();
  for (const i of prev.incidents) for (const c of i.checks) alerted.set(c.key, i.since);
  const failingKeys = new Set(failing.map((c) => c.key));

  const incidents: Incident[] = bundle(failing, settings.groupMin).map((i) => {
    const kept = prevById.get(i.id)?.since;
    const earlier = i.checks.map((c) => alerted.get(c.key)).filter((s): s is string => !!s).sort()[0];
    return { ...i, since: kept ?? earlier ?? now };
  });

  const opened = incidents.filter((i) => !prevById.has(i.id) && i.checks.some((c) => !alerted.has(c.key)));
  const resolved = prev.incidents.filter(
    (i) => i.kind === "unreachable" || (!incidents.some((n) => n.id === i.id) && !i.checks.some((c) => failingKeys.has(c.key)))
  );

  return {
    state: { incidents, quiet, checks: outcome.statuses.length, failures: 0, lastPoll: now, lastError: null },
    opened,
    resolved,
  };
}

export interface Toast {
  title: string;
  tag: string;
  body?: string;
  more?: number;
  payload?: unknown;
}

/** The one toast a poll shows: a new alert wins over a recovery, and the rest
 *  of either is counted in `more` (a toast replaces the one before it). */
export function toastFor({ opened, resolved }: Pick<Step, "opened" | "resolved">): Toast | null {
  const [first, ...rest] = opened.length ? opened : resolved;
  if (!first) return null;
  const isNew = opened.length > 0;
  const shown = first.checks.slice(0, 3).map(label);
  const extra = first.checks.length - shown.length;
  return {
    title: isNew ? first.title : `${first.subject} recovered`,
    tag: isNew ? "Down" : "Recovered",
    body: shown.length ? shown.join(", ") + (extra > 0 ? ` and ${extra} more` : "") : undefined,
    more: rest.length || undefined,
    payload: { incident: first.id },
  };
}

/** A stored state, checked field by field: a broken file starts clean. */
export function parseState(raw: unknown): State {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const checkList = (v: unknown): Check[] =>
    Array.isArray(v)
      ? v.filter(
          (c): c is Check =>
            !!c && typeof c.key === "string" && typeof c.name === "string" && typeof c.group === "string"
        )
      : [];
  const kinds: IncidentKind[] = ["name", "group", "check", "unreachable"];
  const incidents = Array.isArray(o.incidents)
    ? o.incidents
        .filter(
          (i) =>
            !!i &&
            typeof i.id === "string" &&
            kinds.includes(i.kind) &&
            typeof i.subject === "string" &&
            typeof i.title === "string" &&
            typeof i.since === "string"
        )
        .map((i) => ({ id: i.id, kind: i.kind, subject: i.subject, title: i.title, since: i.since, checks: checkList(i.checks) }))
    : [];
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  return {
    incidents,
    quiet: checkList(o.quiet),
    checks: num(o.checks),
    failures: num(o.failures),
    lastPoll: str(o.lastPoll),
    lastError: str(o.lastError),
  };
}
