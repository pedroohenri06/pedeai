/* Goomer (<loja>.goomer.app): a lista vem de www.goomer.app/webmenu/<loja>/menu/<…> — produtos com grupo (seção),
   preços (vários = tamanhos) e fotos; os grupos de opções de cada produto vêm de …/product/<id>/optiongroups/<versão>
   (o coletor pede um por produto). */
'use strict';
const L = require('../lib');

const num = (...v) => v.find(x => x != null && x !== '');

module.exports = function parse({ responses, meta }) {
  const list = (responses.find(r => /\/webmenu\/[^/]+\/menu\//.test(r.url) && r.body && r.body.products) || {}).body;
  if (!list) throw new Error('lista de produtos não encontrada');
  const groupsOf = new Map(responses.filter(r => /\/optiongroups\//.test(r.url)).map(r => [r.url.split('/product/')[1].split('/')[0], r.body.option_groups || []]));
  const skipped = {}, notes = [], sections = [];
  list.products.forEach(p => {
    const sizes = (p.prices || []).map(x => ({ name: x.name || 'Único', priceCents: L.cents(x.price) }));
    const priced = sizes.length > 1 ? L.sizesToItem(sizes) : { priceCents: (sizes[0] || {}).priceCents || 0, originalPriceCents: null, options: [] };
    if (!priced || !priced.priceCents) { L.count(skipped, 'sem preço'); return; }
    const groups = (groupsOf.get(String(p.id)) || []).map(g => L.optionGroup(g.name || g.title,
      num(g.min, g.minimum, g.min_quantity, g.required ? 1 : 0) || 0, num(g.max, g.maximum, g.max_quantity, null),
      (g.options || g.items || []).filter(o => o.available !== false).map(o => ({ name: o.name || o.title, priceCents: L.cents(num(o.price, o.value, 0)) || 0 })))).filter(Boolean);
    let sec = sections.find(s => s.name === p.group_name.trim());
    if (!sec) sections.push(sec = { name: p.group_name.trim(), items: [] });
    sec.items.push({
      sourceId: String(p.id), name: L.displayName(p.name), description: L.displayText(p.description),
      priceCents: priced.priceCents, originalPriceCents: priced.originalPriceCents,
      imageUrl: p.images && (p.images.large || p.images.medium) || null, options: priced.options.concat(groups)
    });
  });
  return L.snapshot(meta, sections, { skipped, notes });
};
