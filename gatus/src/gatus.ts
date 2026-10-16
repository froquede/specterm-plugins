// One read of a Gatus server: every check with its last few results.
//
// `pageSize` limits the results per check, not the number of checks, so one
// request still returns them all. Asking for exactly `threshold` results keeps
// the answer small (a status page with ~1,200 checks: ~300 KB at 1 result,
// 7.5 MB with Gatus's default) and is all the rules need.

import type { EndpointStatus, Result } from "./engine.ts";

export const TIMEOUT_MS = 20_000;

export async function fetchStatuses(
  baseUrl: string,
  { pageSize, authHeader = "", fetchImpl = fetch, timeoutMs = TIMEOUT_MS }: {
    pageSize: number;
    authHeader?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  }
): Promise<EndpointStatus[]> {
  const url = `${baseUrl}/api/v1/endpoints/statuses?page=1&pageSize=${pageSize}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (authHeader) headers.authorization = authHeader;
  const res = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${baseUrl}`);
  return parseStatuses(await res.json());
}

/** Gatus's answer, keeping only what the rules read. Anything that is not a
 *  list of checks is an error, so a wrong address doesn't read as "all fine". */
export function parseStatuses(raw: unknown): EndpointStatus[] {
  if (!Array.isArray(raw)) throw new Error("Not a Gatus status list");
  const out: EndpointStatus[] = [];
  for (const e of raw) {
    if (!e || typeof e.key !== "string" || typeof e.name !== "string") continue;
    const results: Result[] = Array.isArray(e.results)
      ? e.results
          .filter((r: unknown) => !!r && typeof (r as Result).success === "boolean")
          .map((r: Result) => ({ success: r.success, timestamp: String(r.timestamp ?? "") }))
      : [];
    out.push({ key: e.key, name: e.name, group: typeof e.group === "string" ? e.group : "", results });
  }
  if (raw.length > 0 && out.length === 0) throw new Error("Not a Gatus status list");
  return out;
}
