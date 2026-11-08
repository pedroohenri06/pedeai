/* Mais Delivery (maisdeliveryapp.com.br): a PWA busca o cardápio em operacao_oapi.php.
   Categorias (com subcategorias) → produtos com níveis (grupos de escolha), sabores e adicionais. */
'use strict';
const L = require('../lib');

const IMG = 'https://maisdeliveryfranquia.com.br/api/';
const on = x => x == null || String(x) === '1';

function hoursOf(r) {
  const h = (r.arrHorarios || []).filter(d => (d.horarios || []).some(x => !/fechado/i.test(x)));
  return h.length ? h.map(d => d.dia.slice(0, 3) + ' ' + d.horarios.join(', ').replace(/ às /g, '–')).join(' · ') : null;
}

/* Produto com preço zero e valor na escolha obrigatória (ex.: bola de sorvete por sabor, açaí por tamanho): o menor
   valor da escolha vira o preço base (L.priceFromRequiredGroup). */
function product(p, notes) {
  const base = L.cents(p.vlItem) || 0;
  const options = [];
  (p.niveis || []).slice().sort((a, b) => a.nrOrdem - b.nrOrdem).forEach(n => {
    const g = L.optionGroup(n.dsTitulo, Number(n.qtMinOpcao), Number(n.qtMaxOpcao),
      (n.opcoesNivel || []).filter(o => on(o.flgAtivo)).map(o => ({ name: o.dsNome, priceCents: L.cents(o.vlItem) || 0 })));
    if (g) options.push(g);
  });
  const flavors = Number(p.qtSabores) || 0;
  if (flavors > 0 && (p.sabores || []).length) {
    const g = L.optionGroup(flavors > 1 ? 'Sabores' : 'Sabor', 1, flavors,
      p.sabores.filter(s => on(s.flgAtivo)).map(s => ({ name: s.dsSabor, priceCents: Math.max(0, (L.cents(s.vlSabor) || base) - base) })));
    if (g) options.push(g);
  }
  if ((p.adicionais || []).length) {
    const max = Number(p.qtAdicionais) || p.adicionais.length;
    const g = L.optionGroup('Adicionais', 0, max, p.adicionais.filter(a => on(a.flgAtivo)).map(a => ({ name: a.dsNome, priceCents: L.cents(a.vlAdicional) || 0 })));
    if (g) options.push(g);
  }
  const img = p.dsImgPro || p.dsImagem;
  return L.priceFromRequiredGroup({ sourceId: String(p.idCardapio), name: L.displayName(p.dsNome), description: L.displayText(p.dsDescricao), priceCents: base, originalPriceCents: null, imageUrl: img ? IMG + img : null, options }, notes);
}

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /operacao_oapi/.test(r.url) && r.body && r.body.cardapio);
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const b = hit.body, skipped = {}, sections = [], notes = [];
  const keep = p => { const it = product(p, notes); if (!it) L.count(skipped, 'sem preço'); return it; };
  (b.cardapio.categorias || []).slice().sort((a, c) => a.nrOrdem - c.nrOrdem).forEach(c => {
    if ((c.produtos || []).length) sections.push({ name: c.dsCategoria, items: c.produtos.map(keep) });
    (c.subcategorias || []).forEach(s => sections.push({ name: s.dsSubCategoria, items: (s.produtos || []).map(keep) }));
  });
  const r = b.restaurante || {};
  return L.snapshot(meta, sections, { hours: hoursOf(r), ops: L.ops(r.nrTempoMin, r.nrTempoMax, r.vlMinimo), skipped, notes });
};
