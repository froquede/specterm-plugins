// What is worth an alert, from one poll of Zabbix. Pure: the host feeds it
// each poll's outcome and the state it kept, and gets back the new state and
// what changed, so the tests run every rule without a server or a clock.
//
// Zabbix already decides when something is a problem (each trigger has its own
// timing), so there is no "N failures in a row" here: a problem at or above the
// minimum severity, on a host not in maintenance, not muted and (by default)
// not acknowledged, alerts. Problems are then bundled, so one outage is one
// alert: the same problem on `groupMin` hosts or more, then a host with
// `groupMin` problems or more, then each problem left on its own.

import { type Settings, compilePatterns } from "./settings.ts";

/** One active problem, as read from Zabbix. */
export interface Problem {
  /** The trigger's id. */
  key: string;
  /** The problem's text, with macros expanded. */
  name: string;
  /** The host's visible name (the first, for a trigger on several). */
  host: string;
  hostId: string;
  /** 0 Not classified … 5 Disaster, as the latest event has it. */
  severity: number;
  /** The latest problem event, for a link and for Claude to read. */
  eventId: string;
  /** When it started, ISO. */
  since: string;
  acknowledged: boolean;
  /** The host is in maintenance. */
  maintenance: boolean;
}

export type IncidentKind = "name" | "host" | "problem" | "unreachable";

export interface Incident {
  id: string;
  kind: IncidentKind;
  /** What is down: a problem, a host, one problem on one host, or Zabbix. */
  subject: string;
  title: string;
  problems: Problem[];
  /** The highest severity among its problems; -1 for Zabbix unreachable. */
  severity: number;
  /** When this plugin first alerted on any of its problems. */
  since: string;
}

export interface State {
  incidents: Incident[];
  /** Active but not alerted: acknowledged, in maintenance, or below the
   *  minimum severity. Muted ones are not here. */
  quiet: Problem[];
  /** Active problems read, all severities. */
  total: number;
  /** Polls in a row that got no answer. */
  failures: number;
  lastPoll: string | null;
  lastError: string | null;
}

export const EMPTY: State = { incidents: [], quiet: [], total: 0, failures: 0, lastPoll: null, lastError: null };

/** Polls in a row without an answer before Zabbix itself alerts. */
export const UNREACHABLE_AFTER = 3;
const MAX_QUIET = 200;

export type Outcome = { ok: true; problems: Problem[] } | { ok: false; error: string };

export interface Step {
  state: State;
  opened: Incident[];
  resolved: Incident[];
}

export function label(p: Problem): string {
  return `${p.host}: ${p.name}`;
}

const maxSeverity = (list: Problem[]) => Math.max(...list.map((p) => p.severity));

/** Bundles alerting problems into incidents, in the order the header says. */
export function bundle(alerting: Problem[], groupMin: number): Omit<Incident, "since">[] {
  const out: Omit<Incident, "since">[] = [];

  for (const [name, problems] of groupBy(alerting, (p) => p.name)) {
    const hosts = new Set(problems.map((p) => p.hostId)).size;
    if (hosts < groupMin) continue;
    out.push({ id: `name:${name}`, kind: "name", subject: name, title: `${name} on ${hosts} hosts`, problems, severity: maxSeverity(problems) });
  }
  const named = new Set(out.flatMap((i) => i.problems.map((p) => p.key)));
  const left = alerting.filter((p) => !named.has(p.key));

  const onHost = new Set<string>();
  for (const [, problems] of groupBy(left, (p) => p.hostId)) {
    if (problems.length < groupMin) continue;
    const host = problems[0].host;
    out.push({
      id: `host:${problems[0].hostId}`,
      kind: "host",
      subject: host,
      title: `${host}: ${problems.length} problems`,
      problems,
      severity: maxSeverity(problems),
    });
    for (const p of problems) onHost.add(p.key);
  }

  for (const p of left) {
    if (onHost.has(p.key)) continue;
    out.push({ id: `problem:${p.key}`, kind: "problem", subject: label(p), title: label(p), problems: [p], severity: p.severity });
  }
  return out.sort((a, b) => b.severity - a.severity);
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

export function step(prev: State, outcome: Outcome, settings: Settings, now: string): Step {
  const prevById = new Map(prev.incidents.map((i) => [i.id, i]));

  if (!outcome.ok) {
    const failures = prev.failures + 1;
    const state: State = { ...prev, failures, lastError: outcome.error };
    if (failures < UNREACHABLE_AFTER || prevById.has("unreachable")) return { state, opened: [], resolved: [] };
    const down: Incident = {
      id: "unreachable",
      kind: "unreachable",
      subject: "Zabbix",
      title: "Zabbix unreachable",
      problems: [],
      severity: -1,
      since: now,
    };
    state.incidents = [...prev.incidents, down];
    return { state, opened: [down], resolved: [] };
  }

  const muted = compilePatterns(settings.mute);
  const alerting: Problem[] = [];
  const quiet: Problem[] = [];
  for (const p of outcome.problems) {
    if (muted(p.host, p.name)) continue;
    const loud =
      p.severity >= settings.minSeverity && !p.maintenance && (settings.alertAcknowledged || !p.acknowledged);
    if (loud) alerting.push(p);
    else if (quiet.length < MAX_QUIET) quiet.push(p);
  }
  quiet.sort((a, b) => b.severity - a.severity);

  // A problem already alerted on stays alerted while it is active, whatever
  // incident it lands in now: moving between bundles is neither news nor a
  // recovery.
  const alerted = new Map<string, string>();
  for (const i of prev.incidents) for (const p of i.problems) alerted.set(p.key, i.since);
  const alertingKeys = new Set(alerting.map((p) => p.key));

  const incidents: Incident[] = bundle(alerting, settings.groupMin).map((i) => {
    const kept = prevById.get(i.id)?.since;
    const earlier = i.problems.map((p) => alerted.get(p.key)).filter((s): s is string => !!s).sort()[0];
    return { ...i, since: kept ?? earlier ?? now };
  });

  const opened = incidents.filter((i) => !prevById.has(i.id) && i.problems.some((p) => !alerted.has(p.key)));
  const resolved = prev.incidents.filter(
    (i) =>
      i.kind === "unreachable" ||
      (!incidents.some((n) => n.id === i.id) && !i.problems.some((p) => alertingKeys.has(p.key)))
  );

  return {
    state: { incidents, quiet, total: outcome.problems.length, failures: 0, lastPoll: now, lastError: null },
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
  const [first, ...rest] = opened.length ? [...opened].sort((a, b) => b.severity - a.severity) : resolved;
  if (!first) return null;
  const isNew = opened.length > 0;
  const shown = first.kind === "problem" ? [] : first.problems.slice(0, 3).map(label);
  const extra = first.problems.length - shown.length;
  return {
    title: isNew ? first.title : `${first.subject} resolved`,
    tag: isNew ? "Problem" : "Resolved",
    body: shown.length ? shown.join(", ") + (extra > 0 ? ` and ${extra} more` : "") : undefined,
    more: rest.length || undefined,
    payload: { incident: first.id },
  };
}

/** A stored state, checked field by field: a broken file starts clean. */
export function parseState(raw: unknown): State {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  const problemList = (v: unknown): Problem[] =>
    Array.isArray(v)
      ? v.filter(
          (p): p is Problem =>
            !!p &&
            typeof p.key === "string" &&
            typeof p.name === "string" &&
            typeof p.host === "string" &&
            typeof p.hostId === "string" &&
            typeof p.severity === "number" &&
            typeof p.eventId === "string" &&
            typeof p.since === "string"
        ).map((p) => ({ ...p, acknowledged: p.acknowledged === true, maintenance: p.maintenance === true }))
      : [];
  const kinds: IncidentKind[] = ["name", "host", "problem", "unreachable"];
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
        .map((i) => ({
          id: i.id,
          kind: i.kind,
          subject: i.subject,
          title: i.title,
          since: i.since,
          severity: typeof i.severity === "number" ? i.severity : -1,
          problems: problemList(i.problems),
        }))
    : [];
  return {
    incidents,
    quiet: problemList(o.quiet),
    total: num(o.total),
    failures: num(o.failures),
    lastPoll: str(o.lastPoll),
    lastError: str(o.lastError),
  };
}
