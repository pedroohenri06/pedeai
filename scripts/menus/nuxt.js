/* Decodifica o payload __NUXT_DATA__ (formato "devalue" do Nuxt 3): array plano em que objetos e listas apontam
   para outros índices. Envelopes como ["Reactive", i] e ["ShallowRef", i] são desembrulhados. */
'use strict';

const WRAPPERS = new Set(['Reactive', 'ShallowReactive', 'Ref', 'ShallowRef', 'EmptyRef', 'EmptyShallowRef', 'NuxtError', 'Island']);

function unflatten(flat) {
  const cache = new Map();
  function hydrate(i) {
    if (i === -1 || i === undefined) return undefined;
    if (i < 0) return i === -2 ? null : i === -3 ? NaN : undefined;
    if (cache.has(i)) return cache.get(i);
    const v = flat[i];
    if (v === null || typeof v !== 'object') { cache.set(i, v); return v; }
    if (Array.isArray(v)) {
      if (typeof v[0] === 'string' && (WRAPPERS.has(v[0]) || ['Set', 'Map', 'Date', 'BigInt', 'RegExp', 'Object'].includes(v[0]))) {
        if (v[0] === 'Set') { const s = []; cache.set(i, s); v.slice(1).forEach(j => s.push(hydrate(j))); return s; }
        if (v[0] === 'Date' || v[0] === 'BigInt' || v[0] === 'RegExp') { cache.set(i, v[1]); return v[1]; }
        const out = hydrate(v[1]); cache.set(i, out); return out;
      }
      const arr = []; cache.set(i, arr); v.forEach(j => arr.push(hydrate(j))); return arr;
    }
    const obj = {}; cache.set(i, obj);
    Object.keys(v).forEach(k => { obj[k] = hydrate(v[k]); });
    return obj;
  }
  return hydrate(0);
}

function fromHtml(html) {
  const m = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  return m ? unflatten(JSON.parse(m[1])) : null;
}

module.exports = { unflatten, fromHtml };
