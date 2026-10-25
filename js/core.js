/* PedeAi core — lógica pura (sem DOM), usada pelo navegador e pelos testes Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PedeAiCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CITIES = ['Vila Rica', 'São Félix do Araguaia', 'Querência', 'Ribeirão Cascalheira', 'Canarana', 'Água Boa', 'Novo São Joaquim', 'Campinápolis', 'Nova Xavantina', 'Barra do Garças'];
  var CATEGORIES = ['Hambúrguer', 'Pizza', 'Sushi', 'Açaí', 'Brasileira', 'Pastel', 'Churrasco', 'Doces', 'Saudável', 'Café'];
  var MAX_QTY = 99;

  function normalize(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function slugify(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Valores monetários são sempre inteiros em centavos para evitar erros de ponto flutuante. */
  function toCents(reais) {
    if (typeof reais === 'number') return Math.round(reais * 100);
    var s = String(reais).replace(/[^\d,.-]/g, '');
    if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
    var n = Number(s);
    if (!isFinite(n)) throw new Error('Preço inválido: ' + reais);
    return Math.round(n * 100);
  }

  function formatBRL(cents) {
    var negative = cents < 0, abs = Math.abs(Math.round(cents));
    var int = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var dec = String(abs % 100).padStart(2, '0');
    return (negative ? '-' : '') + 'R$ ' + int + ',' + dec;
  }

  /* WhatsApp brasileiro: 55 + DDD (2) + 8/9 dígitos. Celulares têm 9 dígitos começando por 9. */
  function isValidWhatsApp(number) {
    return /^55[1-9]\d9\d{8}$/.test(String(number || ''));
  }

  function formatPhone(number) {
    var m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(String(number || ''));
    return m ? '(' + m[1] + ') ' + m[2] + '-' + m[3] : String(number || '');
  }

  function canOrder(store) {
    return !!(store && store.whatsapp && isValidWhatsApp(store.whatsapp) && store.whatsappSource && store.menu && store.menu.length);
  }

  function filterStores(stores, opts) {
    opts = opts || {};
    var q = normalize(opts.query);
    return stores.filter(function (s) {
      if (opts.city && s.city !== opts.city) return false;
      if (opts.category && opts.category !== 'Todos' && s.category !== opts.category) return false;
      if (!q) return true;
      var hay = [s.name, s.kind, s.category, s.neighborhood || ''].concat((s.menu || []).map(function (m) { return m.name + ' ' + (m.description || ''); })).join(' ');
      return normalize(hay).indexOf(q) > -1;
    });
  }

  function countByCity(stores) {
    var out = {};
    CITIES.forEach(function (c) { out[c] = 0; });
    stores.forEach(function (s) { out[s.city] = (out[s.city] || 0) + 1; });
    return out;
  }

  /* ---------- Carrinho (um carrinho por estabelecimento, pois o pedido vai para um único WhatsApp) ---------- */
  function emptyCart(storeId) { return { storeId: storeId, lines: [] }; }

  function findItem(store, itemId) {
    return (store.menu || []).find(function (m) { return m.id === itemId; }) || null;
  }

  function addItem(cart, store, itemId, qty) {
    qty = qty == null ? 1 : qty;
    if (cart.storeId !== store.id) throw new Error('Carrinho pertence a outro estabelecimento');
    var item = findItem(store, itemId);
    if (!item) throw new Error('Item inexistente: ' + itemId);
    if (!Number.isInteger(item.priceCents) || item.priceCents < 0) throw new Error('Item sem preço válido: ' + itemId);
    var lines = cart.lines.map(function (l) { return Object.assign({}, l); });
    var line = lines.find(function (l) { return l.itemId === itemId; });
    if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
    else lines.push({ itemId: itemId, name: item.name, unitCents: item.priceCents, qty: Math.min(MAX_QTY, qty) });
    return { storeId: cart.storeId, lines: lines.filter(function (l) { return l.qty > 0; }) };
  }

  function setQty(cart, itemId, qty) {
    var q = Math.max(0, Math.min(MAX_QTY, Math.floor(Number(qty) || 0)));
    return {
      storeId: cart.storeId,
      lines: cart.lines.map(function (l) { return l.itemId === itemId ? Object.assign({}, l, { qty: q }) : l; }).filter(function (l) { return l.qty > 0; })
    };
  }

  /* Reaplica preços atuais do cardápio e remove itens que não existem mais (carrinho salvo antigo). */
  function reconcileCart(cart, store) {
    if (!cart || cart.storeId !== store.id || !Array.isArray(cart.lines)) return emptyCart(store.id);
    var lines = [];
    cart.lines.forEach(function (l) {
      var item = findItem(store, l.itemId), qty = Math.floor(Number(l.qty));
      if (item && Number.isInteger(item.priceCents) && qty > 0) lines.push({ itemId: item.id, name: item.name, unitCents: item.priceCents, qty: Math.min(MAX_QTY, qty) });
    });
    return { storeId: store.id, lines: lines };
  }

  function cartCount(cart) {
    return cart.lines.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function cartTotals(cart, store, mode) {
    var subtotal = cart.lines.reduce(function (sum, l) { return sum + l.unitCents * l.qty; }, 0);
    var feeKnown = mode === 'retirada' || (store && Number.isInteger(store.deliveryFeeCents));
    var fee = mode === 'retirada' ? 0 : (feeKnown ? store.deliveryFeeCents : 0);
    return { subtotal: subtotal, fee: fee, feeKnown: feeKnown, total: subtotal + fee };
  }

  function buildOrderMessage(store, cart, details) {
    details = details || {};
    var mode = details.mode === 'retirada' ? 'retirada' : 'entrega';
    var t = cartTotals(cart, store, mode);
    var out = ['Olá, ' + store.name + '! Gostaria de fazer um pedido pelo PedeAi Delivery:', ''];
    cart.lines.forEach(function (l) {
      out.push(l.qty + 'x ' + l.name + ' — ' + formatBRL(l.unitCents * l.qty));
    });
    out.push('');
    out.push('Subtotal: ' + formatBRL(t.subtotal));
    if (mode === 'entrega') {
      out.push(t.feeKnown ? 'Taxa de entrega: ' + formatBRL(t.fee) : 'Taxa de entrega: a confirmar');
      out.push((t.feeKnown ? 'Total: ' : 'Total (sem taxa de entrega): ') + formatBRL(t.total));
    } else {
      out.push('Total: ' + formatBRL(t.total));
    }
    out.push('');
    out.push(mode === 'retirada' ? 'Forma de recebimento: retirada no local' : 'Forma de recebimento: entrega');
    if (details.name) out.push('Nome: ' + details.name.trim());
    if (mode === 'entrega' && details.address) out.push('Endereço: ' + details.address.trim());
    if (details.payment) out.push('Pagamento: ' + details.payment + (details.payment === 'Dinheiro' && details.change ? ' (troco para ' + details.change.trim() + ')' : ''));
    if (details.notes) out.push('Observações: ' + details.notes.trim());
    out.push('');
    out.push('Valores conforme o cardápio publicado; aguardo a confirmação de preços e disponibilidade.');
    return out.join('\n');
  }

  function whatsappUrl(number, message) {
    if (!isValidWhatsApp(number)) throw new Error('WhatsApp inválido');
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
  }

  /* Rotas por hash: #/loja/<id> abre a página do estabelecimento. */
  function parseRoute(hash) {
    var m = /^#\/loja\/([a-z0-9-]+)\/?$/.exec(String(hash || ''));
    return m ? { name: 'store', id: m[1] } : { name: 'home' };
  }

  return {
    CITIES: CITIES, CATEGORIES: CATEGORIES, MAX_QTY: MAX_QTY,
    normalize: normalize, slugify: slugify, escapeHtml: escapeHtml,
    toCents: toCents, formatBRL: formatBRL, isValidWhatsApp: isValidWhatsApp, formatPhone: formatPhone,
    canOrder: canOrder, filterStores: filterStores, countByCity: countByCity,
    emptyCart: emptyCart, addItem: addItem, setQty: setQty, reconcileCart: reconcileCart,
    cartCount: cartCount, cartTotals: cartTotals, buildOrderMessage: buildOrderMessage,
    whatsappUrl: whatsappUrl, parseRoute: parseRoute
  };
});
