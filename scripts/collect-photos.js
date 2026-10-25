#!/usr/bin/env node
/* Coleta a foto oficial (og:image / twitter:image) das páginas próprias de cada estabelecimento
   (site, cardápio digital, iFood, aiqfome, Instagram, Facebook) e salva em <pasta>/<id>.<ext>,
   com manifest.json registrando a página de origem. Depois: python3 scripts/add-photos.py <pasta>
   Uso: node scripts/collect-photos.js <pasta> [--all] [--only=<id>,<id>] */
'use strict';
const fs = require('fs');
const path = require('path');

const OFFICIAL_HOSTS = /(^|\.)(instagram\.com|facebook\.com|threads\.(net|com)|ifood\.com\.br|aiqfome\.com|anota\.ai|foodsapp\.com\.br|goomer\.app|cardapioweb\.com|menudino\.com|ola\.click)$/;
/* Imagens padrão das plataformas, que não representam o estabelecimento. */
const GENERIC_IMAGE = /(static\.xx\.fbcdn\.net\/rsrc|\/rsrc\.php|instagram\.com\/static\/|ifood\.com\.br\/static\/images\/(logo|default)|og[-_]default|default[-_]og|placeholder)/i;
const MIN_BYTES = 8 * 1024;

function candidatePages(s) {
  const urls = [];
  const push = u => { if (u && !urls.includes(u)) urls.push(u); };
  push(s.website);
  push(s.orderUrl);
  s.sources.forEach(u => { try { if (OFFICIAL_HOSTS.test(new URL(u).hostname)) push(u); } catch (e) { /* url inválida */ } });
  if (s.instagram) push(`https://www.instagram.com/${s.instagram}/`);
  return urls;
}

function decodeEntities(v) {
  return v.replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

/* Extrai a imagem de compartilhamento declarada pela própria página. */
function extractShareImage(html, pageUrl) {
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  for (const key of ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']) {
    for (const tag of metas) {
      const prop = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag);
      const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag);
      if (prop && content && prop[1].toLowerCase() === key) {
        const url = new URL(decodeEntities(content[1]), pageUrl).href;
        if (/^https:\/\//.test(url) && !GENERIC_IMAGE.test(url)) return url;
      }
    }
  }
  return null;
}

function extFor(type) {
  return { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[String(type).split(';')[0].trim()] || null;
}

async function main() {
  const args = process.argv.slice(2);
  const outDir = args.find(a => !a.startsWith('--'));
  if (!outDir) { console.error('Uso: node scripts/collect-photos.js <pasta> [--all] [--only=id,id]'); process.exit(1); }
  const only = (args.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'establishments.json'), 'utf8'));
  const stores = db.establishments.filter(s => (only.length ? only.includes(s.id) : (args.includes('--all') || !s.image)));
  fs.mkdirSync(outDir, { recursive: true });
  const manifestFile = path.join(outDir, 'manifest.json');
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: 'pt-BR', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
  const page = await context.newPage();
  const tally = { ok: 0, noPage: 0, blocked: 0, noImage: 0 };
  const blockedHosts = new Set();

  for (const s of stores) {
    const pages = candidatePages(s);
    if (!pages.length) { tally.noPage++; console.log(`--  ${s.id}: sem página oficial no cadastro`); continue; }
    let saved = false, reasons = [];
    for (const url of pages) {
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        if (!res || !res.ok()) { reasons.push(`${new URL(url).hostname} HTTP ${res ? res.status() : '?'}`); continue; }
        const img = extractShareImage(await page.content(), page.url());
        if (!img) { reasons.push(`${new URL(url).hostname} sem og:image`); continue; }
        const r = await context.request.get(img, { timeout: 25000 });
        const ext = extFor(r.headers()['content-type']);
        const body = await r.body();
        if (!r.ok() || !ext || body.length < MIN_BYTES) { reasons.push(`${new URL(img).hostname} imagem inválida`); continue; }
        fs.writeFileSync(path.join(outDir, s.id + ext), body);
        manifest[s.id] = { sourceUrl: url, imageUrl: img, collectedAt: new Date().toISOString().slice(0, 10) };
        saved = true;
        console.log(`ok  ${s.id} <- ${url}`);
        break;
      } catch (e) {
        const host = new URL(url).hostname;
        if (/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION/.test(e.message)) blockedHosts.add(host);
        reasons.push(`${host} ${e.message.split('\n')[0].slice(0, 60)}`);
      }
    }
    if (saved) tally.ok++;
    else if (reasons.every(r => /ERR_/.test(r))) { tally.blocked++; console.log(`xx  ${s.id}: bloqueado (${reasons.join('; ')})`); }
    else { tally.noImage++; console.log(`--  ${s.id}: ${reasons.join('; ')}`); }
  }
  await browser.close();
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nResumo: ${tally.ok} com foto, ${tally.blocked} bloqueados pela rede, ${tally.noImage} sem imagem utilizável, ${tally.noPage} sem página oficial.`);
  if (blockedHosts.size) console.log('Domínios bloqueados: ' + [...blockedHosts].sort().join(', '));
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { candidatePages, extractShareImage };
