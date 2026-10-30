/* Zion PDV (zionpdv-storefront.fly.dev/store/<loja>): Next.js; a lista de categorias e produtos vem no payload RSC
   (self.__next_f). Variantes têm preço próprio e "compareAtPrice" (preço cheio). Os grupos de opções só carregam ao
   abrir o produto e não fazem parte da listagem: produtos que dependem deles ficam marcados nas notas. */
'use strict';
const L = require('../lib');

function rscText(html) {
  const out = [], re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  for (let m = re.exec(html); m; m = re.exec(html)) out.push(JSON.parse(m[1]));
  return out.join('');
}

/* Lê o array JSON que começa em `from` (o texto RSC é JSON válido dentro de cada nó). */
function sliceArray(s, from) {
  let depth = 0, inStr = false, esc = false, j = from;
  for (; j < s.length; j++) {
    const c = s[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) break;
  }
  return JSON.parse(s.slice(from, j + 1));
}

module.exports = function parse({ html, meta }) {
  const s = rscText(html), at = s.indexOf('"categories":[');
  if (at < 0) throw new Error('categorias não encontradas no payload');
  const cats = sliceArray(s, at + '"categories":'.length).sort((a, b) => a.position - b.position);
  const skipped = {}, notes = [];
  const sections = cats.map(c => ({
    name: c.name,
    items: (c.products || []).map(p => {
      const sizes = (p.variants || []).length
        ? p.variants.map(v => { const now = L.cents(v.price), full = L.cents(v.compareAtPrice); return { name: v.name, priceCents: now, originalPriceCents: full > now ? full : null }; })
        : [{ name: '', priceCents: L.cents(p.basePrice), originalPriceCents: null }];
      const priced = L.sizesToItem(sizes);
      if (!priced) { L.count(skipped, p.isBuildYourOwn ? 'monte o seu (preço depende das opções)' : 'sem preço'); return null; }
      if (p.hasOptionGroups) notes.push('"' + L.displayName(p.name) + '": a fonte tem opções que só carregam ao abrir o produto; não importadas.');
      return { sourceId: p.id, name: L.displayName(p.name), description: L.displayText(p.description), priceCents: priced.priceCents, originalPriceCents: priced.originalPriceCents, imageUrl: p.imageUrl || null, featured: !!p.isFeatured, options: priced.options };
    })
  }));
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)) });
};
