// Captura a página de planos (/planos) em 390×790 pt @3× para o filme dos parceiros.
// Uso: node capturar-planos.cjs public/shots/planos   (site servido em http://localhost:4174)
const {chromium} = require('playwright');
const fs = require('fs');
const O = process.argv[2];
fs.mkdirSync(O, {recursive: true});
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 790}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba'});
  // data fixa durante a Black Friday (o contador mostra o tempo até 30/11)
  await ctx.clock.setFixedTime(new Date('2026-11-17T20:30:00-04:00'));
  const p = await ctx.newPage();
  const pos = {};
  await p.goto('http://localhost:4174/planos/');
  await p.waitForTimeout(2500);
  // tira barras flutuantes e pop-ups da captura
  await p.addStyleTag({content: '.offerbar,.wa-float,.wa-card,.exit{display:none!important}'});
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visible', 'in')));
  await p.screenshot({path: O + '/hero.png'});
  const top = async (sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : null; }, sel);
  pos.planosY = await top('#planos');
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  pos.H = H;
  // rola de verdade (as seções aparecem ao entrar na tela) e fotografa cada plano
  for (let y = 0; y < pos.planosY + 2600; y += 300) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(120); }
  pos.cards = await p.evaluate(() => [...document.querySelectorAll('article.plan')].map((e) => ({cls: e.className, y: e.getBoundingClientRect().top + scrollY, h: e.getBoundingClientRect().height})));
  if (pos.planosY) { await p.evaluate((y) => scrollTo(0, y - 20), pos.planosY); await p.waitForTimeout(600); await p.screenshot({path: O + '/planos.png'}); }
  const uniq = pos.cards.filter((c, i, a) => a.findIndex((d) => Math.abs(d.y - c.y) < 5) === i).slice(0, 3);
  for (const [i, c] of uniq.entries()) { await p.evaluate((y) => scrollTo(0, y - 70), c.y); await p.waitForTimeout(600); await p.screenshot({path: O + '/plano_' + i + '.png'});
    // cartão isolado: do topo até o fim dos três destaques
    const r = await p.evaluate(() => { const art = [...document.querySelectorAll('article.plan')].find((e) => { const b = e.getBoundingClientRect(); return b.top > 0 && b.top < 200; }); const b = art.getBoundingClientRect(); const hl = art.querySelector('ul'); const end = hl ? hl.getBoundingClientRect().bottom + 18 : b.top + 560; return {x: b.x, y: b.y, w: b.width, h: Math.min(end - b.y, 700)}; });
    await p.screenshot({path: O + '/card_' + i + '.png', clip: {x: r.x, y: r.y, width: r.w, height: r.h}, omitBackground: true}); pos['card_' + i] = r; }
  fs.writeFileSync(O + '/pos.json', JSON.stringify(pos, null, 1));
  console.log(JSON.stringify(pos));
  await b.close();
})();
