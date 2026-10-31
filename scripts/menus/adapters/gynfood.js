/* GynFood / Impulsione Delivery (<loja>.gynfood.com.br): a lista da página tem seções (cat-<id>) e produtos
   (a.item-produto); o detalhe de cada produto vem do modal que o coletor abre (responses "gynfood-modal:<id>"):
   preço base, grupos (título + min-quantidade/max-quantidade) e opções (rótulo + data-price). Produtos "a partir de"
   têm o preço nas variações do grupo obrigatório. Fotos: as que o navegador conseguiu baixar (bruto/<id>/img). */
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('../lib');

const text = s => L.cleanText(String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"'));

function listProducts(html) {
  const out = [], re = /<a class="anchor" name="cat-(\d+)"><\/a>[\s\S]*?<h4 class="subtitle-cat"[^>]*>([\s\S]*?)<\/h4>|data-produto-id="(\d+)"/g;
  let section = null;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m[1]) section = text(m[2]);
    else if (section && !out.some(p => p.id === m[3])) out.push({ id: m[3], section });
  }
  return out;
}

function parseModal(html) {
  const priceTxt = text((/class="text-currency produto-view-price"[^>]*>([\s\S]*?)<\/span>/.exec(html) || [])[1]);
  const name = text((/<h4[^>]*class="modal-title[^"]*"[^>]*>([\s\S]*?)<\/h4>/.exec(html) || [])[1]);
  const desc = text((/class="modal-produto-descricao"[^>]*>([\s\S]*?)<\/p>/.exec(html) || [])[1]);
  const img = (/<div class="produto-view-image[^"]*"[^>]*>\s*<img src="([^"]+)"/.exec(html) || [])[1] || null;
  const groups = [];
  const parts = html.split(/<div style="position:relative;float:left;width:100%;background-color: #f3f3f3;[^"]*">/).slice(1);
  parts.forEach(part => {
    const title = text(part.slice(0, part.indexOf('</div>')));
    const box = /<div max-quantidade="(\d+)" min-quantidade="(\d+)"/.exec(part);
    if (!box) return;
    const choices = [], ore = /<label[^>]*class="control-label">([\s\S]*?)<\/label>[\s\S]*?data-price="([\d.]+)"/g;
    for (let o = ore.exec(part); o; o = ore.exec(part)) {
      const label = text(o[1].replace(/<span[\s\S]*?<\/span>/g, '')).replace(/\s*-\s*Grátis$/i, '').replace(/^ADD\s+/i, '');
      choices.push({ name: label, priceCents: L.cents(Number(o[2])) || 0 });
    }
    if (choices.length) groups.push({ name: title.replace(/!+$/, ''), min: Number(box[2]), max: Number(box[1]), choices });
  });
  return { name, desc, img, from: /a partir/i.test(priceTxt), price: L.cents((priceTxt.match(/\d{1,3}(?:\.\d{3})*,\d{2}/) || [])[0]), groups };
}

module.exports = function parse({ html, responses, meta }) {
  const modals = new Map(responses.filter(r => /^gynfood-modal:/.test(r.url)).map(r => [r.url.split(':')[1], r.body.html]));
  if (!modals.size) throw new Error('detalhes dos produtos não coletados');
  const imgDir = path.join(__dirname, '..', '..', '..', 'data', 'research', 'cardapios', 'bruto', meta.id, 'img');
  const skipped = {}, notes = [], sections = [];
  listProducts(html).forEach(p => {
    const m = modals.get(p.id);
    if (!m) { L.count(skipped, 'sem detalhe'); return; }
    const d = parseModal(m);
    const local = d.img && path.join(imgDir, path.basename(d.img));
    const item = L.priceFromRequiredGroup({
      sourceId: p.id, name: L.displayName(d.name || ''), description: L.displayText(d.desc),
      priceCents: d.from ? 0 : d.price || 0, originalPriceCents: null,
      imageUrl: local && fs.existsSync(local) ? 'file://' + local : null, imageSource: d.img,
      options: d.groups.map(g => L.optionGroup(g.name, g.min, g.max, g.choices)).filter(Boolean)
    }, notes);
    if (!item || !item.name) { L.count(skipped, 'sem preço'); return; }
    let sec = sections.find(s => s.name === p.section);
    if (!sec) sections.push(sec = { name: p.section, items: [] });
    sec.items.push(item);
  });
  if (!fs.existsSync(imgDir) || !fs.readdirSync(imgDir).length) notes.push('Fotos do servidor da plataforma (impulsionedelivery) não puderam ser baixadas; cardápio sem fotos até a loja enviar.');
  return L.snapshot(meta, sections, { skipped, notes: Array.from(new Set(notes)) });
};
