'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { candidatePages, extractShareImage } = require('../scripts/collect-photos.js');

test('extrai og:image da página oficial, com URL relativa e entidades', () => {
  const html = '<head><meta content="https://cdn.loja.com/foto.jpg?a=1&amp;b=2" property="og:image"><meta name="twitter:image" content="/x.png"></head>';
  assert.equal(extractShareImage(html, 'https://loja.com/'), 'https://cdn.loja.com/foto.jpg?a=1&b=2');
  assert.equal(extractShareImage('<meta name="twitter:image" content="/x.png">', 'https://loja.com/a/'), 'https://loja.com/x.png');
});

test('ignora imagens genéricas das plataformas e ausência de meta', () => {
  assert.equal(extractShareImage('<meta property="og:image" content="https://static.xx.fbcdn.net/rsrc.php/v3/logo.png">', 'https://facebook.com/x'), null);
  assert.equal(extractShareImage('<title>x</title>', 'https://loja.com/'), null);
});

test('candidatas: site, cardápio, fontes oficiais e Instagram, sem diretórios', () => {
  const s = { website: 'https://loja.com/', orderUrl: null, instagram: 'loja', sources: ['https://www.solutudo.com.br/x', 'https://www.ifood.com.br/delivery/x', 'https://www.facebook.com/loja/'] };
  assert.deepEqual(candidatePages(s), ['https://loja.com/', 'https://www.ifood.com.br/delivery/x', 'https://www.facebook.com/loja/', 'https://www.instagram.com/loja/']);
});
