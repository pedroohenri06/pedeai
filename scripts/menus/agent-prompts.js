#!/usr/bin/env node
/* Gera os prompts do Agente de Cardápios (Claude in Chrome), um por cidade, com a lista de lojas embutida.
   Lojas: sem cardápio, com foto/logo real (imagem ilustrativa = não mapeada, fica de fora) e sem `motivo` de bloqueio
   em fontes.json (exceto WhatsApp). Saída: data/research/cardapios/agente/prompt-<cidade>.txt (fora do site).
   Uso: node scripts/menus/agent-prompts.js   →  resultados voltam pelo scripts/menus/import-fila.js */
const fs = require('fs');
const path = require('path');
const core = require('../../js/core.js');

const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'data', 'research', 'cardapios');
const OUT = path.join(DIR, 'agente');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'establishments.json'), 'utf8')).establishments;
const fontes = JSON.parse(fs.readFileSync(path.join(DIR, 'fontes.json'), 'utf8')).fontes;
const histFile = path.join(DIR, 'auditoria-chrome-2026-11-04.jsonl');
const hist = fs.existsSync(histFile) ? Object.fromEntries(fs.readFileSync(histFile, 'utf8').trim().split('\n').map(l => JSON.parse(l)).map(h => [h.id, h])) : {};
const template = fs.readFileSync(path.join(DIR, 'AGENTE-CARDAPIOS.md'), 'utf8').split(/\n---\n/).slice(1).join('\n---\n').trim();

const fila = db.filter(s => !s.menu.length && (s.logo || s.image)).filter(s => { const f = fontes[s.id]; return !(f && f.motivo && !/whatsapp/.test(f.platform || '')); });
fs.mkdirSync(OUT, { recursive: true });
const resumo = [];
core.CITIES.forEach(city => {
  const lojas = fila.filter(s => s.city === city);
  if (!lojas.length) return;
  const lista = lojas.map((s, i) => {
    const h = hist[s.id];
    const antes = h && h.linkBio ? ` — dica: link da bio já visto: ${h.linkBio}` : '';
    const ig = s.instagram ? `https://www.instagram.com/${s.instagram}/` : `sem Instagram — pesquise "${s.name}" no Instagram`;
    return `${i + 1}. **${s.name}** (${s.kind || s.category}) — id: \`${s.id}\` — ${ig}${antes}`;
  }).join('\n');
  const txt = template.replace(/\{\{CIDADE\}\}/g, city).replace(/\{\{TOTAL\}\}/g, lojas.length).replace('{{LISTA}}', lista) + '\n';
  const file = path.join(OUT, 'prompt-' + core.slugify(city) + '.txt');
  fs.writeFileSync(file, txt);
  resumo.push(`${city}: ${lojas.length} lojas → ${path.relative(ROOT, file)}`);
});
console.log(`${fila.length} lojas na fila\n` + resumo.join('\n'));
