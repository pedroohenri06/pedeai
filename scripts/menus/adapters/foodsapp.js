/* foodsapp / Alloy (<loja>.foodsapp.com.br): o cardápio vem no HTML em window.__INITIAL_DATA__.catalogo —
   categorias → itens (preço, preço promocional, foto) → categorias_complementos (obrigatório, mínimo, máximo).
   Grupos "maior" (cobra o sabor mais caro, ex.: pizza meio a meio) com preços diferentes ficam nas notas. */
'use strict';
const L = require('../lib');

const on = s => s === 'disponivel';
const vals = x => (Array.isArray(x) ? x : x && typeof x === 'object' ? Object.values(x) : []);

function readData(html) {
  const mark = 'window.__INITIAL_DATA__ = ', i = html.indexOf(mark);
  if (i < 0) return null;
  let depth = 0, inStr = false, esc = false, j = i + mark.length;
  for (; j < html.length; j++) {
    const ch = html[j];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true; else if (ch === '{') depth++; else if (ch === '}' && --depth === 0) break;
  }
  return JSON.parse(html.slice(i + mark.length, j + 1));
}

module.exports = function parse({ html, meta }) {
  const d = readData(html);
  if (!d || !d.catalogo) throw new Error('__INITIAL_DATA__ não encontrado');
  const cat = d.catalogo, skipped = {}, notes = [];
  const featured = new Set(vals(cat.destaques).flatMap(x => x.itens || []));
  const sections = vals(cat.categorias).filter(c => on(c.status)).sort((a, b) => a.ordem - b.ordem).map(c => ({
    name: c.nome,
    items: vals(c.itens).sort((a, b) => a.ordem - b.ordem).map(it => {
      if (!on(it.status)) { L.count(skipped, 'indisponível'); return null; }
      if (it.unidade && it.unidade !== 'u') { L.count(skipped, 'vendido por peso'); return null; }
      const full = L.cents(it.preco), promo = it.status_promocao ? L.cents(it.preco_promocional) : null;
      const now = promo > 0 && promo < full ? promo : full;
      const options = vals(it.categorias_complementos).filter(g => on(g.status)).sort((a, b) => a.ordem - b.ordem).map(g => {
        const choices = vals(g.complementos).filter(o => on(o.status)).sort((a, b) => a.ordem - b.ordem);
        if (g.tipo_calculo && g.tipo_calculo !== 'soma' && (g.qtd_maxima || 0) > 1 && new Set(choices.map(o => o.preco)).size > 1)
          notes.push('"' + L.displayName(it.nome) + '": grupo "' + g.nome + '" cobra pelo ' + g.tipo_calculo + ' na fonte; aqui as opções somam.');
        return L.optionGroup(/^quere$/i.test(g.nome) ? 'Sabores' : g.nome, g.obrigatorio ? Math.max(1, g.qtd_minima || 0) : g.qtd_minima || 0, g.qtd_maxima || null,
          choices.map(o => ({ name: o.nome, priceCents: L.cents(o.preco) || 0 })));
      }).filter(Boolean);
      const item = L.priceFromRequiredGroup({
        sourceId: String(it.id), name: L.displayName(it.nome), description: L.displayText(it.descricao),
        priceCents: now > 0 ? now : 0, originalPriceCents: now > 0 && now < full ? full : null,
        imageUrl: it.foto_principal || null, featured: featured.has(it.id), options
      }, notes);
      if (!item) L.count(skipped, 'sem preço');
      return item;
    })
  }));
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)) });
};
