/* meucardapio.ai / PromoKit (<loja>.meucardapio.ai): a página busca /api/produtos/venda/DELIVERY — categorias,
   produtos (código no começo do nome, ex.: "002.SUPREMA"), tamanhos (pizza P/G/GG) e camposAdicionais
   (escolha-simples / múltipla com opcoesDisponiveis). Opções ligadas a um tamanho (borda P/G/GG) levam o tamanho
   no nome, porque aqui o preço da opção não depende do tamanho escolhido. Fotos em /images/empresa/<arquivo>. */
'use strict';
const L = require('../lib');

const name = s => String(s || '').replace(/^\s*\d+\s*[.\-–)]\s*/, '');

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /\/api\/produtos\/venda\//.test(r.url) && r.body && r.body.data && r.body.data.produtos);
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const { categorias, produtos } = hit.body.data, skipped = {}, notes = [];
  const origin = new URL(meta.finalUrl || meta.url).origin;
  const cats = new Map(categorias.filter(c => c.disponivel !== false).map(c => [c.id, { order: c.posicao, name: c.nome, items: [] }]));
  produtos.slice().sort((a, b) => a.ordem - b.ordem).forEach(p => {
    const sec = cats.get(p.categoria && p.categoria.id);
    if (!sec) { L.count(skipped, 'categoria desativada'); return; }
    if (p.removido || p.disponivelParaDelivery === false || p.ehBrinde || p.brinde) { L.count(skipped, 'fora do delivery'); return; }
    if (p.tipoDeVenda && p.tipoDeVenda !== 'Unidade') { L.count(skipped, 'vendido por peso'); return; }
    const sizes = (p.tamanhos || []).filter(t => t.disponivel !== false).map(t => ({ name: t.descricao + (t.qtdePedacos ? ' (' + t.qtdePedacos + ' pedaços)' : ''), priceCents: L.cents(t.preco) }));
    const priced = sizes.length ? L.sizesToItem(sizes) : { priceCents: L.cents(p.preco) || 0, originalPriceCents: L.cents(p.precoAntigo) > L.cents(p.preco) ? L.cents(p.precoAntigo) : null, options: [] };
    if (!priced) { L.count(skipped, 'sem preço'); return; }
    const groups = (p.camposAdicionais || []).slice().sort((a, b) => a.ordem - b.ordem).map(c => {
      const opts = (c.opcoesDisponiveis || []).filter(o => o.disponivel !== false && o.disponivelParaDelivery !== false);
      const sized = opts.some(o => o.template && o.template.tamanho);
      const simple = /simples/.test(c.tipo);
      return L.optionGroup(c.nome.replace(/:\s*$/, ''), c.obrigatorio ? Math.max(1, c.qtdMinima || 0) : 0, simple ? 1 : c.qtdMaxima || null,
        opts.map(o => ({ name: o.nome + (sized && o.template && o.template.tamanho ? ' (' + o.template.tamanho.descricao + ')' : ''), priceCents: L.cents(o.valor) || 0 })));
    }).filter(Boolean);
    if ((p.camposAdicionais || []).some(c => (c.opcoesDisponiveis || []).some(o => o.template && o.template.tamanho))) notes.push('Opções com preço por tamanho (ex.: bordas P/G/GG) levam o tamanho no nome.');
    if ((p.tamanhos || []).some(t => t.qtdeSabores > 1)) notes.push('Pizzas aceitam mais de um sabor na fonte (cobra a média); aqui cada sabor é um item e os outros sabores vão na observação.');
    const img = (p.imagens || []).slice().sort((a, b) => a.ordem - b.ordem)[0];
    const item = L.priceFromRequiredGroup({
      sourceId: String(p.id), name: L.displayName(name(p.nome)), description: L.displayText(p.descricao),
      priceCents: priced.priceCents, originalPriceCents: priced.originalPriceCents, imageUrl: img ? origin + '/images/empresa/' + img.linkImagem : null,
      options: priced.options.concat(groups)
    }, notes);
    if (!item) { L.count(skipped, 'sem preço'); return; }
    sec.items.push(item);
  });
  const sections = Array.from(cats.values()).sort((a, b) => a.order - b.order);
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)) });
};
