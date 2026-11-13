const Ye = (e, t) => e === t, Z = Symbol("solid-proxy"), Ne = typeof Proxy == "function", Ze = Symbol("solid-track"), J = {
  equals: Ye
};
let Te = Re;
const I = 1, ee = 2, Oe = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var y = null;
let oe = null, Je = null, b = null, v = null, T = null, le = 0;
function F(e, t) {
  const n = b, i = y, l = e.length === 0, r = t === void 0 ? i : t, o = l ? Oe : {
    owned: null,
    cleanups: null,
    context: r ? r.context : null,
    owner: r
  }, s = l ? e : () => e(() => N(() => V(o)));
  y = o, b = null;
  try {
    return G(s, !0);
  } finally {
    b = n, y = i;
  }
}
function P(e, t) {
  t = t ? Object.assign({}, J, t) : J;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, i = (l) => (typeof l == "function" && (l = l(n.value)), Ie(n, l));
  return [Le.bind(n), i];
}
function x(e, t, n) {
  const i = we(e, t, !1, I);
  q(i);
}
function De(e, t, n) {
  Te = ct;
  const i = we(e, t, !1, I);
  (!n || !n.render) && (i.user = !0), T ? T.push(i) : q(i);
}
function C(e, t, n) {
  n = n ? Object.assign({}, J, n) : J;
  const i = we(e, t, !0, 0);
  return i.observers = null, i.observerSlots = null, i.comparator = n.equals || void 0, q(i), Le.bind(i);
}
function N(e) {
  if (b === null) return e();
  const t = b;
  b = null;
  try {
    return e();
  } finally {
    b = t;
  }
}
function et(e) {
  De(() => N(e));
}
function te(e) {
  return y === null || (y.cleanups === null ? y.cleanups = [e] : y.cleanups.push(e)), e;
}
function tt() {
  return y;
}
function nt(e, t) {
  const n = y, i = b;
  y = e, b = null;
  try {
    return G(t, !0);
  } catch (l) {
    ye(l);
  } finally {
    y = n, b = i;
  }
}
function it(e, t) {
  const n = Symbol("context");
  return {
    id: n,
    Provider: ut(n),
    defaultValue: e
  };
}
function st(e) {
  let t;
  return y && y.context && (t = y.context[e.id]) !== void 0 ? t : e.defaultValue;
}
function lt(e) {
  const t = C(e), n = C(() => ue(t()));
  return n.toArray = () => {
    const i = n();
    return Array.isArray(i) ? i : i != null ? [i] : [];
  }, n;
}
function Le() {
  if (this.sources && this.state)
    if (this.state === I) q(this);
    else {
      const e = v;
      v = null, G(() => ie(this), !1), v = e;
    }
  if (b) {
    const e = this.observers;
    if (!e || e[e.length - 1] !== b) {
      const t = e ? e.length : 0;
      b.sources ? (b.sources.push(this), b.sourceSlots.push(t)) : (b.sources = [this], b.sourceSlots = [t]), e ? (e.push(b), this.observerSlots.push(b.sources.length - 1)) : (this.observers = [b], this.observerSlots = [b.sources.length - 1]);
    }
  }
  return this.value;
}
function Ie(e, t, n) {
  let i = e.value;
  return (!e.comparator || !e.comparator(i, t)) && (e.value = t, e.observers && e.observers.length && G(() => {
    for (let l = 0; l < e.observers.length; l += 1) {
      const r = e.observers[l], o = oe && oe.running;
      o && oe.disposed.has(r), (o ? !r.tState : !r.state) && (r.pure ? v.push(r) : T.push(r), r.observers && je(r)), o || (r.state = I);
    }
    if (v.length > 1e6)
      throw v = [], new Error();
  }, !1)), t;
}
function q(e) {
  if (!e.fn) return;
  V(e);
  const t = le;
  rt(e, e.value, t);
}
function rt(e, t, n) {
  let i;
  const l = y, r = b;
  b = y = e;
  try {
    i = e.fn(t);
  } catch (o) {
    return e.pure && (e.state = I, e.owned && e.owned.forEach(V), e.owned = null), e.updatedAt = n + 1, ye(o);
  } finally {
    b = r, y = l;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? Ie(e, i) : e.value = i, e.updatedAt = n);
}
function we(e, t, n, i = I, l) {
  const r = {
    fn: e,
    state: i,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: t,
    owner: y,
    context: y ? y.context : null,
    pure: n
  };
  return y === null || y !== Oe && (y.owned ? y.owned.push(r) : y.owned = [r]), r;
}
function ne(e) {
  if (e.state === 0) return;
  if (e.state === ee) return ie(e);
  if (e.suspense && N(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < le); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === I)
      q(e);
    else if (e.state === ee) {
      const i = v;
      v = null, G(() => ie(e, t[0]), !1), v = i;
    }
}
function G(e, t) {
  if (v) return e();
  let n = !1;
  t || (v = []), T ? n = !0 : T = [], le++;
  try {
    const i = e();
    return ot(n), i;
  } catch (i) {
    n || (T = null), v = null, ye(i);
  }
}
function ot(e) {
  if (v && (Re(v), v = null), e) return;
  const t = T;
  T = null, t.length && G(() => Te(t), !1);
}
function Re(e) {
  for (let t = 0; t < e.length; t++) ne(e[t]);
}
function ct(e) {
  let t, n = 0;
  for (t = 0; t < e.length; t++) {
    const i = e[t];
    i.user ? e[n++] = i : ne(i);
  }
  for (t = 0; t < n; t++) ne(e[t]);
}
function ie(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const i = e.sources[n];
    if (i.sources) {
      const l = i.state;
      l === I ? i !== t && (!i.updatedAt || i.updatedAt < le) && ne(i) : l === ee && ie(i, t);
    }
  }
}
function je(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = ee, n.pure ? v.push(n) : T.push(n), n.observers && je(n));
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
function at(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function ye(e, t = y) {
  throw at(e);
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
function ut(e, t) {
  return function(i) {
    let l;
    return x(() => l = N(() => (y.context = {
      ...y.context,
      [e]: i.value
    }, lt(() => i.children))), void 0), l;
  };
}
const ft = Symbol("fallback");
function xe(e) {
  for (let t = 0; t < e.length; t++) e[t]();
}
function dt(e, t, n = {}) {
  let i = [], l = [], r = [], o = 0, s = t.length > 1 ? [] : null;
  return te(() => xe(r)), () => {
    let c = e() || [], f = c.length, u, a;
    return c[Ze], N(() => {
      let m, $, k, _, j, A, E, M, O;
      if (f === 0)
        o !== 0 && (xe(r), r = [], i = [], l = [], o = 0, s && (s = [])), n.fallback && (i = [ft], l[0] = F((H) => (r[0] = H, n.fallback())), o = 1);
      else if (o === 0) {
        for (l = new Array(f), a = 0; a < f; a++)
          i[a] = c[a], l[a] = F(d);
        o = f;
      } else {
        for (k = new Array(f), _ = new Array(f), s && (j = new Array(f)), A = 0, E = Math.min(o, f); A < E && i[A] === c[A]; A++) ;
        for (E = o - 1, M = f - 1; E >= A && M >= A && i[E] === c[M]; E--, M--)
          k[M] = l[E], _[M] = r[E], s && (j[M] = s[E]);
        for (m = /* @__PURE__ */ new Map(), $ = new Array(M + 1), a = M; a >= A; a--)
          O = c[a], u = m.get(O), $[a] = u === void 0 ? -1 : u, m.set(O, a);
        for (u = A; u <= E; u++)
          O = i[u], a = m.get(O), a !== void 0 && a !== -1 ? (k[a] = l[u], _[a] = r[u], s && (j[a] = s[u]), a = $[a], m.set(O, a)) : r[u]();
        for (a = A; a < f; a++)
          a in k ? (l[a] = k[a], r[a] = _[a], s && (s[a] = j[a], s[a](a))) : l[a] = F(d);
        l = l.slice(0, o = f), i = c.slice(0);
      }
      return l;
    });
    function d(m) {
      if (r[a] = m, s) {
        const [$, k] = P(a);
        return s[a] = k, t(c[a], $);
      }
      return t(c[a]);
    }
  };
}
function g(e, t) {
  return N(() => e(t || {}));
}
function K() {
  return !0;
}
const fe = {
  get(e, t, n) {
    return t === Z ? n : e.get(t);
  },
  has(e, t) {
    return t === Z ? !0 : e.has(t);
  },
  set: K,
  deleteProperty: K,
  getOwnPropertyDescriptor(e, t) {
    return {
      configurable: !0,
      enumerable: !0,
      get() {
        return e.get(t);
      },
      set: K,
      deleteProperty: K
    };
  },
  ownKeys(e) {
    return e.keys();
  }
};
function ce(e) {
  return (e = typeof e == "function" ? e() : e) ? e : {};
}
function ht() {
  for (let e = 0, t = this.length; e < t; ++e) {
    const n = this[e]();
    if (n !== void 0) return n;
  }
}
function B(...e) {
  let t = !1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o];
    t = t || !!s && Z in s, e[o] = typeof s == "function" ? (t = !0, C(s)) : s;
  }
  if (Ne && t)
    return new Proxy({
      get(o) {
        for (let s = e.length - 1; s >= 0; s--) {
          const c = ce(e[s])[o];
          if (c !== void 0) return c;
        }
      },
      has(o) {
        for (let s = e.length - 1; s >= 0; s--)
          if (o in ce(e[s])) return !0;
        return !1;
      },
      keys() {
        const o = [];
        for (let s = 0; s < e.length; s++) o.push(...Object.keys(ce(e[s])));
        return [...new Set(o)];
      }
    }, fe);
  const n = {}, i = /* @__PURE__ */ Object.create(null);
  for (let o = e.length - 1; o >= 0; o--) {
    const s = e[o];
    if (!s) continue;
    const c = Object.getOwnPropertyNames(s);
    for (let f = c.length - 1; f >= 0; f--) {
      const u = c[f];
      if (u === "__proto__" || u === "constructor") continue;
      const a = Object.getOwnPropertyDescriptor(s, u);
      if (!i[u])
        i[u] = a.get ? {
          enumerable: !0,
          configurable: !0,
          get: ht.bind(n[u] = [a.get.bind(s)])
        } : a.value !== void 0 ? a : void 0;
      else {
        const d = n[u];
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
function ze(e, ...t) {
  const n = t.length;
  if (Ne && Z in e) {
    const l = n > 1 ? t.flat() : t[0], r = /* @__PURE__ */ new Set(), o = t.map((s) => {
      const c = s.filter((f) => !r.has(f) && (r.add(f), !0));
      return new Proxy({
        get(f) {
          return c.includes(f) ? e[f] : void 0;
        },
        has(f) {
          return c.includes(f) && f in e;
        },
        keys() {
          return c.filter((f) => f in e);
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
const gt = (e) => `Stale read from <${e}>.`;
function W(e) {
  const t = "fallback" in e && {
    fallback: () => e.fallback
  };
  return C(dt(() => e.each, e.children, t || void 0));
}
function S(e) {
  const t = e.keyed, n = C(() => e.when, void 0, void 0), i = t ? n : C(n, void 0, {
    equals: (l, r) => !l == !r
  });
  return C(() => {
    const l = i();
    if (l) {
      const r = e.children;
      return typeof r == "function" && r.length > 0 ? N(() => r(t ? l : () => {
        if (!N(i)) throw gt("Show");
        return n();
      })) : r;
    }
    return e.fallback;
  }, void 0, void 0);
}
const mt = [
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
], wt = /* @__PURE__ */ new Set([
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
  ...mt
]), yt = /* @__PURE__ */ new Set(["innerHTML", "textContent", "innerText", "children"]), bt = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
}), $t = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
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
function pt(e, t) {
  const n = $t[e];
  return typeof n == "object" ? n[t] ? n.$ : void 0 : n;
}
const kt = /* @__PURE__ */ new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]), vt = /* @__PURE__ */ new Set([
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
]), St = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
}, de = (e) => C(() => e());
function xt(e, t, n) {
  let i = n.length, l = t.length, r = i, o = 0, s = 0, c = t[l - 1].nextSibling, f = null;
  for (; o < l || s < r; ) {
    if (t[o] === n[s]) {
      o++, s++;
      continue;
    }
    for (; t[l - 1] === n[r - 1]; )
      l--, r--;
    if (l === o) {
      const u = r < i ? s ? n[s - 1].nextSibling : n[r - s] : c;
      for (; s < r; ) e.insertBefore(n[s++], u);
    } else if (r === s)
      for (; o < l; )
        (!f || !f.has(t[o])) && t[o].remove(), o++;
    else if (t[o] === n[r - 1] && n[s] === t[l - 1]) {
      const u = t[--l].nextSibling;
      e.insertBefore(n[s++], t[o++].nextSibling), e.insertBefore(n[--r], u), t[l] = n[r];
    } else {
      if (!f) {
        f = /* @__PURE__ */ new Map();
        let a = s;
        for (; a < r; ) f.set(n[a], a++);
      }
      const u = f.get(t[o]);
      if (u != null)
        if (s < u && u < r) {
          let a = o, d = 1, m;
          for (; ++a < l && a < r && !((m = f.get(t[a])) == null || m !== u + d); )
            d++;
          if (d > u - s) {
            const $ = t[o];
            for (; s < u; ) e.insertBefore(n[s++], $);
          } else e.replaceChild(n[s++], t[o++]);
        } else o++;
      else t[o++].remove();
    }
  }
}
const Ae = "_$DX_DELEGATE";
function At(e, t, n, i = {}) {
  let l;
  return F((r) => {
    l = r, t === document ? e() : h(t, e(), t.firstChild ? null : void 0, n);
  }, i.owner), () => {
    l(), t.textContent = "";
  };
}
function p(e, t, n, i) {
  let l;
  const r = () => {
    const s = document.createElement("template");
    return s.innerHTML = e, s.content.firstChild;
  }, o = () => (l || (l = r())).cloneNode(!0);
  return o.cloneNode = o, o;
}
function be(e, t = window.document) {
  const n = t[Ae] || (t[Ae] = /* @__PURE__ */ new Set());
  for (let i = 0, l = e.length; i < l; i++) {
    const r = e[i];
    n.has(r) || (n.add(r), t.addEventListener(r, Dt));
  }
}
function L(e, t, n) {
  n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function Ct(e, t, n, i) {
  i == null ? e.removeAttributeNS(t, n) : e.setAttributeNS(t, n, i);
}
function _t(e, t, n) {
  n ? e.setAttribute(t, "") : e.removeAttribute(t);
}
function Et(e, t) {
  t == null ? e.removeAttribute("class") : e.className = t;
}
function Pt(e, t, n, i) {
  if (i)
    Array.isArray(n) ? (e[`$$${t}`] = n[0], e[`$$${t}Data`] = n[1]) : e[`$$${t}`] = n;
  else if (Array.isArray(n)) {
    const l = n[0];
    e.addEventListener(t, n[0] = (r) => l.call(e, n[1], r));
  } else e.addEventListener(t, n, typeof n != "function" && n);
}
function Mt(e, t, n = {}) {
  const i = Object.keys(t || {}), l = Object.keys(n);
  let r, o;
  for (r = 0, o = l.length; r < o; r++) {
    const s = l[r];
    !s || s === "undefined" || t[s] || (_e(e, s, !1), delete n[s]);
  }
  for (r = 0, o = i.length; r < o; r++) {
    const s = i[r], c = !!t[s];
    !s || s === "undefined" || n[s] === c || !c || (_e(e, s, !0), n[s] = c);
  }
  return n;
}
function Nt(e, t, n) {
  if (!t) return n ? L(e, "style") : t;
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
function Ce(e, t, n) {
  n != null ? e.style.setProperty(t, n) : e.style.removeProperty(t);
}
function Fe(e, t = {}, n, i) {
  const l = {};
  return i || x(() => l.children = U(e, t.children, l.children)), x(() => typeof t.ref == "function" && $e(t.ref, e)), x(() => Tt(e, t, n, !0, l, !0)), l;
}
function $e(e, t, n) {
  return N(() => e(t, n));
}
function h(e, t, n, i) {
  if (n !== void 0 && !i && (i = []), typeof t != "function") return U(e, t, i, n);
  x((l) => U(e, t(), l, n), i);
}
function Tt(e, t, n, i, l = {}, r = !1) {
  t || (t = {});
  for (const o in l)
    if (!(o in t)) {
      if (o === "children") continue;
      l[o] = Ee(e, o, null, l[o], n, r, t);
    }
  for (const o in t) {
    if (o === "children")
      continue;
    const s = t[o];
    l[o] = Ee(e, o, s, l[o], n, r, t);
  }
}
function Ot(e) {
  return e.toLowerCase().replace(/-([a-z])/g, (t, n) => n.toUpperCase());
}
function _e(e, t, n) {
  const i = t.trim().split(/\s+/);
  for (let l = 0, r = i.length; l < r; l++) e.classList.toggle(i[l], n);
}
function Ee(e, t, n, i, l, r, o) {
  let s, c, f, u, a;
  if (t === "style") return Nt(e, n, i);
  if (t === "classList") return Mt(e, n, i);
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
    const d = t.slice(2).toLowerCase(), m = kt.has(d);
    if (!m && i) {
      const $ = Array.isArray(i) ? i[0] : i;
      e.removeEventListener(d, $);
    }
    (m || n) && (Pt(e, d, n, m), m && be([d]));
  } else if (t.slice(0, 5) === "attr:")
    L(e, t.slice(5), n);
  else if (t.slice(0, 5) === "bool:")
    _t(e, t.slice(5), n);
  else if ((a = t.slice(0, 5) === "prop:") || (f = yt.has(t)) || !l && ((u = pt(t, e.tagName)) || (c = wt.has(t))) || (s = e.nodeName.includes("-") || "is" in o))
    a && (t = t.slice(5), c = !0), t === "class" || t === "className" ? Et(e, n) : s && !c && !f ? e[Ot(t)] = n : (t === "value" || t === "defaultValue") && (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA") ? e[u || t] = n ?? "" : e[u || t] = n;
  else {
    const d = l && t.indexOf(":") > -1 && St[t.split(":")[0]];
    d ? Ct(e, d, t, n) : L(e, bt[t] || t, n);
  }
  return n;
}
function Dt(e) {
  let t = e.target;
  const n = `$$${e.type}`, i = e.target, l = e.currentTarget, r = (c) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: c
  }), o = () => {
    const c = t[n];
    if (c && !t.disabled) {
      const f = t[`${n}Data`];
      if (f !== void 0 ? c.call(t, f, e) : c.call(t, e), e.cancelBubble) return;
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
      for (let f = 0; f < c.length - 2 && (t = c[f], !!o()); f++) {
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
function U(e, t, n, i, l) {
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
      return x(() => {
        let s = t();
        for (; typeof s == "function"; ) s = s();
        n = U(e, s, n, i);
      }), () => n;
    if (Array.isArray(t)) {
      const s = [], c = n && Array.isArray(n);
      if (he(s, t, n, l))
        return x(() => n = U(e, s, n, i, !0)), () => n;
      if (s.length === 0) {
        if (n = z(e, n, i), o) return n;
      } else c ? n.length === 0 ? Pe(e, s, i) : xt(e, n, s) : (n && z(e), Pe(e, s));
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
function he(e, t, n, i) {
  let l = !1;
  for (let r = 0, o = t.length; r < o; r++) {
    let s = t[r], c = n && n[e.length], f;
    if (!(s == null || s === !0 || s === !1)) if ((f = typeof s) == "object" && s.nodeType)
      e.push(s);
    else if (Array.isArray(s))
      l = he(e, s, c) || l;
    else if (f === "function")
      if (i) {
        for (; typeof s == "function"; ) s = s();
        l = he(e, Array.isArray(s) ? s : [s], Array.isArray(c) ? c : [c]) || l;
      } else
        e.push(s), l = !0;
    else {
      const u = String(s);
      c && c.nodeType === 3 && c.data === u ? e.push(c) : e.push(document.createTextNode(u));
    }
  }
  return l;
}
function Pe(e, t, n = null) {
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
        const c = s.parentNode === e;
        !r && !o ? c ? e.replaceChild(l, s) : e.insertBefore(l, n) : c && s.remove();
      } else r = !0;
    }
  } else e.insertBefore(l, n);
  return [l];
}
const Lt = "http://www.w3.org/2000/svg";
function Be(e, t = !1, n = void 0) {
  return t ? document.createElementNS(Lt, e) : document.createElement(e, {
    is: n
  });
}
function It(e) {
  const {
    useShadow: t
  } = e, n = document.createTextNode(""), i = () => e.mount || document.body, l = tt();
  let r;
  return De(() => {
    r || (r = nt(l, () => C(() => e.children)));
    const o = i();
    if (o instanceof HTMLHeadElement) {
      const [s, c] = P(!1), f = () => c(!0);
      F((u) => h(o, () => s() ? u() : r(), null)), te(f);
    } else {
      const s = Be(e.isSVG ? "g" : "div", e.isSVG), c = t && s.attachShadow ? s.attachShadow({
        mode: "open"
      }) : s;
      Object.defineProperty(s, "_$host", {
        get() {
          return n.parentNode;
        },
        configurable: !0
      }), h(c, r), o.appendChild(s), e.ref && e.ref(s), te(() => o.contains(s) && o.removeChild(s));
    }
  }, void 0, {
    render: !0
  }), n;
}
function Rt(e, t) {
  const n = C(e);
  return C(() => {
    const i = n();
    switch (typeof i) {
      case "function":
        return N(() => i(t));
      case "string":
        const l = vt.has(i), r = Be(i, l, N(() => t.is));
        return Fe(r, t, l), r;
    }
  });
}
function jt(e) {
  const [, t] = ze(e, ["component"]);
  return Rt(() => e.component, t);
}
var zt = it({
  size: 24,
  color: "currentColor",
  strokeWidth: 2,
  absoluteStrokeWidth: !1,
  nonScalingStroke: !1,
  class: ""
}), Ft = /* @__PURE__ */ p("<svg>"), Bt = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, R = Bt, ge = (...e) => e.filter((t, n, i) => !!t && t.trim() !== "" && i.indexOf(t) === n).join(" ").trim();
function ae(e) {
  return e != null;
}
function Gt(e, t = {}) {
  const n = t.attributeNames ?? {}, i = (d) => n[d] ?? d, l = e.size ?? e.width ?? R.width, r = e.size ?? e.height ?? R.height, o = e.aliases?.filter((d) => typeof d == "string" && d.trim() !== "").map((d) => `lucide-${d}`) ?? [], s = [...e.name ? [`lucide-${e.name}`] : [], ...o], c = t.className?.split(" ").filter(Boolean) ?? [], f = t.includeDefaultClasses === !1 ? ge(...c) : ge("lucide", ...s, ...c), u = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? R["stroke-width"]) * Number(e.size ?? e.width ?? R.width) / Number(t.size ?? t.width ?? R.width) : t.strokeWidth ?? R["stroke-width"];
  return ["svg", {
    ...Object.entries(R).reduce((d, [m, $]) => (d[i(m)] = $, d), {}),
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
    [i("stroke-width")]: u,
    ...f && {
      [i("class")]: f
    },
    [i("viewBox")]: `0 0 ${l} ${r}`,
    ...t.hasA11yProp === !1 ? {
      [i("aria-hidden")]: "true"
    } : {},
    ..."attributes" in t && t.attributes
  }, e.node.map((d) => {
    const [m, $, k] = d, _ = t.nonScalingStroke ? {
      [i("vector-effect")]: "non-scaling-stroke",
      ...$
    } : $;
    return k ? [m, _, k] : [m, _];
  })];
}
var Vt = Gt, Wt = (e) => {
  for (const t in e)
    if (t.startsWith("aria-") || t === "role" || t === "title")
      return !0;
  return !1;
}, Ut = (e) => {
  const [t, n] = ze(e, ["color", "size", "width", "height", "strokeWidth", "children", "class", "icon", "iconNode", "absoluteStrokeWidth", "nonScalingStroke"]), i = st(zt), l = C(() => t.icon ?? {
    node: t.iconNode ?? [],
    size: 24,
    aliases: []
  }), r = C(() => Vt(l(), {
    color: t.color ?? i.color,
    width: t.width ?? t.size ?? i.size,
    height: t.height ?? t.size ?? i.size,
    strokeWidth: t.strokeWidth ?? i.strokeWidth,
    absoluteStrokeWidth: t.absoluteStrokeWidth ?? i.absoluteStrokeWidth,
    nonScalingStroke: t.nonScalingStroke ?? i.nonScalingStroke,
    className: ge("lucide-icon", i.class, t.class),
    hasA11yProp: !!t.children || Wt(n),
    attributes: n
  }));
  return (() => {
    var o = Ft();
    return Fe(o, B(() => r()[1]), !0, !0), h(o, g(W, {
      get each() {
        return r()[2] ?? [];
      },
      children: ([s, c]) => g(jt, B({
        component: s
      }, c))
    })), o;
  })();
}, re = Ut, Ge = {
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
Ge.node;
var qt = (e) => g(re, B(e, {
  icon: Ge
})), Ht = qt, Ve = {
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
Ve.node;
var Kt = (e) => g(re, B(e, {
  icon: Ve
})), Xt = Kt, We = {
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
We.node;
var Qt = (e) => g(re, B(e, {
  icon: We
})), Yt = Qt, Ue = {
  name: "chevron-right",
  size: 24,
  node: [["path", {
    d: "m9 18 6-6-6-6",
    key: "mthhwq"
  }]]
};
Ue.node;
var Zt = (e) => g(re, B(e, {
  icon: Ue
})), me = Zt, Jt = /* @__PURE__ */ p("<div class=sp-menu-backdrop><div class=sp-menu role=menu>"), en = /* @__PURE__ */ p("<div class=sp-menu-sep role=separator>"), tn = /* @__PURE__ */ p("<button type=button class=sp-menu-item role=menuitem>");
function nn(e) {
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
const qe = (e) => e.key === "ContextMenu" || e.key === "F10" && e.shiftKey, X = 8;
function sn(e) {
  let t;
  const [n, i] = P({
    x: e.menu.x,
    y: e.menu.y
  }), l = document.activeElement, r = () => [...t?.querySelectorAll(".sp-menu-item") ?? []];
  et(() => {
    if (!t) return;
    const {
      width: c,
      height: f
    } = t.getBoundingClientRect();
    i({
      x: Math.max(X, Math.min(e.menu.x, window.innerWidth - c - X)),
      y: Math.max(X, Math.min(e.menu.y, window.innerHeight - f - X))
    }), r()[0]?.focus();
  }), te(() => l?.focus?.());
  function o(c) {
    e.onClose(), c.run();
  }
  function s(c) {
    c.stopPropagation();
    const f = r(), u = f.indexOf(document.activeElement);
    if (c.key === "Escape")
      c.preventDefault(), e.onClose();
    else if (c.key === "ArrowDown" || c.key === "ArrowUp") {
      c.preventDefault();
      const a = c.key === "ArrowDown" ? 1 : -1;
      f[(u + a + f.length) % f.length]?.focus();
    } else c.key === "Home" || c.key === "End" ? (c.preventDefault(), (c.key === "Home" ? f[0] : f[f.length - 1])?.focus()) : c.key === "Tab" && (c.preventDefault(), e.onClose());
  }
  return g(It, {
    get children() {
      var c = Jt(), f = c.firstChild;
      c.$$contextmenu = (a) => {
        a.preventDefault(), e.onClose();
      }, c.$$mousedown = (a) => {
        a.target === a.currentTarget && e.onClose();
      }, f.$$contextmenu = (a) => a.preventDefault(), f.$$keydown = s;
      var u = t;
      return typeof u == "function" ? $e(u, f) : t = f, h(f, g(W, {
        get each() {
          return e.menu.items;
        },
        children: (a) => g(S, {
          when: a !== "separator" && a,
          get fallback() {
            return en();
          },
          children: (d) => (() => {
            var m = tn();
            return m.$$click = () => o(d()), h(m, () => d().label), m;
          })()
        })
      })), x((a) => {
        var d = `${n().x}px`, m = `${n().y}px`;
        return d !== a.e && Ce(f, "left", a.e = d), m !== a.t && Ce(f, "top", a.t = m), a;
      }, {
        e: void 0,
        t: void 0
      }), c;
    }
  });
}
be(["mousedown", "contextmenu", "keydown", "click"]);
const ln = /^[A-Za-z0-9 _.,:;/()\[\]=?#&%@+-]*$/;
function rn(e) {
  return ln.test(e);
}
function on(e) {
  const t = e.replace(/\s+/g, " ").trim();
  return t && rn(t) ? `claude "${t}"` : null;
}
const Q = {
  interval: { min: 30, max: 3600 },
  threshold: { min: 1, max: 10 },
  groupMin: { min: 2, max: 100 }
};
function Y(e) {
  return e.group ? `${e.group} / ${e.name}` : e.name;
}
var cn = /* @__PURE__ */ p("<li class=gt-check-row tabindex=0>"), an = /* @__PURE__ */ p("<ul class=gt-checks>"), un = /* @__PURE__ */ p("<div class=gt-incident><button class=gt-incident-head><span class=gt-dot></span><span class=gt-incident-title></span><span class=gt-since>"), fn = /* @__PURE__ */ p('<label class=gt-field><span></span><input class="gt-input gt-num"type=number required><small>'), dn = /* @__PURE__ */ p("<label class=gt-check><input type=checkbox name=clearAuth> Remove the saved header"), hn = /* @__PURE__ */ p("<button class=gt-btn type=button>Cancel"), gn = /* @__PURE__ */ p(`<form class=gt-settings><label class=gt-field><span>Gatus address</span><input class=gt-input name=url type=url placeholder=https://status.example.com required></label><label class=gt-field><span>Authorization header</span><input class=gt-input name=authHeader type=password autocomplete=off></label><label class=gt-field><span>Alert on first failure</span><textarea class=gt-input name=watch rows=3 placeholder="group/name, one per line
infra/*"></textarea></label><label class=gt-field><span>Never alert</span><textarea class=gt-input name=mute rows=3 placeholder=*/nightly-*></textarea></label><small class=gt-hint>Patterns are group/name with * as a wildcard; without a / they match the name in any group.</small><div class=gt-row><button class="gt-btn gt-btn-primary"type=submit>`), mn = /* @__PURE__ */ p('<button class=gt-icon-btn title="Check now">'), wn = /* @__PURE__ */ p('<button class=gt-icon-btn title="Open the status page">'), Me = /* @__PURE__ */ p("<div class=gt-error>"), yn = /* @__PURE__ */ p("<div class=gt-status> checks · checked "), bn = /* @__PURE__ */ p("<div class=gt-incidents>"), $n = /* @__PURE__ */ p("<button class=gt-section-toggle>Failing, not alerted (<!>)"), pn = /* @__PURE__ */ p('<ul class="gt-checks gt-quiet">'), kn = /* @__PURE__ */ p("<button class=gt-section-toggle>Settings"), vn = /* @__PURE__ */ p("<div class=gt-empty>Point this at a Gatus server to get alerted when its checks go down."), Sn = /* @__PURE__ */ p("<div class=gt-panel><div class=gt-header><span class=gt-title>Gatus</span><button class=gt-icon-btn title=Close></button></div><div class=gt-scroll>"), xn = /* @__PURE__ */ p("<div class=gt-empty>Nothing down.");
const w = F(() => {
  const [e, t] = P(null), [n, i] = P(null), [l, r] = P(/* @__PURE__ */ new Set()), [o, s] = P(!1), [c, f] = P(!1), [u, a] = P(null), [d, m] = P(null);
  return {
    snap: e,
    setSnap: t,
    config: n,
    setConfig: i,
    open: l,
    setOpen: r,
    showSettings: o,
    setShowSettings: s,
    showQuiet: c,
    setShowQuiet: f,
    error: u,
    setError: a,
    menu: d,
    setMenu: m
  };
});
let He = null;
const An = (e, t) => `${e}/endpoints/${encodeURIComponent(t.key)}`;
function Cn(e, t, n) {
  const i = t.slice(0, 20).map((o) => o.key).join(", "), l = t.length > 20 ? ` and ${t.length - 20} more` : "", r = t.length ? `the Gatus ${t.length === 1 ? "check" : "checks"} ${i}${l} on ${e} (GET ${e}/api/v1/endpoints/KEY/statuses returns the recent results of each)` : `the Gatus status page ${e}, which is not answering`;
  return on(`Look into ${r}. They are failing. Read only: change nothing. Tell me what is wrong and the likely cause, then wait for what I want to do.`);
}
function se(e, t, n, i) {
  t.preventDefault(), t.stopPropagation();
  const l = w.snap()?.url ?? "", r = [], o = e.openTerminal && l ? Cn(l, n) : null;
  o && (r.push({
    label: "Ask Claude about it",
    run: () => e.openTerminal({
      command: o,
      cwd: He ?? void 0,
      run: !0
    })
  }), r.push("separator")), l && n.length === 1 && r.push({
    label: "Open in Gatus",
    run: () => e.openExternal(An(l, n[0]))
  });
  const s = (c) => void (e.copyText ? e.copyText(c) : navigator.clipboard.writeText(c)).catch(() => {
  });
  r.push({
    label: "Copy text",
    run: () => s(i)
  }), w.setMenu({
    ...nn(t),
    items: r
  });
}
function Ke(e) {
  return (() => {
    var t = cn();
    return t.$$keydown = (n) => qe(n) && se(e.api, n, [e.check], Y(e.check)), t.$$contextmenu = (n) => se(e.api, n, [e.check], Y(e.check)), h(t, () => Y(e.check)), t;
  })();
}
const Xe = (e, t) => w.setOpen((n) => {
  const i = new Set(n);
  return t ?? !i.has(e) ? i.add(e) : i.delete(e), i;
});
function Qe(e) {
  if (!e) return "never";
  const t = Math.max(0, Math.round((Date.now() - Date.parse(e)) / 1e3));
  return t < 60 ? `${t}s ago` : t < 3600 ? `${Math.round(t / 60)} min ago` : t < 86400 ? `${Math.round(t / 3600)} h ago` : new Date(e).toLocaleString();
}
function _n(e) {
  const t = () => w.open().has(e.incident.id), n = () => [e.incident.title, ...e.incident.checks.map((i) => `- ${Y(i)}`)].join(`
`);
  return (() => {
    var i = un(), l = i.firstChild, r = l.firstChild, o = r.nextSibling, s = o.nextSibling;
    return l.$$keydown = (c) => qe(c) && se(e.api, c, e.incident.checks, n()), l.$$contextmenu = (c) => se(e.api, c, e.incident.checks, n()), l.$$click = () => Xe(e.incident.id), h(l, g(me, {
      size: 12
    }), r), h(o, () => e.incident.title), h(s, () => Qe(e.incident.since)), h(i, g(S, {
      get when() {
        return de(() => !!t())() && e.incident.checks.length > 0;
      },
      get children() {
        var c = an();
        return h(c, g(W, {
          get each() {
            return e.incident.checks;
          },
          children: (f) => g(Ke, {
            get api() {
              return e.api;
            },
            check: f
          })
        })), c;
      }
    }), null), x((c) => {
      var f = e.incident.id, u = !!t();
      return f !== c.e && L(i, "data-incident", c.e = f), u !== c.t && l.classList.toggle("expanded", c.t = u), c;
    }, {
      e: void 0,
      t: void 0
    }), i;
  })();
}
function En(e) {
  const t = () => w.config();
  let n;
  const [i, l] = P(!1), r = (s) => {
    s.preventDefault();
    const c = new FormData(n), f = {
      url: String(c.get("url") ?? ""),
      interval: Number(c.get("interval")),
      threshold: Number(c.get("threshold")),
      groupMin: Number(c.get("groupMin")),
      watch: String(c.get("watch") ?? ""),
      mute: String(c.get("mute") ?? "")
    }, u = String(c.get("authHeader") ?? "");
    u !== "" && (f.authHeader = u), c.get("clearAuth") === "on" && (f.authHeader = ""), l(!0), e.api.invoke("configure", f).then((a) => {
      w.setConfig(a), w.setError(null), w.setShowSettings(!1), n.reset();
    }, (a) => w.setError(a instanceof Error ? a.message : String(a))).finally(() => l(!1));
  }, o = (s, c, f) => (() => {
    var u = fn(), a = u.firstChild, d = a.nextSibling, m = d.nextSibling;
    return h(a, c), L(d, "name", s), h(m, f), x(($) => {
      var k = Q[s].min, _ = Q[s].max;
      return k !== $.e && L(d, "min", $.e = k), _ !== $.t && L(d, "max", $.t = _), $;
    }, {
      e: void 0,
      t: void 0
    }), x(() => d.value = t()?.[s] ?? ""), u;
  })();
  return g(S, {
    get when() {
      return t();
    },
    keyed: !0,
    children: (s) => (() => {
      var c = gn(), f = c.firstChild, u = f.firstChild, a = u.nextSibling, d = f.nextSibling, m = d.firstChild, $ = m.nextSibling, k = d.nextSibling, _ = k.firstChild, j = _.nextSibling, A = k.nextSibling, E = A.firstChild, M = E.nextSibling, O = A.nextSibling, H = O.nextSibling, pe = H.firstChild;
      c.addEventListener("submit", r);
      var ke = n;
      return typeof ke == "function" ? $e(ke, c) : n = c, h(c, g(S, {
        get when() {
          return s.hasAuth;
        },
        get children() {
          return dn();
        }
      }), k), h(c, () => o("interval", "Poll every (s)", `${Q.interval.min}–${Q.interval.max}`), k), h(c, () => o("threshold", "Alert after failures in a row", "per check"), k), h(c, () => o("groupMin", "Bundle from", "same check in this many groups, or this many checks in one group"), k), h(j, () => s.watch.join(`
`)), h(M, () => s.mute.join(`
`)), h(pe, () => i() ? "Saving…" : "Save"), h(H, g(S, {
        get when() {
          return w.snap()?.configured;
        },
        get children() {
          var D = hn();
          return D.$$click = () => w.setShowSettings(!1), D;
        }
      }), null), x((D) => {
        var ve = s.hasAuth ? "saved (type to replace)" : "optional, e.g. Bearer …", Se = i();
        return ve !== D.e && L($, "placeholder", D.e = ve), Se !== D.t && (pe.disabled = D.t = Se), D;
      }, {
        e: void 0,
        t: void 0
      }), x(() => a.value = s.url), c;
    })()
  });
}
function Pn(e) {
  const [t, n] = P(!1), i = () => w.snap(), l = () => {
    n(!0), e.api.invoke("poll").then((r) => w.setSnap(r), (r) => w.setError(String(r))).finally(() => n(!1));
  };
  return (() => {
    var r = Sn(), o = r.firstChild, s = o.firstChild, c = s.nextSibling, f = o.nextSibling;
    return h(o, g(S, {
      get when() {
        return i()?.configured;
      },
      get children() {
        return [(() => {
          var u = mn();
          return u.$$click = l, h(u, g(Xt, {
            size: 14
          })), x(() => u.disabled = t()), u;
        })(), (() => {
          var u = wn();
          return u.$$click = () => e.api.openExternal(i().url), h(u, g(Yt, {
            size: 14
          })), u;
        })()];
      }
    }), c), c.$$click = () => e.api.close(), h(c, g(Ht, {
      size: 14
    })), h(f, g(S, {
      get when() {
        return w.error();
      },
      get children() {
        var u = Me();
        return h(u, () => w.error()), u;
      }
    }), null), h(f, g(S, {
      get when() {
        return de(() => !!i()?.configured)() && !w.showSettings();
      },
      get children() {
        return [(() => {
          var u = yn(), a = u.firstChild;
          return h(u, () => i().checks, a), h(u, () => Qe(i().lastPoll), null), h(u, g(S, {
            get when() {
              return i().lastError;
            },
            get children() {
              var d = Me();
              return h(d, () => i().lastError), d;
            }
          }), null), u;
        })(), g(S, {
          get when() {
            return i().incidents.length > 0;
          },
          get fallback() {
            return xn();
          },
          get children() {
            var u = bn();
            return h(u, g(W, {
              get each() {
                return i().incidents;
              },
              children: (a) => g(_n, {
                get api() {
                  return e.api;
                },
                incident: a
              })
            })), u;
          }
        }), g(S, {
          get when() {
            return i().quiet.length > 0;
          },
          get children() {
            return [(() => {
              var u = $n(), a = u.firstChild, d = a.nextSibling;
              return d.nextSibling, u.$$click = () => w.setShowQuiet((m) => !m), h(u, g(me, {
                size: 12
              }), a), h(u, () => i().quiet.length, d), x(() => u.classList.toggle("expanded", !!w.showQuiet())), u;
            })(), g(S, {
              get when() {
                return w.showQuiet();
              },
              get children() {
                var u = pn();
                return h(u, g(W, {
                  get each() {
                    return i().quiet;
                  },
                  children: (a) => g(Ke, {
                    get api() {
                      return e.api;
                    },
                    check: a
                  })
                })), u;
              }
            })];
          }
        }), (() => {
          var u = kn(), a = u.firstChild;
          return u.$$click = () => w.setShowSettings(!0), h(u, g(me, {
            size: 12
          }), a), u;
        })()];
      }
    }), null), h(f, g(S, {
      get when() {
        return de(() => !!i())() && (!i().configured || w.showSettings());
      },
      get children() {
        return [g(S, {
          get when() {
            return !i().configured;
          },
          get children() {
            return vn();
          }
        }), g(En, {
          get api() {
            return e.api;
          }
        })];
      }
    }), null), h(r, g(S, {
      get when() {
        return w.menu();
      },
      children: (u) => g(sn, {
        get menu() {
          return u();
        },
        onClose: () => w.setMenu(null)
      })
    }), null), r;
  })();
}
function Mn(e, t) {
  const n = t.on("changed", (o) => w.setSnap(o)), i = t.onActiveCwd((o) => He = o), l = t.onReveal((o) => {
    const s = o?.incident;
    typeof s == "string" && (w.setShowSettings(!1), Xe(s, !0), queueMicrotask(() => e.querySelector(`[data-incident="${CSS.escape(s)}"]`)?.scrollIntoView({
      block: "nearest"
    })));
  });
  t.invoke("snapshot").then((o) => w.setSnap(o), (o) => w.setError(String(o))), t.invoke("config").then((o) => w.setConfig(o), (o) => w.setError(String(o)));
  const r = At(() => g(Pn, {
    api: t
  }), e);
  return () => {
    r(), n(), i(), l(), w.setMenu(null);
  };
}
be(["contextmenu", "keydown", "click"]);
export {
  Mn as mount
};
