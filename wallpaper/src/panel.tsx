import { createSignal, For, onCleanup, Show } from "solid-js";
import { render } from "solid-js/web";
import IconImage from "lucide-solid/icons/image";
import IconX from "lucide-solid/icons/x";
import type { PluginPanelApi } from "../../shared/specterm-plugin-api.ts";
import { notifyLocalChange } from "./bus.ts";
import { MAX_BLUR, MAX_BYTES, SETTINGS_KEY, isImageUrl, parseSettings, type Fit, type Settings } from "./settings.ts";
import "./panel.css";

// The wallpaper's settings: pick a file or paste a link, then tune how much
// the terminals let it through. Every change is written to plugin storage at
// once; the renderer module (renderer.ts) draws it in every window.

const FITS: { value: Fit; label: string }[] = [
  { value: "cover", label: "Fill" },
  { value: "contain", label: "Fit" },
  { value: "tile", label: "Tile" },
];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("could not read the file"));
    reader.readAsDataURL(file);
  });
}

function WallpaperPanel(props: { api: PluginPanelApi }) {
  const { api } = props;
  const [settings, setSettings] = createSignal<Settings>(parseSettings(api.storage.get(SETTINGS_KEY)));
  const [urlDraft, setUrlDraft] = createSignal(settings().url);
  const [preview, setPreview] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  let fileInput!: HTMLInputElement;

  function save(patch: Partial<Settings>) {
    const next = parseSettings({ ...settings(), ...patch });
    try {
      api.storage.set(SETTINGS_KEY, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }
    setSettings(next);
    notifyLocalChange();
  }

  // The preview of a picked file is read back from the host, so it shows
  // what every window shows.
  async function loadPreview() {
    const s = settings();
    if (s.source === "url") return setPreview(s.url);
    if (s.source !== "file") return setPreview(null);
    try {
      const dataUrl = await api.invoke("get");
      setPreview(typeof dataUrl === "string" ? dataUrl : null);
    } catch {
      setPreview(null);
    }
  }
  void loadPreview();

  const offChange = api.storage.onChange((key) => {
    if (key !== SETTINGS_KEY) return;
    setSettings(parseSettings(api.storage.get(SETTINGS_KEY)));
    setUrlDraft(settings().url);
    void loadPreview();
  });
  onCleanup(offChange);

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) return setError(`The image is over ${MAX_BYTES / 1024 / 1024} MB.`);
    setBusy(true);
    try {
      await api.invoke("set", await readAsDataUrl(file));
      save({ source: "file", revision: settings().revision + 1 });
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      fileInput.value = "";
    }
  }

  function useUrl(e: Event) {
    e.preventDefault();
    const url = urlDraft().trim();
    if (!isImageUrl(url)) return setError("Paste an http(s) link to an image.");
    setError(null);
    save({ source: "url", url });
    setPreview(url);
  }

  async function remove() {
    setError(null);
    const wasFile = settings().source === "file";
    save({ source: null });
    setPreview(null);
    if (wasFile) await api.invoke("clear").catch(() => {});
  }

  function slider(label: string, key: "paneOpacity" | "dim" | "blur", max: number, unit: string) {
    return (
      <label class="wp-slider">
        <span class="wp-slider-head">
          <span>{label}</span>
          <span class="wp-value">
            {settings()[key]}
            {unit}
          </span>
        </span>
        <input
          type="range"
          min="0"
          max={max}
          value={settings()[key]}
          onInput={(e) => save({ [key]: Number(e.currentTarget.value) })}
        />
      </label>
    );
  }

  return (
    <div class="wp-panel">
      <div class="wp-header">
        <span class="wp-title">Wallpaper</span>
        <button class="wp-icon-btn" title="Close" onClick={() => api.close()}>
          <IconX size={14} />
        </button>
      </div>

      <div class="wp-scroll">
        <div class="wp-preview" classList={{ "wp-preview-empty": !preview() }}>
          <Show when={preview()} fallback={<IconImage size={28} />}>
            {(src) => <img src={src()} alt="" />}
          </Show>
        </div>

        <div class="wp-row">
          <button class="wp-btn wp-btn-primary" disabled={busy()} onClick={() => fileInput.click()}>
            {busy() ? "Saving…" : "Choose image…"}
          </button>
          <Show when={settings().source}>
            <button class="wp-btn" onClick={remove}>
              Remove
            </button>
          </Show>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
            hidden
            onChange={(e) => pickFile(e.currentTarget.files?.[0])}
          />
        </div>

        <form class="wp-row" onSubmit={useUrl}>
          <input
            class="wp-input"
            type="url"
            placeholder="or paste an image link"
            value={urlDraft()}
            onInput={(e) => setUrlDraft(e.currentTarget.value)}
          />
          <button class="wp-btn" type="submit">
            Use
          </button>
        </form>

        <Show when={error()}>
          <div class="wp-error">{error()}</div>
        </Show>

        <div class="wp-section">
          {slider("Terminal background", "paneOpacity", 100, "%")}
          {slider("Dim image", "dim", 100, "%")}
          {slider("Blur", "blur", MAX_BLUR, "px")}
        </div>

        <div class="wp-section">
          <span class="wp-label">Size</span>
          <div class="wp-segmented">
            <For each={FITS}>
              {(f) => (
                <button classList={{ "wp-seg": true, active: settings().fit === f.value }} onClick={() => save({ fit: f.value })}>
                  {f.label}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}

export function mount(element: HTMLElement, api: PluginPanelApi): () => void {
  return render(() => <WallpaperPanel api={api} />, element);
}
