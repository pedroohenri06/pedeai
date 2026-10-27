'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../js/store-view.js');
const FIX = require('./fixtures/stores.json').establishments;

const full = FIX[0], noZap = FIX[1], noMenu = FIX[2];

test('todo texto do cadastro é escapado nos templates', () => {
  const evil = Object.assign({}, noMenu, { name: '<img src=x onerror=alert(1)>', kind: '"><script>x</script>', address: '<b>Rua</b>', hours: '<i>18h às 23h</i>' });
  const html = V.pageHtml(evil);
  assert.doesNotMatch(html, /<img src=x|<script>x|<b>Rua|<i>18h/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('jsonLd é JSON válido de Restaurant e não fecha a tag script', () => {
  const s = Object.assign({}, full, { name: 'A </script><script>alert(1)</script>' });
  const raw = V.jsonLd(s, 'https://www.pedeaionline.com.br/');
  assert.doesNotMatch(raw, /<\/script>/i);
  const data = JSON.parse(raw);
  assert.equal(data['@type'], 'Restaurant');
  assert.equal(data.address.addressLocality, 'Barra do Garças');
  assert.equal(data.url, 'https://www.pedeaionline.com.br/#/loja/' + s.id);
  assert.equal(data.image, 'https://www.pedeaionline.com.br/assets/restaurant-24d02d921c16.webp');
  assert.equal(data.telephone, '+5566999990000');
});

test('capa: foto com miniatura de base; sem foto, degradê da marca', () => {
  const withThumb = Object.assign({}, full, { image: Object.assign({}, full.image, { thumb: 'assets/x-card.webp' }) });
  assert.match(V.coverHtml(withThumb), /sp-cover--photo[^>]*background-image:url\('assets\/x-card\.webp'\)/);
  assert.match(V.coverHtml(noMenu), /sp-cover--brand/);
  assert.doesNotMatch(V.coverHtml(noMenu), /<img class="sp-cover-img"/);
  const logo = Object.assign({}, full, { image: Object.assign({}, full.image, { kind: 'logo' }) });
  assert.match(V.coverHtml(logo), /sp-cover--brand/, 'logotipo não vira foto de capa');
  assert.match(V.coverHtml(logo), /sp-tile--logo/, 'logotipo vira o selo da loja');
});

test('indicadores refletem os dados reais, sem inventar', () => {
  assert.match(V.infoHtml(full), /<dd>Online<\/dd>/);
  assert.match(V.infoHtml(full), /<dd>14 itens<\/dd>/);
  assert.match(V.infoHtml(full), /<dd>18h–23h<\/dd>/);
  assert.match(V.infoHtml(noMenu), /<dd>WhatsApp<\/dd>/);
  assert.match(V.infoHtml(noMenu), /<dd>A confirmar<\/dd>/);
  const none = Object.assign({}, noZap, { menu: [], phone: null });
  assert.match(V.infoHtml(none), /<dd>Em breve<\/dd>/);
  assert.match(V.infoHtml(noZap), /store-warning/, 'cadastro em verificação mostra aviso');
});

test('horário curto extraído do texto livre', () => {
  assert.equal(V.shortHours('18h às 23h, fechado às quartas'), '18h–23h');
  assert.equal(V.shortHours('Todos os dias, 18h às 23h'), '18h–23h');
  assert.equal(V.shortHours('17h45 às 23h15'), '17h45–23h15');
  assert.equal(V.shortHours('Av. Mato Grosso: 09:00 às 22:00; BR-158: 12:30 às 22:00'), '9h–22h');
  assert.equal(V.shortHours('Quarta a domingo'), null);
  assert.equal(V.shortHours(null), null);
});

test('faixa "como funciona": pedido online, só WhatsApp ou ausente', () => {
  assert.match(V.howHtml(full), /Escolha[\s\S]*Confira[\s\S]*Envie/);
  assert.match(V.howHtml(noMenu), /Chame[\s\S]*Combine[\s\S]*Receba/);
  assert.equal(V.howHtml(noZap), '', 'sem WhatsApp verificado, nada a prometer');
});

test('cardápio vem antes da faixa quando há itens; depois dela quando não há', () => {
  const a = V.pageHtml(full), b = V.pageHtml(noMenu);
  assert.ok(a.indexOf('storeMenuTitle') < a.indexOf('spHowTitle'));
  assert.ok(b.indexOf('spHowTitle') < b.indexOf('storeMenuTitle'));
});

test('itens: opções marcadas, preço "a partir de" e área de imagem estável', () => {
  const pizza = full.menu.find(m => m.id === 'pizza');
  assert.match(V.itemHtml(pizza), /a partir de<\/span> R\$ 40,00/);
  assert.match(V.itemHtml(pizza), /Com opções/);
  const plain = full.menu.find(m => m.id === 'refri');
  assert.match(V.itemHtml(plain), /sp-ph/);
  assert.doesNotMatch(V.itemHtml(plain), /Com opções/);
});

test('cardápio longo ganha busca; seções agrupadas na ordem do cadastro', () => {
  const html = V.menuHtml(full);
  assert.match(html, /id="spSearch"/);
  assert.deepEqual(V.sectionsOf(full.menu).map(s => s.name), ['Pizzas', 'Lanches', 'Porções', 'Bebidas', 'Sobremesas']);
  assert.doesNotMatch(V.menuHtml(noZap), /id="spSearch"/);
});

test('apresentação em linguagem natural e iniciais do selo', () => {
  assert.equal(V.lede(full), 'Pizzaria e lanchonete em Barra do Garças');
  assert.equal(V.initials('Pizzaria Coqueiros'), 'PC');
  assert.equal(V.initials('Açaí do Vale'), 'AV');
  assert.equal(V.initials('X'), 'X');
});
