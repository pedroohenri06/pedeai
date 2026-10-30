#!/usr/bin/env node
/* Relatório e validação dos cardápios importados (data/research/cardapios/RELATORIO.md).
   Para cada fonte de fontes.json: status, categorias, produtos, grupos de opções, adicionais, fotos e pendências.
   Checa: loja existe, itens com preço, fotos existentes e só na pasta da própria loja, ids e itens repetidos,
   cardápio gerado em data/menus. Sai com código 1 se algum cardápio importado tiver erro.
   Uso: node scripts/menus/report.js */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'data', 'research', 'cardapios');

function check(store, snap) {
  const errors = [], menu = store.menu;
  const ids = new Set(), names = new Set();
  let groups = 0, choices = 0, extras = 0, photos = 0, promos = 0, featured = 0;
  menu.forEach(m => {
    if (ids.has(m.id)) errors.push('id repetido: ' + m.id);
    ids.add(m.id);
    const key = [m.section, m.name.toLowerCase(), m.description, m.priceCents, JSON.stringify(m.options || [])].join('|');
    if (names.has(key)) errors.push('item repetido: ' + m.section + ' / ' + m.name);
    names.add(key);
    if (!(m.priceCents > 0)) errors.push('sem preço: ' + m.name);
    if (m.originalPriceCents) promos++;
    if (m.featured) featured++;
    (m.options || []).forEach(g => { groups++; choices += g.choices.length; if (!g.min) extras += g.choices.length; });
    if (m.image) {
      photos++;
      [m.image.src, m.image.thumb].forEach(f => {
        if (!f.startsWith('assets/menu/' + store.id + '/')) errors.push('foto fora da pasta da loja: ' + f);
        else if (!fs.existsSync(path.join(ROOT, f))) errors.push('foto ausente: ' + f);
      });
    }
  });
  const secs = new Set(menu.map(m => m.section));
  if (!fs.existsSync(path.join(ROOT, 'data', 'menus', store.id + '.json'))) errors.push('data/menus/' + store.id + '.json não gerado (rode build-data)');
  const sourceItems = new Set(snap.sections.flatMap(s => s.items.map(it => JSON.stringify([s.name, it.name, it.description, it.priceCents, it.options])))).size;
  if (sourceItems !== menu.length) errors.push(`itens distintos na fonte normalizada (${sourceItems}) ≠ itens no cadastro (${menu.length})`);
  return { categories: secs.size, products: menu.length, groups, choices, extras, photos, promos, featured, errors };
}

function main() {
  const fontes = JSON.parse(fs.readFileSync(path.join(DIR, 'fontes.json'), 'utf8')).fontes;
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'establishments.json'), 'utf8'));
  const byId = new Map(db.establishments.map(s => [s.id, s]));
  const rows = [], totals = { ok: 0, categories: 0, products: 0, groups: 0, extras: 0, photos: 0 };
  let failed = 0;
  Object.entries(fontes).forEach(([id, f]) => {
    const store = byId.get(id), snapFile = path.join(DIR, id + '.json');
    const row = { id, name: store ? store.name : id, city: store ? store.city : '', platform: f.platform, url: f.url };
    if (!store) row.status = 'ERRO: loja fora do cadastro';
    else if (fs.existsSync(snapFile)) {
      const snap = JSON.parse(fs.readFileSync(snapFile, 'utf8'));
      Object.assign(row, check(store, snap), { skipped: snap.skipped, notes: snap.notes, source: snap.source, capturedAt: snap.capturedAt });
      row.status = row.errors.length ? 'ERRO' : 'OK';
      if (row.errors.length) failed++; else totals.ok++;
      ['categories', 'products', 'groups', 'extras', 'photos'].forEach(k => { totals[k] += row[k]; });
    } else row.status = f.motivo ? 'Sem cardápio público' : 'Pendente';
    row.why = f.motivo || f.pendente || '';
    rows.push(row);
  });
  const order = { OK: 0, ERRO: 1, Pendente: 2, 'Sem cardápio público': 3 };
  rows.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
  const out = ['# Relatório de importação dos cardápios', '',
    `Gerado por \`node scripts/menus/report.js\` em ${new Date().toISOString().slice(0, 10)}. Fontes: \`data/research/cardapios/fontes.json\`.`, '',
    `**${totals.ok} cardápios importados** de ${rows.length} links de cardápio cadastrados · ${totals.categories} categorias · ${totals.products} produtos · ${totals.groups} grupos de opções · ${totals.extras} adicionais (opções opcionais) · ${totals.photos} fotos.`, '',
    '| Status | Restaurante | Cidade | Plataforma | Categorias | Produtos | Grupos | Adicionais | Fotos | Promoções | Destaques |', '|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|'];
  rows.filter(r => r.products != null).forEach(r => out.push(`| ${r.status} | ${r.name} | ${r.city} | ${r.platform} | ${r.categories} | ${r.products} | ${r.groups} | ${r.extras} | ${r.photos} | ${r.promos} | ${r.featured} |`));
  out.push('', '## Detalhes e pendências por restaurante', '');
  rows.forEach(r => {
    out.push(`### ${r.name} (${r.city || 'sem cidade'}) — ${r.status}`, '', `- Fonte: ${r.source || r.url} (${r.platform})`);
    if (r.products != null) {
      out.push(`- Categorias: ${r.categories} · Produtos: ${r.products} · Grupos de opções: ${r.groups} (${r.choices} escolhas) · Adicionais: ${r.extras} · Fotos: ${r.photos}`);
      const sk = Object.entries(r.skipped || {}).map(([k, v]) => `${v} ${k}`).join(', ');
      out.push(`- Não importados: ${sk || 'nenhum'}`);
      (r.notes || []).forEach(n => out.push('- Observação: ' + n));
      r.errors.forEach(e => out.push('- **Erro:** ' + e));
      out.push(`- Pendências: ${r.errors.length ? r.errors.length : 0}`);
    } else out.push(`- Motivo: ${r.why || 'coleta não realizada'}`);
    out.push('');
  });
  fs.writeFileSync(path.join(DIR, 'RELATORIO.md'), out.join('\n'));
  console.log(`${totals.ok} OK, ${failed} com erro · ${totals.products} produtos, ${totals.categories} categorias, ${totals.groups} grupos, ${totals.extras} adicionais, ${totals.photos} fotos`);
  rows.filter(r => r.status === 'ERRO').forEach(r => console.log('ERRO ' + r.id + ': ' + r.errors.slice(0, 3).join('; ')));
  if (failed) process.exit(1);
}

main();
