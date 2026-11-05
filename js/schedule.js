/* PedeAi — horários de funcionamento e previsão de entrega (módulo único: navegador, build e testes).

   Grade estruturada (campo `schedule` do estabelecimento; o build deriva `week` do texto `hours` quando ele é claro):
     {
       "tz": "America/Cuiaba",                         fuso da loja (MT: UTC−4, sem horário de verão)
       "week": { "seg": ["18:00-23:00"], "sex": ["11:00-14:00", "18:00-02:00"], ... }
                                                       vários turnos por dia; fim menor que o início = passa da meia-noite
       "exceptions": { "2026-12-25": [], "2026-12-24": ["18:00-21:00"] },
                                                       feriado/horário especial: substitui o dia da semana ([] = fechado)
       "closedUntil": "2026-11-20",                    fechado temporariamente até a data (inclusive)
       "pausedUntil": "2026-11-05T21:30:00-04:00"      pausa nos pedidos até o instante
     }
   Sem grade confiável (texto vago, horário estimado), não há status: o card não mostra aberto/fechado.

   Previsão de entrega (campo `deliveryTime`): { minMinutes, maxMinutes, source } — tempo total para o cliente receber —
   ou { prepMinutes, deliveryMinutes } (número ou [mín, máx]), somados uma vez só. Sem dado, sem previsão. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PedeAiSchedule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];          // índice = Date#getDay
  var DAY_LABEL = { dom: 'dom.', seg: 'seg.', ter: 'ter.', qua: 'qua.', qui: 'qui.', sex: 'sex.', sab: 'sáb.' };
  var DAY_NAME = { dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado' };
  var DEFAULT_TZ = 'America/Cuiaba';
  var TZ_FALLBACK = { 'America/Cuiaba': -240, 'America/Campo_Grande': -240, 'America/Sao_Paulo': -180 };

  /* ---------------- Texto → grade ---------------- */

  var DAY_WORD = /^(seg(?:unda)?s?(?:-feira)?|ter(?:c|ç)?a?s?(?:-feira)?|qua(?:rta)?s?(?:-feira)?|qui(?:nta)?s?(?:-feira)?|sex(?:ta)?s?(?:-feira)?|sab(?:ado)?s?|dom(?:ingo)?s?)$/;
  var TIME = '(\\d{1,2})(?:[:h](\\d{2}))?\\s*h?';
  var RANGE = new RegExp(TIME + '\\s*(?:–|—|-|as|a|ate)\\s*' + TIME, 'g');
  var COMMENT = /segundo|ifood|post\b|instagram|facebook|diretorio|indica|aprox|confirmar/;

  function fold(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function dayOf(word) { var m = DAY_WORD.exec(word); return m ? DAYS[['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].indexOf(word.slice(0, 3))] : null; }
  function span(a, b) { var i = DAYS.indexOf(a), out = []; for (var k = 0; k < 7; k++) { var d = DAYS[(i + k) % 7]; out.push(d); if (d === b) break; } return out; }
  function hm(h, m) { return (Number(h) * 60) + (m ? Number(m) : 0); }
  function clock(min) { min = ((min % 1440) + 1440) % 1440; return ('0' + Math.floor(min / 60)).slice(-2) + ':' + ('0' + (min % 60)).slice(-2); }

  /* Dias de um trecho: "seg a sex", "sexta a quarta" (vira a semana), "sab, dom e feriado", "todos os dias".
     Devolve null se sobrar palavra desconhecida (texto ambíguo não vira grade). */
  function daysOf(text) {
    var t = ' ' + text.replace(/[,()]/g, ' ').replace(/\s+/g, ' ') + ' ';
    if (/ (todos os dias|diariamente|seg(unda)? a seg(unda)?) /.test(t)) return DAYS.slice();
    t = t.replace(/ (e )?feriados? /g, ' ');
    for (var prev = ''; prev !== t;) { prev = t; t = t.replace(/ (delivery|jantar|almoco|janta|das|de|do|abre|aberto|funcionamento|horario|entrega|e|as|ate) /g, function (m, w) { return w === 'ate' ? ' a ' : ' '; }); }
    var words = t.trim().split(' ').filter(Boolean), out = [];
    for (var i = 0; i < words.length; i++) {
      var d = dayOf(words[i]);
      if (!d) { if (words[i] === 'a') continue; return null; }
      if (words[i + 1] === 'a' && dayOf(words[i + 2] || '')) { span(d, dayOf(words[i + 2])).forEach(function (x) { out.push(x); }); i += 2; }
      else out.push(d);
    }
    return out;
  }

  function parseHours(text) {
    if (!text) return null;
    var t = fold(text).replace(/\([^)]*\)/g, ' ').replace(/24 horas/g, '0h-24h'), week = {}, closed = [], any = false, loose = [];
    var segs = t.split(/\s*(?:·|;|\.\s|\|)\s*/).filter(function (s) { return s.trim() && !COMMENT.test(s); });
    if (!segs.length) return null;
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i], ranges = [];
      seg = seg.replace(/fechad[oa]s? (?:aos|ao|as|nas|nos|na|no|de|em|a)? ?([a-z\- ,]+)/, function (m, days) {
        days.split(/[\s,]+/).forEach(function (w) { var d = dayOf(w); if (d) closed.push(d); }); return ' ';
      });
      seg = seg.replace(RANGE, function (m, h1, m1, h2, m2) {
        var s = hm(h1, m1), e = hm(h2, m2);
        if (Number(h1) > 24 || Number(h2) > 24 || Number(m1 || 0) > 59 || Number(m2 || 0) > 59) return m;
        if (e <= s) e += 1440;
        if (e - s < 15 || e - s > 1440) return m;
        ranges.push(clock(s) + '-' + (e === 1440 ? '24:00' : clock(e)));
        return ' ';
      });
      if (/\d/.test(seg)) return null;                                    // horário que não virou faixa: ambíguo
      var days = daysOf(seg.trim());
      if (!ranges.length) { if (days && !days.length) continue; return null; }
      if (days === null) return null;
      any = true;
      if (!days.length) { loose.push.apply(loose, ranges); continue; }
      days.forEach(function (d) { week[d] = (week[d] || []).concat(ranges); });
    }
    if (!any) return null;
    if (loose.length) {                                                    // faixa sem dias só vale com "fechado às X"
      if (Object.keys(week).length || !closed.length) return null;
      DAYS.forEach(function (d) { week[d] = loose.slice(); });
    }
    closed.forEach(function (d) { delete week[d]; });
    return Object.keys(week).length ? week : null;
  }

  /* ---------------- Hora local da loja ---------------- */

  function localParts(now, tz) {
    tz = tz || DEFAULT_TZ;
    try {
      var p = {};
      new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(now).forEach(function (x) { p[x.type] = x.value; });
      return { y: +p.year, m: +p.month, d: +p.day, min: (+p.hour % 24) * 60 + +p.minute };
    } catch (e) {
      var shifted = new Date(now.getTime() + (TZ_FALLBACK[tz] == null ? -240 : TZ_FALLBACK[tz]) * 60000);
      return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth() + 1, d: shifted.getUTCDate(), min: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
    }
  }

  function dayAt(parts, offset) {
    var dt = new Date(Date.UTC(parts.y, parts.m - 1, parts.d + offset));
    return { iso: dt.toISOString().slice(0, 10), dow: DAYS[dt.getUTCDay()] };
  }

  function toMinutes(range) {
    var m = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(range);
    if (!m) return null;
    var s = hm(m[1], m[2]), e = hm(m[3], m[4]);
    if (e <= s) e += 1440;
    return [s, e];
  }

  function rangesOn(schedule, day) {
    var ex = schedule.exceptions && schedule.exceptions[day.iso];
    var list = ex !== undefined ? ex : (schedule.week && schedule.week[day.dow]) || [];
    return list.map(toMinutes).filter(Boolean).sort(function (a, b) { return a[0] - b[0]; });
  }

  function isValid(schedule) {
    if (!schedule || typeof schedule !== 'object' || !schedule.week) return false;
    return Object.keys(schedule.week).every(function (d) { return DAYS.indexOf(d) > -1 && Array.isArray(schedule.week[d]) && schedule.week[d].every(function (r) { return toMinutes(r); }); }) &&
      Object.keys(schedule.exceptions || {}).every(function (k) { return /^\d{4}-\d{2}-\d{2}$/.test(k) && schedule.exceptions[k].every(function (r) { return toMinutes(r); }); });
  }

  /* ---------------- Status ---------------- */

  function hourLabel(min) { min = ((min % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return h + 'h' + (m ? ('0' + m).slice(-2) : ''); }
  /* Fim de turno "23:59" / "22:59" (como muitos painéis gravam a virada da hora) aparece como a hora cheia. */
  function endLabel(min) { return hourLabel(min % 60 === 59 ? min + 1 : min); }

  /* { state: 'open' | 'closed' | 'paused' | 'unknown', closesAt, next: { offset, minutes, dow }, label, detail } */
  function status(schedule, now) {
    if (!isValid(schedule)) return { state: 'unknown' };
    now = now || new Date();
    var p = localParts(now, schedule.tz), today = dayAt(p, 0), yesterday = dayAt(p, -1);
    var closedUntil = schedule.closedUntil && today.iso <= schedule.closedUntil;
    var current = null;
    if (!closedUntil) {
      rangesOn(schedule, today).forEach(function (r) { if (!current && p.min >= r[0] && p.min < r[1]) current = r[1]; });
      if (!current && !(schedule.closedUntil && yesterday.iso <= schedule.closedUntil))
        rangesOn(schedule, yesterday).forEach(function (r) { if (!current && r[1] > 1440 && p.min < r[1] - 1440) current = r[1] - 1440; });
    }
    var paused = schedule.pausedUntil && Date.parse(schedule.pausedUntil) > now.getTime();
    if (current && !paused) return { state: 'open', closesAt: current, label: 'Aberto', detail: 'Fecha às ' + endLabel(current) };
    var next = nextOpening(schedule, p, current && paused ? Date.parse(schedule.pausedUntil) : null, now);
    var out = { state: current && paused ? 'paused' : 'closed', label: current && paused ? 'Pausado' : 'Fechado', next: next };
    if (next) out.detail = (out.state === 'paused' ? 'Volta ' : 'Abre ') + (next.offset === 0 ? 'às ' : next.offset === 1 ? 'amanhã às ' : DAY_LABEL[next.dow] + ' às ') + hourLabel(next.minutes);
    // Versão curta para o card (cabe na largura do celular): "Abre 19h", "Amanhã 19h", "Ter. 18h", "Volta 21h30".
    if (next) out.short = (next.offset === 0 ? (out.state === 'paused' ? 'Volta ' : 'Abre ') : next.offset === 1 ? 'Amanhã ' : DAY_LABEL[next.dow].charAt(0).toUpperCase() + DAY_LABEL[next.dow].slice(1) + ' ') + hourLabel(next.minutes);
    return out;
  }

  function nextOpening(schedule, p, pausedUntilMs, now) {
    if (pausedUntilMs) {                                                   // pausa dentro do expediente: volta quando a pausa acaba
      var back = localParts(new Date(pausedUntilMs), schedule.tz), diff = Math.round((Date.UTC(back.y, back.m - 1, back.d) - Date.UTC(p.y, p.m - 1, p.d)) / 864e5);
      return { offset: diff, minutes: back.min, dow: dayAt(p, diff).dow };
    }
    for (var off = 0; off <= 14; off++) {
      var day = dayAt(p, off);
      if (schedule.closedUntil && day.iso <= schedule.closedUntil) continue;
      var r = rangesOn(schedule, day).filter(function (x) { return off > 0 || x[0] > p.min; })[0];
      if (r) return { offset: off, minutes: r[0], dow: day.dow };
    }
    return null;
  }

  /* Grade efetiva da loja: a grade explícita (`schedule.week`) ou a derivada do texto de horário, mais as exceções,
     pausa e fechamento temporário cadastrados em `schedule`. Horário estimado (`hoursEstimated`) não vira grade. */
  function fromStore(store) {
    if (!store) return null;
    var explicit = store.schedule || {}, week = explicit.week || (store.hours && !store.hoursEstimated ? parseHours(store.hours) : null);
    if (!week) return null;
    var out = { tz: explicit.tz || DEFAULT_TZ, week: week };
    ['exceptions', 'closedUntil', 'pausedUntil'].forEach(function (k) { if (explicit[k]) out[k] = explicit[k]; });
    return isValid(out) ? out : null;
  }

  /* Grade semanal para a página da loja: [{ day: 'Segunda', text: '18h às 23h' }, ...] na ordem seg → dom. */
  function weekRows(schedule) {
    if (!isValid(schedule)) return [];
    return ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(function (d) {
      var list = (schedule.week[d] || []).map(toMinutes).filter(Boolean);
      return { day: DAY_NAME[d], key: d, text: list.length ? list.map(function (r) { return r[1] - r[0] >= 1440 ? '24 horas' : hourLabel(r[0]) + ' às ' + endLabel(r[1]); }).join(' e ') : 'Fechado' };
    });
  }

  /* Dia da semana de hoje no fuso da loja ('seg'…'dom'). */
  function today(tz, now) { return dayAt(localParts(now || new Date(), tz), 0).dow; }

  /* ---------------- Previsão de entrega ---------------- */

  function pair(v) { return Array.isArray(v) ? [Number(v[0]), Number(v[1] == null ? v[0] : v[1])] : v == null ? null : [Number(v), Number(v)]; }
  function sane(a) { return a && a[0] > 0 && a[1] >= a[0] && a[1] <= 240 && Math.round(a[0]) === a[0] && Math.round(a[1]) === a[1]; }

  function deliveryEstimate(store) {
    var dt = store && store.deliveryTime;
    if (!dt) return null;
    var total = dt.minMinutes != null ? pair([dt.minMinutes, dt.maxMinutes == null ? dt.minMinutes : dt.maxMinutes]) : null;
    if (!total && dt.prepMinutes != null && dt.deliveryMinutes != null) {
      var a = pair(dt.prepMinutes), b = pair(dt.deliveryMinutes);
      if (sane(a) && sane(b)) total = [a[0] + b[0], a[1] + b[1]];
    }
    if (!sane(total)) return null;
    return { min: total[0], max: total[1], label: total[0] === total[1] ? total[0] + ' min' : total[0] + '–' + total[1] + ' min' };
  }

  return {
    DAYS: DAYS, DEFAULT_TZ: DEFAULT_TZ,
    parseHours: parseHours, isValid: isValid, fromStore: fromStore, status: status, weekRows: weekRows, hourLabel: hourLabel,
    deliveryEstimate: deliveryEstimate, localParts: localParts, today: today
  };
});
