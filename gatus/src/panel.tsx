import { createRoot, createSignal, For, Show } from "solid-js";
import { render } from "solid-js/web";
import IconX from "lucide-solid/icons/x";
import IconRefresh from "lucide-solid/icons/refresh-cw";
import IconExternal from "lucide-solid/icons/external-link";
import IconChevronRight from "lucide-solid/icons/chevron-right";
import type { PluginPanelApi } from "../../shared/specterm-plugin-api.ts";
import { type Incident, type State, label } from "./engine.ts";
import { LIMITS } from "./settings.ts";
import type { PublicSettings } from "./host.ts";
import "./panel.css";

// The Gatus panel: what is down now, what is failing below the alert
// threshold, and the settings. The host polls and decides; the panel only
// shows its snapshot and sends settings back.

type Snapshot = State & { configured: boolean; url: string };

// Module-level on purpose: Specterm keeps this module loaded after the view
// closes, so a reopen paints what it already has.
const store = createRoot(() => {
  const [snap, setSnap] = createSignal<Snapshot | null>(null);
  const [config, setConfig] = createSignal<PublicSettings | null>(null);
  const [open, setOpen] = createSignal<Set<string>>(new Set());
  const [showSettings, setShowSettings] = createSignal(false);
  const [showQuiet, setShowQuiet] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  return { snap, setSnap, config, setConfig, open, setOpen, showSettings, setShowSettings, showQuiet, setShowQuiet, error, setError };
});

const toggle = (id: string, force?: boolean) =>
  store.setOpen((s) => {
    const n = new Set(s);
    if (force ?? !n.has(id)) n.add(id);
    else n.delete(id);
    return n;
  });

function ago(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleString();
}

function IncidentRow(props: { incident: Incident }) {
  const expanded = () => store.open().has(props.incident.id);
  return (
    <div class="gt-incident" data-incident={props.incident.id}>
      <button class="gt-incident-head" classList={{ expanded: expanded() }} onClick={() => toggle(props.incident.id)}>
        <IconChevronRight size={12} />
        <span class="gt-dot" />
        <span class="gt-incident-title">{props.incident.title}</span>
        <span class="gt-since">{ago(props.incident.since)}</span>
      </button>
      <Show when={expanded() && props.incident.checks.length > 0}>
        <ul class="gt-checks">
          <For each={props.incident.checks}>{(c) => <li>{label(c)}</li>}</For>
        </ul>
      </Show>
    </div>
  );
}

function SettingsForm(props: { api: PluginPanelApi }) {
  const c = () => store.config();
  let form!: HTMLFormElement;
  const [saving, setSaving] = createSignal(false);

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    const f = new FormData(form);
    const patch: Record<string, unknown> = {
      url: String(f.get("url") ?? ""),
      interval: Number(f.get("interval")),
      threshold: Number(f.get("threshold")),
      groupMin: Number(f.get("groupMin")),
      watch: String(f.get("watch") ?? ""),
      mute: String(f.get("mute") ?? ""),
    };
    const auth = String(f.get("authHeader") ?? "");
    if (auth !== "") patch.authHeader = auth;
    if (f.get("clearAuth") === "on") patch.authHeader = "";
    setSaving(true);
    props.api.invoke("configure", patch).then(
      (cfg) => {
        store.setConfig(cfg as PublicSettings);
        store.setError(null);
        store.setShowSettings(false);
        form.reset();
      },
      (err) => store.setError(err instanceof Error ? err.message : String(err))
    ).finally(() => setSaving(false));
  };

  const num = (name: "interval" | "threshold" | "groupMin", text: string, hint: string) => (
    <label class="gt-field">
      <span>{text}</span>
      <input class="gt-input gt-num" name={name} type="number" min={LIMITS[name].min} max={LIMITS[name].max} value={c()?.[name] ?? ""} required />
      <small>{hint}</small>
    </label>
  );

  return (
    <Show when={c()} keyed>
      {(cfg) => (
        <form class="gt-settings" ref={form} onSubmit={submit}>
          <label class="gt-field">
            <span>Gatus address</span>
            <input class="gt-input" name="url" type="url" placeholder="https://status.example.com" value={cfg.url} required />
          </label>
          <label class="gt-field">
            <span>Authorization header</span>
            <input
              class="gt-input"
              name="authHeader"
              type="password"
              autocomplete="off"
              placeholder={cfg.hasAuth ? "saved (type to replace)" : "optional, e.g. Bearer …"}
            />
          </label>
          <Show when={cfg.hasAuth}>
            <label class="gt-check">
              <input type="checkbox" name="clearAuth" /> Remove the saved header
            </label>
          </Show>
          {num("interval", "Poll every (s)", `${LIMITS.interval.min}–${LIMITS.interval.max}`)}
          {num("threshold", "Alert after failures in a row", "per check")}
          {num("groupMin", "Bundle from", "same check in this many groups, or this many checks in one group")}
          <label class="gt-field">
            <span>Alert on first failure</span>
            <textarea class="gt-input" name="watch" rows="3" placeholder={"group/name, one per line\ninfra/*"}>
              {cfg.watch.join("\n")}
            </textarea>
          </label>
          <label class="gt-field">
            <span>Never alert</span>
            <textarea class="gt-input" name="mute" rows="3" placeholder={"*/nightly-*"}>
              {cfg.mute.join("\n")}
            </textarea>
          </label>
          <small class="gt-hint">
            Patterns are group/name with * as a wildcard; without a / they match the name in any group.
          </small>
          <div class="gt-row">
            <button class="gt-btn gt-btn-primary" type="submit" disabled={saving()}>
              {saving() ? "Saving…" : "Save"}
            </button>
            <Show when={store.snap()?.configured}>
              <button class="gt-btn" type="button" onClick={() => store.setShowSettings(false)}>
                Cancel
              </button>
            </Show>
          </div>
        </form>
      )}
    </Show>
  );
}

function GatusPanel(props: { api: PluginPanelApi }) {
  const [polling, setPolling] = createSignal(false);
  const s = () => store.snap();
  const pollNow = () => {
    setPolling(true);
    props.api
      .invoke("poll")
      .then((snap) => store.setSnap(snap as Snapshot), (err) => store.setError(String(err)))
      .finally(() => setPolling(false));
  };

  return (
    <div class="gt-panel">
      <div class="gt-header">
        <span class="gt-title">Gatus</span>
        <Show when={s()?.configured}>
          <button class="gt-icon-btn" title="Check now" disabled={polling()} onClick={pollNow}>
            <IconRefresh size={14} />
          </button>
          <button class="gt-icon-btn" title="Open the status page" onClick={() => props.api.openExternal(s()!.url)}>
            <IconExternal size={14} />
          </button>
        </Show>
        <button class="gt-icon-btn" title="Close" onClick={() => props.api.close()}>
          <IconX size={14} />
        </button>
      </div>

      <div class="gt-scroll">
        <Show when={store.error()}>
          <div class="gt-error">{store.error()}</div>
        </Show>

        <Show when={s()?.configured && !store.showSettings()}>
          <div class="gt-status">
            {s()!.checks} checks · checked {ago(s()!.lastPoll)}
            <Show when={s()!.lastError}>
              <div class="gt-error">{s()!.lastError}</div>
            </Show>
          </div>

          <Show when={s()!.incidents.length > 0} fallback={<div class="gt-empty">Nothing down.</div>}>
            <div class="gt-incidents">
              <For each={s()!.incidents}>{(i) => <IncidentRow incident={i} />}</For>
            </div>
          </Show>

          <Show when={s()!.quiet.length > 0}>
            <button
              class="gt-section-toggle"
              classList={{ expanded: store.showQuiet() }}
              onClick={() => store.setShowQuiet((v) => !v)}
            >
              <IconChevronRight size={12} />
              Failing, not alerted ({s()!.quiet.length})
            </button>
            <Show when={store.showQuiet()}>
              <ul class="gt-checks gt-quiet">
                <For each={s()!.quiet}>{(c) => <li>{label(c)}</li>}</For>
              </ul>
            </Show>
          </Show>

          <button class="gt-section-toggle" onClick={() => store.setShowSettings(true)}>
            <IconChevronRight size={12} />
            Settings
          </button>
        </Show>

        <Show when={s() && (!s()!.configured || store.showSettings())}>
          <Show when={!s()!.configured}>
            <div class="gt-empty">Point this at a Gatus server to get alerted when its checks go down.</div>
          </Show>
          <SettingsForm api={props.api} />
        </Show>
      </div>
    </div>
  );
}

/** Specterm's entry point: render into the element it gives us; the returned
 *  function is called when the view closes. */
export function mount(el: HTMLElement, api: PluginPanelApi): () => void {
  const offChanged = api.on("changed", (snap) => store.setSnap(snap as Snapshot));
  // A clicked toast: show its incident open.
  const offReveal = api.onReveal((payload) => {
    const id = (payload as { incident?: unknown } | null)?.incident;
    if (typeof id === "string") {
      store.setShowSettings(false);
      toggle(id, true);
      queueMicrotask(() => el.querySelector(`[data-incident="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest" }));
    }
  });
  api.invoke("snapshot").then((snap) => store.setSnap(snap as Snapshot), (err) => store.setError(String(err)));
  api.invoke("config").then((cfg) => store.setConfig(cfg as PublicSettings), (err) => store.setError(String(err)));
  const dispose = render(() => <GatusPanel api={api} />, el);
  return () => {
    dispose();
    offChanged();
    offReveal();
  };
}
