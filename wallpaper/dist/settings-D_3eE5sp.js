const l = /* @__PURE__ */ new Set();
function h(e) {
  return l.add(e), () => l.delete(e);
}
function x() {
  for (const e of [...l]) e();
}
const r = {
  paneOpacity: 80,
  dim: 20,
  blur: 0,
  fit: "cover"
}, f = 40, S = 300 * 1024 * 1024, w = "settings", y = {
  "image/png": { ext: "png", media: "image" },
  "image/jpeg": { ext: "jpg", media: "image" },
  "image/webp": { ext: "webp", media: "image" },
  "image/gif": { ext: "gif", media: "image" },
  "image/avif": { ext: "avif", media: "image" },
  "image/svg+xml": { ext: "svg", media: "image" },
  "video/mp4": { ext: "mp4", media: "video" },
  "video/webm": { ext: "webm", media: "video" }
}, m = ["cover", "contain", "tile"];
function a(e, t, n, i) {
  const o = typeof e == "number" && Number.isFinite(e) ? e : i;
  return Math.min(n, Math.max(t, Math.round(o)));
}
function M(e) {
  const t = e && typeof e == "object" ? e : {}, n = typeof t.url == "string" ? t.url.trim() : "", i = typeof t.filePath == "string" ? t.filePath : "";
  let o = t.source === "file" || t.source === "url" ? t.source : null;
  return o === "url" && !d(n) && (o = null), o === "file" && !i && (o = null), {
    source: o,
    url: n,
    filePath: i,
    fileMedia: t.fileMedia === "video" ? "video" : "image",
    paneOpacity: a(t.paneOpacity, 0, 100, r.paneOpacity),
    dim: a(t.dim, 0, 100, r.dim),
    blur: a(t.blur, 0, f, r.blur),
    fit: m.includes(t.fit) ? t.fit : r.fit
  };
}
function d(e) {
  try {
    return /^https?:$/.test(new URL(e).protocol);
  } catch {
    return !1;
  }
}
function g(e) {
  try {
    return /\.(mp4|webm|m4v|mov)$/i.test(new URL(e).pathname);
  } catch {
    return !1;
  }
}
function b(e) {
  const t = e.replace(/\\/g, "/"), n = t.split("/").map((i) => /^[A-Za-z]:$/.test(i) ? i : encodeURIComponent(i)).join("/");
  return t.startsWith("/") ? `file://${n}` : `file:///${n}`;
}
function U(e) {
  return e.source === "file" ? { url: b(e.filePath), media: e.fileMedia } : e.source === "url" ? { url: e.url, media: g(e.url) ? "video" : "image" } : null;
}
function $(e) {
  return `url("${e.replace(/["\\\n\r]/g, (t) => `\\${t.charCodeAt(0).toString(16)} `)}")`;
}
const v = "specterm-wallpaper-video";
function L(e, t) {
  if (!t) return "";
  const n = `linear-gradient(rgba(0, 0, 0, ${e.dim / 100}), rgba(0, 0, 0, ${e.dim / 100}))`, i = e.blur > 0 ? `-${e.blur * 2}px` : "0", o = e.blur > 0 ? `calc(100% + ${e.blur * 4}px)` : "100%", c = e.blur > 0 ? `filter: blur(${e.blur}px);` : "", u = `
.app { isolation: isolate;${e.blur > 0 ? " overflow: hidden;" : ""} }
.pane { background: color-mix(in srgb, var(--bg) ${e.paneOpacity}%, transparent); }`;
  if (t.media === "video")
    return `${u}
.app::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: ${n};
}
.${v} {
  position: absolute;
  inset: ${i};
  width: ${o};
  height: ${o};
  z-index: -2;
  pointer-events: none;
  object-fit: ${e.fit === "contain" ? "contain" : "cover"};
  ${c}
}
`;
  const s = e.fit === "tile" ? "auto" : e.fit, p = e.fit === "tile" ? "repeat" : "no-repeat";
  return `${u}
.app::before {
  content: "";
  position: absolute;
  inset: ${i};
  z-index: -1;
  pointer-events: none;
  background-image: ${n}, ${$(t.url)};
  background-size: auto, ${s};
  background-repeat: no-repeat, ${p};
  background-position: center;
  ${c}
}
`;
}
export {
  S as M,
  w as S,
  y as T,
  v as V,
  f as a,
  L as b,
  d as i,
  x as n,
  h as o,
  M as p,
  U as w
};
