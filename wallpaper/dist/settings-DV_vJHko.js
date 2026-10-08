const c = /* @__PURE__ */ new Set();
function f(t) {
  return c.add(t), () => c.delete(t);
}
function b() {
  for (const t of [...c]) t();
}
const o = {
  paneOpacity: 80,
  dim: 20,
  blur: 0,
  fit: "cover"
}, u = 40, d = 25 * 1024 * 1024, g = "settings", s = ["cover", "contain", "tile"];
function i(t, n, r, e) {
  const a = typeof t == "number" && Number.isFinite(t) ? t : e;
  return Math.min(r, Math.max(n, Math.round(a)));
}
function m(t) {
  const n = t && typeof t == "object" ? t : {}, r = typeof n.url == "string" ? n.url.trim() : "";
  let e = n.source === "file" || n.source === "url" ? n.source : null;
  return e === "url" && !l(r) && (e = null), {
    source: e,
    url: r,
    paneOpacity: i(n.paneOpacity, 0, 100, o.paneOpacity),
    dim: i(n.dim, 0, 100, o.dim),
    blur: i(n.blur, 0, u, o.blur),
    fit: s.includes(n.fit) ? n.fit : o.fit,
    revision: i(n.revision, 0, Number.MAX_SAFE_INTEGER, 0)
  };
}
function l(t) {
  try {
    return /^https?:$/.test(new URL(t).protocol);
  } catch {
    return !1;
  }
}
function p(t) {
  return `url("${t.replace(/["\\\n\r]/g, (n) => `\\${n.charCodeAt(0).toString(16)} `)}")`;
}
function $(t, n) {
  if (!n) return "";
  const r = t.fit === "tile" ? "auto" : t.fit, e = t.fit === "tile" ? "repeat" : "no-repeat", a = t.blur > 0 ? `-${t.blur * 2}px` : "0";
  return `
.app { isolation: isolate;${t.blur > 0 ? " overflow: hidden;" : ""} }
.app::before {
  content: "";
  position: absolute;
  inset: ${a};
  z-index: -1;
  pointer-events: none;
  background-image: linear-gradient(rgba(0, 0, 0, ${t.dim / 100}), rgba(0, 0, 0, ${t.dim / 100})), ${p(n)};
  background-size: auto, ${r};
  background-repeat: no-repeat, ${e};
  background-position: center;
  ${t.blur > 0 ? `filter: blur(${t.blur}px);` : ""}
}
.pane { background: color-mix(in srgb, var(--bg) ${t.paneOpacity}%, transparent); }
`;
}
export {
  d as M,
  g as S,
  u as a,
  $ as b,
  l as i,
  b as n,
  f as o,
  m as p
};
