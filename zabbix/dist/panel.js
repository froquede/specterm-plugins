const st = (e, t) => e === t, J = Symbol("solid-proxy"), Ie = typeof Proxy == "function", rt = Symbol("solid-track"), ee = {
  equals: st
};
let Le = Ve;
const I = 1, te = 2, Re = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var w = null;
let ue = null, ot = null, y = null, x = null, O = null, oe = 0;
function F(e, t) {
  const n = y, i = w, s = e.length === 0, r = t === void 0 ? i : t, o = s ? Re : {
    owned: null,
    cleanups: null,
    context: r ? r.context : null,
    owner: r
  }, l = s ? e : () => e(() => N(() => G(o)));
  w = o, y = null;
  try {
    return W(l, !0);
  } finally {
    y = n, w = i;
  }
}
function z(e, t) {
  t = t ? Object.assign({}, ee, t) : ee;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, i = (s) => (typeof s == "function" && (s = s(n.value)), Fe(n, s));
  return [Be.bind(n), i];
}
function $(e, t, n) {
  const i = ve(e, t, !1, I);
  K(i);
}
function je(e, t, n) {
  Le = mt;
  const i = ve(e, t, !1, I);
  (!n || !n.render) && (i.user = !0), O ? O.push(i) : K(i);
}
function _(e, t, n) {
  n = n ? Object.assign({}, ee, n) : ee;
  const i = ve(e, t, !0, 0);
  return i.observers = null, i.observerSlots = null, i.comparator = n.equals || void 0, K(i), Be.bind(i);
}
function N(e) {
  if (y === null) return e();
  const t = y;
  y = null;
  try {
    return e();
  } finally {
    y = t;
  }
}
function at(e) {
  je(() => N(e));
}
function ne(e) {
  return w === null || (w.cleanups === null ? w.cleanups = [e] : w.cleanups.push(e)), e;
}
function ct() {
  return w;
}
function ut(e, t) {
  const n = w, i = y;
  w = e, y = null;
  try {
    return W(t, !0);
  } catch (s) {
    $e(s);
  } finally {
    w = n, y = i;
  }
}
function ft(e, t) {
  const n = Symbol("context");
  return {
    id: n,
    Provider: yt(n),
    defaultValue: e
  };
}
function dt(e) {
  let t;
  return w && w.context && (t = w.context[e.id]) !== void 0 ? t : e.defaultValue;
}
function ht(e) {
  const t = _(e), n = _(() => he(t()));
  return n.toArray = () => {
    const i = n();
    return Array.isArray(i) ? i : i != null ? [i] : [];
  }, n;
}
function Be() {
  if (this.sources && this.state)
    if (this.state === I) K(this);
    else {
      const e = x;
      x = null, W(() => le(this), !1), x = e;
    }
  if (y) {
    const e = this.observers;
    if (!e || e[e.length - 1] !== y) {
      const t = e ? e.length : 0;
      y.sources ? (y.sources.push(this), y.sourceSlots.push(t)) : (y.sources = [this], y.sourceSlots = [t]), e ? (e.push(y), this.observerSlots.push(y.sources.length - 1)) : (this.observers = [y], this.observerSlots = [y.sources.length - 1]);
    }
  }
  return this.value;
}
function Fe(e, t, n) {
  let i = e.value;
  return (!e.comparator || !e.comparator(i, t)) && (e.value = t, e.observers && e.observers.length && W(() => {
    for (let s = 0; s < e.observers.length; s += 1) {
      const r = e.observers[s], o = ue && ue.running;
      o && ue.disposed.has(r), (o ? !r.tState : !r.state) && (r.pure ? x.push(r) : O.push(r), r.observers && Ue(r)), o || (r.state = I);
    }
    if (x.length > 1e6)
      throw x = [], new Error();
  }, !1)), t;
}
function K(e) {
  if (!e.fn) return;
  G(e);
  const t = oe;
  gt(e, e.value, t);
}
function gt(e, t, n) {
  let i;
  const s = w, r = y;
  y = w = e;
  try {
    i = e.fn(t);
  } catch (o) {
    return e.pure && (e.state = I, e.owned && e.owned.forEach(G), e.owned = null), e.updatedAt = n + 1, $e(o);
  } finally {
    y = r, w = s;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? Fe(e, i) : e.value = i, e.updatedAt = n);
}
function ve(e, t, n, i = I, s) {
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
  return w === null || w !== Re && (w.owned ? w.owned.push(r) : w.owned = [r]), r;
}
function ie(e) {
  if (e.state === 0) return;
  if (e.state === te) return le(e);
  if (e.suspense && N(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < oe); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === I)
      K(e);
    else if (e.state === te) {
      const i = x;
      x = null, W(() => le(e, t[0]), !1), x = i;
    }
}
function W(e, t) {
  if (x) return e();
  let n = !1;
  t || (x = []), O ? n = !0 : O = [], oe++;
  try {
    const i = e();
    return bt(n), i;
  } catch (i) {
    n || (O = null), x = null, $e(i);
  }
}
function bt(e) {
  if (x && (Ve(x), x = null), e) return;
  const t = O;
  O = null, t.length && W(() => Le(t), !1);
}
function Ve(e) {
  for (let t = 0; t < e.length; t++) ie(e[t]);
}
function mt(e) {
  let t, n = 0;
  for (t = 0; t < e.length; t++) {
    const i = e[t];
    i.user ? e[n++] = i : ie(i);
  }
  for (t = 0; t < n; t++) ie(e[t]);
}
function le(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const i = e.sources[n];
    if (i.sources) {
      const s = i.state;
      s === I ? i !== t && (!i.updatedAt || i.updatedAt < oe) && ie(i) : s === te && le(i, t);
    }
  }
}
function Ue(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = te, n.pure ? x.push(n) : O.push(n), n.observers && Ue(n));
  }
}
function G(e) {
  let t;
  if (e.sources)
    for (; e.sources.length; ) {
      const n = e.sources.pop(), i = e.sourceSlots.pop(), s = n.observers;
      if (s && s.length) {
        const r = s.pop(), o = n.observerSlots.pop();
        i < s.length && (r.sourceSlots[o] = i, s[i] = r, n.observerSlots[i] = o);
      }
    }
  if (e.tOwned) {
    for (t = e.tOwned.length - 1; t >= 0; t--) G(e.tOwned[t]);
    delete e.tOwned;
  }
  if (e.owned) {
    for (t = e.owned.length - 1; t >= 0; t--) G(e.owned[t]);
    e.owned = null;
  }
  if (e.cleanups) {
    for (t = e.cleanups.length - 1; t >= 0; t--) e.cleanups[t]();
    e.cleanups = null;
  }
  e.state = 0;
}
function wt(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function $e(e, t = w) {
  throw wt(e);
}
function he(e) {
  if (typeof e == "function" && !e.length) return he(e());
  if (Array.isArray(e)) {
    const t = [];
    for (let n = 0; n < e.length; n++) {
      const i = he(e[n]);
      if (Array.isArray(i))
        if (i.length < 32768) t.push.apply(t, i);
        else for (let s = 0; s < i.length; s++) t.push(i[s]);
      else
        t.push(i);
    }
    return t;
  }
  return e;
}
function yt(e, t) {
  return function(i) {
    let s;
    return $(() => s = N(() => (w.context = {
      ...w.context,
      [e]: i.value
    }, ht(() => i.children))), void 0), s;
  };
}
const pt = Symbol("fallback");
function Pe(e) {
  for (let t = 0; t < e.length; t++) e[t]();
}
function vt(e, t, n = {}) {
  let i = [], s = [], r = [], o = 0, l = t.length > 1 ? [] : null;
  return ne(() => Pe(r)), () => {
    let a = e() || [], c = a.length, f, u;
    return a[rt], N(() => {
      let b, v, k, A, j, C, E, P, D;
      if (c === 0)
        o !== 0 && (Pe(r), r = [], i = [], s = [], o = 0, l && (l = [])), n.fallback && (i = [pt], s[0] = F((ce) => (r[0] = ce, n.fallback())), o = 1);
      else if (o === 0) {
        for (s = new Array(c), u = 0; u < c; u++)
          i[u] = a[u], s[u] = F(d);
        o = c;
      } else {
        for (k = new Array(c), A = new Array(c), l && (j = new Array(c)), C = 0, E = Math.min(o, c); C < E && i[C] === a[C]; C++) ;
        for (E = o - 1, P = c - 1; E >= C && P >= C && i[E] === a[P]; E--, P--)
          k[P] = s[E], A[P] = r[E], l && (j[P] = l[E]);
        for (b = /* @__PURE__ */ new Map(), v = new Array(P + 1), u = P; u >= C; u--)
          D = a[u], f = b.get(D), v[u] = f === void 0 ? -1 : f, b.set(D, u);
        for (f = C; f <= E; f++)
          D = i[f], u = b.get(D), u !== void 0 && u !== -1 ? (k[u] = s[f], A[u] = r[f], l && (j[u] = l[f]), u = v[u], b.set(D, u)) : r[f]();
        for (u = C; u < c; u++)
          u in k ? (s[u] = k[u], r[u] = A[u], l && (l[u] = j[u], l[u](u))) : s[u] = F(d);
        s = s.slice(0, o = c), i = a.slice(0);
      }
      return s;
    });
    function d(b) {
      if (r[u] = b, l) {
        const [v, k] = z(u);
        return l[u] = k, t(a[u], v);
      }
      return t(a[u]);
    }
  };
}
function g(e, t) {
  return N(() => e(t || {}));
}
function X() {
  return !0;
}
const ge = {
  get(e, t, n) {
    return t === J ? n : e.get(t);
  },
  has(e, t) {
    return t === J ? !0 : e.has(t);
  },
  set: X,
  deleteProperty: X,
  getOwnPropertyDescriptor(e, t) {
    return {
      configurable: !0,
      enumerable: !0,
      get() {
        return e.get(t);
      },
      set: X,
      deleteProperty: X
    };
  },
  ownKeys(e) {
    return e.keys();
  }
};
function fe(e) {
  return (e = typeof e == "function" ? e() : e) ? e : {};
}
function $t() {
  for (let e = 0, t = this.length; e < t; ++e) {
    const n = this[e]();
    if (n !== void 0) return n;
  }
}
function V(...e) {
  let t = !1;
  for (let o = 0; o < e.length; o++) {
    const l = e[o];
    t = t || !!l && J in l, e[o] = typeof l == "function" ? (t = !0, _(l)) : l;
  }
  if (Ie && t)
    return new Proxy({
      get(o) {
        for (let l = e.length - 1; l >= 0; l--) {
          const a = fe(e[l])[o];
          if (a !== void 0) return a;
        }
      },
      has(o) {
        for (let l = e.length - 1; l >= 0; l--)
          if (o in fe(e[l])) return !0;
        return !1;
      },
      keys() {
        const o = [];
        for (let l = 0; l < e.length; l++) o.push(...Object.keys(fe(e[l])));
        return [...new Set(o)];
      }
    }, ge);
  const n = {}, i = /* @__PURE__ */ Object.create(null);
  for (let o = e.length - 1; o >= 0; o--) {
    const l = e[o];
    if (!l) continue;
    const a = Object.getOwnPropertyNames(l);
    for (let c = a.length - 1; c >= 0; c--) {
      const f = a[c];
      if (f === "__proto__" || f === "constructor") continue;
      const u = Object.getOwnPropertyDescriptor(l, f);
      if (!i[f])
        i[f] = u.get ? {
          enumerable: !0,
          configurable: !0,
          get: $t.bind(n[f] = [u.get.bind(l)])
        } : u.value !== void 0 ? u : void 0;
      else {
        const d = n[f];
        d && (u.get ? d.push(u.get.bind(l)) : u.value !== void 0 && d.push(() => u.value));
      }
    }
  }
  const s = {}, r = Object.keys(i);
  for (let o = r.length - 1; o >= 0; o--) {
    const l = r[o], a = i[l];
    a && a.get ? Object.defineProperty(s, l, a) : s[l] = a ? a.value : void 0;
  }
  return s;
}
function We(e, ...t) {
  const n = t.length;
  if (Ie && J in e) {
    const s = n > 1 ? t.flat() : t[0], r = /* @__PURE__ */ new Set(), o = t.map((l) => {
      const a = l.filter((c) => !r.has(c) && (r.add(c), !0));
      return new Proxy({
        get(c) {
          return a.includes(c) ? e[c] : void 0;
        },
        has(c) {
          return a.includes(c) && c in e;
        },
        keys() {
          return a.filter((c) => c in e);
        }
      }, ge);
    });
    return o.push(new Proxy({
      get(l) {
        return s.includes(l) ? void 0 : e[l];
      },
      has(l) {
        return s.includes(l) ? !1 : l in e;
      },
      keys() {
        return Object.keys(e).filter((l) => !s.includes(l));
      }
    }, ge)), o;
  }
  const i = [];
  for (let s = 0; s <= n; s++)
    i[s] = {};
  for (const s of Object.getOwnPropertyNames(e)) {
    let r = n;
    for (let a = 0; a < t.length; a++)
      if (t[a].includes(s)) {
        r = a;
        break;
      }
    const o = Object.getOwnPropertyDescriptor(e, s);
    !o.get && !o.set && o.enumerable && o.writable && o.configurable ? i[r][s] = o.value : Object.defineProperty(i[r], s, o);
  }
  return i;
}
const kt = (e) => `Stale read from <${e}>.`;
function U(e) {
  const t = "fallback" in e && {
    fallback: () => e.fallback
  };
  return _(vt(() => e.each, e.children, t || void 0));
}
function S(e) {
  const t = e.keyed, n = _(() => e.when, void 0, void 0), i = t ? n : _(n, void 0, {
    equals: (s, r) => !s == !r
  });
  return _(() => {
    const s = i();
    if (s) {
      const r = e.children;
      return typeof r == "function" && r.length > 0 ? N(() => r(t ? s : () => {
        if (!N(i)) throw kt("Show");
        return n();
      })) : r;
    }
    return e.fallback;
  }, void 0, void 0);
}
const St = [
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
], xt = /* @__PURE__ */ new Set([
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
  ...St
]), Ct = /* @__PURE__ */ new Set(["innerHTML", "textContent", "innerText", "children"]), _t = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
}), At = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
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
function Et(e, t) {
  const n = At[e];
  return typeof n == "object" ? n[t] ? n.$ : void 0 : n;
}
const Pt = /* @__PURE__ */ new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]), zt = /* @__PURE__ */ new Set([
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
]), Mt = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
}, be = (e) => _(() => e());
function Nt(e, t, n) {
  let i = n.length, s = t.length, r = i, o = 0, l = 0, a = t[s - 1].nextSibling, c = null;
  for (; o < s || l < r; ) {
    if (t[o] === n[l]) {
      o++, l++;
      continue;
    }
    for (; t[s - 1] === n[r - 1]; )
      s--, r--;
    if (s === o) {
      const f = r < i ? l ? n[l - 1].nextSibling : n[r - l] : a;
      for (; l < r; ) e.insertBefore(n[l++], f);
    } else if (r === l)
      for (; o < s; )
        (!c || !c.has(t[o])) && t[o].remove(), o++;
    else if (t[o] === n[r - 1] && n[l] === t[s - 1]) {
      const f = t[--s].nextSibling;
      e.insertBefore(n[l++], t[o++].nextSibling), e.insertBefore(n[--r], f), t[s] = n[r];
    } else {
      if (!c) {
        c = /* @__PURE__ */ new Map();
        let u = l;
        for (; u < r; ) c.set(n[u], u++);
      }
      const f = c.get(t[o]);
      if (f != null)
        if (l < f && f < r) {
          let u = o, d = 1, b;
          for (; ++u < s && u < r && !((b = c.get(t[u])) == null || b !== f + d); )
            d++;
          if (d > f - l) {
            const v = t[o];
            for (; l < f; ) e.insertBefore(n[l++], v);
          } else e.replaceChild(n[l++], t[o++]);
        } else o++;
      else t[o++].remove();
    }
  }
}
const ze = "_$DX_DELEGATE";
function Tt(e, t, n, i = {}) {
  let s;
  return F((r) => {
    s = r, t === document ? e() : h(t, e(), t.firstChild ? null : void 0, n);
  }, i.owner), () => {
    s(), t.textContent = "";
  };
}
function p(e, t, n, i) {
  let s;
  const r = () => {
    const l = document.createElement("template");
    return l.innerHTML = e, l.content.firstChild;
  }, o = () => (s || (s = r())).cloneNode(!0);
  return o.cloneNode = o, o;
}
function ke(e, t = window.document) {
  const n = t[ze] || (t[ze] = /* @__PURE__ */ new Set());
  for (let i = 0, s = e.length; i < s; i++) {
    const r = e[i];
    n.has(r) || (n.add(r), t.addEventListener(r, Vt));
  }
}
function M(e, t, n) {
  n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function Ot(e, t, n, i) {
  i == null ? e.removeAttributeNS(t, n) : e.setAttributeNS(t, n, i);
}
function Dt(e, t, n) {
  n ? e.setAttribute(t, "") : e.removeAttribute(t);
}
function It(e, t) {
  t == null ? e.removeAttribute("class") : e.className = t;
}
function Lt(e, t, n, i) {
  if (i)
    Array.isArray(n) ? (e[`$$${t}`] = n[0], e[`$$${t}Data`] = n[1]) : e[`$$${t}`] = n;
  else if (Array.isArray(n)) {
    const s = n[0];
    e.addEventListener(t, n[0] = (r) => s.call(e, n[1], r));
  } else e.addEventListener(t, n, typeof n != "function" && n);
}
function Rt(e, t, n = {}) {
  const i = Object.keys(t || {}), s = Object.keys(n);
  let r, o;
  for (r = 0, o = s.length; r < o; r++) {
    const l = s[r];
    !l || l === "undefined" || t[l] || (Ne(e, l, !1), delete n[l]);
  }
  for (r = 0, o = i.length; r < o; r++) {
    const l = i[r], a = !!t[l];
    !l || l === "undefined" || n[l] === a || !a || (Ne(e, l, !0), n[l] = a);
  }
  return n;
}
function jt(e, t, n) {
  if (!t) return n ? M(e, "style") : t;
  const i = e.style;
  if (typeof t == "string") return i.cssText = t;
  typeof n == "string" && (i.cssText = n = void 0), n || (n = {}), t || (t = {});
  let s, r;
  for (r in n)
    t[r] == null && i.removeProperty(r), delete n[r];
  for (r in t)
    s = t[r], s !== n[r] && (i.setProperty(r, s), n[r] = s);
  return n;
}
function Me(e, t, n) {
  n != null ? e.style.setProperty(t, n) : e.style.removeProperty(t);
}
function qe(e, t = {}, n, i) {
  const s = {};
  return i || $(() => s.children = H(e, t.children, s.children)), $(() => typeof t.ref == "function" && Se(t.ref, e)), $(() => Bt(e, t, n, !0, s, !0)), s;
}
function Se(e, t, n) {
  return N(() => e(t, n));
}
function h(e, t, n, i) {
  if (n !== void 0 && !i && (i = []), typeof t != "function") return H(e, t, i, n);
  $((s) => H(e, t(), s, n), i);
}
function Bt(e, t, n, i, s = {}, r = !1) {
  t || (t = {});
  for (const o in s)
    if (!(o in t)) {
      if (o === "children") continue;
      s[o] = Te(e, o, null, s[o], n, r, t);
    }
  for (const o in t) {
    if (o === "children")
      continue;
    const l = t[o];
    s[o] = Te(e, o, l, s[o], n, r, t);
  }
}
function Ft(e) {
  return e.toLowerCase().replace(/-([a-z])/g, (t, n) => n.toUpperCase());
}
function Ne(e, t, n) {
  const i = t.trim().split(/\s+/);
  for (let s = 0, r = i.length; s < r; s++) e.classList.toggle(i[s], n);
}
function Te(e, t, n, i, s, r, o) {
  let l, a, c, f, u;
  if (t === "style") return jt(e, n, i);
  if (t === "classList") return Rt(e, n, i);
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
    const d = t.slice(2).toLowerCase(), b = Pt.has(d);
    if (!b && i) {
      const v = Array.isArray(i) ? i[0] : i;
      e.removeEventListener(d, v);
    }
    (b || n) && (Lt(e, d, n, b), b && ke([d]));
  } else if (t.slice(0, 5) === "attr:")
    M(e, t.slice(5), n);
  else if (t.slice(0, 5) === "bool:")
    Dt(e, t.slice(5), n);
  else if ((u = t.slice(0, 5) === "prop:") || (c = Ct.has(t)) || !s && ((f = Et(t, e.tagName)) || (a = xt.has(t))) || (l = e.nodeName.includes("-") || "is" in o))
    u && (t = t.slice(5), a = !0), t === "class" || t === "className" ? It(e, n) : l && !a && !c ? e[Ft(t)] = n : (t === "value" || t === "defaultValue") && (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA") ? e[f || t] = n ?? "" : e[f || t] = n;
  else {
    const d = s && t.indexOf(":") > -1 && Mt[t.split(":")[0]];
    d ? Ot(e, d, t, n) : M(e, _t[t] || t, n);
  }
  return n;
}
function Vt(e) {
  let t = e.target;
  const n = `$$${e.type}`, i = e.target, s = e.currentTarget, r = (a) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: a
  }), o = () => {
    const a = t[n];
    if (a && !t.disabled) {
      const c = t[`${n}Data`];
      if (c !== void 0 ? a.call(t, c, e) : a.call(t, e), e.cancelBubble) return;
    }
    return t.host && typeof t.host != "string" && !t.host._$host && t.contains(e.target) && r(t.host), !0;
  }, l = () => {
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
      for (let c = 0; c < a.length - 2 && (t = a[c], !!o()); c++) {
        if (t._$host) {
          t = t._$host, l();
          break;
        }
        if (t.parentNode === s)
          break;
      }
    } else l();
    r(i);
  } finally {
    e = t = null;
  }
}
function H(e, t, n, i, s) {
  for (; typeof n == "function"; ) n = n();
  if (t === n) return n;
  const r = typeof t, o = i !== void 0;
  if (e = o && n[0] && n[0].parentNode || e, r === "string" || r === "number") {
    if (r === "number" && (t = t.toString(), t === n))
      return n;
    if (o) {
      let l = n[0];
      l && l.nodeType === 3 ? l.data !== t && (l.data = t) : l = document.createTextNode(t), n = B(e, n, i, l);
    } else
      n !== "" && typeof n == "string" ? n = e.firstChild.data = t : n = e.textContent = t;
  } else if (t == null || r === "boolean")
    n = B(e, n, i);
  else {
    if (r === "function")
      return $(() => {
        let l = t();
        for (; typeof l == "function"; ) l = l();
        n = H(e, l, n, i);
      }), () => n;
    if (Array.isArray(t)) {
      const l = [], a = n && Array.isArray(n);
      if (me(l, t, n, s))
        return $(() => n = H(e, l, n, i, !0)), () => n;
      if (l.length === 0) {
        if (n = B(e, n, i), o) return n;
      } else a ? n.length === 0 ? Oe(e, l, i) : Nt(e, n, l) : (n && B(e), Oe(e, l));
      n = l;
    } else if (t.nodeType) {
      if (Array.isArray(n)) {
        if (o) return n = B(e, n, i, t);
        B(e, n, null, t);
      } else n == null || n === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
      n = t;
    }
  }
  return n;
}
function me(e, t, n, i) {
  let s = !1;
  for (let r = 0, o = t.length; r < o; r++) {
    let l = t[r], a = n && n[e.length], c;
    if (!(l == null || l === !0 || l === !1)) if ((c = typeof l) == "object" && l.nodeType)
      e.push(l);
    else if (Array.isArray(l))
      s = me(e, l, a) || s;
    else if (c === "function")
      if (i) {
        for (; typeof l == "function"; ) l = l();
        s = me(e, Array.isArray(l) ? l : [l], Array.isArray(a) ? a : [a]) || s;
      } else
        e.push(l), s = !0;
    else {
      const f = String(l);
      a && a.nodeType === 3 && a.data === f ? e.push(a) : e.push(document.createTextNode(f));
    }
  }
  return s;
}
function Oe(e, t, n = null) {
  for (let i = 0, s = t.length; i < s; i++) e.insertBefore(t[i], n);
}
function B(e, t, n, i) {
  if (n === void 0) return e.textContent = "";
  const s = i || document.createTextNode("");
  if (t.length) {
    let r = !1;
    for (let o = t.length - 1; o >= 0; o--) {
      const l = t[o];
      if (s !== l) {
        const a = l.parentNode === e;
        !r && !o ? a ? e.replaceChild(s, l) : e.insertBefore(s, n) : a && l.remove();
      } else r = !0;
    }
  } else e.insertBefore(s, n);
  return [s];
}
const Ut = "http://www.w3.org/2000/svg";
function Ge(e, t = !1, n = void 0) {
  return t ? document.createElementNS(Ut, e) : document.createElement(e, {
    is: n
  });
}
function Wt(e) {
  const {
    useShadow: t
  } = e, n = document.createTextNode(""), i = () => e.mount || document.body, s = ct();
  let r;
  return je(() => {
    r || (r = ut(s, () => _(() => e.children)));
    const o = i();
    if (o instanceof HTMLHeadElement) {
      const [l, a] = z(!1), c = () => a(!0);
      F((f) => h(o, () => l() ? f() : r(), null)), ne(c);
    } else {
      const l = Ge(e.isSVG ? "g" : "div", e.isSVG), a = t && l.attachShadow ? l.attachShadow({
        mode: "open"
      }) : l;
      Object.defineProperty(l, "_$host", {
        get() {
          return n.parentNode;
        },
        configurable: !0
      }), h(a, r), o.appendChild(l), e.ref && e.ref(l), ne(() => o.contains(l) && o.removeChild(l));
    }
  }, void 0, {
    render: !0
  }), n;
}
function qt(e, t) {
  const n = _(e);
  return _(() => {
    const i = n();
    switch (typeof i) {
      case "function":
        return N(() => i(t));
      case "string":
        const s = zt.has(i), r = Ge(i, s, N(() => t.is));
        return qe(r, t, s), r;
    }
  });
}
function Gt(e) {
  const [, t] = We(e, ["component"]);
  return qt(() => e.component, t);
}
var Ht = ft({
  size: 24,
  color: "currentColor",
  strokeWidth: 2,
  absoluteStrokeWidth: !1,
  nonScalingStroke: !1,
  class: ""
}), Zt = /* @__PURE__ */ p("<svg>"), Kt = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, R = Kt, we = (...e) => e.filter((t, n, i) => !!t && t.trim() !== "" && i.indexOf(t) === n).join(" ").trim();
function de(e) {
  return e != null;
}
function Xt(e, t = {}) {
  const n = t.attributeNames ?? {}, i = (d) => n[d] ?? d, s = e.size ?? e.width ?? R.width, r = e.size ?? e.height ?? R.height, o = e.aliases?.filter((d) => typeof d == "string" && d.trim() !== "").map((d) => `lucide-${d}`) ?? [], l = [...e.name ? [`lucide-${e.name}`] : [], ...o], a = t.className?.split(" ").filter(Boolean) ?? [], c = t.includeDefaultClasses === !1 ? we(...a) : we("lucide", ...l, ...a), f = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? R["stroke-width"]) * Number(e.size ?? e.width ?? R.width) / Number(t.size ?? t.width ?? R.width) : t.strokeWidth ?? R["stroke-width"];
  return ["svg", {
    ...Object.entries(R).reduce((d, [b, v]) => (d[i(b)] = v, d), {}),
    ..."color" in t && t.color && {
      [i("stroke")]: t.color
    },
    ..."size" in t && de(t.size) && {
      [i("width")]: t.size,
      [i("height")]: t.size
    },
    ..."width" in t && de(t.width) && {
      [i("width")]: t.width
    },
    ..."height" in t && de(t.height) && {
      [i("height")]: t.height
    },
    [i("stroke-width")]: f,
    ...c && {
      [i("class")]: c
    },
    [i("viewBox")]: `0 0 ${s} ${r}`,
    ...t.hasA11yProp === !1 ? {
      [i("aria-hidden")]: "true"
    } : {},
    ..."attributes" in t && t.attributes
  }, e.node.map((d) => {
    const [b, v, k] = d, A = t.nonScalingStroke ? {
      [i("vector-effect")]: "non-scaling-stroke",
      ...v
    } : v;
    return k ? [b, A, k] : [b, A];
  })];
}
var Qt = Xt, Yt = (e) => {
  for (const t in e)
    if (t.startsWith("aria-") || t === "role" || t === "title")
      return !0;
  return !1;
}, Jt = (e) => {
  const [t, n] = We(e, ["color", "size", "width", "height", "strokeWidth", "children", "class", "icon", "iconNode", "absoluteStrokeWidth", "nonScalingStroke"]), i = dt(Ht), s = _(() => t.icon ?? {
    node: t.iconNode ?? [],
    size: 24,
    aliases: []
  }), r = _(() => Qt(s(), {
    color: t.color ?? i.color,
    width: t.width ?? t.size ?? i.size,
    height: t.height ?? t.size ?? i.size,
    strokeWidth: t.strokeWidth ?? i.strokeWidth,
    absoluteStrokeWidth: t.absoluteStrokeWidth ?? i.absoluteStrokeWidth,
    nonScalingStroke: t.nonScalingStroke ?? i.nonScalingStroke,
    className: we("lucide-icon", i.class, t.class),
    hasA11yProp: !!t.children || Yt(n),
    attributes: n
  }));
  return (() => {
    var o = Zt();
    return qe(o, V(() => r()[1]), !0, !0), h(o, g(U, {
      get each() {
        return r()[2] ?? [];
      },
      children: ([l, a]) => g(Gt, V({
        component: l
      }, a))
    })), o;
  })();
}, ae = Jt, He = {
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
He.node;
var en = (e) => g(ae, V(e, {
  icon: He
})), tn = en, Ze = {
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
Ze.node;
var nn = (e) => g(ae, V(e, {
  icon: Ze
})), ln = nn, Ke = {
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
Ke.node;
var sn = (e) => g(ae, V(e, {
  icon: Ke
})), rn = sn, Xe = {
  name: "chevron-right",
  size: 24,
  node: [["path", {
    d: "m9 18 6-6-6-6",
    key: "mthhwq"
  }]]
};
Xe.node;
var on = (e) => g(ae, V(e, {
  icon: Xe
})), ye = on, an = /* @__PURE__ */ p("<div class=sp-menu-backdrop><div class=sp-menu role=menu>"), cn = /* @__PURE__ */ p("<div class=sp-menu-sep role=separator>"), un = /* @__PURE__ */ p("<button type=button class=sp-menu-item role=menuitem>");
function fn(e) {
  if (e instanceof MouseEvent && (e.clientX || e.clientY)) return {
    x: e.clientX,
    y: e.clientY
  };
  const t = e.currentTarget.getBoundingClientRect();
  return {
    x: t.left + 12,
    y: t.top + Math.min(t.height, 24)
  };
}
const Qe = (e) => e.key === "ContextMenu" || e.key === "F10" && e.shiftKey, Q = 8;
function dn(e) {
  let t;
  const [n, i] = z({
    x: e.menu.x,
    y: e.menu.y
  }), s = document.activeElement, r = () => [...t?.querySelectorAll(".sp-menu-item") ?? []];
  at(() => {
    if (!t) return;
    const {
      width: a,
      height: c
    } = t.getBoundingClientRect();
    i({
      x: Math.max(Q, Math.min(e.menu.x, window.innerWidth - a - Q)),
      y: Math.max(Q, Math.min(e.menu.y, window.innerHeight - c - Q))
    }), r()[0]?.focus();
  }), ne(() => s?.focus?.());
  function o(a) {
    e.onClose(), a.run();
  }
  function l(a) {
    a.stopPropagation();
    const c = r(), f = c.indexOf(document.activeElement);
    if (a.key === "Escape")
      a.preventDefault(), e.onClose();
    else if (a.key === "ArrowDown" || a.key === "ArrowUp") {
      a.preventDefault();
      const u = a.key === "ArrowDown" ? 1 : -1;
      c[(f + u + c.length) % c.length]?.focus();
    } else a.key === "Home" || a.key === "End" ? (a.preventDefault(), (a.key === "Home" ? c[0] : c[c.length - 1])?.focus()) : a.key === "Tab" && (a.preventDefault(), e.onClose());
  }
  return g(Wt, {
    get children() {
      var a = an(), c = a.firstChild;
      a.$$contextmenu = (u) => {
        u.preventDefault(), e.onClose();
      }, a.$$mousedown = (u) => {
        u.target === u.currentTarget && e.onClose();
      }, c.$$contextmenu = (u) => u.preventDefault(), c.$$keydown = l;
      var f = t;
      return typeof f == "function" ? Se(f, c) : t = c, h(c, g(U, {
        get each() {
          return e.menu.items;
        },
        children: (u) => g(S, {
          when: u !== "separator" && u,
          get fallback() {
            return cn();
          },
          children: (d) => (() => {
            var b = un();
            return b.$$click = () => o(d()), h(b, () => d().label), b;
          })()
        })
      })), $((u) => {
        var d = `${n().x}px`, b = `${n().y}px`;
        return d !== u.e && Me(c, "left", u.e = d), b !== u.t && Me(c, "top", u.t = b), u;
      }, {
        e: void 0,
        t: void 0
      }), a;
    }
  });
}
ke(["mousedown", "contextmenu", "keydown", "click"]);
const hn = /^[A-Za-z0-9 _.,:;/()\[\]=?#&%@+-]*$/;
function gn(e) {
  return hn.test(e);
}
function bn(e) {
  const t = e.replace(/\s+/g, " ").trim();
  return t && gn(t) ? `claude "${t}"` : null;
}
const Y = {
  interval: { min: 30, max: 3600 },
  minSeverity: { min: 0, max: 5 },
  groupMin: { min: 2, max: 100 }
}, Ye = ["Not classified", "Information", "Warning", "Average", "High", "Disaster"];
function pe(e) {
  return `${e.host}: ${e.name}`;
}
var mn = /* @__PURE__ */ p("<span class=zb-tag>"), wn = /* @__PURE__ */ p("<li class=zb-problem tabindex=0><span class=zb-dot></span><span class=zb-problem-text></span><span class=zb-since>"), yn = /* @__PURE__ */ p("<ul class=zb-checks>"), pn = /* @__PURE__ */ p("<div class=zb-incident><button class=zb-incident-head><span class=zb-dot></span><span class=zb-incident-title></span><span class=zb-since>"), vn = /* @__PURE__ */ p('<label class=zb-field><span></span><input class="zb-input zb-num"type=number required><small>'), $n = /* @__PURE__ */ p("<label class=zb-check><input type=checkbox name=clearToken> Remove the saved token"), kn = /* @__PURE__ */ p("<button class=zb-btn type=button>Cancel"), Sn = /* @__PURE__ */ p(`<form class=zb-settings><label class=zb-field><span>Zabbix address</span><input class=zb-input name=url type=url placeholder=https://zabbix.example.com required></label><label class=zb-field><span>API token</span><input class=zb-input name=token type=password autocomplete=off><small>A token for a user that can only read is enough.</small></label><label class=zb-field><span>Alert from severity</span><select class="zb-input zb-select"name=minSeverity></select></label><label class=zb-check><input type=checkbox name=alertAcknowledged> Alert on acknowledged problems too</label><label class=zb-check><input type=checkbox name=allowExpiredCert> Accept an expired certificate</label><small class=zb-hint>Only expiry is forgiven: the chain and the host name are still checked.</small><label class=zb-field><span>Never alert</span><textarea class=zb-input name=mute rows=3 placeholder="host/problem, one per line
Dev-*/*"></textarea></label><small class=zb-hint>Patterns are host/problem with * as a wildcard; without a / they match the problem on any host.</small><div class=zb-row><button class="zb-btn zb-btn-primary"type=submit>`), xn = /* @__PURE__ */ p("<option>"), Cn = /* @__PURE__ */ p('<button class=zb-icon-btn title="Check now">'), _n = /* @__PURE__ */ p(`<button class=zb-icon-btn title="Open Zabbix's Problems page">`), De = /* @__PURE__ */ p("<div class=zb-error>"), An = /* @__PURE__ */ p("<div class=zb-status> active problems · checked "), En = /* @__PURE__ */ p("<div class=zb-incidents>"), Pn = /* @__PURE__ */ p("<button class=zb-section-toggle>Active, not alerted (<!>)"), zn = /* @__PURE__ */ p('<ul class="zb-checks zb-quiet">'), Mn = /* @__PURE__ */ p("<button class=zb-section-toggle>Settings"), Nn = /* @__PURE__ */ p("<div class=zb-empty>Point this at a Zabbix server to get alerted when a problem opens."), Tn = /* @__PURE__ */ p("<div class=zb-panel><div class=zb-header><span class=zb-title>Zabbix</span><button class=zb-icon-btn title=Close></button></div><div class=zb-scroll>"), On = /* @__PURE__ */ p("<div class=zb-empty>Nothing alerting.");
const m = F(() => {
  const [e, t] = z(null), [n, i] = z(null), [s, r] = z(/* @__PURE__ */ new Set()), [o, l] = z(!1), [a, c] = z(!1), [f, u] = z(null), [d, b] = z(null);
  return {
    snap: e,
    setSnap: t,
    config: n,
    setConfig: i,
    open: s,
    setOpen: r,
    showSettings: o,
    setShowSettings: l,
    showQuiet: a,
    setShowQuiet: c,
    error: f,
    setError: u,
    menu: d,
    setMenu: b
  };
});
let Je = null;
const et = (e, t) => m.setOpen((n) => {
  const i = new Set(n);
  return t ?? !i.has(e) ? i.add(e) : i.delete(e), i;
});
function xe(e) {
  if (!e) return "never";
  const t = Math.max(0, Math.round((Date.now() - Date.parse(e)) / 1e3));
  return t < 60 ? `${t}s ago` : t < 3600 ? `${Math.round(t / 60)} min ago` : t < 86400 ? `${Math.round(t / 3600)} h ago` : `${Math.round(t / 86400)} d ago`;
}
const Z = (e) => Ye[e] ?? "Zabbix";
function se(e, t) {
  const n = t.map((i) => `triggerids%5B%5D=${encodeURIComponent(i.key)}`).join("&");
  return `${e}/zabbix.php?action=problem.view&filter_set=1${n ? `&${n}` : ""}`;
}
const Dn = (e, t) => `${e}/tr_events.php?triggerid=${encodeURIComponent(t.key)}&eventid=${encodeURIComponent(t.eventId)}`;
function In(e, t) {
  const n = t.slice(0, 20).map((s) => `trigger ${s.key}${s.eventId ? ` (event ${s.eventId})` : ""}`).join(", "), i = t.length > 20 ? ` and ${t.length - 20} more on the Problems page` : "";
  return bn(`Look into ${t.length === 1 ? "this active Zabbix problem" : "these active Zabbix problems"} on ${e} (JSON-RPC API at ${e}/api_jsonrpc.php): ${n}${i}. Read only: change nothing in Zabbix. Tell me what ${t.length === 1 ? "it is" : "each is"} and the likely cause, then wait for what I want to do.`);
}
function re(e, t, n, i) {
  t.preventDefault(), t.stopPropagation();
  const s = m.snap()?.url ?? "", r = [], o = e.openTerminal && s ? In(s, n) : null;
  o && r.push({
    label: "Ask Claude about it",
    run: () => e.openTerminal({
      command: o,
      cwd: Je ?? void 0,
      run: !0
    })
  }), r.length && r.push("separator"), s && n.length && r.push({
    label: "Open in Zabbix",
    run: () => e.openExternal(se(s, n))
  }), s && n.length === 1 && n[0].eventId && r.push({
    label: "Open the event",
    run: () => e.openExternal(Dn(s, n[0]))
  });
  const l = (a) => void (e.copyText ? e.copyText(a) : navigator.clipboard.writeText(a)).catch(() => {
  });
  r.push({
    label: "Copy text",
    run: () => l(i)
  }), s && n.length && r.push({
    label: "Copy link",
    run: () => l(se(s, n))
  }), m.setMenu({
    ...fn(t),
    items: r
  });
}
function tt(e) {
  const t = () => e.problem, n = () => e.showHost === !1 ? t().name : pe(t()), i = () => `${pe(t())} (${Z(t().severity)}, since ${t().since})`;
  return (() => {
    var s = wn(), r = s.firstChild, o = r.nextSibling, l = o.nextSibling;
    return s.$$dblclick = () => m.snap()?.url && e.api.openExternal(se(m.snap().url, [t()])), s.$$keydown = (a) => Qe(a) && re(e.api, a, [t()], i()), s.$$contextmenu = (a) => re(e.api, a, [t()], i()), h(o, n), h(s, g(S, {
      get when() {
        return e.tag;
      },
      get children() {
        var a = mn();
        return h(a, () => e.tag), a;
      }
    }), l), h(l, () => xe(t().since)), $((a) => {
      var c = `${Z(t().severity)} · since ${t().since ? new Date(t().since).toLocaleString() : "?"}`, f = t().severity;
      return c !== a.e && M(s, "title", a.e = c), f !== a.t && M(r, "data-sev", a.t = f), a;
    }, {
      e: void 0,
      t: void 0
    }), s;
  })();
}
function Ln(e) {
  const t = () => e.incident, n = () => m.open().has(t().id), i = () => [t().title, ...t().problems.map((s) => `- ${pe(s)} (${Z(s.severity)})`)].join(`
`);
  return (() => {
    var s = pn(), r = s.firstChild, o = r.firstChild, l = o.nextSibling, a = l.nextSibling;
    return r.$$keydown = (c) => Qe(c) && re(e.api, c, t().problems, i()), r.$$contextmenu = (c) => re(e.api, c, t().problems, i()), r.$$click = () => et(t().id), h(r, g(ye, {
      size: 12
    }), o), h(l, () => t().title), h(a, () => xe(t().problems.map((c) => c.since).filter(Boolean).sort()[0] ?? t().since)), h(s, g(S, {
      get when() {
        return be(() => !!n())() && t().problems.length > 0;
      },
      get children() {
        var c = yn();
        return h(c, g(U, {
          get each() {
            return t().problems;
          },
          children: (f) => g(tt, {
            get api() {
              return e.api;
            },
            problem: f,
            get showHost() {
              return t().kind !== "host";
            }
          })
        })), c;
      }
    }), null), $((c) => {
      var f = t().id, u = !!n(), d = t().severity >= 0 ? Z(t().severity) : void 0, b = t().severity;
      return f !== c.e && M(s, "data-incident", c.e = f), u !== c.t && r.classList.toggle("expanded", c.t = u), d !== c.a && M(r, "title", c.a = d), b !== c.o && M(o, "data-sev", c.o = b), c;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    }), s;
  })();
}
function Rn(e, t) {
  return e.maintenance ? "maintenance" : e.acknowledged ? "acked" : e.severity < t ? Z(e.severity).toLowerCase() : "";
}
function jn(e) {
  const t = () => m.config();
  let n;
  const [i, s] = z(!1), r = (l) => {
    l.preventDefault();
    const a = new FormData(n), c = {
      url: String(a.get("url") ?? ""),
      interval: Number(a.get("interval")),
      minSeverity: Number(a.get("minSeverity")),
      groupMin: Number(a.get("groupMin")),
      alertAcknowledged: a.get("alertAcknowledged") === "on",
      allowExpiredCert: a.get("allowExpiredCert") === "on",
      mute: String(a.get("mute") ?? "")
    }, f = String(a.get("token") ?? "");
    f !== "" && (c.token = f), a.get("clearToken") === "on" && (c.token = ""), s(!0), e.api.invoke("configure", c).then((u) => {
      m.setConfig(u), m.setError(null), m.setShowSettings(!1), n.reset();
    }, (u) => m.setError(u instanceof Error ? u.message : String(u))).finally(() => s(!1));
  }, o = (l, a, c) => (() => {
    var f = vn(), u = f.firstChild, d = u.nextSibling, b = d.nextSibling;
    return h(u, a), M(d, "name", l), h(b, c), $((v) => {
      var k = Y[l].min, A = Y[l].max;
      return k !== v.e && M(d, "min", v.e = k), A !== v.t && M(d, "max", v.t = A), v;
    }, {
      e: void 0,
      t: void 0
    }), $(() => d.value = t()?.[l] ?? ""), f;
  })();
  return g(S, {
    get when() {
      return t();
    },
    keyed: !0,
    children: (l) => (() => {
      var a = Sn(), c = a.firstChild, f = c.firstChild, u = f.nextSibling, d = c.nextSibling, b = d.firstChild, v = b.nextSibling, k = d.nextSibling, A = k.firstChild, j = A.nextSibling, C = k.nextSibling, E = C.firstChild, P = C.nextSibling, D = P.firstChild, ce = P.nextSibling, Ce = ce.nextSibling, nt = Ce.firstChild, it = nt.nextSibling, lt = Ce.nextSibling, _e = lt.nextSibling, Ae = _e.firstChild;
      a.addEventListener("submit", r);
      var Ee = n;
      return typeof Ee == "function" ? Se(Ee, a) : n = a, h(a, g(S, {
        get when() {
          return l.hasToken;
        },
        get children() {
          return $n();
        }
      }), k), h(j, g(U, {
        get each() {
          return [...Ye];
        },
        children: (T, q) => (() => {
          var L = xn();
          return h(L, T), $(() => L.selected = q() === l.minSeverity), $(() => L.value = q()), L;
        })()
      })), h(a, () => o("interval", "Poll every (s)", `${Y.interval.min}–${Y.interval.max}`), C), h(a, () => o("groupMin", "Bundle from", "same problem on this many hosts, or this many problems on one host"), C), h(it, () => l.mute.join(`
`)), h(Ae, () => i() ? "Saving…" : "Save"), h(_e, g(S, {
        get when() {
          return m.snap()?.configured;
        },
        get children() {
          var T = kn();
          return T.$$click = () => m.setShowSettings(!1), T;
        }
      }), null), $((T) => {
        var q = l.hasToken ? "saved (type to replace)" : "Users → API tokens", L = i();
        return q !== T.e && M(v, "placeholder", T.e = q), L !== T.t && (Ae.disabled = T.t = L), T;
      }, {
        e: void 0,
        t: void 0
      }), $(() => u.value = l.url), $(() => E.checked = l.alertAcknowledged), $(() => D.checked = l.allowExpiredCert), a;
    })()
  });
}
function Bn(e) {
  const [t, n] = z(!1), i = () => m.snap(), s = () => {
    n(!0), e.api.invoke("poll").then((r) => m.setSnap(r), (r) => m.setError(String(r))).finally(() => n(!1));
  };
  return (() => {
    var r = Tn(), o = r.firstChild, l = o.firstChild, a = l.nextSibling, c = o.nextSibling;
    return h(o, g(S, {
      get when() {
        return i()?.configured;
      },
      get children() {
        return [(() => {
          var f = Cn();
          return f.$$click = s, h(f, g(ln, {
            size: 14
          })), $(() => f.disabled = t()), f;
        })(), (() => {
          var f = _n();
          return f.$$click = () => e.api.openExternal(se(i().url, [])), h(f, g(rn, {
            size: 14
          })), f;
        })()];
      }
    }), a), a.$$click = () => e.api.close(), h(a, g(tn, {
      size: 14
    })), h(c, g(S, {
      get when() {
        return m.error();
      },
      get children() {
        var f = De();
        return h(f, () => m.error()), f;
      }
    }), null), h(c, g(S, {
      get when() {
        return be(() => !!i()?.configured)() && !m.showSettings();
      },
      get children() {
        return [(() => {
          var f = An(), u = f.firstChild;
          return h(f, () => i().total, u), h(f, () => xe(i().lastPoll), null), h(f, g(S, {
            get when() {
              return i().lastError;
            },
            get children() {
              var d = De();
              return h(d, () => i().lastError), d;
            }
          }), null), f;
        })(), g(S, {
          get when() {
            return i().incidents.length > 0;
          },
          get fallback() {
            return On();
          },
          get children() {
            var f = En();
            return h(f, g(U, {
              get each() {
                return i().incidents;
              },
              children: (u) => g(Ln, {
                get api() {
                  return e.api;
                },
                incident: u
              })
            })), f;
          }
        }), g(S, {
          get when() {
            return i().quiet.length > 0;
          },
          get children() {
            return [(() => {
              var f = Pn(), u = f.firstChild, d = u.nextSibling;
              return d.nextSibling, f.$$click = () => m.setShowQuiet((b) => !b), h(f, g(ye, {
                size: 12
              }), u), h(f, () => i().quiet.length, d), $(() => f.classList.toggle("expanded", !!m.showQuiet())), f;
            })(), g(S, {
              get when() {
                return m.showQuiet();
              },
              get children() {
                var f = zn();
                return h(f, g(U, {
                  get each() {
                    return i().quiet;
                  },
                  children: (u) => g(tt, {
                    get api() {
                      return e.api;
                    },
                    problem: u,
                    get tag() {
                      return Rn(u, m.config()?.minSeverity ?? 0);
                    }
                  })
                })), f;
              }
            })];
          }
        }), (() => {
          var f = Mn(), u = f.firstChild;
          return f.$$click = () => m.setShowSettings(!0), h(f, g(ye, {
            size: 12
          }), u), f;
        })()];
      }
    }), null), h(c, g(S, {
      get when() {
        return be(() => !!i())() && (!i().configured || m.showSettings());
      },
      get children() {
        return [g(S, {
          get when() {
            return !i().configured;
          },
          get children() {
            return Nn();
          }
        }), g(jn, {
          get api() {
            return e.api;
          }
        })];
      }
    }), null), h(r, g(S, {
      get when() {
        return m.menu();
      },
      children: (f) => g(dn, {
        get menu() {
          return f();
        },
        onClose: () => m.setMenu(null)
      })
    }), null), r;
  })();
}
function Fn(e, t) {
  const n = t.on("changed", (o) => m.setSnap(o)), i = t.onActiveCwd((o) => Je = o), s = t.onReveal((o) => {
    const l = o?.incident;
    typeof l == "string" && (m.setShowSettings(!1), et(l, !0), queueMicrotask(() => e.querySelector(`[data-incident="${CSS.escape(l)}"]`)?.scrollIntoView({
      block: "nearest"
    })));
  });
  t.invoke("snapshot").then((o) => m.setSnap(o), (o) => m.setError(String(o))), t.invoke("config").then((o) => m.setConfig(o), (o) => m.setError(String(o)));
  const r = Tt(() => g(Bn, {
    api: t
  }), e);
  return () => {
    r(), n(), i(), s(), m.setMenu(null);
  };
}
ke(["contextmenu", "keydown", "dblclick", "click"]);
export {
  Fn as mount
};
