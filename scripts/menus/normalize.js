#!/usr/bin/env node
/* Converte as coletas (data/research/cardapios/bruto/<id>) no formato normalizado (data/research/cardapios/<id>.json),
   usando o leitor da plataforma em scripts/menus/adapters. Uso: node scripts/menus/normalize.js [id ...] */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'research', 'cardapios');
const RAW = path.join(DIR, 'bruto');

function adapter(platform) {
  const file = path.join(__dirname, 'adapters', platform + '.js');
  return fs.existsSync(file) ? require(file) : null;
}

function main() {
  const only = process.argv.slice(2);
  const ids = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter(id => !only.length || only.includes(id)) : [];
  for (const id of ids) {
    const meta = JSON.parse(fs.readFileSync(path.join(RAW, id, 'meta.json'), 'utf8'));
    const parse = adapter(meta.platform);
    if (!parse) { console.log(`sem leitor\t${meta.platform}\t${id}`); continue; }
    if (meta.blocked || meta.error) { console.log(`sem coleta\t${meta.platform}\t${id}`); continue; }
    const read = f => { const p = path.join(RAW, id, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
    try {
      const snap = parse({ meta, html: read('page.html'), responses: JSON.parse(read('responses.json') || '[]') });
      const items = snap.sections.reduce((n, s) => n + s.items.length, 0);
      if (!items) { console.log(`vazio\t${meta.platform}\t${id}`); continue; }
      fs.writeFileSync(path.join(DIR, id + '.json'), JSON.stringify(snap, null, 2) + '\n');
      console.log(`ok\t${meta.platform}\t${id}\t${snap.sections.length} seções, ${items} itens, ${snap.sections.reduce((n, s) => n + s.items.filter(i => i.imageUrl).length, 0)} fotos`);
    } catch (e) {
      console.log(`ERRO\t${meta.platform}\t${id}\t${e.message}`);
    }
  }
}

main();
