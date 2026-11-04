/* Vem Menu (vemmenu.com/<loja>): cardápio no HTML — títulos de categoria (h3.categoria-title) seguidos de cartões
   div.produto (data-nome, data-valor, data-tem-grupo) com descrição (p.descricao-produto) e foto. Produto com grupo
   de opções (data-tem-grupo="1") ainda não é lido: fica de fora e aparece em skipped. */
'use strict';
const L = require('../lib');

const strip = s => L.cleanText(String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'"));

module.exports = function parse({ html, meta }) {
  const base = (meta.finalUrl || meta.url).replace(/[^/]*$/, '');
  const skipped = {}, sections = [];
  const re = /<h3 class="categoria-title[^"]*"[^>]*>([\s\S]*?)<\/h3>|<div class="[^"]*\bproduto\b[^"]*"([^>]*data-produto-id="\d+"[^>]*)>([\s\S]*?)<\/a>/g;
  let sec = null;
  const seen = new Set();
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m[1] != null) { sec = { name: strip(m[1]), items: [] }; sections.push(sec); continue; }
    const attr = k => (new RegExp('data-' + k + '="([^"]*)"').exec(m[2]) || [])[1];
    const id = attr('produto-id');
    if (!sec || seen.has(id)) continue;
    seen.add(id);
    if (attr('tem-grupo') === '1') { L.count(skipped, 'opções não lidas'); continue; }
    const price = L.cents(Number(attr('valor')));
    if (!price) { L.count(skipped, 'sem preço'); continue; }
    const desc = (/<p class="card-text descricao-produto[^"]*"[^>]*>([\s\S]*?)<\/p>/.exec(m[3]) || [])[1];
    const img = (/<img[^>]+src="([^"]+)"/.exec(m[3]) || [])[1];
    sec.items.push({ sourceId: id, name: L.displayName(strip(attr('nome'))), description: L.displayText(strip(desc)), priceCents: price, originalPriceCents: null,
      imageUrl: img && !/placeholder|sem-imagem/i.test(img) ? new URL(img.replace('/120/', '/'), base).href : null, options: [] });
  }
  return L.snapshot(meta, sections, { skipped });
};
