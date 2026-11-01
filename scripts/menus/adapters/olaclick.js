/* OlaClick (<loja>.ola.click): categorias e produtos vêm no __NUXT_DATA__ do HTML (pinia.productsCategories);
   variações (tamanhos) em product_variants; os grupos de modificadores de cada produto vêm do detalhe
   api.olaclick.app/…/products/<slug> (o coletor pede um por produto). Grupo só é obrigatório com required:true
   (min_modifiers sem required é só sugestão da plataforma). Itens e opções indisponíveis ficam de fora. */
'use strict';
const L = require('../lib');
const nuxt = require('../nuxt');

const ok = x => x && x.visible !== false && x.availability_status !== 'SOLD_OUT' && x.manual_available !== false;

module.exports = function parse({ html, responses, meta }) {
  const d = nuxt.fromHtml(html);
  const cats = d && d.pinia && d.pinia.productsCategories && d.pinia.productsCategories.originalProductsCategories;
  if (!cats) throw new Error('categorias não encontradas');
  const detail = new Map(responses.filter(r => /ms-products\/public\/companies\/.+\/products\//.test(r.url) && r.body && r.body.data).map(r => [r.body.data.id, r.body.data]));
  const skipped = {}, notes = [];
  const sections = cats.filter(c => c.visible !== false).sort((a, b) => a.position - b.position).map(c => ({
    name: L.cleanText(c.name),
    items: (c.products || []).slice().sort((a, b) => a.position - b.position).map(p0 => {
      if (p0.visible === false) { L.count(skipped, 'oculto na loja'); return null; }
      const p = detail.get(p0.id) || p0;
      const vars = (p.product_variants || []).filter(ok);
      if (!vars.length) { L.count(skipped, 'indisponível'); return null; }
      const sizes = vars.map(v => ({ name: v.name || 'Único', priceCents: L.cents(v.price), originalPriceCents: L.cents(v.original_price) > L.cents(v.price) ? L.cents(v.original_price) : null }));
      const priced = L.sizesToItem(sizes);
      if (!priced) { L.count(skipped, 'sem preço'); return null; }
      if (p0.modifier_categories_count && !detail.has(p0.id)) notes.push('"' + L.displayName(L.cleanText(p0.name)) + '": opções não coletadas.');
      const groups = (p.modifier_categories || []).filter(g => g.is_active !== false).sort((a, b) => (a.product_modifier_category_position || 0) - (b.product_modifier_category_position || 0))
        .map(g => L.optionGroup(L.cleanText(g.name), g.required ? Math.max(1, g.min_modifiers || 0) : 0, g.type === 'one' ? 1 : g.max_modifiers || null,
          (g.modifiers || []).filter(ok).sort((a, b) => a.position - b.position).map(o => ({ name: L.cleanText(o.name), priceCents: L.cents(o.price) || 0 })))).filter(Boolean);
      const img = (p.images || []).slice().sort((a, b) => a.position - b.position)[0];
      return {
        sourceId: String(p0.id), name: L.displayName(L.cleanText(p0.name).replace(/\s*-\s*$/, '')), description: L.displayText(p.description),
        priceCents: priced.priceCents, originalPriceCents: priced.originalPriceCents, imageUrl: img ? img.image_url : null,
        options: priced.options.concat(groups)
      };
    }).filter(Boolean)
  }));
  const co = d.pinia.company && d.pinia.company.company;
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)), address: co && co.address, whatsapp: co && co.whatsapp });
};
