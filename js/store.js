/* PedeAi — página do estabelecimento (#/loja/<id>): apresentação, cardápio, detalhe do produto com opções,
   sacola e envio pelo WhatsApp. Isolada do restante do site: expõe apenas window.PedeAiStore. */
(function () {
  'use strict';
  var C = window.PedeAiCore, esc = C.escapeHtml;
  var $ = function (id) { return document.getElementById(id); };
  var page = $('storePage'), drawer = $('cartDrawer');
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var behavior = function () { return motion.matches ? 'instant' : 'smooth'; };

  var state = { store: null, cart: null, mode: 'entrega', lastFocus: null, sheet: null, observers: [] };

  function readStorage(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function writeStorage(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* armazenamento indisponível */ } }
  function toast(msg) { if (window.toast) window.toast(msg); }

  function icon(path, cls) { return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  var I = {
    back: '<path d="m15 18-6-6 6-6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>', share: '<path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5Z"/>', link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="m5 12 5 5 9-10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>', bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>', dish: '<path d="M3 17h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 8V6"/><path d="M10 6h4"/>'
  };

  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } }
  function formatDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : iso; }
  function findItem(id) { return state.store.menu.find(function (m) { return m.id === id; }); }
  function hasRequired(item) { return (item.options || []).some(function (g) { return (g.min || 0) > 0; }); }
  function hasPricedOptions(item) { return (item.options || []).some(function (g) { return g.choices.some(function (c) { return c.priceCents > 0; }); }); }

  /* ---------------- Sacola: persistência ---------------- */
  function cartKey(id) { return 'pedeai-cart:' + id; }
  function loadCart(store) {
    var saved = null;
    try { saved = JSON.parse(readStorage(cartKey(store.id)) || 'null'); } catch (e) { saved = null; }
    return C.reconcileCart(saved, store);
  }
  function saveCart() { if (state.store) writeStorage(cartKey(state.store.id), state.cart.lines.length ? JSON.stringify(state.cart) : null); }

  /* ---------------- Apresentação ---------------- */
  /* Frase de apresentação em linguagem natural: "Pizzaria e lanchonete em Barra do Garças". */
  function lede(s) {
    var kind = String(s.kind || s.category).replace(/\s*\(.*?\)\s*$/, '');
    return kind.charAt(0).toUpperCase() + kind.slice(1) + ' em ' + s.city;
  }

  function initials(name) {
    var words = String(name).split(/\s+/).filter(function (w) { return /^[\p{L}\p{N}]/u.test(w) && (w.length > 2 || /^\p{Lu}/u.test(w)); });
    return (words.slice(0, 2).map(function (w) { return w[0]; }).join('') || String(name)[0] || '').toUpperCase();
  }

  function mapsUrl(s) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.name + ', ' + (s.address ? s.address + ', ' : '') + s.city + ' - MT');
  }

  /* Selo da loja: o logotipo, quando a imagem cadastrada é um logo; senão, as iniciais sobre o degradê da marca. */
  function badgeTile(s) {
    if (s.image && s.image.kind === 'logo') return '<span class="sp-tile sp-tile--logo"><img src="' + esc(s.image.thumb || s.image.src) + '" alt="" width="120" height="80" decoding="async"></span>';
    return '<span class="sp-tile" aria-hidden="true">' + esc(initials(s.name)) + '</span>';
  }

  function chips(s) {
    var c = ['<span class="sp-chip">' + esc(s.category) + '</span>', '<span class="sp-chip">' + icon(I.pin) + esc(s.city) + '</span>'];
    if (C.canOrder(s)) c.push('<span class="sp-chip sp-chip--on">Pedido online</span>');
    else if (s.menu.length) c.push('<span class="sp-chip">' + s.menu.length + (s.menu.length === 1 ? ' item' : ' itens') + ' no cardápio</span>');
    if (s.confidence === 'baixa') c.push('<span class="sp-chip sp-chip--muted">Em verificação</span>');
    return '<div class="sp-chips">' + c.join('') + '</div>';
  }

  /* Capa: foto com degradê vinho, ou o degradê da marca com o símbolo do PedeAi em marca d'água. */
  function coverHtml(s) {
    var photo = s.image && s.image.kind !== 'logo';
    return '<section class="sp-cover' + (photo ? ' sp-cover--photo' : ' sp-cover--brand sp-hero--empty') + '" aria-labelledby="storeName">' +
      (photo ? '<img class="sp-cover-img" src="' + esc(s.image.src) + '" alt="' + esc(s.image.alt || s.name) + '" width="' + (s.image.width || 960) + '" height="' + (s.image.height || 640) + '" fetchpriority="high" decoding="async" onerror="this.remove()">' : '<span class="sp-cover-mark" aria-hidden="true"></span>') +
      '<div class="sp-cover-body">' + badgeTile(s) + '<div class="sp-cover-text"><h1 id="storeName" class="sp-name">' + esc(s.name) + '</h1><p class="sp-lede">' + esc(lede(s)) + '</p>' + chips(s) + '</div></div>' +
      (photo && s.image.credit ? '<span class="sp-credit">Foto: ' + esc(s.image.credit) + '</span>' : '') + '</section>';
  }

  function actionsHtml(s) {
    var a = [];
    if (s.whatsapp) a.push('<a class="sp-btn sp-btn--primary" href="' + esc(C.whatsappUrl(s.whatsapp, 'Olá, ' + s.name + '! Encontrei vocês no PedeAi Delivery.')) + '" target="_blank" rel="noopener">' + icon(I.chat) + 'Falar no WhatsApp</a>');
    if (s.phone) a.push('<a class="sp-btn" href="tel:+' + esc(s.phone) + '">' + icon(I.phone) + 'Ligar</a>');
    if (s.orderUrl) a.push('<a class="sp-btn" href="' + esc(s.orderUrl) + '" target="_blank" rel="noopener">' + icon(I.menu) + 'Cardápio online</a>');
    if (s.instagram) a.push('<a class="sp-btn" href="https://www.instagram.com/' + encodeURIComponent(s.instagram) + '/" target="_blank" rel="noopener">' + icon(I.link) + 'Instagram</a>');
    if (s.website) a.push('<a class="sp-btn" href="' + esc(s.website) + '" target="_blank" rel="noopener">' + icon(I.link) + 'Site</a>');
    return a.length ? '<div class="sp-actions">' + a.join('') + '</div>' : '';
  }

  function infoHtml(s) {
    return '<section class="sp-card sp-info" aria-label="Informações do estabelecimento"><ul class="sp-facts">' +
      '<li>' + icon(I.pin) + '<div><strong>' + (s.address ? esc(s.address) : 'Endereço a confirmar') + '</strong><span>' + esc(s.city) + ', MT</span><a href="' + esc(mapsUrl(s)) + '" target="_blank" rel="noopener">Ver no mapa</a></div></li>' +
      (s.hours ? '<li>' + icon(I.clock) + '<div><strong>Horário</strong><span>' + esc(s.hours) + '</span></div></li>' : '') +
      '</ul>' + actionsHtml(s) +
      (s.confidence === 'baixa' ? '<p class="sp-notice store-warning">' + icon(I.info) + '<span>Cadastro em verificação. Os dados vêm de fontes públicas e ainda não foram confirmados pelo estabelecimento.</span></p>' : '') +
      '</section>';
  }

  function summaryHtml(s) {
    return s.menu.length ? '<section class="sp-card sp-summary" aria-labelledby="spSummaryTitle"><h2 id="spSummaryTitle">Seu pedido</h2><div id="spSummary"></div></section>' : '';
  }

  /* Cabeçalho da plataforma: marca centralizada com o slogan discreto; voltar e compartilhar nas laterais. */
  function topHtml(s) {
    return '<header class="sp-top"><div class="sp-top-inner">' +
      '<button class="sp-icon-btn store-back" type="button" data-store-close aria-label="Voltar">' + icon(I.back) + '</button>' +
      '<a class="sp-brand" href="#" data-home aria-label="PedeAi Delivery, ir para o início"><span class="sp-brand-row"><span class="logo-box"><img src="assets/media-778d926eb50d.png" alt=""></span><span class="sp-brand-name">PedeAi</span></span><span class="sp-brand-tag">A plataforma de delivery do interior</span></a>' +
      '<div class="sp-top-end"><span class="sp-top-city">' + icon(I.pin) + esc(s.city) + '</span>' +
      '<button class="sp-icon-btn" type="button" data-share aria-label="Compartilhar ' + esc(s.name) + '">' + icon(I.share) + '</button></div>' +
      '</div></header>';
  }

  /* Rodapé: o mesmo rodapé aprovado da home, clonado para manter a identidade idêntica. */
  function mountFooter() {
    var slot = $('spFooter'), src = document.querySelector('.site-footer-v5');
    if (!slot || !src) return;
    var f = src.cloneNode(true);
    f.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
    f.querySelectorAll('[data-legal]').forEach(function (b) {
      b.onclick = function () { var o = src.querySelector('[data-legal="' + b.dataset.legal + '"]'); if (o) o.click(); };
    });
    f.querySelectorAll('a[href="#"]').forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); $('storeScroll').scrollTo({ top: 0, behavior: behavior() }); };
    });
    f.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); var target = a.getAttribute('href'); window.PedeAiStore.onBack(); setTimeout(function () { var el = document.querySelector(target === '#categories' ? '.categories' : target); if (el) el.scrollIntoView({ behavior: behavior() }); }, 60); };
    });
    slot.replaceWith(f);
  }

  /* ---------------- Cardápio ---------------- */
  function sectionsOf(menu) {
    var out = [];
    menu.forEach(function (m) {
      var sec = out.find(function (x) { return x.name === m.section; });
      if (!sec) out.push(sec = { name: m.section, items: [] });
      sec.items.push(m);
    });
    return out;
  }

  function priceLabel(item) {
    return (hasPricedOptions(item) ? '<span class="sp-from">a partir de</span> ' : '') + C.formatBRL(item.priceCents);
  }

  function itemHtml(m) {
    var media = m.image
      ? '<img src="' + esc(m.image.src) + '" alt="" width="240" height="240" loading="lazy" decoding="async">'
      : '<span class="sp-ph" aria-hidden="true">' + icon(I.dish) + '</span>';
    return '<li class="sp-li"><article class="sp-item" data-item="' + esc(m.id) + '">' +
      '<button class="sp-item-main" type="button" data-open="' + esc(m.id) + '" aria-haspopup="dialog"><span class="sp-item-name">' + esc(m.name) + '</span>' +
      (m.description ? '<span class="sp-item-desc">' + esc(m.description) + '</span>' : '') +
      '<span class="sp-item-meta"><span class="sp-item-price">' + priceLabel(m) + '</span>' + ((m.options || []).length ? '<span class="sp-item-tag">Com opções</span>' : '') + '</span></button>' +
      '<div class="sp-item-media" data-open="' + esc(m.id) + '">' + media + '<span class="sp-badge" data-badge="' + esc(m.id) + '" hidden></span>' +
      '<button class="sp-add" type="button" data-add="' + esc(m.id) + '" aria-label="Adicionar ' + esc(m.name) + ' ao pedido">' + icon(I.plus, 'sp-add-plus') + icon(I.check, 'sp-add-check') + '</button></div>' +
      '</article></li>';
  }

  function menuHtml(s) {
    if (!s.menu.length) {
      var actions = (s.whatsapp ? '<a class="sp-btn sp-btn--primary" href="' + esc(C.whatsappUrl(s.whatsapp, 'Olá, ' + s.name + '! Encontrei vocês no PedeAi Delivery e gostaria de fazer um pedido.')) + '" target="_blank" rel="noopener">' + icon(I.chat) + 'Pedir pelo WhatsApp</a>' : '') +
        (s.orderUrl ? '<a class="sp-btn" href="' + esc(s.orderUrl) + '" target="_blank" rel="noopener">' + icon(I.menu) + 'Ver cardápio online</a>' : '');
      return '<section class="sp-menu" aria-labelledby="storeMenuTitle"><div class="sp-menu-head"><h2 id="storeMenuTitle">Cardápio</h2></div>' +
        '<div class="sp-card sp-empty menu-pending"><span class="sp-empty-icon">' + icon(I.menu) + '</span><h3>Cardápio em preparação</h3><p>Ainda não temos um cardápio com preços confirmados para ' + esc(s.name) + '.' +
        (s.whatsapp ? ' Você pode fazer seu pedido direto pelo WhatsApp.' : s.orderUrl ? ' Consulte o cardápio online oficial.' : ' Assim que o estabelecimento confirmar as informações, o pedido online é liberado aqui.') + '</p>' +
        (actions ? '<div class="sp-empty-actions">' + actions + '</div>' : '') + '</div></section>';
    }
    var secs = sectionsOf(s.menu), many = s.menu.length >= 12;
    return '<section class="sp-menu" aria-labelledby="storeMenuTitle">' +
      '<div class="sp-menu-head"><h2 id="storeMenuTitle">Cardápio</h2><p class="sp-source">Preços de <a href="' + esc(s.menuSource) + '" target="_blank" rel="noopener">' + esc(hostOf(s.menuSource)) + '</a>, consultados em ' + esc(formatDate(s.verifiedAt)) + '. O estabelecimento confirma valores e disponibilidade.</p></div>' +
      (secs.length > 1 || many ? '<div class="sp-sticky">' +
        (secs.length > 1 ? '<nav class="sp-cats" aria-label="Categorias do cardápio"><div class="sp-cats-track">' + secs.map(function (sec, i) {
          return '<a class="sp-cat" href="#sp-sec-' + i + '" data-sec="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + esc(sec.name) + '</a>';
        }).join('') + '<span class="sp-cats-ink" aria-hidden="true"></span></div></nav>' : '') +
        (many ? '<label class="sp-search">' + icon(I.search) + '<span class="sr-only">Buscar no cardápio</span><input type="search" id="spSearch" placeholder="Buscar no cardápio" autocomplete="off" enterkeyhint="search"></label>' : '') +
        '</div>' : '') +
      secs.map(function (sec, i) {
        return '<section class="sp-section" id="sp-sec-' + i + '" data-sec="' + i + '" aria-labelledby="sp-sec-t-' + i + '"><h3 class="sp-section-title" id="sp-sec-t-' + i + '">' + esc(sec.name) + ' <small>' + sec.items.length + '</small></h3><ul class="sp-items" role="list">' + sec.items.map(itemHtml).join('') + '</ul></section>';
      }).join('') +
      '<p class="sp-noresult" id="spNoResult" hidden>Nenhum item encontrado no cardápio.</p></section>';
  }

  function aboutHtml(s) {
    return '<details class="sp-about store-sources"><summary>Sobre este cadastro</summary><p>Informações verificadas em ' + esc(formatDate(s.verifiedAt)) + ' a partir de fontes públicas. Alguma informação errada? <a href="https://wa.me/5512936290045?text=' + encodeURIComponent('Olá! Quero corrigir as informações de ' + s.name + ' (' + s.city + ') no PedeAi.') + '" target="_blank" rel="noopener">Avise a equipe</a>.</p><ul>' + s.sources.map(function (u) { return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + esc(hostOf(u)) + '</a></li>'; }).join('') + '</ul></details>';
  }

  /* ---------------- Abertura e fechamento ---------------- */
  function open(s) {
    if (!page.classList.contains('open')) state.lastFocus = document.activeElement;
    closeSheet(false);
    closeCart(false);
    disconnect();
    state.store = s;
    state.cart = loadCart(s);
    page.classList.toggle('sp-has-photo', !!(s.image && s.image.kind !== 'logo'));
    /* Sem nenhuma foto de produto, cartões só de texto; com ao menos uma, todos reservam a área de imagem. */
    page.classList.toggle('sp-noimg', !s.menu.some(function (m) { return m.image; }));
    page.classList.toggle('sp-has-menu', s.menu.length > 0);
    page.innerHTML = '<div class="sp-scroll" id="storeScroll">' + topHtml(s) +
      '<div class="sp-page">' + coverHtml(s) +
      '<div class="sp-layout"><aside class="sp-aside">' + infoHtml(s) + summaryHtml(s) + '</aside>' +
      '<div class="sp-main">' + menuHtml(s) + aboutHtml(s) + '</div></div></div><div id="spFooter"></div></div>' +
      (s.menu.length ? '<button class="sp-cartbar" id="cartBar" type="button" hidden aria-haspopup="dialog"></button>' : '') +
      '<p class="sr-only" id="spLive" aria-live="polite"></p><div class="sp-sheet" id="spSheet" aria-hidden="true"></div>';
    mountFooter();
    bind();
    renderQty(false);
    page.classList.add('open');
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.add('store-open');
    document.title = s.name + ' em ' + s.city + ' | PedeAi Delivery';
    $('storeScroll').scrollTop = 0;
    requestAnimationFrame(function () { page.querySelector('.store-back').focus({ preventScroll: true }); });
  }

  function close(silent) {
    closeSheet(false);
    closeCart(false);
    disconnect();
    page.classList.remove('open');
    page.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('store-open');
    document.title = 'PedeAi Delivery | O melhor da cidade, sem baixar nada';
    state.store = null;
    if (!silent && state.lastFocus && document.contains(state.lastFocus)) state.lastFocus.focus({ preventScroll: true });
  }

  function disconnect() { state.observers.forEach(function (o) { o.disconnect(); }); state.observers = []; }

  function bind() {
    var scroller = $('storeScroll'), top = page.querySelector('.sp-top');
    page.querySelector('[data-store-close]').onclick = function () { window.PedeAiStore.onBack(); };
    page.querySelector('[data-share]').onclick = share;
    page.querySelectorAll('[data-home]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); window.PedeAiStore.onBack(); }; });
    var bar = $('cartBar');
    if (bar) bar.onclick = openCart;

    /* Título compacto na barra superior quando o nome sai da tela. */
    if ('IntersectionObserver' in window) {
      var nameObs = new IntersectionObserver(function (es) { top.classList.toggle('is-condensed', !es[0].isIntersecting); }, { root: scroller, rootMargin: '-56px 0px 0px 0px' });
      nameObs.observe($('storeName'));
      state.observers.push(nameObs);
    }
    var cats = page.querySelector('.sp-cats');
    if (cats) bindCategories(scroller, cats);
    var search = $('spSearch');
    if (search) search.oninput = function () { filterMenu(search.value); };
  }

  function onPageClick(e) {
    var add = e.target.closest('[data-add]');
    if (add) return quickAdd(add.dataset.add, add);
    var opener = e.target.closest('[data-open]');
    if (opener) openSheet(opener.dataset.open, opener);
  }

  function share() {
    var url = location.href.split('#')[0] + '#/loja/' + state.store.id, data = { title: state.store.name + ' | PedeAi Delivery', url: url };
    if (navigator.share) navigator.share(data).catch(function () { /* cancelado */ });
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copiado'); }, function () { toast(url); });
    else toast(url);
  }

  /* ---------------- Categorias: navegação e realce da seção visível ---------------- */
  function offsetIn(scroller, el) { return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop; }

  function bindCategories(scroller, nav) {
    var track = nav.querySelector('.sp-cats-track'), ink = nav.querySelector('.sp-cats-ink'), links = [].slice.call(nav.querySelectorAll('.sp-cat'));
    var sections = [].slice.call(page.querySelectorAll('.sp-section')), locked = 0;
    function activate(i, center) {
      links.forEach(function (a, j) { if (j === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      var a = links[i];
      if (!a) return;
      ink.style.transform = 'translateX(' + a.offsetLeft + 'px) scaleX(' + a.offsetWidth / 100 + ')';
      if (center !== false) track.scrollTo({ left: a.offsetLeft - (track.clientWidth - a.offsetWidth) / 2, behavior: behavior() });
    }
    links.forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        var i = Number(a.dataset.sec), sec = sections[i], sticky = page.querySelector('.sp-sticky');
        locked = Date.now() + 900;
        current = i;
        activate(i);
        scroller.scrollTo({ top: offsetIn(scroller, sec) - page.querySelector('.sp-top').offsetHeight - (sticky ? sticky.offsetHeight : 0) - 8, behavior: behavior() });
        sec.querySelector('.sp-section-title').setAttribute('tabindex', '-1');
        sec.querySelector('.sp-section-title').focus({ preventScroll: true });
      };
    });
    /* Realce da seção visível: a última cujo título já passou da barra fixa (um cálculo por quadro). */
    var current = 0, ticking = false;
    function spy() {
      ticking = false;
      if (Date.now() < locked) return;
      var sticky = page.querySelector('.sp-sticky'), line = scroller.scrollTop + page.querySelector('.sp-top').offsetHeight + (sticky ? sticky.offsetHeight : nav.offsetHeight) + 24, i = 0;
      sections.forEach(function (sec, j) { if (!sec.hidden && offsetIn(scroller, sec) <= line) i = j; });
      if (i !== current) { current = i; activate(i); }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }
    scroller.addEventListener('scroll', onScroll, { passive: true });
    state.observers.push({ disconnect: function () { scroller.removeEventListener('scroll', onScroll); } });
    requestAnimationFrame(function () { activate(0, false); });
  }

  function filterMenu(q) {
    var query = C.normalize(q), any = false;
    page.querySelectorAll('.sp-section').forEach(function (sec) {
      var shown = 0;
      sec.querySelectorAll('.sp-li').forEach(function (li) {
        var item = findItem(li.firstChild.dataset.item), hit = !query || C.normalize(item.name + ' ' + (item.description || '')).indexOf(query) > -1;
        li.hidden = !hit;
        if (hit) shown++;
      });
      sec.hidden = !shown;
      if (shown) any = true;
    });
    $('spNoResult').hidden = any;
    var nav = page.querySelector('.sp-cats');
    if (nav) nav.hidden = !!query;
  }

  /* ---------------- Adição rápida e quantidades ---------------- */
  function quickAdd(id, btn) {
    var item = findItem(id);
    if (hasRequired(item)) return openSheet(id, btn);
    state.cart = C.addItem(state.cart, state.store, id, 1);
    saveCart();
    added(item, 1, btn);
  }

  function added(item, qty, btn) {
    renderQty(true);
    if (btn && btn.classList.contains('sp-add')) {
      btn.classList.add('is-added');
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { btn.classList.remove('is-added'); }, 900);
    }
    $('spLive').textContent = qty + 'x ' + item.name + ' adicionado ao pedido. ' + C.cartCount(state.cart) + ' itens, ' + C.formatBRL(C.cartTotals(state.cart, state.store, state.mode).subtotal) + '.';
    if (drawer.classList.contains('open')) renderCart();
  }

  function renderQty(bump) {
    if (!state.store) return;
    page.querySelectorAll('[data-badge]').forEach(function (b) {
      var n = C.itemQty(state.cart, b.dataset.badge);
      b.hidden = !n;
      if (n && b.textContent !== String(n)) { b.textContent = n; if (bump) pop(b); }
      b.closest('.sp-item').classList.toggle('in-cart', !!n);
    });
    renderSummary();
    var bar = $('cartBar');
    if (!bar) return;
    var n = C.cartCount(state.cart), t = C.cartTotals(state.cart, state.store, state.mode);
    var wasHidden = bar.hidden;
    bar.hidden = n === 0;
    page.classList.toggle('sp-cart-active', n > 0);
    bar.setAttribute('aria-label', 'Ver pedido: ' + n + (n === 1 ? ' item' : ' itens') + ', subtotal ' + C.formatBRL(t.subtotal));
    bar.innerHTML = '<span class="sp-cartbar-count">' + icon(I.bag) + '<b>' + n + '</b></span><span class="sp-cartbar-label">Ver pedido</span><strong>' + C.formatBRL(t.subtotal) + '</strong>';
    if (bump && n && !wasHidden) pop(bar, 'translateX(-50%)');
  }

  /* Resumo do pedido na coluna lateral (telas largas). */
  function renderSummary() {
    var box = $('spSummary');
    if (!box) return;
    if (!state.cart.lines.length) {
      box.innerHTML = '<p class="sp-summary-empty">' + icon(I.bag) + '<span>Seu pedido está vazio. Toque em + nos itens do cardápio para começar.</span></p>';
      return;
    }
    var t = C.cartTotals(state.cart, state.store, state.mode);
    box.innerHTML = '<ul class="sp-summary-lines">' + state.cart.lines.map(function (l) {
      return '<li><span><b>' + l.qty + '×</b> ' + esc(l.name) + '</span><span>' + C.formatBRL(l.unitCents * l.qty) + '</span></li>';
    }).join('') + '</ul><p class="sp-summary-total"><span>Subtotal</span><strong>' + C.formatBRL(t.subtotal) + '</strong></p>' +
      '<button class="sp-btn sp-btn--cta" type="button" data-summary-open>Ver pedido</button>';
    box.querySelector('[data-summary-open]').onclick = openCart;
  }

  /* Pulso curto para confirmar uma mudança (Web Animations: não força recálculo de layout). */
  function pop(el, base) {
    if (motion.matches || !el.animate) return;
    var b = base || '';
    el.animate([{ transform: b + ' scale(1)' }, { transform: b + ' scale(1.14)' }, { transform: b + ' scale(1)' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  function shake(el) {
    if (motion.matches || !el.animate) return;
    el.animate([{ transform: 'none' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 300 });
  }

  /* ---------------- Detalhe do produto ---------------- */
  function openSheet(id, opener) {
    var item = findItem(id), sheet = $('spSheet');
    if (!item) return;
    state.sheet = { item: item, qty: 1, opener: opener || null };
    var groups = (item.options || []).map(function (g) {
      var min = g.min || 0, max = g.max == null ? g.choices.length : g.max, single = max === 1;
      var hint = min > 0 ? (min === max ? 'Escolha ' + min : 'Escolha de ' + min + ' a ' + max) : (single ? 'Escolha até 1' : 'Escolha até ' + max);
      return '<fieldset class="sp-group" data-group="' + esc(g.id) + '"><legend><span class="sp-group-name">' + esc(g.name) + '</span><span class="sp-group-hint">' + hint + '</span>' +
        '<span class="sp-req' + (min > 0 ? '' : ' sp-req--opt') + '">' + (min > 0 ? 'Obrigatório' : 'Opcional') + '</span></legend>' +
        g.choices.map(function (c) {
          return '<label class="sp-choice"><input type="' + (single ? 'radio' : 'checkbox') + '" name="sp-g-' + esc(g.id) + '" value="' + esc(c.id) + '"><span class="sp-choice-name">' + esc(c.name) + '</span>' +
            (c.priceCents ? '<span class="sp-choice-price">+ ' + C.formatBRL(c.priceCents) + '</span>' : '') + '<span class="sp-choice-mark" aria-hidden="true"></span></label>';
        }).join('') + '</fieldset>';
    }).join('');
    sheet.innerHTML = '<div class="sp-sheet-backdrop" data-sheet-close></div><div class="sp-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="spSheetTitle">' +
      '<button class="sp-icon-btn sp-sheet-close" type="button" data-sheet-close aria-label="Fechar">' + icon(I.close) + '</button>' +
      '<div class="sp-sheet-scroll">' + (item.image ? '<figure class="sp-sheet-media"><img src="' + esc(item.image.src) + '" alt="' + esc(item.image.alt || item.name) + '" width="960" height="600" decoding="async"></figure>' : '') +
      '<div class="sp-sheet-body"><p class="sp-sheet-section">' + esc(item.section) + '</p><h2 id="spSheetTitle">' + esc(item.name) + '</h2>' + (item.description ? '<p class="sp-sheet-desc">' + esc(item.description) + '</p>' : '') +
      '<p class="sp-sheet-price">' + priceLabel(item) + '</p>' + groups +
      '<label class="sp-note"><span>Alguma observação? <small>Opcional</small></span><textarea id="spNote" rows="2" maxlength="140" placeholder="Ex.: sem cebola, ponto da carne"></textarea></label></div></div>' +
      '<footer class="sp-sheet-foot"><div class="sp-stepper" role="group" aria-label="Quantidade"><button type="button" data-step="-1" aria-label="Diminuir quantidade">' + icon(I.minus) + '</button><output id="spQty" aria-live="polite">1</output><button type="button" data-step="1" aria-label="Aumentar quantidade">' + icon(I.plus) + '</button></div>' +
      '<button class="sp-confirm" type="button" id="spConfirm"></button></footer></div>';
    sheet.querySelectorAll('[data-sheet-close]').forEach(function (b) { b.onclick = function () { closeSheet(true); }; });
    sheet.querySelectorAll('[data-step]').forEach(function (b) { b.onclick = function () { state.sheet.qty = Math.max(1, Math.min(C.MAX_QTY, state.sheet.qty + Number(b.dataset.step))); updateSheet(); }; });
    sheet.querySelectorAll('.sp-group input').forEach(function (inp) { inp.onchange = updateSheet; });
    $('spConfirm').onclick = confirmSheet;
    sheet.onkeydown = trapFocus;
    updateSheet();
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { sheet.querySelector('.sp-sheet-close').focus({ preventScroll: true }); });
  }

  function selection() {
    var choices = {};
    $('spSheet').querySelectorAll('.sp-group').forEach(function (fs) {
      var ids = [].slice.call(fs.querySelectorAll('input:checked')).map(function (i) { return i.value; });
      if (ids.length) choices[fs.dataset.group] = ids;
    });
    return { choices: choices, note: $('spNote').value };
  }

  function updateSheet() {
    var sh = state.sheet, sel = selection(), errors = C.validateSelection(sh.item, sel), btn = $('spConfirm');
    (sh.item.options || []).forEach(function (g) {
      var max = g.max == null ? g.choices.length : g.max, fs = $('spSheet').querySelector('[data-group="' + g.id + '"]'), n = (sel.choices[g.id] || []).length;
      if (max > 1) fs.querySelectorAll('input').forEach(function (i) { i.disabled = !i.checked && n >= max; });
      fs.classList.toggle('is-done', n >= (g.min || 0) && (g.min || 0) > 0);
    });
    $('spQty').textContent = sh.qty;
    $('spSheet').querySelector('[data-step="-1"]').disabled = sh.qty <= 1;
    var total = C.unitPrice(sh.item, sel) * sh.qty;
    btn.setAttribute('aria-disabled', String(!!errors.length));
    btn.innerHTML = errors.length ? '<span>' + esc(errors[0]) + '</span>' : '<span>Adicionar</span><strong>' + C.formatBRL(total) + '</strong>';
  }

  function confirmSheet() {
    var sh = state.sheet, sel = selection(), errors = C.validateSelection(sh.item, sel);
    if (errors.length) {
      var first = (sh.item.options || []).find(function (g) {
        var own = {};
        if (sel.choices[g.id]) own[g.id] = sel.choices[g.id];
        return C.validateSelection({ options: [g] }, { choices: own }).length;
      });
      var fs = first && $('spSheet').querySelector('[data-group="' + first.id + '"]');
      if (fs) { fs.scrollIntoView({ behavior: behavior(), block: 'center' }); shake(fs.querySelector('legend')); var inp = fs.querySelector('input:not(:disabled)'); if (inp) inp.focus({ preventScroll: true }); }
      return;
    }
    state.cart = C.addItem(state.cart, state.store, sh.item.id, sh.qty, sel);
    saveCart();
    var item = sh.item, qty = sh.qty, opener = sh.opener;
    closeSheet(false);
    added(item, qty, null);
    var target = opener && document.contains(opener) ? opener : null;
    if (target) target.focus({ preventScroll: true });
  }

  function closeSheet(returnFocus) {
    var sheet = $('spSheet');
    if (!sheet || !sheet.classList.contains('open')) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    var opener = state.sheet && state.sheet.opener;
    state.sheet = null;
    if (returnFocus && opener && document.contains(opener)) opener.focus({ preventScroll: true });
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var f = [].slice.call(e.currentTarget.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,a[href]')).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }

  /* ---------------- Sacola ---------------- */
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
    if (returnFocus !== false) { var bar = $('cartBar'); if (bar && !bar.hidden) bar.focus({ preventScroll: true }); else { var back = page.querySelector('.store-back'); if (back) back.focus({ preventScroll: true }); } }
  }

  function renderCart() {
    var s = state.store, t = C.cartTotals(state.cart, s, state.mode), ordering = C.canOrder(s), lines = $('cartLines');
    $('cartStore').textContent = s.name;
    lines.innerHTML = state.cart.lines.length ? state.cart.lines.map(function (l) {
      return '<li class="cart-line"><div class="cart-line-top"><strong><span class="cart-qty">' + l.qty + '×</span> ' + esc(l.name) + '</strong><span class="sp-leader" aria-hidden="true"></span><b>' + C.formatBRL(l.unitCents * l.qty) + '</b></div>' +
        ((l.choices || []).length ? '<ul class="cart-line-opts">' + l.choices.map(function (c) { return '<li>' + esc(c.name) + (c.priceCents ? ' <span>+ ' + C.formatBRL(c.priceCents) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '') +
        (l.note ? '<p class="cart-line-note">Obs.: ' + esc(l.note) + '</p>' : '') +
        '<div class="cart-line-ctrl"><span>' + C.formatBRL(l.unitCents) + ' cada</span><div class="sp-stepper sp-stepper--sm" role="group" aria-label="Quantidade de ' + esc(l.name) + '"><button type="button" data-key="' + esc(l.key) + '" data-delta="-1" aria-label="' + (l.qty === 1 ? 'Remover ' : 'Diminuir ') + esc(l.name) + '">' + icon(l.qty === 1 ? I.close : I.minus) + '</button><output>' + l.qty + '</output><button type="button" data-key="' + esc(l.key) + '" data-delta="1" aria-label="Aumentar ' + esc(l.name) + '"' + (l.qty >= C.MAX_QTY ? ' disabled' : '') + '>' + icon(I.plus) + '</button></div></div></li>';
    }).join('') : '<li class="cart-empty"><span>' + icon(I.bag) + '</span><strong>Seu pedido está vazio</strong><p>Toque em + nos itens do cardápio para começar.</p><button type="button" class="sp-btn sp-btn--ghost" data-cart-close>Voltar ao cardápio</button></li>';
    lines.querySelectorAll('[data-key]').forEach(function (b) {
      b.onclick = function () {
        var key = b.dataset.key, line = state.cart.lines.find(function (l) { return l.key === key; });
        state.cart = C.setQty(state.cart, key, (line ? line.qty : 0) + Number(b.dataset.delta));
        saveCart();
        renderQty(false);
        renderCart();
        var again = lines.querySelector('[data-key="' + CSS.escape(key) + '"][data-delta="' + b.dataset.delta + '"]');
        (again || drawer.querySelector('.cart-close')).focus({ preventScroll: true });
      };
    });
    lines.querySelectorAll('[data-cart-close]').forEach(function (b) { b.onclick = function () { closeCart(); }; });
    $('cartSubtotal').textContent = C.formatBRL(t.subtotal);
    $('cartFee').textContent = state.mode === 'retirada' ? 'Grátis (retirada)' : t.feeKnown ? C.formatBRL(t.fee) : 'A confirmar';
    $('cartTotal').textContent = C.formatBRL(t.total);
    $('cartTotalLabel').textContent = t.feeKnown ? 'Total' : 'Total sem entrega';
    $('cartAddressField').hidden = state.mode === 'retirada';
    $('cartChangeField').hidden = $('cartPayment').value !== 'Dinheiro';
    drawer.querySelectorAll('[name="cartMode"]').forEach(function (r) { r.checked = r.value === state.mode; });
    drawer.classList.toggle('is-empty', !state.cart.lines.length);
    var send = $('cartSend');
    send.disabled = !ordering || !state.cart.lines.length;
    $('cartNote').textContent = ordering ? 'O pedido será enviado para o WhatsApp de ' + s.name + ' (' + C.formatPhone(s.whatsapp) + '). Pagamento e entrega são combinados diretamente com o estabelecimento.' : 'Pedido online indisponível: o WhatsApp deste estabelecimento ainda não foi verificado. Use os contatos da página para confirmar o pedido.';
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

  page.addEventListener('click', onPageClick);
  drawer.querySelectorAll('.cart-head [data-cart-close], .cart-backdrop').forEach(function (b) { b.onclick = function () { closeCart(); }; });
  drawer.querySelectorAll('[name="cartMode"]').forEach(function (r) { r.onchange = function () { state.mode = r.value; renderCart(); renderQty(false); }; });
  $('cartPayment').onchange = renderCart;
  $('cartForm').onsubmit = sendOrder;
  drawer.onkeydown = trapFocus;
  (function restoreCustomer() {
    try { var c = JSON.parse(readStorage('pedeai-customer') || 'null'); if (c) { $('cartName').value = c.name || ''; $('cartAddress').value = c.address || ''; } } catch (e) { /* ignora */ }
  })();

  /* Esc fecha a camada mais alta: detalhe do produto, sacola e, por fim, a página. */
  function handleEscape() {
    if ($('spSheet') && $('spSheet').classList.contains('open')) { closeSheet(true); return true; }
    if (drawer.classList.contains('open')) { closeCart(); return true; }
    return false;
  }

  window.PedeAiStore = {
    open: open, close: close, handleEscape: handleEscape,
    isOpen: function () { return page.classList.contains('open'); },
    onBack: function () { /* substituído por app.js */ }
  };
})();
