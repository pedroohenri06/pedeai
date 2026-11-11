#!/usr/bin/env node
/* Calcula a ordem da listagem de cada cidade e grava em establishments.json (campo "rank": 1 = primeiro da cidade).
   Critérios (data/research/ordem-da-listagem.json tem os destaques escolhidos à mão):
   1. Destaques (featured), na ordem do arquivo de destaques.
   2. Pontuação = qualidade da imagem + popularidade (seguidores no Instagram) + pedido online.
      As primeiras posições depois dos destaques não aceitam imagem marcada como fraca (imagemFraca); depois elas se
      misturam ao resto pela pontuação, sem ficar todas juntas no fim. Sem imagem própria vai para o fim.
   Uso: node scripts/rank-stores.js && node scripts/build-data.js */
'use strict';
const fs = require('fs');
const path = require('path');
const core = require('../js/core.js');

const root = path.join(__dirname, '..');
const dbFile = path.join(root, 'data', 'establishments.json');
const curated = JSON.parse(fs.readFileSync(path.join(root, 'data', 'research', 'ordem-da-listagem.json'), 'utf8'));
const TOP_SEM_LOGO_FRACA = 6;

/* Seguidores: maior valor registrado nos arquivos de pesquisa (campo "seguidores"). */
function followers() {
  const out = {};
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    if (!e.name.endsWith('.json')) return;
    let d; try { d = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (err) { return; }
    const rows = Array.isArray(d) ? d : (d && Array.isArray(d.lojas) ? d.lojas : []);
    rows.forEach(l => {
      if (l && l.instagram && Number.isInteger(l.seguidores)) {
        const k = l.instagram.toLowerCase();
        out[k] = Math.max(out[k] || 0, l.seguidores);
      }
    });
  });
  walk(path.join(root, 'data', 'research'));
  return out;
}

/* 3 = logo boa; 2 = só foto; 1,4 = logo ou foto marcada como fraca na curadoria; 0 = sem imagem própria. */
function quality(s, weak) {
  if (!s.logo && !s.image) return 0;
  if (weak.has(s.id)) return 1.4;
  return s.logo ? 3 : 2;
}

function popularity(s, fol) {
  const f = fol[(s.instagram || '').toLowerCase()];
  if (!f) return 0.6;
  return Math.max(0, Math.min(1.5, Math.log10(f) - 2.5));
}

function main() {
  const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  const fol = followers();
  const featured = curated.destaques || {};
  const weak = new Set(Object.values(curated.imagemFraca || {}).flat());
  core.CITIES.forEach(city => {
    const list = db.establishments.filter(s => s.city === city);
    const top = (featured[city] || []).map(id => list.find(s => s.id === id)).filter(Boolean);
    const rest = list.filter(s => !top.includes(s)).map(s => {
      const q = quality(s, weak);
      const score = q + 1.3 * popularity(s, fol) + (core.canOrder(s) ? 1 : 0) + (s.whatsapp ? 0.3 : 0) - (s.confidence === 'baixa' ? 1 : 0);
      return { s, q, score };
    }).sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name, 'pt-BR'));
    const order = top.slice();
    const pending = rest.slice();
    while (order.length < top.length + TOP_SEM_LOGO_FRACA && pending.length) {
      const i = pending.findIndex(x => x.q >= 2);
      if (i < 0) break;
      order.push(pending.splice(i, 1)[0].s);
    }
    /* Depois do topo, as de imagem fraca se espalham por igual entre as boas (nunca duas seguidas no começo nem todas
       no fim); sem imagem própria vai por último. */
    const good = pending.filter(x => x.q >= 2).map(x => x.s);
    const fraca = pending.filter(x => x.q > 0 && x.q < 2).map(x => x.s);
    const total = good.length + fraca.length;
    const slots = fraca.map((_, k) => Math.round((k + 1) * (total + 1) / (fraca.length + 1)) - 1);
    for (let i = 0, g = 0, f = 0; i < total; i++) order.push(slots[f] === i || g >= good.length ? fraca[f++] : good[g++]);
    pending.filter(x => x.q === 0).forEach(x => order.push(x.s));
    order.forEach((s, i) => {
      s.rank = i + 1;
      if (top.includes(s)) s.featured = true; else delete s.featured;
    });
  });
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2) + '\n');
  core.CITIES.forEach(city => {
    const first = db.establishments.filter(s => s.city === city).sort((a, b) => a.rank - b.rank).slice(0, 8).map(s => s.name);
    console.log(`${city}: ${first.join(' · ')}`);
  });
}

if (require.main === module) main();
module.exports = { quality };
