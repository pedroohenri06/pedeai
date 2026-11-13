#!/usr/bin/env node
/* Gera abordagem/index.html: ferramenta interna do Pedro para abordar os restaurantes cadastrados, uma cidade por vez.
   Cada loja tem um botão que abre o WhatsApp com a mensagem já personalizada (nome, cidade, link da loja).
   O progresso (enviado, respondeu, fechou, sem interesse) fica salvo no próprio celular.
   Página sem link a partir do site e fora dos buscadores (noindex).
   Uso: node scripts/abordagem.js   (rodar de novo quando o cadastro de lojas mudar) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'establishments.json'), 'utf8')).establishments;

const digits = s => String(s || '').replace(/\D/g, '');
function mobile(n) { // celular brasileiro com DDD: 11 dígitos, terceiro dígito 9
  n = digits(n); if (n.startsWith('55')) n = n.slice(2);
  return n.length === 11 && n[2] === '9' ? '55' + n : '';
}
const quality = s => {
  const m = Array.isArray(s.menu) ? s.menu : [], img = m.filter(i => i.image).length;
  if (m.length < 15 || img / m.length < 0.8 || !s.logo) return 0;
  return img * 2 + Math.min(m.length, 60) + (s.image ? 10 : 0);
};
const good = db.filter(quality).sort((a, b) => quality(b) - quality(a));
// Exemplo para quem ainda não tem cardápio: mesma categoria na mesma cidade, senão o melhor da cidade,
// senão a mesma categoria em outra cidade, senão o melhor de todos.
function exampleFor(s) {
  const e = good.find(g => g.city === s.city && g.category === s.category) || good.find(g => g.city === s.city) ||
    good.find(g => g.category === s.category) || good[0];
  return e ? { id: e.id, n: e.name, c: e.city } : null;
}
const stores = db.map(s => {
  const wa = mobile(s.whatsapp) || mobile(s.phone);
  return { id: s.id, n: s.name, c: s.city, k: s.category || '', b: s.neighborhood || '', w: wa,
    t: wa ? '' : digits(s.phone), ig: s.instagram || '', m: Array.isArray(s.menu) && s.menu.length > 0, ex: (Array.isArray(s.menu) && s.menu.length) ? null : exampleFor(s) };
}).sort((a, b) => a.c.localeCompare(b.c, 'pt') || a.n.localeCompare(b.n, 'pt'));

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Abordagem de parceiros | PedeAi</title>
<link rel="icon" href="/assets/media-778d926eb50d.png">
<style>
@font-face{font-family:'DM Sans';font-weight:400 700;font-display:swap;src:url(/planos/fonts/dm-sans-latin.woff2) format('woff2')}
@font-face{font-family:'Montserrat';font-weight:600 900;font-display:swap;src:url(/planos/fonts/montserrat-latin.woff2) format('woff2')}
:root{--red:#e51b2b;--ink:#221719;--muted:#6f6264;--cream:#f8f5ef;--paper:#fffdfa;--line:rgba(51,8,14,.12);--ok:#1f8a4c}
*{box-sizing:border-box;margin:0}body{font:15px/1.45 'DM Sans',system-ui,sans-serif;color:var(--ink);background:var(--cream);padding-bottom:40px}
header{position:sticky;top:0;z-index:5;background:#170507;color:#fff;padding:12px 16px 10px}
h1{font:800 18px Montserrat,sans-serif}h1 small{font:500 12px 'DM Sans';color:#d9b9bd;display:block}
.bar{display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.bar button{flex:none;height:36px;padding:0 12px;border-radius:99px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;font:700 13px 'DM Sans';white-space:nowrap}
.bar button[aria-pressed=true]{background:#fff;color:#170507}
.stats{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:12.5px;color:#e9d3d6}.stats b{color:#fff}
.today{margin-left:auto}.today b{color:#7fe0a6}.today.over b{color:#ff8a92}
main{max-width:760px;margin:0 auto;padding:14px 16px}
.filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.filters button{height:34px;padding:0 12px;border-radius:99px;border:1px solid var(--line);background:var(--paper);font:600 13px 'DM Sans';color:var(--ink)}
.filters button[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}
details.msg{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:10px 14px;margin-bottom:12px}
details.msg summary{font-weight:700;cursor:pointer}details.msg pre{white-space:pre-wrap;font:14px/1.45 'DM Sans';margin-top:8px;color:var(--muted)}
.card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin-bottom:10px}
.card.st-enviado{border-left:5px solid #f0a020}.card.st-respondeu{border-left:5px solid #2d7fe0}.card.st-fechou{border-left:5px solid var(--ok)}.card.st-sem{opacity:.55}
.top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.nm{font:800 15.5px Montserrat,sans-serif;letter-spacing:-.01em}.meta{font-size:12.5px;color:var(--muted)}
.tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:#f1e8e3;color:var(--muted);white-space:nowrap}
.tag.enviado{background:#fff1d6;color:#8a5a00}.tag.respondeu{background:#dfeeff;color:#1d5fae}.tag.fechou{background:#e2f5ea;color:var(--ok)}
.acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.acts a,.acts button{height:44px;padding:0 14px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;font:700 14px 'DM Sans';text-decoration:none;border:1px solid var(--line);background:#fff;color:var(--ink)}
.acts .send{background:#1f9d55;border-color:#1f9d55;color:#fff;flex:1;justify-content:center}
.acts .send svg{width:20px;height:20px}
.st{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.st button{height:34px;padding:0 10px;border-radius:10px;border:1px solid var(--line);background:#fff;font:600 12.5px 'DM Sans';color:var(--muted)}
.st button[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}
.when{font-size:11.5px;color:var(--muted);margin-top:6px}
.acts .fup{background:#fff7e6;border-color:#f0c060;color:#7a4b00;flex:1;justify-content:center}.acts .fup svg{width:18px;height:18px}
.peak{background:#fff1d6;color:#7a4b00;border-radius:12px;padding:10px 14px;font-weight:600;font-size:13.5px;margin-bottom:12px}
.tags{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.tag.nm-tag{background:#fde7e9;color:#b3121f}
.nomenu{margin-top:8px;padding:8px 12px;border-radius:10px;background:#fff4f4;color:#7d1019;font-size:13px}.nomenu a{color:#b3121f;font-weight:700}
.acts .copy{flex:1;justify-content:center;background:#f7f2ee}
.empty{padding:30px;text-align:center;color:var(--muted)}
.note{font-size:12.5px;color:var(--muted);margin:16px 0 0;text-align:center}
</style></head><body>
<header>
  <h1>Abordagem de parceiros<small>Uma cidade por vez · 30 a 50 por dia · 9h–11h e 14h30–17h</small></h1>
  <div class="bar" id="cities" role="group" aria-label="Cidade"></div>
  <div class="stats" id="stats"></div>
</header>
<main>
  <div class="filters" id="filters" role="group" aria-label="Filtro">
    <button data-f="todos" aria-pressed="true">Todos</button><button data-f="novo">A enviar</button><button data-f="enviado">Enviados</button><button data-f="respondeu">Responderam</button><button data-f="fechou">Fecharam</button><button data-f="sem">Sem interesse</button><button data-f="semcardapio">Sem cardápio</button>
  </div>
  <p class="peak" id="peak" hidden>Agora é horário de pico dos restaurantes. Prefira enviar das 9h às 11h ou das 14h30 às 17h.</p>
  <details class="msg"><summary>Ver as mensagens (abertura e lembretes)</summary><pre id="msgPreview"></pre></details>
  <div id="list"></div>
  <p class="note">O progresso fica salvo neste celular. Use sempre o mesmo aparelho para a abordagem.</p>
</main>
<script>
(function () {
  var S = ${JSON.stringify(stores)};
  var LANCAMENTO = Date.parse('2026-11-25T00:00:00-04:00');
  var SITE = 'https://www.pedeaionline.com.br/';
  var META = 50;
  var WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.41Z"/></svg>';
  var KEY = 'pedeai-abordagem-v1';
  var st = {}; try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var cities = []; S.forEach(function (s) { if (cities.indexOf(s.c) < 0) cities.push(s.c); });
  cities.sort(function (a, b) { return S.filter(function (s) { return s.c === b && s.w; }).length - S.filter(function (s) { return s.c === a && s.w; }).length; });
  var city; try { city = localStorage.getItem(KEY + '-cidade'); } catch (e) {}
  if (cities.indexOf(city) < 0) city = cities[0];
  var filter = 'todos';

  // Etapa 1 do fluxo (data/research/comercial/agente-vendas.md): curta, sem link, pergunta pelo responsável.
  function message(s) {
    return 'Olá, tudo bem? Aqui é do PedeAi Delivery, a nova plataforma de delivery de ' + s.c + '. Falo com o responsável pela loja ' + s.n + '?';
  }
  function followUp(s, n) {
    var launched = Date.now() >= LANCAMENTO;
    return n === 1
      ? 'Olá, tudo bem? Retomando meu contato do PedeAi Delivery: a loja ' + s.n + ' já está cadastrada na nossa plataforma, que ' + (launched ? 'já está no ar em ' + s.c : 'estreia em ' + s.c + ' no dia 25/11') + '. Com quem posso falar sobre a ativação da loja?'
      : 'Olá! Esta é a minha última mensagem, para não tomar o seu tempo. Se em algum momento fizer sentido conhecer o PedeAi Delivery, fico à disposição por aqui. Desejo ótimas vendas!';
  }
  // Etapa 2A: apresentação para quem respondeu que é o responsável. Sem cardápio: mostra um exemplo bem feito.
  function intro(s) {
    var launched = Date.now() >= LANCAMENTO, when = launched ? 'que já está no ar em ' + s.c : 'que estreia em ' + s.c + ' no dia 25/11';
    var close = '\\n\\nPosso te mostrar como funciona? Responda:\\n1) Pode mandar\\n2) Prefiro falar com um especialista\\n3) Agora não';
    if (s.m) return 'Que bom falar com você! Sou a assistente virtual do PedeAi Delivery. A loja ' + s.n + ' já aparece na nossa plataforma, ' + when + ': ' + SITE + '#/loja/' + s.id +
      '\\n\\nAqui o restaurante não paga comissão: o cliente monta o pedido no cardápio online e ele chega pronto no seu WhatsApp.' + close;
    return 'Que bom falar com você! Sou a assistente virtual do PedeAi Delivery, a plataforma de delivery ' + when + '.' +
      (s.ex ? '\\n\\nVeja como fica um restaurante na plataforma: ' + SITE + '#/loja/' + s.ex.id : '') +
      '\\n\\nA loja ' + s.n + ' pode ficar assim também: você nos envia as fotos dos pratos e a nossa equipe monta todo o cardápio. O cliente faz o pedido online e ele chega pronto no seu WhatsApp, sem comissão.' + close;
  }
  function daysSince(t) { return Math.floor((Date.now() - t) / 86400000); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function sentToday() { var t = today(); return Object.keys(st).filter(function (k) { return st[k].sentDay === t; }).length; }
  function status(id) { return (st[id] && st[id].s) || 'novo'; }

  function renderCities() {
    document.getElementById('cities').innerHTML = cities.map(function (c) {
      var n = S.filter(function (s) { return s.c === c && s.w; }).length;
      return '<button data-c="' + esc(c) + '" aria-pressed="' + (c === city) + '">' + esc(c) + ' · ' + n + '</button>';
    }).join('');
  }
  function renderStats() {
    var list = S.filter(function (s) { return s.c === city; }), cnt = { enviado: 0, respondeu: 0, fechou: 0, sem: 0 };
    list.forEach(function (s) { var x = status(s.id); if (cnt[x] !== undefined) cnt[x]++; });
    var t = sentToday();
    document.getElementById('stats').innerHTML = '<span><b>' + list.filter(function (s) { return s.w; }).length + '</b> com WhatsApp</span><span><b>' +
      (cnt.enviado + cnt.respondeu + cnt.fechou + cnt.sem) + '</b> abordados</span><span><b>' + list.filter(function (s) { return !s.m && s.w; }).length + '</b> sem cardápio</span><span><b>' + cnt.respondeu + '</b> responderam</span><span><b>' + cnt.fechou + '</b> fecharam</span>' +
      '<span class="today' + (t >= META ? ' over' : '') + '">Hoje: <b>' + t + ' de ' + META + '</b></span>';
  }
  function renderList() {
    var list = S.filter(function (s) { return s.c === city && (filter === 'todos' || (filter === 'semcardapio' ? !s.m : status(s.id) === filter)); });
    list.sort(function (a, b) { return (b.w ? 1 : 0) - (a.w ? 1 : 0); });
    document.getElementById('list').innerHTML = list.length ? list.map(function (s) {
      var x = status(s.id), rec = st[s.id] || {};
      var send = s.w ? '<a class="send" data-send="' + s.id + '" target="_blank" rel="noopener" href="https://wa.me/' + s.w + '?text=' + encodeURIComponent(message(s)) + '">' + WA + (x === 'novo' ? 'Enviar mensagem' : 'Abrir conversa') + '</a>'
        : (s.t ? '<a href="tel:+' + (s.t.length > 11 ? s.t : '55' + s.t) + '">Ligar</a>' : '') + (s.ig ? '<a target="_blank" rel="noopener" href="' + esc(s.ig.indexOf('http') === 0 ? s.ig : 'https://instagram.com/' + s.ig.replace('@', '')) + '">Instagram</a>' : '');
      return '<div class="card st-' + x + '"><div class="top"><div><div class="nm">' + esc(s.n) + '</div><div class="meta">' + esc([s.k, s.b].filter(Boolean).join(' · ')) + (s.w ? '' : ' · sem WhatsApp cadastrado') + '</div></div>' +
        '<span class="tags">' + (!s.m ? '<span class="tag nm-tag">Sem cardápio</span>' : '') + (x !== 'novo' ? '<span class="tag ' + x + '">' + { enviado: 'Enviado', respondeu: 'Respondeu', fechou: 'Fechou', sem: 'Sem interesse' }[x] + '</span>' : '') + '</span></div>' +
        (s.m ? '' : '<div class="nomenu"><b>Sem cardápio na plataforma.</b> Na apresentação, mostre um exemplo' + (s.ex ? ': <a target="_blank" rel="noopener" href="' + SITE + '#/loja/' + s.ex.id + '">' + esc(s.ex.n) + (s.ex.c !== s.c ? ' (' + esc(s.ex.c) + ')' : '') + '</a>' : '') + '.</div>') +
        '<div class="acts">' + send + '<a target="_blank" rel="noopener" href="' + SITE + '#/loja/' + s.id + '">Ver loja</a></div>' +
        (x !== 'novo' && s.w ? '<div class="acts"><button class="copy" data-copy="' + s.id + '">Copiar apresentação (quando responder)</button></div>' : '') + followBtns(s, x, rec) +
        (x !== 'novo' ? '<div class="st" data-id="' + s.id + '">' + ['enviado', 'respondeu', 'fechou', 'sem'].map(function (k) { return '<button data-s="' + k + '" aria-pressed="' + (x === k) + '">' + { enviado: 'Enviado', respondeu: 'Respondeu', fechou: 'Fechou', sem: 'Sem interesse' }[k] + '</button>'; }).join('') + '<button data-s="novo">Desfazer</button></div>' : '') +
        (rec.at ? '<div class="when">Enviado em ' + new Date(rec.at).toLocaleDateString('pt-BR') + '</div>' : '') + '</div>';
    }).join('') : '<p class="empty">Nenhuma loja neste filtro.</p>';
    var first = S.filter(function (s) { return s.c === city && s.w; })[0];
    document.getElementById('msgPreview').textContent = first ? '1) Abertura\\n' + message(first) + '\\n\\n2) Lembrete (2 dias sem resposta)\\n' + followUp(first, 1) + '\\n\\n3) Último lembrete (5 dias)\\n' + followUp(first, 2) : '';
  }
  function followBtns(s, x, rec) {
    if (x !== 'enviado' || !s.w || !rec.at) return '';
    var d = daysSince(rec.at), n = rec.f || 0, next = n + 1;
    if (next > 2) return '<div class="when">Abordagem encerrada (3 mensagens sem resposta).</div>';
    var wait = next === 1 ? 2 : 5;
    if (d < wait) return '<div class="when">Sem resposta? Lembrete ' + (next === 1 ? '1' : 'final') + ' liberado em ' + (wait - d) + ' dia(s).</div>';
    return '<div class="acts"><a class="fup" data-fup="' + s.id + '" data-n="' + next + '" target="_blank" rel="noopener" href="https://wa.me/' + s.w + '?text=' + encodeURIComponent(followUp(s, next)) + '">' + WA + (next === 1 ? 'Enviar lembrete (2 dias)' : 'Enviar último lembrete (5 dias)') + '</a></div>';
  }
  function all() { renderCities(); renderStats(); renderList(); }

  document.getElementById('cities').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; city = b.dataset.c; try { localStorage.setItem(KEY + '-cidade', city); } catch (er) {} all(); scrollTo(0, 0);
  });
  document.getElementById('filters').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; filter = b.dataset.f;
    [].forEach.call(this.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderList();
  });
  document.getElementById('list').addEventListener('click', function (e) {
    var cp = e.target.closest('[data-copy]');
    if (cp) {
      var so = S.filter(function (z) { return z.id === cp.dataset.copy; })[0], txt = intro(so);
      var done = function () { cp.textContent = 'Copiado! Cole no WhatsApp'; setTimeout(function () { cp.textContent = 'Copiar apresentação (quando responder)'; }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () { prompt('Copie a mensagem:', txt); });
      else prompt('Copie a mensagem:', txt);
      return;
    }
    var f = e.target.closest('[data-fup]');
    if (f) { var r = st[f.dataset.fup]; r.f = +f.dataset.n; r.fupAt = Date.now(); save(); setTimeout(all, 300); return; }
    var a = e.target.closest('[data-send]');
    if (a && status(a.dataset.send) === 'novo') { st[a.dataset.send] = { s: 'enviado', at: Date.now(), sentDay: today() }; save(); setTimeout(all, 300); return; }
    var b = e.target.closest('.st button'); if (!b) return;
    var id = b.parentNode.dataset.id;
    if (b.dataset.s === 'novo') delete st[id]; else { st[id] = st[id] || {}; st[id].s = b.dataset.s; }
    save(); all();
  });
  var hr = new Date().getHours() + new Date().getMinutes() / 60;
  document.getElementById('peak').hidden = !((hr >= 11 && hr < 14.5) || hr >= 17.5 || hr < 8);
  all();
})();
</script></body></html>`;
fs.writeFileSync(path.join(ROOT, 'abordagem', 'index.html'), html);
console.log('ok abordagem/index.html', stores.length, 'lojas,', stores.filter(s => s.w).length, 'com WhatsApp');
