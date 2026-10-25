'use strict';
/* Testes de ponta a ponta no navegador (Playwright). Os dados reais são substituídos por um
   cadastro de teste para exercitar o fluxo completo de pedido sem depender do cadastro real. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { createServer } = require('../scripts/serve.js');

let playwright = null;
try { playwright = require('playwright'); } catch (e) {
  try { playwright = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); } catch (e2) { playwright = null; }
}

const FIXTURE = {
  updatedAt: '2026-10-25', targetPerCity: 20,
  establishments: [
    { id: 'pizzaria-teste-barra-do-garcas', name: 'Pizzaria Teste', city: 'Barra do Garças', category: 'Pizza', kind: 'Pizzaria (dados de teste)', address: 'Rua A, 1 - Centro', neighborhood: 'Centro', whatsapp: '5566999990000', whatsappSource: 'https://exemplo.com/teste', phone: null, instagram: null, website: null, orderUrl: null, hours: null, deliveryFeeCents: null, image: null, menuSource: 'https://exemplo.com/teste', menu: [{ id: 'calabresa', section: 'Pizzas', name: 'Calabresa G', description: '', priceCents: 5990 }, { id: 'refri', section: 'Bebidas', name: 'Refri 2L', description: '', priceCents: 1250 }], sources: ['https://exemplo.com/teste'], confidence: 'alta', verifiedAt: '2026-10-25', notes: null },
    { id: 'lanche-sem-zap-barra-do-garcas', name: 'Lanche Sem Zap', city: 'Barra do Garças', category: 'Hambúrguer', kind: 'Lanchonete (dados de teste)', address: null, neighborhood: null, whatsapp: null, whatsappSource: null, phone: null, instagram: null, website: null, orderUrl: null, hours: null, deliveryFeeCents: null, image: null, menuSource: 'https://exemplo.com/teste', menu: [{ id: 'x', section: 'Lanches', name: 'X-Tudo', description: '', priceCents: 2500 }], sources: ['https://exemplo.com/teste'], confidence: 'baixa', verifiedAt: '2026-10-25', notes: null },
    { id: 'acai-canarana', name: 'Açaí Canarana Teste', city: 'Canarana', category: 'Açaí', kind: 'Açaiteria (dados de teste)', address: null, neighborhood: null, whatsapp: null, whatsappSource: null, phone: null, instagram: null, website: null, orderUrl: null, hours: null, deliveryFeeCents: null, image: null, menuSource: null, menu: [], sources: ['https://exemplo.com/teste'], confidence: 'media', verifiedAt: '2026-10-25', notes: null }
  ]
};

test('fluxo no navegador', { skip: !playwright && 'Playwright não disponível' }, async t => {
  const server = createServer().listen(0);
  await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route('**/data/establishments.js', route => route.fulfill({ contentType: 'text/javascript', body: 'window.PEDEAI_DATA=' + JSON.stringify(FIXTURE) + ';' }));
  await context.route(/^https:\/\/fonts\./, route => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(base);

    await t.test('lista apenas a cidade selecionada', async () => {
      assert.equal(await page.locator('.restaurant').count(), 2);
      assert.equal(await page.textContent('#resultTitle'), 'Em Barra do Garças');
    });

    await t.test('filtro de categoria e busca sem acento', async () => {
      await page.click('.cat[data-cat="Pizza"]');
      assert.equal(await page.locator('.restaurant').count(), 1);
      await page.click('#allCats');
      await page.fill('#search', 'xtudo');
      assert.equal(await page.locator('.restaurant').count(), 0);
      await page.fill('#search', 'x-tudo');
      assert.equal(await page.locator('.restaurant').count(), 1);
      await page.fill('#search', '');
      await page.dispatchEvent('#search', 'input');
    });

    await t.test('troca de cidade filtra a lista e mostra estado vazio', async () => {
      await page.click('#locationBtn');
      await page.click('.city-option[data-city="Canarana"]');
      assert.equal(await page.locator('.restaurant').count(), 1);
      await page.click('#locationBtn');
      await page.click('.city-option[data-city="Vila Rica"]');
      assert.equal(await page.locator('.restaurant').count(), 0);
      assert.match(await page.textContent('#empty h3'), /Chegando em Vila Rica/);
      await page.click('#locationBtn');
      await page.click('.city-option[data-city="Barra do Garças"]');
    });

    await t.test('página da loja abre por URL e volta para a lista', async () => {
      await page.click('.restaurant[data-id="pizzaria-teste-barra-do-garcas"]');
      assert.equal(await page.evaluate(() => location.hash), '#/loja/pizzaria-teste-barra-do-garcas');
      assert.equal(await page.textContent('#storeName'), 'Pizzaria Teste');
      await page.click('.store-back');
      await page.waitForSelector('#storePage:not(.open)', { state: 'attached' });
      await page.goto(base + '#/loja/pizzaria-teste-barra-do-garcas');
      assert.equal(await page.textContent('#storeName'), 'Pizzaria Teste');
    });

    await t.test('carrinho soma corretamente e persiste', async () => {
      await page.click('[data-qty="calabresa"] .qty-add');
      await page.click('[data-qty="calabresa"] [data-act="add"]');
      await page.click('[data-qty="refri"] .qty-add');
      assert.match(await page.textContent('#cartBar'), /3.*R\$ 132,30/);
      await page.reload();
      assert.match(await page.textContent('#cartBar'), /3.*R\$ 132,30/);
      await page.click('#cartBar');
      assert.equal(await page.textContent('#cartSubtotal'), 'R$ 132,30');
      assert.equal(await page.textContent('#cartFee'), 'A confirmar');
      await page.click('#cartLines [data-qty="refri"] [data-act="sub"]');
      assert.equal(await page.textContent('#cartSubtotal'), 'R$ 119,80');
    });

    await t.test('valida dados e envia para o WhatsApp do estabelecimento', async () => {
      await page.click('#cartSend');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'cartName');
      await page.fill('#cartName', 'Maria');
      await page.fill('#cartAddress', 'Rua das Flores, 10');
      await page.selectOption('#cartPayment', 'Dinheiro');
      await page.fill('#cartChange', 'R$ 150');
      await page.evaluate(() => { window.open = url => { window.__opened = url; }; });
      await page.click('#cartSend');
      const href = await page.evaluate(() => window.__opened);
      assert.match(href, /^https:\/\/wa\.me\/5566999990000\?text=/);
      const text = decodeURIComponent(href.split('text=')[1]);
      assert.match(text, /2x Calabresa G — R\$ 119,80/);
      assert.match(text, /Nome: Maria/);
      assert.match(text, /troco para R\$ 150/);
    });

    await t.test('sem WhatsApp verificado o envio fica bloqueado', async () => {
      await page.goto(base + '#/loja/lanche-sem-zap-barra-do-garcas');
      await page.click('[data-qty="x"] .qty-add');
      await page.click('#cartBar');
      assert.equal(await page.isDisabled('#cartSend'), true);
      assert.match(await page.textContent('#cartNote'), /não foi verificado/);
      assert.match(await page.textContent('.store-warning'), /em verificação/i);
    });

    await t.test('loja sem cardápio mostra pendência e não tem carrinho', async () => {
      await page.goto(base + '#/loja/acai-canarana');
      assert.match(await page.textContent('.menu-pending'), /Cardápio em preparação/);
      assert.equal(await page.locator('#cartBar').count(), 0);
    });

    await t.test('loja inexistente volta para a lista', async () => {
      await page.goto(base + '#/loja/nao-existe');
      await page.waitForSelector('#storePage:not(.open)', { state: 'attached' });
    });

    await t.test('sem rolagem horizontal no celular', async () => {
      await page.goto(base);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    });

    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close();
  }
});
