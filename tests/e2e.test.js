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

const FIXTURE = require('./fixtures/stores.json');

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
      assert.equal(await page.locator('.restaurant').count(), 2);
      await page.fill('#search', 'monte a sua');
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

    await t.test('página da loja tem a marca da plataforma no topo e o rodapé oficial', async () => {
      assert.equal(await page.textContent('.sp-brand-tag'), 'A plataforma de delivery do interior');
      assert.equal(await page.locator('#storePage .site-footer-v5').count(), 1);
      await page.click('#storePage .site-footer-v5 [data-legal="terms"]');
      await page.waitForSelector('#legalDialog.open');
      await page.keyboard.press('Escape');
      await page.waitForSelector('#legalDialog:not(.open)', { state: 'attached' });
      assert.equal(await page.isVisible('#storeName'), true, 'Esc fecha só o documento legal');
    });

    await t.test('categorias levam à seção e acompanham a rolagem', async () => {
      assert.equal(await page.locator('.sp-cat').count(), 5);
      await page.click('.sp-cat:has-text("Bebidas")');
      await page.waitForTimeout(900);
      assert.equal(await page.getAttribute('.sp-cat:has-text("Bebidas")', 'aria-current'), 'true');
      const [top, barBottom] = await page.evaluate(() => [document.querySelector('#sp-sec-3').getBoundingClientRect().top, document.querySelector('.sp-sticky').getBoundingClientRect().bottom]);
      assert.ok(top >= barBottom - 2 && top < barBottom + 40, `seção logo abaixo da barra fixa: seção ${top}, barra ${barBottom}`);
      await page.locator('#storeScroll').evaluate(e => e.scrollTo(0, 0));
      await page.waitForTimeout(300);
      assert.equal(await page.getAttribute('.sp-cat:has-text("Pizzas")', 'aria-current'), 'true');
    });

    await t.test('busca filtra o cardápio e mostra estado vazio', async () => {
      await page.fill('#spSearch', 'suco');
      assert.equal(await page.locator('.sp-li:not([hidden])').count(), 1);
      await page.fill('#spSearch', 'nada disso');
      assert.equal(await page.isVisible('#spNoResult'), true);
      await page.fill('#spSearch', '');
      assert.equal(await page.locator('.sp-li:not([hidden])').count(), 14);
    });

    await t.test('produtos com e sem foto mantêm a área de imagem', async () => {
      assert.equal(await page.locator('.sp-item-media img').count(), 4);
      assert.equal(await page.locator('.sp-item-media .sp-ph').count(), 10);
      const sizes = await page.$$eval('.sp-item-media', els => [...new Set(els.map(e => Math.round(e.getBoundingClientRect().width)))]);
      assert.equal(sizes.length, 1);
    });

    await t.test('sacola soma corretamente e persiste', async () => {
      await page.click('[data-add="calabresa"]');
      await page.click('[data-add="calabresa"]');
      await page.click('[data-add="refri"]');
      assert.equal(await page.textContent('[data-badge="calabresa"]'), '2');
      assert.match(await page.textContent('#cartBar'), /3.*R\$ 132,30/);
      await page.reload();
      assert.match(await page.textContent('#cartBar'), /3.*R\$ 132,30/);
      await page.click('#cartBar');
      assert.equal(await page.textContent('#cartSubtotal'), 'R$ 132,30');
      assert.equal(await page.textContent('#cartFee'), 'A confirmar');
      await page.click('#cartLines [data-key="refri"][data-delta="-1"]');
      assert.equal(await page.textContent('#cartSubtotal'), 'R$ 119,80');
      await page.keyboard.press('Escape');
      assert.equal(await page.isVisible('#storeName'), true, 'Esc fecha só a sacola');
    });

    await t.test('opções obrigatórias são validadas e o preço é atualizado', async () => {
      await page.click('[data-add="pizza"]');
      await page.waitForSelector('#spSheet.open');
      assert.equal(await page.getAttribute('#spConfirm', 'aria-disabled'), 'true');
      assert.match(await page.textContent('#spConfirm'), /Escolha uma opção em Tamanho/);
      await page.click('#spConfirm', { force: true });
      assert.equal(await page.locator('#spSheet.open').count(), 1, 'não adiciona combinação incompleta');
      await page.click('.sp-choice:has(input[value="g"])');
      await page.click('.sp-choice:has(input[value="bacon"])');
      await page.click('.sp-choice:has(input[value="borda"])');
      assert.equal(await page.isDisabled('.sp-choice input[value="milho"]'), true, 'limite de 2 adicionais');
      await page.click('[data-step="1"]');
      assert.match(await page.textContent('#spConfirm'), /R\$ 136,00/);
      await page.fill('#spNote', 'bem assada');
      await page.click('#spConfirm');
      await page.waitForSelector('#spSheet:not(.open)', { state: 'attached' });
      assert.equal(await page.textContent('[data-badge="pizza"]'), '2');
      assert.match(await page.textContent('#cartBar'), /4.*R\$ 255,80/);
    });

    await t.test('valida dados e envia para o WhatsApp do estabelecimento', async () => {
      await page.click('#cartBar');
      assert.match(await page.textContent('#cartLines'), /Grande \(8 fatias\)[\s\S]*Bacon[\s\S]*Obs\.: bem assada/);
      await page.fill('#cartName', '');
      await page.click('#cartSend');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'cartName');
      await page.fill('#cartName', 'Maria');
      await page.fill('#cartAddress', 'Rua das Flores, 10');
      await page.selectOption('#cartPayment', 'Dinheiro');
      await page.fill('#cartChange', 'R$ 300');
      await page.evaluate(() => { window.open = url => { window.__opened = url; }; });
      await page.click('#cartSend');
      const href = await page.evaluate(() => window.__opened);
      assert.match(href, /^https:\/\/wa\.me\/5566999990000\?text=/);
      const text = decodeURIComponent(href.split('text=')[1]);
      assert.match(text, /2x Calabresa G — R\$ 119,80/);
      assert.match(text, /2x Pizza Monte a Sua — R\$ 136,00\n   • Tamanho: Grande \(8 fatias\) \(\+R\$ 15,00\)\n   • Adicionais: Bacon \(\+R\$ 5,00\)\n   • Adicionais: Borda recheada \(\+R\$ 8,00\)\n   Obs\.: bem assada/);
      assert.match(text, /Subtotal: R\$ 255,80/);
      assert.match(text, /Nome: Maria/);
      assert.match(text, /troco para R\$ 300/);
      await page.keyboard.press('Escape');
    });

    await t.test('sem WhatsApp verificado o envio fica bloqueado', async () => {
      await page.goto(base + '#/loja/lanche-sem-zap-barra-do-garcas');
      await page.click('[data-add="x"]');
      await page.click('#cartBar');
      assert.equal(await page.isDisabled('#cartSend'), true);
      assert.match(await page.textContent('#cartNote'), /não foi verificado/);
      assert.match(await page.textContent('.store-warning'), /em verificação/i);
      assert.equal(await page.locator('.sp-hero--empty').count(), 1, 'sem foto: capa tipográfica, sem imagem inventada');
      await page.keyboard.press('Escape');
    });

    await t.test('loja sem cardápio mostra pendência e não tem sacola', async () => {
      await page.goto(base + '#/loja/acai-canarana');
      assert.match(await page.textContent('.menu-pending'), /Cardápio em preparação/);
      assert.match(await page.getAttribute('.sp-empty-actions a', 'href'), /^https:\/\/wa\.me\/5566999991111/);
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
