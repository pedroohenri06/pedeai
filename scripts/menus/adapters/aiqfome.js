/* aiqfome: a página da loja traz o cardápio completo em `const restaurantenovo = {...}`.
   Categoria → tamanhos (com adicionais e grupos obrigatórios) → itens com preço por tamanho e preço promocional.
   Fotos: o host `devimagens` não é público para todos os clientes; `files.aiqfome.com` serve o mesmo arquivo. */
'use strict';
const L = require('../lib');

const vals = x => (Array.isArray(x) ? x : x && typeof x === 'object' ? Object.values(x) : []);

function readStore(html) {
  const mark = 'const restaurantenovo = ';
  const i = html.indexOf(mark);
  if (i < 0) return null;
  // raw decode: o objeto termina onde o JSON fecha, antes do resto do script.
  let depth = 0, inStr = false, esc = false, j = i + mark.length;
  for (; j < html.length; j++) {
    const ch = html[j];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) break;
  }
  return JSON.parse(html.slice(i + mark.length, j + 1));
}

function groupsOf(list) {
  return vals(list).map(g => L.optionGroup(g.nome, g.limite_minimo_obrigatorio, g.limite_obrigatorio,
    vals(g.obrigatorios).filter(o => !o.bloqueado).map(o => ({ name: o.nome, priceCents: L.cents(o.valor) || 0 })))).filter(Boolean);
}

function extrasOf(size) {
  const list = vals(size.itens_adicionais).filter(a => !a.bloqueado);
  return list.length ? L.optionGroup('Adicionais', 0, size.limite_adicional || list.length, list.map(a => ({ name: a.nome, priceCents: L.cents(a.valor) || 0 }))) : null;
}

function hoursOf(store) {
  const h = vals(store.horarios).filter(d => d.horario && !/fechado/i.test(d.horario));
  return h.length ? h.map(d => d.dia.slice(0, 3) + ' ' + d.horario.replace(/\s*-\s*/g, '–')).join(' · ') : null;
}

module.exports = function parse({ html, meta }) {
  const store = readStore(html);
  if (!store) throw new Error('bloco restaurantenovo não encontrado');
  const skipped = {}, notes = [];
  const imgBase = 'https://files.aiqfome.com/itens/' + store.item_dir + '/';
  const cats = vals(store.menu && store.menu.cardapios_categorias).filter(c => c.status === 1 && !c.excluido).sort((a, b) => a.ordem - b.ordem);
  let multiFlavor = false;
  const sections = cats.map(cat => {
    const sizes = vals(cat.tamanhos).filter(t => t.status === 1 && !t.excluido);
    const items = vals(cat.itens).filter(it => !it.excluido).sort((a, b) => a.ordem - b.ordem).map(it => {
      if (it.status !== 1) { L.count(skipped, 'indisponível'); return null; }
      const prices = vals(it.itens_tamanhos).filter(p => p.status === 1 && !p.excluido).map(p => {
        const full = L.cents(p.valor), promo = L.cents(p.valor_promocional);
        const onSale = promo > 0 && full > promo;
        const size = sizes.find(t => t.id === p.tamanho_id) || p.tamanho || {};
        if ((size.quantidade_sabores || 1) > 1) multiFlavor = true;
        return { sizeId: p.tamanho_id, name: size.nome || '', priceCents: onSale ? promo : full, originalPriceCents: onSale ? full : null };
      });
      const priced = L.sizesToItem(prices);
      if (!priced) { L.count(skipped, 'sem preço'); return null; }
      const options = priced.options.slice();
      const usedSizes = sizes.filter(t => prices.some(p => p.sizeId === t.id));
      options.push.apply(options, groupsOf(it.obrigatorios_grupos));
      usedSizes.forEach(t => options.push.apply(options, groupsOf(t.obrigatorios_grupos)));
      // Adicionais: só entram quando são os mesmos em todos os tamanhos do item (senão o preço dependeria do tamanho).
      const extras = usedSizes.map(extrasOf);
      const sig = extras.map(g => JSON.stringify(g));
      if (extras[0] && sig.every(s => s === sig[0])) options.push(extras[0]);
      else if (extras.some(Boolean)) notes.push('Adicionais variam por tamanho em "' + L.displayName(it.nome) + '": não importados.');
      return {
        sourceId: String(it.id), name: L.displayName(it.nome), description: L.displayText(it.descricao),
        priceCents: priced.priceCents, originalPriceCents: priced.originalPriceCents,
        imageUrl: it.imagem && !it.imagem_oculta ? imgBase + it.imagem : null, options
      };
    });
    return { name: cat.nome, items };
  });
  if (multiFlavor) notes.push('Pizzas aceitam mais de um sabor na fonte; aqui cada sabor é um item, e a combinação vai na observação.');
  return L.snapshot(meta, sections, { hours: hoursOf(store), skipped, notes: Array.from(new Set(notes)) });
};
