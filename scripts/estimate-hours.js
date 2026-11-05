#!/usr/bin/env node
/* Horário estimado para quem não tem horário publicado completo (marcado "a confirmar" na página da loja).

   Para cada loja sem grade confiável (sem `hours`, texto vago ou horário padrão `hoursEstimated`):
   1. aproveita o que o texto disser (dias, faixas, "a partir das 18h", "até 23h", "fechado às segundas", "almoço");
   2. completa o resto com o horário típico do tipo de negócio (perfis abaixo).
   Grava `schedule: { week, estimated: true, basis }` no cadastro. Loja com horário publicado completo não é tocada,
   e uma grade já confirmada (schedule sem `estimated`) nunca é sobrescrita.

   Uso: node scripts/estimate-hours.js [--dry] */
'use strict';
const fs = require('fs');
const path = require('path');
const core = require('../js/core.js');
const S = require('../js/schedule.js');

const DB = path.join(__dirname, '..', 'data', 'establishments.json');
const ALL = S.DAYS.slice();
const MON_SAT = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

/* Perfil de funcionamento pelo tipo de negócio (nome + tipo + categoria), na ordem: o primeiro que casar vale.
   Horários = o mais comum entre as lojas com horário publicado; noite segue a regra do dono do projeto
   (lanchonete/hamburgueria: Barra do Garças 18h às 0h, demais cidades 18h às 23h). */
const PROFILES = [
  { id: 'sorveteria', test: /sorvet|gelad|gelato|a[cç]a[ií]|milk ?shake|picol/, start: '13:00', end: '22:00', days: ALL },
  { id: 'sushi', test: /sushi|japon|temaki|oriental/, start: '18:30', end: '22:30', days: ALL },
  { id: 'noite', test: /pizz|lanch|hamburg|burg|espet|grill|chopp|choperia|\bbar\b|pastel|hot ?dog|petisc|esfih|cuscuz|frango frito|chicken|batata|x-|porç|porc/, start: '18:00', end: '23:00', days: ALL },
  { id: 'padaria', test: /padaria|panificadora|panific|cafeteria|\bcafe\b|conveni/, start: '06:00', end: '20:00', days: ALL },
  { id: 'confeitaria', test: /confeit|bolo|doce|brigadeir|brownie|cake|pudim|encomenda|pipoca|cookie|chocolate/, start: '08:00', end: '18:00', days: MON_SAT },
  { id: 'almoco', test: /marmit|restaurante|churrascaria|self.?service|comida|buffet|almo[cç]o|refei[cç]|cozinha|quilo/, start: '10:30', end: '14:00', days: MON_SAT },
  { id: 'noite', test: /.*/, start: '18:00', end: '23:00', days: ALL }
];
const profileOf = s => PROFILES.find(p => p.test.test(core.normalize([s.name, s.kind].join(' ')))) || PROFILES[PROFILES.length - 1];
const hoursFor = (s, p) => p.id === 'noite' && s.city === 'Barra do Garças' ? { start: '18:00', end: '24:00' } : { start: p.start, end: p.end };

function main() {
  const dry = process.argv.includes('--dry');
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const reliable = s => (s.schedule && s.schedule.week && !s.schedule.estimated) || (s.hours && !s.hoursEstimated && S.parseHours(s.hours));

  const stats = { estimadas: 0, mantidas: 0, porPerfil: {} };
  db.establishments.forEach(s => {
    if (reliable(s)) { stats.mantidas++; return; }
    const p = profileOf(s), t = hoursFor(s, p);
    const week = S.parseLoose(s.hoursEstimated ? null : s.hours, { days: p.days, start: t.start, end: t.end });
    const basis = (s.hours && !s.hoursEstimated ? 'texto do horário ("' + s.hours + '") completado com ' : '') +
      'horário típico de ' + p.id + ': ' + t.start + '–' + t.end;
    s.schedule = Object.assign({}, s.schedule || {}, { week, estimated: true, basis });
    stats.estimadas++; stats.porPerfil[p.id] = (stats.porPerfil[p.id] || 0) + 1;
  });
  if (!dry) fs.writeFileSync(DB, JSON.stringify(db, null, 2) + '\n');
  console.log(JSON.stringify(stats));
}

main();
