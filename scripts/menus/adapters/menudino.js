/* MenuDino (<loja>.menudino.com): categorias em /api/bff/catalog/categories/<loja>; os itens de cada categoria só
   carregam ao abri-la (/catalog/items/<loja>/<categoria>/summary — o coletor toca em todas). Itens com minPrice menor
   que salePrice têm opções que só aparecem no detalhe do produto: entram pelo preço de venda, registrado nas notas. */
'use strict';
const L = require('../lib');

module.exports = function parse({ responses, meta }) {
  const cats = (responses.find(r => /\/catalog\/categories\//.test(r.url) && r.body && r.body.items) || {}).body;
  if (!cats) throw new Error('categorias não encontradas');
  const byCat = new Map();
  responses.forEach(r => { const m = /\/catalog\/items\/[^/]+\/([0-9a-f-]{36})\/summary/.exec(r.url); if (m && r.body && r.body.items) byCat.set(m[1], r.body.items); });
  const skipped = {}, notes = [], missing = [];
  const sections = cats.items.slice().sort((a, b) => a.sortIndex - b.sortIndex).map(c => {
    const items = byCat.get(c.id);
    if (!items) { missing.push(c.name); return { name: c.name, items: [] }; }
    return {
      name: c.name,
      items: items.slice().sort((a, b) => a.sortIndex - b.sortIndex).map(it => {
        if (it.isPaused) { L.count(skipped, 'pausado'); return null; }
        const price = L.cents(it.salePrice);
        if (!(price > 0)) { L.count(skipped, 'sem preço'); return null; }
        if (it.minPrice != null && L.cents(it.minPrice) !== price) notes.push('"' + L.displayName(it.name) + '": tem opções com preço só no detalhe do produto; entrou pelo preço de venda.');
        return { sourceId: it.id, name: L.displayName(it.name), description: L.displayText(it.description), priceCents: price, originalPriceCents: null,
          imageUrl: it.hasPhoto && it.largeImageUrl ? 'https://' + it.largeImageUrl.replace(/^https?:\/\//, '') : null, options: [] };
      })
    };
  });
  if (missing.length) notes.push('Categorias sem itens carregados na coleta: ' + missing.join(', ') + '.');
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)) });
};
