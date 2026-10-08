const lt = (e, t) => e === t, x = Symbol("solid-proxy"), je = typeof Proxy == "function", be = Symbol("solid-track"), se = {
  equals: lt
};
let ct = Fe;
const z = 1, re = 2, Ie = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var w = null;
let he = null, ft = null, b = null, k = null, R = null, fe = 0;
function H(e, t) {
  const n = b, i = w, o = e.length === 0, s = t === void 0 ? i : t, r = o ? Ie : {
    owned: null,
    cleanups: null,
    context: s ? s.context : null,
    owner: s
  }, l = o ? e : () => e(() => D(() => Q(r)));
  w = r, b = null;
  try {
    return G(l, !0);
  } finally {
    b = n, w = i;
  }
}
function Y(e, t) {
  t = t ? Object.assign({}, se, t) : se;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, i = (o) => (typeof o == "function" && (o = o(n.value)), Me(n, o));
  return [Le.bind(n), i];
}
function P(e, t, n) {
  const i = Re(e, t, !1, z);
  ue(i);
}
function O(e, t, n) {
  n = n ? Object.assign({}, se, n) : se;
  const i = Re(e, t, !0, 0);
  return i.observers = null, i.observerSlots = null, i.comparator = n.equals || void 0, ue(i), Le.bind(i);
}
function ut(e) {
  return G(e, !1);
}
function D(e) {
  if (b === null) return e();
  const t = b;
  b = null;
  try {
    return e();
  } finally {
    b = t;
  }
}
function at(e) {
  return w === null || (w.cleanups === null ? w.cleanups = [e] : w.cleanups.push(e)), e;
}
function ye() {
  return b;
}
function dt(e, t) {
  const n = Symbol("context");
  return {
    id: n,
    Provider: mt(n),
    defaultValue: e
  };
}
function ht(e) {
  let t;
  return w && w.context && (t = w.context[e.id]) !== void 0 ? t : e.defaultValue;
}
function gt(e) {
  const t = O(e), n = O(() => me(t()));
  return n.toArray = () => {
    const i = n();
    return Array.isArray(i) ? i : i != null ? [i] : [];
  }, n;
}
function Le() {
  if (this.sources && this.state)
    if (this.state === z) ue(this);
    else {
      const e = k;
      k = null, G(() => le(this), !1), k = e;
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
function Me(e, t, n) {
  let i = e.value;
  return (!e.comparator || !e.comparator(i, t)) && (e.value = t, e.observers && e.observers.length && G(() => {
    for (let o = 0; o < e.observers.length; o += 1) {
      const s = e.observers[o], r = he && he.running;
      r && he.disposed.has(s), (r ? !s.tState : !s.state) && (s.pure ? k.push(s) : R.push(s), s.observers && Ue(s)), r || (s.state = z);
    }
    if (k.length > 1e6)
      throw k = [], new Error();
  }, !1)), t;
}
function ue(e) {
  if (!e.fn) return;
  Q(e);
  const t = fe;
  wt(e, e.value, t);
}
function wt(e, t, n) {
  let i;
  const o = w, s = b;
  b = w = e;
  try {
    i = e.fn(t);
  } catch (r) {
    return e.pure && (e.state = z, e.owned && e.owned.forEach(Q), e.owned = null), e.updatedAt = n + 1, Be(r);
  } finally {
    b = s, w = o;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? Me(e, i) : e.value = i, e.updatedAt = n);
}
function Re(e, t, n, i = z, o) {
  const s = {
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
  return w === null || w !== Ie && (w.owned ? w.owned.push(s) : w.owned = [s]), s;
}
function ze(e) {
  if (e.state === 0) return;
  if (e.state === re) return le(e);
  if (e.suspense && D(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < fe); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === z)
      ue(e);
    else if (e.state === re) {
      const i = k;
      k = null, G(() => le(e, t[0]), !1), k = i;
    }
}
function G(e, t) {
  if (k) return e();
  let n = !1;
  t || (k = []), R ? n = !0 : R = [], fe++;
  try {
    const i = e();
    return bt(n), i;
  } catch (i) {
    n || (R = null), k = null, Be(i);
  }
}
function bt(e) {
  if (k && (Fe(k), k = null), e) return;
  const t = R;
  R = null, t.length && G(() => ct(t), !1);
}
function Fe(e) {
  for (let t = 0; t < e.length; t++) ze(e[t]);
}
function le(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const i = e.sources[n];
    if (i.sources) {
      const o = i.state;
      o === z ? i !== t && (!i.updatedAt || i.updatedAt < fe) && ze(i) : o === re && le(i, t);
    }
  }
}
function Ue(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = re, n.pure ? k.push(n) : R.push(n), n.observers && Ue(n));
  }
}
function Q(e) {
  let t;
  if (e.sources)
    for (; e.sources.length; ) {
      const n = e.sources.pop(), i = e.sourceSlots.pop(), o = n.observers;
      if (o && o.length) {
        const s = o.pop(), r = n.observerSlots.pop();
        i < o.length && (s.sourceSlots[r] = i, o[i] = s, n.observerSlots[i] = r);
      }
    }
  if (e.tOwned) {
    for (t = e.tOwned.length - 1; t >= 0; t--) Q(e.tOwned[t]);
    delete e.tOwned;
  }
  if (e.owned) {
    for (t = e.owned.length - 1; t >= 0; t--) Q(e.owned[t]);
    e.owned = null;
  }
  if (e.cleanups) {
    for (t = e.cleanups.length - 1; t >= 0; t--) e.cleanups[t]();
    e.cleanups = null;
  }
  e.state = 0;
}
function yt(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function Be(e, t = w) {
  throw yt(e);
}
function me(e) {
  if (typeof e == "function" && !e.length) return me(e());
  if (Array.isArray(e)) {
    const t = [];
    for (let n = 0; n < e.length; n++) {
      const i = me(e[n]);
      if (Array.isArray(i))
        if (i.length < 32768) t.push.apply(t, i);
        else for (let o = 0; o < i.length; o++) t.push(i[o]);
      else
        t.push(i);
    }
    return t;
  }
  return e;
}
function mt(e, t) {
  return function(i) {
    let o;
    return P(() => o = D(() => (w.context = {
      ...w.context,
      [e]: i.value
    }, gt(() => i.children))), void 0), o;
  };
}
const At = Symbol("fallback");
function xe(e) {
  for (let t = 0; t < e.length; t++) e[t]();
}
function St(e, t, n = {}) {
  let i = [], o = [], s = [], r = 0, l = t.length > 1 ? [] : null;
  return at(() => xe(s)), () => {
    let f = e() || [], a = f.length, u, c;
    return f[be], D(() => {
      let h, g, m, A, _, $, E, T, F;
      if (a === 0)
        r !== 0 && (xe(s), s = [], i = [], o = [], r = 0, l && (l = [])), n.fallback && (i = [At], o[0] = H((rt) => (s[0] = rt, n.fallback())), r = 1);
      else if (r === 0) {
        for (o = new Array(a), c = 0; c < a; c++)
          i[c] = f[c], o[c] = H(d);
        r = a;
      } else {
        for (m = new Array(a), A = new Array(a), l && (_ = new Array(a)), $ = 0, E = Math.min(r, a); $ < E && i[$] === f[$]; $++) ;
        for (E = r - 1, T = a - 1; E >= $ && T >= $ && i[E] === f[T]; E--, T--)
          m[T] = o[E], A[T] = s[E], l && (_[T] = l[E]);
        for (h = /* @__PURE__ */ new Map(), g = new Array(T + 1), c = T; c >= $; c--)
          F = f[c], u = h.get(F), g[c] = u === void 0 ? -1 : u, h.set(F, c);
        for (u = $; u <= E; u++)
          F = i[u], c = h.get(F), c !== void 0 && c !== -1 ? (m[c] = o[u], A[c] = s[u], l && (_[c] = l[u]), c = g[c], h.set(F, c)) : s[u]();
        for (c = $; c < a; c++)
          c in m ? (o[c] = m[c], s[c] = A[c], l && (l[c] = _[c], l[c](c))) : o[c] = H(d);
        o = o.slice(0, r = a), i = f.slice(0);
      }
      return o;
    });
    function d(h) {
      if (s[c] = h, l) {
        const [g, m] = Y(c);
        return l[c] = m, t(f[c], g);
      }
      return t(f[c]);
    }
  };
}
function y(e, t) {
  return D(() => e(t || {}));
}
function te() {
  return !0;
}
const Ae = {
  get(e, t, n) {
    return t === x ? n : e.get(t);
  },
  has(e, t) {
    return t === x ? !0 : e.has(t);
  },
  set: te,
  deleteProperty: te,
  getOwnPropertyDescriptor(e, t) {
    return {
      configurable: !0,
      enumerable: !0,
      get() {
        return e.get(t);
      },
      set: te,
      deleteProperty: te
    };
  },
  ownKeys(e) {
    return e.keys();
  }
};
function ge(e) {
  return (e = typeof e == "function" ? e() : e) ? e : {};
}
function kt() {
  for (let e = 0, t = this.length; e < t; ++e) {
    const n = this[e]();
    if (n !== void 0) return n;
  }
}
function V(...e) {
  let t = !1;
  for (let r = 0; r < e.length; r++) {
    const l = e[r];
    t = t || !!l && x in l, e[r] = typeof l == "function" ? (t = !0, O(l)) : l;
  }
  if (je && t)
    return new Proxy({
      get(r) {
        for (let l = e.length - 1; l >= 0; l--) {
          const f = ge(e[l])[r];
          if (f !== void 0) return f;
        }
      },
      has(r) {
        for (let l = e.length - 1; l >= 0; l--)
          if (r in ge(e[l])) return !0;
        return !1;
      },
      keys() {
        const r = [];
        for (let l = 0; l < e.length; l++) r.push(...Object.keys(ge(e[l])));
        return [...new Set(r)];
      }
    }, Ae);
  const n = {}, i = /* @__PURE__ */ Object.create(null);
  for (let r = e.length - 1; r >= 0; r--) {
    const l = e[r];
    if (!l) continue;
    const f = Object.getOwnPropertyNames(l);
    for (let a = f.length - 1; a >= 0; a--) {
      const u = f[a];
      if (u === "__proto__" || u === "constructor") continue;
      const c = Object.getOwnPropertyDescriptor(l, u);
      if (!i[u])
        i[u] = c.get ? {
          enumerable: !0,
          configurable: !0,
          get: kt.bind(n[u] = [c.get.bind(l)])
        } : c.value !== void 0 ? c : void 0;
      else {
        const d = n[u];
        d && (c.get ? d.push(c.get.bind(l)) : c.value !== void 0 && d.push(() => c.value));
      }
    }
  }
  const o = {}, s = Object.keys(i);
  for (let r = s.length - 1; r >= 0; r--) {
    const l = s[r], f = i[l];
    f && f.get ? Object.defineProperty(o, l, f) : o[l] = f ? f.value : void 0;
  }
  return o;
}
function We(e, ...t) {
  const n = t.length;
  if (je && x in e) {
    const o = n > 1 ? t.flat() : t[0], s = /* @__PURE__ */ new Set(), r = t.map((l) => {
      const f = l.filter((a) => !s.has(a) && (s.add(a), !0));
      return new Proxy({
        get(a) {
          return f.includes(a) ? e[a] : void 0;
        },
        has(a) {
          return f.includes(a) && a in e;
        },
        keys() {
          return f.filter((a) => a in e);
        }
      }, Ae);
    });
    return r.push(new Proxy({
      get(l) {
        return o.includes(l) ? void 0 : e[l];
      },
      has(l) {
        return o.includes(l) ? !1 : l in e;
      },
      keys() {
        return Object.keys(e).filter((l) => !o.includes(l));
      }
    }, Ae)), r;
  }
  const i = [];
  for (let o = 0; o <= n; o++)
    i[o] = {};
  for (const o of Object.getOwnPropertyNames(e)) {
    let s = n;
    for (let f = 0; f < t.length; f++)
      if (t[f].includes(o)) {
        s = f;
        break;
      }
    const r = Object.getOwnPropertyDescriptor(e, o);
    !r.get && !r.set && r.enumerable && r.writable && r.configurable ? i[s][o] = r.value : Object.defineProperty(i[s], o, r);
  }
  return i;
}
const $t = (e) => `Stale read from <${e}>.`;
function Se(e) {
  const t = "fallback" in e && {
    fallback: () => e.fallback
  };
  return O(St(() => e.each, e.children, t || void 0));
}
function M(e) {
  const t = e.keyed, n = O(() => e.when, void 0, void 0), i = t ? n : O(n, void 0, {
    equals: (o, s) => !o == !s
  });
  return O(() => {
    const o = i();
    if (o) {
      const s = e.children;
      return typeof s == "function" && s.length > 0 ? D(() => s(t ? o : () => {
        if (!D(i)) throw $t("Show");
        return n();
      })) : s;
    }
    return e.fallback;
  }, void 0, void 0);
}
const pt = [
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
], vt = /* @__PURE__ */ new Set([
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
  ...pt
]), Ot = /* @__PURE__ */ new Set(["innerHTML", "textContent", "innerText", "children"]), xt = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
}), _t = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
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
  const n = _t[e];
  return typeof n == "object" ? n[t] ? n.$ : void 0 : n;
}
const Pt = /* @__PURE__ */ new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]), Dt = /* @__PURE__ */ new Set([
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
]), Ct = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};
function Tt(e, t, n) {
  let i = n.length, o = t.length, s = i, r = 0, l = 0, f = t[o - 1].nextSibling, a = null;
  for (; r < o || l < s; ) {
    if (t[r] === n[l]) {
      r++, l++;
      continue;
    }
    for (; t[o - 1] === n[s - 1]; )
      o--, s--;
    if (o === r) {
      const u = s < i ? l ? n[l - 1].nextSibling : n[s - l] : f;
      for (; l < s; ) e.insertBefore(n[l++], u);
    } else if (s === l)
      for (; r < o; )
        (!a || !a.has(t[r])) && t[r].remove(), r++;
    else if (t[r] === n[s - 1] && n[l] === t[o - 1]) {
      const u = t[--o].nextSibling;
      e.insertBefore(n[l++], t[r++].nextSibling), e.insertBefore(n[--s], u), t[o] = n[s];
    } else {
      if (!a) {
        a = /* @__PURE__ */ new Map();
        let c = l;
        for (; c < s; ) a.set(n[c], c++);
      }
      const u = a.get(t[r]);
      if (u != null)
        if (l < u && u < s) {
          let c = r, d = 1, h;
          for (; ++c < o && c < s && !((h = a.get(t[c])) == null || h !== u + d); )
            d++;
          if (d > u - l) {
            const g = t[r];
            for (; l < u; ) e.insertBefore(n[l++], g);
          } else e.replaceChild(n[l++], t[r++]);
        } else r++;
      else t[r++].remove();
    }
  }
}
const _e = "_$DX_DELEGATE";
function Nt(e, t, n, i = {}) {
  let o;
  return H((s) => {
    o = s, t === document ? e() : S(t, e(), t.firstChild ? null : void 0, n);
  }, i.owner), () => {
    o(), t.textContent = "";
  };
}
function C(e, t, n, i) {
  let o;
  const s = () => {
    const l = document.createElement("template");
    return l.innerHTML = e, l.content.firstChild;
  }, r = () => (o || (o = s())).cloneNode(!0);
  return r.cloneNode = r, r;
}
function Ve(e, t = window.document) {
  const n = t[_e] || (t[_e] = /* @__PURE__ */ new Set());
  for (let i = 0, o = e.length; i < o; i++) {
    const s = e[i];
    n.has(s) || (n.add(s), t.addEventListener(s, Bt));
  }
}
function q(e, t, n) {
  n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function jt(e, t, n, i) {
  i == null ? e.removeAttributeNS(t, n) : e.setAttributeNS(t, n, i);
}
function It(e, t, n) {
  n ? e.setAttribute(t, "") : e.removeAttribute(t);
}
function Lt(e, t) {
  t == null ? e.removeAttribute("class") : e.className = t;
}
function Mt(e, t, n, i) {
  if (i)
    Array.isArray(n) ? (e[`$$${t}`] = n[0], e[`$$${t}Data`] = n[1]) : e[`$$${t}`] = n;
  else if (Array.isArray(n)) {
    const o = n[0];
    e.addEventListener(t, n[0] = (s) => o.call(e, n[1], s));
  } else e.addEventListener(t, n, typeof n != "function" && n);
}
function Rt(e, t, n = {}) {
  const i = Object.keys(t || {}), o = Object.keys(n);
  let s, r;
  for (s = 0, r = o.length; s < r; s++) {
    const l = o[s];
    !l || l === "undefined" || t[l] || (Ee(e, l, !1), delete n[l]);
  }
  for (s = 0, r = i.length; s < r; s++) {
    const l = i[s], f = !!t[l];
    !l || l === "undefined" || n[l] === f || !f || (Ee(e, l, !0), n[l] = f);
  }
  return n;
}
function zt(e, t, n) {
  if (!t) return n ? q(e, "style") : t;
  const i = e.style;
  if (typeof t == "string") return i.cssText = t;
  typeof n == "string" && (i.cssText = n = void 0), n || (n = {}), t || (t = {});
  let o, s;
  for (s in n)
    t[s] == null && i.removeProperty(s), delete n[s];
  for (s in t)
    o = t[s], o !== n[s] && (i.setProperty(s, o), n[s] = o);
  return n;
}
function qe(e, t = {}, n, i) {
  const o = {};
  return i || P(() => o.children = J(e, t.children, o.children)), P(() => typeof t.ref == "function" && Z(t.ref, e)), P(() => Ft(e, t, n, !0, o, !0)), o;
}
function Z(e, t, n) {
  return D(() => e(t, n));
}
function S(e, t, n, i) {
  if (n !== void 0 && !i && (i = []), typeof t != "function") return J(e, t, i, n);
  P((o) => J(e, t(), o, n), i);
}
function Ft(e, t, n, i, o = {}, s = !1) {
  t || (t = {});
  for (const r in o)
    if (!(r in t)) {
      if (r === "children") continue;
      o[r] = Pe(e, r, null, o[r], n, s, t);
    }
  for (const r in t) {
    if (r === "children")
      continue;
    const l = t[r];
    o[r] = Pe(e, r, l, o[r], n, s, t);
  }
}
function Ut(e) {
  return e.toLowerCase().replace(/-([a-z])/g, (t, n) => n.toUpperCase());
}
function Ee(e, t, n) {
  const i = t.trim().split(/\s+/);
  for (let o = 0, s = i.length; o < s; o++) e.classList.toggle(i[o], n);
}
function Pe(e, t, n, i, o, s, r) {
  let l, f, a, u, c;
  if (t === "style") return zt(e, n, i);
  if (t === "classList") return Rt(e, n, i);
  if (n === i) return i;
  if (t === "ref")
    s || n(e);
  else if (t.slice(0, 3) === "on:") {
    const d = t.slice(3);
    i && e.removeEventListener(d, i, typeof i != "function" && i), n && e.addEventListener(d, n, typeof n != "function" && n);
  } else if (t.slice(0, 10) === "oncapture:") {
    const d = t.slice(10);
    i && e.removeEventListener(d, i, !0), n && e.addEventListener(d, n, !0);
  } else if (t.slice(0, 2) === "on") {
    const d = t.slice(2).toLowerCase(), h = Pt.has(d);
    if (!h && i) {
      const g = Array.isArray(i) ? i[0] : i;
      e.removeEventListener(d, g);
    }
    (h || n) && (Mt(e, d, n, h), h && Ve([d]));
  } else if (t.slice(0, 5) === "attr:")
    q(e, t.slice(5), n);
  else if (t.slice(0, 5) === "bool:")
    It(e, t.slice(5), n);
  else if ((c = t.slice(0, 5) === "prop:") || (a = Ot.has(t)) || !o && ((u = Et(t, e.tagName)) || (f = vt.has(t))) || (l = e.nodeName.includes("-") || "is" in r))
    c && (t = t.slice(5), f = !0), t === "class" || t === "className" ? Lt(e, n) : l && !f && !a ? e[Ut(t)] = n : (t === "value" || t === "defaultValue") && (e.nodeName === "INPUT" || e.nodeName === "TEXTAREA") ? e[u || t] = n ?? "" : e[u || t] = n;
  else {
    const d = o && t.indexOf(":") > -1 && Ct[t.split(":")[0]];
    d ? jt(e, d, t, n) : q(e, xt[t] || t, n);
  }
  return n;
}
function Bt(e) {
  let t = e.target;
  const n = `$$${e.type}`, i = e.target, o = e.currentTarget, s = (f) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: f
  }), r = () => {
    const f = t[n];
    if (f && !t.disabled) {
      const a = t[`${n}Data`];
      if (a !== void 0 ? f.call(t, a, e) : f.call(t, e), e.cancelBubble) return;
    }
    return t.host && typeof t.host != "string" && !t.host._$host && t.contains(e.target) && s(t.host), !0;
  }, l = () => {
    for (; r() && (t = t._$host || t.parentNode || t.host); ) ;
  };
  Object.defineProperty(e, "currentTarget", {
    configurable: !0,
    get() {
      return t || document;
    }
  });
  try {
    if (e.composedPath) {
      const f = e.composedPath();
      s(f[0]);
      for (let a = 0; a < f.length - 2 && (t = f[a], !!r()); a++) {
        if (t._$host) {
          t = t._$host, l();
          break;
        }
        if (t.parentNode === o)
          break;
      }
    } else l();
    s(i);
  } finally {
    e = t = null;
  }
}
function J(e, t, n, i, o) {
  for (; typeof n == "function"; ) n = n();
  if (t === n) return n;
  const s = typeof t, r = i !== void 0;
  if (e = r && n[0] && n[0].parentNode || e, s === "string" || s === "number") {
    if (s === "number" && (t = t.toString(), t === n))
      return n;
    if (r) {
      let l = n[0];
      l && l.nodeType === 3 ? l.data !== t && (l.data = t) : l = document.createTextNode(t), n = U(e, n, i, l);
    } else
      n !== "" && typeof n == "string" ? n = e.firstChild.data = t : n = e.textContent = t;
  } else if (t == null || s === "boolean")
    n = U(e, n, i);
  else {
    if (s === "function")
      return P(() => {
        let l = t();
        for (; typeof l == "function"; ) l = l();
        n = J(e, l, n, i);
      }), () => n;
    if (Array.isArray(t)) {
      const l = [], f = n && Array.isArray(n);
      if (ke(l, t, n, o))
        return P(() => n = J(e, l, n, i, !0)), () => n;
      if (l.length === 0) {
        if (n = U(e, n, i), r) return n;
      } else f ? n.length === 0 ? De(e, l, i) : Tt(e, n, l) : (n && U(e), De(e, l));
      n = l;
    } else if (t.nodeType) {
      if (Array.isArray(n)) {
        if (r) return n = U(e, n, i, t);
        U(e, n, null, t);
      } else n == null || n === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
      n = t;
    }
  }
  return n;
}
function ke(e, t, n, i) {
  let o = !1;
  for (let s = 0, r = t.length; s < r; s++) {
    let l = t[s], f = n && n[e.length], a;
    if (!(l == null || l === !0 || l === !1)) if ((a = typeof l) == "object" && l.nodeType)
      e.push(l);
    else if (Array.isArray(l))
      o = ke(e, l, f) || o;
    else if (a === "function")
      if (i) {
        for (; typeof l == "function"; ) l = l();
        o = ke(e, Array.isArray(l) ? l : [l], Array.isArray(f) ? f : [f]) || o;
      } else
        e.push(l), o = !0;
    else {
      const u = String(l);
      f && f.nodeType === 3 && f.data === u ? e.push(f) : e.push(document.createTextNode(u));
    }
  }
  return o;
}
function De(e, t, n = null) {
  for (let i = 0, o = t.length; i < o; i++) e.insertBefore(t[i], n);
}
function U(e, t, n, i) {
  if (n === void 0) return e.textContent = "";
  const o = i || document.createTextNode("");
  if (t.length) {
    let s = !1;
    for (let r = t.length - 1; r >= 0; r--) {
      const l = t[r];
      if (o !== l) {
        const f = l.parentNode === e;
        !s && !r ? f ? e.replaceChild(o, l) : e.insertBefore(o, n) : f && l.remove();
      } else s = !0;
    }
  } else e.insertBefore(o, n);
  return [o];
}
const Wt = "http://www.w3.org/2000/svg";
function Vt(e, t = !1, n = void 0) {
  return t ? document.createElementNS(Wt, e) : document.createElement(e, {
    is: n
  });
}
function qt(e, t) {
  const n = O(e);
  return O(() => {
    const i = n();
    switch (typeof i) {
      case "function":
        return D(() => i(t));
      case "string":
        const o = Dt.has(i), s = Vt(i, o, D(() => t.is));
        return qe(s, t, o), s;
    }
  });
}
function Kt(e) {
  const [, t] = We(e, ["component"]);
  return qt(() => e.component, t);
}
const $e = Symbol("store-raw"), W = Symbol("store-node"), N = Symbol("store-has"), Ke = Symbol("store-self");
function Ge(e) {
  let t = e[x];
  if (!t && (Object.defineProperty(e, x, {
    value: t = new Proxy(e, Ht)
  }), !Array.isArray(e))) {
    const n = Object.keys(e), i = Object.getOwnPropertyDescriptors(e), o = Object.getPrototypeOf(e), s = o !== null && e !== null && typeof e == "object" && !Array.isArray(e) && o !== Object.prototype;
    if (s) {
      const r = Object.getOwnPropertyDescriptors(o);
      n.push(...Object.keys(r)), Object.assign(i, r);
    }
    for (let r = 0, l = n.length; r < l; r++) {
      const f = n[r];
      s && f === "constructor" || i[f].get && Object.defineProperty(e, f, {
        configurable: !0,
        enumerable: i[f].enumerable,
        get: i[f].get.bind(t)
      });
    }
  }
  return t;
}
function I(e) {
  let t;
  return e != null && typeof e == "object" && (e[x] || !(t = Object.getPrototypeOf(e)) || t === Object.prototype || Array.isArray(e));
}
function K(e, t = /* @__PURE__ */ new Set()) {
  let n, i, o, s;
  if (n = e != null && e[$e]) return n;
  if (!I(e) || t.has(e)) return e;
  if (Array.isArray(e)) {
    Object.isFrozen(e) ? e = e.slice(0) : t.add(e);
    for (let r = 0, l = e.length; r < l; r++)
      o = e[r], (i = K(o, t)) !== o && (e[r] = i);
  } else {
    Object.isFrozen(e) ? e = Object.assign({}, e) : t.add(e);
    const r = Object.keys(e), l = Object.getOwnPropertyDescriptors(e);
    for (let f = 0, a = r.length; f < a; f++)
      s = r[f], !l[s].get && (o = e[s], (i = K(o, t)) !== o && (e[s] = i));
  }
  return e;
}
function ce(e, t) {
  let n = e[t];
  return n || Object.defineProperty(e, t, {
    value: n = /* @__PURE__ */ Object.create(null)
  }), n;
}
function ee(e, t, n) {
  if (e[t]) return e[t];
  const [i, o] = Y(n, {
    equals: !1,
    internal: !0
  });
  return i.$ = o, e[t] = i;
}
function Gt(e, t) {
  const n = Reflect.getOwnPropertyDescriptor(e, t);
  return !n || n.get || !n.configurable || t === x || t === W || (delete n.value, delete n.writable, n.get = () => e[x][t]), n;
}
function Xe(e) {
  ye() && ee(ce(e, W), Ke)();
}
function Xt(e) {
  return Xe(e), Reflect.ownKeys(e);
}
const Ht = {
  get(e, t, n) {
    if (t === $e) return e;
    if (t === x) return n;
    if (t === be)
      return Xe(e), n;
    const i = ce(e, W), o = i[t];
    let s = o ? o() : e[t];
    if (t === W || t === N || t === "__proto__") return s;
    if (!o) {
      const r = Object.getOwnPropertyDescriptor(e, t);
      ye() && (typeof s != "function" || Object.prototype.hasOwnProperty.call(e, t)) && !(r && r.get) && (s = ee(i, t, s)());
    }
    return I(s) ? Ge(s) : s;
  },
  has(e, t) {
    return t === $e || t === x || t === be || t === W || t === N || t === "__proto__" ? !0 : (ye() && ee(ce(e, N), t)(), t in e);
  },
  set() {
    return !0;
  },
  deleteProperty() {
    return !0;
  },
  ownKeys: Xt,
  getOwnPropertyDescriptor: Gt
};
function v(e, t, n, i = !1) {
  if (t === "__proto__" || !i && e[t] === n) return;
  const o = e[t], s = e.length;
  n === void 0 ? (delete e[t], e[N] && e[N][t] && o !== void 0 && e[N][t].$()) : (e[t] = n, e[N] && e[N][t] && o === void 0 && e[N][t].$());
  let r = ce(e, W), l;
  if ((l = ee(r, t, o)) && l.$(() => n), Array.isArray(e) && e.length !== s) {
    for (let f = e.length; f < s; f++) (l = r[f]) && l.$();
    (l = ee(r, "length", s)) && l.$(e.length);
  }
  (l = r[Ke]) && l.$();
}
function He(e, t) {
  const n = Object.keys(t);
  for (let i = 0; i < n.length; i += 1) {
    const o = n[i];
    Ye(o) || v(e, o, t[o]);
  }
}
function Ye(e) {
  return e === "__proto__" || e === "constructor" || e === "prototype";
}
function Yt(e, t) {
  if (typeof t == "function" && (t = t(e)), t = K(t), Array.isArray(t)) {
    if (e === t) return;
    let n = 0, i = t.length;
    for (; n < i; n++) {
      const o = t[n];
      e[n] !== o && v(e, n, o);
    }
    v(e, "length", i);
  } else He(e, t);
}
function X(e, t, n = []) {
  let i, o = e;
  if (t.length > 1) {
    i = t.shift();
    const r = typeof i, l = Array.isArray(e);
    if (r === "string" && (i === "__proto__" || t.length > 1 && Ye(i)))
      return;
    if (Array.isArray(i)) {
      for (let f = 0; f < i.length; f++)
        X(e, [i[f]].concat(t), n);
      return;
    } else if (l && r === "function") {
      for (let f = 0; f < e.length; f++)
        i(e[f], f) && X(e, [f].concat(t), n);
      return;
    } else if (l && r === "object") {
      const {
        from: f = 0,
        to: a = e.length - 1,
        by: u = 1
      } = i;
      for (let c = f; c <= a; c += u)
        X(e, [c].concat(t), n);
      return;
    } else if (t.length > 1) {
      X(e[i], t, [i].concat(n));
      return;
    }
    o = e[i], n = [i].concat(n);
  }
  let s = t[0];
  typeof s == "function" && (s = s(o, n), s === o) || i === void 0 && s == null || (s = K(s), i === void 0 || I(o) && I(s) && !Array.isArray(s) ? He(o, s) : v(e, i, s));
}
function Qt(...[e, t]) {
  const n = K(e || {}), i = Array.isArray(n), o = Ge(n);
  function s(...r) {
    ut(() => {
      i && r.length === 1 ? Yt(n, r[0]) : X(n, r);
    });
  }
  return [o, s];
}
const pe = Symbol("store-root");
function Ce(e) {
  return e === "__proto__" || e === "constructor" || e === "prototype";
}
function B(e, t, n, i, o) {
  if (Ce(n)) return;
  const s = t[n];
  if (e === s) return;
  const r = Array.isArray(e);
  if (n !== pe && (!I(e) || !I(s) || r !== Array.isArray(s) || o && e[o] !== s[o])) {
    v(t, n, e);
    return;
  }
  if (r) {
    if (e.length && s.length && (!i || o && e[0] && e[0][o] != null)) {
      let a, u, c, d, h, g, m, A;
      for (c = 0, d = Math.min(s.length, e.length); c < d && (s[c] === e[c] || o && s[c] && e[c] && s[c][o] && s[c][o] === e[c][o]); c++)
        B(e[c], s, c, i, o);
      const _ = new Array(e.length), $ = /* @__PURE__ */ new Map();
      for (d = s.length - 1, h = e.length - 1; d >= c && h >= c && (s[d] === e[h] || o && s[d] && e[h] && s[d][o] && s[d][o] === e[h][o]); d--, h--)
        _[h] = s[d];
      if (c > h || c > d) {
        for (u = c; u <= h; u++) v(s, u, e[u]);
        for (; u < e.length; u++)
          v(s, u, _[u]), B(e[u], s, u, i, o);
        s.length > e.length && v(s, "length", e.length);
        return;
      }
      for (m = new Array(h + 1), u = h; u >= c; u--)
        g = e[u], A = o && g ? g[o] : g, a = $.get(A), m[u] = a === void 0 ? -1 : a, $.set(A, u);
      for (a = c; a <= d; a++)
        g = s[a], A = o && g ? g[o] : g, u = $.get(A), u !== void 0 && u !== -1 && (_[u] = s[a], u = m[u], $.set(A, u));
      for (u = c; u < e.length; u++)
        u in _ ? (v(s, u, _[u]), B(e[u], s, u, i, o)) : v(s, u, e[u]);
    } else
      for (let a = 0, u = e.length; a < u; a++)
        B(e[a], s, a, i, o);
    s.length > e.length && v(s, "length", e.length);
    return;
  }
  const l = Object.keys(e);
  for (let a = 0, u = l.length; a < u; a++)
    Ce(l[a]) || B(e[l[a]], s, l[a], i, o);
  const f = Object.keys(s);
  for (let a = 0, u = f.length; a < u; a++)
    e[f[a]] === void 0 && v(s, f[a], void 0);
}
function Zt(e, t = {}) {
  const {
    merge: n,
    key: i = "id"
  } = t, o = K(e);
  return (s) => {
    if (!I(s) || !I(o)) return o;
    const r = B(o, {
      [pe]: s
    }, pe, n, i);
    return r === void 0 ? s : r;
  };
}
var Jt = dt({
  size: 24,
  color: "currentColor",
  strokeWidth: 2,
  absoluteStrokeWidth: !1,
  nonScalingStroke: !1,
  class: ""
}), en = /* @__PURE__ */ C("<svg>"), tn = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, L = tn, ve = (...e) => e.filter((t, n, i) => !!t && t.trim() !== "" && i.indexOf(t) === n).join(" ").trim();
function we(e) {
  return e != null;
}
function nn(e, t = {}) {
  const n = t.attributeNames ?? {}, i = (d) => n[d] ?? d, o = e.size ?? e.width ?? L.width, s = e.size ?? e.height ?? L.height, r = e.aliases?.filter((d) => typeof d == "string" && d.trim() !== "").map((d) => `lucide-${d}`) ?? [], l = [...e.name ? [`lucide-${e.name}`] : [], ...r], f = t.className?.split(" ").filter(Boolean) ?? [], a = t.includeDefaultClasses === !1 ? ve(...f) : ve("lucide", ...l, ...f), u = t.absoluteStrokeWidth ? Number(t.strokeWidth ?? L["stroke-width"]) * Number(e.size ?? e.width ?? L.width) / Number(t.size ?? t.width ?? L.width) : t.strokeWidth ?? L["stroke-width"];
  return ["svg", {
    ...Object.entries(L).reduce((d, [h, g]) => (d[i(h)] = g, d), {}),
    ..."color" in t && t.color && {
      [i("stroke")]: t.color
    },
    ..."size" in t && we(t.size) && {
      [i("width")]: t.size,
      [i("height")]: t.size
    },
    ..."width" in t && we(t.width) && {
      [i("width")]: t.width
    },
    ..."height" in t && we(t.height) && {
      [i("height")]: t.height
    },
    [i("stroke-width")]: u,
    ...a && {
      [i("class")]: a
    },
    [i("viewBox")]: `0 0 ${o} ${s}`,
    ...t.hasA11yProp === !1 ? {
      [i("aria-hidden")]: "true"
    } : {},
    ..."attributes" in t && t.attributes
  }, e.node.map((d) => {
    const [h, g, m] = d, A = t.nonScalingStroke ? {
      [i("vector-effect")]: "non-scaling-stroke",
      ...g
    } : g;
    return m ? [h, A, m] : [h, A];
  })];
}
var on = nn, sn = (e) => {
  for (const t in e)
    if (t.startsWith("aria-") || t === "role" || t === "title")
      return !0;
  return !1;
}, rn = (e) => {
  const [t, n] = We(e, ["color", "size", "width", "height", "strokeWidth", "children", "class", "icon", "iconNode", "absoluteStrokeWidth", "nonScalingStroke"]), i = ht(Jt), o = O(() => t.icon ?? {
    node: t.iconNode ?? [],
    size: 24,
    aliases: []
  }), s = O(() => on(o(), {
    color: t.color ?? i.color,
    width: t.width ?? t.size ?? i.size,
    height: t.height ?? t.size ?? i.size,
    strokeWidth: t.strokeWidth ?? i.strokeWidth,
    absoluteStrokeWidth: t.absoluteStrokeWidth ?? i.absoluteStrokeWidth,
    nonScalingStroke: t.nonScalingStroke ?? i.nonScalingStroke,
    className: ve("lucide-icon", i.class, t.class),
    hasA11yProp: !!t.children || sn(n),
    attributes: n
  }));
  return (() => {
    var r = en();
    return qe(r, V(() => s()[1]), !0, !0), S(r, y(Se, {
      get each() {
        return s()[2] ?? [];
      },
      children: ([l, f]) => y(Kt, V({
        component: l
      }, f))
    })), r;
  })();
}, ae = rn, Qe = {
  name: "square",
  size: 24,
  node: [["rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2",
    key: "afitv7"
  }]]
};
Qe.node;
var ln = (e) => y(ae, V(e, {
  icon: Qe
})), cn = ln, Ze = {
  name: "square-check",
  size: 24,
  node: [["rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2",
    key: "afitv7"
  }], ["path", {
    d: "m16 9-5.5 5.5L8 12",
    key: "xofnsj"
  }]],
  aliases: ["check-square-2"]
};
Ze.node;
var fn = (e) => y(ae, V(e, {
  icon: Ze
})), un = fn, Je = {
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
Je.node;
var an = (e) => y(ae, V(e, {
  icon: Je
})), dn = an, et = {
  name: "chevron-right",
  size: 24,
  node: [["path", {
    d: "m9 18 6-6-6-6",
    key: "mthhwq"
  }]]
};
et.node;
var hn = (e) => y(ae, V(e, {
  icon: et
})), gn = hn;
const de = 500;
function Oe(e) {
  if (!Array.isArray(e)) return [];
  const t = /* @__PURE__ */ new Set(), n = [];
  for (const i of e) {
    if (!i || typeof i != "object") continue;
    const { id: o, text: s, done: r, createdAt: l, doneAt: f } = i;
    if (typeof o != "string" || o === "" || t.has(o) || typeof s != "string" || s.trim() === "") continue;
    t.add(o);
    const a = {
      id: o,
      text: s.slice(0, de),
      done: r === !0,
      createdAt: typeof l == "number" ? l : 0
    };
    a.done && typeof f == "number" && (a.doneAt = f), n.push(a);
  }
  return n;
}
function tt(e) {
  const t = String(e).replace(/\s+/g, " ").trim().slice(0, de);
  return t === "" ? null : t;
}
function wn(e, t, n, i) {
  const o = tt(t);
  return o === null ? e : [{ id: n, text: o, done: !1, createdAt: i }, ...e];
}
function nt(e, t, n, i) {
  return e.map((o) => o.id !== t || o.done === n ? o : n ? { ...o, done: !0, doneAt: i } : { id: o.id, text: o.text, done: !1, createdAt: o.createdAt });
}
function bn(e, t, n) {
  const i = e.find((o) => o.id === t);
  return i ? nt(e, t, !i.done, n) : e;
}
function yn(e, t, n) {
  const i = tt(n);
  return i === null ? it(e, t) : e.map((o) => o.id === t ? { ...o, text: i } : o);
}
function it(e, t) {
  return e.filter((n) => n.id !== t);
}
function mn(e) {
  return e.filter((t) => !t.done);
}
function An(e, t, n) {
  const i = e.filter((r) => !r.done), o = i.findIndex((r) => r.id === t), s = o + n;
  return o === -1 || s < 0 || s >= i.length ? e : ([i[o], i[s]] = [i[s], i[o]], [...i, ...e.filter((r) => r.done)]);
}
function Sn(e) {
  const t = e.filter((i) => !i.done), n = e.filter((i) => i.done).sort((i, o) => (o.doneAt ?? 0) - (i.doneAt ?? 0));
  return { open: t, done: n };
}
function kn(e, t, n, i) {
  switch (t.op) {
    case "add":
      return wn(e, t.text, i, n);
    case "setDone":
      return nt(e, t.id, t.done, n);
    case "toggle":
      return bn(e, t.id, n);
    case "edit":
      return yn(e, t.id, t.text);
    case "remove":
      return it(e, t.id);
    case "move":
      return An(e, t.id, t.delta);
    case "clearDone":
      return mn(e);
  }
}
var $n = /* @__PURE__ */ C("<input class=todo-edit>"), pn = /* @__PURE__ */ C('<div class=todo-row tabindex=0><button class="todo-icon-button todo-check"tabindex=-1></button><button class="todo-icon-button todo-remove"title=Remove tabindex=-1>'), vn = /* @__PURE__ */ C("<span class=todo-text>"), On = /* @__PURE__ */ C("<span class=todo-count>"), xn = /* @__PURE__ */ C("<div class=todo-error>"), _n = /* @__PURE__ */ C("<div class=todo-empty>Nothing to do. Type above and press Enter. Double-click a task to edit it; with a task focused, Space checks it, Shift+Up and Shift+Down move it, Delete removes it."), En = /* @__PURE__ */ C("<div class=todo-done-header><button class=todo-done-toggle>Done (<!>)</button><button class=todo-clear>Clear"), Pn = /* @__PURE__ */ C("<div class=todo-list>"), Dn = /* @__PURE__ */ C('<div class=todo-panel><div class=todo-panel-header><span class=todo-panel-title>Todo</span></div><form class=todo-add><input type=text placeholder="Add a task"></form><div class=todo-scroll><div class=todo-list>');
const ne = 12, ie = 2.2, p = H(() => {
  const [e, t] = Qt({
    items: []
  }), [n, i] = Y(null), [o, s] = Y(!1);
  return {
    items: () => e.items,
    setItems: (r) => t("items", Zt(r, {
      key: "id"
    })),
    error: n,
    setError: i,
    showDone: o,
    setShowDone: s
  };
});
let oe = null, Te = Promise.resolve();
function ot(e) {
  p.setError(e instanceof Error ? e.message : String(e));
}
function j(e) {
  const t = oe;
  t && (p.setItems(kn(p.items(), e, Date.now(), `pending-${Date.now()}`)), Te = Te.then(() => t.invoke("apply", e).then((n) => {
    p.setError(null), p.setItems(Oe(n));
  }, (n) => (ot(n), st(t)))));
}
function st(e) {
  return e.invoke("list").then((t) => p.setItems(Oe(t)), ot);
}
function Ne(e) {
  const [t, n] = Y(!1);
  let i;
  const o = (r) => {
    t() && (n(!1), j({
      op: "edit",
      id: e.todo.id,
      text: r.value
    }));
  }, s = (r) => {
    if (r.target === i)
      if (r.key === "Enter" || r.key === "F2")
        r.preventDefault(), n(!0);
      else if (r.key === " ")
        r.preventDefault(), j({
          op: "toggle",
          id: e.todo.id
        });
      else if (r.key === "Delete" || r.key === "Backspace") {
        r.preventDefault();
        const l = i.nextElementSibling ?? i.previousElementSibling;
        j({
          op: "remove",
          id: e.todo.id
        }), l?.focus();
      } else r.shiftKey && (r.key === "ArrowUp" || r.key === "ArrowDown") ? (r.preventDefault(), j({
        op: "move",
        id: e.todo.id,
        delta: r.key === "ArrowUp" ? -1 : 1
      }), i.focus()) : (r.key === "ArrowUp" || r.key === "ArrowDown") && (r.preventDefault(), (r.key === "ArrowUp" ? i.previousElementSibling : i.nextElementSibling)?.focus());
  };
  return (() => {
    var r = pn(), l = r.firstChild, f = l.nextSibling;
    r.$$keydown = s;
    var a = i;
    return typeof a == "function" ? Z(a, r) : i = r, l.$$click = () => j({
      op: "toggle",
      id: e.todo.id
    }), S(l, y(M, {
      get when() {
        return e.todo.done;
      },
      get fallback() {
        return y(cn, {
          size: ne,
          "stroke-width": ie
        });
      },
      get children() {
        return y(un, {
          size: ne,
          "stroke-width": ie
        });
      }
    })), S(r, y(M, {
      get when() {
        return t();
      },
      get fallback() {
        return (() => {
          var u = vn();
          return u.$$dblclick = () => n(!0), S(u, () => e.todo.text), u;
        })();
      },
      get children() {
        var u = $n();
        return u.addEventListener("blur", (c) => o(c.currentTarget)), u.$$keydown = (c) => {
          c.key === "Enter" ? (c.preventDefault(), o(c.currentTarget), i.focus()) : c.key === "Escape" && (c.preventDefault(), n(!1), i.focus());
        }, Z((c) => queueMicrotask(() => c.select()), u), q(u, "maxlength", de), P(() => u.value = e.todo.text), u;
      }
    }), f), f.$$click = () => j({
      op: "remove",
      id: e.todo.id
    }), S(f, y(dn, {
      size: ne,
      "stroke-width": ie
    })), P((u) => {
      var c = !!e.todo.done, d = e.todo.done ? "Mark as open" : "Mark as done";
      return c !== u.e && r.classList.toggle("done", u.e = c), d !== u.t && q(l, "title", u.t = d), u;
    }, {
      e: void 0,
      t: void 0
    }), r;
  })();
}
function Cn() {
  const e = O(() => Sn(p.items()));
  let t, n;
  const i = (o) => {
    o.preventDefault(), t.value.trim() !== "" && j({
      op: "add",
      text: t.value
    }), t.value = "";
  };
  return (() => {
    var o = Dn(), s = o.firstChild;
    s.firstChild;
    var r = s.nextSibling, l = r.firstChild, f = r.nextSibling, a = f.firstChild;
    S(s, y(M, {
      get when() {
        return e().open.length > 0;
      },
      get children() {
        var c = On();
        return S(c, () => e().open.length), c;
      }
    }), null), r.addEventListener("submit", i), l.$$keydown = (c) => {
      c.key === "Escape" ? c.currentTarget.blur() : c.key === "ArrowDown" && (c.preventDefault(), n.firstElementChild?.focus());
    }, Z((c) => {
      t = c, queueMicrotask(() => c.focus());
    }, l), q(l, "maxlength", de), S(o, y(M, {
      get when() {
        return p.error();
      },
      get children() {
        var c = xn();
        return S(c, () => p.error()), c;
      }
    }), f);
    var u = n;
    return typeof u == "function" ? Z(u, a) : n = a, S(a, y(Se, {
      get each() {
        return e().open;
      },
      children: (c) => y(Ne, {
        todo: c
      })
    })), S(f, y(M, {
      get when() {
        return p.items().length === 0;
      },
      get children() {
        return _n();
      }
    }), null), S(f, y(M, {
      get when() {
        return e().done.length > 0;
      },
      get children() {
        return [(() => {
          var c = En(), d = c.firstChild, h = d.firstChild, g = h.nextSibling;
          g.nextSibling;
          var m = d.nextSibling;
          return d.$$click = () => p.setShowDone((A) => !A), S(d, y(gn, {
            size: ne,
            "stroke-width": ie
          }), h), S(d, () => e().done.length, g), m.$$click = () => j({
            op: "clearDone"
          }), P(() => d.classList.toggle("expanded", !!p.showDone())), c;
        })(), y(M, {
          get when() {
            return p.showDone();
          },
          get children() {
            var c = Pn();
            return S(c, y(Se, {
              get each() {
                return e().done;
              },
              children: (d) => y(Ne, {
                todo: d
              })
            })), c;
          }
        })];
      }
    }), null), o;
  })();
}
function Tn(e, t) {
  oe = t;
  const n = t.on("changed", (o) => p.setItems(Oe(o)));
  st(t);
  const i = Nt(() => y(Cn, {}), e);
  return () => {
    i(), n(), oe === t && (oe = null);
  };
}
Ve(["keydown", "click", "dblclick"]);
export {
  Tn as mount
};
