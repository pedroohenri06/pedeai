const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [svgPath, out, w] = process.argv.slice(2); const svg = fs.readFileSync(svgPath, 'utf8');
  const bg = process.argv[5] || (svg.match(/<rect width="[0-9]+" height="[0-9]+" fill="(#[0-9A-Fa-f]{3,6})"/) || [, '#fff'])[1]; const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/); const W = +w, H = Math.floor(W * vb[2] / vb[1]);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(`<style>html,body{margin:0;background:${bg}}svg{display:block;width:${W}px;height:${H}px}</style>` + svg);
  await p.screenshot({ path: out }); await b.close();
})();
