// Captura o fluxo real de descoberta (cidade → categoria Hambúrguer → Dantes) em 390×844 @3×.
// Uso: node capturar-fluxo.cjs public/shots/flow   (com o site servido em http://localhost:4174)
const {chromium} = require('playwright');
const fs = require('fs');
const O = process.argv[2];
fs.mkdirSync(O, {recursive: true});
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba'});
  // horário fixo de funcionamento (20h30 em MT) para as lojas aparecerem abertas
  await ctx.clock.setFixedTime(new Date('2026-11-14T20:30:00-04:00'));
  await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('cap')) { localStorage.setItem('pedeai-city', 'Nova Xavantina'); sessionStorage.setItem('cap', '1'); } } catch (e) {} });
  const p = await ctx.newPage();
  const pos = {};
  const rect = async (sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }, sel);
  const shot = async (n, extra = {}) => { await p.waitForTimeout(500); await p.screenshot({path: O + '/' + n, ...extra}); };
  const chrome = (hide) => p.evaluate((h) => {
    const els = [document.getElementById('header'), ...[...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).position === 'fixed')];
    els.forEach((e) => { e.style.visibility = h ? 'hidden' : ''; });
  }, hide);
  const tall = async (name, y, h) => {
    const sy = await p.evaluate(() => scrollY);
    await chrome(true); await p.evaluate(() => scrollTo(0, 0)); await showAll(); await p.waitForTimeout(400);
    await p.screenshot({path: O + '/' + name, fullPage: true, clip: {x: 0, y, width: 390, height: h}, quality: 92, type: 'jpeg'});
    await chrome(false); await p.evaluate((v) => scrollTo(0, v), sy); await p.waitForTimeout(300);
  };
  // Só a Dantes (autorizada) e a Le Monde (autorização em andamento) aparecem no filme.
  const KEEP = /#\/loja\/(dantes-barra-do-garcas|le-monde-burguer-hamburgueria-barra-do-garcas)$/;
  const showAll = () => p.evaluate((k) => {
    const re = new RegExp(k);
    document.querySelectorAll('a[href^="#/loja/"]').forEach((a) => { if (!re.test(a.getAttribute('href'))) a.style.display = 'none'; });
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visible'));
  }, KEEP.source);

  await p.goto('http://localhost:4174/');
  await p.waitForTimeout(2500);
  console.log('cidade inicial:', await p.textContent('#locationName'));
  await shot('home_nx.png');
  pos.locationBtn = await rect('#locationBtn');

  // menu de cidades
  await p.click('#locationBtn');
  await p.waitForTimeout(900);
  await shot('menu.png');
  pos.menu = await rect('#cityMenu');
  pos.list = await rect('#cityList');
  // lista inteira (alta), para rolar no vídeo: 3 recortes em posições de rolagem diferentes
  const listH = await p.evaluate(() => document.getElementById('cityList').scrollHeight);
  pos.listH = listH;
  const vis = pos.list.h, maxS = listH - vis;
  pos.listParts = [0, Math.round(maxS / 2), maxS];
  for (const [i, st] of pos.listParts.entries()) {
    await p.evaluate((v) => { document.getElementById('cityList').scrollTop = v; }, st);
    await p.waitForTimeout(250);
    await (await p.$('#cityList')).screenshot({path: O + '/list_' + i + '.png'});
  }
  pos.barraInList = await p.evaluate(() => { const l = document.getElementById('cityList'); const r = document.querySelector('.city-option[data-city="Barra do Garças"]').getBoundingClientRect(); return {x: r.x - l.getBoundingClientRect().x, y: r.y - l.getBoundingClientRect().y + l.scrollTop, w: r.width, h: r.height}; });
  await p.evaluate(() => { const l = document.getElementById('cityList'); l.scrollTop = l.scrollHeight; });
  await shot('menu_end.png');
  pos.barra = await rect('.city-option[data-city="Barra do Garças"]');

  // escolhe Barra do Garças
  await p.click('.city-option[data-city="Barra do Garças"]');
  await p.waitForTimeout(450);
  await shot('home_barra_toast.png');
  pos.toast = await p.evaluate(() => { const t = [...document.querySelectorAll('body *')].find((e) => /PedeAi em Barra do Garças/.test(e.textContent) && e.children.length === 0); const r = t.closest('div,p,span').getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; });
  await p.waitForTimeout(3500);
  await showAll();
  await shot('home_barra.png');

  // página alta até as categorias (para a rolagem contínua)
  await showAll();
  const catTop = await p.evaluate(() => document.querySelector('.categories').getBoundingClientRect().top + scrollY);
  pos.catTop = catTop;
  await tall('home_tall.jpg', 0, catTop + 900);

  // posição final da rolagem: categorias logo abaixo do cabeçalho
  const target = catTop - 150;
  await p.evaluate((y) => scrollTo(0, y), target);
  pos.scrollCats = target;
  await showAll();
  await shot('cats.png');
  pos.header = await rect('#header');
  pos.hamb = await rect('#categories .cat[data-cat="Hambúrguer"]');
  pos.nav = await p.evaluate(() => { const n = [...document.querySelectorAll('body *')].find((e) => getComputedStyle(e).position === 'fixed' && /Início/.test(e.textContent) && e.getBoundingClientRect().height < 120); const r = n.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; });

  // toca em Hambúrguer
  await p.click('#categories .cat[data-cat="Hambúrguer"]');
  await p.waitForTimeout(1400);
  await showAll();
  pos.scrollHamb = await p.evaluate(() => scrollY);
  await shot('hamb.png');
  // página alta depois do toque, da rolagem das categorias até bem abaixo da Dantes
  const y0 = pos.scrollCats;
  pos.hambTall = {y0, h: 1500};
  await tall('hamb_tall.jpg', y0, 1500);
  // arrasta um pouco: a linha da Dantes sobe para logo abaixo do título
  const dTop = await p.evaluate(() => document.querySelector('a[href="#/loja/dantes-barra-do-garcas"]').getBoundingClientRect().top + scrollY);
  const target2 = Math.round(dTop - 250);
  await p.evaluate((y) => scrollTo(0, y), target2);
  pos.scrollDantes = target2;
  await showAll();
  await shot('hamb_dantes.png');
  pos.dantes = await rect('a[href="#/loja/dantes-barra-do-garcas"]');
  pos.lemonde = await rect('a[href="#/loja/le-monde-burguer-hamburgueria-barra-do-garcas"]');

  fs.writeFileSync(O + '/pos.json', JSON.stringify(pos, null, 1));
  console.log(JSON.stringify(pos));
  await b.close();
})();
