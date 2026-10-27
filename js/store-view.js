/* PedeAi — templates da página do estabelecimento. Funções puras (dados -> HTML), sem DOM nem estado:
   rodam no navegador (window.PedeAiStoreView) e no Node (testes em tests/store-view.test.js).
   Todo texto vindo do cadastro passa por escapeHtml. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.PedeAiStoreView = factory(root.PedeAiCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  var esc = C.escapeHtml;

  function icon(path, cls) { return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  var I = {
    back: '<path d="m15 18-6-6 6-6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>', share: '<path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5Z"/>', link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="m5 12 5 5 9-10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>', bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>', dish: '<path d="M3 17h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 8V6"/><path d="M10 6h4"/>',
    route: '<path d="M3 11 21 3l-8 18-2-8-8-2Z"/>'
  };

  var PARTNER_WA = '5512936290045';

  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return String(url); } }
  function formatDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : String(iso || ''); }
  function hasPricedOptions(item) { return (item.options || []).some(function (g) { return g.choices.some(function (c) { return c.priceCents > 0; }); }); }

  /* "Pizzaria e lanchonete em Barra do Garças" (sem anotações entre parênteses do cadastro). */
  function lede(s) {
    var kind = String(s.kind || s.category).replace(/\s*\(.*?\)\s*$/, '');
    return kind.charAt(0).toUpperCase() + kind.slice(1) + ' em ' + s.city;
  }

  function initials(name) {
    var words = String(name).split(/\s+/).filter(function (w) { return /^[\p{L}\p{N}]/u.test(w) && (w.length > 2 || /^\p{Lu}/u.test(w)); });
    return (words.slice(0, 2).map(function (w) { return w[0]; }).join('') || String(name).charAt(0)).toUpperCase();
  }

  function mapsUrl(s) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.name + ', ' + (s.address ? s.address + ', ' : '') + s.city + ' - MT');
  }

  /* Primeiro intervalo de horário legível do texto livre ("18h às 23h, fechado às quartas" -> "18h–23h"). */
  function shortHours(text) {
    /* Aceita "18h às 23h", "17h45-23h15" e "09:00 às 22:00". */
    var t = '(\\d{1,2})\\s*(?:h\\s*(\\d{2})?|:(\\d{2}))';
    var m = new RegExp(t + '\\s*(?:às|as|a|-|–|até)\\s*' + t, 'i').exec(String(text || ''));
    if (!m) return null;
    var fmt = function (h, min) { return Number(h) + 'h' + (min && min !== '00' ? min : ''); };
    return fmt(m[1], m[2] || m[3]) + '–' + fmt(m[4], m[5] || m[6]);
  }

  function isPhoto(s) { return !!(s.image && s.image.kind !== 'logo'); }

  /* ---------- Cabeçalho da plataforma ---------- */
  function topHtml(s) {
    return '<header class="sp-top"><div class="sp-top-inner">' +
      '<button class="sp-icon-btn store-back" type="button" data-store-close aria-label="Voltar">' + icon(I.back) + '</button>' +
      '<a class="sp-brand" href="#" data-home aria-label="PedeAi Delivery, ir para o início"><span class="sp-brand-row"><span class="logo-box"><img src="assets/media-778d926eb50d.png" alt=""></span><span class="sp-brand-name" translate="no">PedeAi</span></span><span class="sp-brand-tag">A plataforma de delivery do interior</span></a>' +
      '<div class="sp-top-end"><span class="sp-top-city">' + icon(I.pin) + esc(s.city) + '</span>' +
      '<button class="sp-icon-btn" type="button" data-share aria-label="Compartilhar ' + esc(s.name) + '">' + icon(I.share) + '</button></div>' +
      '</div></header>';
  }

  /* ---------- Capa ---------- */
  function badgeTile(s) {
    if (s.image && s.image.kind === 'logo') return '<span class="sp-tile sp-tile--logo"><img src="' + esc(s.image.thumb || s.image.src) + '" alt="" width="120" height="80" decoding="async"></span>';
    return '<span class="sp-tile" aria-hidden="true">' + esc(initials(s.name)) + '</span>';
  }

  /* Cada aparelho baixa só o tamanho de que precisa (480/960/1600 px). */
  function coverSrcset(img) {
    if (!img.width) return '';
    var set = [];
    if (img.thumb) set.push(esc(img.thumb) + ' 480w');
    if (img.medium) set.push(esc(img.medium) + ' 960w');
    set.push(esc(img.src) + ' ' + img.width + 'w');
    return set.length > 1 ? ' srcset="' + set.join(', ') + '" sizes="(min-width: 1228px) 1180px, (min-width: 760px) calc(100vw - 48px), 100vw"' : '';
  }

  function coverHtml(s) {
    var photo = isPhoto(s);
    var lowRes = photo && s.image.thumb ? ' style="background-image:url(\'' + esc(s.image.thumb) + '\')"' : '';
    return '<section class="sp-cover' + (photo ? ' sp-cover--photo' : ' sp-cover--brand sp-hero--empty') + '" aria-labelledby="storeName"' + lowRes + '>' +
      (photo ? '<img class="sp-cover-img" src="' + esc(s.image.src) + '"' + coverSrcset(s.image) + ' alt="' + esc(s.image.alt || s.name) + '" width="' + (s.image.width || 960) + '" height="' + (s.image.height || 640) + '" fetchpriority="high" decoding="async">' : '<span class="sp-cover-mark" aria-hidden="true"></span>') +
      '<div class="sp-cover-body">' + badgeTile(s) + '<div class="sp-cover-text"><h1 id="storeName" class="sp-name">' + esc(s.name) + '</h1><p class="sp-lede">' + esc(lede(s)) + '</p></div></div>' +
      (photo && s.image.credit ? '<span class="sp-credit">Foto: ' + esc(s.image.credit) + '</span>' : '') + '</section>';
  }

  /* ---------- Indicadores e informações ---------- */
  function stats(s) {
    var order = C.canOrder(s) ? ['Online', 'pedido pelo WhatsApp'] : s.whatsapp ? ['WhatsApp', 'pedido direto'] : s.phone ? ['Telefone', 'pedido por ligação'] : ['Em breve', 'pedido online'];
    var menu = s.menu.length ? [s.menu.length + (s.menu.length === 1 ? ' item' : ' itens'), 'no cardápio'] : ['Em breve', 'cardápio'];
    var hours = s.hours ? [shortHours(s.hours) || 'Ver abaixo', 'horário'] : ['A confirmar', 'horário'];
    var place = s.neighborhood && s.neighborhood.length <= 22 ? [s.neighborhood, 'bairro'] : [s.city, 'cidade'];
    return '<dl class="sp-stats">' + [order, menu, hours, place].map(function (p) {
      return '<div><dt>' + esc(p[1]) + '</dt><dd>' + esc(p[0]) + '</dd></div>';
    }).join('') + '</dl>';
  }

  function actionsHtml(s) {
    var a = [];
    if (s.whatsapp) a.push('<a class="sp-btn sp-btn--wa" href="' + esc(C.whatsappUrl(s.whatsapp, 'Olá, ' + s.name + '! Encontrei vocês no PedeAi Delivery.')) + '" target="_blank" rel="noopener">' + icon(I.chat) + 'Falar no WhatsApp</a>');
    if (s.phone) a.push('<a class="sp-btn" href="tel:+' + esc(s.phone) + '">' + icon(I.phone) + 'Ligar</a>');
    if (s.orderUrl) a.push('<a class="sp-btn" href="' + esc(s.orderUrl) + '" target="_blank" rel="noopener">' + icon(I.menu) + 'Cardápio online</a>');
    if (s.instagram) a.push('<a class="sp-btn" href="https://www.instagram.com/' + encodeURIComponent(s.instagram) + '/" target="_blank" rel="noopener">' + icon(I.link) + 'Instagram</a>');
    if (s.website) a.push('<a class="sp-btn" href="' + esc(s.website) + '" target="_blank" rel="noopener">' + icon(I.link) + 'Site</a>');
    return a.length ? '<div class="sp-actions">' + a.join('') + '</div>' : '';
  }

  function infoHtml(s) {
    var hoursLong = s.hours && (!shortHours(s.hours) || s.hours.length > 16);
    return '<section class="sp-card sp-info" aria-label="Informações do estabelecimento">' + stats(s) +
      '<div class="sp-where">' + icon(I.pin) + '<p><strong>' + (s.address ? esc(s.address) : 'Endereço a confirmar') + '</strong><span>' + esc(s.city) + ', MT</span></p>' +
      '<a class="sp-maplink" href="' + esc(mapsUrl(s)) + '" target="_blank" rel="noopener">' + icon(I.route) + 'Como chegar</a></div>' +
      (hoursLong ? '<p class="sp-hours">' + icon(I.clock) + '<span>' + esc(s.hours) + '</span></p>' : '') +
      actionsHtml(s) +
      (s.confidence === 'baixa' ? '<p class="sp-notice store-warning">' + icon(I.info) + '<span>Cadastro em verificação. Os dados vêm de fontes públicas e ainda não foram confirmados pelo estabelecimento.</span></p>' : '') +
      '</section>';
  }

  /* ---------- Assinatura: como o pedido chega ao restaurante ---------- */
  function howHtml(s) {
    var steps;
    if (s.menu.length && C.canOrder(s)) {
      steps = [['Escolha', 'Monte seu pedido no cardápio, com as opções que quiser.'], ['Confira', 'Veja itens, observações e o subtotal antes de enviar.'], ['Envie', 'O pedido chega pronto no WhatsApp de ' + s.name + '.']];
    } else if (s.whatsapp) {
      steps = [['Chame', 'Toque em Falar no WhatsApp para abrir a conversa.'], ['Combine', 'Escolha os itens e a forma de pagamento com ' + s.name + '.'], ['Receba', 'Entrega em casa ou retirada no local, como preferir.']];
    } else return '';
    return '<section class="sp-how" aria-labelledby="spHowTitle"><div class="sp-how-text"><h2 id="spHowTitle">Do cardápio ao WhatsApp, sem baixar nada</h2>' +
      '<ol>' + steps.map(function (st, i) { return '<li><b>' + (i + 1) + '</b><span><strong>' + esc(st[0]) + '</strong>' + esc(st[1]) + '</span></li>'; }).join('') + '</ol></div>' +
      '<img class="sp-how-art" src="assets/pedeai-courier-3d-v2.webp" alt="" width="320" height="298" loading="lazy" decoding="async"></section>';
  }

  function summaryHtml(s) {
    return s.menu.length ? '<section class="sp-card sp-summary" aria-labelledby="spSummaryTitle"><h2 id="spSummaryTitle">Seu pedido</h2><div id="spSummary"></div></section>' : '';
  }

  function summaryBodyHtml(cart, store, mode) {
    if (!cart.lines.length) return '<p class="sp-summary-empty">' + icon(I.bag) + '<span>Seu pedido está vazio. Toque em + nos itens do cardápio para começar.</span></p>';
    var t = C.cartTotals(cart, store, mode);
    return '<ul class="sp-summary-lines">' + cart.lines.map(function (l) {
      return '<li><span><b>' + l.qty + '×</b> ' + esc(l.name) + '</span><span>' + C.formatBRL(l.unitCents * l.qty) + '</span></li>';
    }).join('') + '</ul><p class="sp-summary-total"><span>Subtotal</span><strong>' + C.formatBRL(t.subtotal) + '</strong></p>' +
      '<button class="sp-btn sp-btn--cta" type="button" data-summary-open>Ver pedido</button>';
  }

  /* ---------- Cardápio ---------- */
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
      var actions = (s.whatsapp ? '<a class="sp-btn sp-btn--wa" href="' + esc(C.whatsappUrl(s.whatsapp, 'Olá, ' + s.name + '! Encontrei vocês no PedeAi Delivery e gostaria de fazer um pedido.')) + '" target="_blank" rel="noopener">' + icon(I.chat) + 'Pedir pelo WhatsApp</a>' : '') +
        (s.orderUrl ? '<a class="sp-btn" href="' + esc(s.orderUrl) + '" target="_blank" rel="noopener">' + icon(I.menu) + 'Ver cardápio online</a>' : '');
      return '<section class="sp-menu" aria-labelledby="storeMenuTitle"><div class="sp-menu-head"><h2 id="storeMenuTitle">Cardápio</h2></div>' +
        '<div class="sp-empty menu-pending"><h3>Cardápio em preparação</h3><p>Ainda não temos os preços confirmados de ' + esc(s.name) + '.' +
        (s.whatsapp ? ' Enquanto isso, faça seu pedido direto pelo WhatsApp.' : s.orderUrl ? ' Consulte o cardápio online oficial.' : ' Assim que o estabelecimento confirmar, o pedido online é liberado aqui.') + '</p>' +
        (actions ? '<div class="sp-empty-actions">' + actions + '</div>' : '') + '</div></section>';
    }
    var secs = sectionsOf(s.menu), many = s.menu.length >= 12;
    return '<section class="sp-menu' + (many ? ' sp-menu--long' : '') + '" aria-labelledby="storeMenuTitle">' +
      '<div class="sp-menu-head"><h2 id="storeMenuTitle">Cardápio</h2><p class="sp-source">Preços de <a href="' + esc(s.menuSource) + '" target="_blank" rel="noopener">' + esc(hostOf(s.menuSource)) + '</a>, consultados em ' + esc(formatDate(s.verifiedAt)) + '. O estabelecimento confirma valores e disponibilidade.</p></div>' +
      (secs.length > 1 || many ? '<div class="sp-sticky">' +
        (secs.length > 1 ? '<nav class="sp-cats" aria-label="Categorias do cardápio"><div class="sp-cats-track">' + secs.map(function (sec, i) {
          return '<a class="sp-cat" href="#sp-sec-' + i + '" data-sec="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + esc(sec.name) + '</a>';
        }).join('') + '<span class="sp-cats-ink" aria-hidden="true"></span></div></nav>' : '') +
        (many ? '<label class="sp-search">' + icon(I.search) + '<span class="sr-only">Buscar no cardápio</span><input type="search" id="spSearch" placeholder="Buscar no cardápio…" autocomplete="off" enterkeyhint="search"></label>' : '') +
        '</div>' : '') +
      secs.map(function (sec, i) {
        return '<section class="sp-section" id="sp-sec-' + i + '" data-sec="' + i + '" aria-labelledby="sp-sec-t-' + i + '"><h3 class="sp-section-title" id="sp-sec-t-' + i + '">' + esc(sec.name) + ' <small>' + sec.items.length + (sec.items.length === 1 ? ' item' : ' itens') + '</small></h3><ul class="sp-items" role="list">' + sec.items.map(itemHtml).join('') + '</ul></section>';
      }).join('') +
      '<p class="sp-noresult" id="spNoResult" hidden>Nenhum item encontrado no cardápio.</p></section>';
  }

  function aboutHtml(s) {
    return '<details class="sp-about store-sources"><summary>Sobre este cadastro</summary><p>Informações verificadas em ' + esc(formatDate(s.verifiedAt)) + ' a partir de fontes públicas. Alguma informação errada? <a href="https://wa.me/' + PARTNER_WA + '?text=' + encodeURIComponent('Olá! Quero corrigir as informações de ' + s.name + ' (' + s.city + ') no PedeAi.') + '" target="_blank" rel="noopener">Avise a equipe</a>.</p><ul>' + s.sources.map(function (u) { return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + esc(hostOf(u)) + '</a></li>'; }).join('') + '</ul></details>';
  }

  /* Página inteira (sem o rodapé, que é clonado da home pelo controlador). */
  function pageHtml(s) {
    return '<div class="sp-scroll" id="storeScroll">' + topHtml(s) +
      '<div class="sp-page">' + coverHtml(s) +
      '<div class="sp-layout"><aside class="sp-aside">' + infoHtml(s) + summaryHtml(s) + '</aside>' +
      /* Com cardápio, quem chega quer pedir: o cardápio vem primeiro. Sem cardápio, o WhatsApp é a ação principal. */
      '<div class="sp-main">' + (s.menu.length ? menuHtml(s) + howHtml(s) : howHtml(s) + menuHtml(s)) + aboutHtml(s) + '</div></div></div><div id="spFooter"></div></div>' +
      (s.menu.length ? '<button class="sp-cartbar" id="cartBar" type="button" hidden aria-haspopup="dialog"></button>' : '') +
      '<p class="sr-only" id="spLive" aria-live="polite"></p><div class="sp-sheet" id="spSheet" aria-hidden="true"></div>';
  }

  /* Dados estruturados (schema.org/Restaurant) para buscadores e pré-visualizações. */
  function jsonLd(s, baseUrl) {
    var abs = function (p) { try { return new URL(p, baseUrl).href; } catch (e) { return p; } };
    var data = {
      '@context': 'https://schema.org', '@type': 'Restaurant', name: s.name, servesCuisine: s.category,
      url: abs('#/loja/' + s.id),
      address: { '@type': 'PostalAddress', addressLocality: s.city, addressRegion: 'MT', addressCountry: 'BR' }
    };
    if (s.address) data.address.streetAddress = s.address;
    if (s.image) data.image = abs(s.image.src);
    if (s.whatsapp || s.phone) data.telephone = '+' + (s.whatsapp || s.phone);
    var same = [];
    if (s.instagram) same.push('https://www.instagram.com/' + s.instagram + '/');
    if (s.website) same.push(s.website);
    if (same.length) data.sameAs = same;
    /* "<" escapado para o JSON nunca fechar a tag <script> em que é inserido. */
    return JSON.stringify(data).replace(/</g, '\\u003c');
  }

  return {
    icon: icon, I: I, hostOf: hostOf, formatDate: formatDate, hasPricedOptions: hasPricedOptions,
    lede: lede, initials: initials, mapsUrl: mapsUrl, shortHours: shortHours, isPhoto: isPhoto,
    topHtml: topHtml, coverHtml: coverHtml, infoHtml: infoHtml, howHtml: howHtml, summaryHtml: summaryHtml,
    summaryBodyHtml: summaryBodyHtml, sectionsOf: sectionsOf, priceLabel: priceLabel, itemHtml: itemHtml,
    menuHtml: menuHtml, aboutHtml: aboutHtml, pageHtml: pageHtml, jsonLd: jsonLd
  };
});
