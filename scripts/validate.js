/* Validação do cadastro de estabelecimentos. Retorna lista de erros (vazia = válido). */
'use strict';
const core = require('../js/core.js');

const URL_RE = /^https:\/\/[^\s]+$/;

function validateEstablishments(list) {
  const errors = [];
  const ids = new Set();
  const keys = new Set();
  if (!Array.isArray(list)) return ['establishments deve ser um array'];
  list.forEach((s, i) => {
    const at = `#${i} (${s && s.id})`;
    const err = msg => errors.push(`${at}: ${msg}`);
    if (!s || typeof s !== 'object') return err('registro inválido');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id || '')) err('id inválido');
    if (ids.has(s.id)) err('id duplicado');
    ids.add(s.id);
    if (!s.name || typeof s.name !== 'string') err('nome obrigatório');
    if (!core.CITIES.includes(s.city)) err(`cidade fora da lista: ${s.city}`);
    if (!core.CATEGORIES.includes(s.category)) err(`categoria inválida: ${s.category}`);
    const key = core.slugify(s.name) + '|' + s.city;
    if (keys.has(key)) err('estabelecimento duplicado (mesmo nome e cidade)');
    keys.add(key);
    if (!Array.isArray(s.sources) || !s.sources.length) err('ao menos uma fonte é obrigatória');
    else s.sources.forEach(u => { if (!URL_RE.test(u)) err(`fonte inválida: ${u}`); });
    if (s.whatsapp != null) {
      if (!core.isValidWhatsApp(s.whatsapp)) err(`whatsapp inválido: ${s.whatsapp}`);
      if (!s.whatsappSource || !URL_RE.test(s.whatsappSource)) err('whatsapp sem fonte verificável');
    }
    if (s.phone != null && !/^55\d{10,11}$/.test(s.phone)) err(`telefone inválido: ${s.phone}`);
    if (s.hoursEstimated != null && (s.hoursEstimated !== true || !s.hours)) err('hoursEstimated só com horário preenchido');
    if (s.deliveryFeeCents != null && (!Number.isInteger(s.deliveryFeeCents) || s.deliveryFeeCents < 0)) err('taxa de entrega inválida');
    if (s.image != null) {
      if (!s.image.src) err('imagem sem src');
      if (!s.image.credit || !s.image.license) err('imagem sem crédito/licença');
    }
    if (!Array.isArray(s.menu)) err('menu deve ser array');
    else {
      if (s.menu.length && (!s.menuSource || !URL_RE.test(s.menuSource))) err('cardápio sem fonte');
      const itemIds = new Set();
      s.menu.forEach((m, j) => {
        if (!/^[a-z0-9-]+$/.test(m.id || '')) err(`item ${j} id inválido`);
        if (itemIds.has(m.id)) err(`item ${j} id duplicado`);
        itemIds.add(m.id);
        if (!m.name) err(`item ${j} sem nome`);
        if (!Number.isInteger(m.priceCents) || m.priceCents <= 0) err(`item ${j} preço inválido`);
        if (m.originalPriceCents != null && (!Number.isInteger(m.originalPriceCents) || m.originalPriceCents <= m.priceCents)) err(`item ${j} preço cheio deve ser maior que o promocional`);
        if (m.image != null && (!m.image.src || !m.image.credit || !m.image.license)) err(`item ${j} imagem sem src/crédito/licença`);
        if (m.image != null && m.image.src && !/^(assets\/|https:\/\/)/.test(m.image.src)) err(`item ${j} imagem fora de assets/`);
        (m.options || []).forEach((g, k) => {
          if (!/^[a-z0-9-]+$/.test(g.id || '') || !g.name || !Array.isArray(g.choices) || !g.choices.length) return err(`item ${j} grupo ${k} inválido`);
          const min = g.min || 0, max = g.max == null ? g.choices.length : g.max;
          if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < Math.max(1, min) || min > g.choices.length) err(`item ${j} grupo ${g.id} limites inválidos`);
          g.choices.forEach(c => { if (!/^[a-z0-9-]+$/.test(c.id || '') || !c.name || !Number.isInteger(c.priceCents || 0) || (c.priceCents || 0) < 0) err(`item ${j} grupo ${g.id} opção inválida`); });
        });
      });
    }
  });
  return errors;
}

module.exports = { validateEstablishments };
