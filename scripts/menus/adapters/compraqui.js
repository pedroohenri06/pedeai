/* CompraQui (<loja>.compraqui.app): a página busca basiliskapi.compraqui.app/api/establishment/<id>/catalog —
   categorias → itens (preço, foto, hasRequiredOptional). O detalhe das escolhas só abre com a loja aberta; item com
   escolha obrigatória ou sem preço fica de fora (contado em skipped) para não aparecer incompleto. */
'use strict';
const L = require('../lib');

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /basiliskapi\.compraqui\.app\/api\/establishment\/.+\/catalog/.test(r.url) && Array.isArray(r.body));
  if (!hit) throw new Error('catálogo não encontrado');
  const skipped = {};
  const sections = hit.body.map(c => ({
    name: L.cleanText(c.name),
    items: (c.items || []).map(it => {
      if (it.hasRequiredOptional) { L.count(skipped, 'escolha obrigatória não coletada'); return null; }
      const price = L.cents(it.price);
      if (!price) { L.count(skipped, 'sem preço'); return null; }
      return { sourceId: it.guid, name: L.displayName(L.cleanText(it.name)), description: L.displayText(it.description), priceCents: price, originalPriceCents: null, imageUrl: it.thumbCoverImage || it.coverImage || null, options: [] };
    }).filter(Boolean)
  }));
  const notes = Object.keys(skipped).length ? ['Itens com escolha obrigatória (acompanhamento, bebida do combo etc.) ficaram de fora: a plataforma só mostra as opções com a loja aberta.'] : [];
  return L.snapshot(meta, sections, { skipped, notes });
};
