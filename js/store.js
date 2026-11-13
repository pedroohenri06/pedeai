/* PedeAi — página do estabelecimento (#/loja/<id>): apresentação, cardápio, detalhe do produto com opções,
   sacola e envio pelo WhatsApp. Isolada do restante do site: expõe apenas window.PedeAiStore. */
(function () {
  'use strict';
  var C = window.PedeAiCore, S = window.PedeAiSchedule, esc = C.escapeHtml;
  var $ = function (id) { return document.getElementById(id); };
  var page = $('storePage'), drawer = $('cartDrawer');
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var behavior = function () { return motion.matches ? 'instant' : 'smooth'; };

  var state = { store: null, cart: null, mode: 'entrega', step: 1, lastFocus: null, sheet: null, observers: [], loading: {} };

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
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>', bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>', dish: '<path d="M3 17h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 8V6"/><path d="M10 6h4"/>'
  };

  /* Glifo oficial do WhatsApp (marca registrada da Meta), usado só nos botões que abrem o WhatsApp. */
  var WA_LOGO = '<svg class="wa-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';

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

  /* Selo da loja: o logotipo oficial, quando existe; senão, as iniciais sobre o degradê da marca. */
  function badgeTile(s) {
    if (s.logo) return '<span class="sp-tile sp-tile--logo"><img src="' + esc(s.logo.tile || s.logo.thumb || s.logo.src) + '" alt="" width="120" height="120" decoding="async"></span>';
    return '<span class="sp-tile" aria-hidden="true">' + esc(initials(s.name)) + '</span>';
  }

  function chips(s) {
    var c = ['<span class="sp-chip">' + esc(s.category) + '</span>', '<span class="sp-chip">' + icon(I.pin) + esc(s.city) + '</span>'];
    if (C.canOrder(s)) c.push('<span class="sp-chip sp-chip--on">Pedido online</span>');
    else if (C.menuSize(s)) c.push('<span class="sp-chip">' + C.menuSize(s) + (C.menuSize(s) === 1 ? ' item' : ' itens') + ' no cardápio</span>');
    if (s.confidence === 'baixa') c.push('<span class="sp-chip sp-chip--muted">Em verificação</span>');
    return '<div class="sp-chips">' + c.join('') + '</div>';
  }

  /* Capa: foto com degradê vinho, ou o degradê da marca com o símbolo do PedeAi em marca d'água. */
  function coverHtml(s) {
    var photo = !!s.image;
    return '<section class="sp-cover' + (photo ? ' sp-cover--photo' : ' sp-cover--brand sp-hero--empty') + '" aria-labelledby="storeName">' +
      (photo ? '<img class="sp-cover-img" src="' + esc(s.image.src) + '" alt="' + esc(s.image.alt || s.name) + '" width="' + (s.image.width || 960) + '" height="' + (s.image.height || 640) + '" fetchpriority="high" decoding="async" onerror="this.remove()">' : '<span class="sp-cover-mark" aria-hidden="true"></span>') +
      '<div class="sp-cover-body">' + badgeTile(s) + '<div class="sp-cover-text"><h1 id="storeName" class="sp-name">' + esc(s.name) + '</h1><p class="sp-lede">' + esc(lede(s)) + '</p>' + chips(s) + '</div></div>' +
      (photo && s.image.credit ? '<span class="sp-credit">Foto: ' + esc(s.image.credit) + '</span>' : '') + '</section>';
  }

  function actionsHtml(s) {
    var a = [];
    if (s.whatsapp) a.push('<a class="sp-btn sp-btn--primary" href="' + esc(C.whatsappUrl(s.whatsapp, 'Olá, ' + s.name + '! Encontrei vocês no PedeAi Delivery.')) + '" target="_blank" rel="noopener">' + WA_LOGO + 'Falar no WhatsApp</a>');
    if (s.phone) a.push('<a class="sp-btn" href="tel:+' + esc(s.phone) + '">' + icon(I.phone) + 'Ligar</a>');
    // orderUrl só é link de WhatsApp da própria loja (wa.me/message, sem número aberto): nunca cardápio externo.
    if (s.orderUrl && !s.whatsapp) a.push('<a class="sp-btn sp-btn--primary" href="' + esc(s.orderUrl) + '" target="_blank" rel="noopener">' + WA_LOGO + 'Falar no WhatsApp</a>');
    if (s.instagram) a.push('<a class="sp-btn" href="https://www.instagram.com/' + encodeURIComponent(s.instagram) + '/" target="_blank" rel="noopener">' + icon(I.link) + 'Instagram</a>');
    if (s.website) a.push('<a class="sp-btn" href="' + esc(s.website) + '" target="_blank" rel="noopener">' + icon(I.link) + 'Site</a>');
    return a.length ? '<div class="sp-actions">' + a.join('') + '</div>' : '';
  }

  /* Horário: com grade confiável, status calculado agora + grade da semana (hoje em destaque); sem grade, o texto. */
  function hoursHtml(s) {
    var st = S.status(s.schedule), rows = S.weekRows(s.schedule);
    if (!rows.length) return s.hours ? '<li>' + icon(I.clock) + '<div><strong>Horário</strong><span>' + esc(s.hours) + '</span></div></li>' : '';
    var today = S.today(s.schedule.tz);
    return '<li>' + icon(I.clock) + '<div><strong>Horário <span class="sp-open is-' + st.state + '" data-sp-status><i aria-hidden="true"></i>' + esc(st.label || '') + '</span>' +
      '</strong>' +
      (st.detail ? '<span data-sp-detail>' + esc(st.detail) + '</span>' : '') +
      '<details class="sp-week"><summary>Horários da semana</summary><ul>' + rows.map(function (r) {
        return '<li' + (r.key === today ? ' class="is-today"' : '') + '><span>' + esc(r.day) + '</span><span>' + esc(r.text) + '</span></li>';
      }).join('') + '</ul></details></div></li>';
  }

  /* Entrega: previsão total e pedido mínimo, só quando a loja publicou esses dados. */
  function deliveryHtml(s) {
    var eta = S.deliveryEstimate(s), parts = [];
    if (eta) parts.push('Previsão de ' + eta.label);
    if (s.minOrderCents) parts.push('Pedido mínimo ' + C.formatBRL(s.minOrderCents));
    return parts.length ? '<li>' + icon(I.bag) + '<div><strong>Entrega</strong><span>' + esc(parts.join(' · ')) + '</span></div></li>' : '';
  }

  /* Loja ainda sem logo/foto e sem cardápio: está em negociação com o PedeAi (regra do Pedro, 10/11/2026). Não mostra
     aberto/fechado nem previsão de entrega, porque ainda não recebe pedidos pela plataforma. */
  function isNegotiating(s) { return !s.logo && !s.image && !s.menu.length && !s.menuFile; }

  function infoHtml(s) {
    return '<section class="sp-card sp-info" aria-label="Informações do estabelecimento"><ul class="sp-facts">' +
      '<li>' + icon(I.pin) + '<div><strong>' + esc(s.address || s.city + ', MT') + '</strong>' + (s.address ? '<span>' + esc(s.city) + ', MT</span>' : '') + '<a href="' + esc(mapsUrl(s)) + '" target="_blank" rel="noopener">Ver no mapa</a></div></li>' +
      (isNegotiating(s) ? '<li>' + icon(I.clock) + '<div><strong>Em negociação com o PedeAi</strong><span>Aguardando a confirmação do cardápio, dos preços e dos horários.</span></div></li>' : hoursHtml(s) + deliveryHtml(s)) +
      '</ul>' + actionsHtml(s) +

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
    return (hasPricedOptions(item) ? '<span class="sp-from">a partir de</span> ' : '') +
      (item.originalPriceCents > item.priceCents ? '<s class="sp-was"><span class="sr-only">de </span>' + C.formatBRL(item.originalPriceCents) + '</s> <span class="sp-now"><span class="sr-only">por </span>' + C.formatBRL(item.priceCents) + '</span>' : C.formatBRL(item.priceCents));
  }

  /* Selos do item: destaque (marcado pela própria loja na plataforma de origem), promoção e opções. */
  function itemTags(m) {
    return (m.featured ? '<span class="sp-item-tag sp-item-tag--star">' + icon(I.star) + 'Destaque</span>' : '') +
      (m.originalPriceCents > m.priceCents ? '<span class="sp-item-tag sp-item-tag--promo">-' + Math.round(100 - m.priceCents * 100 / m.originalPriceCents) + '%</span>' : '') +
      ((m.options || []).length ? '<span class="sp-item-tag">Com opções</span>' : '');
  }

  function thumbOf(m) { return m.image && (m.image.thumb || m.image.src); }

  function itemHtml(m) {
    var media = m.image
      ? '<img src="' + esc(thumbOf(m)) + '" alt="" width="240" height="240" loading="lazy" decoding="async">'
      : '<span class="sp-ph" aria-hidden="true">' + icon(I.dish) + '</span>';
    return '<li class="sp-li"><article class="sp-item" data-item="' + esc(m.id) + '">' +
      '<button class="sp-item-main" type="button" data-open="' + esc(m.id) + '" aria-haspopup="dialog"><span class="sp-item-name">' + esc(m.name) + '</span>' +
      (m.description ? '<span class="sp-item-desc">' + esc(m.description) + '</span>' : '') +
      '<span class="sp-item-meta"><span class="sp-item-price">' + priceLabel(m) + '</span>' + itemTags(m) + '</span></button>' +
      '<div class="sp-item-media" data-open="' + esc(m.id) + '">' + media + '<span class="sp-badge" data-badge="' + esc(m.id) + '" hidden></span>' +
      '<button class="sp-add" type="button" data-add="' + esc(m.id) + '" aria-label="Adicionar ' + esc(m.name) + ' ao pedido">' + icon(I.plus, 'sp-add-plus') + icon(I.check, 'sp-add-check') + '</button></div>' +
      '</article></li>';
  }

  /* Sobretítulo da marca: as linhas de velocidade do logo PedeAi + texto em versalete vermelho, como na home. */
  function eyebrow(text) {
    return '<p class="sp-eyebrow"><span class="sp-speed" aria-hidden="true"><i></i><i></i><i></i></span>' + esc(text) + '</p>';
  }

  /* Instrução do pedido, logo abaixo do título do cardápio. */
  function guideHtml(s) {
    return C.canOrder(s) ? '<p class="sp-guide sp-guide--line">Monte o pedido, informe o endereço e finalize no WhatsApp de <strong>' + esc(s.name) + '</strong>.</p>' : '';
  }

  /* Cardápio sob demanda: enquanto data/menus/<id>.json chega, a página mostra a estrutura do cardápio (sem conteúdo
     inventado); se a rede falhar, oferece tentar de novo. */
  function pendingMenuHtml(s) {
    var failed = state.loading[s.id] === 'erro';
    return '<section class="sp-menu" aria-labelledby="storeMenuTitle" aria-busy="' + !failed + '"><div class="sp-menu-head">' + eyebrow('Escolha seus itens') + '<h2 id="storeMenuTitle">Cardápio</h2></div>' +
      (failed
        ? '<div class="sp-card sp-empty"><h3>Não foi possível carregar o cardápio</h3><p>Verifique sua conexão e tente de novo.</p><div class="sp-empty-actions"><button class="sp-btn sp-btn--primary" type="button" data-menu-retry>Tentar de novo</button>' +
          '</div></div>'
        : '<div class="sp-skel" aria-hidden="true">' + '<span class="sp-skel-cats"><i></i><i></i><i></i></span>' + new Array(5).join('<span class="sp-skel-item"><i></i><i></i><i></i><b></b></span>') + '</div><p class="sr-only">Carregando o cardápio…</p>') +
      '</section>';
  }

  /* Cabeçalho compacto do cardápio (logo e nome já estão no topo da página): título + números do cardápio. */
  function vitrineHtml(s, secs) {
    var promos = s.menu.filter(function (m) { return m.originalPriceCents > m.priceCents; }).length;
    var facts = [s.menu.length + ' itens', secs.length + (secs.length === 1 ? ' categoria' : ' categorias')];
    if (promos) facts.push(promos + (promos === 1 ? ' promoção' : ' promoções'));
    return '<div class="sp-menu-head sp-menu-title">' + eyebrow('Escolha seus itens') + '<h2 id="storeMenuTitle">Cardápio</h2><p class="sp-vitrine-facts">' + facts.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join(' ') + '</p></div>';
  }

  /* Destaques: só itens que a própria loja marcou como destaque na plataforma de origem; sem marcação, as promoções. */
  function highlightsHtml(s) {
    var featured = s.menu.filter(function (m) { return m.featured && m.image; });
    var title = 'Destaques da casa';
    if (featured.length < 2) { featured = s.menu.filter(function (m) { return m.originalPriceCents > m.priceCents && m.image; }); title = 'Promoções'; }
    if (featured.length < 2) return '';
    return '<section class="sp-highlights" aria-labelledby="spHlTitle"><h3 class="sp-hl-title" id="spHlTitle">' + icon(I.star) + esc(title) + '</h3><ul class="sp-hl-track" role="list">' +
      featured.slice(0, 10).map(function (m) {
        return '<li><button class="sp-hl" type="button" data-open="' + esc(m.id) + '" aria-haspopup="dialog"><span class="sp-hl-media"><img src="' + esc(thumbOf(m)) + '" alt="" width="320" height="320" loading="lazy" decoding="async"></span>' +
          '<span class="sp-hl-name">' + esc(m.name) + '</span><span class="sp-hl-price">' + (m.originalPriceCents > m.priceCents ? '<s class="sp-was">' + C.formatBRL(m.originalPriceCents) + '</s> ' : '') + '<span class="sp-now">' + C.formatBRL(m.priceCents) + '</span></span></button></li>';
      }).join('') + '</ul></section>';
  }

  function menuHtml(s) {
    if (s.menuFile && !s.menu.length) return pendingMenuHtml(s);
    if (!s.menu.length) {
      var waHref = s.whatsapp ? C.whatsappUrl(s.whatsapp, 'Olá, ' + s.name + '! Encontrei vocês no PedeAi Delivery e gostaria de fazer um pedido.') : s.orderUrl;
      var actions = waHref ? '<a class="sp-btn sp-btn--primary" href="' + esc(waHref) + '" target="_blank" rel="noopener">' + WA_LOGO + 'Pedir pelo WhatsApp</a>' : '';
      if (isNegotiating(s)) return '<section class="sp-menu" aria-labelledby="storeMenuTitle"><div class="sp-menu-head">' + eyebrow('Em negociação') + '<h2 id="storeMenuTitle">Cardápio</h2></div>' +
        '<div class="sp-card sp-empty menu-pending"><img class="sp-empty-art" src="assets/pedeai-courier-3d-v2.webp" width="160" height="149" alt="" loading="lazy" decoding="async"><h3>Em negociação com o restaurante</h3><p>O PedeAi está em negociação com ' + esc(s.name) + '. Assim que o cardápio e os preços forem confirmados, os pedidos ficam disponíveis aqui.</p>' +
        (actions ? '<div class="sp-empty-actions">' + actions + '</div>' : '') + '</div></section>';
      return '<section class="sp-menu" aria-labelledby="storeMenuTitle"><div class="sp-menu-head">' + eyebrow(s.whatsapp || s.orderUrl ? 'Peça direto' : 'Em breve') + '<h2 id="storeMenuTitle">Cardápio</h2></div>' +
        '<div class="sp-card sp-empty menu-pending"><img class="sp-empty-art" src="assets/pedeai-courier-3d-v2.webp" width="160" height="149" alt="" loading="lazy" decoding="async"><h3>Cardápio em preparação</h3><p>Ainda não temos um cardápio com preços confirmados para ' + esc(s.name) + '.' +
        (s.whatsapp || s.orderUrl ? ' Você pode fazer seu pedido direto pelo WhatsApp.' : ' Assim que o estabelecimento confirmar as informações, o pedido online é liberado aqui.') + '</p>' +
        (actions ? '<div class="sp-empty-actions">' + actions + '</div>' : '') + '</div></section>';
    }
    var secs = sectionsOf(s.menu), many = s.menu.length >= 12;
    return '<section class="sp-menu" aria-labelledby="storeMenuTitle">' + vitrineHtml(s, secs) +
      guideHtml(s) +
      (secs.length > 1 || many ? '<div class="sp-sticky">' +
        (secs.length > 1 ? '<nav class="sp-cats" aria-label="Categorias do cardápio"><div class="sp-cats-track">' + secs.map(function (sec, i) {
          return '<a class="sp-cat" href="#sp-sec-' + i + '" data-sec="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + esc(sec.name) + '</a>';
        }).join('') + '<span class="sp-cats-ink" aria-hidden="true"></span></div></nav>' : '') +
        (many ? '<label class="sp-search">' + icon(I.search) + '<span class="sr-only">Buscar no cardápio</span><input type="search" id="spSearch" placeholder="Buscar no cardápio" autocomplete="off" enterkeyhint="search"></label>' : '') +
        '</div>' : '') +
      highlightsHtml(s) +
      secs.map(function (sec, i) {
        return '<section class="sp-section" id="sp-sec-' + i + '" data-sec="' + i + '" aria-labelledby="sp-sec-t-' + i + '"><h3 class="sp-section-title" id="sp-sec-t-' + i + '">' + esc(sec.name) + ' <small>' + sec.items.length + '</small></h3><ul class="sp-items" role="list">' + sec.items.map(itemHtml).join('') + '</ul></section>';
      }).join('') +
      '<p class="sp-noresult" id="spNoResult" hidden>Nenhum item encontrado no cardápio.</p>' +
      '<section class="sp-order" id="spOrder" aria-labelledby="spOrderTitle"></section></section>';
  }


  /* ---------------- Abertura e fechamento ---------------- */
  /* Estado do carregamento por loja: 'carregando' ou 'erro' (sem entrada = ainda não pedido ou já carregado). */
  /* Marca da loja: paleta tirada do logotipo (scripts/menus/brand.py). Sem paleta, vale a identidade PedeAi. */
  var BRAND_VARS = { primary: '--b', deep: '--b-deep', soft: '--b-soft', ink: '--b-ink', surface: '--b-surface' };
  function applyBrand(s) {
    Object.keys(BRAND_VARS).forEach(function (k) {
      if (s.brand && s.brand[k]) page.style.setProperty(BRAND_VARS[k], s.brand[k]); else page.style.removeProperty(BRAND_VARS[k]);
    });
    page.classList.toggle('sp-branded', !!s.brand);
  }

  function loadMenu(s) {
    state.loading[s.id] = 'carregando';
    fetch(s.menuFile).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (menu) {
      s.menu = menu;
      delete state.loading[s.id];
      if (state.store === s) render(s);
    }).catch(function () {
      state.loading[s.id] = 'erro';
      if (state.store === s) render(s);
    });
  }

  function open(s) {
    if (!page.classList.contains('open')) state.lastFocus = document.activeElement;
    if (s.menuFile && !s.menu.length && state.loading[s.id] !== 'carregando') loadMenu(s);
    render(s);
  }

  /* Monta a página (de novo quando o cardápio sob demanda chega, mantendo a rolagem). */
  function render(s) {
    var again = state.store === s && page.classList.contains('open'), keep = again && $('storeScroll') ? $('storeScroll').scrollTop : 0;
    state.quiet = true; closeSheet(false); closeCart(false); state.quiet = false;
    disconnect();
    state.store = s;
    state.cart = loadCart(s);
    page.classList.toggle('sp-has-photo', !!s.image);
    /* Sem nenhuma foto de produto, cartões só de texto; com ao menos uma, todos reservam a área de imagem. */
    /* Modo com fotos quando ao menos 1/4 dos itens tem foto; abaixo disso, linhas compactas (foto só no detalhe). */
    page.classList.toggle('sp-noimg', s.menu.filter(function (m) { return m.image; }).length < Math.max(1, s.menu.length / 4));
    applyBrand(s);
    page.classList.toggle('sp-has-menu', C.menuSize(s) > 0);
    page.innerHTML = '<div class="sp-scroll" id="storeScroll">' + topHtml(s) +
      '<div class="sp-page">' + coverHtml(s) +
      '<div class="sp-layout"><aside class="sp-aside">' + infoHtml(s) + summaryHtml(s) + '</aside>' +
      '<div class="sp-main">' + menuHtml(s) + '</div></div></div><div id="spFooter"></div></div>' +
      (s.menu.length ? '<button class="sp-cartbar" id="cartBar" type="button" hidden aria-haspopup="dialog"></button>' : '') +
      '<p class="sr-only" id="spLive" aria-live="polite"></p><div class="sp-sheet" id="spSheet" aria-hidden="true"></div>';
    mountFooter();
    bind();
    renderQty(false);
    page.classList.add('open');
    page.setAttribute('aria-hidden', 'false');
    deferSections(again);
    document.body.classList.add('store-open');
    document.title = s.name + ' em ' + s.city + ' | PedeAi Delivery';
    $('storeScroll').scrollTop = keep;
    var retry = page.querySelector('[data-menu-retry]');
    if (retry) retry.onclick = function () { loadMenu(s); render(s); };
    if (again) return;
    // Foco no próprio diálogo: leitores de tela anunciam a loja e nenhum anel de foco aparece no botão voltar ao abrir.
    page.setAttribute('tabindex', '-1');
    requestAnimationFrame(function () { page.focus({ preventScroll: true }); });
  }

  /* Cardápio grande em Android de entrada: na abertura, o navegador só calcula layout/pintura das seções perto da
     tela (content-visibility via .sp-lazy); quando o aparelho fica ocioso, a classe sai e o resto é montado de uma
     vez, para que posições (rolagem até a categoria, realce da seção) fiquem exatas. */
  var lazyTimer = null;
  function deferSections(again) {
    clearTimeout(lazyTimer);
    if (again || page.querySelectorAll('.sp-li').length < 40) { page.classList.remove('sp-lazy'); return; }
    page.classList.add('sp-lazy');
    lazyTimer = setTimeout(function () {
      (window.requestIdleCallback || function (f) { return setTimeout(f, 0); })(settleSections, { timeout: 2000 });
    }, 900);
  }
  function settleSections() { clearTimeout(lazyTimer); page.classList.remove('sp-lazy'); }

  function close(silent) {
    state.quiet = true; closeSheet(false); closeCart(false); state.quiet = false;
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
    revealItems(scroller);
  }

  /* Itens do cardápio entram com um leve deslocamento quando chegam à tela (uma vez, em cascata curta). */
  function revealItems(scroller) {
    if (motion.matches || !('IntersectionObserver' in window)) return;
    var items = [].slice.call(page.querySelectorAll('.sp-item'));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { root: scroller, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el, i) { el.style.setProperty('--i', i % 4); el.classList.add('sp-reveal'); io.observe(el); });
    state.observers.push(io);
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
        settleSections(); // posições exatas antes de rolar até a seção
        var i = Number(a.dataset.sec), sec = sections[i], sticky = page.querySelector('.sp-sticky');
        locked = Date.now() + 900;
        current = i;
        activate(i);
        var targetOf = function () { var st = page.querySelector('.sp-sticky'); return offsetIn(scroller, sec) - page.querySelector('.sp-top').offsetHeight - (st ? st.offsetHeight : 0) - 8; };
        scroller.scrollTo({ top: targetOf(), behavior: behavior() });
        /* Durante a rolagem o topo da loja condensa (muda de altura) e o alvo calculado no toque fica deslocado:
           quando a rolagem para, confere e faz o ajuste fino. */
        var last = -1, still = 0, tries = 0;
        (function settle() {
          if (++tries > 30) return;
          var y = scroller.scrollTop;
          still = Math.abs(y - last) < 1 ? still + 1 : 0; last = y;
          if (still < 2) return setTimeout(settle, 80);
          var fix = targetOf();
          if (Math.abs(fix - y) > 6) { locked = Date.now() + 600; scroller.scrollTo({ top: fix, behavior: behavior() }); }
        })();
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
    renderOrder();
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
  /* Painel "Seu pedido" no fim do cardápio: itens, subtotal e endereço, sincronizados com a sacola. */
  function renderOrder() {
    var box = $('spOrder');
    if (!box) return;
    var s = state.store, ordering = C.canOrder(s), pickup = state.mode === 'retirada';
    if (!state.cart.lines.length) {
      box.innerHTML = '<h3 id="spOrderTitle">Seu pedido</h3><p class="sp-order-empty">' + icon(I.bag) + '<span>Toque em <b>+</b> nos itens do cardápio para montar seu pedido.</span></p>';
      return;
    }
    var t = C.cartTotals(state.cart, s, state.mode);
    box.innerHTML = '<h3 id="spOrderTitle">Seu pedido</h3><ul class="sp-order-lines">' + state.cart.lines.map(function (l) {
      return '<li><span><b>' + l.qty + '×</b> ' + esc(l.name) + '</span><span>' + C.formatBRL(l.unitCents * l.qty) + '</span></li>';
    }).join('') + '</ul><p class="sp-order-total"><span>Subtotal</span><strong>' + C.formatBRL(t.subtotal) + '</strong></p>' +
      '<div class="sp-order-mode" role="group" aria-label="Como você quer receber?"><button type="button" data-mode="entrega" aria-pressed="' + !pickup + '">Entrega</button><button type="button" data-mode="retirada" aria-pressed="' + pickup + '">Retirar no local</button></div>' +
      '<button class="sp-order-cta" type="button" data-order-finish>' + (ordering ? WA_LOGO + 'Finalizar no WhatsApp' : 'Revisar pedido') + '<strong>' + C.formatBRL(t.total) + '</strong></button>' +
      '<p class="sp-order-note">' + (ordering ? 'Em 3 passos rápidos (sacola, entrega e pagamento) o pedido abre pronto no WhatsApp de ' + esc(s.name) + '.' : 'O envio pelo WhatsApp é liberado quando o estabelecimento confirmar o número.') + '</p>';
    box.querySelectorAll('[data-mode]').forEach(function (b) {
      b.onclick = function () { state.mode = b.dataset.mode; renderQty(false); };
    });
    box.querySelector('[data-order-finish]').onclick = openCart;
  }

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
  /* Camadas (detalhe do produto e sacola) entram no histórico: o "voltar" do Android/navegador fecha só a camada
     de cima, como nos apps nativos, em vez de fechar a loja inteira. Fechar pela interface (X, fundo, adicionar)
     consome essa entrada com history.back(), sem refazer a página. */
  var layerPop = false;
  function pushLayer(kind) {
    try { if (!history.state || history.state.pedeaiLayer !== kind) history.pushState(Object.assign({}, history.state || {}, { pedeaiLayer: kind }), '', location.href); } catch (e) { /* sem histórico */ }
  }
  function popLayer(kind) {
    if (state.quiet || !history.state || history.state.pedeaiLayer !== kind) return;
    layerPop = true;
    history.back();
  }
  /* Chamado pelo roteador em todo popstate. true = o evento foi tratado aqui (não rotear). */
  function handlePop() {
    if (layerPop) { layerPop = false; return true; }
    var layer = history.state && history.state.pedeaiLayer;
    if ($('spSheet') && $('spSheet').classList.contains('open') && layer !== 'sheet') { closeSheet(true, true); return true; }
    if (drawer.classList.contains('open') && layer !== 'cart') {
      if (state.step > 1) { goStep(state.step - 1); pushLayer('cart'); return true; }
      closeCart(undefined, true); return true;
    }
    return false;
  }

  function openSheet(id, opener) {
    var item = findItem(id), sheet = $('spSheet');
    if (!item) return;
    state.sheet = { item: item, qty: 1, opener: opener || null };
    pushLayer('sheet');
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
      '<div class="sp-sheet-scroll">' + (item.image && !item.image.small ? '<figure class="sp-sheet-media"><img class="sp-sheet-bg" src="' + esc(item.image.src) + '" alt="" aria-hidden="true" decoding="async"><img src="' + esc(item.image.src) + '" alt="' + esc(item.image.alt || item.name) + '" width="960" height="600" decoding="async"></figure>' : '') +
      '<div class="sp-sheet-body"><p class="sp-sheet-section">' + esc(item.section) + '</p><h2 id="spSheetTitle">' + esc(item.name) + '</h2>' + (item.description ? '<p class="sp-sheet-desc">' + esc(item.description) + '</p>' : '') +
      '<p class="sp-sheet-price">' + priceLabel(item) + '</p>' + (item.featured || item.originalPriceCents > item.priceCents ? '<p class="sp-sheet-tags">' + itemTags({ featured: item.featured, originalPriceCents: item.originalPriceCents, priceCents: item.priceCents }) + '</p>' : '') + groups +
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

  function closeSheet(returnFocus, viaHistory) {
    var sheet = $('spSheet');
    if (!sheet || !sheet.classList.contains('open')) return;
    if (!viaHistory) popLayer('sheet');
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
    state.step = 1;
    clearErrors();
    renderCart();
    pushLayer('cart');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { drawer.querySelector('.cart-close').focus({ preventScroll: true }); });
  }

  function closeCart(returnFocus, viaHistory) {
    if (!drawer.classList.contains('open')) return;
    if (!viaHistory) popLayer('cart');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (returnFocus !== false) { var bar = $('cartBar'); if (bar && !bar.hidden) bar.focus({ preventScroll: true }); else { var back = page.querySelector('.store-back'); if (back) back.focus({ preventScroll: true }); } }
  }

  function renderCart() {
    var s = state.store, t = C.cartTotals(state.cart, s, state.mode), ordering = C.canOrder(s), lines = $('cartLines');
    $('cartStore').textContent = s.name;
    $('cartAvatar').innerHTML = s.logo ? '<img src="' + esc(s.logo.tile || s.logo.thumb || s.logo.src) + '" alt="" width="44" height="44" decoding="async">' : '<b>' + esc((s.name || '?').trim().charAt(0).toUpperCase()) + '</b>';
    var count = C.cartCount(state.cart);
    $('cartCount').textContent = count ? '· ' + count + (count === 1 ? ' item' : ' itens') : '';
    lines.innerHTML = state.cart.lines.length ? state.cart.lines.map(function (l) {
      var it = findItem(l.itemId), th = it && thumbOf(it);
      return '<li class="cart-line' + (th ? ' has-thumb' : '') + '">' + (th ? '<img class="cart-thumb" src="' + esc(th) + '" alt="" width="56" height="56" loading="lazy" decoding="async">' : '') + '<div class="cart-line-body"><div class="cart-line-top"><strong><span class="cart-qty">' + l.qty + '×</span> ' + esc(l.name) + '</strong><span class="sp-leader" aria-hidden="true"></span><b>' + C.formatBRL(l.unitCents * l.qty) + '</b></div>' +
        ((l.choices || []).length ? '<ul class="cart-line-opts">' + l.choices.map(function (c) { return '<li>' + esc(c.name) + (c.priceCents ? ' <span>+ ' + C.formatBRL(c.priceCents) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '') +
        (l.note ? '<p class="cart-line-note">Obs.: ' + esc(l.note) + '</p>' : '') +
        '<div class="cart-line-ctrl"><span>' + C.formatBRL(l.unitCents) + ' cada</span><div class="sp-stepper sp-stepper--sm" role="group" aria-label="Quantidade de ' + esc(l.name) + '"><button type="button" data-key="' + esc(l.key) + '" data-delta="-1" aria-label="' + (l.qty === 1 ? 'Remover ' : 'Diminuir ') + esc(l.name) + '">' + icon(l.qty === 1 ? I.close : I.minus) + '</button><output>' + l.qty + '</output><button type="button" data-key="' + esc(l.key) + '" data-delta="1" aria-label="Aumentar ' + esc(l.name) + '"' + (l.qty >= C.MAX_QTY ? ' disabled' : '') + '>' + icon(I.plus) + '</button></div></div></div></li>';
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
    $('cartFee').textContent = state.mode === 'retirada' ? 'Grátis (retirada)' : t.feeKnown ? C.formatBRL(t.fee) : 'A combinar';
    $('cartTotal').textContent = C.formatBRL(t.total);
    $('cartTotalLabel').textContent = t.feeKnown ? 'Total' : 'Total sem entrega';
    $('cartAddressField').hidden = state.mode === 'retirada';
    drawer.querySelectorAll('[name="cartMode"]').forEach(function (r) { r.checked = r.value === state.mode; });
    drawer.classList.toggle('is-empty', !state.cart.lines.length);
    if (!state.cart.lines.length) state.step = 1;
    renderStep();
  }

  /* ---------------- Checkout em 3 etapas: sacola → entrega → pagamento ---------------- */
  var STEP_TITLES = { 1: 'Pedido', 2: 'Entrega', 3: 'Pagamento' };
  function val(id) { return ($(id).value || '').trim(); }
  function payment() { var r = drawer.querySelector('[name="payment"]:checked'); return r ? r.value : ''; }
  function delivery() { return { mode: state.mode, name: val('cartName'), address: { street: val('cartStreet'), district: val('cartDistrict'), reference: val('cartRef') } }; }
  function pay() { return { payment: payment(), change: val('cartChange'), noChange: $('cartNoChange').checked }; }
  var ERR = { name: 'errName', street: 'errStreet', district: 'errDistrict', payment: 'errPayment', change: 'errChange' };
  var FIELD = { name: 'cartName', street: 'cartStreet', district: 'cartDistrict', payment: 'cartPay', change: 'cartChange' };
  function clearErrors() { Object.keys(ERR).forEach(function (k) { $(ERR[k]).textContent = ''; var f = $(FIELD[k]); if (f) f.removeAttribute('aria-invalid'); }); }
  function showErrors(e) {
    clearErrors();
    var first = null;
    Object.keys(e).forEach(function (k) { $(ERR[k]).textContent = e[k]; var f = $(FIELD[k]); if (f) { f.setAttribute('aria-invalid', 'true'); if (!first) first = f; } });
    if (first) { (first.matches('fieldset') ? first.querySelector('input') : first).focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return !first;
  }
  function saveCustomer() {
    var d = delivery();
    writeStorage('pedeai-customer', JSON.stringify({ name: d.name, street: d.address.street, district: d.address.district, reference: d.address.reference, payment: payment() }));
  }
  function goStep(n) {
    state.step = n;
    clearErrors();
    renderStep();
    $('cartScroll').scrollTop = 0;
    $('cartTitle').focus({ preventScroll: true });
  }
  function renderStep() {
    var s = state.store, n = state.step, ordering = C.canOrder(s), has = state.cart.lines.length, t = C.cartTotals(state.cart, s, state.mode);
    $('cartTitle').textContent = STEP_TITLES[n];
    $('cartBack').hidden = n === 1;
    drawer.querySelectorAll('.ck-step').forEach(function (sec) { sec.hidden = Number(sec.dataset.step) !== n; });
    drawer.querySelectorAll('#ckSteps li').forEach(function (li) {
      var k = Number(li.dataset.go);
      li.className = k < n ? 'is-done' : k === n ? 'is-current' : '';
      li.querySelector('button').disabled = k >= n;
      if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('ckSteps').hidden = !has;
    if (n === 2) {
      var pickup = state.mode === 'retirada';
      $('cartPickup').hidden = !pickup;
      if (pickup) $('cartPickup').innerHTML = icon(I.pin) + '<div><b>Retire em ' + esc(s.name) + '</b><span>' + esc(s.address ? s.address + ' · ' + s.city : s.city + ', MT') + '</span></div>';
      var eta = S.deliveryEstimate(s);
      $('cartEta').hidden = pickup || !eta;
      if (eta && !pickup) $('cartEta').innerHTML = icon(I.clock) + 'Previsão de entrega: <b>' + esc(eta.label) + '</b>';
    }
    if (n === 3) {
      var d = delivery(), cash = payment() === 'Dinheiro';
      $('cartChangeField').hidden = !cash;
      $('cartChange').disabled = $('cartNoChange').checked;
      $('cartReview').innerHTML = '<p class="ck-review-h">Confira seu pedido</p>' +
        '<div class="ck-review-row"><span>' + icon(I.bag) + '<span><b>' + C.cartCount(state.cart) + (C.cartCount(state.cart) === 1 ? ' item' : ' itens') + '</b> · ' + C.formatBRL(t.subtotal) + '</span></span><button type="button" data-go-step="1">Alterar</button></div>' +
        '<div class="ck-review-row"><span>' + icon(I.pin) + '<span>' + (state.mode === 'retirada' ? '<b>Retirada no local</b> · ' + esc(d.name) : '<b>' + esc(d.name) + '</b> · ' + esc(C.formatAddress(d.address)) + (d.address.reference ? ' (' + esc(d.address.reference) + ')' : '')) + '</span></span><button type="button" data-go-step="2">Alterar</button></div>';
    }
    var send = $('cartSend');
    send.disabled = !has || (n === 1 && !ordering);
    send.innerHTML = n === 3 ? WA_LOGO + 'Enviar pedido' : n === 2 ? 'Ir para pagamento' : 'Continuar';
    $('cartFootTotal').textContent = C.formatBRL(t.total);
    $('cartFootLabel').textContent = t.feeKnown || state.mode === 'retirada' ? 'Total' : 'Total sem entrega';
    $('cartNote').textContent = !ordering ? 'Pedido online indisponível: o WhatsApp deste estabelecimento ainda não foi verificado. Use os contatos da página para confirmar o pedido.'
      : n === 3 ? 'O pedido abre pronto no WhatsApp de ' + s.name + ', ' + C.formatPhone(s.whatsapp) + '. O pagamento é feito diretamente para a loja.'
      : n === 2 ? 'Seus dados ficam salvos neste aparelho para os próximos pedidos.' : '';
    $('cartNote').hidden = !$('cartNote').textContent;
  }

  function sendOrder(e) {
    e.preventDefault();
    var s = state.store;
    if (!state.cart.lines.length) return;
    if (state.step === 1) { if (C.canOrder(s)) goStep(2); return; }
    if (state.step === 2) { if (!showErrors(C.deliveryErrors(delivery()))) return; saveCustomer(); goStep(3); return; }
    if (!C.canOrder(s)) return;
    if (!showErrors(C.deliveryErrors(delivery()))) { goStep(2); showErrors(C.deliveryErrors(delivery())); return; }
    var t = C.cartTotals(state.cart, s, state.mode);
    if (!showErrors(C.paymentErrors(pay(), t.total))) return;
    saveCustomer();
    var d = delivery(), p = pay();
    var msg = C.buildOrderMessage(s, state.cart, { mode: d.mode, name: d.name, address: d.address, payment: p.payment, change: p.change, noChange: p.noChange, notes: $('cartNotes').value });
    window.open(C.whatsappUrl(s.whatsapp, msg), '_blank', 'noopener');
  }

  page.addEventListener('click', onPageClick);
  drawer.querySelectorAll('.cart-head [data-cart-close], .cart-backdrop').forEach(function (b) { b.onclick = function () { closeCart(); }; });
  drawer.querySelectorAll('[name="cartMode"]').forEach(function (r) { r.onchange = function () { state.mode = r.value; renderCart(); renderQty(false); }; });
  $('cartForm').onsubmit = sendOrder;
  drawer.onkeydown = trapFocus;
  $('cartBack').onclick = function () { if (state.step > 1) goStep(state.step - 1); };
  $('ckSteps').addEventListener('click', function (e) { var li = e.target.closest('li[data-go]'); if (li && Number(li.dataset.go) < state.step) goStep(Number(li.dataset.go)); });
  $('cartReview').addEventListener('click', function (e) { var b = e.target.closest('[data-go-step]'); if (b) goStep(Number(b.dataset.goStep)); });
  drawer.querySelectorAll('[name="payment"]').forEach(function (r) { r.onchange = function () { $('errPayment').textContent = ''; $('cartPay').removeAttribute('aria-invalid'); renderStep(); if (r.value === 'Dinheiro' && !$('cartNoChange').checked) $('cartChange').focus(); }; });
  $('cartNoChange').onchange = function () { $('errChange').textContent = ''; $('cartChange').removeAttribute('aria-invalid'); if (this.checked) $('cartChange').value = ''; renderStep(); };
  [['cartName', 'errName'], ['cartStreet', 'errStreet'], ['cartDistrict', 'errDistrict'], ['cartChange', 'errChange']].forEach(function (x) {
    $(x[0]).addEventListener('input', function () { $(x[1]).textContent = ''; $(x[0]).removeAttribute('aria-invalid'); });
  });
  (function restoreCustomer() {
    try {
      var c = JSON.parse(readStorage('pedeai-customer') || 'null');
      if (!c) return;
      $('cartName').value = c.name || '';
      $('cartStreet').value = c.street || c.address || '';
      $('cartDistrict').value = c.district || '';
      $('cartRef').value = c.reference || '';
      var r = c.payment && drawer.querySelector('[name="payment"][value="' + c.payment + '"]'); if (r) r.checked = true;
    } catch (e) { /* ignora */ }
  })();

  /* Esc fecha a camada mais alta: detalhe do produto, sacola e, por fim, a página. */
  function handleEscape() {
    if ($('spSheet') && $('spSheet').classList.contains('open')) { closeSheet(true); return true; }
    if (drawer.classList.contains('open')) { closeCart(); return true; }
    return false;
  }

  /* Página aberta: o status do horário acompanha o relógio (abre/fecha/pausa) sem refazer a página. */
  setInterval(function () {
    var s = state.store, el = page.classList.contains('open') && !document.hidden && page.querySelector('[data-sp-status]');
    if (!el || !s) return;
    var st = S.status(s.schedule), detail = page.querySelector('[data-sp-detail]');
    el.className = 'sp-open is-' + st.state;
    el.lastChild.textContent = st.label || '';
    if (detail) detail.textContent = st.detail || '';
  }, 60000);

  window.PedeAiStore = {
    open: open, close: close, handleEscape: handleEscape, handlePop: handlePop,
    currentId: function () { return page.classList.contains('open') && state.store ? state.store.id : null; },
    isOpen: function () { return page.classList.contains('open'); },
    onBack: function () { /* substituído por app.js */ }
  };
})();
