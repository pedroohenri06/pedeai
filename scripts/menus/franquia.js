#!/usr/bin/env node
/* Cardápio universal de franquia: data/research/cardapios/franquias/<franquia>.js monta as seções (um produto por
   sabor, tamanho como escolha) a partir do cardápio digital de uma unidade de referência. Este script grava o mesmo
   cardápio como snapshot de cada loja indicada (data/research/cardapios/<id>.json, platform "franquia") e registra a
   fonte em fontes.json. Regra do Pedro (10/11/2026): só para unidades SEM cardápio digital próprio; se a unidade tiver
   cardápio digital, ele vale (pode ter itens a mais).
   Uso: node scripts/menus/franquia.js <franquia> <id> [<id> ...]   → depois images.py <ids> e apply.js <ids> */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'data', 'research', 'cardapios');
const [name, ...ids] = process.argv.slice(2);
if (!name || !ids.length) { console.error('Uso: node scripts/menus/franquia.js <franquia> <id> [<id> ...]'); process.exit(1); }
const universal = require(path.join(DIR, 'franquias', name + '.js'));
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'establishments.json'), 'utf8')).establishments;
const fontesFile = path.join(DIR, 'fontes.json'), fontesRaw = JSON.parse(fs.readFileSync(fontesFile, 'utf8'));
ids.forEach(id => {
  const s = db.find(x => x.id === id);
  if (!s) { console.log(`não existe\t${id}`); return; }
  const f = fontesRaw.fontes[id];
  if (f && f.platform !== 'franquia' && !f.motivo) { console.log(`tem cardápio próprio (${f.platform})\t${id}`); return; }
  const snap = { id, platform: 'franquia', source: universal.source, capturedAt: new Date().toISOString(), hours: null,
    sections: JSON.parse(JSON.stringify(universal.sections)), skipped: {}, notes: [universal.note] };
  fs.writeFileSync(path.join(DIR, id + '.json'), JSON.stringify(snap, null, 2) + '\n');
  fontesRaw.fontes[id] = { url: universal.source, platform: 'franquia', via: `cardápio universal da franquia (${name}); ${universal.note}` };
  console.log(`ok\t${id}\t${snap.sections.reduce((n, x) => n + x.items.length, 0)} itens`);
});
fs.writeFileSync(fontesFile, JSON.stringify(fontesRaw, null, 2) + '\n');
