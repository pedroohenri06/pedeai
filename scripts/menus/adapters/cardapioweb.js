/* CardápioWeb (app.cardapioweb.com/<loja>): a página busca integracao.cardapioweb.com/api/menu/company/categories
   (categorias com itens, preço, preço promocional, add_ons com mínimo/máximo) e /company/profile (horários e o
   WhatsApp de pedidos da própria loja). Opções "SUMMABLE" deixam repetir a mesma escolha na fonte; aqui cada escolha
   vale uma vez, até o máximo do grupo (registrado nas notas). Marcações internas "xxxx" nos nomes são removidas. */
'use strict';
const L = require('../lib');

const DAYS = [['monday', 'Seg'], ['tuesday', 'Ter'], ['wednesday', 'Qua'], ['thursday', 'Qui'], ['friday', 'Sex'], ['saturday', 'Sáb'], ['sunday', 'Dom']];
const unmark = s => String(s || '').replace(/^\s*x{3,}\s*|\s*x{3,}\s*$/gi, '');

function hoursOf(bh) {
  if (!bh) return null;
  const out = DAYS.filter(([k]) => (bh[k] || []).length).map(([k, d]) => d + ' ' + bh[k].map(r => r[0] + '–' + r[1]).join(', '));
  return out.length ? out.join(' · ') : null;
}

module.exports = function parse({ responses, meta }) {
  const hit = responses.find(r => /api\/menu\/company\/categories/.test(r.url) && Array.isArray(r.body));
  if (!hit) throw new Error('resposta do cardápio não encontrada');
  const prof = (responses.find(r => /api\/menu\/company\/profile/.test(r.url)) || {}).body || {};
  const skipped = {}, notes = [];
  let summable = false;
  const sections = hit.body.filter(c => c.status === 'ACTIVE').sort((a, b) => a.position - b.position).map(c => ({
    name: c.name,
    items: (c.items || []).map(it => {
      if (it.status !== 'ACTIVE') { L.count(skipped, 'indisponível'); return null; }
      if (it.unit_type && it.unit_type !== 'UN') { L.count(skipped, 'vendido por peso'); return null; }
      const full = L.cents(it.price), promo = it.promotional_price_active ? L.cents(it.promotional_price) : null;
      const now = promo > 0 && promo < full ? promo : full;
      const options = (it.add_ons || []).filter(g => g.status === 'ACTIVE').sort((a, b) => a.position - b.position).map(g => {
        if (g.choice_type === 'SUMMABLE') summable = true;
        if (g.price_calculation_type && g.price_calculation_type !== 'SUM') notes.push('"' + L.displayName(it.name) + '": grupo "' + g.name + '" cobra ' + g.price_calculation_type + ' na fonte; aqui as opções somam.');
        return L.optionGroup(unmark(g.name), g.minimum_quantity, g.choice_type === 'SINGLE' ? 1 : g.maximum_quantity,
          (g.subitems || []).filter(s => s.status === 'ACTIVE').map(s => ({ name: unmark(s.name), priceCents: L.cents(s.price) || 0 })));
      }).filter(Boolean);
      const item = L.priceFromRequiredGroup({
        sourceId: String(it.id), name: L.displayName(it.name), description: L.displayText(it.description),
        priceCents: now > 0 ? now : 0, originalPriceCents: now > 0 && now < full ? full : null,
        imageUrl: it.image_url || null, featured: !!it.highlighted, options
      }, notes);
      if (!item) L.count(skipped, 'sem preço');
      return item;
    })
  }));
  if (summable) notes.push('Alguns adicionais aceitam repetir a mesma opção na fonte (ex.: 2 bacons); aqui cada opção é escolhida uma vez, até o máximo do grupo.');
  const zap = String(prof.order_whatsapp || '').replace(/\D/g, '');
  return L.snapshot(meta, sections, { hours: hoursOf(prof.business_hours), skipped, notes: Array.from(new Set(notes)), whatsapp: zap || null });
};
