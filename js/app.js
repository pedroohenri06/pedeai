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

  var state = { city: readStorage('pedeai-city') || 'Barra do Garças', category: 'Todos', store: null, cart: null, mode: 'entrega' };
  if (C.CITIES.indexOf(state.city) < 0) state.city = 'Barra do Garças';

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('restaurantGrid'), catBox = $('categories'), search = $('search'), clear = $('searchClear'), empty = $('empty'), count = $('resultCount'), title = $('resultTitle');
  var page = $('storePage'), drawer = $('cartDrawer');
  var lastFocus = null;

  function readStorage(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function writeStorage(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* armazenamento indisponível */ } }

  function photoOf(s) { return s.image ? s.image.src : CATEGORY_PHOTOS[s.category]; }
  function icon(path) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  var ICONS = {
    back: '<path d="m15 18-6-6 6-6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>', pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5Z"/>', link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
  };

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

  function badgeOf(s) {
    if (C.canOrder(s)) return '<span class="badge badge-order">Pedido pelo WhatsApp</span>';
    if (s.whatsapp) return '<span class="badge badge-order">WhatsApp</span>';
    if (s.confidence === 'baixa') return '<span class="badge badge-pending">Em verificação</span>';
    return '';
  }

  function render() {
    var q = search.value, list = C.filterStores(STORES, { city: state.city, category: state.category, query: q });
    var inCity = storesInCity().length;
    title.textContent = q ? 'Resultado da busca' : state.category === 'Todos' ? 'Em ' + state.city : state.category + ' em ' + state.city;
    count.textContent = list.length + ' ' + (list.length === 1 ? 'lugar' : 'lugares');
    grid.innerHTML = list.map(function (s) {
      var meta = [s.kind];
      return '<a class="restaurant reveal visible" href="#/loja/' + s.id + '" data-id="' + s.id + '"><div class="restaurant-media"><img src="' + photoOf(s) + '" alt="' + (s.image ? esc(s.image.alt || s.name) : '') + '" loading="lazy" decoding="async">' + badgeOf(s) + (s.image ? '' : '<span class="photo-tag">Imagem ilustrativa</span>') + '</div><div class="restaurant-info"><h3 class="restaurant-name">' + esc(s.name) + '</h3><p class="restaurant-kind">' + esc(meta.join(' · ')) + '</p><div class="restaurant-meta"><span>' + esc(s.category) + '</span>' + (s.menu.length ? '<i class="dot"></i><span class="delivery-free">Cardápio</span>' : '') + '</div></div></a>';
    }).join('');
    empty.style.display = list.length ? 'none' : 'block';
    empty.querySelector('h3').textContent = inCity ? 'Nada por aqui ainda' : 'Chegando em ' + state.city;
    empty.querySelector('p').textContent = inCity ? 'Tente buscar outro prato ou categoria.' : 'Estamos cadastrando os estabelecimentos desta cidade. Tem um negócio aqui? Fale com a gente.';
  }

  /* ---------------- Página do estabelecimento ---------------- */
  function cartKey(id) { return 'pedeai-cart:' + id; }
  function loadCart(store) {
    var saved = null;
    try { saved = JSON.parse(readStorage(cartKey(store.id)) || 'null'); } catch (e) { saved = null; }
    return C.reconcileCart(saved, store);
  }
  function saveCart() {
    if (!state.store) return;
    writeStorage(cartKey(state.store.id), state.cart.lines.length ? JSON.stringify(state.cart) : null);
  }

  function groupMenu(menu) {
    var sections = [];
    menu.forEach(function (m) {
      var sec = sections.find(function (x) { return x.name === m.section; });
      if (!sec) sections.push(sec = { name: m.section, items: [] });
      sec.items.push(m);
    });
    return sections;
  }

  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } }

  function openStore(id) {
    var s = STORES.find(function (x) { return x.id === id; });
    if (!s) { toast('Estabelecimento não encontrado'); history.replaceState(null, '', location.pathname + location.search); return closeStore(true); }
    if (!page.classList.contains('open')) lastFocus = document.activeElement;
    closeCart(false);
    state.store = s;
    state.cart = loadCart(s);
    var contact = [];
    if (s.whatsapp) contact.push('<a class="store-chip store-chip-wa" href="' + esc(C.whatsappUrl(s.whatsapp, 'Olá, ' + s.name + '! Encontrei vocês no PedeAi Delivery.')) + '" target="_blank" rel="noopener">' + icon(ICONS.chat) + 'WhatsApp ' + esc(C.formatPhone(s.whatsapp)) + '</a>');
    if (s.phone) contact.push('<a class="store-chip" href="tel:+' + esc(s.phone) + '">' + icon(ICONS.phone) + esc(C.formatPhone(s.phone)) + '</a>');
    if (s.orderUrl) contact.push('<a class="store-chip" href="' + esc(s.orderUrl) + '" target="_blank" rel="noopener">' + icon(ICONS.link) + 'Cardápio online (' + esc(hostOf(s.orderUrl)) + ')</a>');
    if (s.instagram) contact.push('<a class="store-chip" href="https://www.instagram.com/' + encodeURIComponent(s.instagram) + '/" target="_blank" rel="noopener">' + icon(ICONS.link) + '@' + esc(s.instagram) + '</a>');
    if (s.website) contact.push('<a class="store-chip" href="' + esc(s.website) + '" target="_blank" rel="noopener">' + icon(ICONS.link) + esc(hostOf(s.website)) + '</a>');

    var menuHtml;
    if (s.menu.length) {
      menuHtml = '<p class="menu-source">' + icon(ICONS.info) + '<span>Preços conforme <a href="' + esc(s.menuSource) + '" target="_blank" rel="noopener">' + esc(hostOf(s.menuSource)) + '</a>, consultado em ' + esc(formatDate(s.verifiedAt)) + '. O estabelecimento confirma valores e disponibilidade no atendimento.</span></p>' +
        groupMenu(s.menu).map(function (sec) {
          return '<h3 class="menu-title">' + esc(sec.name) + '</h3>' + sec.items.map(function (m) {
            return '<div class="menu-item" data-item="' + esc(m.id) + '"><div><h3>' + esc(m.name) + '</h3>' + (m.description ? '<p>' + esc(m.description) + '</p>' : '') + '<strong class="menu-price">' + C.formatBRL(m.priceCents) + '</strong></div><div class="qty" data-qty="' + esc(m.id) + '"></div></div>';
          }).join('');
        }).join('');
    } else {
      menuHtml = '<div class="menu-pending">' + icon(ICONS.info) + '<div><h3>Cardápio em preparação</h3><p>Ainda não temos um cardápio com preços confirmados para este estabelecimento. ' + (s.whatsapp ? 'Você pode pedir direto pelo WhatsApp.' : s.orderUrl ? 'Consulte o cardápio online oficial acima.' : 'Assim que o estabelecimento confirmar as informações, o pedido online será liberado.') + '</p></div></div>';
    }

    var warn = s.confidence === 'baixa' ? '<p class="store-warning">' + icon(ICONS.info) + '<span>Cadastro em verificação: dados obtidos em fontes públicas e ainda não confirmados pelo estabelecimento.</span></p>' : '';

    page.innerHTML = '<div class="store-scroll" id="storeScroll"><header class="store-top"><button class="store-back" type="button" data-store-close aria-label="Voltar">' + icon(ICONS.back) + '</button><span class="store-top-name">' + esc(s.name) + '</span></header>' +
      '<div class="store-cover"><img src="' + photoOf(s) + '" alt="' + (s.image ? esc(s.image.alt || s.name) : '') + '">' + (s.image ? '<span class="photo-tag">Foto: ' + esc(s.image.credit) + '</span>' : '<span class="photo-tag">Imagem ilustrativa da categoria</span>') + '</div>' +
      '<div class="store-body"><span class="store-cat">' + esc(s.category) + ' · ' + esc(s.city) + '</span><h1 id="storeName">' + esc(s.name) + '</h1><p class="store-kind">' + esc(s.kind) + '</p>' +
      '<ul class="store-facts">' + (s.address ? '<li>' + icon(ICONS.pin) + '<span>' + esc(s.address) + ' — ' + esc(s.city) + ', MT</span></li>' : '<li>' + icon(ICONS.pin) + '<span>' + esc(s.city) + ', MT · endereço a confirmar</span></li>') + (s.hours ? '<li>' + icon(ICONS.clock) + '<span>' + esc(s.hours) + '</span></li>' : '') + '</ul>' +
      warn + (contact.length ? '<div class="store-chips">' + contact.join('') + '</div>' : '') +
      '<section class="store-menu menu" aria-labelledby="storeMenuTitle"><h2 id="storeMenuTitle" class="store-section-title">Cardápio</h2>' + menuHtml + '</section>' +
      '<details class="store-sources"><summary>Fontes das informações</summary><p>Cadastro verificado em ' + esc(formatDate(s.verifiedAt)) + ' a partir de fontes públicas. Alguma informação errada? <a href="https://wa.me/5512936290045?text=' + encodeURIComponent('Olá! Quero corrigir as informações de ' + s.name + ' (' + s.city + ') no PedeAi.') + '" target="_blank" rel="noopener">Avise a equipe</a>.</p><ul>' + s.sources.map(function (u) { return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + esc(hostOf(u)) + '</a></li>'; }).join('') + '</ul></details></div></div>' +
      (s.menu.length ? '<button class="cart-bar" id="cartBar" type="button" hidden></button>' : '');

    page.querySelectorAll('[data-store-close]').forEach(function (b) { b.onclick = function () { goHome(); }; });
    page.querySelectorAll('.qty').forEach(function (el) { el.onclick = onQtyClick; });
    var bar = $('cartBar');
    if (bar) bar.onclick = openCart;
    renderQty();
    page.classList.add('open');
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.add('store-open');
    document.title = s.name + ' em ' + s.city + ' | PedeAi Delivery';
    page.querySelector('.store-scroll').scrollTop = 0;
    requestAnimationFrame(function () { page.querySelector('.store-back').focus({ preventScroll: true }); });
  }

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : iso;
  }

  function onQtyClick(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var id = btn.closest('.qty').dataset.qty, line = state.cart.lines.find(function (l) { return l.itemId === id; });
    if (btn.dataset.act === 'add') state.cart = C.addItem(state.cart, state.store, id, 1);
    else if (btn.dataset.act === 'sub') state.cart = C.setQty(state.cart, id, (line ? line.qty : 0) - 1);
    saveCart();
    renderQty();
    if (drawer.classList.contains('open')) renderCart();
  }

  function renderQty() {
    if (!state.store) return;
    page.querySelectorAll('.qty').forEach(function (el) {
      var id = el.dataset.qty, line = state.cart.lines.find(function (l) { return l.itemId === id; }), name = state.store.menu.find(function (m) { return m.id === id; }).name;
      el.innerHTML = line
        ? '<button type="button" data-act="sub" aria-label="Remover um ' + esc(name) + '">−</button><output aria-live="polite">' + line.qty + '</output><button type="button" data-act="add" aria-label="Adicionar mais um ' + esc(name) + '">+</button>'
        : '<button type="button" class="qty-add" data-act="add" aria-label="Adicionar ' + esc(name) + ' ao carrinho">Adicionar</button>';
    });
    var bar = $('cartBar');
    if (bar) {
      var n = C.cartCount(state.cart), t = C.cartTotals(state.cart, state.store, state.mode);
      bar.hidden = n === 0;
      bar.innerHTML = '<span class="cart-bar-count">' + n + '</span><span>Ver carrinho</span><strong>' + C.formatBRL(t.subtotal) + '</strong>';
    }
  }

  function closeStore(silent) {
    closeCart(false);
    page.classList.remove('open');
    page.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('store-open');
    document.title = 'PedeAi Delivery | O melhor da cidade, sem baixar nada';
    state.store = null;
    if (!silent && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  function goHome() {
    if (C.parseRoute(location.hash).name === 'store') {
      if (history.state && history.state.pedeaiFromList) history.back();
      else { history.replaceState(null, '', location.pathname + location.search + '#restaurantes'); route(); }
    } else closeStore();
  }

  /* ---------------- Carrinho ---------------- */
  function openCart() {
    renderCart();
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { drawer.querySelector('.cart-close').focus({ preventScroll: true }); });
  }

  function closeCart(returnFocus) {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (returnFocus !== false) { var bar = $('cartBar'); if (bar && !bar.hidden) bar.focus({ preventScroll: true }); }
  }

  function renderCart() {
    var s = state.store, t = C.cartTotals(state.cart, s, state.mode), ordering = C.canOrder(s);
    $('cartStore').textContent = s.name;
    $('cartLines').innerHTML = state.cart.lines.length ? state.cart.lines.map(function (l) {
      return '<li class="cart-line"><div><strong>' + esc(l.name) + '</strong><span>' + C.formatBRL(l.unitCents) + ' cada</span></div><div class="qty" data-qty="' + esc(l.itemId) + '"><button type="button" data-act="sub" aria-label="Remover um ' + esc(l.name) + '">−</button><output>' + l.qty + '</output><button type="button" data-act="add" aria-label="Adicionar mais um ' + esc(l.name) + '">+</button></div><b>' + C.formatBRL(l.unitCents * l.qty) + '</b></li>';
    }).join('') : '<li class="cart-empty">Seu carrinho está vazio.</li>';
    $('cartLines').querySelectorAll('.qty').forEach(function (el) { el.onclick = onQtyClick; });
    $('cartSubtotal').textContent = C.formatBRL(t.subtotal);
    $('cartFee').textContent = state.mode === 'retirada' ? 'Grátis (retirada)' : t.feeKnown ? C.formatBRL(t.fee) : 'A confirmar';
    $('cartTotal').textContent = C.formatBRL(t.total);
    $('cartTotalLabel').textContent = t.feeKnown ? 'Total' : 'Total sem entrega';
    $('cartAddressField').hidden = state.mode === 'retirada';
    $('cartChangeField').hidden = $('cartPayment').value !== 'Dinheiro';
    drawer.querySelectorAll('[name="cartMode"]').forEach(function (r) { r.checked = r.value === state.mode; });
    var send = $('cartSend'), note = $('cartNote');
    send.disabled = !ordering || !state.cart.lines.length;
    note.textContent = ordering ? 'O pedido será enviado para o WhatsApp de ' + s.name + ' (' + C.formatPhone(s.whatsapp) + '). Pagamento e entrega são combinados diretamente com o estabelecimento.' : 'Pedido online indisponível: o WhatsApp deste estabelecimento ainda não foi verificado. Use os contatos da página para confirmar o pedido.';
  }

  function sendOrder(e) {
    e.preventDefault();
    var s = state.store;
    if (!C.canOrder(s) || !state.cart.lines.length) return;
    var name = $('cartName').value.trim(), address = $('cartAddress').value.trim();
    if (!name) { $('cartName').focus(); return toast('Informe seu nome'); }
    if (state.mode === 'entrega' && !address) { $('cartAddress').focus(); return toast('Informe o endereço de entrega'); }
    writeStorage('pedeai-customer', JSON.stringify({ name: name, address: address }));
    var msg = C.buildOrderMessage(s, state.cart, { mode: state.mode, name: name, address: address, payment: $('cartPayment').value, change: $('cartChange').value, notes: $('cartNotes').value });
    window.open(C.whatsappUrl(s.whatsapp, msg), '_blank', 'noopener');
  }

  /* ---------------- Rotas ---------------- */
  function route() {
    var r = C.parseRoute(location.hash);
    if (r.name === 'store') openStore(r.id);
    else if (page.classList.contains('open')) closeStore();
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
      if (page.classList.contains('open')) goHome();
      var n = b.dataset.nav;
      if (n === 'search') { scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(function () { search.focus(); }, 450); }
      else if (n === 'categories') document.querySelector('.categories').scrollIntoView({ behavior: 'smooth' });
      else if (n === 'partner') $('parceiros').scrollIntoView({ behavior: 'smooth' });
      else scrollTo({ top: 0, behavior: 'smooth' });
    };
  });
  drawer.querySelectorAll('[data-cart-close]').forEach(function (b) { b.onclick = function () { closeCart(); }; });
  drawer.querySelectorAll('[name="cartMode"]').forEach(function (r) { r.onchange = function () { state.mode = r.value; renderCart(); renderQty(); }; });
  $('cartPayment').onchange = function () { renderCart(); };
  $('cartForm').onsubmit = sendOrder;
  addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawer.classList.contains('open')) closeCart();
    else if (page.classList.contains('open') && !document.body.classList.contains('city-modal-open')) goHome();
  });
  addEventListener('scroll', function () { $('header').classList.toggle('scrolled', scrollY > 12); }, { passive: true });

  (function restoreCustomer() {
    try {
      var c = JSON.parse(readStorage('pedeai-customer') || 'null');
      if (c) { $('cartName').value = c.name || ''; $('cartAddress').value = c.address || ''; }
    } catch (e) { /* ignora */ }
  })();

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }); }, { threshold: 0.1 }) : null;
  document.querySelectorAll('.reveal').forEach(function (e) { io ? io.observe(e) : e.classList.add('visible'); });

  renderCats();
  renderCampaign();
  render();
  route();
})();
