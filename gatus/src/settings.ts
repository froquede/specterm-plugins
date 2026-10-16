// What the user sets in the panel, and the name patterns the watch and mute
// lists are written in. Pure, so the tests run it without a window or a host.
//
// The host keeps the settings in a file of its own (config.json in its data
// folder), not in the panel's storage: it polls with the panel closed, and the
// panel's storage lives in the window, where the host can't read it.

export interface Settings {
  /** The Gatus server's base address, without a trailing slash. "" = not set. */
  url: string;
  /** Sent as the Authorization header when not "", e.g. "Bearer …". */
  authHeader: string;
  /** Seconds between polls. */
  interval: number;
  /** Failed results in a row before a check alerts. */
  threshold: number;
  /** Failing checks that make one alert instead of one each: the same check
   *  name in this many groups, or this many checks in one group. */
  groupMin: number;
  /** Patterns of checks that alert on their first failed result. */
  watch: string[];
  /** Patterns of checks that never alert and are not listed. */
  mute: string[];
}

export const DEFAULTS: Settings = {
  url: "",
  authHeader: "",
  interval: 60,
  threshold: 3,
  groupMin: 3,
  watch: [],
  mute: [],
};

export const LIMITS = {
  interval: { min: 30, max: 3600 },
  threshold: { min: 1, max: 10 },
  groupMin: { min: 2, max: 100 },
} as const;

const MAX_PATTERNS = 100;
const MAX_PATTERN = 200;

function clamp(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function patterns(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : [];
  const out: string[] = [];
  for (const p of list) {
    if (typeof p !== "string") continue;
    const t = p.trim().slice(0, MAX_PATTERN);
    if (t && !out.includes(t)) out.push(t);
    if (out.length === MAX_PATTERNS) break;
  }
  return out;
}

/** Any value as settings: unknown or broken fields fall back to the defaults,
 *  so a file written by another version never stops the poller. */
export function parseSettings(raw: unknown): Settings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const url = typeof o.url === "string" ? o.url.trim().replace(/\/+$/, "") : "";
  return {
    url: isWebUrl(url) ? url : "",
    authHeader: typeof o.authHeader === "string" ? o.authHeader.trim() : "",
    interval: clamp(o.interval, LIMITS.interval, DEFAULTS.interval),
    threshold: clamp(o.threshold, LIMITS.threshold, DEFAULTS.threshold),
    groupMin: clamp(o.groupMin, LIMITS.groupMin, DEFAULTS.groupMin),
    watch: patterns(o.watch),
    mute: patterns(o.mute),
  };
}

export function isWebUrl(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** A pattern is `group/name`, `*` matching anything, case ignored. Without a
 *  `/` it names a check in any group. */
export function compilePatterns(list: string[]): (group: string, name: string) => boolean {
  const res = list.map((p) => {
    const slash = p.indexOf("/");
    const [g, n] = slash < 0 ? ["*", p] : [p.slice(0, slash), p.slice(slash + 1)];
    return [glob(g.trim()), glob(n.trim())] as const;
  });
  return (group, name) => res.some(([g, n]) => g.test(group) && n.test(name));
}

function glob(p: string): RegExp {
  const body = p
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}$`, "i");
}
