import { S as c, o as p, p as m, w as f, b as v, V as h } from "./settings-D_3eE5sp.js";
function g(a) {
  const o = document.createElement("style");
  o.dataset.specterm = "wallpaper", document.head.appendChild(o);
  let e = null;
  function i() {
    e && (e.pause(), e.removeAttribute("src"), e.load(), e.remove(), e = null);
  }
  function l(t) {
    const n = document.querySelector(".app");
    n && (e || (e = document.createElement("video"), e.className = h, e.muted = !0, e.loop = !0, e.autoplay = !0, e.playsInline = !0, e.setAttribute("aria-hidden", "true"), e.addEventListener("error", () => console.error("[wallpaper] could not play", e?.src))), e.parentElement !== n && n.prepend(e), e.src !== t && (e.src = t), document.hidden || e.play().catch(() => {
    }));
  }
  function r() {
    const t = m(a.storage.get(c)), n = f(t);
    n?.media === "video" ? l(n.url) : i(), o.textContent = v(t, n);
  }
  const s = () => {
    e && (document.hidden ? e.pause() : e.play().catch(() => {
    }));
  };
  document.addEventListener("visibilitychange", s), r();
  const d = a.storage.onChange((t) => {
    t === c && r();
  }), u = p(r);
  return () => {
    d(), u(), document.removeEventListener("visibilitychange", s), o.remove(), i();
  };
}
export {
  g as activate
};
