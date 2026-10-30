/* Brendi (menu.brendi.com.br / pedido.brendi.com.br): cardápio no __NUXT_DATA__ da página.
   Valores em centavos; `price` é o preço cheio e `currentPrice` o promocional. Grupos "unique" = escolha única. */
'use strict';
const L = require('../lib');
const nuxt = require('../nuxt');

const IMG = p => 'https://firebasestorage.googleapis.com/v0/b/brendi-app.appspot.com/o/' + encodeURIComponent(p) + '?alt=media';
const DAYS = [['mon', 'Seg'], ['tue', 'Ter'], ['wed', 'Qua'], ['thu', 'Qui'], ['fri', 'Sex'], ['sat', 'Sáb'], ['sun', 'Dom']];
const hm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

function hoursOf(wh) {
  if (!wh) return null;
  const out = DAYS.filter(([k]) => (wh[k] || []).length).map(([k, d]) => d + ' ' + wh[k].map(x => hm(x.start) + '–' + hm(x.end)).join(', '));
  return out.length ? out.join(' · ') : null;
}

function product(p, notes) {
  if (p.active === false || p.missing) return null;
  const full = Number(p.price) || 0, now = Number(p.currentPrice) || full;
  const customs = (p.customs || []).filter(c => c.active !== false && !c.missing && (c.choices || []).some(ch => ch.active !== false && !ch.missing));
  const groups = customs.map(c => {
    const single = c.type === 'unique';
    const min = c.minChoices != null ? c.minChoices : single ? 1 : 0;
    const max = single ? 1 : c.maxChoices;
    return { min, max, name: c.title, choices: c.choices.filter(ch => ch.active !== false && !ch.missing).map(ch => ({ name: ch.title, priceCents: Number(ch.extraPrice) || 0 })) };
  });
  return L.priceFromRequiredGroup({
    sourceId: p.id, name: L.displayName(p.name), description: L.displayText(p.description),
    priceCents: now > 0 ? now : 0, originalPriceCents: full > now && now > 0 ? full : null,
    imageUrl: p.picture ? IMG(p.picture) : null, featured: p.label === 'recommended',
    options: groups.map(g => L.optionGroup(g.name, g.min, g.max, g.choices)).filter(Boolean)
  }, notes);
}

module.exports = function parse({ html, meta }) {
  const data = nuxt.fromHtml(html);
  const key = data && Object.keys(data.data || {}).find(k => k.startsWith('menu-'));
  if (!key) throw new Error('payload do cardápio não encontrado');
  const m = data.data[key], skipped = {}, notes = [];
  const order = ((m.store && m.store.config && m.store.config.menu && m.store.config.menu.orderedCategories) || []).map(p => p.split('/').pop());
  const cats = (m.categories || []).filter(c => c.active !== false && !c.missing)
    .sort((a, b) => (order.indexOf(a.id) + 1 || 999) - (order.indexOf(b.id) + 1 || 999));
  const sections = cats.map(c => ({
    name: c.name,
    items: (m.productsByCategory[c.id] || []).map(p => { const it = product(p, notes); if (!it) L.count(skipped, 'indisponível ou sem preço'); return it; })
  }));
  return L.snapshot(meta, sections, { hours: hoursOf(m.store && m.store.workingHours), skipped, notes: Array.from(new Set(notes)) });
};
