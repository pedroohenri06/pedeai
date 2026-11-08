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
fs.mkdirSync(OUT, { recursive: true });
const histFile = path.join(DIR, 'auditoria-chrome-2026-11-04.jsonl');
const hist = fs.existsSync(histFile) ? Object.fromEntries(fs.readFileSync(histFile, 'utf8').trim().split('\n').map(l => JSON.parse(l)).map(h => [h.id, h])) : {};
const template = fs.readFileSync(path.join(DIR, 'AGENTE-CARDAPIOS.md'), 'utf8').split(/\n---\n/).slice(1).join('\n---\n').trim();

// --ids a,b,c --nome rodada-2: prompt único só com essas lojas (ex.: refazer destaques lidos pela metade).
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const onlyIds = arg('--ids') ? arg('--ids').split(',') : null;
// Lojas que o agente já trabalhou (agente/resultado-*.jsonl) saem das listas por cidade.
const done = new Set(fs.readdirSync(OUT).filter(f => /^resultado-.*\.jsonl$/.test(f))
  .flatMap(f => fs.readFileSync(path.join(OUT, f), 'utf8').trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l).id; } catch (e) { return null; } })));
const fila = onlyIds ? db.filter(s => onlyIds.includes(s.id)) : db.filter(s => !done.has(s.id)).filter(s => !s.menu.length && (s.logo || s.image)).filter(s => { const f = fontes[s.id]; return !(f && f.motivo && !/whatsapp/.test(f.platform || '')); });
const resumo = [];
(onlyIds ? [null] : core.CITIES).forEach(city => {
  const lojas = city ? fila.filter(s => s.city === city) : fila;
  if (!lojas.length) return;
  const lista = lojas.map((s, i) => {
    const h = hist[s.id];
    const antes = h && h.linkBio ? ` — dica: link da bio já visto: ${h.linkBio}` : '';
    const ig = s.instagram ? `https://www.instagram.com/${s.instagram}/` : `sem Instagram — pesquise "${s.name}" no Instagram`;
    return `${i + 1}. **${s.name}** (${s.kind || s.category}${city ? '' : ', ' + s.city}) — id: \`${s.id}\` — ${ig}${antes}`;
  }).join('\n');
  const label = city || 'várias cidades (' + [...new Set(lojas.map(s => s.city))].join(', ') + ')';
  const txt = template.replace(/\{\{CIDADE\}\}/g, label).replace(/\{\{TOTAL\}\}/g, lojas.length).replace('{{LISTA}}', lista) + '\n';
  const file = path.join(OUT, 'prompt-' + (city ? core.slugify(city) : arg('--nome') || 'selecao') + '.txt');
  fs.writeFileSync(file, txt);
  resumo.push(`${city || arg('--nome')}: ${lojas.length} lojas → ${path.relative(ROOT, file)}`);
});
console.log(`${fila.length} lojas na fila\n` + resumo.join('\n'));
