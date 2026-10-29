'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanAddress, cleanHours, cleanObs } = require('../scripts/import-instagram.js');

test('endereço da bio perde cidade, UF e CEP, mas não o bairro com o nome da cidade', () => {
  assert.equal(cleanAddress('R. XV de Novembro, 677, Centro, Barra do Garças-MT, 78600-015', 'Barra do Garças'), 'R. XV de Novembro, 677, Centro');
  assert.equal(cleanAddress('Rua Guarita, 1034, Nova Canarana, Canarana-MT', 'Canarana'), 'Rua Guarita, 1034, Nova Canarana');
  assert.equal(cleanAddress('Rua Santo Antônio, quadra 52, Setor Nova Querência', 'Querência'), 'Rua Santo Antônio, quadra 52, Setor Nova Querência');
  assert.equal(cleanAddress('Rua 5, nº 171, Centro (Água Boa-MT)', 'Água Boa'), 'Rua 5, nº 171, Centro');
  assert.equal(cleanAddress('Rua E 22, Querência 78643000', 'Querência'), 'Rua E 22');
  assert.equal(cleanAddress('Rua 05, nº 777, Centro, Água Boa-MT (ao lado da Pop Ferragens)', 'Água Boa'), 'Rua 05, nº 777, Centro (ao lado da Pop Ferragens)');
  assert.equal(cleanAddress(null, 'Vila Rica'), null);
});

test('horário e observações perdem as anotações da pesquisa', () => {
  assert.equal(cleanHours('Qua a seg, 18h às 23h (destaque HORÁRIOS)'), 'Qua a seg, 18h às 23h');
  assert.equal(cleanHours('Segunda a sábado (post fixado)'), 'Segunda a sábado');
  assert.equal(cleanHours(null), null);
  assert.equal(cleanObs('wa.me na bio. Foto 1080px.'), 'wa.me na bio.');
  assert.equal(cleanObs('Cadastro sem logo. Foto de perfil só 463px.'), 'Cadastro sem logo.');
});
