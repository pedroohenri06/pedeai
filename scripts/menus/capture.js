#!/usr/bin/env node
/* Coleta o cardápio publicado por cada estabelecimento (data/research/cardapios/fontes.json).
   Abre a página no Chromium (Playwright) e guarda o HTML final e as respostas JSON que a própria página carrega,
   em data/research/cardapios/bruto/<id>/ (fora do git). Não contorna bloqueios: página com verificação anti-robô
   ou fonte marcada com "motivo" é pulada e aparece no relatório.

   Uso: node scripts/menus/capture.js [id ...]        (sem ids: todas as fontes coletáveis)
        node scripts/menus/capture.js --platform aiqfome */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const FONTES = path.join(ROOT, 'data', 'research', 'cardapios', 'fontes.json');
const OUT = path.join(ROOT, 'data', 'research', 'cardapios', 'bruto');
const CONCURRENCY = 3;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    return require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const INTERACT = {
  /* GynFood: o detalhe (variações, adicionais) só existe no modal de cada produto; a foto grande só baixa pelo
     próprio navegador. Guarda o HTML de cada modal em responses e as fotos em bruto/<id>/img/. */
  async gynfood(page, responses, dir) {
    const imgDir = path.join(dir, 'img');
    fs.mkdirSync(imgDir, { recursive: true });
    page.on('response', async r => {
      if (r.request().resourceType() !== 'image' || !/impulsionedelivery\.com\.br\/.*produtos\/.*_m\.(jpe?g|png|webp)/.test(r.url())) return;
      try { fs.writeFileSync(path.join(imgDir, path.basename(new URL(r.url()).pathname)), await r.body()); } catch (e) { /* imagem indisponível */ }
    });
    const ids = await page.$$eval('a.item-produto[data-produto-id]', els => els.map(e => e.dataset.produtoId));
    for (const id of ids) {
      await page.evaluate(i => { const a = document.querySelector('a.item-produto[data-produto-id="' + i + '"]'); if (a) a.click(); }, id);
      await page.waitForFunction(i => { const m = document.querySelector('#produto-' + i + ' .modal-content'); return m && /ctn-opcoes|produto-view-price/.test(m.innerHTML); }, id, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(700);
      const html = await page.evaluate(i => { const m = document.querySelector('#produto-' + i + ' .modal-content'); return m ? m.innerHTML : ''; }, id);
      responses.push({ url: 'gynfood-modal:' + id, status: 200, body: { html } });
      await page.evaluate(() => { if (window.$) $('.modal').modal('hide'); });
      await page.waitForTimeout(300);
    }
  },
  /* Goomer: os grupos de opções de cada produto vêm de /product/<id>/optiongroups/<versão>, pedido ao abrir o
     produto. Pede o mesmo endereço, pelo próprio navegador, para cada produto da lista. */
  async goomer(page, responses) {
    const list = (responses.find(r => /\/webmenu\/[^/]+\/menu\//.test(r.url)) || {}).body;
    const slug = new URL(page.url()).hostname.split('.')[0];
    for (const p of (list && list.products) || []) {
      const url = 'https://mobile.goomer.app/webmenu/' + slug + '/product/' + p.id + '/optiongroups/' + p.version + '?provider=ggo';
      if (responses.some(r => r.url === url)) continue;
      const body = await page.evaluate(u => fetch(u).then(r => r.json()).catch(() => null), url);
      if (body) responses.push({ url, status: 200, body });
    }
  },
  async menudino(page, responses) {
    const cats = (responses.find(r => /\/catalog\/categories\//.test(r.url)) || {}).body;
    for (const c of (cats && cats.items) || []) {
      await page.getByText(c.name, { exact: true }).first().click({ timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1200);
    }
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  }
};

function targets(argv) {
  const all = JSON.parse(fs.readFileSync(FONTES, 'utf8')).fontes;
  const pi = argv.indexOf('--platform');
  const platform = pi > -1 ? argv[pi + 1] : null;
  const ids = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--platform');
  return Object.entries(all)
    .filter(([id, f]) => !f.motivo && (!ids.length || ids.includes(id)) && (!platform || f.platform === platform))
    .map(([id, f]) => Object.assign({ id }, f));
}

async function captureOne(browser, t) {
  const dir = path.join(OUT, t.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
  const page = await ctx.newPage();
  const responses = [];
  page.on('response', async r => {
    const type = (r.headers()['content-type'] || '').toLowerCase();
    if (!type.includes('json') || r.request().resourceType() === 'image') return;
    try { responses.push({ url: r.url(), status: r.status(), body: await r.json() }); } catch (e) { /* corpo vazio ou inválido */ }
  });
  const meta = { id: t.id, url: t.url, platform: t.platform, capturedAt: new Date().toISOString() };
  try {
    // Algumas páginas mantêm conexões abertas (chat, analytics) e nunca ficam ociosas: espera o documento e segue.
    const res = await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    meta.status = res ? res.status() : null;
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    // Cardápios costumam carregar seções sob demanda: rola até o fim antes de salvar.
    // Páginas que se redirecionam durante a rolagem destroem o contexto: espera a nova página e segue.
    for (let i = 0; i < 25; i++) {
      const done = await page.evaluate(() => { window.scrollBy(0, window.innerHeight); return window.scrollY + window.innerHeight >= document.body.scrollHeight - 4; })
        .catch(async () => { await page.waitForLoadState('domcontentloaded').catch(() => {}); return false; });
      await page.waitForTimeout(250);
      if (done && i > 3) break;
    }
    if (t.wait) await page.waitForTimeout(t.wait);
    // Plataformas que só carregam os itens ao abrir cada categoria: toca em todas, uma a uma.
    if (INTERACT[t.platform]) await INTERACT[t.platform](page, responses, dir).catch(e => { meta.interactError = String(e.message || e).split('\n')[0]; });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    meta.finalUrl = page.url();
    meta.title = await page.title();
    if (meta.status === 403 || /Attention Required|Just a moment/i.test(meta.title)) meta.blocked = true;
    fs.writeFileSync(path.join(dir, 'page.html'), await page.content());
  } catch (e) {
    meta.error = String(e.message || e).split('\n')[0];
  }
  fs.writeFileSync(path.join(dir, 'responses.json'), JSON.stringify(responses));
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  await ctx.close();
  return meta;
}

async function main() {
  const list = targets(process.argv.slice(2));
  if (!list.length) return console.log('Nenhuma fonte para coletar.');
  const browser = await loadPlaywright().chromium.launch();
  const queue = list.slice();
  async function worker() {
    for (let t = queue.shift(); t; t = queue.shift()) {
      const m = await captureOne(browser, t);
      console.log(`${m.blocked ? 'BLOQUEADO' : m.error ? 'ERRO' : 'ok'}\t${t.platform}\t${t.id}${m.error ? '\t' + m.error : ''}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
