'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const core = require('../js/core.js');
const { validateEstablishments } = require('../scripts/validate.js');
const { convert } = require('../scripts/import-research.js');

const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'establishments.json'), 'utf8'));

test('cadastro real é válido', () => {
  assert.deepEqual(validateEstablishments(db.establishments), []);
});

test('todas as cidades pertencem às 10 cidades atendidas e nenhuma passa da meta', () => {
  const counts = core.countByCity(db.establishments);
  assert.deepEqual(Object.keys(counts).sort(), [...core.CITIES].sort());
  Object.values(counts).forEach(n => assert.ok(n <= db.targetPerCity));
});

test('WhatsApp só é aceito com fonte e no formato de celular', () => {
  db.establishments.filter(s => s.whatsapp).forEach(s => {
    assert.ok(core.isValidWhatsApp(s.whatsapp), s.id);
    assert.match(s.whatsappSource, /^https:\/\//, s.id);
  });
});

test('validador rejeita registros incompletos ou duplicados', () => {
  const base = db.establishments[0];
  const errs = validateEstablishments([
    Object.assign({}, base, { sources: [] }),
    Object.assign({}, base, { whatsapp: '5566999990000', whatsappSource: null }),
    Object.assign({}, base, { id: 'x', city: 'Cuiabá' }),
    Object.assign({}, base, { id: 'y', menu: [{ id: 'a', name: 'A', priceCents: 0 }], menuSource: null })
  ]);
  assert.ok(errs.some(e => /fonte é obrigatória/.test(e)));
  assert.ok(errs.some(e => /whatsapp sem fonte/.test(e)));
  assert.ok(errs.some(e => /cidade fora/.test(e)));
  assert.ok(errs.some(e => /preço inválido/.test(e)));
  assert.ok(errs.some(e => /cardápio sem fonte/.test(e)));
  assert.ok(errs.some(e => /duplicado/.test(e)));
});

test('importação rebaixa WhatsApp sem fonte para telefone e converte preços', () => {
  const s = convert({ name: 'Teste', city: 'agua boa', category: 'pizza', whatsapp: '(66) 99999-0000', menuSource: 'https://x.com', menu: [{ name: 'Pizza', price: 49.9 }, { name: 'Pizza', price: 10 }], sources: ['http://x.com/a'] });
  assert.equal(s.city, 'Água Boa');
  assert.equal(s.whatsapp, null);
  assert.equal(s.phone, '5566999990000');
  assert.deepEqual(s.menu.map(m => [m.id, m.priceCents]), [['pizza', 4990], ['pizza-2', 1000]]);
  assert.ok(s.sources.includes('https://x.com/a'));
});
