/* BigD (<loja>.bigd.im): a página busca /services/api/public/produto/loja — categorias com produtos, preço em reais,
   desconto e categorias de adicionais (obrigatorio, minimo, maximo). */
'use strict';
const L = require('../lib');

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /public\/produto\/loja/.test(r.url) && r.body && Array.isArray(r.body.results));
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const skipped = {}, notes = [];
  const sections = hit.body.results.map(c => ({
    name: c.nome,
    items: (c.produtoList || []).map(p => {
      if (p.produtoEsgotado) { L.count(skipped, 'esgotado'); return null; }
      const now = L.cents(p.valor), full = p.descontoAplicado ? L.cents(p.valorSemDesconto) : null;
      const options = (p.categoriaAdicionalList || []).map(g => {
        if (g.valeMaiorPreco) notes.push('"' + L.displayName(p.nome) + '": grupo "' + g.nome + '" cobra o maior preço na fonte; aqui as opções somam.');
        return L.optionGroup(g.nome, g.obrigatorio ? Math.max(1, g.minimo || 0) : g.minimo || 0, g.maximo, (g.adicionalList || []).map(a => ({ name: a.nome, priceCents: L.cents(a.valor) || 0 })));
      }).filter(Boolean);
      const item = L.priceFromRequiredGroup({ sourceId: String(p.id), name: L.displayName(p.nome), description: L.displayText(p.descricao), priceCents: now || 0, originalPriceCents: full > now ? full : null, imageUrl: p.urlImagem || null, options }, notes);
      if (!item) L.count(skipped, 'sem preço');
      return item;
    })
  }));
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)) });
};
