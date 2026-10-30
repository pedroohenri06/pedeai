/* Yooga (delivery.yooga.app): a página busca /v2/stores/<loja>/menu — categorias com itens, preços em reais e
   grupos de escolha (choices) com mínimo, máximo e preço por opção. */
'use strict';
const L = require('../lib');

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /\/v2\/stores\/[^/]+\/menu/.test(r.url) && Array.isArray(r.body));
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const skipped = {}, notes = [];
  const sections = hit.body.map(c => ({
    name: c.name,
    items: (c.items || []).map(it => {
      const full = L.cents(it.price), promo = L.cents(it.promotional_price);
      const now = promo > 0 && promo < full ? promo : full;
      if (!(now > 0)) { L.count(skipped, 'sem preço'); return null; }
      const options = (it.choices || []).map(ch => {
        const prices = new Set((ch.options || []).map(o => o.price));
        if (ch.use_greater_option_price && ch.max > 1 && prices.size > 1) notes.push('"' + L.displayName(it.name) + '": a fonte cobra só a opção mais cara; aqui as opções somam.');
        return L.optionGroup(ch.name, ch.required ? Math.max(1, ch.min || 0) : ch.min || 0, ch.max, (ch.options || []).map(o => ({ name: o.name, priceCents: L.cents(o.price) || 0 })));
      }).filter(Boolean);
      return { sourceId: String(it.id), name: L.displayName(it.name), description: L.displayText(it.description), priceCents: now, originalPriceCents: now < full ? full : null, imageUrl: it.img || null, featured: (it.featured || []).length > 0, options };
    })
  }));
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)) });
};
