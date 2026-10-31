#!/usr/bin/env node
/* Auditoria: acha o cardápio digital de cada estabelecimento seguindo o link da bio do Instagram.
   O Instagram não mostra perfis sem login, então o caminho é o próprio link da bio: os que já estão no cadastro
   (linktr.ee, bio.site, contate.me, site próprio…) e os endereços de link-na-bio com o mesmo @ do Instagram.
   Um endereço adivinhado só conta se a página trouxer o nome da loja. Abre cada página no Chromium, segue um nível
   (link da bio → botão "Cardápio"/"Delivery"/"Pedir") e classifica cada destino: plataforma de cardápio, WhatsApp,
   iFood ou outro. Resultado em data/research/cardapios/descoberta.json (para revisão; nada muda no cadastro).

   Uso: node scripts/menus/discover.js [id ...]      (sem ids: todas as lojas sem cardápio) */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DB = require(path.join(ROOT, 'data', 'establishments.json')).establishments;
const FONTES = require(path.join(ROOT, 'data', 'research', 'cardapios', 'fontes.json')).fontes;
const OUT = path.join(ROOT, 'data', 'research', 'cardapios', 'descoberta.json');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const MENU_HOSTS = /aiqfome\.com|anota\.ai|menudino\.com|cardapioweb\.com|goomer\.app|brendi\.com\.br|yooga\.app|saipos\.com|vendanozap\.app|bigd\.im|pedir\.delivery|foodsapp\.com\.br|gynfood\.com\.br|beefood\.com\.br|maisdeliveryapp\.com\.br|zionpdv|wabiz\.delivery|deeliv|bidudelivery|ola\.click|olaclick|cardapio\.ai|instadelivery|deliverydireto|delivery\.direto|menuvem|pedeja|appzei|neemo|cardapiodigital|cardapio\.online|meucardapio|kyte\.site|loja\.kyte|grandchef|consumer\.app|pedidos?\.|delivery\.|cardapio\./i;
const BIO_HOSTS = /linktr\.ee|bio\.site|contate\.me|beacons\.ai|linkme\.bio|linkbio|lnk\.bio|taplink|campsite\.bio|bio\.link|hotlink|clique-aqui\.net|msha\.ke|direct\.me|solo\.to|carrd\.co|linkin\.bio|tr\.ee|is\.gd|bit\.ly|encurtador|abre\.ai|cutt\.ly/i;
const DIRECTORY = /instagram|facebook|google|solutudo|diariocidade|guiafacil|telelistas|sluurpy|restaurantguru|trip\.com|tripadvisor|guiatelefone|guiacidade|serasa|econodata|cnpj|ondefica|sorveterias|padaria\.net|pizzapertodemim|pizzariaspertodemim|menustic|corner\.inc|mindtrip|coisasdematogrosso|cardapio\.menu|apontador|guiamais|yelp|fricassedefrango|waze|maps\./i;

const kind = u => /wa\.me|whatsapp|wa\.link/i.test(u) ? 'whatsapp' : /ifood\.com/i.test(u) ? 'ifood'
  : /play\.google|apps\.apple/i.test(u) ? 'app' : MENU_HOSTS.test(u) ? 'cardapio' : BIO_HOSTS.test(u) ? 'bio' : 'outro';
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const STOP = new Set(['restaurante', 'lanchonete', 'pizzaria', 'delivery', 'sorveteria', 'hamburgueria', 'burguer', 'burger', 'acai', 'lanches', 'doces', 'bar', 'grill', 'espetinho', 'churrascaria', 'panificadora', 'confeitaria', 'cafe', 'sushi', 'distribuidora', 'pizza', 'marmitaria', 'sorvetes', 'e', 'do', 'da', 'de', 'dos', 'das']);
const tokens = s => norm(s).split(/[^a-z0-9]+/).filter(t => t.length >= 4 && !STOP.has(t));
const mentions = (store, text) => { const t = norm(text); const tk = tokens(store.name); return (tk.length ? tk : [norm(store.name)]).some(x => t.includes(x)) || (store.instagram && t.includes(norm(store.instagram))); };

function candidates(s) {
  const known = [s.website, s.orderUrl, ...(s.sources || [])].filter(u => u && !DIRECTORY.test(u) && !/wa\.me|whatsapp/.test(u));
  const out = [...new Set(known)].map(url => ({ url, from: 'cadastro' }));
  const ig = (s.instagram || '').replace(/^@/, '').trim();
  if (ig) ['https://linktr.ee/', 'https://bio.site/'].forEach(h => { const url = h + ig; if (!out.some(c => norm(c.url) === norm(url))) out.push({ url, from: 'mesmo @ do Instagram', guessed: true }); });
  return out;
}

async function visit(ctx, url) {
  const page = await ctx.newPage();
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const info = await page.evaluate(() => ({
      title: document.title,
      text: (document.body && document.body.innerText || '').slice(0, 4000),
      links: Array.from(document.querySelectorAll('a[href]')).map(a => ({ href: a.href, label: (a.innerText || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80) }))
    })).catch(() => ({ title: '', text: '', links: [] }));
    return { status: res ? res.status() : null, finalUrl: page.url(), ...info };
  } catch (e) { return { error: String(e.message || e).split('\n')[0] }; } finally { await page.context().close().catch(() => {}); }
}

async function auditStore(ctx, s) {
  const found = [], tried = [];
  for (const c of candidates(s)) {
    const v = await visit(ctx, c.url);
    const ok = !v.error && v.status && v.status < 400 && !/404|not found|page not found|isn.t available|não encontrad/i.test(v.title + ' ' + v.text.slice(0, 300));
    const named = ok && mentions(s, v.title + ' ' + v.text);
    tried.push({ url: c.url, from: c.from, status: v.status || v.error, finalUrl: v.finalUrl, named });
    if (!ok || (c.guessed && !named)) continue;
    const direct = kind(v.finalUrl);
    if (direct === 'cardapio' || direct === 'ifood') { found.push({ url: v.finalUrl, kind: direct, via: c.url, label: v.title }); continue; }
    // Links para o próprio serviço de link na bio (rodapé, blog, "crie o seu") não são da loja.
    const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
    const links = v.links.filter(l => /^https?:/.test(l.href) && host(l.href) !== host(v.finalUrl) && !/linktree|cookie|privacy/i.test(l.href));
    for (const l of links) {
      const k = kind(l.href);
      if (k === 'outro' && !/card[aá]pio|delivery|pedi|menu|pe[cç]a|loja/i.test(l.label)) continue;
      if (k === 'outro' && DIRECTORY.test(l.href)) continue;
      found.push({ url: l.href, kind: k, via: c.url, label: l.label });
    }
  }
  // Segue um nível: encurtadores e "outro" com rótulo de cardápio → onde de fato abrem.
  for (const f of found.filter(x => x.kind === 'bio' || x.kind === 'outro')) {
    const v = await visit(ctx, f.url);
    if (v.finalUrl) { f.opens = v.finalUrl; f.kind = kind(v.finalUrl) === 'bio' ? 'outro' : kind(v.finalUrl); f.title = v.title; }
  }
  const uniq = [...new Map(found.map(f => [(f.opens || f.url).replace(/[?#].*$/, ''), f])).values()];
  return { id: s.id, name: s.name, city: s.city, instagram: s.instagram || null, found: uniq, tried };
}

async function main() {
  const ids = process.argv.slice(2);
  const list = DB.filter(s => ids.length ? ids.includes(s.id) : !(s.menu && s.menu.length) && !(FONTES[s.id] && !FONTES[s.id].motivo));
  let pw; try { pw = require('playwright'); } catch (e) { pw = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); }
  const browser = await pw.chromium.launch();
  const ctx = { newPage: async () => (await browser.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, locale: 'pt-BR' })).newPage() };
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).lojas : {};
  const queue = list.slice(), result = Object.assign({}, prev);
  async function worker() {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const r = await Promise.race([auditStore(ctx, s), new Promise((_, no) => setTimeout(() => no(new Error('tempo esgotado')), 150000))])
        .catch(e => ({ id: s.id, name: s.name, city: s.city, error: String(e.message || e).split('\n')[0] }));
      result[s.id] = r;
      fs.writeFileSync(OUT, JSON.stringify({ geradoEm: new Date().toISOString(), lojas: result }, null, 1) + '\n');
      const best = (r.found || []).filter(f => f.kind === 'cardapio' || f.kind === 'ifood').map(f => f.opens || f.url);
      console.log(`${best.length ? 'CARDÁPIO' : (r.found || []).length ? 'links' : '-'}\t${s.id}\t${best.join(' ')}`);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
