/* Zap Delivery (zapdelivery.me/<loja>): o cardápio vem no HTML em <script id="storeData" type="application/json"> —
   catalog (categorias com visible/order) → itens (price, price_promo, image) → attributes (grupos com qty [mín, máx]
   e itens com price opcional). Categorias e itens com visible:false estão ocultos na loja e ficam de fora. */
'use strict';
const L = require('../lib');

const byOrder = (a, b) => (a.order || 0) - (b.order || 0);

module.exports = function parse({ html, meta }) {
  const m = /<script id="storeData" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error('storeData não encontrado');
  const d = JSON.parse(m[1]), skipped = {};
  const sections = (d.catalog || []).filter(c => c.visible !== false).sort(byOrder).map(c => ({
    name: L.cleanText(c.name),
    items: (c.itens || []).sort(byOrder).map(it => {
      if (it.visible === false) { L.count(skipped, 'oculto na loja'); return null; }
      if (it.methods && it.methods.length && !it.methods.includes('delivery')) { L.count(skipped, 'fora do delivery'); return null; }
      const full = L.cents(Number(it.price)), promo = L.cents(Number(it.price_promo));
      const now = promo > 0 && promo < full ? promo : full;
      if (!now) { L.count(skipped, 'sem preço'); return null; }
      const options = (it.attributes || []).filter(a => a.visible !== false).map(a => L.optionGroup(a.name, (a.qty || [])[0] || 0, (a.qty || [])[1] || null,
        (a.itens || []).filter(x => x.visible !== false).sort(byOrder).map(x => ({ name: x.name, priceCents: L.cents(Number(x.price)) || 0 })))).filter(Boolean);
      return {
        sourceId: String(it.id), name: L.displayName(L.cleanText(it.name)), description: L.displayText(it.description),
        priceCents: now, originalPriceCents: now < full ? full : null, imageUrl: it.image || null, options
      };
    }).filter(Boolean)
  }));
  return L.snapshot(meta, sections, { skipped });
};
