const Ve = (e, t) => e === t, K = Symbol("solid-proxy"), $e = typeof Proxy == "function", qe = Symbol("solid-track"), X = {
  equals: Ve
};
let We = Ce;
const j = 1, Q = 2, ve = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var m = null;
let ne = null, Ge = null, p = null, v = null, L = null, Z = 0;
function F(e, t) {
  const n = p, i = m, l = e.length === 0, r = t === void 0 ? i : t, o = l ? ve : {
    owned: null,
    cleanups: null,
    context: r ? r.context : null,
    owner: r
  }, s = l ? e : () => e(() => N(() => V(o)));
  m = o, p = null;
  try {
    return W(s, !0);
  } finally {
    p = n, m = i;
  }
}
function O(e, t) {
  t = t ? Object.assign({}, X, t) : X;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, i = (l) => (typeof l == "function" && (l = l(n.value)), xe(n, l));
  return [ke.bind(n), i];
}
function k(e, t, n) {
  const i = Ae(e, t, !1, j);
  ee(i);
}
function E(e, t, n) {
  n = n ? Object.assign({}, X, n) : X;
  const i = Ae(e, t, !0, 0);
  return i.observers = null, i.observerSlots = null, i.comparator = n.equals || void 0, ee(i), ke.bind(i);
}
function N(e) {
  if (p === null) return e();
  const t = p;
  p = null;
  try {
    return e();
  } finally {
    p = t;
  }
}
function Ue(e) {
  return m === null || (m.cleanups === null ? m.cleanups = [e] : m.cleanups.push(e)), e;
}
function He(e, t) {
  const n = Symbol("context");
  return {
    id: n,
    Provider: Ze(n),
    defaultValue: e
  };
}
function Ke(e) {
  let t;
  return m && m.context && (t = m.context[e.id]) !== void 0 ? t : e.defaultValue;
}
function Xe(e) {
  const t = E(e), n = E(() => le(t()));
  return n.toArray = () => {
    const i = n();
    return Array.isArray(i) ? i : i != null ? [i] : [];
  }, n;
}
function ke() {
  if (this.sources && this.state)
    if (this.state === j) ee(this);
    else {
      const e = v;
      v = null, W(() => Y(this), !1), v = e;
    }
  if (p) {
    const e = this.observers;
    if (!e || e[e.length - 1] !== p) {
      const t = e ? e.length : 0;
      p.sources ? (p.sources.push(this), p.sourceSlots.push(t)) : (p.sources = [this], p.sourceSlots = [t]), e ? (e.push(p), this.observerSlots.push(p.sources.length - 1)) : (this.observers = [p], this.observerSlots = [p.sources.length - 1]);
    }
  }
  return this.value;
}
function xe(e, t, n) {
  let i = e.value;
  return (!e.comparator || !e.comparator(i, t)) && (e.value = t, e.observers && e.observers.length && W(() => {
    for (let l = 0; l < e.observers.length; l += 1) {
      const r = e.observers[l], o = ne && ne.running;
      o && ne.disposed.has(r), (o ? !r.tState : !r.state) && (r.pure ? v.push(r) : L.push(r), r.observers && Ee(r)), o || (r.state = j);
    }
    if (v.length > 1e6)
      throw v = [], new Error();
  }, !1)), t;
}
function ee(e) {
  if (!e.fn) return;
  V(e);
  const t = Z;
  Qe(e, e.value, t);
}
function Qe(e, t, n) {
  let i;
  const l = m, r = p;
  p = m = e;
  try {
    i = e.fn(t);
  } catch (o) {
    return e.pure && (e.state = j, e.owned && e.owned.forEach(V), e.owned = null), e.updatedAt = n + 1, Pe(o);
  } finally {
    p = r, m = l;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? xe(e, i) : e.value = i, e.updatedAt = n);
}
function Ae(e, t, n, i = j, l) {
  const r = {
    fn: e,
    state: i,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: t,
    owner: m,
    context: m ? m.context : null,
    pure: n
  };
  return m === null || m !== ve && (m.owned ? m.owned.push(r) : m.owned = [r]), r;
}
function _e(e) {
  if (e.state === 0) return;
  if (e.state === Q) return Y(e);
  if (e.suspense && N(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < Z); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === j)
      ee(e);
    else if (e.state === Q) {
      const i = v;
      v = null, W(() => Y(e, t[0]), !1), v = i;
    }
}
function W(e, t) {
  if (v) return e();
  let n = !1;
  t || (v = []), L ? n = !0 : L = [], Z++;
  try {
    const i = e();
    return Ye(n), i;
  } catch (i) {
    n || (L = null), v = null, Pe(i);
  }
}
function Ye(e) {
  if (v && (Ce(v), v = null), e) return;
  const t = L;
  L = null, t.length && W(() => We(t), !1);
}
function Ce(e) {
  for (let t = 0; t < e.length; t++) _e(e[t]);
}
function Y(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const i = e.sources[n];
    if (i.sources) {
      const l = i.state;
      l === j ? i !== t && (!i.updatedAt || i.updatedAt < Z) && _e(i) : l === Q && Y(i, t);
    }
  }
}
function Ee(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = Q, n.pure ? v.push(n) : L.push(n), n.observers && Ee(n));
  }
}
function V(e) {
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
    for (t = e.tOwned.length - 1; t >= 0; t--) V(e.tOwned[t]);
    delete e.tOwned;
  }
  if (e.owned) {
    for (t = e.owned.length - 1; t >= 0; t--) V(e.owned[t]);
    e.owned = null;
  }
  if (e.cleanups) {
    for (t = e.cleanups.length - 1; t >= 0; t--) e.cleanups[t]();
    e.cleanups = null;
  }
  e.state = 0;
}
function Je(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function Pe(e, t = m) {
  throw Je(e);
}
function le(e) {
  if (typeof e == "function" && !e.length) return le(e());
  if (Array.isArray(e)) {
    const t = [];
    for (let n = 0; n < e.length; n++) {
      const i = le(e[n]);
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
function Ze(e, t) {
  return function(i) {
    let l;
    return k(() => l = N(() => (m.context = {
      ...m.context,
      [e]: i.value
    }, Xe(() => i.children))), void 0), l;
  };
}
const et = Symbol("fallback");
function we(e) {
  for (let t = 0; t < e.length; t++) e[t]();
}
function tt(e, t, n = {}) {
  let i = [], l = [], r = [], o = 0, s = t.length > 1 ? [] : null;
  return Ue(() => we(r)), () => {
    let a = e() || [], f = a.length, c, u;
    return a[qe], N(() => {
      let w, y, S, _, R, x, C, P, M;
      if (f === 0)
        o !== 0 && (we(r), r = [], i = [], l = [], o = 0, s && (s = [])), n.fallback && (i = [et], l[0] = F((G) => (r[0] = G, n.fallback())), o = 1);
      else if (o === 0) {
        for (l = new Array(f), u = 0; u < f; u++)
          i[u] = a[u], l[u] = F(d);
        o = f;
      } else {
        for (S = new Array(f), _ = new Array(f), s && (R = new Array(f)), x = 0, C = Math.min(o, f); x < C && i[x] === a[x]; x++) ;
        for (C = o - 1, P = f - 1; C >= x && P >= x && i[C] === a[P]; C--, P--)
          S[P] = l[C], _[P] = r[C], s && (R[P] = s[C]);
        for (w = /* @__PURE__ */ new Map(), y = new Array(P + 1), u = P; u >= x; u--)
          M = a[u], c = w.get(M), y[u] = c === void 0 ? -1 : c, w.set(M, u);
        for (c = x; c <= C; c++)
          M = i[c], u = w.get(M), u !== void 0 && u !== -1 ? (S[u] = l[c], _[u] = r[c], s && (R[u] = s[c]), u = y[u], w.set(M, u)) : r[c]();
        for (u = x; u < f; u++)
          u in S ? (l[u] = S[u], r[u] = _[u], s && (s[u] = R[u], s[u](u))) : l[u] = F(d);
        l = l.slice(0, o = f), i = a.slice(0);
      }
      return l;
    });
    function d(w) {
      if (r[u] = w, s) {
        const [y, S] = O(u);
        return s[u] = S, t(a[u], y);
      }
      return t(a[u]);
    }
  };
}
function g(e, t) {
  return N(() => e(t || {}));
}
function U() {
  return !0;
}
const re = {
  get(e, t, n) {
    return t === K ? n : e.get(t);
  },
  has(e, t) {
    return t === K ? !0 : e.has(t);
  },
  set: U,
  deleteProperty: U,
  getOwnPropertyDescriptor(e, t) {
    return {
      configurable: !0,
      enumerable: !0,
      get() {
        return e.get(t);
      },
      set: U,
      deleteProperty: U
    };
  },
  ownKeys(e) {
    return e.keys();
  }
};
function ie(e) {
  return (e = typeof e == "function" ? e() : e) ? e : {};
}
function nt() {
  for (let e = 0, t = this.length; e < t; ++e) {
    const n = this[e]();
    if (n !== void 0) return n;
  }
}
function B(...e) {
  let t = !1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o];
    t = t || !!s && K in s, e[o] = typeof s == "function" ? (t = !0, E(s)) : s;
  }
  if ($e && t)
    return new Proxy({
      get(o) {
        for (let s = e.length - 1; s >= 0; s--) {
          const a = ie(e[s])[o];
          if (a !== void 0) return a;
        }
      },
      has(o) {
        for (let s = e.length - 1; s >= 0; s--)
          if (o in ie(e[s])) return !0;
        return !1;
      },
      keys() {
        const o = [];
        for (let s = 0; s < e.length; s++) o.push(...Object.keys(ie(e[s])));
        return [...new Set(o)];
      }
    }, re);
  const n = {}, i = /* @__PURE__ */ Object.create(null);
  for (let o = e.length - 1; o >= 0; o--) {
    const s = e[o];
    if (!s) continue;
    const a = Object.getOwnPropertyNames(s);
    for (let f = a.length - 1; f >= 0; f--) {
      const c = a[f];
      if (c === "__proto__" || c === "constructor") continue;
      const u = Object.getOwnPropertyDescriptor(s, c);
      if (!i[c])
        i[c] = u.get ? {
          enumerable: !0,
          configurable: !0,
          get: nt.bind(n[c] = [u.get.bind(s)])
        } : u.value !== void 0 ? u : void 0;
      else {
        const d = n[c];
        d && (u.get ? d.push(u.get.bind(s)) : u.value !== void 0 && d.push(() => u.value));
      }
    }
  }
  const l = {}, r = Object.keys(i);
  for (let o = r.length - 1; o >= 0; o--) {
    const s = r[o], a = i[s];
    a && a.get ? Object.defineProperty(l, s, a) : l[s] = a ? a.value : void 0;
  }
  return l;
}
function Ne(e, ...t) {
  const n = t.length;
  if ($e && K in e) {
    const l = n > 1 ? t.flat() : t[0], r = /* @__PURE__ */ new Set(), o = t.map((s) => {
      const a = s.filter((f) => !r.has(f) && (r.add(f), !0));
      return new Proxy({
        get(f) {
          return a.includes(f) ? e[f] : void 0;
        },
        has(f) {
          return a.includes(f) && f in e;
        },
        keys() {
          return a.filter((f) => f in e);
        }
      }, re);
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
    }, re)), o;
  }
  const i = [];
  for (let l = 0; l <= n; l++)
    i[l] = {};
  for (const l of Object.getOwnPropertyNames(e)) {
    let r = n;
    for (let a = 0; a < t.length; a++)
      if (t[a].includes(l)) {
        r = a;
        break;
      }
    const o = Object.getOwnPropertyDescriptor(e, l);
    !o.get && !o.set && o.enumerable && o.writable && o.configurable ? i[r][l] = o.value : Object.defineProperty(i[r], l, o);
  }
  return i;
}
const it = (e) => `Stale read from <${e}>.`;
function J(e) {
  const t = "fallback" in e && {
    fallback: () => e.fallback
  };
  return E(tt(() => e.each, e.children, t || void 0));
}
function A(e) {
  const t = e.keyed, n = E(() => e.when, void 0, void 0), i = t ? n : E(n, void 0, {
    equals: (l, r) => !l == !r
  });
  return E(() => {
    const l = i();
    if (l) {
      const r = e.children;
      return typeof r == "function" && r.length > 0 ? N(() => r(t ? l : () => {
        if (!N(i)) throw it("Show");
        return n();
      })) : r;
    }
    return e.fallback;
  }, void 0, void 0);
}
const st = [
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
], lt = /* @__PURE__ */ new Set([
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
  ...st
]), rt = /* @__PURE__ */ new Set(["innerHTML", "textContent", "innerText", "children"]), ot = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
}), at = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
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
function ct(e, t) {
  const n = at[e];
  return typeof n == "object" ? n[t] ? n.$ : void 0 : n;
}
const ut = /* @__PURE__ */ new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]), ft = /* @__PURE__ */ new Set([
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
]), dt = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
}, oe = (e) => E(() => e());
function ht(e, t, n) {
  let i = n.length, l = t.length, r = i, o = 0, s = 0, a = t[l - 1].nextSibling, f = null;
  for (; o < l || s < r; ) {
    if (t[o] === n[s]) {
      o++, s++;
      continue;
    }
    for (; t[l - 1] === n[r - 1]; )
      l--, r--;
    if (l === o) {
      const c = r < i ? s ? n[s - 1].nextSibling : n[r - s] : a;
      for (; s < r; ) e.insertBefore(n[s++], c);
    } else if (r === s)
      for (; o < l; )
        (!f || !f.has(t[o])) && t[o].remove(), o++;
    else if (t[o] === n[r - 1] && n[s] === t[l - 1]) {
      const c = t[--l].nextSibling;
      e.insertBefore(n[s++], t[o++].nextSibling), e.insertBefore(n[--r], c), t[l] = n[r];
    } else {
      if (!f) {
        f = /* @__PURE__ */ new Map();
        let u = s;
        for (; u < r; ) f.set(n[u], u++);
      }
      const c = f.get(t[o]);
      if (c != null)
        if (s < c && c < r) {
          let u = o, d = 1, w;
          for (; ++u < l && u < r && !((w = f.get(t[u])) == null || w !== c + d); )
            d++;
          if (d > c - s) {
            const y = t[o];
            for (; s < c; ) e.insertBefore(n[s++], y);
          } else e.replaceChild(n[s++], t[o++]);
        } else o++;
      else t[o++].remove();
    }
  }
}
const be = "_$DX_DELEGATE";
function gt(e, t, n, i = {}) {
  let l;
  return F((r) => {
    l = r, t === document ? e() : h(t, e(), t.firstChild ? null : void 0, n);
  }, i.owner), () => {
    l(), t.textContent = "";
  };
}
function $(e, t, n, i) {
  let l;
  const r = () => {
    const s = document.createElement("template");
    return s.innerHTML = e, s.content.firstChild;
  }, o = () => (l || (l = r())).cloneNode(!0);
  return o.cloneNode = o, o;
}
function Oe(e, t = window.document) {
  const n = t[be] || (t[be] = /* @__PURE__ */ new Set());
  for (let i = 0, l = e.length; i < l; i++) {
    const r = e[i];
    n.has(r) || (n.add(r), t.addEventListener(r, kt));
  }
}
function D(e, t, n) {
  n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function wt(e, t, n, i) {
  i == null ? e.removeAttributeNS(t, n) : e.setAttributeNS(t, n, i);
}
function bt(e, t, n) {
  n ? e.setAttribute(t, "") : e.removeAttribute(t);
}
function mt(e, t) {
  t == null ? e.removeAttribute("class") : e.className = t;
}
function yt(e, t, n, i) {
  if (i)
    Array.isArray(n) ? (e[`$$${t}`] = n[0], e[`$$${t}Data`] = n[1]) : e[`$$${t}`] = n;
  else if (Array.isArray(n)) {
    const l = n[0];
    e.addEventListener(t, n[0] = (r) => l.call(e, n[1], r));
  } else e.addEventListener(t, n, typeof n != "function" && n);
}
function pt(e, t, n = {}) {
  const i = Object.keys(t || {}), l = Object.keys(n);
  let r, o;
  for (r = 0, o = l.length; r < o; r++) {
    const s = l[r];
    !s || s === "undefined" || t[s] || (me(e, s, !1), delete n[s]);
  }
  for (r = 0, o = i.length; r < o; r++) {
    const s = i[r], a = !!t[s];
    !s || s === "undefined" || n[s] === a || !a || (me(e, s, !0), n[s] = a);
  }
  return n;
}
function St(e, t, n) {
  if (!t) return n ? D(e, "style") : t;
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
function Me(e, t = {}, n, i) {
  const l = {};
  return i || k(() => l.children = q(e, t.children, l.children)), k(() => typeof t.ref == "function" && Te(t.ref, e)), k(() => $t(e, t, n, !0, l, !0)), l;
}
function Te(e, t, n) {
  return N(() => e(t, n));
}
function h(e, t, n, i) {
  if (n !== void 0 && !i && (i = []), typeof t != "function") return q(e, t, i, n);
  k((l) => q(e, t(), l, n), i);
}
function $t(e, t, n, i, l = {}, r = !1) {
  t || (t = {});
  for (const o in l)
    if (!(o in t)) {
      if (o === "children") continue;
      l[o] = ye(e, o, null, l[o], n, r, t);
    }
  for (const o in t) {
    if (o === "children")
      continue;
    const s = t[o];
    l[o] = ye(e, o, s, l[o], n, r, t);
  }
}
function vt(e) {
  return e.toLowerCase().replace(/-([a-z])/g, (t, n) => n.toUpperCase());
}
function me(e, t, n) {
  const i = t.trim().split(/\s+/);
  for (let l = 0, r = i.length; l < r; l++) e.classList.toggle(i[l], n);
}
function ye(e, t, n, i, l, r, o) {
  let s, a, f, c, u;
  if (t === "style") return St(e, n, i);
  if (t === "classList") return pt(e, n, i);
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
    const d = t.slice(2).toLowerCase(), w = ut.has(d);
    if (!w && i) {
      const y = Array.isArray(i) ? i[0] : i;
      e.removeEventListener(d, y);
    }
    (w || n) && (yt(e, d, n, w), w && Oe([d]));
  } else if (t.slice(0, 5) === "attr:")
    D(e, t.slice(5), n);
  else if (t.slice(0, 5) === "bool:")
    bt(e, t.slice(5), n);
  else if ((u = t.slice(0, 5) === "prop:") || (f = rt.has(t)) || !l && ((c = ct(t, e.tagName)) || (a = lt.has(t))) || (s = e.nodeName.includes("-") || "is" in o))
    u && (t = t.slice(5), a = !0), t === "class" || t === "className" ? mt(e, n) : s && !a && !f ? e[vt(t)] = n : (t === "value" || t === "defaultValue") && (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA") ? e[c || t] = n ?? "" : e[c || t] = n;
  else {
    const d = l && t.indexOf(":") > -1 && dt[t.split(":")[0]];
    d ? wt(e, d, t, n) : D(e, ot[t] || t, n);
  }
  return n;
}
function kt(e) {
  let t = e.target;
  const n = `$$${e.type}`, i = e.target, l = e.currentTarget, r = (a) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: a
  }), o = () => {
    const a = t[n];
    if (a && !t.disabled) {
      const f = t[`${n}Data`];
      if (f !== void 0 ? a.call(t, f, e) : a.call(t, e), e.cancelBubble) return;
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
      const a = e.composedPath();
      r(a[0]);
      for (let f = 0; f < a.length - 2 && (t = a[f], !!o()); f++) {
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
      s && s.nodeType === 3 ? s.data !== t && (s.data = t) : s = document.createTextNode(t), n = z(e, n, i, s);
    } else
      n !== "" && typeof n == "string" ? n = e.firstChild.data = t : n = e.textContent = t;
  } else if (t == null || r === "boolean")
    n = z(e, n, i);
  else {
    if (r === "function")
      return k(() => {
        let s = t();
        for (; typeof s == "function"; ) s = s();
        n = q(e, s, n, i);
      }), () => n;
    if (Array.isArray(t)) {
      const s = [], a = n && Array.isArray(n);
      if (ae(s, t, n, l))
        return k(() => n = q(e, s, n, i, !0)), () => n;
      if (s.length === 0) {
        if (n = z(e, n, i), o) return n;
      } else a ? n.length === 0 ? pe(e, s, i) : ht(e, n, s) : (n && z(e), pe(e, s));
      n = s;
    } else if (t.nodeType) {
      if (Array.isArray(n)) {
        if (o) return n = z(e, n, i, t);
        z(e, n, null, t);
      } else n == null || n === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
      n = t;
    }
  }
  return n;
}
function ae(e, t, n, i) {
  let l = !1;
  for (let r = 0, o = t.length; r < o; r++) {
    let s = t[r], a = n && n[e.length], f;
    if (!(s == null || s === !0 || s === !1)) if ((f = typeof s) == "object" && s.nodeType)
      e.push(s);
    else if (Array.isArray(s))
      l = ae(e, s, a) || l;
    else if (f === "function")
      if (i) {
        for (; typeof s == "function"; ) s = s();
        l = ae(e, Array.isArray(s) ? s : [s], Array.isArray(a) ? a : [a]) || l;
      } else
        e.push(s), l = !0;
    else {
      const c = String(s);
      a && a.nodeType === 3 && a.data === c ? e.push(a) : e.push(document.createTextNode(c));
    }
  }
  return l;
}
function pe(e, t, n = null) {
  for (let i = 0, l = t.length; i < l; i++) e.insertBefore(t[i], n);
}
function z(e, t, n, i) {
  if (n === void 0) return e.textContent = "";
  const l = i || document.createTextNode("");
  if (t.length) {
    let r = !1;
    for (let o = t.length - 1; o >= 0; o--) {
      const s = t[o];
      if (l !== s) {
        const a = s.parentNode === e;
        !r && !o ? a ? e.replaceChild(l, s) : e.insertBefore(l, n) : a && s.remove();
      } else r = !0;
    }
  } else e.insertBefore(l, n);
  return [l];
}
const xt = "http://www.w3.org/2000/svg";
function At(e, t = !1, n = void 0) {
  return t ? document.createElementNS(xt, e) : document.createElement(e, {
    is: n
  });
}
function _t(e, t) {
  const n = E(e);
  return E(() => {
    const i = n();
    switch (typeof i) {
      case "function":
        return N(() => i(t));
      case "string":
        const l = ft.has(i), r = At(i, l, N(() => t.is));
        return Me(r, t, l), r;
    }
  });
}
function Ct(e) {
  const [, t] = Ne(e, ["component"]);
  return _t(() => e.component, t);
}
var Et = He({
  size: 24,
  color: "currentColor",
  strokeWidth: 2,
  absoluteStrokeWidth: !1,
  nonScalingStroke: !1,
  class: ""
}), Pt = /* @__PURE__ */ $("<svg>"), Nt = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, I = Nt, ce = (...e) => e.filter((t, n, i) => !!t && t.trim() !== "" && i.indexOf(t) === n).join(" ").trim();
function se(e) {
  return e != null;
}
function Ot(e, t = {}) {
  const n = t.attributeNames ?? {}, i = (d) => n[d] ?? d, l = e.size ?? e.width ?? I.width, r = e.size ?? e.height ?? I.height, o = e.aliases?.filter((d) => typeof d == "string" && d.trim() !== "").map((d) => `lucide-${d}`) ?? [], s = [...e.name ? [`lucide-${e.name}`] : [], ...o], a = t.className?.split(" ").filter(Boolean) ?? [], f = t.includeDefaultClasses === !1 ? ce(...a) : ce("lucide", ...s, ...a), c = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? I["stroke-width"]) * Number(e.size ?? e.width ?? I.width) / Number(t.size ?? t.width ?? I.width) : t.strokeWidth ?? I["stroke-width"];
  return ["svg", {
    ...Object.entries(I).reduce((d, [w, y]) => (d[i(w)] = y, d), {}),
    ..."color" in t && t.color && {
      [i("stroke")]: t.color
    },
    ..."size" in t && se(t.size) && {
      [i("width")]: t.size,
      [i("height")]: t.size
    },
    ..."width" in t && se(t.width) && {
      [i("width")]: t.width
    },
    ..."height" in t && se(t.height) && {
      [i("height")]: t.height
    },
    [i("stroke-width")]: c,
    ...f && {
      [i("class")]: f
    },
    [i("viewBox")]: `0 0 ${l} ${r}`,
    ...t.hasA11yProp === !1 ? {
      [i("aria-hidden")]: "true"
    } : {},
    ..."attributes" in t && t.attributes
  }, e.node.map((d) => {
    const [w, y, S] = d, _ = t.nonScalingStroke ? {
      [i("vector-effect")]: "non-scaling-stroke",
      ...y
    } : y;
    return S ? [w, _, S] : [w, _];
  })];
}
var Mt = Ot, Tt = (e) => {
  for (const t in e)
    if (t.startsWith("aria-") || t === "role" || t === "title")
      return !0;
  return !1;
}, Dt = (e) => {
  const [t, n] = Ne(e, ["color", "size", "width", "height", "strokeWidth", "children", "class", "icon", "iconNode", "absoluteStrokeWidth", "nonScalingStroke"]), i = Ke(Et), l = E(() => t.icon ?? {
    node: t.iconNode ?? [],
    size: 24,
    aliases: []
  }), r = E(() => Mt(l(), {
    color: t.color ?? i.color,
    width: t.width ?? t.size ?? i.size,
    height: t.height ?? t.size ?? i.size,
    strokeWidth: t.strokeWidth ?? i.strokeWidth,
    absoluteStrokeWidth: t.absoluteStrokeWidth ?? i.absoluteStrokeWidth,
    nonScalingStroke: t.nonScalingStroke ?? i.nonScalingStroke,
    className: ce("lucide-icon", i.class, t.class),
    hasA11yProp: !!t.children || Tt(n),
    attributes: n
  }));
  return (() => {
    var o = Pt();
    return Me(o, B(() => r()[1]), !0, !0), h(o, g(J, {
      get each() {
        return r()[2] ?? [];
      },
      children: ([s, a]) => g(Ct, B({
        component: s
      }, a))
    })), o;
  })();
}, te = Dt, De = {
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
De.node;
var It = (e) => g(te, B(e, {
  icon: De
})), Lt = It, Ie = {
  name: "refresh-cw",
  size: 24,
  node: [["path", {
    d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
    key: "v9h5vc"
  }], ["path", {
    d: "M21 3v5h-5",
    key: "1q7to0"
  }], ["path", {
    d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
    key: "3uifl3"
  }], ["path", {
    d: "M8 16H3v5",
    key: "1cv678"
  }]]
};
Ie.node;
var jt = (e) => g(te, B(e, {
  icon: Ie
})), Rt = jt, Le = {
  name: "external-link",
  size: 24,
  node: [["path", {
    d: "M15 3h6v6",
    key: "1q9fwt"
  }], ["path", {
    d: "M10 14 21 3",
    key: "gplh6r"
  }], ["path", {
    d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
    key: "a6xqqp"
  }]]
};
Le.node;
var zt = (e) => g(te, B(e, {
  icon: Le
})), Bt = zt, je = {
  name: "chevron-right",
  size: 24,
  node: [["path", {
    d: "m9 18 6-6-6-6",
    key: "mthhwq"
  }]]
};
je.node;
var Ft = (e) => g(te, B(e, {
  icon: je
})), ue = Ft;
const H = {
  interval: { min: 30, max: 3600 },
  threshold: { min: 1, max: 10 },
  groupMin: { min: 2, max: 100 }
};
function Re(e) {
  return e.group ? `${e.group} / ${e.name}` : e.name;
}
var Vt = /* @__PURE__ */ $("<ul class=gt-checks>"), qt = /* @__PURE__ */ $("<div class=gt-incident><button class=gt-incident-head><span class=gt-dot></span><span class=gt-incident-title></span><span class=gt-since>"), ze = /* @__PURE__ */ $("<li>"), Wt = /* @__PURE__ */ $('<label class=gt-field><span></span><input class="gt-input gt-num"type=number required><small>'), Gt = /* @__PURE__ */ $("<label class=gt-check><input type=checkbox name=clearAuth> Remove the saved header"), Ut = /* @__PURE__ */ $("<button class=gt-btn type=button>Cancel"), Ht = /* @__PURE__ */ $(`<form class=gt-settings><label class=gt-field><span>Gatus address</span><input class=gt-input name=url type=url placeholder=https://status.example.com required></label><label class=gt-field><span>Authorization header</span><input class=gt-input name=authHeader type=password autocomplete=off></label><label class=gt-field><span>Alert on first failure</span><textarea class=gt-input name=watch rows=3 placeholder="group/name, one per line
infra/*"></textarea></label><label class=gt-field><span>Never alert</span><textarea class=gt-input name=mute rows=3 placeholder=*/nightly-*></textarea></label><small class=gt-hint>Patterns are group/name with * as a wildcard; without a / they match the name in any group.</small><div class=gt-row><button class="gt-btn gt-btn-primary"type=submit>`), Kt = /* @__PURE__ */ $('<button class=gt-icon-btn title="Check now">'), Xt = /* @__PURE__ */ $('<button class=gt-icon-btn title="Open the status page">'), Se = /* @__PURE__ */ $("<div class=gt-error>"), Qt = /* @__PURE__ */ $("<div class=gt-status> checks · checked "), Yt = /* @__PURE__ */ $("<div class=gt-incidents>"), Jt = /* @__PURE__ */ $("<button class=gt-section-toggle>Failing, not alerted (<!>)"), Zt = /* @__PURE__ */ $('<ul class="gt-checks gt-quiet">'), en = /* @__PURE__ */ $("<button class=gt-section-toggle>Settings"), tn = /* @__PURE__ */ $("<div class=gt-empty>Point this at a Gatus server to get alerted when its checks go down."), nn = /* @__PURE__ */ $("<div class=gt-panel><div class=gt-header><span class=gt-title>Gatus</span><button class=gt-icon-btn title=Close></button></div><div class=gt-scroll>"), sn = /* @__PURE__ */ $("<div class=gt-empty>Nothing down.");
const b = F(() => {
  const [e, t] = O(null), [n, i] = O(null), [l, r] = O(/* @__PURE__ */ new Set()), [o, s] = O(!1), [a, f] = O(!1), [c, u] = O(null);
  return {
    snap: e,
    setSnap: t,
    config: n,
    setConfig: i,
    open: l,
    setOpen: r,
    showSettings: o,
    setShowSettings: s,
    showQuiet: a,
    setShowQuiet: f,
    error: c,
    setError: u
  };
}), Be = (e, t) => b.setOpen((n) => {
  const i = new Set(n);
  return t ?? !i.has(e) ? i.add(e) : i.delete(e), i;
});
function Fe(e) {
  if (!e) return "never";
  const t = Math.max(0, Math.round((Date.now() - Date.parse(e)) / 1e3));
  return t < 60 ? `${t}s ago` : t < 3600 ? `${Math.round(t / 60)} min ago` : t < 86400 ? `${Math.round(t / 3600)} h ago` : new Date(e).toLocaleString();
}
function ln(e) {
  const t = () => b.open().has(e.incident.id);
  return (() => {
    var n = qt(), i = n.firstChild, l = i.firstChild, r = l.nextSibling, o = r.nextSibling;
    return i.$$click = () => Be(e.incident.id), h(i, g(ue, {
      size: 12
    }), l), h(r, () => e.incident.title), h(o, () => Fe(e.incident.since)), h(n, g(A, {
      get when() {
        return oe(() => !!t())() && e.incident.checks.length > 0;
      },
      get children() {
        var s = Vt();
        return h(s, g(J, {
          get each() {
            return e.incident.checks;
          },
          children: (a) => (() => {
            var f = ze();
            return h(f, () => Re(a)), f;
          })()
        })), s;
      }
    }), null), k((s) => {
      var a = e.incident.id, f = !!t();
      return a !== s.e && D(n, "data-incident", s.e = a), f !== s.t && i.classList.toggle("expanded", s.t = f), s;
    }, {
      e: void 0,
      t: void 0
    }), n;
  })();
}
function rn(e) {
  const t = () => b.config();
  let n;
  const [i, l] = O(!1), r = (s) => {
    s.preventDefault();
    const a = new FormData(n), f = {
      url: String(a.get("url") ?? ""),
      interval: Number(a.get("interval")),
      threshold: Number(a.get("threshold")),
      groupMin: Number(a.get("groupMin")),
      watch: String(a.get("watch") ?? ""),
      mute: String(a.get("mute") ?? "")
    }, c = String(a.get("authHeader") ?? "");
    c !== "" && (f.authHeader = c), a.get("clearAuth") === "on" && (f.authHeader = ""), l(!0), e.api.invoke("configure", f).then((u) => {
      b.setConfig(u), b.setError(null), b.setShowSettings(!1), n.reset();
    }, (u) => b.setError(u instanceof Error ? u.message : String(u))).finally(() => l(!1));
  }, o = (s, a, f) => (() => {
    var c = Wt(), u = c.firstChild, d = u.nextSibling, w = d.nextSibling;
    return h(u, a), D(d, "name", s), h(w, f), k((y) => {
      var S = H[s].min, _ = H[s].max;
      return S !== y.e && D(d, "min", y.e = S), _ !== y.t && D(d, "max", y.t = _), y;
    }, {
      e: void 0,
      t: void 0
    }), k(() => d.value = t()?.[s] ?? ""), c;
  })();
  return g(A, {
    get when() {
      return t();
    },
    keyed: !0,
    children: (s) => (() => {
      var a = Ht(), f = a.firstChild, c = f.firstChild, u = c.nextSibling, d = f.nextSibling, w = d.firstChild, y = w.nextSibling, S = d.nextSibling, _ = S.firstChild, R = _.nextSibling, x = S.nextSibling, C = x.firstChild, P = C.nextSibling, M = x.nextSibling, G = M.nextSibling, fe = G.firstChild;
      a.addEventListener("submit", r);
      var de = n;
      return typeof de == "function" ? Te(de, a) : n = a, h(a, g(A, {
        get when() {
          return s.hasAuth;
        },
        get children() {
          return Gt();
        }
      }), S), h(a, () => o("interval", "Poll every (s)", `${H.interval.min}–${H.interval.max}`), S), h(a, () => o("threshold", "Alert after failures in a row", "per check"), S), h(a, () => o("groupMin", "Bundle from", "same check in this many groups, or this many checks in one group"), S), h(R, () => s.watch.join(`
`)), h(P, () => s.mute.join(`
`)), h(fe, () => i() ? "Saving…" : "Save"), h(G, g(A, {
        get when() {
          return b.snap()?.configured;
        },
        get children() {
          var T = Ut();
          return T.$$click = () => b.setShowSettings(!1), T;
        }
      }), null), k((T) => {
        var he = s.hasAuth ? "saved (type to replace)" : "optional, e.g. Bearer …", ge = i();
        return he !== T.e && D(y, "placeholder", T.e = he), ge !== T.t && (fe.disabled = T.t = ge), T;
      }, {
        e: void 0,
        t: void 0
      }), k(() => u.value = s.url), a;
    })()
  });
}
function on(e) {
  const [t, n] = O(!1), i = () => b.snap(), l = () => {
    n(!0), e.api.invoke("poll").then((r) => b.setSnap(r), (r) => b.setError(String(r))).finally(() => n(!1));
  };
  return (() => {
    var r = nn(), o = r.firstChild, s = o.firstChild, a = s.nextSibling, f = o.nextSibling;
    return h(o, g(A, {
      get when() {
        return i()?.configured;
      },
      get children() {
        return [(() => {
          var c = Kt();
          return c.$$click = l, h(c, g(Rt, {
            size: 14
          })), k(() => c.disabled = t()), c;
        })(), (() => {
          var c = Xt();
          return c.$$click = () => e.api.openExternal(i().url), h(c, g(Bt, {
            size: 14
          })), c;
        })()];
      }
    }), a), a.$$click = () => e.api.close(), h(a, g(Lt, {
      size: 14
    })), h(f, g(A, {
      get when() {
        return b.error();
      },
      get children() {
        var c = Se();
        return h(c, () => b.error()), c;
      }
    }), null), h(f, g(A, {
      get when() {
        return oe(() => !!i()?.configured)() && !b.showSettings();
      },
      get children() {
        return [(() => {
          var c = Qt(), u = c.firstChild;
          return h(c, () => i().checks, u), h(c, () => Fe(i().lastPoll), null), h(c, g(A, {
            get when() {
              return i().lastError;
            },
            get children() {
              var d = Se();
              return h(d, () => i().lastError), d;
            }
          }), null), c;
        })(), g(A, {
          get when() {
            return i().incidents.length > 0;
          },
          get fallback() {
            return sn();
          },
          get children() {
            var c = Yt();
            return h(c, g(J, {
              get each() {
                return i().incidents;
              },
              children: (u) => g(ln, {
                incident: u
              })
            })), c;
          }
        }), g(A, {
          get when() {
            return i().quiet.length > 0;
          },
          get children() {
            return [(() => {
              var c = Jt(), u = c.firstChild, d = u.nextSibling;
              return d.nextSibling, c.$$click = () => b.setShowQuiet((w) => !w), h(c, g(ue, {
                size: 12
              }), u), h(c, () => i().quiet.length, d), k(() => c.classList.toggle("expanded", !!b.showQuiet())), c;
            })(), g(A, {
              get when() {
                return b.showQuiet();
              },
              get children() {
                var c = Zt();
                return h(c, g(J, {
                  get each() {
                    return i().quiet;
                  },
                  children: (u) => (() => {
                    var d = ze();
                    return h(d, () => Re(u)), d;
                  })()
                })), c;
              }
            })];
          }
        }), (() => {
          var c = en(), u = c.firstChild;
          return c.$$click = () => b.setShowSettings(!0), h(c, g(ue, {
            size: 12
          }), u), c;
        })()];
      }
    }), null), h(f, g(A, {
      get when() {
        return oe(() => !!i())() && (!i().configured || b.showSettings());
      },
      get children() {
        return [g(A, {
          get when() {
            return !i().configured;
          },
          get children() {
            return tn();
          }
        }), g(rn, {
          get api() {
            return e.api;
          }
        })];
      }
    }), null), r;
  })();
}
function an(e, t) {
  const n = t.on("changed", (r) => b.setSnap(r)), i = t.onReveal((r) => {
    const o = r?.incident;
    typeof o == "string" && (b.setShowSettings(!1), Be(o, !0), queueMicrotask(() => e.querySelector(`[data-incident="${CSS.escape(o)}"]`)?.scrollIntoView({
      block: "nearest"
    })));
  });
  t.invoke("snapshot").then((r) => b.setSnap(r), (r) => b.setError(String(r))), t.invoke("config").then((r) => b.setConfig(r), (r) => b.setError(String(r)));
  const l = gt(() => g(on, {
    api: t
  }), e);
  return () => {
    l(), n(), i();
  };
}
Oe(["click"]);
export {
  an as mount
};
