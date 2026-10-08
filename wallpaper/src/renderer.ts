import type { PluginRendererApi } from "../../shared/specterm-plugin-api.ts";
import { onLocalChange } from "./bus.ts";
import { SETTINGS_KEY, VIDEO_CLASS, buildCss, parseSettings, wallpaperSource } from "./settings.ts";

// The wallpaper's renderer module: loaded in every window after its first
// terminal has rendered, it puts the wallpaper behind the window with one
// <style> (and, for a video, one muted, looping <video> under the window) and
// redraws it when the settings change in any window. A picked file loads from
// disk by its path, so nothing here waits on the plugin's host process.

export function activate(api: PluginRendererApi): () => void {
  const style = document.createElement("style");
  style.dataset.specterm = "wallpaper";
  document.head.appendChild(style);

  let video: HTMLVideoElement | null = null;

  function removeVideo() {
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load(); // lets go of the decoder and the file
    video.remove();
    video = null;
  }

  function showVideo(url: string) {
    const app = document.querySelector(".app");
    if (!app) return;
    if (!video) {
      video = document.createElement("video");
      video.className = VIDEO_CLASS;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      video.addEventListener("error", () => console.error("[wallpaper] could not play", video?.src));
    }
    if (video.parentElement !== app) app.prepend(video);
    if (video.src !== url) video.src = url;
    if (!document.hidden) void video.play().catch(() => {});
  }

  function apply() {
    const s = parseSettings(api.storage.get(SETTINGS_KEY));
    const source = wallpaperSource(s);
    if (source?.media === "video") showVideo(source.url);
    else removeVideo();
    style.textContent = buildCss(s, source);
  }

  // A minimized or hidden window plays nothing: a wallpaper nobody can see
  // shouldn't keep a decoder busy.
  const onVisibility = () => {
    if (!video) return;
    if (document.hidden) video.pause();
    else void video.play().catch(() => {});
  };
  document.addEventListener("visibilitychange", onVisibility);

  apply();
  const offChange = api.storage.onChange((key) => {
    if (key === SETTINGS_KEY) apply();
  });
  const offLocal = onLocalChange(apply);

  return () => {
    offChange();
    offLocal();
    document.removeEventListener("visibilitychange", onVisibility);
    style.remove();
    removeVideo();
  };
}
