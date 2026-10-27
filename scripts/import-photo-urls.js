#!/usr/bin/env node
/* Importa a lista de fotos coletada no Google Maps (pelo Claude in Chrome ou manualmente):
   baixa cada foto em alta resolução, escolhe a capa de cada estabelecimento e prepara a pasta
   para scripts/add-photos.py.
   Uso: node scripts/import-photo-urls.js <lista.json|lista.jsonl> <pasta-saida>
   Formato de cada registro:
   { "id": "<id do cadastro>", "maps_url": "https://www.google.com/maps/place/...", "confere": true,
     "fotos": [{ "url": "https://lh3.googleusercontent.com/...", "tipo": "fachada|ambiente|prato|logo", "origem": "proprietario|visitante" }] } */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const TYPE_RANK = { fachada: 0, ambiente: 1, prato: 2, logo: 3 };
const MIN_BYTES = 15 * 1024;

/* Fotos do Google (googleusercontent/ggpht) aceitam o tamanho no sufixo: pede a versão de 2048 px. */
function highRes(url) {
  if (!/googleusercontent\.com|ggpht\.com/.test(url)) return url;
  return url.replace(/=[^/=]*$/, '') + '=s2048';
}

function parseList(text) {
  const t = text.trim();
  if (t.startsWith('[')) return JSON.parse(t);
  return t.split('\n').map(l => l.trim()).filter(l => l.startsWith('{')).map(l => JSON.parse(l));
}

/* Capa: foto do proprietário antes de visitante; fachada, ambiente e prato antes de logotipo. */
function rankPhotos(fotos) {
  return (fotos || []).filter(f => f && /^https:\/\//.test(f.url || '')).map((f, i) => ({ f, i })).sort((a, b) =>
    ((a.f.origem === 'proprietario' ? 0 : 1) - (b.f.origem === 'proprietario' ? 0 : 1)) ||
    ((TYPE_RANK[a.f.tipo] ?? 2) - (TYPE_RANK[b.f.tipo] ?? 2)) || (a.i - b.i)).map(x => x.f);
}

function download(url, dest) {
  try {
    const out = execFileSync('curl', ['-sL', '-m', '40', '-o', dest, '-w', '%{http_code} %{content_type}', url], { encoding: 'utf8' });
    const [code, type] = out.split(' ');
    const ok = code === '200' && /^image\/(jpeg|png|webp)/.test(type) && fs.statSync(dest).size >= MIN_BYTES;
    if (!ok) fs.rmSync(dest, { force: true });
    return ok ? type : null;
  } catch (e) {
    fs.rmSync(dest, { force: true });
    return null;
  }
}

function main() {
  const [listFile, outDir] = process.argv.slice(2);
  if (!listFile || !outDir) { console.error('Uso: node scripts/import-photo-urls.js <lista.json> <pasta-saida>'); process.exit(1); }
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'establishments.json'), 'utf8'));
  const ids = new Set(db.establishments.map(s => s.id));
  fs.mkdirSync(path.join(outDir, 'extras'), { recursive: true });
  const manifest = {};
  const tally = { ok: 0, semFoto: 0, naoConfere: 0, idDesconhecido: 0, falhou: 0 };
  parseList(fs.readFileSync(listFile, 'utf8')).forEach(r => {
    if (!ids.has(r.id)) { tally.idDesconhecido++; return console.log(`??  ${r.id}: id não existe no cadastro`); }
    if (r.confere === false) { tally.naoConfere++; return console.log(`--  ${r.id}: marcado como não conferido`); }
    const fotos = rankPhotos(r.fotos);
    if (!fotos.length) { tally.semFoto++; return console.log(`--  ${r.id}: sem fotos na lista`); }
    let cover = null;
    fotos.forEach((f, i) => {
      const tmp = path.join(outDir, 'extras', `${r.id}-${i + 1}`);
      const type = download(highRes(f.url), tmp);
      if (!type) return;
      const ext = type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : '.jpg';
      fs.renameSync(tmp, tmp + ext);
      if (!cover) {
        cover = path.join(outDir, r.id + ext);
        fs.copyFileSync(tmp + ext, cover);
        manifest[r.id] = { sourceUrl: r.maps_url || f.url, imageUrl: f.url, tipo: f.tipo || null, origem: f.origem || null, credit: f.credit || null };
      }
    });
    if (cover) { tally.ok++; console.log(`ok  ${r.id} (${fotos.length} foto(s) na lista)`); }
    else { tally.falhou++; console.log(`xx  ${r.id}: nenhuma foto pôde ser baixada`); }
  });
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nResumo: ${tally.ok} com capa, ${tally.semFoto} sem fotos, ${tally.naoConfere} não conferidos, ${tally.falhou} com falha no download, ${tally.idDesconhecido} ids desconhecidos.`);
  console.log(`Próximo passo: python3 scripts/add-photos.py ${outDir}`);
}

if (require.main === module) main();
module.exports = { highRes, parseList, rankPhotos };
