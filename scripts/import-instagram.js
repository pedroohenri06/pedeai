#!/usr/bin/env node
/* Importa a pesquisa de perfis do Instagram (um JSON por cidade, com "acao" por loja) para data/establishments.json.
   Formato de entrada: {cidade, data, lojas: [{acao, idExistente, name, city, category, kind, instagram, profileUrl,
   address, hours, whatsapp, phone, orderUrl, website, bio, ultimoPost, posts, seguidores, vida, observacoes, ...}]}.
   Ações: novo = cadastra; completar e trocar_logo = preenchem só campos vazios do cadastro existente (divergências vão
   em notes; a troca de logo é feita depois por scripts/apply-logos.py); manter = não mexe.
   Correções conferidas nos prints ficam em <pasta>/correcoes.json, indexadas pelo @ do perfil.
   Uso: node scripts/import-instagram.js <pasta-ou-arquivo.json> [...]   (depois: node scripts/build-data.js && npm test) */
'use strict';
const fs = require('fs');
const path = require('path');
const core = require('../js/core.js');
const { convert, normPhone } = require('./import-research.js');

const dbFile = path.join(__dirname, '..', 'data', 'establishments.json');
const FILL = ['address', 'hours', 'phone', 'instagram', 'website', 'orderUrl'];
const LABEL = { address: 'endereço', hours: 'horário', phone: 'telefone', whatsapp: 'WhatsApp', website: 'site', orderUrl: 'link de pedido' };

function cityPattern(city) {
  return core.normalize(city).replace(/[^a-z ]/g, '').split(' ').map(w => w.replace(/a/g, '[aáàâã]').replace(/e/g, '[eéê]')
    .replace(/i/g, '[ií]').replace(/o/g, '[oóôõ]').replace(/u/g, '[uú]').replace(/c/g, '[cç]')).join('\\s+');
}

/* "Rua X, 1, Centro, Água Boa-MT, 78635-000" -> "Rua X, 1, Centro": a cidade já está no cadastro.
   Só tira o nome da cidade depois de vírgula ou parêntese, para não cortar bairros como "Nova Canarana". */
function cleanAddress(address, city) {
  if (!address) return null;
  const cityRe = cityPattern(city);
  let a = String(address).trim().replace(new RegExp(',\\s*' + cityRe + '\\s*[-–/]\\s*MT\\b', 'gi'), ''), prev;
  do {
    prev = a;
    a = a.replace(/[,\s]*\d{2}\.?\d{3}-?\d{3}\s*$/, '')
      .replace(new RegExp('\\s*\\(\\s*' + cityRe + '\\s*(?:[-–/]\\s*MT)?\\s*\\)\\s*$', 'i'), '')
      .replace(new RegExp('(?:^|,)\\s*' + cityRe + '\\s*(?:[-–/]\\s*MT)?\\s*$', 'i'), '')
      .replace(/[,\s]+$/, '');
  } while (a !== prev);
  return a || null;
}

/* Tira anotações de pesquisa do horário: "(destaque HORÁRIOS)", "(post fixado)", "(bio: ...)". */
function cleanHours(hours) {
  if (!hours) return null;
  return String(hours).replace(/\s*\((?:destaque|post|posts|bio)\b[^)]*\)/gi, '').trim() || null;
}

/* Observações da pesquisa sem os detalhes técnicos da foto de perfil. */
function cleanObs(obs) {
  if (!obs) return '';
  return String(obs).replace(/\s*Foto(?: de perfil)?(?: só)? \d+px\.?/g, '').replace(/\s*\(ver print\)/g, '').trim();
}

function research(l, data) {
  const parts = [`Pesquisa Instagram via Claude no Chrome (${data}): @${l.instagram}`];
  const stats = [l.posts != null && `${l.posts} posts`, l.seguidores != null && `${l.seguidores} seguidores`, l.ultimoPost && `último post ${l.ultimoPost}`].filter(Boolean);
  if (stats.length) parts[0] += ` (${stats.join(', ')})`;
  parts[0] += '.';
  if (l.bio) parts.push(`Bio: "${String(l.bio).replace(/\s+/g, ' ').trim()}".`);
  const obs = cleanObs(l.observacoes);
  if (obs) parts.push(obs);
  return parts.join(' ');
}

function sameValue(field, a, b) {
  if (field === 'phone' || field === 'whatsapp') return normPhone(a) === normPhone(b);
  const norm = v => core.normalize(String(v)).replace(/\bavenida\b/g, 'av').replace(/\brua\b/g, 'r').replace(/\bn[ºo°]?\s*(?=\d)/g, '').replace(/[^a-z0-9]/g, '');
  return norm(a) === norm(b);
}

const META = ['nota', 'soLogo', 'substituir'];

function applyFix(l, fix) {
  if (!fix) return l;
  const out = Object.assign({}, l);
  Object.keys(fix).filter(k => !META.includes(k)).forEach(k => { out[k] = fix[k]; });
  return out;
}

function importCity(db, file, fixes, log) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const byId = new Map(db.establishments.map(s => [s.id, s]));
  const byIg = new Map(db.establishments.filter(s => s.instagram).map(s => [s.instagram.toLowerCase(), s]));
  const byKey = new Map(db.establishments.map(s => [core.slugify(s.name) + '|' + s.city, s]));
  doc.lojas.forEach(raw => {
    const fix = fixes[String(raw.instagram || '').toLowerCase()];
    const l = applyFix(raw, fix);
    const nota = fix && fix.nota ? ' ' + fix.nota : '';
    const city = core.CITIES.find(c => core.normalize(c) === core.normalize(l.city));
    if (!city) throw new Error(`cidade desconhecida: ${l.city} (${l.name})`);
    if (l.acao === 'manter') return;

    if (l.acao === 'novo') {
      const ig = String(l.instagram).toLowerCase();
      const dup = byIg.get(ig) || byKey.get(core.slugify(l.name) + '|' + city);
      if (dup) { log.push(`ignorado (já cadastrado como ${dup.id}): ${l.name}`); return; }
      const s = convert({
        name: l.name, city, category: l.category, kind: l.kind,
        address: cleanAddress(l.address, city), hours: cleanHours(l.hours),
        whatsapp: l.whatsapp, whatsappSource: l.whatsapp ? l.profileUrl : null, phone: l.phone,
        instagram: l.instagram, website: l.website, orderUrl: l.orderUrl,
        sources: [l.profileUrl], confidence: l.confidence || (l.vida === 'ativo' ? 'media' : 'baixa'),
        verifiedAt: doc.data, notes: research(l, doc.data) + nota
      });
      if (byId.has(s.id)) { log.push(`ignorado (id repetido ${s.id}): ${l.name}`); return; }
      db.establishments.push(s);
      byId.set(s.id, s); byIg.set(ig, s); byKey.set(core.slugify(s.name) + '|' + city, s);
      log.push(`novo        ${s.id}`);
      return;
    }

    if (l.acao !== 'completar' && l.acao !== 'trocar_logo') throw new Error(`ação desconhecida: ${l.acao} (${l.name})`);
    const s = byId.get(l.idExistente);
    if (!s) throw new Error(`idExistente não encontrado: ${l.idExistente} (${l.name})`);
    const incoming = {
      address: cleanAddress(l.address, s.city), hours: cleanHours(l.hours), phone: normPhone(l.phone),
      instagram: l.instagram ? String(l.instagram).replace(/^@/, '') : null, website: l.website, orderUrl: l.orderUrl
    };
    if (fix && fix.soLogo) Object.keys(incoming).forEach(k => { if (k !== 'instagram') incoming[k] = null; });
    const filled = [], diverge = [], replaced = [];
    const replace = (fix && fix.substituir) || [];
    FILL.forEach(f => {
      const v = incoming[f];
      if (!v) return;
      if ((f === 'website' || f === 'orderUrl') && !/^https:\/\//.test(v)) return;
      if (s[f] == null || s[f] === '') { s[f] = v; filled.push(f); }
      else if (f === 'instagram' || sameValue(f, s[f], v)) return;
      else if (replace.includes(f)) { replaced.push(`${LABEL[f]} "${s[f]}"`); s[f] = v; filled.push(f + '*'); }
      else diverge.push(`${LABEL[f]} "${v}"`);
    });
    if (filled.includes('address') || filled.includes('address*')) s.neighborhood = s.address.includes(' - ') ? s.address.split(' - ').pop().trim() : null;
    const wa = l.whatsapp && !(fix && fix.soLogo) ? normPhone(l.whatsapp) : null;
    if (wa && core.isValidWhatsApp(wa)) {
      if (!s.whatsapp) {
        s.whatsapp = wa; s.whatsappSource = l.profileUrl; filled.push('whatsapp');
        if (s.phone && normPhone(s.phone) === wa) s.phone = null;
      } else if (!sameValue('whatsapp', s.whatsapp, wa)) diverge.push(`WhatsApp "${wa}"`);
    }
    if (!s.sources.includes(l.profileUrl)) s.sources.push(l.profileUrl);
    s.verifiedAt = doc.data;
    const msg = [`Instagram @${incoming.instagram || s.instagram} conferido em ${doc.data} (pesquisa via Claude no Chrome).`];
    if (replaced.length) msg.push(`Atualizado pelo perfil; antes: ${replaced.join('; ')}.`);
    if (diverge.length) msg.push(`O perfil informa ${diverge.join('; ')}, diferente do cadastro.`);
    s.notes = [s.notes, msg.join(' ') + nota].filter(Boolean).join(' ');
    log.push(`${l.acao.padEnd(11)} ${s.id}${filled.length ? ' (+' + filled.join(', ') + ')' : ''}${diverge.length ? ' [divergência]' : ''}`);
  });
  return doc.lojas.length;
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) { console.error('Uso: node scripts/import-instagram.js <pasta-ou-arquivo.json> [...]'); process.exit(1); }
  const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  const log = [];
  args.forEach(p => {
    const dir = fs.statSync(p).isDirectory() ? p : path.dirname(p);
    const fixFile = path.join(dir, 'correcoes.json');
    const fixes = fs.existsSync(fixFile) ? JSON.parse(fs.readFileSync(fixFile, 'utf8')).lojas || {} : {};
    const files = fs.statSync(p).isDirectory()
      ? fs.readdirSync(p).filter(f => f.endsWith('.json') && f !== 'correcoes.json').map(f => path.join(p, f)) : [p];
    files.forEach(f => importCity(db, f, fixes, log));
  });
  db.establishments.sort((a, b) => core.CITIES.indexOf(a.city) - core.CITIES.indexOf(b.city) || a.name.localeCompare(b.name, 'pt-BR'));
  db.updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2) + '\n');
  log.forEach(l => console.log(l));
  console.log(`total ${db.establishments.length}`);
}

if (require.main === module) main();
module.exports = { cleanAddress, cleanHours, cleanObs };
