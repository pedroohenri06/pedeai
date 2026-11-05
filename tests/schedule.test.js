'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/schedule.js');

// 05/11/2026 é quinta-feira; horários em Cuiabá (UTC−4). `at` cria o instante no fuso da loja.
const at = iso => new Date(iso + '-04:00');
const sched = (week, extra) => Object.assign({ tz: 'America/Cuiaba', week }, extra || {});
const WEEK = { qui: ['18:00-23:00'], sex: ['18:00-23:00'], sab: ['18:00-23:00'] };

test('aberto dentro do horário cadastrado', () => {
  const st = S.status(sched(WEEK), at('2026-11-06T19:00:00'));
  assert.equal(st.state, 'open');
  assert.equal(st.label, 'Aberto');
  assert.equal(st.detail, 'Fecha às 23h');
});

test('fechado fora do horário, com a próxima abertura', () => {
  const st = S.status(sched(WEEK), at('2026-11-06T23:30:00'));
  assert.equal(st.state, 'closed');
  assert.equal(st.label, 'Fechado');
  assert.equal(st.detail, 'Abre amanhã às 18h');
  assert.equal(st.short, 'Amanhã 18h');
});

test('abre mais tarde no mesmo dia', () => {
  assert.equal(S.status(sched(WEEK), at('2026-11-06T10:00:00')).detail, 'Abre às 18h');
});

test('próxima abertura em outro dia da semana', () => {
  const st = S.status(sched({ ter: ['18:00-23:00'] }), at('2026-11-06T19:00:00'));
  assert.equal(st.state, 'closed');
  assert.equal(st.detail, 'Abre ter. às 18h');
  assert.equal(st.short, 'Ter. 18h');
});

test('dois turnos no mesmo dia', () => {
  const s = sched({ sex: ['11:00-14:00', '18:00-23:00'] });
  assert.deepEqual([S.status(s, at('2026-11-06T12:00:00')).state, S.status(s, at('2026-11-06T12:00:00')).detail], ['open', 'Fecha às 14h']);
  assert.deepEqual([S.status(s, at('2026-11-06T15:00:00')).state, S.status(s, at('2026-11-06T15:00:00')).detail], ['closed', 'Abre às 18h']);
  assert.equal(S.status(s, at('2026-11-06T20:00:00')).state, 'open');
});

test('funcionamento que atravessa a meia-noite', () => {
  const s = sched({ qui: ['18:00-02:00'] });
  const late = S.status(s, at('2026-11-06T01:30:00'));          // sexta 1h30, turno de quinta
  assert.equal(late.state, 'open');
  assert.equal(late.detail, 'Fecha às 2h');
  assert.equal(S.status(s, at('2026-11-06T02:30:00')).state, 'closed');
  assert.equal(S.status(s, at('2026-11-05T23:00:00')).state, 'open');
});

test('pausa temporária nos pedidos', () => {
  const s = sched(WEEK, { pausedUntil: '2026-11-06T21:30:00-04:00' });
  const st = S.status(s, at('2026-11-06T20:00:00'));
  assert.equal(st.state, 'paused');
  assert.equal(st.label, 'Pausado');
  assert.equal(st.detail, 'Volta às 21h30');
  assert.equal(S.status(s, at('2026-11-06T21:45:00')).state, 'open'); // a pausa acabou
});

test('horário especial e feriado (exceções por data)', () => {
  const holiday = sched(WEEK, { exceptions: { '2026-11-06': [] } });
  assert.equal(S.status(holiday, at('2026-11-06T19:00:00')).state, 'closed');
  assert.equal(S.status(holiday, at('2026-11-06T19:00:00')).detail, 'Abre amanhã às 18h');
  const special = sched(WEEK, { exceptions: { '2026-11-06': ['10:00-12:00'] } });
  assert.equal(S.status(special, at('2026-11-06T11:00:00')).state, 'open');
  assert.equal(S.status(special, at('2026-11-06T19:00:00')).state, 'closed');
});

test('fechado temporariamente até uma data', () => {
  const s = sched(WEEK, { closedUntil: '2026-11-07' });
  const st = S.status(s, at('2026-11-06T19:00:00'));
  assert.equal(st.state, 'closed');
  assert.equal(st.detail, 'Abre qui. às 18h');                    // sexta e sábado fechados; volta na quinta seguinte
});

test('sem horário cadastrado ou horário estimado: sem status', () => {
  assert.equal(S.status(null).state, 'unknown');
  assert.equal(S.fromStore({ hours: null }), null);
  assert.equal(S.fromStore({ hours: 'Todos os dias, 18h às 23h', hoursEstimated: true }), null);
  assert.equal(S.fromStore({ hours: 'Segunda a sábado' }), null);   // sem horário: ambíguo
  assert.equal(S.fromStore({ hours: '15h às 22h30' }), null);       // sem dias: ambíguo
});

test('alteração de horário reflete no status', () => {
  const store = { hours: 'Todos os dias, 18h às 23h' };
  const now = at('2026-11-06T12:00:00');
  assert.equal(S.status(S.fromStore(store), now).state, 'closed');
  store.hours = 'Todos os dias, 10h às 14h';
  assert.equal(S.status(S.fromStore(store), now).state, 'open');
  store.schedule = { week: { sex: ['11:30-12:30'] }, exceptions: { '2026-11-06': [] } };
  assert.equal(S.status(S.fromStore(store), now).state, 'closed');  // grade explícita + exceção prevalecem
});

test('status usa o fuso da loja, não o do aparelho', () => {
  const instant = new Date('2026-11-07T01:30:00Z');                 // sexta 21h30 em Cuiabá, sábado 1h30 em UTC
  assert.equal(S.status(sched(WEEK), instant).state, 'open');
  assert.equal(S.today('America/Cuiaba', instant), 'sex');
});

test('texto de horário vira grade', () => {
  assert.deepEqual(S.parseHours('Seg a Sex 18h às 23h · Sáb 18h às 0h'), {
    seg: ['18:00-23:00'], ter: ['18:00-23:00'], qua: ['18:00-23:00'], qui: ['18:00-23:00'], sex: ['18:00-23:00'], sab: ['18:00-24:00']
  });
  assert.deepEqual(Object.keys(S.parseHours('Sexta a quarta, 18h às 23h')).sort(), ['dom', 'qua', 'sab', 'seg', 'sex', 'ter']);
  assert.equal(S.parseHours('18h às 23h, fechado às quartas').qua, undefined);
  assert.deepEqual(S.parseHours('Seg a Sáb 10h–14h e 18h–22h').sab, ['10:00-14:00', '18:00-22:00']);
  assert.deepEqual(S.parseHours('Todos os dias, 18h–2h').dom, ['18:00-02:00']);
  assert.equal(S.parseHours('A partir das 18h, segundo bio do Instagram'), null);
  assert.equal(S.parseHours('Seg a sáb, almoço'), null);
});

test('grade da semana para a página da loja', () => {
  const rows = S.weekRows(sched({ seg: ['18:00-23:59'], sex: ['11:00-14:00', '18:00-02:00'] }));
  assert.equal(rows.length, 7);
  assert.deepEqual(rows[0], { day: 'Segunda', key: 'seg', text: '18h às 0h' });
  assert.equal(rows[4].text, '11h às 14h e 18h às 2h');
  assert.equal(rows[1].text, 'Fechado');
});

test('previsão de entrega: total, preparo + entrega, e sem dado', () => {
  assert.deepEqual(S.deliveryEstimate({ deliveryTime: { minMinutes: 30, maxMinutes: 45 } }), { min: 30, max: 45, label: '30–45 min' });
  assert.equal(S.deliveryEstimate({ deliveryTime: { prepMinutes: [15, 20], deliveryMinutes: [15, 25] } }).label, '30–45 min');
  assert.equal(S.deliveryEstimate({ deliveryTime: { minMinutes: 40, maxMinutes: 40 } }).label, '40 min');
  assert.equal(S.deliveryEstimate({}), null);
  assert.equal(S.deliveryEstimate({ deliveryTime: { minMinutes: 50, maxMinutes: 30 } }), null);
  assert.equal(S.deliveryEstimate({ deliveryTime: { prepMinutes: 20 } }), null);   // só preparo não é o tempo total
});
