import { createSignal, For, onCleanup, Show } from "solid-js";
import { render } from "solid-js/web";
import IconImage from "lucide-solid/icons/image";
import IconX from "lucide-solid/icons/x";
import type { PluginPanelApi } from "../../shared/specterm-plugin-api.ts";
import { notifyLocalChange } from "./bus.ts";
import {
  MAX_BLUR,
  MAX_BYTES,
  SETTINGS_KEY,
  TYPES,
  isWebUrl,
  parseSettings,
  wallpaperSource,
  type Fit,
  type Media,
  type Settings,
} from "./settings.ts";
import "./panel.css";

// The wallpaper's settings: pick an image, a GIF or a video, or paste a link,
// then tune how much the terminals let it through. Every change is written to plugin storage at
// once; the renderer module (renderer.ts) draws it in every window.

const FITS: { value: Fit; label: string }[] = [
  { value: "cover", label: "Fill" },
  { value: "contain", label: "Fit" },
  { value: "tile", label: "Tile" },
];

const ACCEPT = Object.keys(TYPES).join(",");

function WallpaperPanel(props: { api: PluginPanelApi }) {
  const { api } = props;
  const [settings, setSettings] = createSignal<Settings>(parseSettings(api.storage.get(SETTINGS_KEY)));
  const [urlDraft, setUrlDraft] = createSignal(settings().url);
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

  const offChange = api.storage.onChange((key) => {
    if (key !== SETTINGS_KEY) return;
    setSettings(parseSettings(api.storage.get(SETTINGS_KEY)));
    setUrlDraft(settings().url);
  });
  onCleanup(offChange);

  const preview = () => wallpaperSource(settings());

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!TYPES[file.type]) return setError("Pick a PNG, JPEG, WebP, GIF, AVIF, SVG, MP4 or WebM file.");
    if (file.size > MAX_BYTES) return setError(`The file is over ${MAX_BYTES / 1024 / 1024} MB.`);
    setBusy(true);
    try {
      const stored = (await api.invoke("set", file.type, new Uint8Array(await file.arrayBuffer()))) as {
        path: string;
        media: Media;
      };
      save({ source: "file", filePath: stored.path, fileMedia: stored.media });
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
    if (!isWebUrl(url)) return setError("Paste an http(s) link to an image or a video.");
    setError(null);
    save({ source: "url", url });
  }

  async function remove() {
    setError(null);
    const wasFile = settings().source === "file";
    save({ source: null, filePath: "" });
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
          <Show when={preview()} keyed fallback={<IconImage size={28} />}>
            {(src) =>
              src.media === "video" ? (
                <video src={src.url} muted loop autoplay playsinline />
              ) : (
                <img src={src.url} alt="" />
              )
            }
          </Show>
        </div>

        <div class="wp-row">
          <button class="wp-btn wp-btn-primary" disabled={busy()} onClick={() => fileInput.click()}>
            {busy() ? "Saving…" : "Choose file…"}
          </button>
          <Show when={settings().source}>
            <button class="wp-btn" onClick={remove}>
              Remove
            </button>
          </Show>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => pickFile(e.currentTarget.files?.[0])}
          />
        </div>

        <form class="wp-row" onSubmit={useUrl}>
          <input
            class="wp-input"
            type="url"
            placeholder="or paste a link"
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
          {slider("Dim", "dim", 100, "%")}
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
