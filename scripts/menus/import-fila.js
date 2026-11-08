#!/usr/bin/env node
/* Importa os resultados do Agente de Cardápios (Claude in Chrome): o bloco de linhas JSON que ele devolve no fim de cada cidade
   (prompts gerados por scripts/menus/agent-prompts.js).
   Uma linha JSON por loja (formato em data/research/cardapios/AGENTE-CARDAPIOS.md).

   Uso: node scripts/menus/import-fila.js <resultados.jsonl>            → só mostra o plano (nada é gravado)
        node scripts/menus/import-fila.js <resultados.jsonl> --apply    → grava

   O que grava (com --apply):
   - link de cardápio digital de plataforma com leitor → data/research/cardapios/fontes.json (depois: capture → normalize → images → apply);
   - link de cardápio sem leitor (Drive, Canva, PDF, site próprio) → fontes.json com `pendente`, para transcrição manual;
   - WhatsApp achado no perfil/link da bio, só se a loja ainda não tem → establishments.json com whatsappSource = perfil ou link da bio;
   - Instagram que faltava, só com cidadeConferida = true → establishments.json;
   - itens transcritos de destaque → rascunho data/research/cardapios/<id>.json (platform "visual", sem foto). O rascunho
     NÃO vai para o site sozinho: confira contra o destaque e rode `node scripts/menus/apply.js <id>`.
   Tudo que for divergente (WhatsApp diferente do cadastrado, cidade não conferida, perfil duvidoso) só aparece no relatório. */
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');

const ROOT = path.join(__dirname, '..', '..');
const DB_FILE = path.join(ROOT, 'data', 'establishments.json');
const FONTES_FILE = path.join(ROOT, 'data', 'research', 'cardapios', 'fontes.json');
const SNAP_DIR = path.join(ROOT, 'data', 'research', 'cardapios');

/* host do link → leitor em adapters/ (null: sem leitor; vira pendente de transcrição) */
const PLATFORMS = [
  [/aiqfome\.com/, 'aiqfome'], [/maisdeliveryapp\.com\.br/, 'maisdelivery'], [/brendi\.com\.br/, 'brendi'], [/yooga\.app/, 'yooga'],
  [/saipos\.com/, 'saipos'], [/vendanozap\.app/, 'vendanozap'], [/bigd\.im/, 'bigdim'], [/pedir\.delivery/, 'pedirdelivery'],
  [/zionpdv/, 'zionpdv'], [/beefood\.com\.br/, 'beefood'], [/expressodelivery|expresso\.delivery/, 'expresso'],
  [/cardapioweb\.com/, 'cardapioweb'], [/foodsapp\.com\.br/, 'foodsapp'], [/menudino\.com/, 'menudino'], [/gynfood\.com\.br/, 'gynfood'],
  [/meucardapio\.ai/, 'meucardapio'], [/goomer\.app/, 'goomer'], [/zapdelivery/, 'zapdelivery'], [/ola\.click|olaclick/, 'olaclick'],
  [/takeat\.app/, 'takeat'], [/anota\.ai/, 'anotaai'], [/compraqui/, 'compraqui'], [/vemmenu/, 'vemmenu'], [/godly/, 'godly']
];
const MANUAL = [[/drive\.google\.com|docs\.google\.com/, 'Google Drive'], [/canva\.(com|site)/, 'Canva'], [/\.pdf(\?|$)/i, 'PDF'], [/ifood\.com/, 'iFood'], [/wabiz/, 'wabiz']];

const isUrl = u => typeof u === 'string' && /^https?:\/\/\S+$/i.test(u.trim());
const digits = v => String(v || '').replace(/\D/g, '');
const handleOf = u => { const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(u || ''); return m && !/^(explore|p|reel|stories)$/i.test(m[1]) ? m[1].toLowerCase() : null; };

function platformOf(url) {
  for (const [re, p] of PLATFORMS) if (re.test(url)) return { platform: p };
  for (const [re, label] of MANUAL) if (re.test(url)) return { platform: 'manual', label };
  return { platform: 'manual', label: 'site próprio' };
}

/* WhatsApp brasileiro: 55 + DDD + 8 ou 9 dígitos. */
function waNumber(v) {
  let d = digits(v);
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}

/* Itens transcritos → seções no formato normalizado (preço obrigatório; sem preço legível fica de fora). */
function sectionsFrom(itens, notes) {
  const bySec = new Map(), id = L.idFactory();
  let skipped = 0;
  itens.forEach(it => {
    if (!it || !it.nome) return;
    const sizes = (it.tamanhos || []).map(t => ({ name: t.nome, priceCents: L.cents(t.preco) })).filter(t => t.name && t.priceCents > 0);
    let item = { sourceId: id(it.nome), name: L.displayName(it.nome), description: it.descricao ? L.displayText(it.descricao) : '', priceCents: L.cents(it.preco), originalPriceCents: null, imageUrl: null, options: [] };
    if (sizes.length) { const s = L.sizesToItem(sizes); if (s) Object.assign(item, s); }
    if (!(item.priceCents > 0)) { skipped++; notes.push('"' + it.nome + '" sem preço legível: fora do cardápio.'); return; }
    const extras = (it.adicionais || []).map(a => ({ name: a.nome, priceCents: L.cents(a.preco) || 0 })).filter(a => a.name);
    if (extras.length) { const g = L.optionGroup('Adicionais', 0, extras.length, extras); if (g) item.options.push(g); }
    const sec = L.displayName(it.secao) || 'Cardápio';
    if (!bySec.has(sec)) bySec.set(sec, []);
    bySec.get(sec).push(item);
  });
  return { sections: [...bySec].map(([name, items]) => ({ name, items })), skipped };
}

function main() {
  const file = process.argv[2], apply = process.argv.includes('--apply');
  if (!file || !fs.existsSync(file)) { console.error('Uso: node scripts/menus/import-fila.js <resultados.jsonl> [--apply]'); process.exit(1); }
  const dbRaw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')), byId = new Map(dbRaw.establishments.map(s => [s.id, s]));
  const fontesRaw = JSON.parse(fs.readFileSync(FONTES_FILE, 'utf8')), fontes = fontesRaw.fontes;
  const today = new Date().toISOString().slice(0, 10), VIA = 'Agente de Cardápios (Claude in Chrome), ' + today;
  const plan = { cardapio: [], pendente: [], whatsapp: [], instagram: [], rascunho: [], revisar: [], nada: [] };

  const lines = fs.readFileSync(file, 'utf8').split('\n').map(l => l.trim().replace(/^```(?:json)?|```$/g, '')).filter(l => l.startsWith('{'));
  lines.forEach((line, n) => {
    let r;
    try { r = JSON.parse(line); } catch (e) { plan.revisar.push(`linha ${n + 1}: JSON inválido (${e.message})`); return; }
    const s = byId.get(r.id);
    if (!s) { plan.revisar.push(`${r.id}: id não existe no cadastro`); return; }
    const tag = `${s.name} (${s.city})`;
    if (r.cidadeConferida !== true) { plan.revisar.push(`${tag}: cidade não conferida${r.obs ? ' — ' + r.obs : ''}`); return; }
    let did = false;
    const perfil = isUrl(r.perfil) ? r.perfil.trim() : null;

    // Instagram que faltava
    const h = handleOf(perfil);
    if (h && !s.instagram) { plan.instagram.push(`${tag}: @${h}`); if (apply) s.instagram = h; did = true; }
    else if (h && s.instagram && s.instagram.toLowerCase() !== h) plan.revisar.push(`${tag}: Instagram do agente @${h} ≠ cadastro @${s.instagram}`);

    // Cardápio digital
    if (isUrl(r.cardapio)) {
      const url = r.cardapio.trim(), p = platformOf(url), cur = fontes[s.id];
      if (cur && !cur.motivo && !cur.pendente && cur.url !== url) plan.revisar.push(`${tag}: link novo ${url} ≠ fontes ${cur.url}`);
      else if (!s.menu.length) {
        const entry = p.platform === 'manual' ? { url, platform: 'visual', pendente: `${p.label}: transcrição manual (.claude/skills/cardapio-visual)`, via: VIA }
                                              : { url, platform: p.platform, via: VIA };
        (p.platform === 'manual' ? plan.pendente : plan.cardapio).push(`${tag}: ${p.platform === 'manual' ? p.label : p.platform} → ${url}`);
        if (apply) fontes[s.id] = entry;
        did = true;
      }
    }

    // WhatsApp (canal do próprio estabelecimento)
    const wa = waNumber(r.whatsapp), fonte = /link da bio/i.test(r.whatsappFonte || '') ? (isUrl(r.linkBio) ? r.linkBio.trim() : null)
      : /perfil/i.test(r.whatsappFonte || '') ? perfil : /card[aá]pio/i.test(r.whatsappFonte || '') ? (isUrl(r.cardapio) ? r.cardapio.trim() : null) : null;
    if (wa && fonte && !s.whatsapp) { plan.whatsapp.push(`${tag}: ${wa} (fonte ${fonte})`); if (apply) { s.whatsapp = wa; s.whatsappSource = fonte; } did = true; }
    else if (wa && s.whatsapp && digits(s.whatsapp) !== wa) plan.revisar.push(`${tag}: WhatsApp do agente ${wa} ≠ cadastro ${s.whatsapp}`);
    else if (wa && !fonte && !s.whatsapp) plan.revisar.push(`${tag}: WhatsApp ${wa} sem fonte (perfil/link da bio) — não entra`);

    // Itens transcritos de destaque → rascunho visual (conferência antes de ir ao ar)
    if (Array.isArray(r.itens) && r.itens.length && !s.menu.length && !isUrl(r.cardapio)) {
      const notes = ['Transcrito pelo Agente de Cardápios (Claude in Chrome) do destaque ' + (r.destaque || '?') + ': conferir contra a arte antes do apply.'];
      const { sections, skipped } = sectionsFrom(r.itens, notes);
      const total = sections.reduce((a, x) => a + x.items.length, 0);
      if (total) {
        const snapFile = path.join(SNAP_DIR, s.id + '.json');
        if (fs.existsSync(snapFile)) plan.revisar.push(`${tag}: já existe ${path.relative(ROOT, snapFile)}; rascunho não sobrescrito`);
        else {
          plan.rascunho.push(`${tag}: ${total} itens em ${sections.length} seções${skipped ? `, ${skipped} sem preço` : ''} (destaque ${r.destaque || '?'})`);
          if (apply) {
            const snap = L.snapshot({ id: s.id, platform: 'visual', url: perfil || ('https://www.instagram.com/' + s.instagram + '/'), capturedAt: new Date().toISOString() }, sections, { notes });
            fs.writeFileSync(snapFile, JSON.stringify(snap, null, 2) + '\n');
            if (!fontes[s.id]) fontes[s.id] = { url: snap.source, platform: 'visual', via: VIA + '; destaque ' + (r.destaque || '?') + '; rascunho a conferir' };
          }
          did = true;
        }
      }
    }
    if (!did) plan.nada.push(`${tag}${r.obs ? ': ' + r.obs : ''}`);
  });

  const T = { cardapio: 'Cardápio digital (vai para capture → normalize)', pendente: 'Cardápio em Drive/Canva/PDF/site (transcrição manual)', whatsapp: 'WhatsApp novo', instagram: 'Instagram novo',
    rascunho: 'Rascunho de cardápio transcrito (conferir antes do apply)', revisar: 'Revisar à mão (nada gravado)', nada: 'Sem cardápio encontrado' };
  console.log(`${lines.length} resultados lidos${apply ? ' — GRAVANDO' : ' — prévia (use --apply para gravar)'}\n`);
  Object.entries(plan).forEach(([k, v]) => { if (v.length) console.log(`## ${T[k]}: ${v.length}\n` + v.map(x => '  - ' + x).join('\n') + '\n'); });
  if (apply) {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbRaw, null, 2) + '\n');
    fs.writeFileSync(FONTES_FILE, JSON.stringify(fontesRaw, null, 2) + '\n');
    const ids = plan.cardapio.length ? '(ids acima)' : '';
    console.log('Próximos passos: node scripts/menus/capture.js <ids> → normalize.js → images.py → apply.js ' + ids + '; rascunhos: conferir e apply.js <id>; depois rank-stores.js, build-data.js e npm test.');
  }
}

if (require.main === module) main();
module.exports = { platformOf, waNumber, sectionsFrom };
