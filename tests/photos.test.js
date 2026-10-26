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

const { highRes, parseList, rankPhotos } = require('../scripts/import-photo-urls.js');

test('fotos do Google são pedidas em alta resolução', () => {
  assert.equal(highRes('https://lh3.googleusercontent.com/p/AF1QipX=w408-h306-k-no'), 'https://lh3.googleusercontent.com/p/AF1QipX=s2048');
  assert.equal(highRes('https://lh5.googleusercontent.com/p/AF1QipY'), 'https://lh5.googleusercontent.com/p/AF1QipY=s2048');
  assert.equal(highRes('https://exemplo.com/foto.jpg'), 'https://exemplo.com/foto.jpg');
});

test('capa prioriza foto do proprietário e fachada/prato sobre logotipo', () => {
  const r = rankPhotos([
    { url: 'https://a/1', tipo: 'logo', origem: 'proprietario' },
    { url: 'https://a/2', tipo: 'prato', origem: 'visitante' },
    { url: 'https://a/3', tipo: 'fachada', origem: 'proprietario' },
    { url: 'http://inseguro/4', tipo: 'fachada', origem: 'proprietario' }
  ]);
  assert.deepEqual(r.map(f => f.url), ['https://a/3', 'https://a/1', 'https://a/2']);
});

test('lista aceita JSON e JSON Lines (com texto solto entre as linhas)', () => {
  assert.equal(parseList('[{"id":"a"}]')[0].id, 'a');
  assert.deepEqual(parseList('Lote 1\n{"id":"a"}\n{"id":"b"}\n').map(r => r.id), ['a', 'b']);
});
