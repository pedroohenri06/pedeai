/* Pedir Delivery / Multipedidos (pedir.delivery/<loja>): o cardápio vem embutido no HTML em {"cardapio:<loja>": ...}.
   Seções genéricas com produtos (preço, preço antigo) e grupos de extras (required, qtyMin, qtyMax). Produtos
   vendidos por peso (preço por kg) ficam de fora: o valor final depende da balança. Fotos: só miniaturas de 200 px. */
'use strict';
const L = require('../lib');

const IMG = h => 'https://imagens.multipedidos.com.br/v/1280/products/' + h + '/thumb_' + h + '.webp';
const DAYS = [['monday', 'Seg'], ['tuesday', 'Ter'], ['wednesday', 'Qua'], ['thursday', 'Qui'], ['friday', 'Sex'], ['saturday', 'Sáb'], ['sunday', 'Dom']];

function readMenu(html) {
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m[1].startsWith('{"cardapio:')) {
      const data = JSON.parse(m[1]);
      const key = Object.keys(data).find(k => k.startsWith('cardapio:'));
      return data[key].cardapio;
    }
  }
  return null;
}

function hoursOf(menu) {
  const t = (menu.hoursTemplates || []).find(x => x.available && x.indicatesRestaurantOperation) || (menu.hoursTemplates || [])[0];
  if (!t || !t.hours) return null;
  const out = DAYS.map(([k, d]) => {
    const r = (t.hours[k] || []).filter(x => !x.isClosed);
    return r.length ? d + ' ' + r.map(x => x.firstTime.slice(0, 5) + '–' + x.secondTime.slice(0, 5)).join(', ') : null;
  }).filter(Boolean);
  return out.length ? out.join(' · ') : null;
}

module.exports = function parse({ html, meta }) {
  const c = readMenu(html);
  if (!c) throw new Error('cardápio embutido não encontrado');
  const menu = c.menu, skipped = {}, notes = [];
  const extras = new Map((menu.extras || []).map(e => [e.id, e]));
  const order = (menu.sections || []).filter(s => s.type === 'generic').map(s => s.id);
  const cats = (menu.general || []).filter(g => g.available && !g.unavailable)
    .sort((a, b) => (order.indexOf(a.id) + 1 || 999) - (order.indexOf(b.id) + 1 || 999));
  const sections = cats.map(g => ({
    name: g.name,
    items: (g.products || []).map(p => {
      if (!p.available || p.unavailable) { L.count(skipped, 'indisponível'); return null; }
      if (p.totalCalcType === 'WEIGHT') { L.count(skipped, 'vendido por peso'); notes.push('"' + L.displayName(p.name) + '" é vendido por quilo e não entrou.'); return null; }
      const options = (p.extras || []).map(id => extras.get(id)).filter(Boolean).map(e => {
        const max = e.qtyMax || e.qty_max;
        return L.optionGroup(e.name, e.required ? Math.max(1, e.qtyMin || 0) : e.qtyMin || 0, max, (e.options || []).filter(o => o.available !== 0 && !o.asTitle).map(o => ({ name: o.name, priceCents: L.cents(o.price) || 0 })));
      }).filter(Boolean);
      const now = L.cents(p.price), old = L.cents(p.oldPrice);
      const item = L.priceFromRequiredGroup({
        sourceId: String(p.id), name: L.displayName(p.name), description: L.displayText(p.description && p.description.replace(/^"|"$/g, '')),
        priceCents: now || 0, originalPriceCents: old > now && now > 0 ? old : null, imageUrl: p.image ? IMG(p.image) : null, featured: p.featured === 1, options
      }, notes);
      if (!item) L.count(skipped, 'sem preço');
      return item;
    })
  }));
  return L.snapshot(meta, sections, { hours: hoursOf(menu), skipped, notes: Array.from(new Set(notes)) });
};
