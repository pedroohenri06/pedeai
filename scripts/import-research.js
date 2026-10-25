#!/usr/bin/env node
/* Importa arquivos de pesquisa (formato descrito em .claude/skills/restaurant-research/SKILL.md)
   para data/establishments.json, normalizando ids, preços (centavos) e removendo duplicatas.
   Uso: node scripts/import-research.js <pasta-ou-arquivo.json> [...] */
'use strict';
const fs = require('fs');
const path = require('path');
const core = require('../js/core.js');

const dbFile = path.join(__dirname, '..', 'data', 'establishments.json');

function digits(v) { return v == null ? null : String(v).replace(/\D/g, '') || null; }

function normPhone(v) {
  let d = digits(v);
  if (!d) return null;
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}

function httpsUrl(u) {
  if (!u || typeof u !== 'string') return null;
  u = u.trim();
  if (/^http:\/\//.test(u)) u = 'https://' + u.slice(7);
  return /^https:\/\/\S+$/.test(u) ? u : null;
}

function convert(r) {
  const city = core.CITIES.find(c => core.normalize(c) === core.normalize(r.city));
  if (!city) throw new Error(`cidade desconhecida: ${r.city} (${r.name})`);
  const category = core.CATEGORIES.find(c => core.normalize(c) === core.normalize(r.category));
  if (!category) throw new Error(`categoria desconhecida: ${r.category} (${r.name})`);
  const sources = [...new Set((r.sources || []).map(httpsUrl).filter(Boolean))];
  let whatsapp = normPhone(r.whatsapp);
  const whatsappSource = httpsUrl(r.whatsappSource);
  let phone = normPhone(r.phone);
  if (whatsapp && (!core.isValidWhatsApp(whatsapp) || !whatsappSource)) { phone = phone || whatsapp; whatsapp = null; }
  if (whatsappSource && !sources.includes(whatsappSource)) sources.push(whatsappSource);
  const menuSource = httpsUrl(r.menuSource);
  const used = new Set();
  const menu = menuSource ? (r.menu || []).filter(m => m && m.name && Number(m.price) > 0).map(m => {
    let id = core.slugify(m.name) || 'item', n = 2;
    while (used.has(id)) id = core.slugify(m.name) + '-' + n++;
    used.add(id);
    return { id, section: m.section || 'Cardápio', name: String(m.name).trim(), description: m.description ? String(m.description).trim() : '', priceCents: core.toCents(Number(m.price)) };
  }) : [];
  if (menuSource && menu.length && !sources.includes(menuSource)) sources.push(menuSource);
  const address = r.address ? String(r.address).trim() : null;
  const neighborhood = address && address.includes(' - ') ? address.split(' - ').pop().trim() : null;
  return {
    id: `${core.slugify(r.name)}-${core.slugify(city)}`,
    name: String(r.name).trim(), city, category, kind: (r.kind || category).trim(),
    address, neighborhood,
    whatsapp, whatsappSource: whatsapp ? whatsappSource : null, phone: phone && phone !== whatsapp ? phone : null,
    instagram: r.instagram ? String(r.instagram).replace(/^@/, '').trim() : null,
    website: httpsUrl(r.website), orderUrl: httpsUrl(r.orderUrl), hours: r.hours || null,
    deliveryFeeCents: null, image: null,
    menuSource: menu.length ? menuSource : null, menu,
    sources, confidence: r.confidence || 'media', verifiedAt: r.verifiedAt || new Date().toISOString().slice(0, 10),
    notes: r.notes || null
  };
}

function main() {
  const inputs = process.argv.slice(2).flatMap(p => fs.statSync(p).isDirectory()
    ? fs.readdirSync(p).filter(f => f.endsWith('.json')).map(f => path.join(p, f)) : [p]);
  const db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : { updatedAt: null, targetPerCity: 20, establishments: [] };
  const byKey = new Map(db.establishments.map(s => [core.slugify(s.name) + '|' + s.city, s]));
  let added = 0, skipped = 0;
  inputs.forEach(file => {
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    rows.forEach(r => {
      let s;
      try { s = convert(r); } catch (e) { console.warn(`[${path.basename(file)}] ignorado: ${e.message}`); skipped++; return; }
      if (!s.sources.length) { console.warn(`[${path.basename(file)}] ignorado sem fonte: ${s.name}`); skipped++; return; }
      const key = core.slugify(s.name) + '|' + s.city;
      if (byKey.has(key)) { skipped++; return; }
      byKey.set(key, s); added++;
    });
  });
  db.establishments = [...byKey.values()].sort((a, b) => core.CITIES.indexOf(a.city) - core.CITIES.indexOf(b.city) || a.name.localeCompare(b.name, 'pt-BR'));
  db.updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2) + '\n');
  console.log(`importados ${added}, ignorados ${skipped}, total ${db.establishments.length}`);
}

if (require.main === module) main();
module.exports = { convert, normPhone };
