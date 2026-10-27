/* PedeAi — interface: listagem por cidade/categoria, página do estabelecimento, carrinho e envio pelo WhatsApp. */
(function () {
  'use strict';
  var C = window.PedeAiCore, DB = window.PEDEAI_DATA || { establishments: [] }, STORES = DB.establishments;
  var esc = C.escapeHtml;

  /* Fotos das categorias (as mesmas já aprovadas na faixa de categorias). São ilustrativas e não representam o estabelecimento. */
  var CATEGORY_PHOTOS = {
    'Hambúrguer': 'assets/restaurant-be2bd7c5c2fc.webp', 'Pizza': 'assets/restaurant-24d02d921c16.webp',
    'Sushi': 'assets/restaurant-f7e71caf6cf6.webp', 'Açaí': 'assets/restaurant-c7acf49ef428.webp',
    'Brasileira': 'assets/restaurant-044a480791d2.webp', 'Pastel': 'assets/restaurant-46a1b369aad4.webp',
    'Churrasco': 'assets/restaurant-4674ee361a2b.webp', 'Doces': 'assets/restaurant-295265dcbf3c.webp',
    'Saudável': 'assets/restaurant-9b67528e7ae2.webp', 'Café': 'assets/restaurant-b965f13d4032.webp'
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
  function photoOf(s) { var i = s.logo || s.image; return i ? i.thumb || i.src : CATEGORY_PHOTOS[s.category]; }

  /* ---------------- Listagem ---------------- */
  function storesInCity() { return C.filterStores(STORES, { city: state.city }); }

  function renderCats() {
    var cats = ['Todos'].concat(C.CATEGORIES);
    if (!catBox.children.length) {
      catBox.innerHTML = cats.map(function (n, index) {
        var photos = n === 'Todos' ? ['Hambúrguer', 'Pizza', 'Sushi', 'Açaí'].map(function (c) { return CATEGORY_PHOTOS[c]; }) : [CATEGORY_PHOTOS[n]];
        return '<button class="cat" data-cat="' + esc(n) + '" type="button" aria-label="Ver ' + esc(n) + '" aria-pressed="false"><span class="cat-photo ' + (n === 'Todos' ? 'cat-photo-all' : '') + '">' + photos.map(function (src) { return '<img src="' + src + '" alt="" width="960" height="640" loading="' + (index < 2 ? 'eager' : 'lazy') + '" decoding="async">'; }).join('') + '</span><span class="cat-caption">' + esc(n) + '</span></button>';
      }).join('');
      catBox.querySelectorAll('.cat').forEach(function (b) {
        b.onclick = function () { state.category = b.dataset.cat; renderCats(); renderCampaign(); render(); b.scrollIntoView({ behavior: reduceMotion, inline: 'center', block: 'nearest' }); };
      });
    }
    catBox.querySelectorAll('.cat').forEach(function (b) {
      var selected = b.dataset.cat === state.category;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    requestAnimationFrame(updateCategoryProgress);
  }

  function updateCategoryProgress() {
    var thumb = $('categoryProgress');
    if (!thumb) return;
    var available = catBox.clientWidth, total = catBox.scrollWidth, size = Math.min(available, Math.max(32, available * available / Math.max(total, 1)));
    thumb.style.width = size + 'px';
    thumb.style.transform = 'translateX(' + (total > available ? (catBox.scrollLeft / (total - available)) * (available - size) : 0) + 'px)';
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
    return s.confidence === 'baixa' ? '<span class="badge badge-pending">Em verificação</span>' : '';
  }

  function render() {
    var q = search.value, list = C.filterStores(STORES, { city: state.city, category: state.category, query: q });
    var inCity = storesInCity().length;
    title.textContent = q ? 'Resultado da busca' : state.category === 'Todos' ? 'Em ' + state.city : state.category + ' em ' + state.city;
    count.textContent = list.length + ' ' + (list.length === 1 ? 'lugar' : 'lugares');
    grid.innerHTML = list.map(function (s) {
      var meta = [s.kind];
      return '<a class="restaurant reveal visible" href="#/loja/' + s.id + '" data-id="' + s.id + '"><div class="restaurant-media"><img src="' + photoOf(s) + '"' + (s.logo || s.image ? ' onerror="this.onerror=null;this.src=\'' + CATEGORY_PHOTOS[s.category] + '\'"' : '') + ' alt="' + (s.logo || s.image ? esc((s.logo || s.image).alt || s.name) : '') + '" loading="lazy" decoding="async">' + badgeOf(s) + (s.logo || s.image ? '' : '<span class="photo-tag">Imagem ilustrativa</span>') + '</div><div class="restaurant-info"><h3 class="restaurant-name">' + esc(s.name) + '</h3><p class="restaurant-kind">' + esc(meta.join(' · ')) + '</p><div class="restaurant-meta"><span>' + esc(s.category) + '</span>' + (s.menu.length ? '<i class="dot"></i><span class="delivery-free">Cardápio</span>' : '') + '</div></div></a>';
    }).join('');
    empty.style.display = list.length ? 'none' : 'block';
    empty.querySelector('h3').textContent = inCity ? 'Nada por aqui ainda' : 'Chegando em ' + state.city;
    empty.querySelector('p').textContent = inCity ? 'Tente buscar outro prato ou categoria.' : 'Estamos cadastrando os estabelecimentos desta cidade. Tem um negócio aqui? Fale com a gente.';
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
  search.oninput = function () { clear.style.display = search.value ? 'grid' : 'none'; render(); };
  clear.onclick = function () { search.value = ''; clear.style.display = 'none'; search.focus(); render(); };
  $('allCats').onclick = function () { state.category = 'Todos'; renderCats(); catBox.scrollTo({ left: 0, behavior: reduceMotion }); renderCampaign(); render(); };
  catBox.addEventListener('scroll', function () { requestAnimationFrame(updateCategoryProgress); }, { passive: true });
  addEventListener('resize', function () { requestAnimationFrame(updateCategoryProgress); }, { passive: true });
  document.addEventListener('pedeai:city', function (e) { state.city = e.detail; render(); });
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
})();
