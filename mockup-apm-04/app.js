// APM ordering prototype: local state, string templates, delegated events.
(function () {
  'use strict';

  const D = window.APM_DATA;
  const A = window.APM_ART;
  const P = window.APM_PROOF;
  const esc = P.esc;
  const $app = document.getElementById('app');

  const CONFIG_KEYS = ['flyers', 'brochures', 'postcards'];
  const STEPS = [
    { id: 'products', label: 'Product' },
    { id: 'design', label: 'Design' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'review', label: 'Review' },
  ];
  const PRINT = { flyers: 0.3, brochures: 0.36, postcards: 0.28 };
  const POSTAGE = { standard: 0.18, first: 0.32 };
  const SHIP_FEE = 8;
  const SAMPLE_FEE = 1;
  const PDF_FEE = 5;
  const MIN_QTY = 25;
  const MAX_QTY = 2500;
  const TODAY = 'Oct 31, 2026';

  const r2 = (n) => Math.round(n * 100) / 100;
  const money = (n) => '$' + r2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const plural = (n, one, many = one + 's') => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
  const fid = (path) => 'f-' + path.replace(/\./g, '-');

  // ---------- icons ----------
  const ICONS = {
    check: 'M5 12.5l4.2 4.2L19 7',
    mail: 'M3.5 6.5h17v11h-17z M3.5 7l8.5 6 8.5-6',
    truck: 'M2.5 7h11v9h-11z M13.5 10h4l3 3.2V16h-7 M8 17.5a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0z M18.6 17.5a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0z',
    store: 'M4.5 10.5V20h15v-9.5 M3.5 7l2-3.5h13l2 3.5v1.2a2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.8 0z M10 20v-5h4v5',
    download: 'M12 4v11 M7 10.5l5 5 5-5 M5 20h14',
    plus: 'M12 5v14 M5 12h14',
    chevDown: 'M6 9l6 6 6-6',
    chevRight: 'M9 6l6 6-6 6',
    close: 'M6 6l12 12 M18 6L6 18',
    back: 'M15 6l-6 6 6 6',
    alert: 'M12 3.5l9.5 16.5h-19z M12 10v4.5 M12 17.3v.2',
    pin: 'M12 21s-6.5-6-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z M14.2 9.8a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0z',
    edit: 'M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4',
    layers: 'M12 3.5l9 5-9 5-9-5z M3 13l9 5 9-5',
    qr: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2.5v2.5H14z M17.5 17.5H20V20h-2.5z',
    text: 'M5 6h14 M12 6v13 M4 20h4 M16 20h4',
    upload: 'M12 16V5 M7 9.5l5-5 5 5 M5 20h14',
    radius: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M12 12l5.5-3.5',
    street: 'M8 3l-3 18 M16 3l3 18 M12 4v3 M12 10.5v3 M12 17v3',
    people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18 14.8c2 .7 3.2 2.5 3.5 5.2',
    sync: 'M4 12a8 8 0 0 1 14-5.3L20 8.5 M20 4v4.5h-4.5 M20 12a8 8 0 0 1-14 5.3L4 15.5 M4 20v-4.5h4.5',
    card: 'M3 6h18v12H3z M3 10h18 M6.5 14.5h4',
    building: 'M5 21V4h10v17 M15 9h4v12 M3 21h18 M8 7.5h1 M11 7.5h1 M8 11h1 M11 11h1 M8 14.5h1 M11 14.5h1',
    split: 'M6 4v6l6 4 6-4V4 M12 14v6',
    tag: 'M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z M8 8.5h.2',
    image: 'M3.5 5h17v14h-17z M3.5 16l5-5 4 4 3-3 5 5',
    phone: 'M7 2.5h10v19H7z M11 18.5h2',
    megaphone: 'M3.5 10v4h3l6 4V6l-6 4z M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11',
    lock: 'M6 11h12v9.5H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 7.8v.2',
  };
  const ic = (name, cls = '') =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ---------- state ----------
  const S = {
    step: 'products',
    maxStep: 0,
    listingId: 'willow',
    listingMenu: false,
    selected: [],
    cur: 0,
    products: {},
    defaults: {},
    lists: D.lists.map((l) => ({ ...l })),
    cards: D.cards.map((c) => ({ ...c })),
    drawer: null,
    listsView: 'pick',
    editingList: null,
    radius: null,
    breakdownOpen: false,
    attempt: {},
    focusAfter: null,
    toast: null,
    orderNo: null,
    review: newReview(),
  };

  function newReview() {
    return {
      promoOpen: false,
      promoInput: '',
      promoApplied: false,
      promoError: '',
      storeOn: true,
      adOn: true,
      adAmount: D.credits.ad.suggested,
      payOpen: false,
      pay: 'corp',
      costCenter: D.corp.costCenters[0],
      comment: '',
      splitA: 'visa',
      splitB: 'amex',
      splitAmt: '',
      addCard: { name: '', number: '', exp: '', zip: '' },
      addCardTried: false,
      ack: false,
    };
  }

  const listing = () => D.listings.find((l) => l.id === S.listingId);
  const productInfo = (k) => D.products.find((p) => p.key === k);
  const configKeys = () => CONFIG_KEYS.filter((k) => S.selected.includes(k));
  const extraKeys = () => S.selected.filter((k) => !CONFIG_KEYS.includes(k));
  const curKey = () => configKeys()[S.cur];
  const cur = () => S.products[curKey()];
  const stepIndex = (id = S.step) => STEPS.findIndex((s) => s.id === id);
  const listById = (id) => S.lists.find((l) => l.id === id);
  const paperById = (id) => D.papers.find((p) => p.id === id);

  function defaultEdits(L) {
    return { headline: L.headline, desc: L.desc, hero: 0 };
  }

  function makeProduct(key) {
    const L = listing();
    return {
      key,
      template: S.defaults[key] || (key === 'brochures' ? 'heritage' : 'willow'),
      side: D.productSpecs[key].sides[0],
      approved: false,
      changed: false,
      savedAt: null,
      deliveryVisited: false,
      edits: defaultEdits(L),
      qr:
        key === 'flyers'
          ? { status: 'draft', url: '', draft: 'cedarrealty.example/listings/128 willow lane', override: false, tried: false }
          : { status: 'none', url: '', draft: '', override: false, tried: false },
      delivery: {
        method: key === 'flyers' ? 'ship' : 'mail',
        qty: 100,
        paper: '80gloss',
        pdf: false,
        optionsOpen: false,
        lists: [],
        cls: 'standard',
        sample: true,
        sampleAddr: { ...D.officeAddress, zip: '' },
        shipAddr: { ...D.officeAddress },
        shipEdit: false,
        pickup: 'p1',
        format: 'pdf',
      },
    };
  }

  // ---------- pricing ----------
  const recipients = (d) => d.lists.reduce((n, id) => n + (listById(id)?.count || 0), 0);

  function unitPrint(key) {
    const d = S.products[key].delivery;
    return r2(PRINT[key] + (paperById(d.paper)?.add || 0));
  }

  function price(key) {
    const p = S.products[key];
    const d = p.delivery;
    const unit = unitPrint(key);
    const unitName = D.productSpecs[key].unitName;
    const lines = [];
    let pieces = 0;
    const qty = Number(d.qty) || 0;

    if (d.method === 'mail') {
      const r = recipients(d);
      const each = r2(unit + POSTAGE[d.cls]);
      if (r) lines.push({ label: `${plural(r, 'recipient')} × ${money(each)}`, note: 'Printing and postage', amt: r2(r * each) });
      pieces = r;
      if (d.sample) {
        lines.push({ label: 'Sample copy to agent', note: 'Printed with the batch', amt: SAMPLE_FEE });
        pieces += 1;
      }
    } else if (d.method === 'ship') {
      if (qty) lines.push({ label: `${plural(qty, unitName)} × ${money(unit)}`, note: 'Printing', amt: r2(qty * unit) });
      lines.push({ label: 'Shipping', note: 'Ground, one box', amt: SHIP_FEE });
      pieces = qty;
    } else if (d.method === 'pickup') {
      if (qty) lines.push({ label: `${plural(qty, unitName)} × ${money(unit)}`, note: 'Printing', amt: r2(qty * unit) });
      pieces = qty;
    } else {
      lines.push({ label: `${d.format.toUpperCase()} file`, note: 'Digital download', amt: 0 });
    }
    if (d.pdf && d.method !== 'download') lines.push({ label: 'Print-ready PDF copy', note: 'Optional add-on', amt: PDF_FEE });
    const total = r2(lines.reduce((s, l) => s + l.amt, 0));
    return { lines, total, pieces, unit };
  }

  function totals() {
    const sub = r2(configKeys().reduce((s, k) => s + price(k).total, 0));
    const tax = r2(sub * D.taxRate);
    const gross = r2(sub + tax);
    const R = S.review;
    const credits = [];
    let left = gross;
    const take = (id, label, want) => {
      const amt = r2(Math.max(0, Math.min(want, left)));
      if (amt > 0) {
        credits.push({ id, label, amt });
        left = r2(left - amt);
      }
    };
    if (R.promoApplied) take('promo', `Promo ${D.credits.promo.code}`, D.credits.promo.amount);
    if (R.storeOn) take('store', 'Store credit', D.credits.store.balance);
    if (R.adOn) take('ad', 'Ad budget', Math.min(Number(R.adAmount) || 0, D.credits.ad.balance));
    const creditTotal = r2(credits.reduce((s, c) => s + c.amt, 0));
    return { sub, tax, gross, credits, creditTotal, due: left };
  }

  // ---------- validation ----------
  function checkUrl(raw) {
    const u = String(raw || '').trim();
    if (!u) return { state: 'empty', msg: 'Enter the page this QR code should open, or remove the QR code.' };
    if (/\s/.test(u)) {
      return {
        state: 'invalid',
        msg: 'Links can’t contain spaces.',
        suggestion: u.replace(/\s+/g, '-'),
      };
    }
    const withProto = /^https?:\/\//i.test(u) ? u : 'https://' + u;
    try {
      const x = new URL(withProto);
      if (!/\.[a-z]{2,}$/i.test(x.hostname)) {
        return { state: 'invalid', msg: 'This link is missing a domain ending, such as .com.' };
      }
      return { state: 'ok', normalized: withProto };
    } catch (err) {
      return { state: 'invalid', msg: 'This doesn’t look like a complete web address.' };
    }
  }

  function addrMissing(a) {
    const miss = [];
    if (!a.name.trim()) miss.push('name');
    if (!a.street1.trim()) miss.push('street');
    if (!a.city.trim()) miss.push('city');
    if (!/^[A-Za-z]{2}$/.test(a.state.trim())) miss.push('state');
    if (!/^\d{5}$/.test(a.zip.trim())) miss.push('zip');
    return miss;
  }

  function designIssues(key) {
    const p = S.products[key];
    const out = [];
    if (p.qr.status === 'draft') out.push({ text: 'QR code needs a working link', act: 'fixQr', arg: key, fix: 'Fix link' });
    return out;
  }

  function deliveryIssues(key) {
    const d = S.products[key].delivery;
    const out = [];
    const paper = paperById(d.paper);
    if (d.method === 'mail') {
      if (!d.lists.length) out.push({ text: 'Choose who receives these', act: 'openLists', arg: key, fix: 'Choose lists' });
      if (d.sample) {
        const miss = addrMissing(d.sampleAddr);
        if (miss.length) {
          const what = miss.length === 1 ? (miss[0] === 'zip' ? 'a ZIP code' : `a ${miss[0]}`) : 'a few details';
          out.push({ text: `Sample copy address needs ${what}`, act: 'fixSample', arg: key, fix: 'Add address', field: 'sample' });
        }
      }
    }
    if (d.method === 'ship' || d.method === 'pickup') {
      const q = Number(d.qty) || 0;
      if (q < MIN_QTY) out.push({ text: `Order at least ${MIN_QTY} pieces`, act: 'focusQty', arg: key, fix: 'Set quantity', field: 'qty' });
      else if (q > MAX_QTY) out.push({ text: `Online pricing stops at ${MAX_QTY.toLocaleString()} pieces`, act: 'focusQty', arg: key, fix: 'Adjust quantity', field: 'qty' });
      if (d.method === 'ship' && addrMissing(d.shipAddr).length) out.push({ text: 'Shipping address is incomplete', act: 'editShip', arg: key, fix: 'Edit address' });
    }
    if (d.method !== 'download' && paper?.unavailableFor?.includes(key)) {
      out.push({ text: `${paper.name} isn’t available for ${productInfo(key).name.toLowerCase()}`, act: 'openOptions', arg: key, fix: 'Choose paper' });
    }
    return out;
  }

  function productStatus(key) {
    const p = S.products[key];
    if (!p.approved && p.changed) return { tone: 'warn', label: 'Re-approve proof' };
    if (!p.approved) return { tone: p.deliveryVisited ? 'warn' : 'idle', label: p.deliveryVisited ? 'Proof not approved' : 'Not started' };
    if (deliveryIssues(key).length || !p.deliveryVisited) return { tone: 'progress', label: 'Delivery to finish' };
    return { tone: 'ok', label: 'Ready' };
  }

  function reviewIssues() {
    const out = [];
    configKeys().forEach((k, i) => {
      const name = productInfo(k).name;
      if (!S.products[k].approved) out.push({ text: `${name}: proof not approved`, act: 'editProduct', arg: i, fix: 'Review proof' });
      deliveryIssues(k).forEach((x) => out.push({ text: `${name}: ${x.text.charAt(0).toLowerCase()}${x.text.slice(1)}`, act: 'fixDelivery', arg: i, fix: 'Fix' }));
    });
    const R = S.review;
    const t = totals();
    if (R.pay === 'corp' && !R.costCenter) out.push({ text: 'Choose a cost center', act: 'focus', arg: fid('review.costCenter'), fix: 'Choose' });
    if (R.pay === 'split') {
      const a = Number(R.splitAmt);
      if (!(a > 0 && a < t.due)) out.push({ text: `Set how much goes on the first card (less than ${money(t.due)})`, act: 'focus', arg: fid('review.splitAmt'), fix: 'Set amount' });
      if (R.splitA === R.splitB) out.push({ text: 'Choose two different cards to split', act: 'focus', arg: fid('review.splitB'), fix: 'Change' });
    }
    if (R.pay === 'new') out.push({ text: 'Save the new card first', act: 'focus', arg: fid('review.addCard.name'), fix: 'Add card' });
    if (!R.ack) out.push({ text: 'Confirm you’ve reviewed the proofs', act: 'focus', arg: 'f-ack', fix: 'Confirm' });
    return out;
  }

  // ---------- small view helpers ----------
  function field({ bind, label, value, type = 'text', placeholder = '', error = '', hint = '', cls = '', attrs = '', invalid = false }) {
    const id = fid(bind);
    const showErr = error || invalid;
    return `<div class="field ${cls} ${showErr ? 'is-invalid' : ''}">
  ${label ? `<label class="field-label" for="${id}">${label}</label>` : ''}
  <input class="input" id="${id}" type="${type}" data-bind="${bind}" ${type === 'number' ? 'data-type="num" inputmode="numeric"' : ''} value="${esc(value)}" placeholder="${esc(placeholder)}" ${attrs} ${showErr ? `aria-invalid="true"` : ''} ${error ? `aria-describedby="${id}-msg"` : ''}>
  ${error ? `<div class="field-error" id="${id}-msg">${ic('alert')}<span>${error}</span></div>` : hint ? `<div class="field-hint">${hint}</div>` : ''}
</div>`;
  }

  function toggle({ bind, checked, label, sub = '', id = fid(bind) }) {
    return `<label class="toggle" for="${id}">
  <input type="checkbox" role="switch" id="${id}" data-bind="${bind}" ${checked ? 'checked' : ''}>
  <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
  <span class="toggle-text"><span class="toggle-label">${label}</span>${sub ? `<span class="toggle-sub">${sub}</span>` : ''}</span>
</label>`;
  }

  function radioCard({ name, bind, value, checked, title, sub = '', aside = '', disabled = false, extra = '' }) {
    const id = `${fid(bind)}-${value}`;
    return `<label class="choice ${checked ? 'is-on' : ''} ${disabled ? 'is-disabled' : ''}" for="${id}">
  <input type="radio" id="${id}" name="${name}" value="${value}" data-bind="${bind}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
  <span class="choice-dot" aria-hidden="true"></span>
  <span class="choice-body"><span class="choice-title">${title}</span>${sub ? `<span class="choice-sub">${sub}</span>` : ''}${extra}</span>
  ${aside ? `<span class="choice-aside">${aside}</span>` : ''}
</label>`;
  }

  function proofCtx(key, interactive = false) {
    return { L: listing(), p: S.products[key], agent: D.agent, interactive };
  }

  function thumb(key, side) {
    return `<div class="thumb thumb--${key}">${P.render(key, proofCtx(key), side || D.productSpecs[key].sides[0])}</div>`;
  }

  function deliverySummary(key) {
    const d = S.products[key].delivery;
    const pr = price(key);
    if (d.method === 'mail') {
      const r = recipients(d);
      if (!r) return 'Mail · no lists chosen yet';
      return `Mail to ${plural(r, 'recipient')}${d.sample ? ' + 1 sample' : ''} · ${d.cls === 'first' ? 'First Class' : 'Standard'}`;
    }
    if (d.method === 'ship') return `Ship ${plural(pr.pieces, 'copy', 'copies')} to ${esc(d.shipAddr.name)}, ${esc(d.shipAddr.city)}`;
    if (d.method === 'pickup') return `Pick up ${plural(pr.pieces, 'copy', 'copies')} · ${D.pickupLocations.find((l) => l.id === d.pickup).name}`;
    return `Download as ${d.format.toUpperCase()}`;
  }

  function optionsSummary(key) {
    const d = S.products[key].delivery;
    const parts = [];
    if (d.method === 'mail') parts.push(d.sample ? 'Sample copy to agent' : 'No sample copy');
    parts.push(paperById(d.paper).name);
    parts.push(d.pdf ? 'PDF copy added' : 'No PDF copy');
    return parts.join(' · ');
  }

  // ---------- header and frame ----------
  function Header() {
    const keys = configKeys();
    const sub = keys.reduce((s, k) => s + price(k).total, 0);
    const count = S.selected.length;
    const idx = stepIndex();
    const stepper =
      S.step === 'done'
        ? ''
        : `<nav class="stepper" aria-label="Order progress"><ol>${STEPS.map((s, i) => {
            const state = i < idx ? 'done' : i === idx ? 'current' : 'todo';
            const reachable = i <= S.maxStep && i !== idx;
            const inner = `<span class="stepper-dot">${state === 'done' ? ic('check') : i + 1}</span><span class="stepper-label">${s.label}</span>`;
            return `<li class="stepper-item is-${state}">${
              reachable
                ? `<button type="button" class="stepper-btn" data-act="goStep" data-arg="${s.id}">${inner}</button>`
                : `<span class="stepper-btn" ${state === 'current' ? 'aria-current="step"' : ''}>${inner}</span>`
            }</li>`;
          }).join('<li class="stepper-line" aria-hidden="true"></li>')}</ol></nav>`;
    return `<header class="topbar"><div class="topbar-in">
  <div class="brand"><span class="brand-mark">${A.logo()}</span><span class="brand-name">APM</span><span class="brand-sub">Marketing orders</span></div>
  ${stepper}
  ${
    S.step === 'done'
      ? '<span></span>'
      : `<button type="button" class="cart-pill" data-act="openDrawer" data-arg="cart" aria-label="Order summary">
    <span class="cart-pill-count">${count ? plural(count, 'product') : 'Empty order'}</span>
    ${count ? `<span class="cart-pill-amt">${money(sub)}</span>` : ''}
  </button>`
  }
</div></header>`;
  }

  function ContextBar() {
    const L = listing();
    const canChange = S.step === 'products';
    return `<div class="context"><div class="context-in">
  <div class="context-listing">
    <div class="context-photo">${A.photo('exterior-day')}</div>
    <div class="context-text">
      <div class="context-addr">${esc(L.street)}<span class="context-city">${L.city}, ${L.state} ${L.zip}</span></div>
      <div class="context-meta"><span class="tag">${L.event}</span><span>Event ${L.date}</span><span class="dot-sep">${esc(D.agent.name)} · ${D.agent.company}</span></div>
    </div>
    ${
      canChange
        ? `<div class="listing-switch">
      <button type="button" class="btn btn-quiet btn-sm" data-act="toggleListingMenu" aria-expanded="${S.listingMenu}" aria-haspopup="listbox">Change listing ${ic('chevDown')}</button>
      ${S.listingMenu ? ListingMenu() : ''}
    </div>`
        : ''
    }
  </div>
</div></div>`;
  }

  function ListingMenu() {
    return `<div class="listing-menu" role="listbox" aria-label="Listings">
  <div class="listing-menu-head">Your listings and events</div>
  ${D.listings
    .map(
      (l) => `<button type="button" role="option" aria-selected="${l.id === S.listingId}" class="listing-opt ${l.id === S.listingId ? 'is-on' : ''}" data-act="pickListing" data-arg="${l.id}">
    <span class="listing-opt-main"><b>${esc(l.street)}</b><span>${l.city}, ${l.state} ${l.zip}</span></span>
    <span class="listing-opt-meta"><span class="tag">${l.event}</span><span>${l.date}</span></span>
    ${l.id === S.listingId ? `<span class="listing-opt-check">${ic('check')}</span>` : ''}
  </button>`,
    )
    .join('')}
</div>`;
  }

  function Footer({ summary = '', back = null, primary, issues = [], showIssues = false, breakdown = '' }) {
    return `<div class="footbar"><div class="footbar-in">
  <div class="footbar-summary">${summary}</div>
  <div class="footbar-actions">
    ${
      showIssues && issues.length
        ? `<div class="footbar-issues" role="alert">
      <span class="footbar-issues-title">${issues.length === 1 ? '1 thing to finish' : `${issues.length} things to finish`}</span>
      ${issues.map((x) => `<span class="footbar-issue">${esc(x.text)} <button type="button" class="link" data-act="${x.act}" data-arg="${x.arg}">${x.fix}</button></span>`).join('')}
    </div>`
        : ''
    }
    ${back ? `<button type="button" class="btn btn-quiet" data-act="${back.act}">${ic('back')} ${back.label}</button>` : ''}
    <button type="button" class="btn btn-primary btn-lg" data-act="${primary.act}">${primary.label}${primary.icon === false ? '' : ' ' + ic('chevRight')}</button>
  </div>
</div>${breakdown}</div>`;
  }

  // ---------- step 1: products ----------
  function productArt(key) {
    const ph = (k) => `<div class="pa-photo">${A.photo(k)}</div>`;
    const lines = '<i></i><i></i><i class="short"></i>';
    switch (key) {
      case 'flyers':
        return `<div class="pa pa-flyers"><div class="pa-sheet pa-sheet--back"></div><div class="pa-sheet">${ph('exterior-day')}<div class="pa-lines">${lines}</div></div></div>`;
      case 'brochures':
        return `<div class="pa pa-brochures"><div class="pa-fold">${ph('living')}</div><div class="pa-fold pa-fold--mid"><div class="pa-lines">${lines}${lines}</div></div><div class="pa-fold">${ph('exterior-dusk')}</div></div>`;
      case 'postcards':
        return `<div class="pa pa-postcards"><div class="pa-card pa-card--back"><div class="pa-lines">${lines}</div></div><div class="pa-card">${ph('exterior-dusk')}</div></div>`;
      case 'social':
        return `<div class="pa pa-social"><div class="pa-phone"><div class="pa-phone-head"><span></span><i></i></div>${ph('exterior-day')}<div class="pa-lines">${lines}</div></div></div>`;
      case 'images':
        return `<div class="pa pa-images"><div class="pa-tile">${ph('kitchen')}</div><div class="pa-tile">${ph('backyard')}</div><div class="pa-tile">${ph('living')}</div><span class="pa-badge">${ic('download')}</span></div>`;
      default:
        return `<div class="pa pa-ad"><div class="pa-adcard"><div class="pa-phone-head"><span></span><i></i></div>${ph('exterior-dusk')}<div class="pa-cta">Learn more</div></div></div>`;
    }
  }

  function ProductsStep() {
    const L = listing();
    const sel = S.selected;
    const keys = configKeys();
    const cards = D.products
      .map((p) => {
        const on = sel.includes(p.key);
        return `<button type="button" class="pcard ${on ? 'is-on' : ''}" data-act="toggleProduct" data-arg="${p.key}" aria-pressed="${on}">
  <div class="pcard-art">${productArt(p.key)}</div>
  <div class="pcard-body">
    <div class="pcard-row"><span class="pcard-name">${p.name}</span><span class="pcard-check" aria-hidden="true">${on ? ic('check') : ''}</span></div>
    <div class="pcard-blurb">${p.blurb}</div>
    <div class="pcard-price ${p.free ? 'is-free' : ''}">${p.free ? 'Free' : p.price}</div>
  </div>
  <span class="sr-only">${on ? 'Selected' : 'Not selected'}</span>
</button>`;
      })
      .join('');

    const label = sel.length ? sel.map((k) => productInfo(k).name).join(', ') : 'Nothing selected yet';
    const issue = S.attempt.products && !keys.length;
    return `<main class="page page--products">
  <header class="page-head">
    <div class="eyebrow">Step 1 of 4</div>
    <h1 class="title">What would you like to order?</h1>
    <p class="lede">Choose one or more. Every product uses the same listing details for ${esc(L.street)}.</p>
  </header>
  <div class="pgrid">${cards}</div>
  ${
    extraKeys().length
      ? `<p class="note">${ic('layers')} <span>${extraKeys()
          .map((k) => productInfo(k).name)
          .join(' and ')} ${extraKeys().length === 1 ? 'is' : 'are'} built from your print design and set up after you submit. Their setup isn’t part of this prototype.</span></p>`
      : ''
  }
</main>
${Footer({
  summary: `<span class="fs-label">${sel.length ? plural(sel.length, 'product') + ' selected' : 'Select products'}</span><span class="fs-value">${esc(label)}</span>`,
  primary: { act: 'startDesign', label: keys.length ? `Customize ${plural(keys.length, 'product')}` : 'Customize' },
  issues: issue ? [{ text: 'Choose at least one printed product (Flyers, Brochures, or Postcards)', act: 'noop', arg: '', fix: '' }] : [],
  showIssues: issue,
})}`;
  }

  // ---------- product rail (design + delivery) ----------
  function ProductRail() {
    const keys = configKeys();
    if (keys.length < 2) return '';
    return `<div class="rail" role="tablist" aria-label="Products in this order">${keys
      .map((k, i) => {
        const st = productStatus(k);
        const on = i === S.cur;
        return `<button type="button" role="tab" aria-selected="${on}" class="rail-item ${on ? 'is-on' : ''}" data-act="pickProduct" data-arg="${i}">
  <span class="rail-num ${st.tone === 'ok' ? 'is-ok' : ''}">${st.tone === 'ok' ? ic('check') : i + 1}</span>
  <span class="rail-text"><b>${productInfo(k).name}</b><span class="rail-status is-${st.tone}">${st.label}</span></span>
</button>`;
      })
      .join('<span class="rail-sep" aria-hidden="true"></span>')}</div>`;
  }

  function stepFooterSummary(key) {
    const pr = price(key);
    const d = S.products[key].delivery;
    const what = d.method === 'download' ? 'Digital file' : plural(pr.pieces, 'printed piece');
    return `<span class="fs-label">${productInfo(key).name}</span><span class="fs-value">${what} · <b>${pr.total === 0 && d.method === 'download' ? 'Included' : money(pr.total)}</b>
  <button type="button" class="link link-quiet" data-act="toggleBreakdown" aria-expanded="${S.breakdownOpen}">${S.breakdownOpen ? 'Hide' : 'Breakdown'}</button></span>`;
  }

  function Breakdown(key) {
    if (!S.breakdownOpen) return '';
    const pr = price(key);
    return `<div class="breakdown" role="region" aria-label="Price breakdown">
  <div class="breakdown-head">${productInfo(key).name} · price breakdown</div>
  ${pr.lines.map((l) => `<div class="breakdown-row"><span>${l.label}<small>${l.note}</small></span><span>${l.amt === 0 ? 'Included' : money(l.amt)}</span></div>`).join('')}
  <div class="breakdown-row breakdown-total"><span>Product total</span><span>${money(pr.total)}</span></div>
  <p class="breakdown-note">Tax and credits are applied at Review.</p>
</div>`;
  }

  // ---------- step 2: design ----------
  function DesignStep() {
    const key = curKey();
    const p = cur();
    const L = listing();
    const spec = D.productSpecs[key];
    const tpl = D.templates.find((t) => t.id === p.template);
    const issues = designIssues(key);
    const qrState =
      p.qr.status === 'saved'
        ? { tone: 'ok', text: 'Links to ' + esc(p.qr.url.replace(/^https?:\/\//, '')) }
        : p.qr.status === 'draft'
        ? { tone: 'warn', text: 'Link needs attention' }
        : { tone: 'idle', text: 'Not added' };

    const approvalChip = p.approved
      ? `<span class="chip chip--ok">${ic('check')} Proof approved</span>`
      : p.changed
      ? `<span class="chip chip--warn">Changes saved · approve again</span>`
      : `<span class="chip">Draft · not yet approved</span>`;

    const sideBtns = spec.sides
      .map((s) => `<button type="button" class="seg-btn ${p.side === s ? 'is-on' : ''}" data-act="side" data-arg="${s}" aria-pressed="${p.side === s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`)
      .join('');

    const row = (icon, title, value, act, arg, btn, tone = '') => `<div class="setting ${tone ? 'is-' + tone : ''}">
  <span class="setting-ic">${ic(icon)}</span>
  <span class="setting-text"><span class="setting-title">${title}</span><span class="setting-value">${value}</span></span>
  <button type="button" class="btn btn-quiet btn-sm" data-act="${act}" data-arg="${arg}">${btn}</button>
</div>`;

    const showIssues = S.attempt.design && issues.length;
    return `<main class="page page--design">
  ${ProductRail()}
  <div class="design">
    <section class="design-stage" aria-label="Proof">
      <div class="stage-bar">
        <div class="seg" role="group" aria-label="Side">${sideBtns}</div>
        <div class="stage-status">${p.savedAt ? `<span class="saved">Saved ${p.savedAt}</span>` : ''}${approvalChip}</div>
      </div>
      <div class="stage">${P.render(key, proofCtx(key, true), p.side)}</div>
    </section>
    <aside class="design-panel">
      <div class="eyebrow">Step 2 of 4 · ${S.cur + 1} of ${configKeys().length} products</div>
      <h1 class="title title--sm">${productInfo(key).name}</h1>
      <p class="muted">${spec.size} · uses ${esc(L.street)} details</p>

      <div class="settings">
        ${row('layers', 'Template', `${tpl.name}${S.defaults[key] === tpl.id ? ' · your default' : ''}`, 'openDrawer', 'template', 'Change')}
        ${row('text', 'Text & photos', p.savedAt ? 'Edited' : 'From listing', 'openDrawer', 'edit', 'Edit')}
        ${row('qr', 'QR code', qrState.text, 'openDrawer', 'qr', p.qr.status === 'draft' ? 'Fix' : p.qr.status === 'none' ? 'Add' : 'Edit', qrState.tone)}
      </div>

      <div class="approve-box ${showIssues ? 'is-blocked' : ''}">
        <p class="approve-title">Before you approve</p>
        <p class="approve-text">Check the price, spelling, and contact details. Printing follows this proof exactly.</p>
        ${issues.length ? `<p class="approve-issue">${ic('alert')} <span>${issues[0].text}. <button type="button" class="link" data-act="${issues[0].act}" data-arg="${issues[0].arg}">${issues[0].fix}</button></span></p>` : ''}
      </div>
    </aside>
  </div>
</main>
${Footer({
  summary: stepFooterSummary(key),
  back: { act: 'back', label: 'Back' },
  primary: { act: 'approve', label: p.approved ? 'Continue to delivery' : 'Approve proof & continue' },
  issues,
  showIssues,
  breakdown: Breakdown(key),
})}`;
  }

  // ---------- step 3: delivery ----------
  const METHODS = [
    { id: 'mail', icon: 'mail', title: 'Mail', sub: 'We mail one to each address on your lists' },
    { id: 'ship', icon: 'truck', title: 'Ship', sub: 'A boxed batch delivered to you' },
    { id: 'pickup', icon: 'store', title: 'Pickup', sub: 'Collect a printed batch at a studio' },
    { id: 'download', icon: 'download', title: 'Download', sub: 'A JPG or PDF file, no printing' },
  ];

  function DeliveryStep() {
    const key = curKey();
    const p = cur();
    const d = p.delivery;
    const name = productInfo(key).name;
    const issues = deliveryIssues(key);
    const isLast = S.cur === configKeys().length - 1;
    const nextLabel = isLast ? 'Review order' : `Next: ${productInfo(configKeys()[S.cur + 1]).name}`;

    const methods = METHODS.map(
      (m) => `<label class="method ${d.method === m.id ? 'is-on' : ''}" for="m-${m.id}">
  <input type="radio" name="method" id="m-${m.id}" value="${m.id}" data-bind="products.${key}.delivery.method" ${d.method === m.id ? 'checked' : ''}>
  <span class="method-ic">${ic(m.icon)}</span>
  <span class="method-title">${m.title}</span>
  <span class="method-sub">${m.sub}</span>
  <span class="method-check" aria-hidden="true">${d.method === m.id ? ic('check') : ''}</span>
</label>`,
    ).join('');

    let body = '';
    if (d.method === 'mail') body = MailPanel(key);
    else if (d.method === 'ship') body = QtyPanel(key) + ShipPanel(key);
    else if (d.method === 'pickup') body = QtyPanel(key) + PickupPanel(key);
    else body = DownloadPanel(key);

    return `<main class="page page--delivery">
  ${ProductRail()}
  <div class="delivery">
    <header class="delivery-head">
      <div class="delivery-thumb">${thumb(key, p.side)}</div>
      <div>
        <div class="eyebrow">Step 3 of 4 · ${name}</div>
        <h1 class="title title--sm">How should we deliver your ${name.toLowerCase()}?</h1>
        <p class="muted">${p.approved ? `${ic('check', 'ic-ok')} Proof approved` : `Proof not approved yet · <button type="button" class="link" data-act="goStep" data-arg="design">Review proof</button>`} · ${D.templates.find((t) => t.id === p.template).name} template</p>
      </div>
    </header>
    <fieldset class="methods"><legend class="sr-only">Delivery method</legend>${methods}</fieldset>
    ${body}
    ${d.method !== 'download' ? OptionsPanel(key) : ''}
  </div>
</main>
${Footer({
  summary: stepFooterSummary(key),
  back: { act: 'back', label: 'Back' },
  primary: { act: 'deliveryNext', label: nextLabel },
  issues,
  showIssues: S.attempt['delivery-' + key] && issues.length,
  breakdown: Breakdown(key),
})}`;
  }

  function MailPanel(key) {
    const d = S.products[key].delivery;
    const r = recipients(d);
    const unitName = D.productSpecs[key].unitName;
    const attempted = S.attempt['delivery-' + key];
    const lists = d.lists
      .map((id) => {
        const l = listById(id);
        return `<li class="sel-list">
  <span class="sel-list-ic">${ic(l.source === 'Radius' ? 'radius' : 'people')}</span>
  <span class="sel-list-text"><b>${esc(l.name)}</b><span>${l.source} · ${l.created}</span></span>
  <span class="sel-list-count">${l.count.toLocaleString()}</span>
  <button type="button" class="icon-btn" data-act="removeList" data-arg="${id}" aria-label="Remove ${esc(l.name)}">${ic('close')}</button>
</li>`;
      })
      .join('');

    const composition = r
      ? `<div class="composition" aria-label="Printed quantity">
  ${d.lists.map((id) => `<span class="comp-part"><b>${listById(id).count}</b><small>${esc(listById(id).name)}</small></span>`).join('<span class="comp-op">+</span>')}
  ${d.sample ? `<span class="comp-op">+</span><span class="comp-part"><b>1</b><small>Sample copy</small></span>` : ''}
  <span class="comp-op">=</span><span class="comp-part comp-total"><b>${r + (d.sample ? 1 : 0)}</b><small>${unitName}s printed</small></span>
</div>`
      : '';

    return `<section class="block">
  <div class="block-head">
    <div><h2 class="block-title">Recipients</h2><p class="block-sub">Each address on your lists receives one ${unitName}. Quantity and postage follow the list size.</p></div>
    ${r ? `<button type="button" class="btn btn-quiet btn-sm" data-act="openLists" data-arg="${key}">Change lists</button>` : ''}
  </div>
  ${
    r
      ? `<ul class="sel-lists">${lists}</ul>${composition}`
      : `<div class="empty ${attempted ? 'is-invalid' : ''}">
    <p class="empty-title">No mailing lists chosen yet</p>
    <p class="empty-text">Pick saved lists, or build one from the homes around ${esc(listing().street)}.</p>
    <div class="empty-actions">
      <button type="button" class="btn btn-secondary" data-act="openLists" data-arg="${key}">Choose saved lists</button>
      <button type="button" class="btn btn-quiet" data-act="openCreate">${ic('plus')} Create list</button>
    </div>
  </div>`
  }
</section>
<section class="block">
  <div class="block-head"><div><h2 class="block-title">Mailing class</h2><p class="block-sub">Delivery times are typical estimates, not guarantees.</p></div></div>
  <div class="choices choices--2">
    ${radioCard({ name: 'cls', bind: `products.${key}.delivery.cls`, value: 'standard', checked: d.cls === 'standard', title: 'Standard', sub: '5–15 business days', aside: `${money(POSTAGE.standard)} / piece` })}
    ${radioCard({ name: 'cls', bind: `products.${key}.delivery.cls`, value: 'first', checked: d.cls === 'first', title: 'First Class', sub: '3–5 business days', aside: `${money(POSTAGE.first)} / piece` })}
  </div>
</section>`;
  }

  function QtyPanel(key) {
    const d = S.products[key].delivery;
    const unitName = D.productSpecs[key].unitName;
    const q = Number(d.qty) || 0;
    const err =
      q < MIN_QTY
        ? `Order at least ${MIN_QTY} pieces for ${d.method === 'ship' ? 'shipping' : 'pickup'}.`
        : q > MAX_QTY
        ? `Online pricing goes up to ${MAX_QTY.toLocaleString()}. For larger runs, your studio will send a quote.`
        : '';
    const presets = [50, 100, 250, 500];
    return `<section class="block">
  <div class="block-head"><div><h2 class="block-title">Quantity</h2><p class="block-sub">One batch, printed together. ${money(unitPrint(key))} per ${unitName} on your paper.</p></div></div>
  <div class="qty">
    <div class="seg seg--lg" role="group" aria-label="Common quantities">${presets
      .map((n) => `<button type="button" class="seg-btn ${q === n ? 'is-on' : ''}" data-act="qtyPreset" data-arg="${n}" aria-pressed="${q === n}">${n}</button>`)
      .join('')}</div>
    ${field({ bind: `products.${key}.delivery.qty`, label: 'Or enter', value: d.qty, type: 'number', cls: 'field--qty', attrs: `min="${MIN_QTY}" max="${MAX_QTY}"`, error: err })}
  </div>
</section>`;
  }

  function ShipPanel(key) {
    const d = S.products[key].delivery;
    const a = d.shipAddr;
    const b = `products.${key}.delivery.shipAddr`;
    return `<section class="block">
  <div class="block-head">
    <div><h2 class="block-title">Ship to</h2><p class="block-sub">Arrives about 4–6 business days after approval.</p></div>
    <button type="button" class="btn btn-quiet btn-sm" data-act="editShip" data-arg="${key}">${d.shipEdit ? 'Done' : 'Change'}</button>
  </div>
  ${d.shipEdit ? AddressFields(b, a) : `<address class="addr">${esc(a.name)} · ${esc(a.company)}<br>${esc(a.street1)}${a.street2 ? ', ' + esc(a.street2) : ''}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</address>`}
</section>`;
  }

  function PickupPanel(key) {
    const d = S.products[key].delivery;
    return `<section class="block">
  <div class="block-head"><div><h2 class="block-title">Pickup location</h2><p class="block-sub">Ready about 2 business days after approval. We’ll email you when it’s ready.</p></div></div>
  <div class="choices">
    ${D.pickupLocations.map((l) => radioCard({ name: 'pickup', bind: `products.${key}.delivery.pickup`, value: l.id, checked: d.pickup === l.id, title: l.name, sub: `${l.addr} · ${l.hours}` })).join('')}
  </div>
</section>`;
  }

  function DownloadPanel(key) {
    const d = S.products[key].delivery;
    return `<section class="block">
  <div class="block-head"><div><h2 class="block-title">File format</h2><p class="block-sub">Nothing is printed or shipped. Your file is ready right after approval.</p></div></div>
  <div class="choices choices--2">
    ${radioCard({ name: 'fmt', bind: `products.${key}.delivery.format`, value: 'jpg', checked: d.format === 'jpg', title: 'JPG image', sub: 'For email and the web', aside: 'Included' })}
    ${radioCard({ name: 'fmt', bind: `products.${key}.delivery.format`, value: 'pdf', checked: d.format === 'pdf', title: 'PDF', sub: 'Print-ready, with bleed', aside: 'Included' })}
  </div>
</section>`;
  }

  function AddressFields(b, a, missing = []) {
    const err = (k, msg) => (missing.includes(k) ? msg : '');
    return `<div class="addr-grid">
  ${field({ bind: `${b}.name`, label: 'Name', value: a.name, cls: 'span-2', error: err('name', 'Add a name.') })}
  ${field({ bind: `${b}.company`, label: 'Company <span class="opt">optional</span>', value: a.company, cls: 'span-2' })}
  ${field({ bind: `${b}.street1`, label: 'Street address', value: a.street1, cls: 'span-4', error: err('street', 'Add a street address.') })}
  ${field({ bind: `${b}.street2`, label: 'Apt, suite <span class="opt">optional</span>', value: a.street2, cls: 'span-4' })}
  ${field({ bind: `${b}.city`, label: 'City', value: a.city, cls: 'span-2', error: err('city', 'Add a city.') })}
  ${field({ bind: `${b}.state`, label: 'State', value: a.state, cls: 'span-1', attrs: 'maxlength="2"', error: err('state', 'Use 2 letters.') })}
  ${field({ bind: `${b}.zip`, label: 'ZIP', value: a.zip, cls: 'span-1', attrs: 'inputmode="numeric" maxlength="5"', error: err('zip', 'Add a 5-digit ZIP.') })}
</div>`;
  }

  function OptionsPanel(key) {
    const d = S.products[key].delivery;
    const b = `products.${key}.delivery`;
    const sampleMiss = d.method === 'mail' && d.sample ? addrMissing(d.sampleAddr) : [];
    const paperIssue = paperById(d.paper)?.unavailableFor?.includes(key);
    const needs = sampleMiss.length || paperIssue;
    const papers = D.papers
      .map((pp) => {
        const unavailable = pp.unavailableFor?.includes(key);
        return radioCard({
          name: 'paper',
          bind: `${b}.paper`,
          value: pp.id,
          checked: d.paper === pp.id,
          title: pp.name,
          sub: unavailable ? pp.why : pp.note,
          aside: unavailable ? 'Unavailable' : pp.add ? `+${money(pp.add)} / piece` : 'Included',
          disabled: unavailable && d.paper !== pp.id,
        });
      })
      .join('');

    const sample =
      d.method === 'mail'
        ? `<div class="opt-group">
    ${toggle({ bind: `${b}.sample`, checked: d.sample, label: `Send me a sample copy · ${money(SAMPLE_FEE)}`, sub: 'One extra piece, printed with the batch, so you see exactly what recipients get. Adds 1 to the printed quantity.' })}
    ${
      d.sample
        ? `<div class="sample-addr ${sampleMiss.length ? 'is-warn' : 'is-ok'}" id="sample-addr">
      ${
        sampleMiss.length
          ? `<div class="inline-msg inline-msg--warn" role="status">${ic('alert')}<span>We can’t deliver the sample without ${sampleMiss.includes('zip') && sampleMiss.length === 1 ? 'a ZIP code' : 'a complete address'}. <button type="button" class="link" data-act="useOffice" data-arg="${key}">Use office address (78701)</button></span></div>`
          : `<div class="inline-msg inline-msg--ok" role="status">${ic('check')}<span>Sample goes to ${esc(d.sampleAddr.name)}, ${esc(d.sampleAddr.city)} ${esc(d.sampleAddr.zip)}</span></div>`
      }
      ${AddressFields(`${b}.sampleAddr`, d.sampleAddr, sampleMiss)}
    </div>`
        : ''
    }
  </div>`
        : '';

    return `<section class="block block--options ${d.optionsOpen ? 'is-open' : ''}">
  <button type="button" class="options-head" data-act="toggleOptions" aria-expanded="${d.optionsOpen}">
    <span class="options-head-text">
      <span class="block-title">Options <span class="opt">optional</span></span>
      <span class="options-summary">${needs ? `<span class="warn-text">${ic('alert')} ${sampleMiss.length ? 'Sample address needs a ZIP code' : 'Choose an available paper'}</span> · ` : ''}${optionsSummary(key)}</span>
    </span>
    <span class="options-toggle">${d.optionsOpen ? 'Hide' : 'Edit options'} ${ic('chevDown')}</span>
  </button>
  ${
    d.optionsOpen
      ? `<div class="options-body">
    ${sample}
    <div class="opt-group">
      <h3 class="opt-title">Paper</h3>
      <div class="choices">${papers}</div>
    </div>
    <div class="opt-group">
      ${toggle({ bind: `${b}.pdf`, checked: d.pdf, label: `Add a print-ready PDF · ${money(PDF_FEE)}`, sub: 'Emailed after approval, for your own records or reprints.' })}
    </div>
  </div>`
      : ''
  }
</section>`;
  }

  // ---------- step 4: review ----------
  function ReviewStep() {
    const keys = configKeys();
    const t = totals();
    const R = S.review;
    const issues = reviewIssues();
    const isApproval = R.pay === 'corp';

    const items = keys
      .map((k, i) => {
        const p = S.products[k];
        const pr = price(k);
        const st = productStatus(k);
        const di = deliveryIssues(k);
        let status = '';
        if (!p.approved) status = `<span class="r-flag is-warn">${ic('alert')} Proof not approved · <button type="button" class="link" data-act="editProduct" data-arg="${i}">Review proof</button></span>`;
        else if (di.length) status = `<span class="r-flag is-warn">${ic('alert')} ${esc(di[0].text)} · <button type="button" class="link" data-act="fixDelivery" data-arg="${i}">Fix</button></span>`;
        else status = `<span class="r-flag is-ok">${ic('check')} Proof approved</span>`;
        return `<article class="r-item">
  <div class="r-thumb">${thumb(k)}</div>
  <div class="r-body">
    <div class="r-top"><h3 class="r-name">${productInfo(k).name}</h3><span class="r-amt">${money(pr.total)}</span></div>
    <p class="r-meta">${D.templates.find((x) => x.id === p.template).name} template · ${paperById(p.delivery.paper).name}${p.delivery.pdf ? ' · PDF copy' : ''}</p>
    <p class="r-meta">${deliverySummary(k)}</p>
    <div class="r-foot">${status}<span class="r-links"><button type="button" class="link link-quiet" data-act="editProduct" data-arg="${i}">Edit design</button><button type="button" class="link link-quiet" data-act="fixDelivery" data-arg="${i}">Edit delivery</button></span></div>
  </div>
</article>`;
      })
      .join('');

    const extras = extraKeys().length
      ? `<div class="r-extras">${extraKeys()
          .map((k) => `<div class="r-extra"><span>${ic(k === 'social' ? 'phone' : k === 'images' ? 'image' : 'megaphone')} ${productInfo(k).name}</span><span class="muted">${k === 'fbad' ? 'Budget set at launch' : 'Free · set up after approval'}</span></div>`)
          .join('')}</div>`
      : '';

    const store = D.credits.store;
    const ad = D.credits.ad;
    const used = (id) => t.credits.find((c) => c.id === id)?.amt || 0;
    const credits = `<div class="credit-rows">
  <div class="credit">
    ${toggle({ bind: 'review.storeOn', checked: R.storeOn, label: 'Store credit', sub: R.storeOn ? `Using ${money(used('store'))} · ${money(store.balance - used('store'))} left after this order` : `${money(store.balance)} available` })}
    <span class="credit-amt">${R.storeOn ? '−' + money(used('store')) : ''}</span>
  </div>
  <div class="credit">
    ${toggle({ bind: 'review.adOn', checked: R.adOn, label: 'Ad budget', sub: R.adOn ? `Using ${money(used('ad'))} of ${money(ad.balance)} · ${money(ad.balance - used('ad'))} left` : `${money(ad.balance)} available` })}
    ${R.adOn ? `<div class="credit-input">${field({ bind: 'review.adAmount', label: '<span class="sr-only">Ad budget amount</span>', value: R.adAmount, type: 'number', cls: 'field--money', attrs: `min="0" max="${ad.balance}" step="1"` })}</div>` : ''}
    <span class="credit-amt">${R.adOn ? '−' + money(used('ad')) : ''}</span>
  </div>
  <div class="credit credit--promo">
    ${
      R.promoApplied
        ? `<div class="promo-applied"><span class="promo-code">${ic('tag')} ${D.credits.promo.code}</span><span class="muted">${D.credits.promo.label}</span><button type="button" class="link link-quiet" data-act="removePromo">Remove</button></div><span class="credit-amt">−${money(used('promo'))}</span>`
        : R.promoOpen
        ? `<div class="promo-form">
        ${field({ bind: 'review.promoInput', label: 'Promo code', value: R.promoInput, placeholder: 'e.g. WILLOW10', error: R.promoError, hint: 'Demo code: WILLOW10' })}
        <button type="button" class="btn btn-secondary" data-act="applyPromo">Apply</button>
      </div>`
        : `<button type="button" class="link" data-act="openPromo">${ic('plus')} Add promo code</button>`
    }
  </div>
</div>`;

    return `<main class="page page--review">
  <header class="page-head">
    <div class="eyebrow">Step 4 of 4</div>
    <h1 class="title">Review and submit</h1>
    <p class="lede">Check each product, apply credits, then choose how to pay.</p>
  </header>
  <div class="review">
    <div class="review-main">
      <section class="r-sec" aria-labelledby="r-products">
        <h2 class="r-sec-title" id="r-products"><span class="r-num">1</span>Products</h2>
        <div class="r-items">${items}</div>
        ${extras}
      </section>
      <section class="r-sec" aria-labelledby="r-credits">
        <h2 class="r-sec-title" id="r-credits"><span class="r-num">2</span>Credits</h2>
        ${credits}
      </section>
      <section class="r-sec" aria-labelledby="r-pay">
        <h2 class="r-sec-title" id="r-pay"><span class="r-num">3</span>Payment</h2>
        ${PaymentSection(t)}
        <label class="ack ${S.attempt.review && !R.ack ? 'is-invalid' : ''}" for="f-ack">
          <input type="checkbox" id="f-ack" data-bind="review.ack" ${R.ack ? 'checked' : ''}>
          <span class="ack-box" aria-hidden="true">${ic('check')}</span>
          <span>I’ve reviewed each proof and confirm the content, prices, and mailing lists are correct. Printing follows the approved proofs exactly.</span>
        </label>
      </section>
    </div>
    <aside class="review-side">
      <div class="summary">
        <h2 class="summary-title">Order total</h2>
        <div class="sum-row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
        <div class="sum-row"><span>Estimated tax (${(D.taxRate * 100).toFixed(2)}%)</span><span>${money(t.tax)}</span></div>
        ${t.credits.map((c) => `<div class="sum-row sum-credit"><span>${c.label}</span><span>−${money(c.amt)}</span></div>`).join('')}
        <div class="sum-row sum-total"><span>${isApproval ? 'Due on approval' : 'Total due'}</span><span>${money(t.due)}</span></div>
        <p class="sum-note">${
          isApproval
            ? `${ic('lock')} <span>Billed to ${esc(D.corp.name)} after ${esc(D.corp.approver)} approves. Nothing prints until then.</span>`
            : R.pay === 'split'
            ? `${ic('card')} <span>Charged across two cards when you place the order.</span>`
            : `${ic('card')} <span>Charged when you place the order. Printing starts right away.</span>`
        }</p>
      </div>
    </aside>
  </div>
</main>
${Footer({
  summary: `<span class="fs-label">${isApproval ? 'Due on approval' : 'Total due'}</span><span class="fs-value"><b class="fs-big">${money(t.due)}</b> <span class="muted">after ${money(t.creditTotal)} in credits</span></span>`,
  back: { act: 'back', label: 'Back' },
  primary: { act: 'submit', label: isApproval ? 'Submit for approval' : `Place order · ${money(t.due)}`, icon: false },
  issues,
  showIssues: S.attempt.review && issues.length,
})}`;
  }

  function cardLabel(c) {
    return `${c.brand} •••• ${c.last4}`;
  }

  function PaymentSection(t) {
    const R = S.review;
    const methodLabel =
      R.pay === 'corp'
        ? { icon: 'building', title: D.corp.name, sub: `Requires approval by ${D.corp.approver}, ${D.corp.approverRole}` }
        : R.pay === 'split'
        ? { icon: 'split', title: 'Split between two cards', sub: 'Choose how much goes on each' }
        : R.pay === 'new'
        ? { icon: 'card', title: 'New card', sub: 'Simulated · nothing is charged' }
        : (() => {
            const c = S.cards.find((x) => x.id === R.pay);
            return { icon: 'card', title: cardLabel(c), sub: `Expires ${c.exp}` };
          })();

    let contextual = '';
    if (R.pay === 'corp') {
      contextual = `<div class="pay-fields">
  <div class="field">
    <label class="field-label" for="${fid('review.costCenter')}">Cost center</label>
    <select class="input" id="${fid('review.costCenter')}" data-bind="review.costCenter">
      <option value="">Choose…</option>
      ${D.corp.costCenters.map((c) => `<option ${R.costCenter === c ? 'selected' : ''}>${c}</option>`).join('')}
    </select>
    <div class="field-hint">Pre-filled from your last order.</div>
  </div>
  <div class="field">
    <label class="field-label" for="${fid('review.comment')}">Note for ${D.corp.approver.split(' ')[0]} <span class="opt">optional</span></label>
    <textarea class="input" id="${fid('review.comment')}" data-bind="review.comment" rows="2" placeholder="e.g. Launch mailing for the Nov 8 open house">${esc(R.comment)}</textarea>
  </div>
</div>`;
    } else if (R.pay === 'split') {
      const a = Number(R.splitAmt) || 0;
      const rest = r2(t.due - a);
      const opts = (sel) => S.cards.map((c) => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${cardLabel(c)}</option>`).join('');
      contextual = `<div class="split">
  <div class="split-row">
    <select class="input" id="${fid('review.splitA')}" data-bind="review.splitA" aria-label="First card">${opts(R.splitA)}</select>
    ${field({ bind: 'review.splitAmt', label: '<span class="sr-only">Amount on first card</span>', value: R.splitAmt, type: 'number', placeholder: '0.00', cls: 'field--money', attrs: 'step="0.01" min="0"' })}
  </div>
  <div class="split-row">
    <select class="input" id="${fid('review.splitB')}" data-bind="review.splitB" aria-label="Second card">${opts(R.splitB)}</select>
    <div class="split-rest">${a > 0 && a < t.due ? money(rest) : '—'}<small>remainder</small></div>
  </div>
  <p class="field-hint">The second card covers whatever is left of ${money(t.due)}.</p>
</div>`;
    } else if (R.pay === 'new') {
      const c = R.addCard;
      const tried = R.addCardTried;
      contextual = `<div class="pay-fields pay-fields--grid">
  ${field({ bind: 'review.addCard.name', label: 'Name on card', value: c.name, cls: 'span-4', error: tried && !c.name.trim() ? 'Add the name on the card.' : '' })}
  ${field({ bind: 'review.addCard.number', label: 'Card number', value: c.number, cls: 'span-4', placeholder: 'Test number only', attrs: 'inputmode="numeric" autocomplete="off"', error: tried && c.number.replace(/\D/g, '').length < 15 ? 'Enter the full card number.' : '' })}
  ${field({ bind: 'review.addCard.exp', label: 'Expires', value: c.exp, cls: 'span-2', placeholder: 'MM/YY', error: tried && !/^\d{2}\/\d{2}$/.test(c.exp) ? 'Use MM/YY.' : '' })}
  ${field({ bind: 'review.addCard.zip', label: 'Billing ZIP', value: c.zip, cls: 'span-2', error: tried && !/^\d{5}$/.test(c.zip) ? 'Add a 5-digit ZIP.' : '' })}
  <div class="span-4 pay-new-actions"><button type="button" class="btn btn-secondary" data-act="saveCard">Save card</button><span class="field-hint">Prototype only. Nothing is stored or charged.</span></div>
</div>`;
    }

    const options = R.payOpen
      ? `<div class="pay-options" role="radiogroup" aria-label="Payment method">
  ${radioCard({ name: 'pay', bind: 'review.pay', value: 'corp', checked: R.pay === 'corp', title: D.corp.name, sub: 'Submitted for approval before printing', extra: '' })}
  ${S.cards.map((c) => radioCard({ name: 'pay', bind: 'review.pay', value: c.id, checked: R.pay === c.id, title: cardLabel(c), sub: `Expires ${c.exp} · charged now` })).join('')}
  ${radioCard({ name: 'pay', bind: 'review.pay', value: 'split', checked: R.pay === 'split', title: 'Split between two cards', sub: 'Choose an amount for each card' })}
  ${radioCard({ name: 'pay', bind: 'review.pay', value: 'new', checked: R.pay === 'new', title: 'Add a new card', sub: 'Simulated in this prototype' })}
</div>`
      : '';

    return `<div class="pay">
  <div class="pay-current">
    <span class="pay-ic">${ic(methodLabel.icon)}</span>
    <span class="pay-text"><b>${methodLabel.title}</b><span>${methodLabel.sub}</span></span>
    <button type="button" class="btn btn-quiet btn-sm" data-act="togglePay" aria-expanded="${R.payOpen}">${R.payOpen ? 'Done' : 'Change'}</button>
  </div>
  ${options}
  ${contextual}
</div>`;
  }

  // ---------- done ----------
  function DoneStep() {
    const t = S.lastTotals;
    const corp = S.lastPay === 'corp';
    const L = listing();
    const steps = corp
      ? [
          ['Submitted', 'Just now', true],
          [`${D.corp.approver} approves`, 'Usually within 1 business day', false],
          ['Printing', '1–2 business days after approval', false],
          ['Mailing and shipping', 'Standard mail arrives in 5–15 business days', false],
        ]
      : [
          ['Order placed', 'Just now', true],
          ['Printing', '1–2 business days', false],
          ['Mailing and shipping', 'Standard mail arrives in 5–15 business days', false],
        ];
    return `<main class="page page--done">
  <div class="done">
    <div class="done-mark">${ic('check')}</div>
    <h1 class="title">${corp ? 'Submitted for approval' : 'Order placed'}</h1>
    <p class="lede">${corp ? `${D.corp.approver} will review order <b>${S.orderNo}</b>. We’ll email you when it’s approved.` : `Order <b>${S.orderNo}</b> is confirmed. A receipt is on its way.`}</p>
    <div class="done-card">
      <div class="done-row"><span>${esc(L.street)}</span><span>${configKeys().map((k) => productInfo(k).name).join(', ')}</span></div>
      <div class="done-row"><span>${corp ? 'Due on approval' : 'Charged'}</span><span><b>${money(t.due)}</b></span></div>
      <ol class="timeline">${steps.map(([a, b, done]) => `<li class="${done ? 'is-done' : ''}"><span class="tl-dot">${done ? ic('check') : ''}</span><span><b>${a}</b><small>${b}</small></span></li>`).join('')}</ol>
    </div>
    <div class="done-actions">
      <button type="button" class="btn btn-primary" data-act="newOrder">Start another order</button>
    </div>
    <p class="fine">Simulated submission. No order, payment, or mailing was created.</p>
  </div>
</main>`;
  }

  // ---------- drawers ----------
  function Drawer() {
    if (!S.drawer) return '';
    let inner = '';
    if (S.drawer === 'template') inner = TemplateDrawer();
    else if (S.drawer === 'edit') inner = EditDrawer();
    else if (S.drawer === 'qr') inner = QrDrawer();
    else if (S.drawer === 'lists') inner = ListsDrawer();
    else if (S.drawer === 'cart') inner = CartDrawer();
    return `<div class="scrim" data-act="closeDrawer"></div>
<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">${inner}</aside>`;
  }

  function drawerHead(title, sub = '', back = '') {
    return `<header class="drawer-head">
  ${back ? `<button type="button" class="icon-btn" data-act="${back}" aria-label="Back">${ic('back')}</button>` : ''}
  <div class="drawer-head-text"><h2 class="drawer-title" id="drawer-title">${title}</h2>${sub ? `<p class="drawer-sub">${sub}</p>` : ''}</div>
  <button type="button" class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('close')}</button>
</header>`;
  }

  function TemplateDrawer() {
    const key = curKey();
    const p = cur();
    const name = productInfo(key).name;
    const cards = D.templates
      .map((t) => {
        const on = p.template === t.id;
        const preview = P.render(key, { L: listing(), p: { ...p, template: t.id }, agent: D.agent }, D.productSpecs[key].sides[0]);
        return `<button type="button" class="tpl ${on ? 'is-on' : ''}" data-act="pickTemplate" data-arg="${t.id}" aria-pressed="${on}">
  <div class="tpl-preview thumb thumb--${key}">${preview}</div>
  <span class="tpl-name">${t.name}${on ? ` <span class="tpl-check">${ic('check')}</span>` : ''}</span>
  <span class="tpl-note">${t.note}${S.defaults[key] === t.id ? ' · default' : ''}</span>
</button>`;
      })
      .join('');
    const isDefault = S.defaults[key] === p.template;
    return `${drawerHead('Template', `Your text, photos, and branding carry over to any template.`)}
<div class="drawer-body"><div class="tpl-grid tpl-grid--${key}">${cards}</div></div>
<footer class="drawer-foot">
  <label class="check" for="f-default">
    <input type="checkbox" id="f-default" data-act-change="toggleDefault" ${isDefault ? 'checked' : ''}>
    <span class="ack-box" aria-hidden="true">${ic('check')}</span>
    <span>Use ${D.templates.find((t) => t.id === p.template).name} as my default for ${name.toLowerCase()}</span>
  </label>
  <button type="button" class="btn btn-primary" data-act="closeDrawer">Done</button>
</footer>`;
  }

  function EditDrawer() {
    const key = curKey();
    const p = cur();
    const L = listing();
    const e = p.edits;
    const b = `products.${key}.edits`;
    const heroes = ['exterior-day', 'exterior-dusk', 'backyard'];
    const heroNames = ['Front · daytime', 'Front · dusk', 'Backyard'];
    return `${drawerHead('Text & photos', 'Changes save automatically and update the proof.')}
<div class="drawer-body">
  <p class="proposal">${ic('edit')} <span><b>Design proposal.</b> A focused editor for the few things agents change most. Not an established requirement.</span></p>
  <div class="field">
    <span class="field-label">Cover photo</span>
    <div class="photo-pick">${heroes
      .map(
        (h, i) => `<button type="button" class="photo-opt ${e.hero === i ? 'is-on' : ''}" data-act="editHero" data-arg="${i}" aria-pressed="${e.hero === i}">
      <span class="photo-opt-img">${A.photo(h)}</span><span class="photo-opt-name">${heroNames[i]}</span>
    </button>`,
      )
      .join('')}</div>
  </div>
  ${field({ bind: `${b}.headline`, label: 'Headline', value: e.headline, attrs: 'maxlength="60"', hint: `${e.headline.length} / 60 characters` })}
  <div class="field">
    <label class="field-label" for="${fid(b + '.desc')}">Description</label>
    <textarea class="input" id="${fid(b + '.desc')}" data-bind="${b}.desc" rows="4" maxlength="220">${esc(e.desc)}</textarea>
    <div class="field-hint">${e.desc.length} / 220 characters</div>
  </div>
  <div class="readonly">
    <span class="field-label">From the listing</span>
    <p>${esc(L.street)} · ${L.price} · ${L.beds} beds · ${L.baths} baths · ${L.sqft} sq ft</p>
    <p class="field-hint">Price and details stay in sync across every product. Edit them on the listing.</p>
  </div>
  <button type="button" class="link link-quiet" data-act="resetEdits">Reset to listing text</button>
</div>
<footer class="drawer-foot"><span class="saved">${p.savedAt ? 'Saved ' + p.savedAt : 'No changes yet'}</span><button type="button" class="btn btn-primary" data-act="closeDrawer">Done</button></footer>`;
  }

  function QrDrawer() {
    const key = curKey();
    const q = cur().qr;
    const b = `products.${key}.qr`;
    if (q.status === 'none') {
      return `${drawerHead('QR code', 'Lets people open a web page by scanning the printed piece.')}
<div class="drawer-body">
  <div class="empty">
    <p class="empty-title">No QR code on this ${D.productSpecs[key].unitName}</p>
    <p class="empty-text">Add one to link to the listing page, photo tour, or open-house sign-up.</p>
    <div class="empty-actions"><button type="button" class="btn btn-secondary" data-act="qrAdd">${ic('plus')} Add QR code</button></div>
  </div>
</div>
<footer class="drawer-foot"><span></span><button type="button" class="btn btn-quiet" data-act="closeDrawer">Close</button></footer>`;
    }
    const v = checkUrl(q.draft);
    const unchangedSaved = q.status === 'saved' && v.state === 'ok' && v.normalized === q.url;
    let msg = '';
    if (v.state === 'ok') {
      msg = unchangedSaved
        ? `<div class="inline-msg inline-msg--ok" role="status">${ic('check')}<span>Saved. Opens <b>${esc(q.url)}</b></span></div>`
        : `<div class="inline-msg inline-msg--ok" role="status">${ic('check')}<span>Looks good, ready to save. Opens <b>${esc(v.normalized)}</b></span></div>`;
    } else if (v.state === 'invalid') {
      msg = `<div class="inline-msg inline-msg--error" role="alert" id="qr-msg">${ic('alert')}<span>${v.msg}${v.suggestion ? ` <button type="button" class="link" data-act="qrSuggest">Use “${esc(v.suggestion)}”</button>` : ''}</span></div>`;
    } else if (q.tried) {
      msg = `<div class="inline-msg inline-msg--error" role="alert" id="qr-msg">${ic('alert')}<span>${v.msg}</span></div>`;
    }
    const canOverride = v.state === 'invalid';
    const saveLabel = v.state === 'invalid' && q.override ? 'Save anyway' : unchangedSaved ? 'Done' : 'Save QR code';
    return `${drawerHead('QR code', 'Printed in the footer. Scanning opens the page below.')}
<div class="drawer-body">
  <div class="qr-layout">
    <div class="qr-preview ${v.state === 'ok' || (canOverride && q.override) ? '' : 'is-muted'}">${A.qr(q.draft || 'empty')}<span>${v.state === 'ok' ? 'Preview' : 'Preview after a valid link'}</span></div>
    <div class="qr-form">
      <div class="field ${v.state === 'ok' || (v.state === 'empty' && !q.tried) ? '' : 'is-invalid'}">
        <label class="field-label" for="${fid(b + '.draft')}">Destination link</label>
        <input class="input" id="${fid(b + '.draft')}" data-bind="${b}.draft" value="${esc(q.draft)}" placeholder="cedarrealty.example/listings/128-willow-lane" ${v.state !== 'ok' && msg ? 'aria-invalid="true" aria-describedby="qr-msg"' : ''} autocomplete="off" spellcheck="false">
      </div>
      ${msg}
      ${
        canOverride
          ? `<label class="check check--sm" for="f-qr-override">
        <input type="checkbox" id="f-qr-override" data-bind="${b}.override" ${q.override ? 'checked' : ''}>
        <span class="ack-box" aria-hidden="true">${ic('check')}</span>
        <span>Use this link anyway. I’ll make sure it opens before printing.</span>
      </label>`
          : ''
      }
    </div>
  </div>
  <p class="fine">We check that the link is complete. We don’t visit the page, so scan the sample to confirm it opens.</p>
</div>
<footer class="drawer-foot">
  <button type="button" class="btn btn-quiet btn-danger" data-act="qrDelete">Remove QR code</button>
  <button type="button" class="btn btn-primary" data-act="qrSave">${saveLabel}</button>
</footer>`;
  }

  const CREATE = [
    { id: 'radius', icon: 'radius', title: 'Radius', sub: 'Homes nearest a center address. Best for new listings.' },
    { id: 'upload', icon: 'upload', title: 'Upload', sub: 'A CSV or Excel file of addresses' },
    { id: 'street', icon: 'street', title: 'Street', sub: 'Every address on streets you pick' },
    { id: 'demo', icon: 'people', title: 'Demographics', sub: 'Households by area and traits' },
    { id: 'crm', icon: 'sync', title: 'CRM Import', sub: 'Contacts from a connected CRM' },
  ];

  function ListsDrawer() {
    const key = curKey();
    const d = cur().delivery;
    const unitName = D.productSpecs[key].unitName;
    if (S.listsView === 'create') {
      return `${drawerHead('Create a list', 'How would you like to find recipients?', 'listsPick')}
<div class="drawer-body"><div class="create-opts">${CREATE.map(
        (c) => `<button type="button" class="create-opt" data-act="createMethod" data-arg="${c.id}">
  <span class="create-ic">${ic(c.icon)}</span>
  <span class="create-text"><b>${c.title}</b><span>${c.sub}</span></span>
  ${ic('chevRight')}
</button>`,
      ).join('')}</div></div>`;
    }
    if (['upload', 'street', 'demo', 'crm'].includes(S.listsView)) {
      const c = CREATE.find((x) => x.id === S.listsView);
      const illus = {
        upload: `<div class="dropzone">${ic('upload')}<b>Drop a CSV or Excel file</b><span>We’ll match name, street, city, state, and ZIP columns, then show you anything we couldn’t read.</span></div>`,
        street: `<div class="illus-list"><div class="illus-row"><b>Willow Ln</b><span>38 addresses</span></div><div class="illus-row"><b>Kinney Ave</b><span>52 addresses</span></div><div class="illus-row is-add">${ic('plus')} Add a street</div></div>`,
        demo: `<div class="illus-list"><div class="illus-row"><b>Area</b><span>ZIP 78704</span></div><div class="illus-row"><b>Home value</b><span>$700k–$1.5M</span></div><div class="illus-row"><b>Length of residence</b><span>7+ years</span></div></div>`,
        crm: `<div class="illus-list"><div class="illus-row"><b>Connected CRM</b><span>Not connected</span></div><div class="illus-row"><b>Import</b><span>Choose a tag or saved search</span></div></div>`,
      }[c.id];
      return `${drawerHead(c.title, c.sub, 'listsCreate')}
<div class="drawer-body">
  <p class="proposal">${ic('info')} <span><b>Illustrative only.</b> This method isn’t developed in the prototype. Radius is the worked example.</span></p>
  ${illus}
</div>
<footer class="drawer-foot"><button type="button" class="btn btn-quiet" data-act="listsCreate">${ic('back')} Other methods</button><button type="button" class="btn btn-secondary" data-act="createMethod" data-arg="radius">Try Radius instead</button></footer>`;
    }
    const r = recipients(d);
    const rows = S.lists
      .map((l) => {
        const on = d.lists.includes(l.id);
        const editing = S.editingList === l.id;
        return `<li class="list-row ${on ? 'is-on' : ''}">
  ${
    editing
      ? `<div class="list-edit">${field({ bind: `listName.${l.id}`, label: '<span class="sr-only">List name</span>', value: l.name })}<button type="button" class="btn btn-secondary btn-sm" data-act="saveListName">Save</button></div>`
      : `<button type="button" class="list-toggle" role="checkbox" aria-checked="${on}" data-act="toggleList" data-arg="${l.id}">
    <span class="box" aria-hidden="true">${on ? ic('check') : ''}</span>
    <span class="list-text"><b>${esc(l.name)}</b><span>${l.source} · Created ${l.created}${l.fresh ? ' · <em>New</em>' : ''}</span></span>
    <span class="list-count">${l.count.toLocaleString()}</span>
  </button>
  <button type="button" class="btn btn-quiet btn-sm" data-act="editList" data-arg="${l.id}" aria-label="Rename ${esc(l.name)}">Rename</button>`
  }
</li>`;
      })
      .join('');
    return `${drawerHead('Mailing lists', `Each address receives one ${unitName}. Choose one or more.`)}
<div class="drawer-body">
  <button type="button" class="create-btn" data-act="listsCreate">${ic('plus')}<span><b>Create list</b><span>Radius, upload, street, demographics, or CRM</span></span></button>
  <div class="list-head"><span>Saved lists</span><span>Recipients</span></div>
  <ul class="list-rows">${rows}</ul>
</div>
<footer class="drawer-foot">
  <span class="drawer-foot-sum">${d.lists.length ? `${plural(d.lists.length, 'list')} · <b>${plural(r, 'recipient')}</b>` : 'No lists selected'}</span>
  <button type="button" class="btn btn-primary" data-act="closeDrawer">${d.lists.length ? 'Use these lists' : 'Done'}</button>
</footer>`;
  }

  function CartDrawer() {
    const keys = configKeys();
    const sub = keys.reduce((s, k) => s + price(k).total, 0);
    const body = S.selected.length
      ? `${keys
          .map((k) => {
            const st = productStatus(k);
            return `<div class="cart-item">
  <div class="cart-thumb">${thumb(k)}</div>
  <div class="cart-text"><b>${productInfo(k).name}</b><span>${deliverySummary(k)}</span><span class="rail-status is-${st.tone}">${st.label}</span></div>
  <span class="cart-amt">${money(price(k).total)}</span>
</div>`;
          })
          .join('')}
${extraKeys()
  .map((k) => `<div class="cart-item cart-item--extra"><div class="cart-text"><b>${productInfo(k).name}</b><span>Set up after you submit</span></div><span class="cart-amt muted">${k === 'fbad' ? '—' : 'Free'}</span></div>`)
  .join('')}
<div class="sum-row sum-total"><span>Subtotal</span><span>${money(sub)}</span></div>
<p class="fine">Tax, credits, and payment come at Review.</p>`
      : `<div class="empty"><p class="empty-title">Nothing in this order yet</p><p class="empty-text">Choose products for ${esc(listing().street)} to get started.</p></div>`;
    return `${drawerHead('Order summary', esc(listing().street))}
<div class="drawer-body">${body}</div>
<footer class="drawer-foot"><span></span><button type="button" class="btn btn-quiet" data-act="closeDrawer">Close</button></footer>`;
  }

  // ---------- radius view ----------
  const H_STREETS = ['Monroe St', 'Annie St', 'Willow Ln', 'Mary St', 'Gibson St'];
  const V_STREETS = ['S 1st St', 'Eva St', 'Kinney Ave', 'Bouldin Ave', 'S 5th St'];
  const HY = [62, 142, 222, 302, 382];
  const VX = [70, 190, 310, 430, 550];
  const CENTER = { x: 310, y: 208 };
  const MI_PER_PX = 0.0021;

  let LOTS = null;
  function lots() {
    if (LOTS) return LOTS;
    const rnd = A.rng(20261031);
    const out = [];
    const multiZone = (x, y) => (x > 440 && y < 170) || (x < 150 && y > 300);
    HY.forEach((y, si) => {
      [-14, 14].forEach((dy, side) => {
        for (let x = 14; x < 600; x += 17) {
          if (VX.some((vx) => Math.abs(vx - x) < 14)) continue;
          const px = x;
          const py = y + dy;
          const num = si === 2 ? 128 + Math.round((x - CENTER.x) / 17) * 4 + side : 1000 + si * 200 + Math.round(x / 17) * 4 + side;
          out.push({ x: px, y: py, addr: `${num} ${H_STREETS[si]}`, multi: multiZone(px, py) || rnd() < 0.12 });
        }
      });
    });
    VX.forEach((x, si) => {
      [-14, 14].forEach((dx, side) => {
        for (let y = 14; y < 420; y += 17) {
          if (HY.some((hy) => Math.abs(hy - y) < 20)) continue;
          const px = x + dx;
          const num = 1800 + si * 100 + Math.round(y / 17) * 2 + side;
          out.push({ x: px, y, addr: `${num} ${V_STREETS[si]}`, multi: multiZone(px, y) || rnd() < 0.12 });
        }
      });
    });
    // the listing itself
    let best = 0;
    out.forEach((l, i) => {
      if (Math.hypot(l.x - CENTER.x, l.y - CENTER.y) < Math.hypot(out[best].x - CENTER.x, out[best].y - CENTER.y)) best = i;
    });
    out[best].target = true;
    out[best].multi = false;
    out[best].addr = '128 Willow Ln';
    CENTER.x = out[best].x;
    CENTER.y = out[best].y;
    out.forEach((l) => (l.d = Math.hypot(l.x - CENTER.x, l.y - CENTER.y)));
    out.sort((a, b) => a.d - b.d);
    LOTS = out;
    return out;
  }

  function radiusResult(R) {
    const all = lots().filter((l) => (R.type === 'both' ? true : R.type === 'multi' ? l.multi : !l.multi)).filter((l) => !(R.exclude && l.target));
    const qty = Math.max(0, Number(R.qty) || 0);
    const picked = all.slice(0, qty);
    const radiusPx = picked.length ? picked[picked.length - 1].d + 8 : 0;
    return { available: all.length, picked, radiusPx, miles: radiusPx * MI_PER_PX };
  }

  function RadiusView() {
    const R = S.radius;
    if (!R) return '';
    const key = curKey();
    const L = listing();
    const res = radiusResult(R);
    const qty = Number(R.qty) || 0;
    const typeLabel = { single: 'single-family homes', multi: 'multi-family units', both: 'homes' }[R.type];
    const qtyErr =
      qty < 1
        ? 'Enter how many addresses you want.'
        : qty > res.available
        ? `Only ${res.available} ${typeLabel} are in range. Lower the number${R.type === 'single' ? ' or include multi-family' : ''}.`
        : '';
    const zipErr = /^\d{5}$/.test(String(R.zip).trim()) ? '' : 'Enter a 5-digit ZIP.';
    const addrErr = String(R.center).trim() ? '' : 'Enter a center address.';
    const ok = !qtyErr && !zipErr && !addrErr;
    const each = r2(unitPrint(key) + POSTAGE[cur().delivery.cls]);
    const pickedSet = new Set(res.picked);

    const blocks = [];
    for (let i = 0; i < VX.length + 1; i++) {
      for (let j = 0; j < HY.length + 1; j++) {
        const x0 = i === 0 ? 0 : VX[i - 1] + 7;
        const x1 = i === VX.length ? 600 : VX[i] - 7;
        const y0 = j === 0 ? 0 : HY[j - 1] + 7;
        const y1 = j === HY.length ? 420 : HY[j] - 7;
        blocks.push(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="4" fill="${i === 0 && j === 2 ? '#d9e6d4' : '#f7f5ef'}"/>`);
      }
    }
    const lotDots = lots()
      .map((l) => {
        if (l.target) return '';
        const on = pickedSet.has(l);
        return `<circle cx="${l.x}" cy="${l.y}" r="${on ? 3.6 : 2.2}" fill="${on ? '#2f6f4e' : l.multi ? '#c7c2b6' : '#d6d2c8'}" ${on ? 'stroke="#fff" stroke-width="1"' : ''}/>`;
      })
      .join('');
    const map = `<svg class="map" viewBox="0 0 600 420" role="img" aria-label="Map of ${res.picked.length} selected addresses around ${esc(L.street)}">
  <rect width="600" height="420" fill="#e7e9e1"/>
  ${blocks.join('')}
  <path d="M0 400 C120 360 160 420 260 395 S420 360 600 410" stroke="#bcd6e0" stroke-width="9" fill="none"/>
  <g stroke="#fff" stroke-width="10">${HY.map((y) => `<line x1="0" y1="${y}" x2="600" y2="${y}"/>`).join('')}${VX.map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="420"/>`).join('')}</g>
  <g font-size="8.5" fill="#8b8f86" font-family="Inter, sans-serif" letter-spacing=".3">${HY.map((y, i) => `<text x="${i === 2 ? 18 : 448}" y="${y + 3}">${H_STREETS[i]}</text>`).join('')}${VX.map((x, i) => `<text x="${x + 3}" y="${i % 2 ? 412 : 12}" transform="rotate(90 ${x + 3} ${i % 2 ? 412 : 12})" text-anchor="${i % 2 ? 'end' : 'start'}">${V_STREETS[i]}</text>`).join('')}</g>
  <text x="18" y="250" font-size="9" fill="#6f8a66" font-family="Inter, sans-serif">Willow Commons Park</text>
  ${res.radiusPx ? `<circle cx="${CENTER.x}" cy="${CENTER.y}" r="${res.radiusPx}" fill="#2f6f4e" fill-opacity=".07" stroke="#2f6f4e" stroke-width="1.5" stroke-dasharray="5 4"/>` : ''}
  ${lotDots}
  <g transform="translate(${CENTER.x} ${CENTER.y})">
    <path d="M0 0 C-7 -9 -10 -13 -10 -18 A10 10 0 0 1 10 -18 C10 -13 7 -9 0 0z" fill="${R.exclude ? '#1f2328' : '#2f6f4e'}" stroke="#fff" stroke-width="1.5"/>
    <circle cy="-18" r="3.5" fill="#fff"/>
  </g>
  <g transform="translate(${CENTER.x + 14} ${CENTER.y - 30})"><rect width="122" height="20" rx="10" fill="#1f2328"/><text x="61" y="13.5" font-size="9.5" text-anchor="middle" fill="#fff" font-family="Inter, sans-serif">128 Willow Ln${R.exclude ? ' · excluded' : ''}</text></g>
</svg>`;

    const preview = (R.showAll ? res.picked : res.picked.slice(0, 6))
      .map((l) => `<li><span>${l.addr}${l.target ? ' <em>(this listing)</em>' : ''}</span><span>${l.multi ? 'Multi-family' : 'Single-family'}</span><span>${(l.d * MI_PER_PX).toFixed(2)} mi</span></li>`)
      .join('');

    const types = [
      ['single', 'Single-family'],
      ['multi', 'Multi-family'],
      ['both', 'Both'],
    ];

    return `<div class="focus" role="dialog" aria-modal="true" aria-labelledby="rad-title">
  <header class="focus-head">
    <button type="button" class="btn btn-quiet" data-act="cancelRadius">${ic('back')} Back to order</button>
    <div class="focus-head-text"><h2 class="focus-title" id="rad-title">New radius list</h2><span class="muted">For ${productInfo(key).name.toLowerCase()} · ${esc(L.street)}</span></div>
    <span></span>
  </header>
  <div class="focus-body">
    <aside class="rad-form">
      ${field({ bind: 'radius.center', label: 'Center address', value: R.center, error: addrErr, hint: 'Starts at your listing.' })}
      ${field({ bind: 'radius.zip', label: 'ZIP', value: R.zip, attrs: 'inputmode="numeric" maxlength="5"', error: zipErr, cls: 'field--zip' })}
      <div class="field">
        <span class="field-label" id="rad-qty-l">How many addresses?</span>
        <div class="qty qty--stack">
          <div class="seg" role="group" aria-labelledby="rad-qty-l">${[25, 50, 100, 250].map((n) => `<button type="button" class="seg-btn ${qty === n ? 'is-on' : ''}" data-act="radQty" data-arg="${n}" aria-pressed="${qty === n}">${n}</button>`).join('')}</div>
          ${field({ bind: 'radius.qty', label: '<span class="sr-only">Exact number</span>', value: R.qty, type: 'number', cls: 'field--qty', attrs: 'min="1"', error: qtyErr })}
        </div>
        <div class="field-hint">We pick the nearest matching addresses first.</div>
      </div>
      <div class="field">
        <span class="field-label" id="rad-type-l">Home type</span>
        <div class="seg seg--full" role="group" aria-labelledby="rad-type-l">${types.map(([v, l]) => `<button type="button" class="seg-btn ${R.type === v ? 'is-on' : ''}" data-act="radType" data-arg="${v}" aria-pressed="${R.type === v}">${l}</button>`).join('')}</div>
      </div>
      ${toggle({ bind: 'radius.exclude', checked: R.exclude, label: `Exclude ${esc(L.street)}`, sub: 'Don’t mail the listing itself.' })}
      ${field({ bind: 'radius.name', label: 'List name', value: R.name, hint: 'Saved to your lists for reuse.' })}
    </aside>
    <section class="rad-main">
      <div class="rad-result">
        <div><b class="rad-count">${ok ? res.picked.length : '—'}</b> <span>${ok ? `${typeLabel} within ${res.miles.toFixed(2)} mi` : 'Adjust the settings to see results'}</span></div>
        <span class="muted">${res.available} ${typeLabel} in range</span>
      </div>
      <div class="map-wrap">${map}
        <div class="map-legend"><span><i class="lg lg-on"></i>Selected</span><span><i class="lg"></i>Not selected</span><span><i class="lg lg-pin"></i>Listing</span></div>
      </div>
      <div class="rad-preview">
        <div class="rad-preview-head"><b>Who receives it</b><span class="muted">Nearest first</span></div>
        <ul class="rad-list ${R.showAll ? 'is-all' : ''}">${ok ? preview : ''}</ul>
        ${ok && res.picked.length > 6 ? `<button type="button" class="link link-quiet" data-act="radAll">${R.showAll ? 'Show fewer' : `Show all ${res.picked.length}`}</button>` : ''}
      </div>
    </section>
  </div>
  <footer class="focus-foot">
    <div class="footbar-summary"><span class="fs-label">Adds to this mailing</span><span class="fs-value">${ok ? `${plural(res.picked.length, 'recipient')} · <b>+${money(res.picked.length * each)}</b> <span class="muted">at ${money(each)} each</span>` : '—'}</span></div>
    <div class="footbar-actions">
      <button type="button" class="btn btn-quiet" data-act="cancelRadius">Cancel</button>
      <button type="button" class="btn btn-primary btn-lg" data-act="confirmRadius" ${ok ? '' : 'aria-disabled="true"'}>${ok ? `Add ${res.picked.length} recipients` : 'Add recipients'}</button>
    </div>
  </footer>
</div>`;
  }

  function Toast() {
    if (!S.toast) return '';
    return `<div class="toast" role="status">${ic('check')}<span>${S.toast}</span></div>`;
  }

  // ---------- actions ----------
  let toastTimer = null;
  function toast(msg) {
    S.toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      S.toast = null;
      render();
    }, 2800);
  }

  function go(step) {
    S.step = step;
    S.maxStep = Math.max(S.maxStep, stepIndex(step));
    S.breakdownOpen = false;
    S.drawer = null;
    window.scrollTo(0, 0);
  }

  function markChanged(p) {
    const now = new Date();
    p.savedAt = 'just now · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (p.approved) {
      p.approved = false;
      p.changed = true;
    }
  }

  const ACT = {
    noop() {},
    toggleListingMenu() {
      S.listingMenu = !S.listingMenu;
    },
    pickListing(id) {
      S.listingMenu = false;
      if (id === S.listingId) return;
      S.listingId = id;
      Object.values(S.products).forEach((p) => {
        p.edits = defaultEdits(listing());
        p.approved = false;
      });
      toast(`Now ordering for ${listing().street}`);
    },
    toggleProduct(k) {
      const i = S.selected.indexOf(k);
      if (i >= 0) S.selected.splice(i, 1);
      else S.selected.push(k);
      if (CONFIG_KEYS.includes(k) && !S.products[k]) S.products[k] = makeProduct(k);
      S.attempt.products = false;
    },
    startDesign() {
      if (!configKeys().length) {
        S.attempt.products = true;
        return;
      }
      S.cur = Math.min(S.cur, configKeys().length - 1);
      go('design');
    },
    goStep(id) {
      if (stepIndex(id) > S.maxStep) return;
      go(id);
    },
    pickProduct(i) {
      S.cur = Number(i);
      S.breakdownOpen = false;
      window.scrollTo(0, 0);
    },
    side(s) {
      cur().side = s;
    },
    openDrawer(name) {
      S.drawer = name;
      if (name === 'qr') {
        const q = cur().qr;
        if (q.status === 'saved') q.draft = q.url;
        q.tried = false;
      }
    },
    closeDrawer() {
      S.drawer = null;
      S.editingList = null;
    },
    pickTemplate(id) {
      const p = cur();
      if (p.template === id) return;
      p.template = id;
      markChanged(p);
    },
    toggleDefault() {
      const k = curKey();
      const p = cur();
      if (S.defaults[k] === p.template) delete S.defaults[k];
      else S.defaults[k] = p.template;
    },
    editHero(i) {
      const p = cur();
      p.edits.hero = Number(i);
      markChanged(p);
    },
    resetEdits() {
      const p = cur();
      p.edits = defaultEdits(listing());
      markChanged(p);
    },
    fixQr(key) {
      S.cur = configKeys().indexOf(key);
      if (S.step !== 'design') go('design');
      ACT.openDrawer('qr');
      S.focusAfter = fid(`products.${key}.qr.draft`);
    },
    qrSuggest() {
      const q = cur().qr;
      const v = checkUrl(q.draft);
      if (v.suggestion) q.draft = v.suggestion;
      q.override = false;
    },
    qrSave() {
      const p = cur();
      const q = p.qr;
      const v = checkUrl(q.draft);
      q.tried = true;
      if (v.state === 'ok') {
        const changed = q.url !== v.normalized || q.status !== 'saved';
        q.url = v.normalized;
        q.draft = v.normalized;
        q.status = 'saved';
        q.override = false;
        S.drawer = null;
        if (changed) {
          markChanged(p);
          toast('QR code saved to your proof');
        }
      } else if (v.state === 'invalid' && q.override) {
        q.url = q.draft.trim();
        q.status = 'saved';
        S.drawer = null;
        markChanged(p);
        toast('QR code saved with your link as entered');
      } else if (v.state === 'invalid') {
        S.focusAfter = fid(`products.${curKey()}.qr.draft`);
      }
    },
    qrDelete() {
      const p = cur();
      p.qr = { status: 'none', url: '', draft: '', override: false, tried: false };
      S.drawer = null;
      markChanged(p);
      toast('QR code removed');
    },
    qrAdd() {
      const q = cur().qr;
      const other = Object.values(S.products).find((x) => x.qr.status === 'saved');
      q.status = 'draft';
      q.draft = other ? other.qr.url : '';
      q.tried = false;
      S.focusAfter = fid(`products.${curKey()}.qr.draft`);
    },
    approve() {
      const key = curKey();
      const p = cur();
      if (designIssues(key).length) {
        S.attempt.design = true;
        return;
      }
      S.attempt.design = false;
      p.approved = true;
      p.changed = false;
      go('delivery');
    },
    back() {
      if (S.step === 'design') {
        if (S.cur > 0) {
          S.cur -= 1;
          go('delivery');
        } else go('products');
      } else if (S.step === 'delivery') go('design');
      else if (S.step === 'review') {
        S.cur = configKeys().length - 1;
        go('delivery');
      }
    },
    qtyPreset(n) {
      cur().delivery.qty = Number(n);
    },
    focusQty(key) {
      S.focusAfter = fid(`products.${key}.delivery.qty`);
    },
    toggleOptions() {
      const d = cur().delivery;
      d.optionsOpen = !d.optionsOpen;
    },
    openOptions(key) {
      S.products[key].delivery.optionsOpen = true;
    },
    fixSample(key) {
      const d = S.products[key].delivery;
      d.optionsOpen = true;
      const miss = addrMissing(d.sampleAddr);
      const map = { name: 'name', street: 'street1', city: 'city', state: 'state', zip: 'zip' };
      S.focusAfter = fid(`products.${key}.delivery.sampleAddr.${map[miss[0]] || 'zip'}`);
    },
    useOffice(key) {
      S.products[key].delivery.sampleAddr = { ...D.officeAddress };
      toast('Sample address set to the Cedar Realty office');
    },
    editShip(key) {
      const d = S.products[key || curKey()].delivery;
      d.shipEdit = !d.shipEdit;
    },
    openLists(key) {
      if (key !== undefined && key !== '') S.cur = configKeys().indexOf(key);
      if (S.step !== 'delivery') go('delivery');
      S.drawer = 'lists';
      S.listsView = 'pick';
    },
    openCreate() {
      S.drawer = 'lists';
      S.listsView = 'create';
    },
    listsPick() {
      S.listsView = 'pick';
    },
    listsCreate() {
      S.listsView = 'create';
    },
    createMethod(m) {
      if (m === 'radius') {
        const L = listing();
        S.drawer = null;
        S.radius = { center: L.street, zip: L.zip, qty: 50, type: 'single', exclude: true, name: `${L.street.replace(/^\d+\s/, '')} · nearby homes`, showAll: false };
        window.scrollTo(0, 0);
      } else S.listsView = m;
    },
    toggleList(id) {
      const d = cur().delivery;
      const i = d.lists.indexOf(id);
      if (i >= 0) d.lists.splice(i, 1);
      else d.lists.push(id);
    },
    removeList(id) {
      const d = cur().delivery;
      d.lists = d.lists.filter((x) => x !== id);
    },
    editList(id) {
      S.editingList = id;
      S.focusAfter = fid(`listName.${id}`);
    },
    saveListName() {
      S.editingList = null;
    },
    radQty(n) {
      S.radius.qty = Number(n);
    },
    radType(t) {
      S.radius.type = t;
    },
    radAll() {
      S.radius.showAll = !S.radius.showAll;
    },
    cancelRadius() {
      S.radius = null;
    },
    confirmRadius() {
      const R = S.radius;
      const res = radiusResult(R);
      const qty = Number(R.qty) || 0;
      if (!(qty >= 1 && qty <= res.available && /^\d{5}$/.test(String(R.zip).trim()) && String(R.center).trim())) return;
      const id = 'r' + Date.now();
      S.lists.unshift({ id, name: R.name.trim() || 'Radius list', count: res.picked.length, created: TODAY, source: 'Radius', fresh: true });
      cur().delivery.lists.push(id);
      S.radius = null;
      toast(`Added ${res.picked.length} nearby recipients`);
    },
    deliveryNext() {
      const key = curKey();
      const p = cur();
      p.deliveryVisited = true;
      const issues = deliveryIssues(key);
      if (issues.length) {
        S.attempt['delivery-' + key] = true;
        if (issues.some((x) => x.field === 'sample')) p.delivery.optionsOpen = true;
        return;
      }
      S.attempt['delivery-' + key] = false;
      if (S.cur < configKeys().length - 1) {
        S.cur += 1;
        go('design');
      } else go('review');
    },
    toggleBreakdown() {
      S.breakdownOpen = !S.breakdownOpen;
    },
    editProduct(i) {
      S.cur = Number(i);
      go('design');
    },
    fixDelivery(i) {
      S.cur = Number(i);
      go('delivery');
    },
    openPromo() {
      S.review.promoOpen = true;
      S.focusAfter = fid('review.promoInput');
    },
    applyPromo() {
      const R = S.review;
      if (R.promoInput.trim().toUpperCase() === D.credits.promo.code) {
        R.promoApplied = true;
        R.promoError = '';
        R.promoOpen = false;
        toast(`${D.credits.promo.code} applied · ${D.credits.promo.label}`);
      } else {
        R.promoError = R.promoInput.trim() ? 'That code isn’t valid for this order. Check the spelling.' : 'Enter a code first.';
        S.focusAfter = fid('review.promoInput');
      }
    },
    removePromo() {
      S.review.promoApplied = false;
      S.review.promoInput = '';
    },
    togglePay() {
      S.review.payOpen = !S.review.payOpen;
    },
    saveCard() {
      const R = S.review;
      const c = R.addCard;
      R.addCardTried = true;
      const digits = c.number.replace(/\D/g, '');
      if (!c.name.trim() || digits.length < 15 || !/^\d{2}\/\d{2}$/.test(c.exp) || !/^\d{5}$/.test(c.zip)) return;
      const brand = digits[0] === '4' ? 'Visa' : digits[0] === '5' ? 'Mastercard' : digits[0] === '3' ? 'Amex' : 'Card';
      const id = 'c' + Date.now();
      S.cards.push({ id, brand, last4: digits.slice(-4), exp: c.exp });
      R.pay = id;
      R.payOpen = false;
      R.addCard = { name: '', number: '', exp: '', zip: '' };
      R.addCardTried = false;
      toast(`${brand} ending ${digits.slice(-4)} added (simulated)`);
    },
    focus(id) {
      S.focusAfter = id;
    },
    submit() {
      if (reviewIssues().length) {
        S.attempt.review = true;
        return;
      }
      S.lastTotals = totals();
      S.lastPay = S.review.pay;
      S.orderNo = 'APM-26' + String(Math.floor(10000 + Math.random() * 89999));
      go('done');
    },
    newOrder() {
      S.step = 'products';
      S.maxStep = 0;
      S.selected = [];
      S.products = {};
      S.cur = 0;
      S.attempt = {};
      S.review = newReview();
      window.scrollTo(0, 0);
    },
  };

  // ---------- binding ----------
  function setPath(path, value) {
    if (path.startsWith('listName.')) {
      const l = listById(path.slice(9));
      if (l) l.name = value;
      return;
    }
    const parts = path.split('.');
    let o = S;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }

  function afterBind(path) {
    const m = path.match(/^products\.(\w+)\.edits\./);
    if (m) markChanged(S.products[m[1]]);
    if (path.endsWith('.qr.draft')) {
      const q = getQrFromPath(path);
      if (q) q.override = false;
    }
    if (path === 'review.promoInput') S.review.promoError = '';
    if (path === 'review.pay') {
      if (S.review.pay !== 'new' && S.review.pay !== 'split') S.review.payOpen = false;
      if (S.review.pay === 'split' && !S.review.splitAmt) S.review.splitAmt = '';
    }
  }

  function getQrFromPath(path) {
    const k = path.split('.')[1];
    return S.products[k]?.qr;
  }

  $app.addEventListener('click', (e) => {
    let changed = false;
    if (S.listingMenu && !e.target.closest('.listing-switch')) {
      S.listingMenu = false;
      changed = true;
    }
    const el = e.target.closest('[data-act]');
    if (el && !el.matches('input')) {
      if (el.getAttribute('aria-disabled') === 'true') return;
      const fn = ACT[el.dataset.act];
      if (fn) {
        fn(el.dataset.arg);
        changed = true;
      }
    }
    if (changed) render();
  });

  $app.addEventListener('input', (e) => {
    const el = e.target.closest('[data-bind]');
    if (!el || el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') return;
    let v = el.value;
    if (el.dataset.type === 'num') v = v === '' ? '' : Number(v);
    setPath(el.dataset.bind, v);
    afterBind(el.dataset.bind);
    render();
  });

  $app.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.actChange) {
      ACT[el.dataset.actChange]();
      render();
      return;
    }
    if (!el.dataset.bind) return;
    if (el.type === 'checkbox') setPath(el.dataset.bind, el.checked);
    else if (el.type === 'radio') {
      if (!el.checked) return;
      setPath(el.dataset.bind, el.value);
    } else if (el.tagName === 'SELECT') setPath(el.dataset.bind, el.value);
    else return;
    afterBind(el.dataset.bind);
    render();
  });

  $app.addEventListener('keydown', (e) => {
    const el = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && el.matches('[data-act][role="button"]:not(button)')) {
      e.preventDefault();
      el.click();
    }
    if (e.key === 'Enter' && el.dataset?.bind === 'review.promoInput') {
      ACT.applyPromo();
      render();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (S.radius) S.radius = null;
    else if (S.drawer) S.drawer = null;
    else if (S.listingMenu) S.listingMenu = false;
    else return;
    render();
  });

  // ---------- render ----------
  function render() {
    const a = document.activeElement;
    const focus = a && a.id && $app.contains(a) ? { id: a.id, start: a.selectionStart, end: a.selectionEnd } : null;
    const scrollers = {};
    $app.querySelectorAll('[data-keep-scroll], .drawer-body, .rad-form, .rad-list').forEach((n, i) => (scrollers[i] = n.scrollTop));

    let screen = '';
    if (S.step === 'products') screen = ProductsStep();
    else if (S.step === 'design') screen = DesignStep();
    else if (S.step === 'delivery') screen = DeliveryStep();
    else if (S.step === 'review') screen = ReviewStep();
    else screen = DoneStep();

    document.body.classList.toggle('is-locked', !!(S.drawer || S.radius));
    $app.innerHTML = Header() + (S.step === 'done' ? '' : ContextBar()) + screen + Drawer() + RadiusView() + Toast();

    $app.querySelectorAll('[data-keep-scroll], .drawer-body, .rad-form, .rad-list').forEach((n, i) => {
      if (scrollers[i]) n.scrollTop = scrollers[i];
    });

    const targetId = S.focusAfter || (focus && focus.id);
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.focus({ preventScroll: !S.focusAfter });
        if (S.focusAfter && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (!S.focusAfter && focus && focus.start != null) {
          try {
            el.setSelectionRange(focus.start, focus.end);
          } catch (err) {
            // number inputs don't support selection ranges
          }
        }
      }
      S.focusAfter = null;
    }
  }

  render();
})();
