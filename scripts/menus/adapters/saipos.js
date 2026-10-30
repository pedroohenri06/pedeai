/* Saipos (<loja>.saipos.com): a página busca /v1/stores/<id>/sales/view-data — itens com variações (tamanhos) e
   grupos de escolha (choices) cujo preço adicional depende da variação escolhida do item. */
'use strict';
const L = require('../lib');

const IMG = p => (p ? 'https://static.saipos.com/' + p : null);
const on = v => v !== 'N';

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /sales\/view-data/.test(r.url) && r.body && r.body.items);
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const b = hit.body, skipped = {};
  const choices = new Map((b.choices || []).map(c => [c.id_store_choice, c]));
  const cats = new Map();
  (b.items || []).forEach(it => {
    const cat = it.category_item || {};
    if (!on(cat.enabled)) { L.count(skipped, 'categoria desativada'); return; }
    if (!cats.has(cat.id_store_category_item)) cats.set(cat.id_store_category_item, { order: cat.order, name: cat.desc_store_category_item, items: [] });
    const vars = (it.variations || []).filter(v => on(v.enabled));
    const sizes = vars.map(v => {
      const promo = (v.promotions || []).map(p => L.cents(p.price)).filter(x => x > 0)[0];
      const full = L.cents(v.price);
      return { name: v.variation && v.variation.desc_store_variation, varId: v.id_store_variation, priceCents: promo && promo < full ? promo : full, originalPriceCents: promo && promo < full ? full : null };
    });
    const priced = L.sizesToItem(sizes);
    if (!priced) { L.count(skipped, 'sem preço'); return; }
    const varId = vars.length === 1 ? vars[0].id_store_variation : null;
    const groups = (it.choices || []).slice().sort((a, c) => a.order - c.order).map(ref => {
      const c = choices.get(ref.id_store_choice);
      if (!c) return null;
      return L.optionGroup(c.desc_store_choice, c.min_choices, c.max_choices, (c.choice_items || []).filter(ci => on(ci.enabled)).map(ci => {
        const v = (ci.variations || []).find(x => varId == null || x.id_store_variation === varId) || {};
        return { name: ci.desc_store_choice_item, priceCents: L.cents(v.aditional_price) || 0 };
      }));
    }).filter(Boolean);
    cats.get(cat.id_store_category_item).items.push({
      sourceId: String(it.id_store_item), name: L.displayName(it.desc_store_item_delivery || it.desc_store_item), description: L.displayText(it.detail),
      priceCents: priced.priceCents, originalPriceCents: priced.originalPriceCents, imageUrl: IMG(it.img_path), options: priced.options.concat(groups)
    });
  });
  const sections = Array.from(cats.values()).sort((a, c) => a.order - c.order);
  return L.snapshot(meta, sections, { skipped });
};
