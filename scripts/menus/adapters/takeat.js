/* Takeat (pedido.takeat.app/<loja>): a página busca backend-delivery.takeat.app/public/restaurants/menu/<id> —
   categorias → produtos (delivery_price/price, promoção, foto, esgotado) → complement_categories (minimum, limit,
   optional, single_choice; use_average = pizza meio a meio que cobra a média dos sabores). Grupo de média com
   preço nas opções vira escolha única do sabor (o segundo sabor vai na observação), como nas outras plataformas. */
'use strict';
const L = require('../lib');

const money = (...v) => { const x = v.find(n => n != null && n !== ''); return x == null ? 0 : L.cents(Number(x)); };

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /\/public\/restaurants\/menu\//.test(r.url) && Array.isArray(r.body));
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const skipped = {}, notes = [];
  const sections = hit.body.filter(c => c.available !== false && c.available_in_delivery !== false).sort((a, b) => a.custom_order - b.custom_order).map(c => ({
    name: L.cleanText(c.name),
    items: (c.products || []).slice().sort((a, b) => a.custom_order - b.custom_order).map(p => {
      if (p.available === false || p.available_in_delivery === false || p.sold_off) { L.count(skipped, 'indisponível'); return null; }
      if (p.use_weight) { L.count(skipped, 'vendido por peso'); return null; }
      const full = money(p.delivery_price, p.price), promo = money(p.delivery_price_promotion, p.delivery_price == null ? p.price_promotion : null);
      const now = promo > 0 && promo < full ? promo : full;
      const options = (p.complement_categories || []).filter(g => g.available !== false && g.available_in_delivery !== false).map(g => {
        if (g.use_average || g.more_expensive_only) notes.push('"' + L.displayName(L.cleanText(p.name)) + '": "' + L.cleanText(g.name) + '" cobra ' + (g.use_average ? 'a média' : 'o maior') + ' dos sabores na fonte; aqui é escolha de um sabor e os outros vão na observação.');
        const avg = g.use_average || g.more_expensive_only;
        return L.optionGroup(L.cleanText(g.name), g.optional ? 0 : Math.max(1, g.minimum || 0), avg || g.single_choice ? 1 : g.limit || null,
          (g.complements || []).filter(o => o.available !== false && o.available_in_delivery !== false).map(o => ({ name: L.cleanText(o.name), priceCents: money(o.delivery_price, o.price) })));
      }).filter(Boolean);
      const item = L.priceFromRequiredGroup({
        sourceId: String(p.id), name: L.displayName(L.cleanText(p.name)), description: L.displayText(p.description),
        priceCents: p.has_starting_price ? 0 : now, originalPriceCents: !p.has_starting_price && now < full ? full : null,
        imageUrl: p.image && p.image.url || null, options
      }, notes);
      if (!item) L.count(skipped, 'sem preço');
      return item;
    }).filter(Boolean)
  }));
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)) });
};
