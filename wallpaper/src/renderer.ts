import type { PluginRendererApi } from "../../shared/specterm-plugin-api.ts";
import { onLocalChange } from "./bus.ts";
import { SETTINGS_KEY, buildCss, parseSettings, type Settings } from "./settings.ts";

// The wallpaper's renderer module: loaded in every window after its first
// terminal has rendered, it puts the image behind the window with one <style>
// and redraws it when the settings change in any window. The image of a
// picked file comes from the host as a data: URL and is shown through a blob:
// URL, so the stylesheet stays small.

export function activate(api: PluginRendererApi): () => void {
  const style = document.createElement("style");
  style.dataset.specterm = "wallpaper";
  document.head.appendChild(style);

  let blobUrl: string | null = null;
  // The revision blobUrl was read at; -1 for none.
  let blobRevision = -1;
  // Each apply supersedes the one before, so a slow read never lands late.
  let generation = 0;

  function dropBlob() {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = null;
    blobRevision = -1;
  }

  async function fileUrl(s: Settings): Promise<string | null> {
    if (blobUrl && blobRevision === s.revision) return blobUrl;
    const dataUrl = await api.invoke("get");
    if (typeof dataUrl !== "string") return null;
    const blob = await (await fetch(dataUrl)).blob();
    dropBlob();
    blobUrl = URL.createObjectURL(blob);
    blobRevision = s.revision;
    return blobUrl;
  }

  async function apply() {
    const mine = ++generation;
    const s = parseSettings(api.storage.get(SETTINGS_KEY));
    let url: string | null = null;
    try {
      if (s.source === "file") url = await fileUrl(s);
      else if (s.source === "url") url = s.url;
    } catch (err) {
      console.error("[wallpaper] could not load the image:", err);
    }
    if (mine !== generation) return;
    if (s.source !== "file") dropBlob();
    style.textContent = buildCss(s, url);
  }

  void apply();
  const offChange = api.storage.onChange((key) => {
    if (key === SETTINGS_KEY) void apply();
  });
  const offLocal = onLocalChange(() => void apply());

  return () => {
    generation++;
    offChange();
    offLocal();
    style.remove();
    dropBlob();
  };
}
