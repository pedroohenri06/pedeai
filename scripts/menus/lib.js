/* Utilitários do importador de cardápios (scripts/menus): texto, dinheiro, ids e o formato normalizado.

   Formato normalizado (data/research/cardapios/<id>.json), igual para todas as plataformas:
   { id, platform, source, capturedAt, hours, sections: [{ name, items: [Item] }], skipped: {...}, notes: [] }
   Item = { sourceId, name, description, priceCents, originalPriceCents?, imageUrl?,
            options: [{ name, min, max, choices: [{ name, priceCents }] }] }
   Só entra o que está publicado na fonte: campo ausente fica vazio e item sem preço fica de fora (contado em skipped). */
'use strict';
const core = require('../../js/core.js');

/* Emojis e pictogramas saem do texto: são decoração da plataforma de origem e quebram a tipografia do cardápio. */
const PICTO = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

function cleanText(s) {
  if (s == null) return '';
  return String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(PICTO, '').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim().replace(/^[-–•·|*._\s]+|[-–•·|*_\s]+$/g, '').trim();
}

/* Nomes inteiros em CAIXA ALTA ou em minúsculas viram "Primeira maiúscula"; nomes já com caixa mista ficam como estão. */
function displayName(s) {
  const t = cleanText(s);
  const letters = t.replace(/[^\p{L}]/gu, '');
  if (letters.length < 2) return t;
  const upper = letters === letters.toUpperCase(), lower = letters === letters.toLowerCase();
  if (!upper && !lower) return t.charAt(0).toUpperCase() + t.slice(1);
  const base = t.toLowerCase();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/* Descrições em caixa alta viram minúsculas com a primeira letra de cada frase em maiúscula. */
function displayText(s) {
  const t = cleanText(s);
  const letters = t.replace(/[^\p{L}]/gu, '');
  if (letters.length > 3 && letters === letters.toUpperCase()) return t.toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/* Valor da fonte (número, "12,50", "12.50", "R$ 12,50") em centavos inteiros; null se não houver preço. */
function cents(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) : null;
  let s = String(v).replace(/[^\d,.-]/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/* Gera ids estáveis e únicos dentro de um cardápio a partir do nome. */
function idFactory() {
  const used = new Set();
  return function (name) {
    const base = core.slugify(name) || 'item';
    let id = base, n = 2;
    while (used.has(id)) id = base + '-' + n++;
    used.add(id);
    return id;
  };
}

/* Grupo de opções válido: nome, escolhas sem repetição e limites coerentes; null se não sobrar escolha. */
function optionGroup(name, min, max, choices) {
  const seen = new Set();
  const list = choices.map(c => ({ name: displayName(c.name), priceCents: Math.max(0, c.priceCents || 0) }))
    .filter(c => c.name && !seen.has(c.name.toLowerCase()) && seen.add(c.name.toLowerCase()));
  if (!list.length) return null;
  const lo = Math.max(0, Math.min(Number(min) || 0, list.length));
  let hi = max == null || !Number(max) ? list.length : Math.min(Number(max), list.length);
  hi = Math.max(hi, lo, 1);
  return { name: displayName(name) || 'Opções', min: lo, max: hi, choices: list };
}

/* Tamanhos com preços diferentes viram um grupo obrigatório; o preço base é o do menor tamanho. */
function sizesToItem(sizes) {
  const priced = sizes.filter(s => s.priceCents > 0);
  if (!priced.length) return null;
  if (priced.length === 1) return { priceCents: priced[0].priceCents, originalPriceCents: priced[0].originalPriceCents || null, options: [] };
  const base = Math.min.apply(null, priced.map(s => s.priceCents));
  const group = optionGroup('Tamanho', 1, 1, priced.map(s => ({ name: s.name, priceCents: s.priceCents - base })));
  return { priceCents: base, originalPriceCents: null, options: group ? [group] : [] };
}

/* Item com preço zero cujo valor está na escolha obrigatória (ex.: bolo P/M/G, porção 500 g/1 kg): o menor valor
   da escolha vira o preço base e as escolhas passam a valer a diferença. Se a fonte deixava escolher várias opções
   pagas (cada uma é uma unidade), o grupo vira escolha única e a quantidade vai no contador (registrado em notes).
   Devolve null se não houver como precificar. */
function priceFromRequiredGroup(item, notes) {
  if (item.priceCents > 0) return item;
  const g = (item.options || []).find(x => x.min >= 1 && x.choices.some(c => c.priceCents > 0));
  if (!g) return null;
  const priced = g.choices.filter(c => c.priceCents > 0);
  const base = Math.min.apply(null, priced.map(c => c.priceCents));
  if (g.max > 1 && notes) notes.push('"' + item.name + '": cada opção de "' + g.name + '" tem preço próprio; aqui vira escolha única e a quantidade vai no contador.');
  g.choices = priced.map(c => ({ name: c.name, priceCents: c.priceCents - base }));
  g.min = 1; g.max = 1;
  item.priceCents = base;
  return item;
}

/* Seções de vitrine da plataforma ("Mais pedidos", "Destaques"...) que só repetem itens de outras seções viram a
   marcação de destaque desses itens (carrossel do PedeAi) em vez de aparecer duplicadas no cardápio. */
const SHOWCASE = /^(mais pedidos|mais vendidos|destaques?|recomendad[oa]s|os queridinhos|top vendas)$/i;
function foldShowcases(secs) {
  const key = it => it.name.toLowerCase() + '|' + it.priceCents;
  return secs.filter(s => {
    if (!SHOWCASE.test(s.name.trim())) return true;
    const others = new Map();
    secs.filter(o => o !== s).forEach(o => o.items.forEach(it => others.set(key(it), it)));
    if (!s.items.every(it => others.has(key(it)))) return true;
    s.items.forEach(it => { others.get(key(it)).featured = true; });
    return false;
  });
}

function snapshot(meta, sections, extra) {
  const secs = foldShowcases(sections.map(s => ({ name: displayName(s.name) || 'Cardápio', items: s.items.filter(Boolean) })).filter(s => s.items.length));
  const out = Object.assign({ id: meta.id, platform: meta.platform, source: meta.finalUrl || meta.url, capturedAt: meta.capturedAt, hours: null, sections: secs, skipped: {}, notes: [] }, extra || {});
  out.hours = realHours(out.hours);
  return out;
}

/* Horário publicado: descarta o padrão de plataforma "00:00 às 23:59" (não é o horário real da loja). */
function realHours(text) { return text && !/00:0\d\s*[–-]\s*23:59/.test(text) ? compactHours(text) : null; }

/* "Seg 18:00–22:00 · Ter 18:00–22:00 · …" vira "Seg a Sex 18h–22h · Sáb 18h–23h" (ou "Todos os dias …"). */
const WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
function compactHours(text) {
  const days = text.split(' · ').map(seg => { const m = /^(\S+)\s+(.*)$/.exec(seg); return m && WEEK.includes(m[1]) ? { d: m[1], r: m[2] } : null; });
  if (days.some(x => !x)) return text;
  days.sort((a, b) => WEEK.indexOf(a.d) - WEEK.indexOf(b.d));
  const nice = r => r.split(/\s*[|,]\s*/).map(x => x.replace(/(\d{2}):(\d{2})/g, (m, h, mi) => (h.replace(/^0(?=\d)/, '')) + 'h' + (mi === '00' ? '' : mi))).join(' e ');
  const groups = [];
  days.forEach(x => {
    const g = groups[groups.length - 1];
    if (g && g.r === x.r && WEEK.indexOf(x.d) === WEEK.indexOf(g.to) + 1) g.to = x.d; else groups.push({ from: x.d, to: x.d, r: x.r });
  });
  if (groups.length === 1 && days.length === 7) return 'Todos os dias, ' + nice(groups[0].r);
  return groups.map(g => (g.from === g.to ? g.from : WEEK.indexOf(g.to) - WEEK.indexOf(g.from) === 1 ? g.from + ' e ' + g.to : g.from + ' a ' + g.to) + ' ' + nice(g.r)).join(' · ');
}

function count(obj, key) { obj[key] = (obj[key] || 0) + 1; }

module.exports = { cleanText, displayName, displayText, cents, idFactory, optionGroup, sizesToItem, snapshot, count, realHours, compactHours, priceFromRequiredGroup };
