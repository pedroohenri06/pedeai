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
      });
    }
  });
  return errors;
}

module.exports = { validateEstablishments };
