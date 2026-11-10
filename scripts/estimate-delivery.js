#!/usr/bin/env node
/* Previsão de entrega estimada para quem não publicou o tempo em nenhuma plataforma (marcada "a confirmar").

   Tabela por segmento tirada dos tempos que as próprias lojas da região configuram no aiqfome, Mais Delivery e
   Anota AI (medianas de 05/11/2026: açaí 20–40, hambúrguer 35–45, espetinho 35–45, pizza 45–65, sushi 40–60,
   pastel 30–40, marmita 20–40), puxada para baixo onde a amostra é pequena ou destoa: no interior o pedido chega
   rápido. Barra do Garças (maior cidade, distâncias maiores) soma 5 minutos.
   Grava `deliveryTime: { minMinutes, maxMinutes, estimated: true, basis }`. Tempo publicado pela loja (com `source`)
   nunca é sobrescrito; estimativa anterior é recalculada.

   Uso: node scripts/estimate-delivery.js [--dry] */
'use strict';
const fs = require('fs');
const path = require('path');
const core = require('../js/core.js');

const DB = path.join(__dirname, '..', 'data', 'establishments.json');
const SEGMENTS = [ // o primeiro que casar com nome + tipo vale
  { id: 'pizza', test: /pizz/, min: 40, max: 60 },
  { id: 'açaí e sorveteria', test: /a[cç]a[ií]|sorvet|gelad|gelato|milk ?shake|picol/, min: 20, max: 35 },
  { id: 'sushi', test: /sushi|japon|temaki|oriental/, min: 40, max: 60 },
  { id: 'padaria e café', test: /padaria|panificadora|panific|cafeteria|\bcafe\b|conveni/, min: 20, max: 40 },
  { id: 'espetinho e churrasco', test: /espet|churras|grill|jantinha|steak|\bbrasa\b|carne/, min: 30, max: 45 },
  { id: 'pastel e salgados', test: /pastel|esfih|salgad|coxinha/, min: 30, max: 40 },
  { id: 'hambúrguer e lanches', test: /hamburg|burg|lanch|hot ?dog|sanduich|x-|prensad|frango frito|chicken|batata/, min: 30, max: 45 },
  { id: 'marmita e restaurante', test: /marmit|restaurante|self.?service|comida|buffet|almo[cç]o|refei[cç]|cozinha|quilo/, min: 25, max: 40 },
  { id: 'doces e confeitaria', test: /confeit|bolo|doce|brigadeir|brownie|cake|pudim|encomenda|pipoca|cookie|chocolate/, min: 25, max: 40 }
];
const BY_CATEGORY = { 'Pizza': 0, 'Açaí': 1, 'Sushi': 2, 'Padaria': 3, 'Churrasco': 4, 'Pastel': 5, 'Hambúrguer': 6, 'Brasileira': 7, 'Saudável': 7, 'Doces': 8 };
const segmentOf = s => SEGMENTS.find(x => x.test.test(core.normalize([s.name, s.kind].join(' ')))) || SEGMENTS[BY_CATEGORY[s.category] == null ? 5 : BY_CATEGORY[s.category]];

function main() {
  const dry = process.argv.includes('--dry');
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const stats = { estimadas: 0, publicadas: 0, porSegmento: {} };
  db.establishments.forEach(s => {
    if (s.deliveryTime && !s.deliveryTime.estimated) { stats.publicadas++; return; }
    const seg = segmentOf(s), extra = s.city === 'Barra do Garças' ? 5 : 0;
    s.deliveryTime = { minMinutes: seg.min + extra, maxMinutes: seg.max + extra, estimated: true,
      basis: 'média de ' + seg.id + ' nas plataformas da região' + (extra ? ' (+5 min em Barra do Garças)' : '') };
    stats.estimadas++; stats.porSegmento[seg.id] = (stats.porSegmento[seg.id] || 0) + 1;
  });
  if (!dry) fs.writeFileSync(DB, JSON.stringify(db, null, 2) + '\n');
  console.log(JSON.stringify(stats));
}

main();
