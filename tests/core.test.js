'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../js/core.js');

const store = {
  id: 'pizzaria-teste-barra-do-garcas', name: 'Pizzaria Teste', city: 'Barra do Garças', category: 'Pizza', kind: 'Pizzaria',
  whatsapp: '5566999998888', whatsappSource: 'https://exemplo.com/cardapio', deliveryFeeCents: null,
  menu: [
    { id: 'calabresa', name: 'Calabresa G', priceCents: 5990 },
    { id: 'refri', name: 'Refrigerante 2L', priceCents: 1250 },
    { id: 'centavos', name: 'Item 0,10', priceCents: 10 }
  ]
};

test('formatBRL formata centavos em reais', () => {
  assert.equal(core.formatBRL(0), 'R$ 0,00');
  assert.equal(core.formatBRL(5990), 'R$ 59,90');
  assert.equal(core.formatBRL(123456789), 'R$ 1.234.567,89');
  assert.equal(core.formatBRL(5), 'R$ 0,05');
});

test('toCents aceita número e texto em formato brasileiro', () => {
  assert.equal(core.toCents(59.9), 5990);
  assert.equal(core.toCents(0.1 + 0.2), 30);
  assert.equal(core.toCents('R$ 1.234,56'), 123456);
  assert.equal(core.toCents('12.5'), 1250);
  assert.throws(() => core.toCents('abc,de,'));
});

test('soma do carrinho é exata em centavos', () => {
  let cart = core.emptyCart(store.id);
  for (let i = 0; i < 3; i++) cart = core.addItem(cart, store, 'centavos');
  assert.equal(core.cartTotals(cart, store).subtotal, 30);
  cart = core.addItem(cart, store, 'calabresa', 2);
  cart = core.addItem(cart, store, 'refri');
  const t = core.cartTotals(cart, store, 'entrega');
  assert.equal(t.subtotal, 5990 * 2 + 1250 + 30);
  assert.equal(t.feeKnown, false);
  assert.equal(t.total, t.subtotal);
  assert.equal(core.cartCount(cart), 6);
});

test('taxa de entrega conhecida entra no total; retirada zera taxa', () => {
  const s = Object.assign({}, store, { deliveryFeeCents: 500 });
  const cart = core.addItem(core.emptyCart(s.id), s, 'calabresa');
  assert.deepEqual(core.cartTotals(cart, s, 'entrega'), { subtotal: 5990, fee: 500, feeKnown: true, total: 6490 });
  assert.deepEqual(core.cartTotals(cart, s, 'retirada'), { subtotal: 5990, fee: 0, feeKnown: true, total: 5990 });
});

test('setQty altera, limita e remove itens', () => {
  let cart = core.addItem(core.emptyCart(store.id), store, 'calabresa');
  cart = core.setQty(cart, 'calabresa', 3);
  assert.equal(cart.lines[0].qty, 3);
  cart = core.setQty(cart, 'calabresa', 1000);
  assert.equal(cart.lines[0].qty, core.MAX_QTY);
  cart = core.setQty(cart, 'calabresa', 0);
  assert.equal(cart.lines.length, 0);
});

test('addItem rejeita item inexistente e carrinho de outra loja', () => {
  assert.throws(() => core.addItem(core.emptyCart(store.id), store, 'nao-existe'));
  assert.throws(() => core.addItem(core.emptyCart('outra'), store, 'calabresa'));
});

test('addItem não muta o carrinho original', () => {
  const a = core.addItem(core.emptyCart(store.id), store, 'calabresa');
  const b = core.addItem(a, store, 'calabresa');
  assert.equal(a.lines[0].qty, 1);
  assert.equal(b.lines[0].qty, 2);
});

test('reconcileCart atualiza preços e descarta itens removidos/quantidades inválidas', () => {
  const saved = { storeId: store.id, lines: [
    { itemId: 'calabresa', name: 'x', unitCents: 1, qty: 2 },
    { itemId: 'sumiu', name: 'y', unitCents: 100, qty: 1 },
    { itemId: 'refri', name: 'z', unitCents: 1250, qty: -4 }
  ] };
  const c = core.reconcileCart(saved, store);
  assert.deepEqual(c.lines, [{ key: 'calabresa', itemId: 'calabresa', name: 'Calabresa G', unitCents: 5990, qty: 2, choices: [], note: '' }]);
  assert.deepEqual(core.reconcileCart(null, store), core.emptyCart(store.id));
  assert.deepEqual(core.reconcileCart({ storeId: 'outra', lines: [] }, store), core.emptyCart(store.id));
});

test('mensagem do WhatsApp lista itens, totais e dados do cliente', () => {
  let cart = core.addItem(core.emptyCart(store.id), store, 'calabresa', 2);
  cart = core.addItem(cart, store, 'refri');
  const msg = core.buildOrderMessage(store, cart, { mode: 'entrega', name: 'Ana', address: 'Rua 1, 10', payment: 'Dinheiro', change: 'R$ 150', notes: 'Sem cebola' });
  assert.match(msg, /^Olá, Pizzaria Teste!/);
  assert.match(msg, /2x Calabresa G — R\$ 119,80/);
  assert.match(msg, /1x Refrigerante 2L — R\$ 12,50/);
  assert.match(msg, /Subtotal: R\$ 132,30/);
  assert.match(msg, /Taxa de entrega: a confirmar/);
  assert.match(msg, /Total \(sem taxa de entrega\): R\$ 132,30/);
  assert.match(msg, /Endereço: Rua 1, 10/);
  assert.match(msg, /Pagamento: Dinheiro \(troco para R\$ 150\)/);
  assert.match(msg, /Observações: Sem cebola/);
  const pickup = core.buildOrderMessage(store, cart, { mode: 'retirada', address: 'não deve aparecer' });
  assert.match(pickup, /retirada no local/);
  assert.doesNotMatch(pickup, /Endereço/);
});

test('whatsappUrl usa o número do estabelecimento e codifica o texto', () => {
  const url = core.whatsappUrl(store.whatsapp, 'Olá & tchau\n1x');
  assert.equal(url, 'https://wa.me/5566999998888?text=Ol%C3%A1%20%26%20tchau%0A1x');
  assert.throws(() => core.whatsappUrl('123', 'x'));
});

test('isValidWhatsApp exige DDI 55, DDD e celular com 9 dígitos', () => {
  assert.ok(core.isValidWhatsApp('5566999998888'));
  assert.ok(!core.isValidWhatsApp('556634011234'));
  assert.ok(!core.isValidWhatsApp('66999998888'));
  assert.ok(!core.isValidWhatsApp(null));
});

test('canOrder exige WhatsApp verificado com fonte e cardápio', () => {
  assert.ok(core.canOrder(store));
  assert.ok(!core.canOrder(Object.assign({}, store, { whatsappSource: null })));
  assert.ok(!core.canOrder(Object.assign({}, store, { menu: [] })));
  assert.ok(!core.canOrder(Object.assign({}, store, { whatsapp: null })));
});

test('filterStores combina cidade, categoria e busca sem acento', () => {
  const list = [
    store,
    { id: 'a', name: 'Açaí do Rio', city: 'Água Boa', category: 'Açaí', kind: 'Açaiteria', menu: [] },
    { id: 'b', name: 'Lanche Bom', city: 'Barra do Garças', category: 'Hambúrguer', kind: 'Lanchonete', menu: [{ name: 'X-Calabresa' }] }
  ];
  assert.deepEqual(core.filterStores(list, { city: 'Barra do Garças' }).map(s => s.id), [store.id, 'b']);
  assert.deepEqual(core.filterStores(list, { city: 'Barra do Garças', category: 'Pizza' }).map(s => s.id), [store.id]);
  assert.deepEqual(core.filterStores(list, { category: 'Todos', query: 'acai' }).map(s => s.id), ['a']);
  assert.deepEqual(core.filterStores(list, { city: 'Barra do Garças', query: 'CALABRESA' }).map(s => s.id), [store.id, 'b']);
});

test('parseRoute reconhece páginas de loja', () => {
  assert.deepEqual(core.parseRoute('#/loja/pizzaria-x'), { name: 'store', id: 'pizzaria-x' });
  assert.deepEqual(core.parseRoute('#parceiros'), { name: 'home' });
  assert.deepEqual(core.parseRoute(''), { name: 'home' });
  assert.deepEqual(core.parseRoute('#/loja/<script>'), { name: 'home' });
});

test('escapeHtml neutraliza HTML', () => {
  assert.equal(core.escapeHtml('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
});

test('cidades e categorias originais preservadas', () => {
  assert.equal(core.CITIES.length, 10);
  assert.deepEqual(core.CATEGORIES, ['Hambúrguer', 'Pizza', 'Sushi', 'Açaí', 'Brasileira', 'Pastel', 'Churrasco', 'Doces', 'Saudável', 'Café']);
});

const pizza = {
  id: 'loja-opcoes', name: 'Loja Opções', whatsapp: '5566999998888', whatsappSource: 'https://x.com', deliveryFeeCents: null,
  menu: [{
    id: 'pizza', name: 'Pizza', priceCents: 4000,
    options: [
      { id: 'tamanho', name: 'Tamanho', min: 1, max: 1, choices: [{ id: 'm', name: 'Média', priceCents: 0 }, { id: 'g', name: 'Grande', priceCents: 1500 }] },
      { id: 'extra', name: 'Adicionais', min: 0, max: 2, choices: [{ id: 'bacon', name: 'Bacon', priceCents: 500 }, { id: 'borda', name: 'Borda', priceCents: 800 }, { id: 'milho', name: 'Milho', priceCents: 300 }] }
    ]
  }]
};

test('opções obrigatórias e limites são validados', () => {
  const item = pizza.menu[0];
  assert.match(core.validateSelection(item, {}).join(), /Escolha uma opção em Tamanho/);
  assert.match(core.validateSelection(item, { choices: { tamanho: ['g'], extra: ['bacon', 'borda', 'milho'] } }).join(), /no máximo 2/);
  assert.match(core.validateSelection(item, { choices: { tamanho: ['xx'] } }).join(), /opção inválida/);
  assert.deepEqual(core.validateSelection(item, { choices: { tamanho: ['m'] } }), []);
  assert.throws(() => core.addItem(core.emptyCart(pizza.id), pizza, 'pizza', 1, {}), /Tamanho/);
});

test('preço soma acréscimos e combinações diferentes viram linhas separadas', () => {
  let cart = core.emptyCart(pizza.id);
  cart = core.addItem(cart, pizza, 'pizza', 1, { choices: { tamanho: ['g'], extra: ['bacon', 'borda'] } });
  cart = core.addItem(cart, pizza, 'pizza', 2, { choices: { tamanho: ['m'] }, note: 'sem cebola' });
  cart = core.addItem(cart, pizza, 'pizza', 1, { choices: { extra: ['borda', 'bacon'], tamanho: ['g'] } });
  assert.equal(cart.lines.length, 2);
  assert.equal(cart.lines[0].unitCents, 4000 + 1500 + 500 + 800);
  assert.equal(cart.lines[0].qty, 2);
  assert.equal(cart.lines[1].unitCents, 4000);
  assert.equal(core.itemQty(cart, 'pizza'), 4);
  assert.equal(core.cartTotals(cart, pizza).subtotal, 6800 * 2 + 4000 * 2);
  cart = core.setQty(cart, cart.lines[1].key, 0);
  assert.equal(cart.lines.length, 1);
});

test('mensagem do WhatsApp inclui opções e observação de cada item', () => {
  const cart = core.addItem(core.emptyCart(pizza.id), pizza, 'pizza', 1, { choices: { tamanho: ['g'], extra: ['bacon'] }, note: 'bem assada' });
  const msg = core.buildOrderMessage(pizza, cart, { mode: 'retirada', name: 'Ana' });
  assert.match(msg, /1x Pizza — R\$ 60,00/);
  assert.match(msg, /• Tamanho: Grande \(\+R\$ 15,00\)/);
  assert.match(msg, /• Adicionais: Bacon \(\+R\$ 5,00\)/);
  assert.match(msg, /Obs\.: bem assada/);
  assert.match(msg, /Total: R\$ 60,00/);
});

test('reconcileCart preserva opções e descarta opção que deixou de existir', () => {
  const cart = core.addItem(core.emptyCart(pizza.id), pizza, 'pizza', 1, { choices: { tamanho: ['g'], extra: ['milho'] } });
  assert.deepEqual(core.reconcileCart(JSON.parse(JSON.stringify(cart)), pizza), cart);
  const changed = JSON.parse(JSON.stringify(pizza));
  changed.menu[0].options[1].choices.pop();
  assert.equal(core.reconcileCart(cart, changed).lines.length, 0);
  const pricier = JSON.parse(JSON.stringify(pizza));
  pricier.menu[0].priceCents = 4500;
  assert.equal(core.reconcileCart(cart, pricier).lines[0].unitCents, 4500 + 1500 + 300);
});
