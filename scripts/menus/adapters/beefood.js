/* Beefood (menu.beefood.com.br/<loja>): Vue renderizado no navegador; o HTML final tem setores (setor-title) com
   produtos (product-title, product-description, product-price). Opções só abrem no produto: ficam nas notas. */
'use strict';
const L = require('../lib');

const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const text = s => L.cleanText(decode((s || '').replace(/<[^>]+>/g, ' ')));

module.exports = function parse({ html, meta }) {
  const blocks = html.split(/data-setor-index="\d+"/).slice(1);
  if (!blocks.length) throw new Error('setores não encontrados');
  const skipped = {};
  const sections = blocks.map(b => {
    const name = text((/class="layout setor-title[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(b) || [])[1]);
    const items = b.split(/class="product-title"/).slice(1).map(p => {
      const title = text((/^[^>]*>([\s\S]*?)<\/span>/.exec(p) || [])[1]);
      const desc = /class="layout product-description"[^>]*>([\s\S]*?)<\/div>/.exec(p);
      const price = /product-price[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(p);
      const values = price ? (text(price[1]).match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || []).map(L.cents) : [];
      if (!values.length) { L.count(skipped, 'sem preço'); return null; }
      const now = Math.min.apply(null, values), full = Math.max.apply(null, values);
      return { sourceId: L.cleanText(title), name: L.displayName(title), description: L.displayText(desc ? text(desc[1]) : ''), priceCents: now, originalPriceCents: full > now ? full : null, imageUrl: null, options: [] };
    });
    return { name, items };
  });
  return L.snapshot(meta, sections, { skipped, notes: ['Opções e adicionais só aparecem ao abrir cada produto na fonte; não importados.'] });
};
