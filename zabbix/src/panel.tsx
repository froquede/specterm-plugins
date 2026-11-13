import { createRoot, createSignal, For, Show } from "solid-js";
import { render } from "solid-js/web";
import IconX from "lucide-solid/icons/x";
import IconRefresh from "lucide-solid/icons/refresh-cw";
import IconExternal from "lucide-solid/icons/external-link";
import IconChevronRight from "lucide-solid/icons/chevron-right";
import type { PluginPanelApi } from "../../shared/specterm-plugin-api.ts";
import { ContextMenu, menuAt, opensMenu, type MenuItem, type MenuRequest } from "../../shared/context-menu.tsx";
import { claudeCommand } from "../../shared/ask-claude.ts";
import { type Incident, type Problem, type State, label } from "./engine.ts";
import { LIMITS, SEVERITIES } from "./settings.ts";
import type { PublicSettings } from "./host.ts";
import "../../shared/context-menu.css";
import "./panel.css";

// The Zabbix panel: what alerts now, what is active but not alerted, and the
// settings. The host polls and decides; the panel only shows its snapshot,
// sends settings back, and offers a right-click menu on every problem.

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
  const [menu, setMenu] = createSignal<MenuRequest | null>(null);
  return { snap, setSnap, config, setConfig, open, setOpen, showSettings, setShowSettings, showQuiet, setShowQuiet, error, setError, menu, setMenu };
});

// Where "Ask Claude" opens its terminal: the directory of the pane in use.
let activeCwd: string | null = null;

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
  return `${Math.round(s / 86400)} d ago`;
}

const sevName = (n: number) => SEVERITIES[n] ?? "Zabbix";

/** Zabbix's Problems page filtered to these triggers. */
function problemsLink(base: string, problems: Problem[]): string {
  const ids = problems.map((p) => `triggerids%5B%5D=${encodeURIComponent(p.key)}`).join("&");
  return `${base}/zabbix.php?action=problem.view&filter_set=1${ids ? `&${ids}` : ""}`;
}
const eventLink = (base: string, p: Problem) =>
  `${base}/tr_events.php?triggerid=${encodeURIComponent(p.key)}&eventid=${encodeURIComponent(p.eventId)}`;

/** The prompt names the problems only by id, and Claude reads them from the
 *  API: their text never goes on the command line. */
function askClaudeCommand(base: string, problems: Problem[]): string | null {
  const refs = problems
    .slice(0, 20)
    .map((p) => `trigger ${p.key}${p.eventId ? ` (event ${p.eventId})` : ""}`)
    .join(", ");
  const more = problems.length > 20 ? ` and ${problems.length - 20} more on the Problems page` : "";
  return claudeCommand(
    `Look into ${problems.length === 1 ? "this active Zabbix problem" : "these active Zabbix problems"} on ${base} ` +
      `(JSON-RPC API at ${base}/api_jsonrpc.php): ${refs}${more}. Read only: change nothing in Zabbix. ` +
      `Tell me what ${problems.length === 1 ? "it is" : "each is"} and the likely cause, then wait for what I want to do.`
  );
}

function menuFor(api: PluginPanelApi, e: MouseEvent | KeyboardEvent, problems: Problem[], text: string) {
  e.preventDefault();
  e.stopPropagation();
  const base = store.snap()?.url ?? "";
  const items: MenuItem[] = [];
  const cmd = api.openTerminal && base ? askClaudeCommand(base, problems) : null;
  if (cmd) items.push({ label: "Ask Claude about it", run: () => api.openTerminal!({ command: cmd, cwd: activeCwd ?? undefined, run: true }) });
  if (items.length) items.push("separator");
  if (base && problems.length) items.push({ label: "Open in Zabbix", run: () => api.openExternal(problemsLink(base, problems)) });
  if (base && problems.length === 1 && problems[0].eventId)
    items.push({ label: "Open the event", run: () => api.openExternal(eventLink(base, problems[0])) });
  const copy = (s: string) => void (api.copyText ? api.copyText(s) : navigator.clipboard.writeText(s)).catch(() => {});
  items.push({ label: "Copy text", run: () => copy(text) });
  if (base && problems.length) items.push({ label: "Copy link", run: () => copy(problemsLink(base, problems)) });
  store.setMenu({ ...menuAt(e), items });
}

function ProblemRow(props: { api: PluginPanelApi; problem: Problem; showHost?: boolean; tag?: string }) {
  const p = () => props.problem;
  const text = () => (props.showHost === false ? p().name : label(p()));
  const full = () => `${label(p())} (${sevName(p().severity)}, since ${p().since})`;
  return (
    <li
      class="zb-problem"
      tabIndex={0}
      title={`${sevName(p().severity)} · since ${p().since ? new Date(p().since).toLocaleString() : "?"}`}
      onContextMenu={(e) => menuFor(props.api, e, [p()], full())}
      onKeyDown={(e) => opensMenu(e) && menuFor(props.api, e, [p()], full())}
      onDblClick={() => store.snap()?.url && props.api.openExternal(problemsLink(store.snap()!.url, [p()]))}
    >
      <span class="zb-dot" data-sev={p().severity} />
      <span class="zb-problem-text">{text()}</span>
      <Show when={props.tag}>
        <span class="zb-tag">{props.tag}</span>
      </Show>
      <span class="zb-since">{ago(p().since)}</span>
    </li>
  );
}

function IncidentRow(props: { api: PluginPanelApi; incident: Incident }) {
  const i = () => props.incident;
  const expanded = () => store.open().has(i().id);
  const text = () => [i().title, ...i().problems.map((p) => `- ${label(p)} (${sevName(p.severity)})`)].join("\n");
  return (
    <div class="zb-incident" data-incident={i().id}>
      <button
        class="zb-incident-head"
        classList={{ expanded: expanded() }}
        onClick={() => toggle(i().id)}
        onContextMenu={(e) => menuFor(props.api, e, i().problems, text())}
        onKeyDown={(e) => opensMenu(e) && menuFor(props.api, e, i().problems, text())}
        title={i().severity >= 0 ? sevName(i().severity) : undefined}
      >
        <IconChevronRight size={12} />
        <span class="zb-dot" data-sev={i().severity} />
        <span class="zb-incident-title">{i().title}</span>
        <span class="zb-since">{ago(i().problems.map((p) => p.since).filter(Boolean).sort()[0] ?? i().since)}</span>
      </button>
      <Show when={expanded() && i().problems.length > 0}>
        <ul class="zb-checks">
          <For each={i().problems}>
            {(p) => <ProblemRow api={props.api} problem={p} showHost={i().kind !== "host"} />}
          </For>
        </ul>
      </Show>
    </div>
  );
}

function quietTag(p: Problem, minSeverity: number): string {
  if (p.maintenance) return "maintenance";
  if (p.acknowledged) return "acked";
  return p.severity < minSeverity ? sevName(p.severity).toLowerCase() : "";
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
      minSeverity: Number(f.get("minSeverity")),
      groupMin: Number(f.get("groupMin")),
      alertAcknowledged: f.get("alertAcknowledged") === "on",
      allowExpiredCert: f.get("allowExpiredCert") === "on",
      mute: String(f.get("mute") ?? ""),
    };
    const token = String(f.get("token") ?? "");
    if (token !== "") patch.token = token;
    if (f.get("clearToken") === "on") patch.token = "";
    setSaving(true);
    props.api
      .invoke("configure", patch)
      .then(
        (cfg) => {
          store.setConfig(cfg as PublicSettings);
          store.setError(null);
          store.setShowSettings(false);
          form.reset();
        },
        (err) => store.setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setSaving(false));
  };

  const num = (name: "interval" | "groupMin", text: string, hint: string) => (
    <label class="zb-field">
      <span>{text}</span>
      <input class="zb-input zb-num" name={name} type="number" min={LIMITS[name].min} max={LIMITS[name].max} value={c()?.[name] ?? ""} required />
      <small>{hint}</small>
    </label>
  );

  return (
    <Show when={c()} keyed>
      {(cfg) => (
        <form class="zb-settings" ref={form} onSubmit={submit}>
          <label class="zb-field">
            <span>Zabbix address</span>
            <input class="zb-input" name="url" type="url" placeholder="https://zabbix.example.com" value={cfg.url} required />
          </label>
          <label class="zb-field">
            <span>API token</span>
            <input
              class="zb-input"
              name="token"
              type="password"
              autocomplete="off"
              placeholder={cfg.hasToken ? "saved (type to replace)" : "Users → API tokens"}
            />
            <small>A token for a user that can only read is enough.</small>
          </label>
          <Show when={cfg.hasToken}>
            <label class="zb-check">
              <input type="checkbox" name="clearToken" /> Remove the saved token
            </label>
          </Show>
          <label class="zb-field">
            <span>Alert from severity</span>
            <select class="zb-input zb-select" name="minSeverity">
              <For each={[...SEVERITIES]}>
                {(name, n) => (
                  <option value={n()} selected={n() === cfg.minSeverity}>
                    {name}
                  </option>
                )}
              </For>
            </select>
          </label>
          {num("interval", "Poll every (s)", `${LIMITS.interval.min}–${LIMITS.interval.max}`)}
          {num("groupMin", "Bundle from", "same problem on this many hosts, or this many problems on one host")}
          <label class="zb-check">
            <input type="checkbox" name="alertAcknowledged" checked={cfg.alertAcknowledged} /> Alert on acknowledged problems too
          </label>
          <label class="zb-check">
            <input type="checkbox" name="allowExpiredCert" checked={cfg.allowExpiredCert} /> Accept an expired certificate
          </label>
          <small class="zb-hint">Only expiry is forgiven: the chain and the host name are still checked.</small>
          <label class="zb-field">
            <span>Never alert</span>
            <textarea class="zb-input" name="mute" rows="3" placeholder={"host/problem, one per line\nDev-*/*"}>
              {cfg.mute.join("\n")}
            </textarea>
          </label>
          <small class="zb-hint">
            Patterns are host/problem with * as a wildcard; without a / they match the problem on any host.
          </small>
          <div class="zb-row">
            <button class="zb-btn zb-btn-primary" type="submit" disabled={saving()}>
              {saving() ? "Saving…" : "Save"}
            </button>
            <Show when={store.snap()?.configured}>
              <button class="zb-btn" type="button" onClick={() => store.setShowSettings(false)}>
                Cancel
              </button>
            </Show>
          </div>
        </form>
      )}
    </Show>
  );
}

function ZabbixPanel(props: { api: PluginPanelApi }) {
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
    <div class="zb-panel">
      <div class="zb-header">
        <span class="zb-title">Zabbix</span>
        <Show when={s()?.configured}>
          <button class="zb-icon-btn" title="Check now" disabled={polling()} onClick={pollNow}>
            <IconRefresh size={14} />
          </button>
          <button class="zb-icon-btn" title="Open Zabbix's Problems page" onClick={() => props.api.openExternal(problemsLink(s()!.url, []))}>
            <IconExternal size={14} />
          </button>
        </Show>
        <button class="zb-icon-btn" title="Close" onClick={() => props.api.close()}>
          <IconX size={14} />
        </button>
      </div>

      <div class="zb-scroll">
        <Show when={store.error()}>
          <div class="zb-error">{store.error()}</div>
        </Show>

        <Show when={s()?.configured && !store.showSettings()}>
          <div class="zb-status">
            {s()!.total} active problems · checked {ago(s()!.lastPoll)}
            <Show when={s()!.lastError}>
              <div class="zb-error">{s()!.lastError}</div>
            </Show>
          </div>

          <Show when={s()!.incidents.length > 0} fallback={<div class="zb-empty">Nothing alerting.</div>}>
            <div class="zb-incidents">
              <For each={s()!.incidents}>{(i) => <IncidentRow api={props.api} incident={i} />}</For>
            </div>
          </Show>

          <Show when={s()!.quiet.length > 0}>
            <button
              class="zb-section-toggle"
              classList={{ expanded: store.showQuiet() }}
              onClick={() => store.setShowQuiet((v) => !v)}
            >
              <IconChevronRight size={12} />
              Active, not alerted ({s()!.quiet.length})
            </button>
            <Show when={store.showQuiet()}>
              <ul class="zb-checks zb-quiet">
                <For each={s()!.quiet}>
                  {(p) => <ProblemRow api={props.api} problem={p} tag={quietTag(p, store.config()?.minSeverity ?? 0)} />}
                </For>
              </ul>
            </Show>
          </Show>

          <button class="zb-section-toggle" onClick={() => store.setShowSettings(true)}>
            <IconChevronRight size={12} />
            Settings
          </button>
        </Show>

        <Show when={s() && (!s()!.configured || store.showSettings())}>
          <Show when={!s()!.configured}>
            <div class="zb-empty">Point this at a Zabbix server to get alerted when a problem opens.</div>
          </Show>
          <SettingsForm api={props.api} />
        </Show>
      </div>
      <Show when={store.menu()}>{(m) => <ContextMenu menu={m()} onClose={() => store.setMenu(null)} />}</Show>
    </div>
  );
}

/** Specterm's entry point: render into the element it gives us; the returned
 *  function is called when the view closes. */
export function mount(el: HTMLElement, api: PluginPanelApi): () => void {
  const offChanged = api.on("changed", (snap) => store.setSnap(snap as Snapshot));
  const offCwd = api.onActiveCwd((cwd) => (activeCwd = cwd));
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
  const dispose = render(() => <ZabbixPanel api={api} />, el);
  return () => {
    dispose();
    offChanged();
    offCwd();
    offReveal();
    store.setMenu(null);
  };
}
