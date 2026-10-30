#!/usr/bin/env node
/* Valida data/establishments.json e gera data/establishments.js (carregado pelo index.html), um arquivo por cardápio
   em data/menus/<id>.json (carregado só quando a página da loja abre) e data/STATUS.md (contagem por cidade e
   pendências). Uso: node scripts/build-data.js [--check] */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const core = require('../js/core.js');
const { validateEstablishments } = require('./validate.js');

const root = path.join(__dirname, '..');
const src = path.join(root, 'data', 'establishments.json');
const outJs = path.join(root, 'data', 'establishments.js');
const outMd = path.join(root, 'data', 'STATUS.md');
const indexHtml = path.join(root, 'index.html');
const menusDir = path.join(root, 'data', 'menus');
const previewHtml = path.join(root, 'cardapios.html');

/* Versão pelo conteúdo (?v=hash): quando um arquivo muda, o endereço muda e o navegador baixa o novo
   em vez de mostrar o que guardou em cache (logo trocada com o mesmo nome de arquivo, por exemplo). */
const hashOf = buf => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
function versioned(rel) {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? rel + '?v=' + hashOf(fs.readFileSync(file)) : rel;
}
function versionAssets(value) {
  if (typeof value === 'string') return /^assets\/[^?]+\.(webp|png|jpe?g|svg)$/.test(value) ? versioned(value) : value;
  if (Array.isArray(value)) return value.map(versionAssets);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, versionAssets(v)]));
  return value;
}

/* index.html e cardapios.html (prévia interna dos cardápios) carregam css/js/dados com ?v= do conteúdo atual (o de data/establishments.js vem de `js`, ainda não gravado). */
function renderIndex(html, js) {
  return html.replace(/(<(?:script|link)[^>]*(?:src|href)=")((?:js|css|data)\/[\w.-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")/g, (m, a, rel, b) =>
    a + rel + '?v=' + (rel === 'data/establishments.js' ? hashOf(js) : hashOf(fs.readFileSync(path.join(root, rel)))) + b);
}

/* Cardápios ficam fora do arquivo da listagem: data/menus/<id>.json, baixado quando a loja abre. A listagem leva só
   menuCount, menuSearch (nomes dos pratos, para a busca da home) e menuFile (com ?v= do conteúdo). */
function renderMenus(db) {
  const files = {};
  db.establishments.forEach(s => {
    if (s.menu.length) files[s.id + '.json'] = JSON.stringify(versionAssets(s.menu)) + '\n';
  });
  return files;
}

/* O navegador não usa as notas internas de pesquisa (só o STATUS.md usa): ficam fora do arquivo carregado pelo site. */
function renderJs(db, menus) {
  menus = menus || renderMenus(db);
  const establishments = db.establishments.map(({ notes, ...s }) => {
    const out = versionAssets(s);
    const file = menus[s.id + '.json'];
    if (file) {
      out.menuCount = s.menu.length;
      out.menuSearch = Array.from(new Set(s.menu.map(m => m.name))).join(' · ');
      out.menuFile = 'data/menus/' + s.id + '.json?v=' + hashOf(file);
      out.menu = [];
    }
    return out;
  });
  return '/* Gerado por scripts/build-data.js a partir de data/establishments.json — não edite à mão. */\n' +
    'window.PEDEAI_DATA=' + JSON.stringify(Object.assign({}, db, { establishments })) + ';\n';
}

function renderStatus(db) {
  const list = db.establishments;
  const target = db.targetPerCity || 20;
  const lines = ['# Status do cadastro de estabelecimentos', '',
    `Gerado por \`scripts/build-data.js\`. Base atualizada em ${db.updatedAt}.`, '',
    `Meta: ${target} por cidade (${target * core.CITIES.length} no total). Cadastrados: **${list.length}**.`, '',
    '| Cidade | Cadastrados | Faltam p/ meta | WhatsApp verificado | Com cardápio | Pedido online ativo |',
    '|---|---:|---:|---:|---:|---:|'];
  core.CITIES.forEach(city => {
    const c = list.filter(s => s.city === city);
    lines.push(`| ${city} | ${c.length} | ${Math.max(0, target - c.length)} | ${c.filter(s => s.whatsapp).length} | ${c.filter(s => s.menu.length).length} | ${c.filter(core.canOrder).length} |`);
  });
  lines.push(`| **Total** | **${list.length}** | **${Math.max(0, target * core.CITIES.length - list.length)}** | **${list.filter(s => s.whatsapp).length}** | **${list.filter(s => s.menu.length).length}** | **${list.filter(core.canOrder).length}** |`);
  lines.push('', '## Pendências por estabelecimento', '');
  core.CITIES.forEach(city => {
    const pend = list.filter(s => s.city === city).map(s => {
      const p = [];
      if (!s.whatsapp) p.push('WhatsApp não verificado');
      if (!s.menu.length) p.push('cardápio pendente');
      if (!s.image && !s.logo) p.push('foto própria pendente (usa imagem ilustrativa da categoria)');
      else if (!s.image) p.push('foto de capa pendente (página usa o logotipo sobre o degradê da marca)');
      if (!s.address) p.push('endereço pendente');
      if (s.notes) p.push(s.notes);
      return p.length ? `- **${s.name}** — ${p.join('; ')}` : null;
    }).filter(Boolean);
    if (pend.length) lines.push(`### ${city}`, '', ...pend, '');
  });
  return lines.join('\n') + '\n';
}

function main() {
  const check = process.argv.includes('--check');
  const db = JSON.parse(fs.readFileSync(src, 'utf8'));
  const errors = validateEstablishments(db.establishments);
  if (errors.length) {
    console.error('Cadastro inválido:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  const menus = renderMenus(db), js = renderJs(db, menus), md = renderStatus(db), html = renderIndex(fs.readFileSync(indexHtml, 'utf8'), js);
  const preview = renderIndex(fs.readFileSync(previewHtml, 'utf8'), js);
  const menuPairs = Object.entries(menus).map(([f, c]) => [path.join(menusDir, f), c]);
  const orphans = fs.existsSync(menusDir) ? fs.readdirSync(menusDir).filter(f => !menus[f]).map(f => path.join(menusDir, f)) : [];
  if (check) {
    const stale = [[outJs, js], [outMd, md], [indexHtml, html], [previewHtml, preview]].concat(menuPairs).filter(([f, c]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== c)
      .concat(orphans.map(f => [f]));
    if (stale.length) {
      console.error('Arquivos gerados desatualizados. Rode: node scripts/build-data.js\n' + stale.map(s => ' - ' + path.relative(root, s[0])).join('\n'));
      process.exit(1);
    }
  } else {
    fs.writeFileSync(outJs, js);
    fs.writeFileSync(outMd, md);
    fs.writeFileSync(indexHtml, html);
    fs.writeFileSync(previewHtml, preview);
    fs.mkdirSync(menusDir, { recursive: true });
    menuPairs.forEach(([f, c]) => { if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== c) fs.writeFileSync(f, c); });
    orphans.forEach(f => fs.unlinkSync(f));
  }
  const counts = core.countByCity(db.establishments);
  console.log(`${db.establishments.length} estabelecimentos válidos`);
  Object.entries(counts).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
}

if (require.main === module) main();
module.exports = { renderJs, renderMenus, renderStatus, renderIndex };
