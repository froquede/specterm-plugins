import { p as oe, S as Q, M as pe, i as Ke, n as Xe, a as qe } from "./settings-DV_vJHko.js";
const He = !1, Ye = (e, t) => e === t, ee = Symbol("solid-proxy"), xe = typeof Proxy == "function", Qe = Symbol("solid-track"), te = {
  equals: Ye
};
let Je = Oe;
const M = 1, ne = 2, Ee = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var b = null;
let ce = null, Ze = null, m = null, v = null, D = null, le = 0;
function Z(e, t) {
  const n = m, i = b, l = e.length === 0, r = t === void 0 ? i : t, o = l ? Ee : {
    owned: null,
    cleanups: null,
    context: r ? r.context : null,
    owner: r
  }, s = l ? e : () => e(() => T(() => K(o)));
  b = o, m = null;
  try {
    return H(s, !0);
  } finally {
    m = n, b = i;
  }
}
function z(e, t) {
  t = t ? Object.assign({}, te, t) : te;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, i = (l) => (typeof l == "function" && (l = l(n.value)), Te(n, l));
  return [Pe.bind(n), i];
}
function x(e, t, n) {
  const i = Ne(e, t, !1, M);
  re(i);
}
function C(e, t, n) {
  n = n ? Object.assign({}, te, n) : te;
  const i = Ne(e, t, !0, 0);
  return i.observers = null, i.observerSlots = null, i.comparator = n.equals || void 0, re(i), Pe.bind(i);
}
function T(e) {
  if (m === null) return e();
  const t = m;
  m = null;
  try {
    return e();
  } finally {
    m = t;
  }
}
function Ce(e) {
  return b === null || (b.cleanups === null ? b.cleanups = [e] : b.cleanups.push(e)), e;
}
function et(e, t) {
  const n = Symbol("context");
  return {
    id: n,
    Provider: rt(n),
    defaultValue: e
  };
}
function tt(e) {
  let t;
  return b && b.context && (t = b.context[e.id]) !== void 0 ? t : e.defaultValue;
}
function nt(e) {
  const t = C(e), n = C(() => de(t()));
  return n.toArray = () => {
    const i = n();
    return Array.isArray(i) ? i : i != null ? [i] : [];
  }, n;
}
function Pe() {
  if (this.sources && this.state)
    if (this.state === M) re(this);
    else {
      const e = v;
      v = null, H(() => ie(this), !1), v = e;
    }
  if (m) {
    const e = this.observers;
    if (!e || e[e.length - 1] !== m) {
      const t = e ? e.length : 0;
      m.sources ? (m.sources.push(this), m.sourceSlots.push(t)) : (m.sources = [this], m.sourceSlots = [t]), e ? (e.push(m), this.observerSlots.push(m.sources.length - 1)) : (this.observers = [m], this.observerSlots = [m.sources.length - 1]);
    }
  }
  return this.value;
}
function Te(e, t, n) {
  let i = e.value;
  return (!e.comparator || !e.comparator(i, t)) && (e.value = t, e.observers && e.observers.length && H(() => {
    for (let l = 0; l < e.observers.length; l += 1) {
      const r = e.observers[l], o = ce && ce.running;
      o && ce.disposed.has(r), (o ? !r.tState : !r.state) && (r.pure ? v.push(r) : D.push(r), r.observers && Ie(r)), o || (r.state = M);
    }
    if (v.length > 1e6)
      throw v = [], new Error();
  }, !1)), t;
}
function re(e) {
  if (!e.fn) return;
  K(e);
  const t = le;
  it(e, e.value, t);
}
function it(e, t, n) {
  let i;
  const l = b, r = m;
  m = b = e;
  try {
    i = e.fn(t);
  } catch (o) {
    return e.pure && (e.state = M, e.owned && e.owned.forEach(K), e.owned = null), e.updatedAt = n + 1, Le(o);
  } finally {
    m = r, b = l;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? Te(e, i) : e.value = i, e.updatedAt = n);
}
function Ne(e, t, n, i = M, l) {
  const r = {
    fn: e,
    state: i,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: t,
    owner: b,
    context: b ? b.context : null,
    pure: n
  };
  return b === null || b !== Ee && (b.owned ? b.owned.push(r) : b.owned = [r]), r;
}
function _e(e) {
  if (e.state === 0) return;
  if (e.state === ne) return ie(e);
  if (e.suspense && T(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < le); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === M)
      re(e);
    else if (e.state === ne) {
      const i = v;
      v = null, H(() => ie(e, t[0]), !1), v = i;
    }
}
function H(e, t) {
  if (v) return e();
  let n = !1;
  t || (v = []), D ? n = !0 : D = [], le++;
  try {
    const i = e();
    return st(n), i;
  } catch (i) {
    n || (D = null), v = null, Le(i);
  }
}
function st(e) {
  if (v && (Oe(v), v = null), e) return;
  const t = D;
  D = null, t.length && H(() => Je(t), !1);
}
function Oe(e) {
  for (let t = 0; t < e.length; t++) _e(e[t]);
}
function ie(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const i = e.sources[n];
    if (i.sources) {
      const l = i.state;
      l === M ? i !== t && (!i.updatedAt || i.updatedAt < le) && _e(i) : l === ne && ie(i, t);
    }
  }
}
function Ie(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = ne, n.pure ? v.push(n) : D.push(n), n.observers && Ie(n));
  }
}
function K(e) {
  let t;
  if (e.sources)
    for (; e.sources.length; ) {
      const n = e.sources.pop(), i = e.sourceSlots.pop(), l = n.observers;
      if (l && l.length) {
        const r = l.pop(), o = n.observerSlots.pop();
        i < l.length && (r.sourceSlots[o] = i, l[i] = r, n.observerSlots[i] = o);
      }
    }
  if (e.tOwned) {
    for (t = e.tOwned.length - 1; t >= 0; t--) K(e.tOwned[t]);
    delete e.tOwned;
  }
  if (e.owned) {
    for (t = e.owned.length - 1; t >= 0; t--) K(e.owned[t]);
    e.owned = null;
  }
  if (e.cleanups) {
    for (t = e.cleanups.length - 1; t >= 0; t--) e.cleanups[t]();
    e.cleanups = null;
  }
  e.state = 0;
}
function lt(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function Le(e, t = b) {
  throw lt(e);
}
function de(e) {
  if (typeof e == "function" && !e.length) return de(e());
  if (Array.isArray(e)) {
    const t = [];
    for (let n = 0; n < e.length; n++) {
      const i = de(e[n]);
      if (Array.isArray(i))
        if (i.length < 32768) t.push.apply(t, i);
        else for (let l = 0; l < i.length; l++) t.push(i[l]);
      else
        t.push(i);
    }
    return t;
  }
  return e;
}
function rt(e, t) {
  return function(i) {
    let l;
    return x(() => l = T(() => (b.context = {
      ...b.context,
      [e]: i.value
    }, nt(() => i.children))), void 0), l;
  };
}
const ot = Symbol("fallback");
function Se(e) {
  for (let t = 0; t < e.length; t++) e[t]();
}
function ct(e, t, n = {}) {
  let i = [], l = [], r = [], o = 0, s = t.length > 1 ? [] : null;
  return Ce(() => Se(r)), () => {
    let c = e() || [], u = c.length, f, a;
    return c[Qe], T(() => {
      let w, p, A, N, R, k, $, h, g;
      if (u === 0)
        o !== 0 && (Se(r), r = [], i = [], l = [], o = 0, s && (s = [])), n.fallback && (i = [ot], l[0] = Z((_) => (r[0] = _, n.fallback())), o = 1);
      else if (o === 0) {
        for (l = new Array(u), a = 0; a < u; a++)
          i[a] = c[a], l[a] = Z(d);
        o = u;
      } else {
        for (A = new Array(u), N = new Array(u), s && (R = new Array(u)), k = 0, $ = Math.min(o, u); k < $ && i[k] === c[k]; k++) ;
        for ($ = o - 1, h = u - 1; $ >= k && h >= k && i[$] === c[h]; $--, h--)
          A[h] = l[$], N[h] = r[$], s && (R[h] = s[$]);
        for (w = /* @__PURE__ */ new Map(), p = new Array(h + 1), a = h; a >= k; a--)
          g = c[a], f = w.get(g), p[a] = f === void 0 ? -1 : f, w.set(g, a);
        for (f = k; f <= $; f++)
          g = i[f], a = w.get(g), a !== void 0 && a !== -1 ? (A[a] = l[f], N[a] = r[f], s && (R[a] = s[f]), a = p[a], w.set(g, a)) : r[f]();
        for (a = k; a < u; a++)
          a in A ? (l[a] = A[a], r[a] = N[a], s && (s[a] = R[a], s[a](a))) : l[a] = Z(d);
        l = l.slice(0, o = u), i = c.slice(0);
      }
      return l;
    });
    function d(w) {
      if (r[a] = w, s) {
        const [p, A] = z(a);
        return s[a] = A, t(c[a], p);
      }
      return t(c[a]);
    }
  };
}
function E(e, t) {
  return T(() => e(t || {}));
}
function J() {
  return !0;
}
const he = {
  get(e, t, n) {
    return t === ee ? n : e.get(t);
  },
  has(e, t) {
    return t === ee ? !0 : e.has(t);
  },
  set: J,
  deleteProperty: J,
  getOwnPropertyDescriptor(e, t) {
    return {
      configurable: !0,
      enumerable: !0,
      get() {
        return e.get(t);
      },
      set: J,
      deleteProperty: J
    };
  },
  ownKeys(e) {
    return e.keys();
  }
};
function ae(e) {
  return (e = typeof e == "function" ? e() : e) ? e : {};
}
function at() {
  for (let e = 0, t = this.length; e < t; ++e) {
    const n = this[e]();
    if (n !== void 0) return n;
  }
}
function se(...e) {
  let t = !1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o];
    t = t || !!s && ee in s, e[o] = typeof s == "function" ? (t = !0, C(s)) : s;
  }
  if (xe && t)
    return new Proxy({
      get(o) {
        for (let s = e.length - 1; s >= 0; s--) {
          const c = ae(e[s])[o];
          if (c !== void 0) return c;
        }
      },
      has(o) {
        for (let s = e.length - 1; s >= 0; s--)
          if (o in ae(e[s])) return !0;
        return !1;
      },
      keys() {
        const o = [];
        for (let s = 0; s < e.length; s++) o.push(...Object.keys(ae(e[s])));
        return [...new Set(o)];
      }
    }, he);
  const n = {}, i = /* @__PURE__ */ Object.create(null);
  for (let o = e.length - 1; o >= 0; o--) {
    const s = e[o];
    if (!s) continue;
    const c = Object.getOwnPropertyNames(s);
    for (let u = c.length - 1; u >= 0; u--) {
      const f = c[u];
      if (f === "__proto__" || f === "constructor") continue;
      const a = Object.getOwnPropertyDescriptor(s, f);
      if (!i[f])
        i[f] = a.get ? {
          enumerable: !0,
          configurable: !0,
          get: at.bind(n[f] = [a.get.bind(s)])
        } : a.value !== void 0 ? a : void 0;
      else {
        const d = n[f];
        d && (a.get ? d.push(a.get.bind(s)) : a.value !== void 0 && d.push(() => a.value));
      }
    }
  }
  const l = {}, r = Object.keys(i);
  for (let o = r.length - 1; o >= 0; o--) {
    const s = r[o], c = i[s];
    c && c.get ? Object.defineProperty(l, s, c) : l[s] = c ? c.value : void 0;
  }
  return l;
}
function De(e, ...t) {
  const n = t.length;
  if (xe && ee in e) {
    const l = n > 1 ? t.flat() : t[0], r = /* @__PURE__ */ new Set(), o = t.map((s) => {
      const c = s.filter((u) => !r.has(u) && (r.add(u), !0));
      return new Proxy({
        get(u) {
          return c.includes(u) ? e[u] : void 0;
        },
        has(u) {
          return c.includes(u) && u in e;
        },
        keys() {
          return c.filter((u) => u in e);
        }
      }, he);
    });
    return o.push(new Proxy({
      get(s) {
        return l.includes(s) ? void 0 : e[s];
      },
      has(s) {
        return l.includes(s) ? !1 : s in e;
      },
      keys() {
        return Object.keys(e).filter((s) => !l.includes(s));
      }
    }, he)), o;
  }
  const i = [];
  for (let l = 0; l <= n; l++)
    i[l] = {};
  for (const l of Object.getOwnPropertyNames(e)) {
    let r = n;
    for (let c = 0; c < t.length; c++)
      if (t[c].includes(l)) {
        r = c;
        break;
      }
    const o = Object.getOwnPropertyDescriptor(e, l);
    !o.get && !o.set && o.enumerable && o.writable && o.configurable ? i[r][l] = o.value : Object.defineProperty(i[r], l, o);
  }
  return i;
}
const ut = (e) => `Stale read from <${e}>.`;
function Me(e) {
  const t = "fallback" in e && {
    fallback: () => e.fallback
  };
  return C(ct(() => e.each, e.children, t || void 0));
}
function ue(e) {
  const t = e.keyed, n = C(() => e.when, void 0, void 0), i = t ? n : C(n, void 0, {
    equals: (l, r) => !l == !r
  });
  return C(() => {
    const l = i();
    if (l) {
      const r = e.children;
      return typeof r == "function" && r.length > 0 ? T(() => r(t ? l : () => {
        if (!T(i)) throw ut("Show");
        return n();
      })) : r;
    }
    return e.fallback;
  }, void 0, void 0);
}
const ft = [
  "allowfullscreen",
  "async",
  "alpha",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
  "adauctionheaders",
  "browsingtopics",
  "credentialless",
  "defaultchecked",
  "defaultmuted",
  "defaultselected",
  "defer",
  "disablepictureinpicture",
  "disableremoteplayback",
  "preservespitch",
  "shadowrootclonable",
  "shadowrootcustomelementregistry",
  "shadowrootdelegatesfocus",
  "shadowrootserializable",
  "sharedstoragewritable"
], dt = /* @__PURE__ */ new Set([
  "className",
  "value",
  "readOnly",
  "noValidate",
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  "adAuctionHeaders",
  "allowFullscreen",
  "browsingTopics",
  "defaultChecked",
  "defaultMuted",
  "defaultSelected",
  "disablePictureInPicture",
  "disableRemotePlayback",
  "preservesPitch",
  "shadowRootClonable",
  "shadowRootCustomElementRegistry",
  "shadowRootDelegatesFocus",
  "shadowRootSerializable",
  "sharedStorageWritable",
  ...ft
]), ht = /* @__PURE__ */ new Set(["innerHTML", "textContent", "innerText", "children"]), gt = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
}), wt = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  class: "className",
  novalidate: {
    $: "noValidate",
    FORM: 1
  },
  formnovalidate: {
    $: "formNoValidate",
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: "isMap",
    IMG: 1
  },
  nomodule: {
    $: "noModule",
    SCRIPT: 1
  },
  playsinline: {
    $: "playsInline",
    VIDEO: 1
  },
  readonly: {
    $: "readOnly",
    INPUT: 1,
    TEXTAREA: 1
  },
  adauctionheaders: {
    $: "adAuctionHeaders",
    IFRAME: 1
  },
  allowfullscreen: {
    $: "allowFullscreen",
    IFRAME: 1
  },
  browsingtopics: {
    $: "browsingTopics",
    IMG: 1
  },
  defaultchecked: {
    $: "defaultChecked",
    INPUT: 1
  },
  defaultmuted: {
    $: "defaultMuted",
    AUDIO: 1,
    VIDEO: 1
  },
  defaultselected: {
    $: "defaultSelected",
    OPTION: 1
  },
  disablepictureinpicture: {
    $: "disablePictureInPicture",
    VIDEO: 1
  },
  disableremoteplayback: {
    $: "disableRemotePlayback",
    AUDIO: 1,
    VIDEO: 1
  },
  preservespitch: {
    $: "preservesPitch",
    AUDIO: 1,
    VIDEO: 1
  },
  shadowrootclonable: {
    $: "shadowRootClonable",
    TEMPLATE: 1
  },
  shadowrootdelegatesfocus: {
    $: "shadowRootDelegatesFocus",
    TEMPLATE: 1
  },
  shadowrootserializable: {
    $: "shadowRootSerializable",
    TEMPLATE: 1
  },
  sharedstoragewritable: {
    $: "sharedStorageWritable",
    IFRAME: 1,
    IMG: 1
  }
});
function bt(e, t) {
  const n = wt[e];
  return typeof n == "object" ? n[t] ? n.$ : void 0 : n;
}
const yt = /* @__PURE__ */ new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]), mt = /* @__PURE__ */ new Set([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern"
]), pt = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};
function St(e, t, n) {
  let i = n.length, l = t.length, r = i, o = 0, s = 0, c = t[l - 1].nextSibling, u = null;
  for (; o < l || s < r; ) {
    if (t[o] === n[s]) {
      o++, s++;
      continue;
    }
    for (; t[l - 1] === n[r - 1]; )
      l--, r--;
    if (l === o) {
      const f = r < i ? s ? n[s - 1].nextSibling : n[r - s] : c;
      for (; s < r; ) e.insertBefore(n[s++], f);
    } else if (r === s)
      for (; o < l; )
        (!u || !u.has(t[o])) && t[o].remove(), o++;
    else if (t[o] === n[r - 1] && n[s] === t[l - 1]) {
      const f = t[--l].nextSibling;
      e.insertBefore(n[s++], t[o++].nextSibling), e.insertBefore(n[--r], f), t[l] = n[r];
    } else {
      if (!u) {
        u = /* @__PURE__ */ new Map();
        let a = s;
        for (; a < r; ) u.set(n[a], a++);
      }
      const f = u.get(t[o]);
      if (f != null)
        if (s < f && f < r) {
          let a = o, d = 1, w;
          for (; ++a < l && a < r && !((w = u.get(t[a])) == null || w !== f + d); )
            d++;
          if (d > f - s) {
            const p = t[o];
            for (; s < f; ) e.insertBefore(n[s++], p);
          } else e.replaceChild(n[s++], t[o++]);
        } else o++;
      else t[o++].remove();
    }
  }
}
const ve = "_$DX_DELEGATE";
function vt(e, t, n, i = {}) {
  let l;
  return Z((r) => {
    l = r, t === document ? e() : S(t, e(), t.firstChild ? null : void 0, n);
  }, i.owner), () => {
    l(), t.textContent = "";
  };
}
function j(e, t, n, i) {
  let l;
  const r = () => {
    const s = document.createElement("template");
    return s.innerHTML = e, s.content.firstChild;
  }, o = () => (l || (l = r())).cloneNode(!0);
  return o.cloneNode = o, o;
}
function je(e, t = window.document) {
  const n = t[ve] || (t[ve] = /* @__PURE__ */ new Set());
  for (let i = 0, l = e.length; i < l; i++) {
    const r = e[i];
    n.has(r) || (n.add(r), t.addEventListener(r, Nt));
  }
}
function X(e, t, n) {
  n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function $t(e, t, n, i) {
  i == null ? e.removeAttributeNS(t, n) : e.setAttributeNS(t, n, i);
}
function At(e, t, n) {
  n ? e.setAttribute(t, "") : e.removeAttribute(t);
}
function kt(e, t) {
  t == null ? e.removeAttribute("class") : e.className = t;
}
function xt(e, t, n, i) {
  if (i)
    Array.isArray(n) ? (e[`$$${t}`] = n[0], e[`$$${t}Data`] = n[1]) : e[`$$${t}`] = n;
  else if (Array.isArray(n)) {
    const l = n[0];
    e.addEventListener(t, n[0] = (r) => l.call(e, n[1], r));
  } else e.addEventListener(t, n, typeof n != "function" && n);
}
function Et(e, t, n = {}) {
  const i = Object.keys(t || {}), l = Object.keys(n);
  let r, o;
  for (r = 0, o = l.length; r < o; r++) {
    const s = l[r];
    !s || s === "undefined" || t[s] || ($e(e, s, !1), delete n[s]);
  }
  for (r = 0, o = i.length; r < o; r++) {
    const s = i[r], c = !!t[s];
    !s || s === "undefined" || n[s] === c || !c || ($e(e, s, !0), n[s] = c);
  }
  return n;
}
function Ct(e, t, n) {
  if (!t) return n ? X(e, "style") : t;
  const i = e.style;
  if (typeof t == "string") return i.cssText = t;
  typeof n == "string" && (i.cssText = n = void 0), n || (n = {}), t || (t = {});
  let l, r;
  for (r in n)
    t[r] == null && i.removeProperty(r), delete n[r];
  for (r in t)
    l = t[r], l !== n[r] && (i.setProperty(r, l), n[r] = l);
  return n;
}
function Re(e, t = {}, n, i) {
  const l = {};
  return i || x(() => l.children = q(e, t.children, l.children)), x(() => typeof t.ref == "function" && Be(t.ref, e)), x(() => Pt(e, t, n, !0, l, !0)), l;
}
function Be(e, t, n) {
  return T(() => e(t, n));
}
function S(e, t, n, i) {
  if (n !== void 0 && !i && (i = []), typeof t != "function") return q(e, t, i, n);
  x((l) => q(e, t(), l, n), i);
}
function Pt(e, t, n, i, l = {}, r = !1) {
  t || (t = {});
  for (const o in l)
    if (!(o in t)) {
      if (o === "children") continue;
      l[o] = Ae(e, o, null, l[o], n, r, t);
    }
  for (const o in t) {
    if (o === "children")
      continue;
    const s = t[o];
    l[o] = Ae(e, o, s, l[o], n, r, t);
  }
}
function Tt(e) {
  return e.toLowerCase().replace(/-([a-z])/g, (t, n) => n.toUpperCase());
}
function $e(e, t, n) {
  const i = t.trim().split(/\s+/);
  for (let l = 0, r = i.length; l < r; l++) e.classList.toggle(i[l], n);
}
function Ae(e, t, n, i, l, r, o) {
  let s, c, u, f, a;
  if (t === "style") return Ct(e, n, i);
  if (t === "classList") return Et(e, n, i);
  if (n === i) return i;
  if (t === "ref")
    r || n(e);
  else if (t.slice(0, 3) === "on:") {
    const d = t.slice(3);
    i && e.removeEventListener(d, i, typeof i != "function" && i), n && e.addEventListener(d, n, typeof n != "function" && n);
  } else if (t.slice(0, 10) === "oncapture:") {
    const d = t.slice(10);
    i && e.removeEventListener(d, i, !0), n && e.addEventListener(d, n, !0);
  } else if (t.slice(0, 2) === "on") {
    const d = t.slice(2).toLowerCase(), w = yt.has(d);
    if (!w && i) {
      const p = Array.isArray(i) ? i[0] : i;
      e.removeEventListener(d, p);
    }
    (w || n) && (xt(e, d, n, w), w && je([d]));
  } else if (t.slice(0, 5) === "attr:")
    X(e, t.slice(5), n);
  else if (t.slice(0, 5) === "bool:")
    At(e, t.slice(5), n);
  else if ((a = t.slice(0, 5) === "prop:") || (u = ht.has(t)) || !l && ((f = bt(t, e.tagName)) || (c = dt.has(t))) || (s = e.nodeName.includes("-") || "is" in o))
    a && (t = t.slice(5), c = !0), t === "class" || t === "className" ? kt(e, n) : s && !c && !u ? e[Tt(t)] = n : (t === "value" || t === "defaultValue") && (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA") ? e[f || t] = n ?? "" : e[f || t] = n;
  else {
    const d = l && t.indexOf(":") > -1 && pt[t.split(":")[0]];
    d ? $t(e, d, t, n) : X(e, gt[t] || t, n);
  }
  return n;
}
function Nt(e) {
  let t = e.target;
  const n = `$$${e.type}`, i = e.target, l = e.currentTarget, r = (c) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: c
  }), o = () => {
    const c = t[n];
    if (c && !t.disabled) {
      const u = t[`${n}Data`];
      if (u !== void 0 ? c.call(t, u, e) : c.call(t, e), e.cancelBubble) return;
    }
    return t.host && typeof t.host != "string" && !t.host._$host && t.contains(e.target) && r(t.host), !0;
  }, s = () => {
    for (; o() && (t = t._$host || t.parentNode || t.host); ) ;
  };
  Object.defineProperty(e, "currentTarget", {
    configurable: !0,
    get() {
      return t || document;
    }
  });
  try {
    if (e.composedPath) {
      const c = e.composedPath();
      r(c[0]);
      for (let u = 0; u < c.length - 2 && (t = c[u], !!o()); u++) {
        if (t._$host) {
          t = t._$host, s();
          break;
        }
        if (t.parentNode === l)
          break;
      }
    } else s();
    r(i);
  } finally {
    e = t = null;
  }
}
function q(e, t, n, i, l) {
  for (; typeof n == "function"; ) n = n();
  if (t === n) return n;
  const r = typeof t, o = i !== void 0;
  if (e = o && n[0] && n[0].parentNode || e, r === "string" || r === "number") {
    if (r === "number" && (t = t.toString(), t === n))
      return n;
    if (o) {
      let s = n[0];
      s && s.nodeType === 3 ? s.data !== t && (s.data = t) : s = document.createTextNode(t), n = U(e, n, i, s);
    } else
      n !== "" && typeof n == "string" ? n = e.firstChild.data = t : n = e.textContent = t;
  } else if (t == null || r === "boolean")
    n = U(e, n, i);
  else {
    if (r === "function")
      return x(() => {
        let s = t();
        for (; typeof s == "function"; ) s = s();
        n = q(e, s, n, i);
      }), () => n;
    if (Array.isArray(t)) {
      const s = [], c = n && Array.isArray(n);
      if (ge(s, t, n, l))
        return x(() => n = q(e, s, n, i, !0)), () => n;
      if (s.length === 0) {
        if (n = U(e, n, i), o) return n;
      } else c ? n.length === 0 ? ke(e, s, i) : St(e, n, s) : (n && U(e), ke(e, s));
      n = s;
    } else if (t.nodeType) {
      if (Array.isArray(n)) {
        if (o) return n = U(e, n, i, t);
        U(e, n, null, t);
      } else n == null || n === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
      n = t;
    }
  }
  return n;
}
function ge(e, t, n, i) {
  let l = !1;
  for (let r = 0, o = t.length; r < o; r++) {
    let s = t[r], c = n && n[e.length], u;
    if (!(s == null || s === !0 || s === !1)) if ((u = typeof s) == "object" && s.nodeType)
      e.push(s);
    else if (Array.isArray(s))
      l = ge(e, s, c) || l;
    else if (u === "function")
      if (i) {
        for (; typeof s == "function"; ) s = s();
        l = ge(e, Array.isArray(s) ? s : [s], Array.isArray(c) ? c : [c]) || l;
      } else
        e.push(s), l = !0;
    else {
      const f = String(s);
      c && c.nodeType === 3 && c.data === f ? e.push(c) : e.push(document.createTextNode(f));
    }
  }
  return l;
}
function ke(e, t, n = null) {
  for (let i = 0, l = t.length; i < l; i++) e.insertBefore(t[i], n);
}
function U(e, t, n, i) {
  if (n === void 0) return e.textContent = "";
  const l = i || document.createTextNode("");
  if (t.length) {
    let r = !1;
    for (let o = t.length - 1; o >= 0; o--) {
      const s = t[o];
      if (l !== s) {
        const c = s.parentNode === e;
        !r && !o ? c ? e.replaceChild(l, s) : e.insertBefore(l, n) : c && s.remove();
      } else r = !0;
    }
  } else e.insertBefore(l, n);
  return [l];
}
const _t = "http://www.w3.org/2000/svg";
function Ot(e, t = !1, n = void 0) {
  return t ? document.createElementNS(_t, e) : document.createElement(e, {
    is: n
  });
}
function It(e, t) {
  const n = C(e);
  return C(() => {
    const i = n();
    switch (typeof i) {
      case "function":
        return T(() => i(t));
      case "string":
        const l = mt.has(i), r = Ot(i, l, T(() => t.is));
        return Re(r, t, l), r;
    }
  });
}
function Lt(e) {
  const [, t] = De(e, ["component"]);
  return It(() => e.component, t);
}
var Dt = et({
  size: 24,
  color: "currentColor",
  strokeWidth: 2,
  absoluteStrokeWidth: !1,
  nonScalingStroke: !1,
  class: ""
}), Mt = /* @__PURE__ */ j("<svg>"), jt = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, L = jt, we = (...e) => e.filter((t, n, i) => !!t && t.trim() !== "" && i.indexOf(t) === n).join(" ").trim();
function fe(e) {
  return e != null;
}
function Rt(e, t = {}) {
  const n = t.attributeNames ?? {}, i = (d) => n[d] ?? d, l = e.size ?? e.width ?? L.width, r = e.size ?? e.height ?? L.height, o = e.aliases?.filter((d) => typeof d == "string" && d.trim() !== "").map((d) => `lucide-${d}`) ?? [], s = [...e.name ? [`lucide-${e.name}`] : [], ...o], c = t.className?.split(" ").filter(Boolean) ?? [], u = t.includeDefaultClasses === !1 ? we(...c) : we("lucide", ...s, ...c), f = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? L["stroke-width"]) * Number(e.size ?? e.width ?? L.width) / Number(t.size ?? t.width ?? L.width) : t.strokeWidth ?? L["stroke-width"];
  return ["svg", {
    ...Object.entries(L).reduce((d, [w, p]) => (d[i(w)] = p, d), {}),
    ..."color" in t && t.color && {
      [i("stroke")]: t.color
    },
    ..."size" in t && fe(t.size) && {
      [i("width")]: t.size,
      [i("height")]: t.size
    },
    ..."width" in t && fe(t.width) && {
      [i("width")]: t.width
    },
    ..."height" in t && fe(t.height) && {
      [i("height")]: t.height
    },
    [i("stroke-width")]: f,
    ...u && {
      [i("class")]: u
    },
    [i("viewBox")]: `0 0 ${l} ${r}`,
    ...t.hasA11yProp === !1 ? {
      [i("aria-hidden")]: "true"
    } : {},
    ..."attributes" in t && t.attributes
  }, e.node.map((d) => {
    const [w, p, A] = d, N = t.nonScalingStroke ? {
      [i("vector-effect")]: "non-scaling-stroke",
      ...p
    } : p;
    return A ? [w, N, A] : [w, N];
  })];
}
var Bt = Rt, Ft = (e) => {
  for (const t in e)
    if (t.startsWith("aria-") || t === "role" || t === "title")
      return !0;
  return !1;
}, Ut = (e) => {
  const [t, n] = De(e, ["color", "size", "width", "height", "strokeWidth", "children", "class", "icon", "iconNode", "absoluteStrokeWidth", "nonScalingStroke"]), i = tt(Dt), l = C(() => t.icon ?? {
    node: t.iconNode ?? [],
    size: 24,
    aliases: []
  }), r = C(() => Bt(l(), {
    color: t.color ?? i.color,
    width: t.width ?? t.size ?? i.size,
    height: t.height ?? t.size ?? i.size,
    strokeWidth: t.strokeWidth ?? i.strokeWidth,
    absoluteStrokeWidth: t.absoluteStrokeWidth ?? i.absoluteStrokeWidth,
    nonScalingStroke: t.nonScalingStroke ?? i.nonScalingStroke,
    className: we("lucide-icon", i.class, t.class),
    hasA11yProp: !!t.children || Ft(n),
    attributes: n
  }));
  return (() => {
    var o = Mt();
    return Re(o, se(() => r()[1]), !0, !0), S(o, E(Me, {
      get each() {
        return r()[2] ?? [];
      },
      children: ([s, c]) => E(Lt, se({
        component: s
      }, c))
    })), o;
  })();
}, Fe = Ut, Ue = {
  name: "image",
  size: 24,
  node: [["rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2",
    ry: "2",
    key: "1m3agn"
  }], ["circle", {
    cx: "9",
    cy: "9",
    r: "2",
    key: "af1f0g"
  }], ["path", {
    d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
    key: "1xmnt7"
  }]]
};
Ue.node;
var zt = (e) => E(Fe, se(e, {
  icon: Ue
})), Wt = zt, ze = {
  name: "x",
  size: 24,
  node: [["path", {
    d: "M18 6 6 18",
    key: "1bl5f8"
  }], ["path", {
    d: "m6 6 12 12",
    key: "d8bk6v"
  }]]
};
ze.node;
var Vt = (e) => E(Fe, se(e, {
  icon: ze
})), Gt = Vt, Kt = /* @__PURE__ */ j("<label class=wp-slider><span class=wp-slider-head><span></span><span class=wp-value></span></span><input type=range min=0>"), Xt = /* @__PURE__ */ j("<button class=wp-btn>Remove"), qt = /* @__PURE__ */ j("<div class=wp-error>"), Ht = /* @__PURE__ */ j('<div class=wp-panel><div class=wp-header><span class=wp-title>Wallpaper</span><button class=wp-icon-btn title=Close></button></div><div class=wp-scroll><div class=wp-preview></div><div class=wp-row><button class="wp-btn wp-btn-primary"></button><input type=file accept=image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml hidden></div><form class=wp-row><input class=wp-input type=url placeholder="or paste an image link"><button class=wp-btn type=submit>Use</button></form><div class=wp-section></div><div class=wp-section><span class=wp-label>Size</span><div class=wp-segmented>'), Yt = /* @__PURE__ */ j("<img alt>"), Qt = /* @__PURE__ */ j("<button class=wp-seg>");
const Jt = [{
  value: "cover",
  label: "Fill"
}, {
  value: "contain",
  label: "Fit"
}, {
  value: "tile",
  label: "Tile"
}];
function Zt(e) {
  return new Promise((t, n) => {
    const i = new FileReader();
    i.onload = () => t(String(i.result)), i.onerror = () => n(i.error ?? new Error("could not read the file")), i.readAsDataURL(e);
  });
}
function en(e) {
  const {
    api: t
  } = e, [n, i] = z(oe(t.storage.get(Q))), [l, r] = z(n().url), [o, s] = z(null), [c, u] = z(null), [f, a] = z(!1);
  let d;
  function w(h) {
    const g = oe({
      ...n(),
      ...h
    });
    try {
      t.storage.set(Q, g);
    } catch (_) {
      u(_ instanceof Error ? _.message : String(_));
      return;
    }
    i(g), Xe();
  }
  async function p() {
    const h = n();
    if (h.source === "url") return s(h.url);
    if (h.source !== "file") return s(null);
    try {
      const g = await t.invoke("get");
      s(typeof g == "string" ? g : null);
    } catch {
      s(null);
    }
  }
  p();
  const A = t.storage.onChange((h) => {
    h === Q && (i(oe(t.storage.get(Q))), r(n().url), p());
  });
  Ce(A);
  async function N(h) {
    if (h) {
      if (u(null), h.size > pe) return u(`The image is over ${pe / 1024 / 1024} MB.`);
      a(!0);
      try {
        await t.invoke("set", await Zt(h)), w({
          source: "file",
          revision: n().revision + 1
        }), await p();
      } catch (g) {
        u(g instanceof Error ? g.message : String(g));
      } finally {
        a(!1), d.value = "";
      }
    }
  }
  function R(h) {
    h.preventDefault();
    const g = l().trim();
    if (!Ke(g)) return u("Paste an http(s) link to an image.");
    u(null), w({
      source: "url",
      url: g
    }), s(g);
  }
  async function k() {
    u(null);
    const h = n().source === "file";
    w({
      source: null
    }), s(null), h && await t.invoke("clear").catch(() => {
    });
  }
  function $(h, g, _, Y) {
    return (() => {
      var W = Kt(), B = W.firstChild, F = B.firstChild, I = F.nextSibling, O = B.nextSibling;
      return S(F, h), S(I, () => n()[g], null), S(I, Y, null), O.$$input = (V) => w({
        [g]: Number(V.currentTarget.value)
      }), X(O, "max", _), x(() => O.value = n()[g]), W;
    })();
  }
  return (() => {
    var h = Ht(), g = h.firstChild, _ = g.firstChild, Y = _.nextSibling, W = g.nextSibling, B = W.firstChild, F = B.nextSibling, I = F.firstChild, O = I.nextSibling, V = F.nextSibling, be = V.firstChild, G = V.nextSibling, We = G.nextSibling, Ve = We.firstChild, Ge = Ve.nextSibling;
    Y.$$click = () => t.close(), S(Y, E(Gt, {
      size: 14
    })), S(B, E(ue, {
      get when() {
        return o();
      },
      get fallback() {
        return E(Wt, {
          size: 28
        });
      },
      children: (y) => (() => {
        var P = Yt();
        return x(() => X(P, "src", y())), P;
      })()
    })), I.$$click = () => d.click(), S(I, () => f() ? "Saving…" : "Choose image…"), S(F, E(ue, {
      get when() {
        return n().source;
      },
      get children() {
        var y = Xt();
        return y.$$click = k, y;
      }
    }), O), O.addEventListener("change", (y) => N(y.currentTarget.files?.[0]));
    var ye = d;
    return typeof ye == "function" ? Be(ye, O) : d = O, V.addEventListener("submit", R), be.$$input = (y) => r(y.currentTarget.value), S(W, E(ue, {
      get when() {
        return c();
      },
      get children() {
        var y = qt();
        return S(y, c), y;
      }
    }), G), S(G, () => $("Terminal background", "paneOpacity", 100, "%"), null), S(G, () => $("Dim image", "dim", 100, "%"), null), S(G, () => $("Blur", "blur", qe, "px"), null), S(Ge, E(Me, {
      each: Jt,
      children: (y) => (() => {
        var P = Qt();
        return P.$$click = () => w({
          fit: y.value
        }), S(P, () => y.label), x(() => P.classList.toggle("active", n().fit === y.value)), P;
      })()
    })), x((y) => {
      var P = !o(), me = f();
      return P !== y.e && B.classList.toggle("wp-preview-empty", y.e = P), me !== y.t && (I.disabled = y.t = me), y;
    }, {
      e: void 0,
      t: void 0
    }), x(() => be.value = l()), h;
  })();
}
function nn(e, t) {
  return vt(() => E(en, {
    api: t
  }), e);
}
je(["input", "click"]);
export {
  nn as mount
};
