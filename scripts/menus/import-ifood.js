#!/usr/bin/env node
/* Importa o JSON de lojas do iFood coletado pelo Claude in Chrome (prompt em data/research/cardapios/PROMPT-IFOOD-*.md):
   uma lista de lojas com endereço, horários (dayOfWeek/start/duration), CNPJ, logo e o cardápio completo
   (secoes → itens com preço, preço original, foto e opcoes: grupos min/max com garnishItens e unitPrice).

   Gera:
   - data/research/<cidade>-ifood.json — linhas de pesquisa para scripts/import-research.js (lojas novas);
   - data/research/cardapios/<id>.json — cardápio no formato normalizado (depois: images.py → apply.js);
   - entradas em data/research/cardapios/fontes.json (platform "ifood", coletado pela extensão).
   Lojas que já existem no cadastro com cardápio próprio ficam como estão (listadas em "mantidas").
   Lojas de outras cidades (fora de core.CITIES) ficam de fora e aparecem em "outras cidades".

   Uso: node scripts/menus/import-ifood.js <lojas.json> "<Cidade>" [--keep id,id] [--map nomeIfood=id,...] [--names nomes.json] */
'use strict';
const fs = require('fs');
const path = require('path');
const core = require('../../js/core.js');
const L = require('./lib');

const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'data', 'research', 'cardapios');
const FONTES = path.join(DIR, 'fontes.json');

const DAYS = { MONDAY: 'Seg', TUESDAY: 'Ter', WEDNESDAY: 'Qua', THURSDAY: 'Qui', FRIDAY: 'Sex', SATURDAY: 'Sáb', SUNDAY: 'Dom' };
const ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const CATEGORY = { 'Lanches': 'Hambúrguer', 'Pizza': 'Pizza', 'Açaí': 'Açaí', 'Comida Brasileira': 'Brasileira', 'Marmita': 'Brasileira',
  'Carnes': 'Churrasco', 'Doces & Bolos': 'Doces', 'Pastel': 'Pastel', 'Japonesa': 'Sushi', 'Saudável': 'Saudável', 'Café': 'Café', 'Padarias': 'Café' };

const pad = n => String(n).padStart(2, '0');
const hhmm = min => pad(Math.floor(min / 60) % 24) + ':' + pad(min % 60);

/* Horários do iFood: início + duração em minutos, cortados na meia-noite (a noite de segunda que vai até 2h aparece
   como "Seg 18:00–23:59" + "Ter 00:00–02:00"). Junta a madrugada à noite anterior, arredonda 23:5x para meia-noite
   e descarta faixas de poucos minutos (ajustes do painel do iFood). */
function hours(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const by = {};
  list.forEach(h => {
    const [H, M] = String(h.start).split(':').map(Number);
    if (h.duration >= 10) (by[h.dayOfWeek] = by[h.dayOfWeek] || []).push({ s: H * 60 + M, e: H * 60 + M + h.duration });
  });
  ORDER.forEach(d => (by[d] || []).sort((a, b) => a.s - b.s));
  ORDER.forEach((d, i) => {
    const next = by[ORDER[(i + 1) % 7]] || [];
    (by[d] || []).forEach(r => {
      if (r.e < 1435) return;
      const cont = next.find(x => x.s === 0);
      r.e = cont && cont.e < 1435 ? 1440 + cont.e : 1440;
      if (cont && cont.e < 1435) next.splice(next.indexOf(cont), 1);
    });
  });
  // Madrugada que sobrou sem a noite anterior (a noite foi um ajuste de minutos): não é um turno de verdade.
  ORDER.forEach(d => { if (by[d]) by[d] = by[d].filter(r => !(r.s === 0 && r.e < 180)); });
  const fmt = m => (m >= 1435 && m <= 1440 ? '00:00' : hhmm(m > 1440 ? m - 1440 : m));
  const segs = ORDER.filter(d => (by[d] || []).length).map(d => DAYS[d] + ' ' + by[d].map(r => hhmm(r.s) + '–' + fmt(r.e)).join(' | '));
  return segs.length ? L.compactHours(segs.join(' · ')).replace(/\b0h–0h\b/g, '24 horas') : null;
}

function phone(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (/^9\d{8}$/.test(d)) return '5566' + d; // celular sem DDD (o iFood guarda sem o 66 nas lojas da região)
  if (/^66\d{9}$/.test(d)) return '55' + d;
  return null; // 4003-xxxx (central do iFood), número antigo de 8 dígitos etc.
}

function cleanName(n) {
  return L.cleanText(n)
    .replace(/\s*-\s*Barra do Gar[çc]as\s*$/i, '').replace(/\s*-\s*Barra Center Shopping\s*$/i, '')
    .replace(/\s+B[Gg]$/, '').replace(/b[Gg]$/, '').replace(/\bAçai\b/g, 'Açaí').trim();
}

function itemOf(i, notes) {
  const price = L.cents(i.preco) || 0, orig = L.cents(i.precoOriginal) || 0;
  let options = (i.opcoes || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(o => L.optionGroup(o.name, o.min || 0, o.max || null, (o.garnishItens || []).map(g => ({ name: g.description, priceCents: L.cents(g.unitPrice) || 0 })))).filter(Boolean);
  if (i.opcoesErro && i.temOpcoes) notes.push('"' + L.displayName(L.cleanText(i.nome)) + '": opções não coletadas pela extensão (' + i.opcoesErro + ').');
  return L.priceFromRequiredGroup({
    sourceId: i.codigo || i.id, name: L.displayName(L.cleanText(i.nome)), description: L.displayText(i.descricao),
    priceCents: price, originalPriceCents: orig > price ? orig : null, imageUrl: i.foto || null, options
  }, notes);
}

function main() {
  const [file, cityArg, ...rest] = process.argv.slice(2);
  if (!file || !cityArg) { console.error('uso: import-ifood.js <lojas.json> "<Cidade>" [--keep id,id] [--map nomeIfood=id]'); process.exit(1); }
  const city = core.CITIES.find(c => core.normalize(c) === core.normalize(cityArg));
  if (!city) throw new Error('cidade fora da lista: ' + cityArg);
  const arg = k => { const i = rest.indexOf(k); return i > -1 ? rest[i + 1] : ''; };
  const keep = new Set(arg('--keep').split(',').filter(Boolean));
  const map = Object.fromEntries(arg('--map').split(',').filter(Boolean).map(x => x.split('=')));
  // Nomes de exibição (o nome no iFood costuma vir com cidade, slogan ou tudo em maiúsculas): {"nome no iFood": "Nome"}
  const names = arg('--names') ? JSON.parse(fs.readFileSync(arg('--names'), 'utf8')) : {};
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'establishments.json'), 'utf8')).establishments;
  const fontes = JSON.parse(fs.readFileSync(FONTES, 'utf8'));
  const lojas = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = [], out = { novas: [], atualizadas: [], mantidas: [], outrasCidades: [], semCardapio: [] };
  const collected = (lojas[0] && lojas[0].coletadoEm || new Date().toISOString()).slice(0, 10);

  lojas.forEach(l => {
    const lojaCity = core.CITIES.find(c => core.normalize(c) === core.normalize(l.cidade || ''));
    if (lojaCity !== city) { out.outrasCidades.push(l.nome + ' (' + l.cidade + ')'); return; }
    const name = names[l.nome] || cleanName(l.nome);
    const id = map[l.nome] || (core.slugify(name) + '-' + core.slugify(city));
    const existing = db.find(s => s.id === id);
    if (existing && keep.has(id)) { out.mantidas.push(id); return; }
    const a = l.endereco || {};
    const address = [L.cleanText(a.streetName || ''), a.streetNumber && a.streetNumber !== '0' ? a.streetNumber : ''].filter(Boolean).join(', ') || null;
    const cat = CATEGORY[l.categoriaIfood] || 'Hambúrguer';
    if (!existing) rows.push({
      name, city, category: /esfih|coxinha/i.test(name) ? 'Pastel' : /frango|chicken/i.test(name) ? 'Brasileira' : cat,
      kind: l.categoriaIfood || null, address: address && a.district ? address + ' - ' + L.cleanText(a.district) : address,
      phone: phone(l.telefone), hours: hours(l.horarios), sources: [l.link], confidence: 'alta', verifiedAt: collected,
      notes: 'Loja no iFood (' + l.link + '), coletada pelo Claude in Chrome em ' + collected + (l.cnpj ? '; CNPJ ' + l.cnpj : '') +
        '. Telefone do cadastro do iFood (não é WhatsApp confirmado). Preços do iFood: a loja pode cobrar diferente no pedido direto.'
    });
    const notes = [];
    const sections = (l.secoes || []).slice().sort((x, y) => (x.ordem || 0) - (y.ordem || 0)).map(s => ({
      name: L.cleanText(s.nome),
      items: (s.itens || []).filter(i => !i.indisponivel).sort((x, y) => (x.ordem || 0) - (y.ordem || 0)).map(i => itemOf(i, notes)).filter(Boolean)
    }));
    const total = sections.reduce((n, s) => n + s.items.length, 0);
    if (!total) { out.semCardapio.push(id); return; }
    const snap = L.snapshot({ id, platform: 'ifood', url: l.link, capturedAt: l.coletadoEm || collected }, sections, {
      hours: null, skipped: {}, notes: ['Cardápio do iFood coletado pelo Claude in Chrome em ' + collected + ' (' + (l.totalItens || total) + ' itens na loja).'].concat(Array.from(new Set(notes)))
    });
    fs.writeFileSync(path.join(DIR, id + '.json'), JSON.stringify(snap, null, 2) + '\n');
    fontes.fontes[id] = { url: l.link, platform: 'ifood', via: 'iFood pelo Claude in Chrome (JSON enviado pelo Pedro em ' + collected + '); o iFood bloqueia coleta automatizada daqui' };
    (existing ? out.atualizadas : out.novas).push(id + ' (' + total + ' itens)');
  });

  const rowsFile = path.join(ROOT, 'data', 'research', core.slugify(city) + '-ifood.json');
  fs.writeFileSync(rowsFile, JSON.stringify(rows, null, 1) + '\n');
  fs.writeFileSync(FONTES, JSON.stringify(fontes, null, 2) + '\n');
  console.log(JSON.stringify(out, null, 1));
  console.log('linhas de pesquisa (lojas novas):', rows.length, '→', path.relative(ROOT, rowsFile));
}

main();
