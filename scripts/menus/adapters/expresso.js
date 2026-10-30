/* Expresso Delivery (sites próprios, ex.: pizzariacoqueiros.com): o cardápio vem em variáveis JS da página —
   sessoes_itens, categorias_itens, sabores_itens (preço por tamanho, promoção e ingredientes). Pizzas com mais de um
   sabor por tamanho ficam nas notas: cada sabor é um item com os tamanhos como escolha. */
'use strict';
const L = require('../lib');

function jsVar(html, name) {
  const m = new RegExp('var ' + name + '\\s*=\\s*').exec(html);
  if (!m) return null;
  const s = html.slice(m.index + m[0].length);
  let depth = 0, inStr = false, esc = false, j = 0;
  for (; j < s.length; j++) {
    const c = s[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '[' || c === '{') depth++;
    else if ((c === ']' || c === '}') && --depth === 0) break;
  }
  return JSON.parse(s.slice(0, j + 1));
}

module.exports = function parse({ html, meta }) {
  const sabores = jsVar(html, 'sabores_itens'), cats = jsVar(html, 'categorias_itens') || [], sessions = jsVar(html, 'sessoes_itens') || [];
  if (!sabores) throw new Error('sabores_itens não encontrado');
  const sizes = jsVar(html, 'tamahos_itens') || [], skipped = {}, notes = [];
  if (sizes.some(t => Number(t.tamanho_qtdsabormaxima) > 1)) notes.push('Pizzas aceitam mais de um sabor na fonte; aqui cada sabor é um item, e a combinação vai na observação.');
  const order = sessions.map(s => s.sessao_id);
  const sections = cats.slice().sort((a, b) => order.indexOf(a.categoria_sessaoid) - order.indexOf(b.categoria_sessaoid)).map(c => ({
    // Sessão com uma categoria: o nome da sessão ("Lanches"); pizzas: "Pizzas salgadas"; demais: a categoria ("Cerveja").
    name: cats.filter(x => x.categoria_sessaoid === c.categoria_sessaoid).length === 1 ? c.categoria_sessaonome
      : /pizza/i.test(c.categoria_sessaonome) ? c.categoria_sessaonome + ' ' + c.categoria_nome.toLowerCase() : c.categoria_nome,
    items: sabores.filter(s => s.sabor_categoriaid === c.categoria_id).map(s => {
      if (s.sabor_dispcardapio !== 'S') { L.count(skipped, 'fora do cardápio'); return null; }
      const list = (s.sabor_precostamanhos || []).map(p => {
        const full = L.cents(p.sabor_precotamanhos_preco), promo = L.cents(p.sabor_precotamanhos_precopromo);
        return { name: p.sabor_precotamanhos_nometamanho, priceCents: promo > 0 && promo < full ? promo : full, originalPriceCents: promo > 0 && promo < full ? full : null };
      });
      if (!list.length) list.push({ name: '', priceCents: L.cents(s.sabor_precopromocao) > 0 ? L.cents(s.sabor_precopromocao) : L.cents(s.sabor_preco), originalPriceCents: null });
      const priced = L.sizesToItem(list);
      if (!priced) { L.count(skipped, 'sem preço'); return null; }
      const name = String(s.sabor_nome).replace(/^\d+\s*-\s*/, '');
      const ingredients = (s.sabor_ingredientes || []).map(i => i.sabor_ingrediente_nomeingrediente).join(', ');
      return {
        sourceId: s.sabor_id, name: L.displayName(name), description: L.displayText(s.sabor_descricao || ingredients),
        priceCents: priced.priceCents, originalPriceCents: priced.originalPriceCents,
        imageUrl: s.sabor_fotoid && s.sabor_fotonome ? 'https://static.expressodelivery.com.br/imagens/produtos/' + s.sabor_fotoid + '/600/' + s.sabor_fotonome : null,
        options: priced.options
      };
    })
  }));
  return L.snapshot(meta, sections, { skipped, notes });
};
