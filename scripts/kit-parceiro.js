#!/usr/bin/env node
/* Kit de divulgação do parceiro: QR Code do cardápio + artes prontas, com a marca da loja e a do PedeAi.
   Uso: node scripts/kit-parceiro.js <id> [<id> ...]
   Saída em data/research/kits/<id>/ (fora do site):
     - qrcode.png         QR Code do cardápio (1200 px, para gráfica ou impressão caseira)
     - cartaz-mesa.png    cartaz A5 em pé (1240x1748) para mesa, balcão e sacola de entrega
     - story.png          1080x1920 para story do Instagram e status do WhatsApp
     - post.png           1080x1080 para o feed
     - link.txt           link do cardápio (bio do Instagram, WhatsApp Business)
   Depende de: Playwright (já usado no projeto) e do pacote Python "qrcode" (pip install qrcode). */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const pw = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.pedeaionline.com.br/';
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'establishments.json'), 'utf8')).establishments;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataUri = file => 'data:image/' + (file.endsWith('.png') ? 'png' : 'webp') + ';base64,' + fs.readFileSync(path.join(ROOT, file.split('?')[0])).toString('base64');

/* QR Code como SVG (correção de erro alta, para continuar lendo com o logo do PedeAi no centro). */
function qrSvg(url, color) {
  const py = 'import sys,qrcode,qrcode.image.svg as s\n' +
    'q=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H,border=0)\nq.add_data(sys.argv[1]);q.make(fit=True)\n' +
    'm=q.get_matrix();n=len(m)\nd="".join("M%d %dh1v1h-1z"%(x,y) for y,r in enumerate(m) for x,v in enumerate(r) if v)\n' +
    'print(n);print(d)';
  const [n, d] = execFileSync('python3', ['-c', py, url]).toString().trim().split('\n');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"><path fill="' + color + '" d="' + d + '"/></svg>';
}

function page(s, kind) {
  const url = SITE + '#/loja/' + s.id;
  const b = s.brand || { primary: '#e51b2b', deep: '#7d1019', ink: '#ffffff' };
  const logo = s.logo ? dataUri(s.logo.tile || s.logo.src) : s.image ? dataUri(s.image.thumb || s.image.src) : null;
  const mark = dataUri('assets/media-eec8624c4b7f.png');
  const qr = qrSvg(url, '#1b1214');
  const size = { cartaz: [1240, 1748], story: [1080, 1920], post: [1080, 1080] }[kind];
  const css = `*{box-sizing:border-box;margin:0}body{width:${size[0]}px;height:${size[1]}px;font-family:'DM Sans',sans-serif;color:#fff;
    background:radial-gradient(120% 90% at 0% 0%,${b.primary} 0%,${b.deep} 60%,#140406 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden}
    .bgmark{position:absolute;right:-12%;top:-8%;width:62%;opacity:.08;transform:rotate(-12deg)}
    .logo{width:${kind === 'post' ? 170 : 230}px;height:${kind === 'post' ? 170 : 230}px;border-radius:50%;background:#fff;padding:10px;box-shadow:0 20px 50px rgba(0,0,0,.35)}
    .logo img{width:100%;height:100%;object-fit:cover;border-radius:50%}
    h1{font:800 ${kind === 'post' ? 64 : 82}px/1.05 Montserrat,sans-serif;letter-spacing:-.03em;margin-top:${kind === 'post' ? 26 : 44}px;max-width:88%}
    .lead{font-size:${kind === 'post' ? 30 : 38}px;opacity:.9;margin-top:16px;max-width:82%}
    .qrbox{background:#fff;border-radius:40px;padding:${kind === 'post' ? 26 : 38}px;margin-top:${kind === 'post' ? 30 : 56}px;position:relative;box-shadow:0 30px 70px rgba(0,0,0,.4)}
    .qrbox svg{display:block;width:${kind === 'post' ? 300 : kind === 'story' ? 460 : 520}px;height:auto}
    .qrmark{position:absolute;left:50%;top:50%;width:${kind === 'post' ? 70 : 104}px;height:${kind === 'post' ? 70 : 104}px;transform:translate(-50%,-50%);border-radius:22px;background:#e51b2b url(${mark}) center/72% no-repeat;border:8px solid #fff}
    .scan{font:800 ${kind === 'post' ? 30 : 40}px Montserrat,sans-serif;margin-top:${kind === 'post' ? 22 : 34}px}
    .foot{position:absolute;bottom:${kind === 'post' ? 36 : 70}px;display:flex;align-items:center;gap:14px;font:800 ${kind === 'post' ? 30 : 38}px Montserrat,sans-serif}
    .foot i{width:${kind === 'post' ? 50 : 64}px;height:${kind === 'post' ? 50 : 64}px;border-radius:16px;background:#e51b2b url(${mark}) center/72% no-repeat;display:block}
    .foot small{display:block;font:500 ${kind === 'post' ? 18 : 22}px 'DM Sans',sans-serif;opacity:.8;text-align:left}`;
  const title = kind === 'story' ? 'Agora estamos no PedeAi!' : kind === 'post' ? 'Peça pelo PedeAi' : 'Faça seu pedido pelo PedeAi';
  const lead = kind === 'cartaz' ? 'Aponte a câmera, veja o cardápio completo e peça direto no nosso WhatsApp.' : 'Cardápio completo, sem baixar aplicativo. O pedido chega direto no nosso WhatsApp.';
  return `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Montserrat:wght@800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
    <img class="bgmark" src="${mark}" alt="">
    ${logo ? `<div class="logo"><img src="${logo}" alt=""></div>` : ''}
    <h1>${esc(title)}</h1><p class="lead">${esc(s.name)} · ${esc(lead)}</p>
    <div class="qrbox">${qr}<span class="qrmark"></span></div>
    <p class="scan">Aponte a câmera do celular</p>
    <div class="foot"><i></i><span>PedeAi Delivery<small>pedeaionline.com.br</small></span></div>
  </body></html>`;
}

(async () => {
  const ids = process.argv.slice(2);
  if (!ids.length) { console.error('Uso: node scripts/kit-parceiro.js <id> [<id> ...]'); process.exit(1); }
  const browser = await pw.chromium.launch();
  for (const id of ids) {
    const s = db.find(x => x.id === id);
    if (!s) { console.log('não existe\t' + id); continue; }
    const out = path.join(ROOT, 'data', 'research', 'kits', id);
    fs.mkdirSync(out, { recursive: true });
    const url = SITE + '#/loja/' + s.id;
    fs.writeFileSync(path.join(out, 'link.txt'), url + '\n');
    for (const kind of ['cartaz', 'story', 'post']) {
      const [w, h] = { cartaz: [1240, 1748], story: [1080, 1920], post: [1080, 1080] }[kind];
      const p = await browser.newPage({ viewport: { width: w, height: h } });
      await p.setContent(page(s, kind), { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: path.join(out, kind === 'cartaz' ? 'cartaz-mesa.png' : kind + '.png') });
      await p.close();
    }
    const q = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
    await q.setContent(`<body style="margin:0;background:#fff;display:grid;place-items:center;width:1200px;height:1200px"><div style="width:1080px">${qrSvg(url, '#000')}</div></body>`);
    await q.screenshot({ path: path.join(out, 'qrcode.png') });
    await q.close();
    console.log('ok\t' + id + '\t' + path.relative(ROOT, out));
  }
  await browser.close();
})();
