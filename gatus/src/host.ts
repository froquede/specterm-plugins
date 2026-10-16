// The Gatus plugin's host side, run in Specterm's plugin host process from
// launch ("activation": "startup"), so it polls with the panel closed. It owns
// the settings (config.json, readable only by the user since it can hold an
// Authorization header) and what is down (state.json, so a restart doesn't
// alert again on what was already alerted). Alerts are the tab-bar badge, the
// number of open incidents, and one toast per poll that opened or closed one.

import fs from "node:fs";
import path from "node:path";
import type { PluginHostContext } from "../../shared/specterm-plugin-api.ts";
import { EMPTY, type State, parseState, step, toastFor } from "./engine.ts";
import { fetchStatuses } from "./gatus.ts";
import { type Settings, parseSettings } from "./settings.ts";

/** The settings as the panel sees them: the header's value never leaves. */
export type PublicSettings = Omit<Settings, "authHeader"> & { hasAuth: boolean };

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return undefined;
  }
}

function writeJson(file: string, value: unknown, mode = 0o644) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { mode });
  fs.renameSync(tmp, file);
}

export function activate(ctx: PluginHostContext) {
  fs.mkdirSync(ctx.storagePath, { recursive: true });
  const configFile = path.join(ctx.storagePath, "config.json");
  const stateFile = path.join(ctx.storagePath, "state.json");

  let settings = parseSettings(readJson(configFile));
  let state: State = parseState(readJson(stateFile));
  let timer: unknown = null;
  let inFlight: Promise<void> | null = null;

  const publicSettings = (): PublicSettings => {
    const { authHeader, ...rest } = settings;
    return { ...rest, hasAuth: authHeader !== "" };
  };
  const snapshot = () => ({ ...state, configured: settings.url !== "", url: settings.url });

  const publish = () => {
    ctx.setBadge(state.incidents.length || null);
    ctx.emit("changed", snapshot());
  };

  const poll = (): Promise<void> => {
    if (!settings.url) return Promise.resolve();
    if (inFlight) return inFlight;
    const asked = settings;
    const p: Promise<void> = fetchStatuses(asked.url, { pageSize: asked.threshold, authHeader: asked.authHeader })
      .then(
        (statuses) => ({ ok: true as const, statuses }),
        (err) => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) })
      )
      .then((outcome) => {
        // Settings changed while this poll was out: its answer is for the old
        // server or rules, and the poll the change started is the one to keep.
        if (asked !== settings) return;
        const next = step(state, outcome, settings, new Date().toISOString());
        state = next.state;
        try {
          writeJson(stateFile, state);
        } catch {
          // A full disk only costs a repeat alert after a restart.
        }
        const toast = toastFor(next);
        if (toast) ctx.toast(toast);
        publish();
      });
    inFlight = p;
    // Only this poll's own slot: a settings change may have started another.
    void p.finally(() => {
      if (inFlight === p) inFlight = null;
    });
    return p;
  };

  const schedule = () => {
    if (timer !== null) ctx.clearTimer(timer);
    timer = settings.url ? ctx.setInterval(() => void poll(), settings.interval * 1000) : null;
  };

  ctx.handle("config", () => publicSettings());
  ctx.handle("snapshot", () => snapshot());
  ctx.handle("poll", async () => {
    await poll();
    return snapshot();
  });
  // `authHeader` left out keeps the one saved; "" removes it.
  ctx.handle("configure", (patch: Record<string, unknown>) => {
    const merged = { ...settings, ...patch };
    if (typeof patch?.authHeader !== "string") merged.authHeader = settings.authHeader;
    const next = parseSettings(merged);
    if (next.url !== settings.url) state = { ...EMPTY };
    settings = next;
    writeJson(configFile, settings, 0o600);
    fs.chmodSync(configFile, 0o600);
    inFlight = null;
    schedule();
    publish();
    void poll();
    return publicSettings();
  });

  schedule();
  publish();
  // Not awaited: activation has 10 s, and a slow status page must not fail it.
  void poll();
}
