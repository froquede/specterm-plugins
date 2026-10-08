import { T as ke, p as le, S as H, w as Ge, M as ye, i as Ke, n as Xe, a as qe } from "./settings-0UxQx4GH.js";
const He = !1, Ye = (e, t) => e === t, Q = Symbol("solid-proxy"), ve = typeof Proxy == "function", Je = Symbol("solid-track"), Z = {
  equals: Ye
};
let Qe = _e;
const F = 1, ee = 2, xe = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var w = null;
let re = null, Ze = null, m = null, A = null, B = null, ie = 0;
function J(e, t) {
  const n = m, i = w, l = e.length === 0, r = t === void 0 ? i : t, o = l ? xe : {
    owned: null,
    cleanups: null,
    context: r ? r.context : null,
    owner: r
  }, s = l ? e : () => e(() => T(() => K(o)));
  w = o, m = null;
  try {
    return q(s, !0);
  } finally {
    m = n, w = i;
  }
}
function G(e, t) {
  t = t ? Object.assign({}, Z, t) : Z;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, i = (l) => (typeof l == "function" && (l = l(n.value)), Ce(n, l));
  return [Pe.bind(n), i];
}
function v(e, t, n) {
  const i = Te(e, t, !1, F);
  se(i);
}
function C(e, t, n) {
  n = n ? Object.assign({}, Z, n) : Z;
  const i = Te(e, t, !0, 0);
  return i.observers = null, i.observerSlots = null, i.comparator = n.equals || void 0, se(i), Pe.bind(i);
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
function Ee(e) {
  return w === null || (w.cleanups === null ? w.cleanups = [e] : w.cleanups.push(e)), e;
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
  return w && w.context && (t = w.context[e.id]) !== void 0 ? t : e.defaultValue;
}
function nt(e) {
  const t = C(e), n = C(() => ue(t()));
  return n.toArray = () => {
    const i = n();
    return Array.isArray(i) ? i : i != null ? [i] : [];
  }, n;
}
function Pe() {
  if (this.sources && this.state)
    if (this.state === F) se(this);
    else {
      const e = A;
      A = null, q(() => te(this), !1), A = e;
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
function Ce(e, t, n) {
  let i = e.value;
  return (!e.comparator || !e.comparator(i, t)) && (e.value = t, e.observers && e.observers.length && q(() => {
    for (let l = 0; l < e.observers.length; l += 1) {
      const r = e.observers[l], o = re && re.running;
      o && re.disposed.has(r), (o ? !r.tState : !r.state) && (r.pure ? A.push(r) : B.push(r), r.observers && Oe(r)), o || (r.state = F);
    }
    if (A.length > 1e6)
      throw A = [], new Error();
  }, !1)), t;
}
function se(e) {
  if (!e.fn) return;
  K(e);
  const t = ie;
  it(e, e.value, t);
}
function it(e, t, n) {
  let i;
  const l = w, r = m;
  m = w = e;
  try {
    i = e.fn(t);
  } catch (o) {
    return e.pure && (e.state = F, e.owned && e.owned.forEach(K), e.owned = null), e.updatedAt = n + 1, Ie(o);
  } finally {
    m = r, w = l;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? Ce(e, i) : e.value = i, e.updatedAt = n);
}
function Te(e, t, n, i = F, l) {
  const r = {
    fn: e,
    state: i,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: t,
    owner: w,
    context: w ? w.context : null,
    pure: n
  };
  return w === null || w !== xe && (w.owned ? w.owned.push(r) : w.owned = [r]), r;
}
function Ne(e) {
  if (e.state === 0) return;
  if (e.state === ee) return te(e);
  if (e.suspense && T(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < ie); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === F)
      se(e);
    else if (e.state === ee) {
      const i = A;
      A = null, q(() => te(e, t[0]), !1), A = i;
    }
}
function q(e, t) {
  if (A) return e();
  let n = !1;
  t || (A = []), B ? n = !0 : B = [], ie++;
  try {
    const i = e();
    return st(n), i;
  } catch (i) {
    n || (B = null), A = null, Ie(i);
  }
}
function st(e) {
  if (A && (_e(A), A = null), e) return;
  const t = B;
  B = null, t.length && q(() => Qe(t), !1);
}
function _e(e) {
  for (let t = 0; t < e.length; t++) Ne(e[t]);
}
function te(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const i = e.sources[n];
    if (i.sources) {
      const l = i.state;
      l === F ? i !== t && (!i.updatedAt || i.updatedAt < ie) && Ne(i) : l === ee && te(i, t);
    }
  }
}
function Oe(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = ee, n.pure ? A.push(n) : B.push(n), n.observers && Oe(n));
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
function Ie(e, t = w) {
  throw lt(e);
}
function ue(e) {
  if (typeof e == "function" && !e.length) return ue(e());
  if (Array.isArray(e)) {
    const t = [];
    for (let n = 0; n < e.length; n++) {
      const i = ue(e[n]);
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
    return v(() => l = T(() => (w.context = {
      ...w.context,
      [e]: i.value
    }, nt(() => i.children))), void 0), l;
  };
}
const ot = Symbol("fallback");
function me(e) {
  for (let t = 0; t < e.length; t++) e[t]();
}
function ct(e, t, n = {}) {
  let i = [], l = [], r = [], o = 0, s = t.length > 1 ? [] : null;
  return Ee(() => me(r)), () => {
    let c = e() || [], u = c.length, f, a;
    return c[Je], T(() => {
      let b, S, x, N, O, g, h, p, E;
      if (u === 0)
        o !== 0 && (me(r), r = [], i = [], l = [], o = 0, s && (s = [])), n.fallback && (i = [ot], l[0] = J((L) => (r[0] = L, n.fallback())), o = 1);
      else if (o === 0) {
        for (l = new Array(u), a = 0; a < u; a++)
          i[a] = c[a], l[a] = J(d);
        o = u;
      } else {
        for (x = new Array(u), N = new Array(u), s && (O = new Array(u)), g = 0, h = Math.min(o, u); g < h && i[g] === c[g]; g++) ;
        for (h = o - 1, p = u - 1; h >= g && p >= g && i[h] === c[p]; h--, p--)
          x[p] = l[h], N[p] = r[h], s && (O[p] = s[h]);
        for (b = /* @__PURE__ */ new Map(), S = new Array(p + 1), a = p; a >= g; a--)
          E = c[a], f = b.get(E), S[a] = f === void 0 ? -1 : f, b.set(E, a);
        for (f = g; f <= h; f++)
          E = i[f], a = b.get(E), a !== void 0 && a !== -1 ? (x[a] = l[f], N[a] = r[f], s && (O[a] = s[f]), a = S[a], b.set(E, a)) : r[f]();
        for (a = g; a < u; a++)
          a in x ? (l[a] = x[a], r[a] = N[a], s && (s[a] = O[a], s[a](a))) : l[a] = J(d);
        l = l.slice(0, o = u), i = c.slice(0);
      }
      return l;
    });
    function d(b) {
      if (r[a] = b, s) {
        const [S, x] = G(a);
        return s[a] = x, t(c[a], S);
      }
      return t(c[a]);
    }
  };
}
function P(e, t) {
  return T(() => e(t || {}));
}
function Y() {
  return !0;
}
const fe = {
  get(e, t, n) {
    return t === Q ? n : e.get(t);
  },
  has(e, t) {
    return t === Q ? !0 : e.has(t);
  },
  set: Y,
  deleteProperty: Y,
  getOwnPropertyDescriptor(e, t) {
    return {
      configurable: !0,
      enumerable: !0,
      get() {
        return e.get(t);
      },
      set: Y,
      deleteProperty: Y
    };
  },
  ownKeys(e) {
    return e.keys();
  }
};
function oe(e) {
  return (e = typeof e == "function" ? e() : e) ? e : {};
}
function at() {
  for (let e = 0, t = this.length; e < t; ++e) {
    const n = this[e]();
    if (n !== void 0) return n;
  }
}
function ne(...e) {
  let t = !1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o];
    t = t || !!s && Q in s, e[o] = typeof s == "function" ? (t = !0, C(s)) : s;
  }
  if (ve && t)
    return new Proxy({
      get(o) {
        for (let s = e.length - 1; s >= 0; s--) {
          const c = oe(e[s])[o];
          if (c !== void 0) return c;
        }
      },
      has(o) {
        for (let s = e.length - 1; s >= 0; s--)
          if (o in oe(e[s])) return !0;
        return !1;
      },
      keys() {
        const o = [];
        for (let s = 0; s < e.length; s++) o.push(...Object.keys(oe(e[s])));
        return [...new Set(o)];
      }
    }, fe);
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
function Le(e, ...t) {
  const n = t.length;
  if (ve && Q in e) {
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
      }, fe);
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
    }, fe)), o;
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
function ce(e) {
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
          let a = o, d = 1, b;
          for (; ++a < l && a < r && !((b = u.get(t[a])) == null || b !== f + d); )
            d++;
          if (d > f - s) {
            const S = t[o];
            for (; s < f; ) e.insertBefore(n[s++], S);
          } else e.replaceChild(n[s++], t[o++]);
        } else o++;
      else t[o++].remove();
    }
  }
}
const pe = "_$DX_DELEGATE";
function $t(e, t, n, i = {}) {
  let l;
  return J((r) => {
    l = r, t === document ? e() : $(t, e(), t.firstChild ? null : void 0, n);
  }, i.owner), () => {
    l(), t.textContent = "";
  };
}
function I(e, t, n, i) {
  let l;
  const r = () => {
    const s = document.createElement("template");
    return s.innerHTML = e, s.content.firstChild;
  }, o = () => (l || (l = r())).cloneNode(!0);
  return o.cloneNode = o, o;
}
function De(e, t = window.document) {
  const n = t[pe] || (t[pe] = /* @__PURE__ */ new Set());
  for (let i = 0, l = e.length; i < l; i++) {
    const r = e[i];
    n.has(r) || (n.add(r), t.addEventListener(r, Nt));
  }
}
function j(e, t, n) {
  n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function At(e, t, n, i) {
  i == null ? e.removeAttributeNS(t, n) : e.setAttributeNS(t, n, i);
}
function kt(e, t, n) {
  n ? e.setAttribute(t, "") : e.removeAttribute(t);
}
function vt(e, t) {
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
    !s || s === "undefined" || t[s] || (Se(e, s, !1), delete n[s]);
  }
  for (r = 0, o = i.length; r < o; r++) {
    const s = i[r], c = !!t[s];
    !s || s === "undefined" || n[s] === c || !c || (Se(e, s, !0), n[s] = c);
  }
  return n;
}
function Pt(e, t, n) {
  if (!t) return n ? j(e, "style") : t;
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
function je(e, t = {}, n, i) {
  const l = {};
  return i || v(() => l.children = X(e, t.children, l.children)), v(() => typeof t.ref == "function" && Be(t.ref, e)), v(() => Ct(e, t, n, !0, l, !0)), l;
}
function Be(e, t, n) {
  return T(() => e(t, n));
}
function $(e, t, n, i) {
  if (n !== void 0 && !i && (i = []), typeof t != "function") return X(e, t, i, n);
  v((l) => X(e, t(), l, n), i);
}
function Ct(e, t, n, i, l = {}, r = !1) {
  t || (t = {});
  for (const o in l)
    if (!(o in t)) {
      if (o === "children") continue;
      l[o] = $e(e, o, null, l[o], n, r, t);
    }
  for (const o in t) {
    if (o === "children")
      continue;
    const s = t[o];
    l[o] = $e(e, o, s, l[o], n, r, t);
  }
}
function Tt(e) {
  return e.toLowerCase().replace(/-([a-z])/g, (t, n) => n.toUpperCase());
}
function Se(e, t, n) {
  const i = t.trim().split(/\s+/);
  for (let l = 0, r = i.length; l < r; l++) e.classList.toggle(i[l], n);
}
function $e(e, t, n, i, l, r, o) {
  let s, c, u, f, a;
  if (t === "style") return Pt(e, n, i);
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
    const d = t.slice(2).toLowerCase(), b = yt.has(d);
    if (!b && i) {
      const S = Array.isArray(i) ? i[0] : i;
      e.removeEventListener(d, S);
    }
    (b || n) && (xt(e, d, n, b), b && De([d]));
  } else if (t.slice(0, 5) === "attr:")
    j(e, t.slice(5), n);
  else if (t.slice(0, 5) === "bool:")
    kt(e, t.slice(5), n);
  else if ((a = t.slice(0, 5) === "prop:") || (u = ht.has(t)) || !l && ((f = bt(t, e.tagName)) || (c = dt.has(t))) || (s = e.nodeName.includes("-") || "is" in o))
    a && (t = t.slice(5), c = !0), t === "class" || t === "className" ? vt(e, n) : s && !c && !u ? e[Tt(t)] = n : (t === "value" || t === "defaultValue") && (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA") ? e[f || t] = n ?? "" : e[f || t] = n;
  else {
    const d = l && t.indexOf(":") > -1 && pt[t.split(":")[0]];
    d ? At(e, d, t, n) : j(e, gt[t] || t, n);
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
function X(e, t, n, i, l) {
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
      return v(() => {
        let s = t();
        for (; typeof s == "function"; ) s = s();
        n = X(e, s, n, i);
      }), () => n;
    if (Array.isArray(t)) {
      const s = [], c = n && Array.isArray(n);
      if (de(s, t, n, l))
        return v(() => n = X(e, s, n, i, !0)), () => n;
      if (s.length === 0) {
        if (n = U(e, n, i), o) return n;
      } else c ? n.length === 0 ? Ae(e, s, i) : St(e, n, s) : (n && U(e), Ae(e, s));
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
function de(e, t, n, i) {
  let l = !1;
  for (let r = 0, o = t.length; r < o; r++) {
    let s = t[r], c = n && n[e.length], u;
    if (!(s == null || s === !0 || s === !1)) if ((u = typeof s) == "object" && s.nodeType)
      e.push(s);
    else if (Array.isArray(s))
      l = de(e, s, c) || l;
    else if (u === "function")
      if (i) {
        for (; typeof s == "function"; ) s = s();
        l = de(e, Array.isArray(s) ? s : [s], Array.isArray(c) ? c : [c]) || l;
      } else
        e.push(s), l = !0;
    else {
      const f = String(s);
      c && c.nodeType === 3 && c.data === f ? e.push(c) : e.push(document.createTextNode(f));
    }
  }
  return l;
}
function Ae(e, t, n = null) {
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
        return je(r, t, l), r;
    }
  });
}
function Lt(e) {
  const [, t] = Le(e, ["component"]);
  return It(() => e.component, t);
}
var Mt = et({
  size: 24,
  color: "currentColor",
  strokeWidth: 2,
  absoluteStrokeWidth: !1,
  nonScalingStroke: !1,
  class: ""
}), Dt = /* @__PURE__ */ I("<svg>"), jt = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, D = jt, he = (...e) => e.filter((t, n, i) => !!t && t.trim() !== "" && i.indexOf(t) === n).join(" ").trim();
function ae(e) {
  return e != null;
}
function Bt(e, t = {}) {
  const n = t.attributeNames ?? {}, i = (d) => n[d] ?? d, l = e.size ?? e.width ?? D.width, r = e.size ?? e.height ?? D.height, o = e.aliases?.filter((d) => typeof d == "string" && d.trim() !== "").map((d) => `lucide-${d}`) ?? [], s = [...e.name ? [`lucide-${e.name}`] : [], ...o], c = t.className?.split(" ").filter(Boolean) ?? [], u = t.includeDefaultClasses === !1 ? he(...c) : he("lucide", ...s, ...c), f = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? D["stroke-width"]) * Number(e.size ?? e.width ?? D.width) / Number(t.size ?? t.width ?? D.width) : t.strokeWidth ?? D["stroke-width"];
  return ["svg", {
    ...Object.entries(D).reduce((d, [b, S]) => (d[i(b)] = S, d), {}),
    ..."color" in t && t.color && {
      [i("stroke")]: t.color
    },
    ..."size" in t && ae(t.size) && {
      [i("width")]: t.size,
      [i("height")]: t.size
    },
    ..."width" in t && ae(t.width) && {
      [i("width")]: t.width
    },
    ..."height" in t && ae(t.height) && {
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
    const [b, S, x] = d, N = t.nonScalingStroke ? {
      [i("vector-effect")]: "non-scaling-stroke",
      ...S
    } : S;
    return x ? [b, N, x] : [b, N];
  })];
}
var Ft = Bt, Rt = (e) => {
  for (const t in e)
    if (t.startsWith("aria-") || t === "role" || t === "title")
      return !0;
  return !1;
}, Wt = (e) => {
  const [t, n] = Le(e, ["color", "size", "width", "height", "strokeWidth", "children", "class", "icon", "iconNode", "absoluteStrokeWidth", "nonScalingStroke"]), i = tt(Mt), l = C(() => t.icon ?? {
    node: t.iconNode ?? [],
    size: 24,
    aliases: []
  }), r = C(() => Ft(l(), {
    color: t.color ?? i.color,
    width: t.width ?? t.size ?? i.size,
    height: t.height ?? t.size ?? i.size,
    strokeWidth: t.strokeWidth ?? i.strokeWidth,
    absoluteStrokeWidth: t.absoluteStrokeWidth ?? i.absoluteStrokeWidth,
    nonScalingStroke: t.nonScalingStroke ?? i.nonScalingStroke,
    className: he("lucide-icon", i.class, t.class),
    hasA11yProp: !!t.children || Rt(n),
    attributes: n
  }));
  return (() => {
    var o = Dt();
    return je(o, ne(() => r()[1]), !0, !0), $(o, P(Me, {
      get each() {
        return r()[2] ?? [];
      },
      children: ([s, c]) => P(Lt, ne({
        component: s
      }, c))
    })), o;
  })();
}, Fe = Wt, Re = {
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
Re.node;
var Ut = (e) => P(Fe, ne(e, {
  icon: Re
})), zt = Ut, We = {
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
We.node;
var Vt = (e) => P(Fe, ne(e, {
  icon: We
})), Gt = Vt, Kt = /* @__PURE__ */ I("<label class=wp-slider><span class=wp-slider-head><span></span><span class=wp-value></span></span><input type=range min=0>"), Xt = /* @__PURE__ */ I("<button class=wp-btn>Remove"), qt = /* @__PURE__ */ I("<div class=wp-error>"), Ht = /* @__PURE__ */ I('<div class=wp-panel><div class=wp-header><span class=wp-title>Wallpaper</span><button class=wp-icon-btn title=Close></button></div><div class=wp-scroll><div class=wp-preview></div><div class=wp-row><button class="wp-btn wp-btn-primary"></button><input type=file hidden></div><form class=wp-row><input class=wp-input type=url placeholder="or paste a link"><button class=wp-btn type=submit>Use</button></form><div class=wp-section></div><div class=wp-section><span class=wp-label>Size</span><div class=wp-segmented>'), Yt = /* @__PURE__ */ I("<video muted loop autoplay playsinline>"), Jt = /* @__PURE__ */ I("<img alt>"), Qt = /* @__PURE__ */ I("<button class=wp-seg>");
const Zt = [{
  value: "cover",
  label: "Fill"
}, {
  value: "contain",
  label: "Fit"
}, {
  value: "tile",
  label: "Tile"
}], en = Object.keys(ke).join(",");
function tn(e) {
  const {
    api: t
  } = e, [n, i] = G(le(t.storage.get(H))), [l, r] = G(n().url), [o, s] = G(null), [c, u] = G(!1);
  let f;
  function a(g) {
    const h = le({
      ...n(),
      ...g
    });
    try {
      t.storage.set(H, h);
    } catch (p) {
      s(p instanceof Error ? p.message : String(p));
      return;
    }
    i(h), Xe();
  }
  const d = t.storage.onChange((g) => {
    g === H && (i(le(t.storage.get(H))), r(n().url));
  });
  Ee(d);
  const b = () => Ge(n());
  async function S(g) {
    if (g) {
      if (s(null), !ke[g.type]) return s("Pick a PNG, JPEG, WebP, GIF, AVIF, SVG, MP4 or WebM file.");
      if (g.size > ye) return s(`The file is over ${ye / 1024 / 1024} MB.`);
      u(!0);
      try {
        const h = await t.invoke("set", g.type, new Uint8Array(await g.arrayBuffer()));
        a({
          source: "file",
          filePath: h.path,
          fileMedia: h.media
        });
      } catch (h) {
        s(h instanceof Error ? h.message : String(h));
      } finally {
        u(!1), f.value = "";
      }
    }
  }
  function x(g) {
    g.preventDefault();
    const h = l().trim();
    if (!Ke(h)) return s("Paste an http(s) link to an image or a video.");
    s(null), a({
      source: "url",
      url: h
    });
  }
  async function N() {
    s(null);
    const g = n().source === "file";
    a({
      source: null,
      filePath: ""
    }), g && await t.invoke("clear").catch(() => {
    });
  }
  function O(g, h, p, E) {
    return (() => {
      var L = Kt(), R = L.firstChild, W = R.firstChild, M = W.nextSibling, _ = R.nextSibling;
      return $(W, g), $(M, () => n()[h], null), $(M, E, null), _.$$input = (z) => a({
        [h]: Number(z.currentTarget.value)
      }), j(_, "max", p), v(() => _.value = n()[h]), L;
    })();
  }
  return (() => {
    var g = Ht(), h = g.firstChild, p = h.firstChild, E = p.nextSibling, L = h.nextSibling, R = L.firstChild, W = R.nextSibling, M = W.firstChild, _ = M.nextSibling, z = W.nextSibling, ge = z.firstChild, V = z.nextSibling, Ue = V.nextSibling, ze = Ue.firstChild, Ve = ze.nextSibling;
    E.$$click = () => t.close(), $(E, P(Gt, {
      size: 14
    })), $(R, P(ce, {
      get when() {
        return b();
      },
      keyed: !0,
      get fallback() {
        return P(zt, {
          size: 28
        });
      },
      children: (y) => y.media === "video" ? (() => {
        var k = Yt();
        return v(() => j(k, "src", y.url)), k;
      })() : (() => {
        var k = Jt();
        return v(() => j(k, "src", y.url)), k;
      })()
    })), M.$$click = () => f.click(), $(M, () => c() ? "Saving…" : "Choose file…"), $(W, P(ce, {
      get when() {
        return n().source;
      },
      get children() {
        var y = Xt();
        return y.$$click = N, y;
      }
    }), _), _.addEventListener("change", (y) => S(y.currentTarget.files?.[0]));
    var we = f;
    return typeof we == "function" ? Be(we, _) : f = _, j(_, "accept", en), z.addEventListener("submit", x), ge.$$input = (y) => r(y.currentTarget.value), $(L, P(ce, {
      get when() {
        return o();
      },
      get children() {
        var y = qt();
        return $(y, o), y;
      }
    }), V), $(V, () => O("Terminal background", "paneOpacity", 100, "%"), null), $(V, () => O("Dim", "dim", 100, "%"), null), $(V, () => O("Blur", "blur", qe, "px"), null), $(Ve, P(Me, {
      each: Zt,
      children: (y) => (() => {
        var k = Qt();
        return k.$$click = () => a({
          fit: y.value
        }), $(k, () => y.label), v(() => k.classList.toggle("active", n().fit === y.value)), k;
      })()
    })), v((y) => {
      var k = !b(), be = c();
      return k !== y.e && R.classList.toggle("wp-preview-empty", y.e = k), be !== y.t && (M.disabled = y.t = be), y;
    }, {
      e: void 0,
      t: void 0
    }), v(() => ge.value = l()), g;
  })();
}
function sn(e, t) {
  return $t(() => P(tn, {
    api: t
  }), e);
}
De(["input", "click"]);
export {
  sn as mount
};
