#!/usr/bin/env node
/* Gera a imagem de prévia de link (Open Graph) da página /planos: planos/og-parceiros.jpg (1200x630).
   É a imagem que aparece no WhatsApp, Instagram, Facebook etc. quando o link é compartilhado.
   Uso: node scripts/og-parceiros.js   (depende do Playwright, já usado no projeto) */
'use strict';
const fs = require('fs');
const path = require('path');
const pw = require('playwright');
const ROOT = path.join(__dirname, '..');
const uri = (f, t) => 'data:' + t + ';base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const mark = uri('assets/media-eec8624c4b7f.png', 'image/png');
const phones = uri('planos/como-funciona-1254.webp', 'image/webp');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:'DM Sans',sans-serif;color:#fff;position:relative;
  background:radial-gradient(90% 120% at 0% 0%,#5a0d17 0%,#2a0509 45%,#120204 100%)}
.glow{position:absolute;right:-120px;top:-80px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(229,27,43,.45),rgba(229,27,43,0) 65%)}
.wm{position:absolute;left:-60px;bottom:-120px;width:420px;opacity:.06;transform:rotate(-14deg)}
.left{position:absolute;left:64px;top:52px;width:610px}
.brand{display:flex;align-items:center;gap:14px}
.brand i{width:56px;height:56px;border-radius:16px;background:#e51b2b url(${mark}) center/38px no-repeat;box-shadow:0 10px 26px rgba(229,27,43,.5)}
.brand b{font:800 30px Montserrat;letter-spacing:-.02em;display:block;line-height:1}
.brand small{display:block;font:700 12px 'DM Sans';letter-spacing:.32em;color:#e8b9be;margin-top:5px}
.pill{display:inline-flex;align-items:center;gap:10px;margin-top:34px;padding:9px 18px;border-radius:99px;background:#fff;color:#120204;font:900 17px Montserrat;letter-spacing:.08em}
.pill em{font-style:normal;color:#e51b2b}
.pill::before{content:"";width:10px;height:10px;border-radius:50%;background:#e51b2b;box-shadow:0 0 0 5px rgba(229,27,43,.2)}
h1{font:900 64px/1.02 Montserrat;letter-spacing:-.04em;margin-top:20px}
h1 span{color:#ff4a55}
.sub{font:500 24px/1.35 'DM Sans';color:#f1dadd;margin-top:18px;max-width:560px}
.sub b{color:#fff;font-weight:700}
.cta{display:inline-flex;align-items:center;gap:12px;margin-top:28px;padding:16px 28px;border-radius:18px;background:linear-gradient(180deg,#ff4a55,#d0121f);font:800 24px Montserrat;box-shadow:0 18px 36px -12px rgba(229,27,43,.9)}
.right{position:absolute;right:-26px;top:44px;width:560px;height:560px;border-radius:40px;overflow:hidden;transform:rotate(3deg);box-shadow:0 40px 80px rgba(0,0,0,.55),0 0 0 8px rgba(255,255,255,.06)}
.right img{width:100%;height:100%;object-fit:cover;display:block}
.stamp{position:absolute;right:392px;bottom:40px;width:150px;height:150px;border-radius:50%;background:#fff;color:#120204;display:grid;place-items:center;text-align:center;transform:rotate(-10deg);box-shadow:0 20px 40px rgba(0,0,0,.45);border:6px solid #e51b2b}
.stamp b{display:block;font:900 52px/1 Montserrat;color:#e51b2b;letter-spacing:-.04em}
.stamp small{display:block;font:800 15px/1.1 Montserrat;letter-spacing:.04em}
</style></head><body>
<div class="glow"></div><img class="wm" src="${mark}" alt="">
<div class="right"><img src="${phones}" alt=""></div>
<div class="stamp"><span><b>0%</b><small>DE COMISSÃO</small></span></div>
<div class="left">
  <div class="brand"><i></i><span><b>PedeAi</b><small>DELIVERY</small></span></div>
  <span class="pill">BLACK FRIDAY <em>· ATÉ 36% OFF</em></span>
  <h1>Seja parceiro<br><span>PedeAi</span></h1>
  <p class="sub">Venda no delivery <b>sem comissão</b>, com o pedido direto no seu WhatsApp. Planos a partir de <b>R$&nbsp;39,90/mês</b>.</p>
  <span class="cta">Garanta seu preço →</span>
</div>
</body></html>`;

(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const out = path.join(ROOT, 'planos', 'og-parceiros.jpg');
  await p.screenshot({ path: out, type: 'jpeg', quality: 86 });
  await b.close();
  console.log('ok', path.relative(ROOT, out), Math.round(fs.statSync(out).size / 1024) + ' KB');
})();
