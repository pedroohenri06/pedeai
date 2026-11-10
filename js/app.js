/* PedeAi — interface: listagem por cidade/categoria, página do estabelecimento, carrinho e envio pelo WhatsApp. */
(function () {
  'use strict';
  var S = window.PedeAiSchedule, C = window.PedeAiCore, DB = window.PEDEAI_DATA || { establishments: [] }, STORES = DB.establishments, BY_ID = {};
  STORES.forEach(function (s) { BY_ID[s.id] = s; });
  var esc = C.escapeHtml;

  /* Fotos das categorias (as mesmas já aprovadas na faixa de categorias). São ilustrativas e não representam o estabelecimento. */
  var CATEGORY_PHOTOS = {
    'Hambúrguer': 'assets/restaurant-be2bd7c5c2fc.webp', 'Pizza': 'assets/restaurant-24d02d921c16.webp',
    'Sushi': 'assets/restaurant-f7e71caf6cf6.webp', 'Açaí': 'assets/restaurant-c7acf49ef428.webp',
    'Brasileira': 'assets/restaurant-044a480791d2.webp', 'Pastel': 'assets/restaurant-46a1b369aad4.webp',
    'Churrasco': 'assets/restaurant-4674ee361a2b.webp', 'Doces': 'assets/restaurant-295265dcbf3c.webp',
    'Saudável': 'assets/restaurant-9b67528e7ae2.webp', 'Padaria': 'assets/restaurant-b965f13d4032.webp'
  };
  var CAMPAIGNS = { 'Hambúrguer': ['assets/media-b3a1a3df0863.webp', 'Hambúrguer que dá vontade só de olhar'], 'Pizza': ['assets/media-be017289232c.webp', 'Pizza: o clássico da noite'], 'Sushi': ['assets/media-be042ef87c49.webp', 'Japonês com apresentação impecável'], 'Açaí': ['assets/media-c4516edfbce2.webp', 'Açaí do seu jeito'] };
  var GENERIC_CAMPAIGN = ['assets/media-ba6e416c2463.webp', 'Seu pedido, direto no WhatsApp'];
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';

  var state = { city: readStorage('pedeai-city') || 'Barra do Garças', category: 'Todos' };
  if (C.CITIES.indexOf(state.city) < 0) state.city = 'Barra do Garças';

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('restaurantGrid'), catBox = $('categories'), search = $('search'), clear = $('searchClear'), empty = $('empty'), count = $('resultCount'), title = $('resultTitle');

  function readStorage(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* Card: logotipo oficial quando existe; senão, a foto da loja; senão, a imagem da categoria. */
  /* Loja ainda sem logo/foto própria e sem cardápio: em vez de foto ilustrativa de comida, card da marca PedeAi com
     "Em negociação" — o cliente entende que o estabelecimento ainda não está disponível para pedido. */
  function isSoon(s) { return !s.logo && !s.image && !C.menuSize(s); }
  var SOON_MEDIA = '<div class="restaurant-media restaurant-media--soon"><span class="soon-mark" aria-hidden="true"><img src="assets/media-eec8624c4b7f.png" alt="" width="44" height="44"></span><span class="soon-word" aria-hidden="true">PedeAi</span><span class="soon-chip">Em negociação</span></div>';
  function photoOf(s) { var i = s.logo || s.image; return i ? i.thumb || i.src : CATEGORY_PHOTOS[s.category]; }

  /* ---------------- Listagem ---------------- */
  function storesInCity() { return C.filterStores(STORES, { city: state.city }); }

  /* Faixa de categorias: prato real de um parceiro da região em cada círculo (scripts/build-category-images.py).
     Mostra só as categorias com lugares na cidade, da maior para a menor. */
  var CATEGORY_ICONS = {
    'Hambúrguer': 'hamburguer', 'Pizza': 'pizza', 'Sushi': 'sushi', 'Açaí': 'acai', 'Brasileira': 'brasileira',
    'Pastel': 'pastel', 'Churrasco': 'churrasco', 'Doces': 'doces', 'Padaria': 'cafe'
  };
  var BRAND_MARK = 'assets/media-eec8624c4b7f.png';

  function categoriesInCity() {
    var stores = storesInCity(), counts = {};
    stores.forEach(function (s) { counts[s.category] = (counts[s.category] || 0) + 1; });
    var cats = C.CATEGORIES.filter(function (c) { return counts[c] && CATEGORY_ICONS[c]; })
      .sort(function (x, y) { return counts[y] - counts[x] || C.CATEGORIES.indexOf(x) - C.CATEGORIES.indexOf(y); });
    return [{ name: 'Todos', count: stores.length }].concat(cats.map(function (c) { return { name: c, count: counts[c] }; }));
  }

  function renderCats() {
    var cats = categoriesInCity(), key = state.city + '|' + cats.map(function (c) { return c.name + c.count; }).join(',');
    if (!cats.some(function (c) { return c.name === state.category; })) state.category = 'Todos';
    if (catBox.dataset.key !== key) {
      catBox.dataset.key = key;
      catBox.innerHTML = cats.map(function (c, i) {
        var all = c.name === 'Todos';
        var img = all
          ? '<img src="' + BRAND_MARK + '" alt="" width="64" height="64" decoding="async">'
          : '<img src="assets/categories/' + CATEGORY_ICONS[c.name] + '.webp" alt="" width="240" height="240" loading="' + (i < 6 ? 'eager' : 'lazy') + '" decoding="async">';
        return '<button class="cat' + (all ? ' cat--all' : '') + '" data-cat="' + esc(c.name) + '" type="button" aria-pressed="false">' +
          '<span class="cat-disc' + (all ? ' cat-disc--brand' : '') + '">' + img + '</span>' +
          '<span class="cat-caption">' + esc(c.name) + '</span></button>';
      }).join('');
      catBox.querySelectorAll('.cat').forEach(function (b) {
        b.onclick = function () { state.category = b.dataset.cat; renderCats(); renderCampaign(); render(); catBox.scrollTo({ left: Math.max(0, b.offsetLeft - catBox.clientWidth / 2 + b.offsetWidth / 2), behavior: reduceMotion }); requestAnimationFrame(function () { revealResults(true); }); };
      });
    }
    catBox.querySelectorAll('.cat').forEach(function (b) {
      var selected = b.dataset.cat === state.category;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
  }

  function renderCampaign() {
    var section = $('categoryCampaign'), rail = $('bannerRail');
    if (state.category === 'Todos') { section.hidden = true; if (rail) rail.hidden = false; return; }
    var campaign = CAMPAIGNS[state.category] || GENERIC_CAMPAIGN, img = $('categoryCampaignImage');
    img.src = campaign[0];
    img.alt = campaign[1] + ' no PedeAi Delivery';
    $('categoryCampaignLabel').textContent = campaign[1];
    section.hidden = false;
    if (rail) rail.hidden = true;
  }

  /* Nos cards, só o aviso de cadastro em verificação; contatos e pedido ficam na página da loja. */
  function badgeOf(s) {
    return ''; /* estado interno de cadastro não aparece para o consumidor */
  }

  /* Linha operacional do card: status calculado pela grade da loja (fuso da loja, não do aparelho), previsão de entrega
     quando aberta ou sem status, e a próxima abertura quando fechada. Sem dado confiável, nada é exibido. */
  function opsHtml(s, now) {
    if (isSoon(s)) return '<span class="store-soon">Aguardando cardápio</span>';
    var st = S.status(s.schedule, now), eta = S.deliveryEstimate(s), out = [];
    if (st.state !== 'unknown') out.push('<span class="store-status is-' + st.state + '"><i class="status-dot" aria-hidden="true"></i>' + esc(st.label) + '</span>');
    if (eta) out.push('<span class="store-eta">' + esc(eta.label) + '</span>');
    // Próxima abertura: cabe no card a partir do tablet; no celular fica na página da loja.
    if (!out.length && C.menuSize(s)) out.push('<span class="delivery-free">Cardápio</span>');
    var next = st.state !== 'open' && st.short ? '<span class="store-next"><i class="dot"></i>' + esc(st.short) + '</span>' : '';
    return out.join('<i class="dot"></i>') + next;
  }


  /* Atualiza só a linha de status dos cards na tela (sem refazer a lista) — a cada minuto e ao voltar para a aba. */
  function refreshOps() {
    var now = new Date();
    grid.querySelectorAll('.restaurant-meta[data-ops]').forEach(function (el) {
      var s = BY_ID[el.dataset.ops], html = s && opsHtml(s, now);
      if (s && el.innerHTML !== html) el.innerHTML = html;
    });
  }

  /* Com busca: primeiro onde o termo está no nome, depois na categoria, no bairro e por último só nos pratos.
     Em cada grupo, lojas abertas agora antes das fechadas, mantendo a ordem de destaque (sort estável). */
  function openFirst(list, now, q) {
    var weight = { open: 0, unknown: 1, paused: 2, closed: 2 };
    return list.map(function (s, i) { return { s: s, i: i, r: C.searchScore(s, q), w: isSoon(s) ? 3 : weight[S.status(s.schedule, now).state] }; })
      .sort(function (a, b) { return a.r - b.r || a.w - b.w || a.i - b.i; }).map(function (x) { return x.s; });
  }

  /* Leva a lista de resultados para logo abaixo do cabeçalho fixo (busca e categoria). Rola só se o título
     não estiver visível, sem animação durante a digitação (evita "pulos" com o teclado aberto). */
  function revealResults(smooth) {
    var head = $('header').getBoundingClientRect().height, top = $('restaurantes').getBoundingClientRect().top;
    if (top >= head - 1 && top <= head + 24) return;
    var y = Math.max(0, scrollY + top - head - 4);
    if (smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches) scrollTo({ top: y, behavior: 'smooth' });
    else { var root = document.documentElement, prev = root.style.scrollBehavior; root.style.scrollBehavior = 'auto'; scrollTo(0, y); root.style.scrollBehavior = prev; }
  }

  function render() {
    var q = search.value.trim(), now = new Date();
    var list = openFirst(C.rankStores(C.filterStores(STORES, { city: state.city, category: state.category, query: q })), now, q);
    var inCity = storesInCity().length;
    document.body.classList.toggle('is-searching', !!q);
    title.textContent = q ? 'Resultados para “' + q + '”' : state.category === 'Todos' ? 'Em ' + state.city : state.category + ' em ' + state.city;
    count.textContent = list.length + ' ' + (list.length === 1 ? 'lugar' : 'lugares');
    grid.innerHTML = list.map(function (s) {
      var meta = [s.category].concat(s.kind && C.normalize(s.kind) !== C.normalize(s.category) ? [s.kind] : []);
      var media = isSoon(s) ? SOON_MEDIA : '<div class="restaurant-media"><img src="' + photoOf(s) + '"' + (s.logo || s.image ? ' onerror="this.onerror=null;this.src=\'' + CATEGORY_PHOTOS[s.category] + '\'"' : '') + ' alt="' + (s.logo || s.image ? esc((s.logo || s.image).alt || s.name) : '') + '" loading="lazy" decoding="async">' + badgeOf(s) + (s.logo || s.image ? '' : '<span class="photo-tag">Imagem ilustrativa</span>') + '</div>';
      return '<a class="restaurant reveal visible' + (isSoon(s) ? ' restaurant--soon' : '') + '" href="#/loja/' + s.id + '" data-id="' + s.id + '">' + media + '<div class="restaurant-info"><h3 class="restaurant-name">' + esc(s.name) + '</h3><p class="restaurant-kind">' + esc(meta.join(' · ')) + '</p><div class="restaurant-meta" data-ops="' + esc(s.id) + '">' + opsHtml(s, now) + '</div></div></a>';
    }).join('');
    empty.style.display = list.length ? 'none' : 'block';
    empty.querySelector('h3').textContent = q ? 'Nada encontrado para “' + q + '”' : inCity ? 'Nada por aqui ainda' : 'Chegando em ' + state.city;
    empty.querySelector('p').textContent = q ? 'Confira a escrita ou tente outro prato, como pizza, açaí ou lanche.' : inCity ? 'Tente buscar outro prato ou categoria.' : 'Estamos cadastrando os estabelecimentos desta cidade. Tem um negócio aqui? Fale com a gente.';
  }

  /* ---------------- Página do estabelecimento (js/store.js) ---------------- */
  var Store = window.PedeAiStore;
  Store.onBack = goHome;

  function openStore(id) {
    var s = STORES.find(function (x) { return x.id === id; });
    if (!s) { toast('Estabelecimento não encontrado'); history.replaceState(null, '', location.pathname + location.search); return Store.close(true); }
    Store.open(s);
  }

  function goHome() {
    if (C.parseRoute(location.hash).name === 'store') {
      if (history.state && history.state.pedeaiFromList) history.back();
      else { history.replaceState(null, '', location.pathname + location.search + '#restaurantes'); route(); }
    } else Store.close();
  }

  /* ---------------- Rotas ---------------- */
  function route() {
    var r = C.parseRoute(location.hash);
    if (r.name === 'store') openStore(r.id);
    else if (Store.isOpen()) Store.close();
  }

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  window.toast = toast;

  /* ---------------- Eventos ---------------- */
  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.restaurant');
    if (!card || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    history.pushState({ pedeaiFromList: true }, '', '#/loja/' + card.dataset.id);
    route();
  });
  addEventListener('hashchange', route);
  addEventListener('popstate', route);
  /* Busca: filtra a cada tecla (lista leve: um innerHTML por tecla) e mostra os resultados logo abaixo
     do campo — banner e categorias saem de cena enquanto há texto. Enter fecha o teclado. */
  var lastQuery = '';
  function runSearch() {
    var q = search.value.trim();
    clear.style.display = search.value ? 'grid' : 'none';
    if (q === lastQuery) return;
    var started = !lastQuery && q, ended = lastQuery && !q;
    lastQuery = q;
    render();
    if (started || (q && !ended)) revealResults(false);
    if (ended) { var root = document.documentElement, prev = root.style.scrollBehavior; root.style.scrollBehavior = 'auto'; scrollTo(0, 0); root.style.scrollBehavior = prev; }
  }
  search.oninput = runSearch;
  search.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); search.blur(); } else if (e.key === 'Escape' && search.value) { search.value = ''; runSearch(); } };
  clear.onclick = function () { search.value = ''; runSearch(); search.focus({ preventScroll: true }); };
  $('allCats').onclick = function () { state.category = 'Todos'; renderCats(); catBox.scrollTo({ left: 0, behavior: reduceMotion }); renderCampaign(); render(); };
  document.addEventListener('pedeai:city', function (e) { state.city = e.detail; renderCats(); renderCampaign(); render(); });
  $('partnerBtn').onclick = function () { window.open('https://wa.me/5512936290045?text=' + encodeURIComponent('Olá! Quero cadastrar meu restaurante no PedeAi Delivery.'), '_blank', 'noopener'); };
  document.querySelectorAll('.nav-item').forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll('.nav-item').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      if (Store.isOpen()) goHome();
      var n = b.dataset.nav;
      if (n === 'search') { scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(function () { search.focus(); }, 450); }
      else if (n === 'categories') document.querySelector('.categories').scrollIntoView({ behavior: 'smooth' });
      else if (n === 'partner') $('parceiros').scrollIntoView({ behavior: 'smooth' });
      else scrollTo({ top: 0, behavior: 'smooth' });
    };
  });
  addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !Store.isOpen() || document.body.classList.contains('city-modal-open')) return;
    if (e.target.closest && e.target.closest('#legalDialog')) return; /* o documento legal trata o próprio Esc */
    if (!Store.handleEscape()) goHome();
  });
  addEventListener('scroll', function () { $('header').classList.toggle('scrolled', scrollY > 12); }, { passive: true });

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }); }, { threshold: 0.1 }) : null;
  document.querySelectorAll('.reveal').forEach(function (e) { io ? io.observe(e) : e.classList.add('visible'); });

  renderCats();
  renderCampaign();
  render();
  route();
  /* Status muda com o relógio (abre/fecha/pausa): atualiza a linha dos cards a cada minuto e ao voltar para a aba. */
  setInterval(function () { if (!document.hidden) refreshOps(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshOps(); });
})();
