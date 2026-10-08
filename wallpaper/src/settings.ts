// The wallpaper's settings and the stylesheet they turn into. Pure, so the
// tests run it without a window.
//
// The image itself is not here: plugin storage is a small JSON object, so a
// picked file lives on disk, owned by the host module, and only `source`
// (where it came from) is stored. A link is kept as is and loaded straight
// from the web.

export type Fit = "cover" | "contain" | "tile";

export interface Settings {
  /** "file": the host's copy of a picked image. "url": `url`. null: none. */
  source: "file" | "url" | null;
  url: string;
  /** How much of the theme's background stays over the image in a terminal
   *  pane, 0–100. Higher is easier to read. */
  paneOpacity: number;
  /** Darkens the image everywhere, 0–100. */
  dim: number;
  /** Blur, in pixels. */
  blur: number;
  fit: Fit;
  /** Bumped when a new file replaces the old one, so every window reloads it. */
  revision: number;
}

export const DEFAULTS: Settings = {
  source: null,
  url: "",
  paneOpacity: 80,
  dim: 20,
  blur: 0,
  fit: "cover",
  revision: 0,
};

export const MAX_BLUR = 40;
/** The largest picked file the host keeps. */
export const MAX_BYTES = 25 * 1024 * 1024;
export const SETTINGS_KEY = "settings";

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
  let source: Settings["source"] = o.source === "file" || o.source === "url" ? o.source : null;
  if (source === "url" && !isImageUrl(url)) source = null;
  return {
    source,
    url,
    paneOpacity: clamp(o.paneOpacity, 0, 100, DEFAULTS.paneOpacity),
    dim: clamp(o.dim, 0, 100, DEFAULTS.dim),
    blur: clamp(o.blur, 0, MAX_BLUR, DEFAULTS.blur),
    fit: FITS.includes(o.fit as Fit) ? (o.fit as Fit) : DEFAULTS.fit,
    revision: clamp(o.revision, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

/** An http(s) link. Anything else (file:, javascript:, data:) is refused: a
 *  file goes through the picker, which copies it. */
export function isImageUrl(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

// A url() argument: quoted, with what would end the string escaped.
function cssUrl(url: string): string {
  return `url("${url.replace(/["\\\n\r]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}")`;
}

/**
 * The stylesheet for `imageUrl` (a blob: URL for a file, the link for a URL),
 * or "" for none.
 *
 * The image goes on a layer under the whole window (`.app::before`, so blur
 * never softens the text), and the terminal panes, whose xterm canvas is
 * already transparent, let it through by keeping only `paneOpacity` of the
 * theme's background. Everything else (tab bar, sidebar, settings) keeps its
 * own background.
 */
export function buildCss(s: Settings, imageUrl: string | null): string {
  if (!imageUrl) return "";
  const size = s.fit === "tile" ? "auto" : s.fit;
  const repeat = s.fit === "tile" ? "repeat" : "no-repeat";
  // A blurred edge fades to transparent; growing the layer by the blur keeps
  // the window's edges sharp.
  const inset = s.blur > 0 ? `-${s.blur * 2}px` : "0";
  return `
.app { isolation: isolate;${s.blur > 0 ? " overflow: hidden;" : ""} }
.app::before {
  content: "";
  position: absolute;
  inset: ${inset};
  z-index: -1;
  pointer-events: none;
  background-image: linear-gradient(rgba(0, 0, 0, ${s.dim / 100}), rgba(0, 0, 0, ${s.dim / 100})), ${cssUrl(imageUrl)};
  background-size: auto, ${size};
  background-repeat: no-repeat, ${repeat};
  background-position: center;
  ${s.blur > 0 ? `filter: blur(${s.blur}px);` : ""}
}
.pane { background: color-mix(in srgb, var(--bg) ${s.paneOpacity}%, transparent); }
`;
}
