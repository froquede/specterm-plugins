import { S as u, o as g, p as v, b as m } from "./settings-DV_vJHko.js";
function y(l) {
  const r = document.createElement("style");
  r.dataset.specterm = "wallpaper", document.head.appendChild(r);
  let t = null, a = -1, i = 0;
  function s() {
    t && URL.revokeObjectURL(t), t = null, a = -1;
  }
  async function f(o) {
    if (t && a === o.revision) return t;
    const e = await l.invoke("get");
    if (typeof e != "string") return null;
    const n = await (await fetch(e)).blob();
    return s(), t = URL.createObjectURL(n), a = o.revision, t;
  }
  async function c() {
    const o = ++i, e = v(l.storage.get(u));
    let n = null;
    try {
      e.source === "file" ? n = await f(e) : e.source === "url" && (n = e.url);
    } catch (p) {
      console.error("[wallpaper] could not load the image:", p);
    }
    o === i && (e.source !== "file" && s(), r.textContent = m(e, n));
  }
  c();
  const d = l.storage.onChange((o) => {
    o === u && c();
  }), b = g(() => void c());
  return () => {
    i++, d(), b(), r.remove(), s();
  };
}
export {
  y as activate
};
