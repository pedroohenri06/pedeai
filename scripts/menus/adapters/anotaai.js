/* Anota AI (pedido.anota.ai/loja/<loja>): a página busca api.anota.ai/clientauth/nm-category/menu-merchant —
   menu.menu (categorias → itens com preço, foto, out) e menu.menu_aux (grupos de escolha); cada item aponta para
   os grupos em next_steps (category, min, max, price_model: 0 soma, 1 média, 2 maior). Pizza tem preço 0 e o valor
   no grupo de sabor: o menor sabor vira o preço base. Sabor que cobra média/maior com mais de uma escolha vira
   escolha de um sabor (os outros vão na observação). Itens e opções esgotados (out) ficam de fora. */
'use strict';
const L = require('../lib');

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /nm-category\/menu-merchant/.test(r.url) && r.body && r.body.data && r.body.data.menu);
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const { menu, establishment } = hit.body.data;
  const aux = new Map((menu.menu_aux || []).map(a => [a.category_id, a]));
  const skipped = {}, notes = [];
  const sections = (menu.menu || []).filter(c => !c.only_pdv && !c.only_qrcode).sort((a, b) => a.order - b.order).map(c => ({
    name: L.cleanText(c.title),
    items: (c.itens || []).slice().sort((a, b) => a.order - b.order).map(it => {
      if (it.out) { L.count(skipped, 'esgotado'); return null; }
      if (it.is_weighable) { L.count(skipped, 'vendido por peso'); return null; }
      const isPizza = c.category_type === 'pizza';
      const t = L.displayName(L.cleanText(it.title));
      const name = isPizza && !/pizza/i.test(t) ? 'Pizza ' + t.charAt(0).toLowerCase() + t.slice(1) : t;
      const options = (it.next_steps || []).map(s => {
        const a = aux.get(s.category);
        if (!a) return null;
        const avg = s.price_model && s.price_model !== 0;
        if (avg && s.max > 1) notes.push('"' + name + '": "' + L.cleanText(a.title) + '" cobra ' + (s.price_model === 1 ? 'a média' : 'o maior') + ' dos sabores na fonte; aqui é escolha de um sabor e os outros vão na observação.');
        return L.optionGroup(L.cleanText(a.title), s.min || 0, avg ? 1 : s.max > 0 ? s.max : null,
          (a.itens || []).filter(o => !o.out).sort((x, y) => x.order - y.order).map(o => ({ name: L.cleanText(o.title).replace(/^\d+\s*[-.)]\s*/, ''), priceCents: L.cents(o.price) || 0 })));
      }).filter(Boolean);
      const price = L.cents(it.price) || 0, base = L.cents(it.price_base) || 0;
      const item = L.priceFromRequiredGroup({
        sourceId: String(it.item_id || it._id), name, description: L.displayText(it.description),
        priceCents: price, originalPriceCents: it.is_promotion && base > price ? base : null,
        imageUrl: it.image || null, options
      }, notes);
      if (!item) L.count(skipped, 'sem preço');
      return item;
    }).filter(Boolean)
  }));
  const unit = establishment && establishment.units && establishment.units[0];
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)), city: unit && unit.address && unit.address.city, phones: unit && (unit.phones || []).map(p => p.number) });
};
