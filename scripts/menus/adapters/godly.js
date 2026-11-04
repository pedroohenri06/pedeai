/* Godly Soluções (<loja>.godlysolucoes.net.br): a página busca …/api/menu/storefront — categorias → produtos
   (price, active, soldOut, extras) com a foto embutida em base64 (gravada em bruto/<id>/img para o images.py). */
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('../lib');

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /\/api\/menu\/storefront/.test(r.url) && Array.isArray(r.body));
  if (!hit) throw new Error('cardápio não encontrado');
  const dir = path.join(__dirname, '..', '..', '..', 'data', 'research', 'cardapios', 'bruto', meta.id, 'img');
  fs.mkdirSync(dir, { recursive: true });
  const skipped = {};
  const sections = hit.body.slice().sort((a, b) => a.order - b.order).map(c => ({
    name: L.cleanText(c.name),
    items: (c.products || []).map(p => {
      if (!p.active || p.soldOut) { L.count(skipped, 'indisponível'); return null; }
      const price = L.cents(Number(p.price));
      if (!price) { L.count(skipped, 'sem preço'); return null; }
      let imageUrl = null;
      const m = /^data:image\/(\w+);base64,(.+)$/.exec(p.imageUrl || '');
      if (m) { const f = path.join(dir, p.id + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1])); fs.writeFileSync(f, Buffer.from(m[2], 'base64')); imageUrl = 'file://' + f; }
      else if (/^https:/.test(p.imageUrl || '')) imageUrl = p.imageUrl;
      const options = (p.extras || []).map(e => L.optionGroup(e.name || 'Adicionais', e.required ? Math.max(1, e.min || 0) : 0, e.max || null,
        (e.options || e.items || []).map(o => ({ name: o.name, priceCents: L.cents(Number(o.price)) || 0 })))).filter(Boolean);
      return { sourceId: p.id, name: L.displayName(L.cleanText(p.name)), description: L.displayText(p.description), priceCents: price, originalPriceCents: null, imageUrl, options };
    }).filter(Boolean)
  }));
  return L.snapshot(meta, sections, { skipped });
};
