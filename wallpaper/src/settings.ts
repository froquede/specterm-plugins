// The wallpaper's settings and the stylesheet they turn into. Pure, so the
// tests run it without a window.
//
// The wallpaper itself is not here: plugin storage is a small JSON object, so
// a picked file is copied to disk by the host module, and only its path is
// stored. Windows load it from there (file://) without asking the host, so a
// launch never starts the plugin's process. A link is kept as is and loaded
// straight from the web.

export type Fit = "cover" | "contain" | "tile";
export type Media = "image" | "video";

export interface Settings {
  /** "file": the host's copy of a picked file, at `filePath`. "url": `url`.
   *  null: none. */
  source: "file" | "url" | null;
  url: string;
  filePath: string;
  /** What the picked file is. A link's kind comes from its extension. */
  fileMedia: Media;
  /** How much of the theme's background stays over the wallpaper in a
   *  terminal pane, 0–100. Higher is easier to read. */
  paneOpacity: number;
  /** Darkens the wallpaper everywhere, 0–100. */
  dim: number;
  /** Blur, in pixels. */
  blur: number;
  /** Tile applies to images; a video tiled fills instead. */
  fit: Fit;
}

export const DEFAULTS: Settings = {
  source: null,
  url: "",
  filePath: "",
  fileMedia: "image",
  paneOpacity: 80,
  dim: 20,
  blur: 0,
  fit: "cover",
};

export const MAX_BLUR = 40;
/** The largest picked file the host keeps: room for a few minutes of 4K. */
export const MAX_BYTES = 300 * 1024 * 1024;
export const SETTINGS_KEY = "settings";

/** What the picker takes, by type, with the extension the copy is saved as. */
export const TYPES: Record<string, { ext: string; media: Media }> = {
  "image/png": { ext: "png", media: "image" },
  "image/jpeg": { ext: "jpg", media: "image" },
  "image/webp": { ext: "webp", media: "image" },
  "image/gif": { ext: "gif", media: "image" },
  "image/avif": { ext: "avif", media: "image" },
  "image/svg+xml": { ext: "svg", media: "image" },
  "video/mp4": { ext: "mp4", media: "video" },
  "video/webm": { ext: "webm", media: "video" },
};

const FITS: Fit[] = ["cover", "contain", "tile"];

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Whatever storage holds, as settings: unknown or broken fields fall back to
 *  the defaults, so a value written by another version never breaks a window. */
export function parseSettings(raw: unknown): Settings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const url = typeof o.url === "string" ? o.url.trim() : "";
  const filePath = typeof o.filePath === "string" ? o.filePath : "";
  let source: Settings["source"] = o.source === "file" || o.source === "url" ? o.source : null;
  if (source === "url" && !isWebUrl(url)) source = null;
  if (source === "file" && !filePath) source = null;
  return {
    source,
    url,
    filePath,
    fileMedia: o.fileMedia === "video" ? "video" : "image",
    paneOpacity: clamp(o.paneOpacity, 0, 100, DEFAULTS.paneOpacity),
    dim: clamp(o.dim, 0, 100, DEFAULTS.dim),
    blur: clamp(o.blur, 0, MAX_BLUR, DEFAULTS.blur),
    fit: FITS.includes(o.fit as Fit) ? (o.fit as Fit) : DEFAULTS.fit,
  };
}

/** An http(s) link. Anything else (file:, javascript:, data:) is refused: a
 *  file goes through the picker, which copies it. */
export function isWebUrl(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** A link to a video, by its extension. */
export function isVideoUrl(value: string): boolean {
  try {
    return /\.(mp4|webm|m4v|mov)$/i.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

/** A file:// URL for an absolute path, POSIX or Windows. */
export function fileUrl(filePath: string): string {
  const p = filePath.replace(/\\/g, "/");
  const encoded = p
    .split("/")
    // A drive letter ("C:") stays as it is; everything else is escaped.
    .map((seg) => (/^[A-Za-z]:$/.test(seg) ? seg : encodeURIComponent(seg)))
    .join("/");
  return p.startsWith("/") ? `file://${encoded}` : `file:///${encoded}`;
}

/** Where the wallpaper loads from and what it is, or null for none. */
export function wallpaperSource(s: Settings): { url: string; media: Media } | null {
  if (s.source === "file") return { url: fileUrl(s.filePath), media: s.fileMedia };
  if (s.source === "url") return { url: s.url, media: isVideoUrl(s.url) ? "video" : "image" };
  return null;
}

// A url() argument: quoted, with what would end the string escaped.
function cssUrl(url: string): string {
  return `url("${url.replace(/["\\\n\r]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}")`;
}

/** The class of the <video> the renderer module puts under the window. */
export const VIDEO_CLASS = "specterm-wallpaper-video";

/**
 * The stylesheet for a wallpaper, or "" for none.
 *
 * The wallpaper goes under the whole window: an image on `.app::before`, a
 * video as a <video> (VIDEO_CLASS) below that, with `.app::before` holding
 * only the dimming. Blur sits on that layer alone, so it never softens the
 * text. The terminal panes, whose xterm canvas is already transparent, let it
 * through by keeping only `paneOpacity` of the theme's background; the rest of
 * the chrome (tab bar, sidebar, settings) and browser panes keep their own.
 */
export function buildCss(s: Settings, source: { url: string; media: Media } | null): string {
  if (!source) return "";
  const dim = `linear-gradient(rgba(0, 0, 0, ${s.dim / 100}), rgba(0, 0, 0, ${s.dim / 100}))`;
  // A blurred edge fades to transparent; growing the layer by the blur keeps
  // the window's edges sharp.
  const inset = s.blur > 0 ? `-${s.blur * 2}px` : "0";
  const grown = s.blur > 0 ? `calc(100% + ${s.blur * 4}px)` : "100%";
  const blur = s.blur > 0 ? `filter: blur(${s.blur}px);` : "";
  const common = `
.app { isolation: isolate;${s.blur > 0 ? " overflow: hidden;" : ""} }
.pane:not(.pane-browser) { background: color-mix(in srgb, var(--bg) ${s.paneOpacity}%, transparent); }`;
  if (source.media === "video") {
    return `${common}
.app::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: ${dim};
}
.${VIDEO_CLASS} {
  position: absolute;
  inset: ${inset};
  width: ${grown};
  height: ${grown};
  z-index: -2;
  pointer-events: none;
  object-fit: ${s.fit === "contain" ? "contain" : "cover"};
  ${blur}
}
`;
  }
  const size = s.fit === "tile" ? "auto" : s.fit;
  const repeat = s.fit === "tile" ? "repeat" : "no-repeat";
  return `${common}
.app::before {
  content: "";
  position: absolute;
  inset: ${inset};
  z-index: -1;
  pointer-events: none;
  background-image: ${dim}, ${cssUrl(source.url)};
  background-size: auto, ${size};
  background-repeat: no-repeat, ${repeat};
  background-position: center;
  ${blur}
}
`;
}
