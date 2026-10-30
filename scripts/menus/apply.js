#!/usr/bin/env node
/* Aplica os cardápios normalizados (data/research/cardapios/<id>.json + <id>.fotos.json) em data/establishments.json:
   menu (itens com seção, preço em centavos, preço cheio quando há promoção, foto e grupos de opções), menuSource,
   verifiedAt e, se a loja ainda não tiver, o horário publicado na plataforma. Substitui o cardápio anterior da loja.
   Uso: node scripts/menus/apply.js [id ...]   e depois: node scripts/build-data.js && npm test */
'use strict';
const fs = require('fs');
const path = require('path');
const core = require('../../js/core.js');
const L = require('./lib');

const ROOT = path.join(__dirname, '..', '..');
const DB = path.join(ROOT, 'data', 'establishments.json');
const DIR = path.join(ROOT, 'data', 'research', 'cardapios');
const LICENSE = 'Uso autorizado pelo estabelecimento parceiro';

function toMenu(store, snap, photos) {
  const nextId = L.idFactory();
  const items = [];
  snap.sections.forEach(sec => sec.items.forEach(it => {
    const item = { id: nextId(it.name), section: sec.name, name: it.name, description: it.description || '', priceCents: it.priceCents };
    if (it.originalPriceCents > it.priceCents) item.originalPriceCents = it.originalPriceCents;
    const ph = it.imageUrl && photos[it.imageUrl];
    if (ph) {
      item.image = { src: ph.src || ph.thumb, thumb: ph.thumb, alt: it.name + ' — ' + store.name, credit: store.name, license: LICENSE, sourceUrl: it.imageUrl };
      if (!ph.src) item.image.small = true;
    }
    if (it.options && it.options.length) {
      const gid = L.idFactory();
      item.options = it.options.map(g => {
        const cid = L.idFactory();
        return { id: gid(g.name), name: g.name, min: g.min, max: g.max, choices: g.choices.map(c => ({ id: cid(c.name), name: c.name, priceCents: c.priceCents })) };
      });
    }
    items.push(item);
  }));
  return items;
}

function main() {
  const only = process.argv.slice(2);
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const byId = new Map(db.establishments.map(s => [s.id, s]));
  const ids = fs.readdirSync(DIR).filter(f => /\.json$/.test(f) && !/\.fotos\.json$|^fontes\.json$/.test(f)).map(f => f.replace(/\.json$/, ''))
    .filter(id => !only.length || only.includes(id));
  ids.forEach(id => {
    const store = byId.get(id);
    if (!store) return console.log(`sem cadastro\t${id}`);
    const snap = JSON.parse(fs.readFileSync(path.join(DIR, id + '.json'), 'utf8'));
    const photosFile = path.join(DIR, id + '.fotos.json');
    const photos = fs.existsSync(photosFile) ? JSON.parse(fs.readFileSync(photosFile, 'utf8')) : {};
    store.menu = toMenu(store, snap, photos);
    store.menuSource = snap.source;
    if (!store.sources.includes(snap.source)) store.sources.push(snap.source);
    if (!store.hours && snap.hours) store.hours = snap.hours;
    store.verifiedAt = snap.capturedAt.slice(0, 10);
    console.log(`cardápio\t${id}\t${store.menu.length} itens`);
  });
  db.updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(DB, JSON.stringify(db, null, 2) + '\n');
}

main();
