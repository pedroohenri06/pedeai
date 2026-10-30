#!/usr/bin/env node
/* Valida data/establishments.json e gera data/establishments.js (carregado pelo index.html)
   e data/STATUS.md (contagem por cidade e pendências). Uso: node scripts/build-data.js [--check] */
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

/* index.html carrega css/js/dados com ?v= do conteúdo atual (o de data/establishments.js vem de `js`, ainda não gravado). */
function renderIndex(html, js) {
  return html.replace(/(<(?:script|link)[^>]*(?:src|href)=")((?:js|css|data)\/[\w.-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")/g, (m, a, rel, b) =>
    a + rel + '?v=' + (rel === 'data/establishments.js' ? hashOf(js) : hashOf(fs.readFileSync(path.join(root, rel)))) + b);
}

/* O navegador não usa as notas internas de pesquisa (só o STATUS.md usa): ficam fora do arquivo carregado pelo site. */
function renderJs(db) {
  const establishments = db.establishments.map(({ notes, ...s }) => versionAssets(s));
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
  const js = renderJs(db), md = renderStatus(db), html = renderIndex(fs.readFileSync(indexHtml, 'utf8'), js);
  if (check) {
    const stale = [[outJs, js], [outMd, md], [indexHtml, html]].filter(([f, c]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== c);
    if (stale.length) {
      console.error('Arquivos gerados desatualizados. Rode: node scripts/build-data.js\n' + stale.map(s => ' - ' + path.relative(root, s[0])).join('\n'));
      process.exit(1);
    }
  } else {
    fs.writeFileSync(outJs, js);
    fs.writeFileSync(outMd, md);
    fs.writeFileSync(indexHtml, html);
  }
  const counts = core.countByCity(db.establishments);
  console.log(`${db.establishments.length} estabelecimentos válidos`);
  Object.entries(counts).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
}

if (require.main === module) main();
module.exports = { renderJs, renderStatus, renderIndex };
