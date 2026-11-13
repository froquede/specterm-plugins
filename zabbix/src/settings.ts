// What the user sets in the panel, and the `host/problem` patterns the mute
// list is written in. Pure, so the tests run it without a window or a host.
//
// The host keeps the settings in a file of its own (config.json in its data
// folder), not in the panel's storage: it polls with the panel closed, and the
// panel's storage lives in the window, where the host can't read it.

export interface Settings {
  /** The Zabbix frontend's base address, without a trailing slash, e.g.
   *  https://zabbix.example.com. "" = not set. */
  url: string;
  /** An API token (Users → API tokens), sent as `Authorization: Bearer`. */
  token: string;
  /** Seconds between polls. */
  interval: number;
  /** Lowest severity that alerts: 0 Not classified … 5 Disaster. */
  minSeverity: number;
  /** Problems that make one alert instead of one each: the same problem on
   *  this many hosts, or this many problems on one host. */
  groupMin: number;
  /** Acknowledged problems alert too, instead of being listed apart. */
  alertAcknowledged: boolean;
  /** Accept the server's certificate when its only fault is having expired:
   *  the chain and the host name are still checked. */
  allowExpiredCert: boolean;
  /** Patterns of problems that never alert and are not listed. */
  mute: string[];
}

export const DEFAULTS: Settings = {
  url: "",
  token: "",
  interval: 60,
  minSeverity: 4,
  groupMin: 3,
  alertAcknowledged: false,
  allowExpiredCert: false,
  mute: [],
};

export const LIMITS = {
  interval: { min: 30, max: 3600 },
  minSeverity: { min: 0, max: 5 },
  groupMin: { min: 2, max: 100 },
} as const;

export const SEVERITIES = ["Not classified", "Information", "Warning", "Average", "High", "Disaster"] as const;

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
  const url = typeof o.url === "string" ? o.url.trim().replace(/\/+$/, "").replace(/\/api_jsonrpc\.php$/, "") : "";
  return {
    url: isWebUrl(url) ? url : "",
    token: typeof o.token === "string" ? o.token.trim() : "",
    interval: clamp(o.interval, LIMITS.interval, DEFAULTS.interval),
    minSeverity: clamp(o.minSeverity, LIMITS.minSeverity, DEFAULTS.minSeverity),
    groupMin: clamp(o.groupMin, LIMITS.groupMin, DEFAULTS.groupMin),
    alertAcknowledged: o.alertAcknowledged === true,
    allowExpiredCert: o.allowExpiredCert === true,
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

/** A pattern is `host/problem`, `*` matching anything, case ignored. Without
 *  a `/` it names a problem on any host. */
export function compilePatterns(list: string[]): (host: string, name: string) => boolean {
  const res = list.map((p) => {
    const slash = p.indexOf("/");
    const [h, n] = slash < 0 ? ["*", p] : [p.slice(0, slash), p.slice(slash + 1)];
    return [glob(h.trim()), glob(n.trim())] as const;
  });
  return (host, name) => res.some(([h, n]) => h.test(host) && n.test(name));
}

function glob(p: string): RegExp {
  const body = p
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}$`, "i");
}
