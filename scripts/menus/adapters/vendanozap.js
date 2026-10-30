/* Vende no Zap (vendanozap.app): a página busca /api/catalog/<loja> — produtos com categoria, preço em reais,
   promoção e grupos de opções (required, maxSelections, selectionType). */
'use strict';
const L = require('../lib');

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function hoursOf(h) {
  if (!h) return null;
  const out = DAYS.map((d, i) => { const x = h[i] || h[String(i)]; return x && x.enabled && (x.ranges || []).length ? d + ' ' + x.ranges.map(r => r.start + '–' + r.end).join(', ') : null; }).filter(Boolean);
  return out.length ? out.join(' · ') : null;
}

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /api\/catalog\//.test(r.url) && r.body && r.body.products);
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const b = hit.body, skipped = {}, notes = [];
  const cats = (b.categories || []).slice().sort((a, c) => a.sortOrder - c.sortOrder).map(c => ({ id: c.id, name: c.name, items: [] }));
  const byId = new Map(cats.map(c => [c.id, c]));
  const best = new Set((b.bestSellers || []).map(x => (x && (x.productId || x.id)) || x));
  (b.products || []).slice().sort((a, c) => a.sortOrder - c.sortOrder).forEach(p => {
    if (p.status !== 'ativo') { L.count(skipped, 'indisponível'); return; }
    const full = L.cents(p.price);
    const promo = p.promotion && L.cents(p.promotion.price || p.promotion.promotionalPrice);
    const now = promo > 0 && promo < full ? promo : full;
    if (!(now > 0)) { L.count(skipped, 'sem preço'); return; }
    const options = (p.optionGroups || []).map(g => {
      if (g.priceMode && g.priceMode !== 'sum') notes.push('"' + L.displayName(p.name) + '": grupo "' + g.name + '" com cobrança ' + g.priceMode + ' na fonte; aqui as opções somam.');
      const single = g.selectionType === 'single';
      return L.optionGroup(g.name, g.required ? 1 : 0, single ? 1 : g.maxSelections, (g.options || []).map(o => ({ name: o.name, priceCents: L.cents(o.price) || 0 })));
    }).filter(Boolean);
    const cat = byId.get(p.categoryId);
    if (!cat) { L.count(skipped, 'sem categoria'); return; }
    cat.items.push({ sourceId: p.id, name: L.displayName(p.name), description: L.displayText(p.description), priceCents: now, originalPriceCents: now < full ? full : null, imageUrl: p.imageUrl || null, featured: best.has(p.id), options });
  });
  return L.snapshot(meta, cats, { hours: hoursOf(b.store && b.store.businessHours), skipped, notes: Array.from(new Set(notes)) });
};
