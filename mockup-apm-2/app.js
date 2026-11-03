// APM ordering prototype — local state only. Rendering is a full re-render of #app on each change,
// with focus and scroll restored so inputs stay usable.
(() => {
  const D = window.DATA;
  const A = window.Art;
  const PR = window.Proof;
  const $root = document.getElementById('app');
  const ic = A.icon;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r2 = n => Math.round(n * 100) / 100;
  const money = n => (n == null ? '—' : (n < 0 ? '−' : '') + '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  const clone = o => JSON.parse(JSON.stringify(o));
  const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const PRODUCT = Object.fromEntries(D.products.map(p => [p.id, p]));
  const SINGULAR = { flyer: 'Flyer', brochure: 'Brochure', postcard: 'Postcard', social: 'Social Media', image: 'Image Download', fbad: 'Facebook Ad' };
  const DETAILED = ['flyer', 'brochure', 'postcard'];
  const blankAddr = () => ({ name: '', company: '', street1: '', street2: '', city: '', state: '', zip: '' });
  const addrComplete = a => !!(a.name.trim() && a.street1.trim() && a.city.trim() && /^[A-Za-z]{2}$/.test(a.state.trim()) && /^\d{5}(-\d{4})?$/.test(a.zip.trim()));
  const addrLine = a => [a.company || a.name, a.street1, a.street2, `${a.city}, ${a.state} ${a.zip}`].filter(Boolean).join(' · ');

  // ---------------------------------------------------------------- state
  const productConfig = pid => {
    const cfg = {
      template: 'modern',
      version: 1,
      reviewedVersion: 0,
      savedAt: null,
      page: null,
      content: { headline: '', tagline: '', blurb: '', hero: 'exterior' },
      qr: { open: false, url: '', status: 'none', savedUrl: '', error: '', errorKind: '', override: false, confirmDelete: false, note: '' },
      dist: 'ship',
      ship: { qty: 100, editAddr: false, addr: { ...D.agent.office } },
      pickup: { qty: 100, location: 'lamar' },
      download: { format: 'pdf' },
      mail: { lists: [], sample: false, sampleAddr: blankAddr(), mailClass: 'standard' },
      paper: 'gloss100',
      pdfAddon: false,
    };
    if (pid === 'flyer') {
      cfg.pdfAddon = true;
      Object.assign(cfg.qr, { open: true, url: 'cedarrealty.example/listngs/128-willow-lane', status: 'draft' });
    }
    if (pid === 'brochure') Object.assign(cfg, { dist: 'mail', mail: { ...cfg.mail, lists: ['zilker'], sample: true } });
    if (pid === 'postcard') Object.assign(cfg, { dist: 'mail', paper: 'gloss14', mail: { ...cfg.mail, lists: ['zilker'] } });
    return cfg;
  };

  const initState = () => ({
    view: 'start',
    listingId: 'willow',
    listingMenu: false,
    listingQuery: '',
    selected: ['flyer', 'brochure'],
    active: 'flyer',
    products: { flyer: productConfig('flyer'), brochure: productConfig('brochure'), postcard: productConfig('postcard') },
    defaults: {},
    lists: clone(D.savedLists),
    drawer: null,
    editList: null,
    radius: { center: '128 Willow Lane', zip: '78704', qty: 50, sf: true, mf: false, exclude: true, name: '', nameEdited: false },
    modal: null,
    draft: null,
    editorConfirm: false,
    ck: 'products',
    credits: { code: '', promo: null, promoErr: '', storeOn: false, store: 20, adOn: false, ad: 30 },
    pay: {
      sel: { corp: true },
      amt: {},
      costCenter: '',
      org: D.payment.orgs[0],
      comment: '',
      ack: false,
      tried: false,
      addCard: false,
      newCard: { name: '', number: '', exp: '', cvc: '', zip: '' },
      cardErr: '',
      cards: clone(D.payment.cards),
    },
    toast: null,
    hl: null,
    order: null,
  });

  let S = initState();
  const L = () => D.listings.find(l => l.id === S.listingId);
  const cfgOf = pid => S.products[pid];
  const listById = id => S.lists.find(l => l.id === id);
  const mailed = cfg => cfg.mail.lists.reduce((s, id) => s + (listById(id)?.qty || 0), 0);
  const printed = cfg => mailed(cfg) + (cfg.mail.sample ? 1 : 0);

  // ---------------------------------------------------------------- pricing + readiness
  const lineItems = pid => {
    const cfg = cfgOf(pid);
    if (!DETAILED.includes(pid)) {
      if (pid === 'fbad') return [{ label: 'Ad budget · 7 days', amount: 25 }];
      return [{ label: 'Included free', amount: 0 }];
    }
    const pp = D.pricing[pid];
    const paper = pp.papers[cfg.paper];
    const items = [];
    if (cfg.dist === 'mail') {
      const n = mailed(cfg);
      const cls = D.mailClasses[cfg.mail.mailClass];
      if (paper.mailUnavailable) items.push({ label: `${n} mailed pieces`, detail: 'Not priced for this paper', amount: null });
      else {
        const each = r2(pp.mail[cfg.mail.mailClass] + paper.mailDelta);
        items.push({ label: `${n} mailed pieces · ${cls.label}`, detail: `${n} × ${money(each)} print + postage`, amount: r2(n * each) });
      }
      if (cfg.mail.sample) items.push({ label: 'Agent sample copy', detail: '1 × $1.00 · sent First Class', amount: D.pricing.sampleCopy });
      cfg.mail.lists.map(listById).filter(l => l && l.radius).forEach(l => {
        items.push({ label: `Address data · ${l.name}`, detail: `${l.qty} × ${money(D.pricing.radiusRecord)}`, amount: r2(l.qty * D.pricing.radiusRecord) });
      });
    } else if (cfg.dist === 'ship' || cfg.dist === 'pickup') {
      const q = cfg[cfg.dist].qty;
      items.push({ label: `${q} printed · ${paper.label}`, detail: `${q} × ${money(paper.print)}`, amount: r2(q * paper.print) });
      if (cfg.dist === 'ship') items.push({ label: 'Shipping to agent', detail: 'Flat rate, one box', amount: D.pricing.shipFee });
      else items.push({ label: 'Print center pickup', detail: 'No charge', amount: 0 });
    } else {
      items.push(cfg.download.format === 'pdf'
        ? { label: 'Print-ready PDF download', amount: D.pricing.downloadPdf }
        : { label: 'JPG download', detail: 'Free', amount: 0 });
    }
    if (cfg.pdfAddon && cfg.dist !== 'download') items.push({ label: 'PDF copy add-on', detail: 'Digital file of this design', amount: D.pricing.pdfAddon });
    return items;
  };
  const productTotal = pid => {
    const items = lineItems(pid);
    if (items.some(i => i.amount == null)) return null;
    return r2(items.reduce((s, i) => s + i.amount, 0));
  };

  const issues = pid => {
    const cfg = cfgOf(pid);
    if (!DETAILED.includes(pid)) return [];
    const out = [];
    const pp = D.pricing[pid];
    const paper = pp.papers[cfg.paper];
    if (cfg.reviewedVersion !== cfg.version) {
      out.push({ sec: 'review', text: cfg.reviewedVersion ? 'Design changed after your review — check the proof again' : 'Review the proof' });
    }
    const q = cfg.qr;
    if (q.status === 'invalid') out.push({ sec: 'qr', text: 'QR code link needs attention' });
    else if (q.status === 'draft' || q.status === 'valid') out.push({ sec: 'qr', text: 'QR code change isn’t saved' });
    if (cfg.dist === 'mail') {
      if (!cfg.mail.lists.length) out.push({ sec: 'audience', text: 'Choose at least one mailing list' });
      if (cfg.mail.sample && !addrComplete(cfg.mail.sampleAddr)) out.push({ sec: 'sample', text: 'Add an address for the sample copy' });
      if (paper.mailUnavailable) out.push({ sec: 'paper', text: `${paper.label} isn’t available for Mail` });
    }
    if ((cfg.dist === 'ship' || cfg.dist === 'pickup') && cfg[cfg.dist].qty < pp.minQty) out.push({ sec: 'qty', text: `Order at least ${pp.minQty} pieces` });
    if (cfg.dist === 'ship' && !addrComplete(cfg.ship.addr)) out.push({ sec: 'qty', text: 'Complete the shipping address' });
    return out;
  };
  const allIssues = () => S.selected.flatMap(pid => issues(pid).map(i => ({ ...i, pid })));

  const totals = () => {
    const subtotal = r2(S.selected.reduce((s, pid) => s + (productTotal(pid) || 0), 0));
    const tax = r2(subtotal * D.pricing.taxRate);
    let due = r2(subtotal + tax);
    const promo = S.credits.promo ? Math.min(D.credits.promoCodes[S.credits.promo].amount, due) : 0;
    due = r2(due - promo);
    const store = S.credits.storeOn ? r2(Math.max(0, Math.min(Number(S.credits.store) || 0, D.credits.storeCredit, due))) : 0;
    due = r2(due - store);
    const ad = S.credits.adOn ? r2(Math.max(0, Math.min(Number(S.credits.ad) || 0, D.credits.adBudget, due))) : 0;
    due = r2(due - ad);
    const methods = Object.keys(S.pay.sel).filter(k => S.pay.sel[k]);
    const alloc = {};
    methods.forEach(m => { alloc[m] = methods.length === 1 ? due : r2(Number(S.pay.amt[m]) || 0); });
    const allocated = r2(Object.values(alloc).reduce((s, n) => s + n, 0));
    return { subtotal, tax, promo, store, ad, due, methods, alloc, allocated, balance: r2(due - allocated) };
  };

  const distMeta = pid => {
    const cfg = cfgOf(pid);
    if (!DETAILED.includes(pid)) return pid === 'fbad' ? '7-day campaign' : 'Digital · free';
    if (cfg.dist === 'mail') return `Mail · ${mailed(cfg)} recipients${cfg.mail.sample ? ' + sample' : ''}`;
    if (cfg.dist === 'ship') return `Ship · ${cfg.ship.qty} copies`;
    if (cfg.dist === 'pickup') return `Pickup · ${cfg.pickup.qty} copies`;
    return `Download · ${cfg.download.format.toUpperCase()}`;
  };

  // ---------------------------------------------------------------- QR check (simulated, no network)
  const knownPaths = new Set(['', '/agents/jordan-ellis', ...D.listings.map(l => new URL(l.url).pathname)]);
  const checkUrl = raw => {
    const t = raw.trim();
    if (!t) return { ok: false, kind: 'required', msg: 'Enter the page people should land on when they scan the code.' };
    let u = t;
    const added = !/^https?:\/\//i.test(u);
    if (added) u = 'https://' + u;
    let parsed;
    try { parsed = new URL(u); } catch { parsed = null; }
    if (!parsed || /\s/.test(t) || !/\.[a-z]{2,}$/i.test(parsed.hostname)) {
      return { ok: false, kind: 'format', msg: 'This doesn’t look like a web address. Try something like cedarrealty.example/listings/128-willow-lane' };
    }
    if (parsed.hostname === 'cedarrealty.example' && !knownPaths.has(parsed.pathname.replace(/\/$/, ''))) {
      return { ok: false, kind: 'unconfirmed', url: u, msg: 'We couldn’t confirm a live page at this address. Check the spelling — or, if you know it’s right (for example, the page goes live on listing day), you can use it anyway.' };
    }
    return { ok: true, url: u, added };
  };

  // ---------------------------------------------------------------- small UI helpers
  const statusPill = pid => {
    const n = issues(pid).length;
    return n
      ? `<span class="pill pill-warn">${ic('alert')}${n} to fix</span>`
      : `<span class="pill pill-ok">${ic('check')}Ready</span>`;
  };
  const productIcon = { flyer: 'file', brochure: 'layers', postcard: 'mail', social: 'share', image: 'image', fbad: 'megaphone' };
  const field = (label, bind, val, opts = {}) => `
    <label class="field ${opts.cls || ''} ${opts.error ? 'has-error' : ''}">
      <span class="field-label">${label}${opts.optional ? ' <em>optional</em>' : ''}</span>
      <input ${opts.type ? `type="${opts.type}"` : ''} data-bind="${bind}" value="${esc(val)}" ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''} ${opts.num ? 'data-num="1" inputmode="numeric"' : ''} ${opts.attrs || ''}>
      ${opts.error ? `<span class="field-error">${ic('alert')}${opts.error}</span>` : ''}
    </label>`;
  const toggle = (bind, on, label, sub) => `
    <label class="toggle">
      <input type="checkbox" data-bind="${bind}" ${on ? 'checked' : ''}>
      <span class="toggle-track" aria-hidden="true"><i></i></span>
      <span class="toggle-text"><b>${label}</b>${sub ? `<span>${sub}</span>` : ''}</span>
    </label>`;
  const callout = (kind, title, body, actions = '') => `
    <div class="callout callout-${kind}" role="${kind === 'error' ? 'alert' : 'status'}">
      ${ic(kind === 'ok' ? 'check' : kind === 'info' ? 'info' : 'alert')}
      <div><b>${title}</b>${body ? `<p>${body}</p>` : ''}${actions ? `<div class="callout-actions">${actions}</div>` : ''}</div>
    </div>`;

  // ---------------------------------------------------------------- chrome
  const topbar = () => `
    <header class="topbar">
      <div class="brand"><span class="brand-mark">${ic('home')}</span><b>APM</b><span>Marketing Orders</span></div>
      <nav class="topnav" aria-label="Main">
        <a class="is-active">New order</a><a>Orders</a><a>Listings</a><a>Mailing lists</a><a>Brand kit</a>
      </nav>
      <div class="topbar-r">
        <button class="btn btn-ghost btn-sm" data-act="notes">${ic('note')}Design notes</button>
        <div class="me"><span class="avatar">JE</span><div><b>Jordan Ellis</b><span>Cedar Realty</span></div></div>
      </div>
    </header>`;

  const steps = () => {
    const items = [
      ['start', 'Listing & products', `${S.selected.length} selected`],
      ['customize', 'Customize', `${S.selected.filter(p => !issues(p).length).length} of ${S.selected.length} ready`],
      ['checkout', 'Review & submit', 'Credits · payment'],
    ];
    const order = ['start', 'customize', 'checkout', 'done'];
    const cur = order.indexOf(S.view);
    return `<ol class="steps">${items.map(([v, t, sub], i) => `
      <li class="${i < cur ? 'is-done' : ''} ${i === cur ? 'is-current' : ''}">
        <button data-act="go:${v}" ${S.view === 'done' ? 'disabled' : ''} ${i === cur ? 'aria-current="step"' : ''}>
          <span class="step-n">${i < cur ? ic('check') : i + 1}</span><span><b>${t}</b><small>${sub}</small></span>
        </button>
      </li>`).join('')}</ol>`;
  };

  const contextBar = () => {
    const l = L();
    return `
      <div class="ctx">
        <div class="ctx-listing">
          <div class="ctx-thumb">${A.photo(l, 'exterior')}</div>
          <div class="ctx-text">
            <span class="ctx-label">Ordering for</span>
            <b>${esc(l.street)}, ${esc(l.city)}, ${l.state} ${l.zip}</b>
            <span class="ctx-meta"><span class="chip chip-green">${esc(l.event)}</span>${esc(l.eventDate)} · ${money(l.price).replace('.00', '')}</span>
          </div>
          ${S.view !== 'done' ? `<button class="btn btn-ghost btn-sm" data-act="listingMenu" aria-expanded="${S.listingMenu}">Change ${ic('chevronD')}</button>` : ''}
          ${S.listingMenu ? listingMenu() : ''}
        </div>
        ${steps()}
      </div>`;
  };

  const listingMenu = () => `
    <div class="popover" role="dialog" aria-label="Change listing">
      <p class="popover-note">${ic('info')}Every product in this order uses the same listing. Switching updates all proofs; your options stay.</p>
      ${D.listings.map(l => `
        <button class="listing-row ${l.id === S.listingId ? 'is-selected' : ''}" data-act="chooseListing:${l.id}">
          <span class="listing-row-thumb">${A.photo(l, 'exterior')}</span>
          <span><b>${esc(l.street)}</b><small>${esc(l.event)} · ${esc(l.eventDate)}</small></span>
          ${l.id === S.listingId ? ic('check') : ''}
        </button>`).join('')}
    </div>`;

  // ---------------------------------------------------------------- order summary rail
  const summary = () => {
    const l = L();
    const sub = r2(S.selected.reduce((s, pid) => s + (productTotal(pid) || 0), 0));
    const todo = allIssues();
    const started = S.view !== 'start';
    return `
      <aside class="summary" aria-label="Order summary">
        <div class="summary-head">
          <span class="eyebrow">Order summary</span>
          <b>${esc(l.street)}</b>
          <small>${esc(l.event)} · ${S.selected.length} product${S.selected.length === 1 ? '' : 's'}</small>
        </div>
        <ul class="summary-list">
          ${S.selected.map(pid => `
            <li>
              <button class="summary-row ${S.view === 'customize' && S.active === pid ? 'is-active' : ''}" data-act="tab:${pid}">
                <span class="summary-ico">${ic(productIcon[pid])}</span>
                <span class="summary-main"><b>${PRODUCT[pid].name}</b><small>${distMeta(pid)}</small>
                  ${started ? statusPill(pid) : '<span class="pill">Not started</span>'}
                </span>
                <span class="summary-amt">${productTotal(pid) == null ? '<span class="muted">Price pending</span>' : money(productTotal(pid))}</span>
              </button>
            </li>`).join('') || '<li class="summary-empty">No products selected yet.</li>'}
        </ul>
        ${started && todo.length ? `
          <div class="summary-todo">
            <b>${ic('alert')}${todo.length} thing${todo.length === 1 ? '' : 's'} to finish</b>
            ${todo.slice(0, 4).map(t => `<button data-act="fix:${t.pid}:${t.sec}"><span>${SINGULAR[t.pid]}</span>${esc(t.text)}${ic('chevronR')}</button>`).join('')}
            ${todo.length > 4 ? `<small>+${todo.length - 4} more</small>` : ''}
          </div>` : ''}
        <div class="summary-total">
          <span>Subtotal</span><b>${money(sub)}</b>
        </div>
        <p class="summary-note">Tax, credits and payment are applied at checkout.</p>
        ${S.view === 'start'
          ? `<button class="btn btn-primary btn-block" data-act="startCustomize" ${S.selected.length ? '' : 'disabled'}>Customize ${S.selected.length || ''} product${S.selected.length === 1 ? '' : 's'}${ic('arrowR')}</button>`
          : `<button class="btn ${todo.length ? 'btn-secondary' : 'btn-primary'} btn-block" data-act="go:checkout">Review order${ic('arrowR')}</button>
             ${todo.length ? '<p class="summary-note">You can review now — unfinished items stay flagged.</p>' : ''}`}
      </aside>`;
  };

  // ---------------------------------------------------------------- view: start
  const viewStart = () => {
    const q = S.listingQuery.trim().toLowerCase();
    const shown = D.listings.filter(l => !q || `${l.street} ${l.city} ${l.event}`.toLowerCase().includes(q));
    return `
      <div class="layout">
        <main class="main">
          <section class="block">
            <div class="block-head">
              <div><span class="eyebrow">Step 1</span><h2>Which listing or event is this for?</h2>
              <p>Everything you order stays tied to this property — addresses, photos and agent details fill in automatically.</p></div>
              <label class="search">${ic('search')}<input data-bind="listingQuery" value="${esc(S.listingQuery)}" placeholder="Search address or event" aria-label="Search listings"></label>
            </div>
            <div class="listing-grid">
              ${shown.map(l => `
                <button class="listing-card ${l.id === S.listingId ? 'is-selected' : ''}" data-act="selectListing:${l.id}" aria-pressed="${l.id === S.listingId}">
                  <span class="listing-photo">${A.photo(l, 'exterior')}<span class="chip ${l.id === S.listingId ? 'chip-green' : 'chip-dark'}">${esc(l.event)}</span></span>
                  <span class="listing-body">
                    <b>${esc(l.street)}</b>
                    <small>${esc(l.city)}, ${l.state} ${l.zip}</small>
                    <span class="listing-meta">${ic('clock')}${esc(l.eventDate)}</span>
                    <span class="listing-meta">${l.beds} bd · ${l.baths} ba · ${l.sqft.toLocaleString()} sq ft · ${money(l.price).replace('.00', '')}</span>
                  </span>
                  <span class="select-mark">${l.id === S.listingId ? `${ic('check')}Selected` : 'Select'}</span>
                </button>`).join('') || '<p class="muted">No listings match.</p>'}
            </div>
          </section>
          <section class="block">
            <div class="block-head">
              <div><span class="eyebrow">Step 2</span><h2>What would you like to order?</h2>
              <p>Pick as many as you need. You’ll customize each one next, with the same listing and branding.</p></div>
              <span class="muted">${S.selected.length} selected</span>
            </div>
            <div class="product-grid">
              ${D.products.map(p => {
                const on = S.selected.includes(p.id);
                return `
                  <button class="product-card ${on ? 'is-selected' : ''}" data-act="toggleProduct:${p.id}" aria-pressed="${on}">
                    <span class="product-art">${A.product(p.id, L())}</span>
                    <span class="product-check">${on ? ic('check') : ''}</span>
                    <span class="product-body">
                      <span class="product-title"><b>${p.name}</b>${p.free ? '<span class="chip chip-green">Free</span>' : ''}</span>
                      <small>${p.size}</small>
                      <span class="product-desc">${p.desc}</span>
                      <span class="product-foot"><span>${p.free ? 'No cost' : p.from}</span><span class="product-state">${on ? 'Selected' : 'Add'}</span></span>
                    </span>
                  </button>`;
              }).join('')}
            </div>
          </section>
        </main>
        ${summary()}
      </div>`;
  };

  // ---------------------------------------------------------------- view: customize
  const sec = (key, n, title, sub, body, opts = {}) => `
    <section class="cfg-sec ${S.hl === key ? 'is-flash' : ''}" data-sec="${key}" id="sec-${key}">
      <header><span class="cfg-n">${n}</span><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>${opts.right || ''}</header>
      ${body}
    </section>`;

  const templatesSec = pid => {
    const cfg = cfgOf(pid);
    const tpls = D.templates[pid];
    const cur = tpls.find(t => t.id === cfg.template);
    const isDefault = S.defaults[pid] === cfg.template;
    return sec('template', 1, 'Template', `${cur.name} · ${cur.note}`, `
      <div class="tpl-grid">
        ${tpls.map(t => `
          <button class="tpl ${t.id === cfg.template ? 'is-selected' : ''}" data-act="template:${t.id}" aria-pressed="${t.id === cfg.template}">
            <span class="tpl-thumb tpl-${pid}">${PR.render(pid, L(), { ...cfg, template: t.id })}</span>
            <span class="tpl-name">${t.id === cfg.template ? ic('check') : ''}${t.name}</span>
            ${S.defaults[pid] === t.id ? '<span class="tpl-default">Your default</span>' : ''}
          </button>`).join('')}
      </div>
      <label class="check check-inline">
        <input type="checkbox" data-act-change="toggleDefault" ${isDefault ? 'checked' : ''}>
        <span>Use <b>${cur.name}</b> as my default for ${PRODUCT[pid].name.toLowerCase()}</span>
      </label>`);
  };

  const qrSec = pid => {
    const cfg = cfgOf(pid);
    const q = cfg.qr;
    const statusText = {
      none: ['', 'Not added'],
      draft: ['warn', 'Unsaved change'],
      invalid: ['error', 'Needs attention'],
      valid: ['warn', 'Ready to save'],
      saved: ['ok', 'Saved'],
      override: ['ok', 'Saved · link unconfirmed'],
    }[q.status];
    const savedish = q.status === 'saved' || q.status === 'override';
    let body = '';
    if (q.open) {
      body = `
        <div class="qr-body">
          <div class="qr-preview ${savedish || q.status === 'valid' ? '' : 'is-empty'}">
            ${savedish ? A.qr(q.savedUrl) : q.status === 'valid' ? A.qr(q.url) : ic('qr')}
            <small>${savedish ? 'On your proof' : q.status === 'valid' ? 'Preview' : 'No code yet'}</small>
          </div>
          <div class="qr-form">
            <label class="field ${q.status === 'invalid' ? 'has-error' : ''} ${q.status === 'valid' ? 'is-valid' : ''}">
              <span class="field-label">Where should the code lead? <em>required</em></span>
              <span class="input-wrap">
                <input data-bind="products.${pid}.qr.url" value="${esc(q.url)}" placeholder="https://cedarrealty.example/listings/…" spellcheck="false" aria-invalid="${q.status === 'invalid'}">
                ${q.status === 'valid' ? `<span class="input-ok">${ic('check')}</span>` : ''}
              </span>
              ${q.status === 'invalid' ? `<span class="field-error">${ic('alert')}${esc(q.error)}</span>` : ''}
              ${q.status === 'valid' ? `<span class="field-ok">${ic('check')}Link looks good${q.note ? ` — ${q.note}` : ''}. Ready to save.</span>` : ''}
            </label>
            ${q.status === 'invalid' && q.errorKind === 'unconfirmed' ? `
              <label class="check check-warn">
                <input type="checkbox" data-bind="products.${pid}.qr.override" ${q.override ? 'checked' : ''}>
                <span><b>Use this link anyway.</b> I’ve checked it myself; the QR code may not work until the page is live.</span>
              </label>` : ''}
            <div class="btn-row">
              ${q.status === 'draft' || (q.status === 'invalid' && !q.override)
                ? `<button class="btn btn-navy btn-sm" data-act="qrCheck">${ic('refresh')}Check link</button>` : ''}
              ${q.status === 'valid' || (q.status === 'invalid' && q.override)
                ? `<button class="btn btn-navy btn-sm" data-act="qrSave">${ic('qr')}Generate &amp; save code</button>` : ''}
              ${['draft', 'invalid', 'valid'].includes(q.status) ? `<button class="btn btn-ghost btn-sm" data-act="qrDiscard">Discard change</button>` : ''}
              ${savedish && !q.confirmDelete ? `<button class="btn btn-ghost btn-sm btn-danger-text" data-act="qrDelete">${ic('trash')}Remove code</button>` : ''}
              ${q.confirmDelete ? `<span class="confirm-inline">Remove the QR code from this design? <button class="btn btn-danger btn-sm" data-act="qrDeleteConfirm">Remove</button><button class="btn btn-ghost btn-sm" data-act="qrDeleteCancel">Keep</button></span>` : ''}
            </div>
            <p class="hint">${ic('info')}Link checks are simulated in this prototype — no network requests are made.</p>
          </div>
        </div>`;
    }
    return `
      <section class="cfg-sub ${S.hl === 'qr' ? 'is-flash' : ''}" data-sec="qr" id="sec-qr">
        <button class="cfg-sub-head" data-act="qrToggle" aria-expanded="${q.open}">
          ${ic('qr')}<span><b>QR code</b><small>${savedish ? esc(q.savedUrl.replace(/^https?:\/\//, '')) : 'Optional · links to the listing page'}</small></span>
          <span class="pill ${statusText[0] ? `pill-${statusText[0]}` : ''}">${statusText[0] === 'ok' ? ic('check') : statusText[0] ? ic('alert') : ''}${statusText[1]}</span>
          ${ic(q.open ? 'chevronD' : 'chevronR', 'chev')}
        </button>
        ${body}
      </section>`;
  };

  const distSec = pid => {
    const cfg = cfgOf(pid);
    const opts = [
      ['mail', 'mail', 'Mail', 'One piece to each recipient'],
      ['ship', 'truck', 'Ship', 'A bulk box sent to you'],
      ['pickup', 'store', 'Pickup', 'Collect at a print center'],
      ['download', 'download', 'Download', 'Digital JPG or PDF'],
    ];
    const explain = {
      mail: 'We print one piece per address on your selected lists and mail each one. Recipients, not you, receive the pieces — quantity follows your lists.',
      ship: 'We print the quantity you choose and ship it as one box to you. Use this for showings, open houses and the info box.',
      pickup: 'We print the quantity you choose and hold it at a print center for you to collect. No shipping charge.',
      download: 'Nothing is printed. You get a digital file of this design to share or print yourself.',
    }[cfg.dist];
    return sec('dist', 3, 'Distribution', 'How should this reach people?', `
      <div class="seg" role="radiogroup" aria-label="Distribution method">
        ${opts.map(([id, icn, name, sub]) => `
          <button class="seg-opt ${cfg.dist === id ? 'is-selected' : ''}" role="radio" aria-checked="${cfg.dist === id}" data-act="dist:${id}">
            ${ic(icn)}<b>${name}</b><small>${sub}</small>
          </button>`).join('')}
      </div>
      <p class="explain">${ic('info')}${explain}</p>
      ${cfg.dist === 'mail' ? mailBody(pid) : ''}
      ${cfg.dist === 'ship' || cfg.dist === 'pickup' ? bulkBody(pid) : ''}
      ${cfg.dist === 'download' ? downloadBody(pid) : ''}
    `);
  };

  const mailBody = pid => {
    const cfg = cfgOf(pid);
    const lists = cfg.mail.lists.map(listById).filter(Boolean);
    const a = cfg.mail.sampleAddr;
    const addrOk = addrComplete(a);
    const pp = D.pricing[pid];
    const paper = pp.papers[cfg.paper];
    return `
      <div class="sub-block ${S.hl === 'audience' ? 'is-flash' : ''}" id="sec-audience">
        <div class="sub-head"><b>${ic('users')}Recipients</b><button class="btn btn-ghost btn-sm" data-act="openLists">${lists.length ? 'Change lists' : 'Choose lists'}</button></div>
        ${lists.length ? `
          <table class="qty-table">
            <tbody>
              ${lists.map(l => `<tr><td>${esc(l.name)}<small>${l.radius ? 'Radius list · created today' : `${l.source} · ${l.created}`}</small></td><td class="num">${l.qty}</td><td><button class="icon-btn" data-act="removeList:${pid}:${l.id}" aria-label="Remove ${esc(l.name)}">${ic('x')}</button></td></tr>`).join('')}
              ${cfg.mail.sample ? `<tr class="row-muted"><td>Agent sample copy<small>Mailed to you so you see what recipients get</small></td><td class="num">+1</td><td></td></tr>` : ''}
            </tbody>
            <tfoot><tr><td><b>Printed pieces</b><small>${mailed(cfg)} mailed${cfg.mail.sample ? ' + 1 sample' : ''}</small></td><td class="num"><b>${printed(cfg)}</b></td><td></td></tr></tfoot>
          </table>` : `
          ${callout('warn', 'No recipients yet', 'Mail sends one piece to every address on the lists you pick. Choose a saved list or build one around this listing.', `<button class="btn btn-secondary btn-sm" data-act="openLists">${ic('users')}Choose lists</button><button class="btn btn-ghost btn-sm" data-act="createMethod:radius">${ic('map')}Build radius list</button>`)}`}
        ${lists.length && !lists.some(l => l.radius) ? `<button class="link-btn" data-act="createMethod:radius">${ic('map')}Add neighbors around ${esc(L().street)}</button>` : ''}
      </div>

      <div class="sub-block ${S.hl === 'sample' ? 'is-flash' : ''}" id="sec-sample">
        ${toggle(`products.${pid}.mail.sample`, cfg.mail.sample, 'Send me a sample copy', 'Adds 1 printed piece ($1.00) mailed First Class to the address below.')}
        ${cfg.mail.sample ? (addrOk && !cfg.mail.sampleEdit ? `
          <div class="addr-card">${ic('pin')}<span><b>${esc(a.name)}${a.company ? ` · ${esc(a.company)}` : ''}</b><small>${esc(a.street1)}${a.street2 ? `, ${esc(a.street2)}` : ''}, ${esc(a.city)}, ${esc(a.state.toUpperCase())} ${esc(a.zip)}</small></span><button class="btn btn-ghost btn-sm" data-act="sampleEdit">Edit</button></div>
        ` : `
          ${!addrOk ? callout('warn', 'Where should we send your sample?', 'Without an address we can’t print the sample, and this brochure can’t be submitted. Use your office or enter another address.', `<button class="btn btn-secondary btn-sm" data-act="useOffice">${ic('building')}Use Cedar Realty office</button>`) : ''}
          <div class="addr-form">
            ${field('Name', `products.${pid}.mail.sampleAddr.name`, a.name)}
            ${field('Company', `products.${pid}.mail.sampleAddr.company`, a.company, { optional: true })}
            ${field('Street address', `products.${pid}.mail.sampleAddr.street1`, a.street1, { cls: 'span-2' })}
            ${field('Apt, suite, unit', `products.${pid}.mail.sampleAddr.street2`, a.street2, { cls: 'span-2', optional: true })}
            ${field('City', `products.${pid}.mail.sampleAddr.city`, a.city)}
            <div class="field-pair">
              ${field('State', `products.${pid}.mail.sampleAddr.state`, a.state, { attrs: 'maxlength="2"', placeholder: 'TX' })}
              ${field('ZIP', `products.${pid}.mail.sampleAddr.zip`, a.zip, { attrs: 'maxlength="10"', error: a.zip && !/^\d{5}(-\d{4})?$/.test(a.zip.trim()) ? '5-digit ZIP' : '' })}
            </div>
          </div>
          ${addrOk ? `<div class="btn-row">${callout('ok', 'Address complete', '')}<button class="btn btn-secondary btn-sm" data-act="sampleDone">Done</button></div>` : ''}
        `) : ''}
      </div>

      <div class="sub-block">
        <div class="sub-head"><b>${ic('clock')}Mailing class</b><small class="muted">Price per mailed piece, incl. postage</small></div>
        <div class="radio-cards">
          ${Object.entries(D.mailClasses).map(([id, c]) => `
            <button class="radio-card ${cfg.mail.mailClass === id ? 'is-selected' : ''}" role="radio" aria-checked="${cfg.mail.mailClass === id}" data-act="mailClass:${id}">
              <span class="radio-dot"></span>
              <span><b>${c.label}</b><small>${c.days} · illustrative</small></span>
              <span class="radio-price">${paper.mailUnavailable ? '—' : money(r2(pp.mail[id] + paper.mailDelta))}</span>
            </button>`).join('')}
        </div>
      </div>`;
  };

  const bulkBody = pid => {
    const cfg = cfgOf(pid);
    const pp = D.pricing[pid];
    const paper = pp.papers[cfg.paper];
    const b = cfg[cfg.dist];
    const presets = [50, 100, 250, 500];
    const tooFew = b.qty < pp.minQty;
    return `
      <div class="sub-block ${S.hl === 'qty' ? 'is-flash' : ''}" id="sec-qty">
        <div class="sub-head"><b>${ic('layers')}Quantity</b><small class="muted">${money(paper.print)} each on ${paper.label}</small></div>
        <div class="qty-row">
          <div class="stepper">
            <button data-act="qty:-25" aria-label="Decrease by 25">−</button>
            <input data-bind="products.${pid}.${cfg.dist}.qty" data-num="1" inputmode="numeric" value="${b.qty}" aria-label="Quantity">
            <button data-act="qty:25" aria-label="Increase by 25">+</button>
          </div>
          <div class="presets">${presets.map(n => `<button class="${b.qty === n ? 'is-selected' : ''}" data-act="qtySet:${n}">${n}</button>`).join('')}</div>
          <div class="qty-cost"><small>Printing</small><b>${money(r2(b.qty * paper.print))}</b></div>
        </div>
        ${tooFew ? `<p class="field-error">${ic('alert')}<span>The minimum for ${PRODUCT[pid].name.toLowerCase()} is ${pp.minQty}. <button class="link-btn" data-act="qtySet:${pp.minQty}">Set to ${pp.minQty}</button></span></p>` : ''}
      </div>
      ${cfg.dist === 'ship' ? `
        <div class="sub-block">
          <div class="sub-head"><b>${ic('truck')}Ship to</b>${!cfg.ship.editAddr ? '<button class="btn btn-ghost btn-sm" data-act="shipEdit">Change</button>' : ''}</div>
          ${cfg.ship.editAddr ? `
            <div class="addr-form">
              ${field('Name', `products.${pid}.ship.addr.name`, cfg.ship.addr.name)}
              ${field('Company', `products.${pid}.ship.addr.company`, cfg.ship.addr.company, { optional: true })}
              ${field('Street address', `products.${pid}.ship.addr.street1`, cfg.ship.addr.street1, { cls: 'span-2' })}
              ${field('Apt, suite, unit', `products.${pid}.ship.addr.street2`, cfg.ship.addr.street2, { cls: 'span-2', optional: true })}
              ${field('City', `products.${pid}.ship.addr.city`, cfg.ship.addr.city)}
              <div class="field-pair">${field('State', `products.${pid}.ship.addr.state`, cfg.ship.addr.state, { attrs: 'maxlength="2"' })}${field('ZIP', `products.${pid}.ship.addr.zip`, cfg.ship.addr.zip, { attrs: 'maxlength="10"' })}</div>
            </div>
            <div class="btn-row"><button class="btn btn-secondary btn-sm" data-act="shipDone" ${addrComplete(cfg.ship.addr) ? '' : 'disabled'}>Use this address</button></div>
          ` : `
            <div class="addr-card">${ic('building')}<span><b>${esc(cfg.ship.addr.name)} · ${esc(cfg.ship.addr.company)}</b><small>${esc(addrLine({ ...cfg.ship.addr, company: '', name: '' }))}</small></span><span class="chip">Est. 4–6 business days</span></div>
          `}
        </div>` : `
        <div class="sub-block">
          <div class="sub-head"><b>${ic('store')}Pickup location</b></div>
          <div class="radio-cards">
            ${D.pickupLocations.map(p => `
              <button class="radio-card ${cfg.pickup.location === p.id ? 'is-selected' : ''}" role="radio" aria-checked="${cfg.pickup.location === p.id}" data-act="pickupLoc:${p.id}">
                <span class="radio-dot"></span><span><b>${p.name}</b><small>${p.addr}</small></span><span class="chip">${p.ready}</span>
              </button>`).join('')}
          </div>
          <p class="hint">${ic('info')}Proposed: we text you when the batch is ready. Unclaimed orders are held for 10 days.</p>
        </div>`}`;
  };

  const downloadBody = pid => {
    const cfg = cfgOf(pid);
    return `
      <div class="sub-block">
        <div class="radio-cards">
          ${[['jpg', 'JPG image', 'Screen-resolution, great for email and MLS', 'Free'], ['pdf', 'Print-ready PDF', 'Full bleed and crop marks for any print shop', money(D.pricing.downloadPdf)]].map(([id, t, s, p]) => `
            <button class="radio-card ${cfg.download.format === id ? 'is-selected' : ''}" role="radio" aria-checked="${cfg.download.format === id}" data-act="dlFormat:${id}">
              <span class="radio-dot"></span><span><b>${t}</b><small>${s}</small></span><span class="radio-price">${p}</span>
            </button>`).join('')}
        </div>
      </div>`;
  };

  const paperSec = pid => {
    const cfg = cfgOf(pid);
    if (cfg.dist === 'download') return '';
    const pp = D.pricing[pid];
    const cur = pp.papers[cfg.paper];
    const blocked = cfg.dist === 'mail' && cur.mailUnavailable;
    const firstOk = Object.entries(pp.papers).find(([, p]) => !p.mailUnavailable);
    return sec('paper', 4, 'Paper & add-ons', cfg.dist === 'mail' ? 'Mail prices include postage' : 'Printing price per piece', `
      ${blocked ? callout('error', `${cur.label} can’t be mailed`, cur.mailUnavailable, `<button class="btn btn-secondary btn-sm" data-act="paper:${firstOk[0]}">Switch to ${firstOk[1].label}</button><button class="btn btn-ghost btn-sm" data-act="dist:ship">Ship instead</button>`) : ''}
      <div class="radio-cards">
        ${Object.entries(pp.papers).map(([id, p]) => {
          const off = cfg.dist === 'mail' && p.mailUnavailable;
          const price = cfg.dist === 'mail' ? (off ? null : r2(pp.mail[cfg.mail.mailClass] + p.mailDelta)) : p.print;
          return `
            <button class="radio-card ${cfg.paper === id ? 'is-selected' : ''} ${off ? 'is-unavailable' : ''}" role="radio" aria-checked="${cfg.paper === id}" data-act="paper:${id}" ${off && cfg.paper !== id ? 'aria-disabled="true"' : ''}>
              <span class="radio-dot"></span>
              <span><b>${p.label}</b><small>${off ? `${ic('lock')}Not available for Mail` : p.note}</small></span>
              <span class="radio-price">${price == null ? 'Unavailable' : `${money(price)}<small>/pc</small>`}</span>
            </button>`;
        }).join('')}
      </div>
      ${toggle(`products.${pid}.pdfAddon`, cfg.pdfAddon, `Add a PDF copy · ${money(D.pricing.pdfAddon)}`, 'A print-ready file of this exact design, delivered with your order.')}
    `);
  };

  const costSec = pid => {
    const items = lineItems(pid);
    const total = productTotal(pid);
    const nextPid = S.selected[S.selected.indexOf(pid) + 1];
    const n = issues(pid).length;
    return `
      <section class="cfg-cost">
        <h3>${PRODUCT[pid].name} cost</h3>
        <ul class="lines">
          ${items.map(i => `<li><span>${esc(i.label)}${i.detail ? `<small>${esc(i.detail)}</small>` : ''}</span><b>${i.amount == null ? '<span class="muted">Unavailable</span>' : money(i.amount)}</b></li>`).join('')}
        </ul>
        <div class="lines-total"><span>Total</span><b>${total == null ? 'Choose an available paper' : money(total)}</b></div>
        <button class="btn btn-primary btn-lg btn-block" data-act="next">
          ${nextPid ? `Continue to ${PRODUCT[nextPid].name}` : 'Review order'}${ic('arrowR')}
        </button>
        <p class="next-note">${n ? `${ic('alert')}<span>${n} item${n === 1 ? '' : 's'} still open on this ${SINGULAR[pid].toLowerCase()} — you can come back to ${n === 1 ? 'it' : 'them'} anytime.</span>` : `${ic('check')}<span>This ${SINGULAR[pid].toLowerCase()} is ready. Your choices are kept as you move on.</span>`}</p>
      </section>`;
  };

  const proofPane = pid => {
    const cfg = cfgOf(pid);
    const pages = PR.pages[pid];
    const page = cfg.page || pages[0][0];
    const reviewed = cfg.reviewedVersion === cfg.version;
    const changedSince = cfg.reviewedVersion && !reviewed;
    const firstMailRecipient = (() => {
      if (cfg.dist !== 'mail') return null;
      const radius = cfg.mail.lists.map(listById).find(l => l?.radius);
      if (radius) return { name: 'Current Resident', line1: radius.preview[0], line2: 'Austin, TX 78704' };
      return { name: 'Maya & Theo Lindqvist', line1: '2104 Kinney Ave', line2: 'Austin, TX 78704-2290' };
    })();
    return `
      <section class="ws-proof">
        <div class="proof-bar">
          <div class="proof-title">
            <b>${D.templates[pid].find(t => t.id === cfg.template).name}</b>
            <span class="${cfg.savedAt ? 'saved' : 'muted'}">${cfg.savedAt ? `${ic('check')}Changes saved · ${cfg.savedAt}` : 'Template content from listing'}</span>
          </div>
          ${pages.length > 1 ? `<div class="mini-seg" role="tablist">${pages.map(([id, label]) => `<button role="tab" aria-selected="${page === id}" class="${page === id ? 'is-selected' : ''}" data-act="page:${id}">${label}</button>`).join('')}</div>` : ''}
          <button class="btn btn-navy btn-sm" data-act="openEditor">${ic('edit')}Edit design</button>
        </div>
        <div class="proof-stage proof-stage-${pid}">
          <div class="proof-sheet">${PR.render(pid, L(), { ...cfg, page }, page, firstMailRecipient)}</div>
          ${cfg.dist === 'mail' && pid !== 'flyer' && page !== 'inside' && page !== 'front' ? `<span class="stage-note">${ic('info')}Address panel shows your first recipient as an example</span>` : ''}
        </div>
        <div class="review-bar ${reviewed ? 'is-reviewed' : changedSince ? 'is-changed' : ''} ${S.hl === 'review' ? 'is-flash' : ''}" id="sec-review">
          <label class="check">
            <input type="checkbox" data-act-change="review" ${reviewed ? 'checked' : ''}>
            <span><b>${reviewed ? 'Proof reviewed' : 'I’ve reviewed this proof'}</b>
            <small>${changedSince ? 'The design changed after your last review — please look again.' : 'Spelling, price, photos, contact details and QR code all look right.'}</small></span>
          </label>
          ${reviewed ? `<span class="pill pill-ok">${ic('check')}Approved v${cfg.version}</span>` : changedSince ? `<span class="pill pill-warn">${ic('alert')}Changed</span>` : `<span class="pill">${ic('eye')}Not reviewed</span>`}
        </div>
      </section>`;
  };

  const catalogOnly = pid => {
    const p = PRODUCT[pid];
    return `
      <div class="ws-grid ws-grid-simple">
        <section class="ws-proof">
          <div class="proof-stage proof-stage-catalog"><div class="catalog-art">${A.product(pid, L())}</div></div>
        </section>
        <div class="ws-config">
          <section class="cfg-sec">
            <header><span class="cfg-n">${ic(productIcon[pid])}</span><div><h3>${p.name}</h3><p>${p.desc}</p></div></header>
            ${callout('info', 'Outside this prototype’s scope', `${p.name} uses the same listing, photos and branding as the rest of this order. Its detailed setup (${pid === 'fbad' ? 'audience, budget and schedule' : 'sizes and captions'}) isn’t designed here.`)}
            <ul class="lines">${lineItems(pid).map(i => `<li><span>${i.label}</span><b>${money(i.amount)}</b></li>`).join('')}</ul>
          </section>
          <button class="btn btn-primary btn-lg btn-block" data-act="next">${S.selected[S.selected.indexOf(pid) + 1] ? `Continue to ${PRODUCT[S.selected[S.selected.indexOf(pid) + 1]].name}` : 'Review order'}${ic('arrowR')}</button>
          <button class="btn btn-ghost btn-sm" data-act="toggleProduct:${pid}">Remove ${p.name} from this order</button>
        </div>
      </div>`;
  };

  const viewCustomize = () => {
    const pid = S.active;
    return `
      <div class="layout">
        <main class="main main-ws">
          <div class="ws-tabs" role="tablist" aria-label="Products in this order">
            ${S.selected.map((p, i) => `
              <button role="tab" aria-selected="${p === pid}" class="ws-tab ${p === pid ? 'is-active' : ''}" data-act="tab:${p}">
                <span class="ws-tab-n">${i + 1}</span><span><b>${PRODUCT[p].name}</b>${statusPill(p)}</span>
              </button>`).join('')}
            <button class="ws-tab ws-tab-add" data-act="go:start">${ic('plus')}Add product</button>
          </div>
          ${DETAILED.includes(pid) ? `
            <div class="ws-grid">
              ${proofPane(pid)}
              <div class="ws-config">
                ${templatesSec(pid)}
                ${sec('design', 2, 'Proof details', 'Text, photos and the optional QR code', `
                  <div class="design-row">
                    <span>${ic('image')}<b>Content</b><small>${cfgOf(pid).savedAt ? 'Edited · saved' : 'From listing data'}</small></span>
                    <button class="btn btn-ghost btn-sm" data-act="openEditor">${ic('edit')}Edit</button>
                  </div>
                  ${qrSec(pid)}`)}
                ${distSec(pid)}
                ${paperSec(pid)}
                ${costSec(pid)}
              </div>
            </div>` : catalogOnly(pid)}
        </main>
        ${summary()}
      </div>`;
  };

  // ---------------------------------------------------------------- drawer: lists + radius
  const drawer = () => {
    if (!S.drawer) return '';
    const pid = S.drawer.pid;
    const cfg = cfgOf(pid);
    let inner = '';
    if (S.drawer.view === 'lists') {
      const sel = cfg.mail.lists;
      const total = mailed(cfg);
      inner = `
        <header class="drawer-head">
          <div><span class="eyebrow">${PRODUCT[pid].name} · Mail</span><h2>Who should receive this?</h2>
          <p>Each address on a selected list gets one ${SINGULAR[pid].toLowerCase()}. Selecting more lists increases printed pieces and postage.</p></div>
          <button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button>
        </header>
        <div class="drawer-body">
          <h4 class="drawer-h">Saved lists</h4>
          <table class="list-table">
            <thead><tr><th></th><th>List</th><th class="num">Addresses</th><th>Created</th><th></th></tr></thead>
            <tbody>
              ${S.lists.map(l => {
                const on = sel.includes(l.id);
                return `
                  <tr class="${on ? 'is-selected' : ''} ${S.hl === 'list-' + l.id ? 'is-flash' : ''}">
                    <td><input type="checkbox" data-act-change="toggleList:${l.id}" ${on ? 'checked' : ''} aria-label="Select ${esc(l.name)}"></td>
                    <td><b>${esc(l.name)}</b>${l.radius ? ' <span class="chip chip-green">New</span>' : ''}<small>${l.source}</small></td>
                    <td class="num">${l.qty}</td>
                    <td>${l.created}</td>
                    <td><button class="btn btn-ghost btn-sm" data-act="editList:${l.id}">${ic('edit')}Edit</button></td>
                  </tr>
                  ${S.editList === l.id ? `
                    <tr class="list-edit"><td></td><td colspan="4">
                      <div class="list-edit-body">
                        ${field('List name', `lists.${S.lists.indexOf(l)}.name`, l.name)}
                        <div><span class="field-label">Sample recipients</span><small>${(l.preview || ['2104 Kinney Ave', '1907 Bluebonnet Ln', '2311 Del Curto Rd']).slice(0, 3).map(esc).join(' · ')} …</small></div>
                        <button class="btn btn-secondary btn-sm" data-act="editList:">Done</button>
                      </div>
                    </td></tr>` : ''}`;
              }).join('')}
            </tbody>
          </table>
          <h4 class="drawer-h">Create a new list</h4>
          <div class="method-grid">
            ${[['radius', 'map', 'Radius', 'Neighbors around the listing'], ['upload', 'upload', 'Upload', 'CSV or Excel file'], ['street', 'street', 'Street', 'Whole streets you choose'], ['demo', 'users', 'Demographics', 'Filter by home and owner traits'], ['crm', 'crm', 'CRM import', 'Contacts from your CRM']].map(([id, icn, t, s]) => `
              <button class="method ${id === 'radius' ? 'is-featured' : ''}" data-act="createMethod:${id}">${ic(icn)}<b>${t}</b><small>${s}</small></button>`).join('')}
          </div>
        </div>
        <footer class="drawer-foot">
          <div><b>${sel.length} list${sel.length === 1 ? '' : 's'} · ${total} recipients</b><small>${cfg.mail.sample ? `${total + 1} printed with your sample copy` : `${total} printed`}</small></div>
          <button class="btn btn-primary" data-act="closeDrawer">Back to ${SINGULAR[pid].toLowerCase()}${ic('arrowR')}</button>
        </footer>`;
    } else if (S.drawer.view === 'radius') {
      const R = S.radius;
      const res = A.radiusSelect(R);
      const short = res.picked.length < R.qty;
      const name = R.nameEdited ? R.name : `${L().street.replace(/^\d+\s/, '')} · ${R.qty} nearest ${R.sf && R.mf ? 'homes' : R.mf ? 'multi-family' : 'single-family'}`;
      inner = `
        <header class="drawer-head">
          <div><button class="link-btn" data-act="drawerBack">${ic('chevronL')}Mailing lists</button><h2>New radius list</h2>
          <p>Find the nearest addresses around a center point. You’ll see exactly who’s included before adding them to the order.</p></div>
          <button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button>
        </header>
        <div class="drawer-body radius">
          <div class="radius-form">
            <div class="field-pair field-pair-wide">
              ${field('Center address', 'radius.center', R.center)}
              ${field('ZIP', 'radius.zip', R.zip, { attrs: 'maxlength="5"', error: /^\d{5}$/.test(R.zip) ? '' : 'Enter a 5-digit ZIP' })}
            </div>
            <span class="chip chip-green chip-sm">${ic('home')}Centered on this order’s listing</span>
            <label class="field">
              <span class="field-label">How many addresses?</span>
              <div class="range-row">
                <input type="range" min="10" max="150" step="5" data-bind="radius.qty" data-num="1" value="${R.qty}" aria-label="Number of addresses">
                <input class="range-num" data-bind="radius.qty" data-num="1" inputmode="numeric" value="${R.qty}" aria-label="Number of addresses">
              </div>
            </label>
            <fieldset class="field">
              <legend class="field-label">Home types</legend>
              <label class="check"><input type="checkbox" data-bind="radius.sf" ${R.sf ? 'checked' : ''}><span><b>Single-family <i class="legend-dot"></i></b><small>Detached homes and townhomes</small></span></label>
              <label class="check"><input type="checkbox" data-bind="radius.mf" ${R.mf ? 'checked' : ''}><span><b>Multi-family <i class="legend-sq"></i></b><small>Duplexes, small apartment buildings</small></span></label>
            </fieldset>
            ${toggle('radius.exclude', R.exclude, 'Exclude 128 Willow Lane', 'Don’t mail the property you’re marketing.')}
            ${field('List name', 'radius.name', name, { attrs: 'data-name="1"' })}
            <div class="radius-cost">
              <div><small>Addresses</small><b>${res.picked.length}</b></div>
              <div><small>Radius</small><b>${res.miles.toFixed(2)} mi</b></div>
              <div><small>Address data</small><b>${money(r2(res.picked.length * D.pricing.radiusRecord))}</b></div>
            </div>
            <p class="hint">${ic('info')}Proposed: radius addresses carry a ${money(D.pricing.radiusRecord)} data fee each. Recipient purchase rules aren’t established.</p>
          </div>
          <div class="radius-map">
            <div class="map-wrap">${A.map(R)}</div>
            <div class="map-legend">
              <span><i class="lg-on"></i>Included (${res.picked.length})</span>
              <span><i class="lg-off"></i>Not included</span>
              <span><i class="lg-mf"></i>Multi-family</span>
              <span>${ic('home')}Listing${R.exclude ? ' — excluded' : ''}</span>
            </div>
            ${!R.sf && !R.mf ? callout('error', 'Choose at least one home type', 'With no home types selected there’s no one to mail.') : short ? callout('warn', `Only ${res.picked.length} matching addresses nearby`, 'Add multi-family homes or lower the quantity.') : ''}
            <div class="results">
              <div class="results-head"><b>Who’s included</b><small>Nearest first · “Current Resident”</small></div>
              <ol>${res.picked.slice(0, 6).map(h => `<li><span>${h.num} ${h.street}</span><small>${(h.d / A.PX_PER_MILE).toFixed(2)} mi · ${h.mf ? `Multi-family, ${h.units} units` : 'Single-family'}</small></li>`).join('')}</ol>
              ${res.picked.length > 6 ? `<small class="muted">+ ${res.picked.length - 6} more addresses</small>` : ''}
            </div>
          </div>
        </div>
        <footer class="drawer-foot">
          <div><b>Adds ${res.picked.length} recipients</b><small>${SINGULAR[pid]} total becomes ${mailed(cfg) + res.picked.length} mailed${cfg.mail.sample ? ` + 1 sample = ${printed(cfg) + res.picked.length} printed` : ''}</small></div>
          <div class="btn-row"><button class="btn btn-ghost" data-act="drawerBack">Cancel</button>
          <button class="btn btn-primary" data-act="radiusSave" ${res.picked.length && /^\d{5}$/.test(R.zip) ? '' : 'disabled'}>${ic('check')}Save list &amp; add to ${SINGULAR[pid].toLowerCase()}</button></div>
        </footer>`;
    } else {
      const m = S.drawer.method;
      const titles = { upload: 'Upload a list', street: 'Pick streets', demo: 'Demographic list', crm: 'Import from CRM' };
      const sketches = {
        upload: ['Drop a CSV or Excel file', 'Match columns: Name, Street, City, State, ZIP', 'Review rows we couldn’t read before saving'],
        street: ['Search a street near the listing', 'Choose one or both sides of the street', 'See the count before adding'],
        demo: ['Start from the listing’s ZIP', 'Filter by home value, years owned, beds', 'Preview count and cost per address'],
        crm: ['Connect your CRM once', 'Pick a contact group or tag', 'Addresses refresh each time you order'],
      };
      inner = `
        <header class="drawer-head">
          <div><button class="link-btn" data-act="drawerBack">${ic('chevronL')}Mailing lists</button><h2>${titles[m]}</h2></div>
          <button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button>
        </header>
        <div class="drawer-body">
          ${callout('info', 'Illustrative only', 'This list type isn’t detailed in the prototype. A likely three-step flow is sketched below as a design proposal.')}
          <ol class="sketch">${sketches[m].map(s => `<li>${s}</li>`).join('')}</ol>
          <button class="btn btn-secondary" data-act="createMethod:radius">${ic('map')}Try the Radius builder instead</button>
        </div>`;
    }
    return `<div class="scrim" data-act="closeDrawer"></div><aside class="drawer ${S.drawer.view === 'radius' ? 'drawer-wide' : ''}" role="dialog" aria-modal="true" aria-label="Mailing lists">${inner}</aside>`;
  };

  // ---------------------------------------------------------------- modal: editor + notes
  const modal = () => {
    if (S.modal === 'editor') return editorModal();
    if (S.modal === 'notes') return notesModal();
    return '';
  };

  const editorModal = () => {
    const pid = S.active;
    const cfg = cfgOf(pid);
    const d = S.draft;
    const l = L();
    const dirty = JSON.stringify(d) !== JSON.stringify(cfg.content);
    const pages = PR.pages[pid];
    const page = cfg.page || pages[0][0];
    const heads = ['', 'Just Listed', 'Open House', 'Coming Soon', 'Price Improved'];
    return `
      <div class="scrim" data-act="editorClose"></div>
      <div class="modal modal-editor" role="dialog" aria-modal="true" aria-label="Edit design">
        <header class="modal-head">
          <div><span class="eyebrow">${PRODUCT[pid].name} · ${D.templates[pid].find(t => t.id === cfg.template).name}</span><h2>Edit design</h2></div>
          <span class="pill ${dirty ? 'pill-warn' : ''}">${dirty ? `${ic('edit')}Unsaved changes` : `${ic('check')}No unsaved changes`}</span>
          <button class="icon-btn" data-act="editorClose" aria-label="Close">${ic('x')}</button>
        </header>
        <div class="modal-body editor">
          <div class="editor-stage proof-stage-${pid}">
            <div class="proof-sheet">${PR.render(pid, l, { ...cfg, content: d }, page)}</div>
          </div>
          <div class="editor-form">
            ${callout('info', 'Design proposal', 'Text and photo editing is shown as a concept. The established editor exposes QR-code controls only (in Proof details).')}
            <label class="field"><span class="field-label">Headline</span>
              <select data-bind="draft.headline">${heads.map(h => `<option value="${h}" ${d.headline === h ? 'selected' : ''}>${h || `${l.event} (from event)`}</option>`).join('')}</select>
            </label>
            ${field('Tagline', 'draft.tagline', d.tagline, { placeholder: l.tagline })}
            <label class="field"><span class="field-label">Description <em>${(d.blurb || l.blurb).length}/240</em></span>
              <textarea data-bind="draft.blurb" rows="4" maxlength="240" placeholder="${esc(l.blurb)}">${esc(d.blurb)}</textarea>
            </label>
            <div class="field"><span class="field-label">Main photo</span>
              <div class="photo-pick">
                ${l.photos.map(k => `<button class="${d.hero === k ? 'is-selected' : ''}" data-act="hero:${k}" aria-pressed="${d.hero === k}">${A.photo(l, k)}<span>${d.hero === k ? ic('check') : ''}${A.photoLabel[k]}</span></button>`).join('')}
              </div>
            </div>
            <p class="hint">${ic('info')}Address, price, specs and agent details come from the listing and your profile, so they stay consistent on every product.</p>
          </div>
        </div>
        <footer class="modal-foot">
          ${S.editorConfirm ? `<div class="confirm-bar">${ic('alert')}<span>Close without saving? Your edits will be lost.</span><button class="btn btn-ghost btn-sm" data-act="editorKeep">Keep editing</button><button class="btn btn-danger btn-sm" data-act="editorDiscard">Discard edits</button></div>` : `
          <small class="muted">Saving changes the proof — you’ll be asked to review it again.</small>
          <div class="btn-row"><button class="btn btn-ghost" data-act="editorClose">Cancel</button>
          <button class="btn btn-primary" data-act="editorSave" ${dirty ? '' : 'disabled'}>${ic('check')}Save changes</button></div>`}
        </footer>
      </div>`;
  };

  const notesModal = () => `
    <div class="scrim" data-act="closeModal"></div>
    <div class="modal modal-notes" role="dialog" aria-modal="true" aria-label="Design notes">
      <header class="modal-head"><div><span class="eyebrow">Prototype</span><h2>Design notes</h2></div><button class="icon-btn" data-act="closeModal" aria-label="Close">${ic('x')}</button></header>
      <div class="modal-body notes">
        <h3>Jump to a scenario</h3>
        <div class="scenario-grid">
          ${[
            ['fresh', 'Start fresh', 'Listing & product selection'],
            ['qr', 'QR correction', 'Flyer link fails, then fix it'],
            ['sample', 'Missing sample address', 'Brochure mail warning'],
            ['radius', 'Radius audience', '50 nearby single-family homes'],
            ['checkout', 'Checkout', '$120 + $10 − credits = $70'],
          ].map(([id, t, s]) => `<button class="scenario" data-act="scenario:${id}"><b>${t}</b><small>${s}</small></button>`).join('')}
        </div>
        <h3>Directions considered</h3>
        <div class="dir-grid">
          <div class="dir is-picked"><span class="chip chip-green">Developed</span><b>A · Proof-first workspace</b><p>Proof and configuration side by side, product tabs with readiness, persistent order summary. Balances occasional agents and repeat coordinators.</p></div>
          <div class="dir"><b>B · Coordinator order board</b><p>A dense table of listings × products with bulk actions and inline status — fast for repeat work, intimidating for occasional agents.</p></div>
          <div class="dir"><b>C · Guided one-question flow</b><p>Full-screen steps with large choices and plain-language help. Very approachable, but slow and hides the proof while configuring.</p></div>
        </div>
        <h3>Proposed behavior beyond the brief</h3>
        <ul class="notes-list">
          <li>Text and photo editing in “Edit design” (the established editor only has QR controls).</li>
          <li>Proof review checkbox per product, versioned — any saved change asks for review again.</li>
          <li>Radius address data fee ($0.10 each), pickup locations and ready times, ship estimates.</li>
          <li>Upload / Street / Demographics / CRM flows are sketched, not designed.</li>
          <li>Sample copy priced at a flat $1.00; tax shown as an illustrative estimate.</li>
          <li>The QR code is a decorative pattern and link checks are simulated.</li>
        </ul>
      </div>
    </div>`;

  // ---------------------------------------------------------------- view: checkout
  const ckSteps = () => {
    const t = totals();
    const blocked = allIssues().length;
    const items = [
      ['products', 'Products', blocked ? `${blocked} to fix` : `${S.selected.length} ready`, blocked ? 'warn' : 'ok'],
      ['credits', 'Credits', t.promo + t.store + t.ad ? `${money(t.promo + t.store + t.ad)} applied` : 'Optional', t.promo + t.store + t.ad ? 'ok' : ''],
      ['payment', 'Payment', t.balance === 0 && t.methods.length ? `${money(t.due)} allocated` : 'Choose how to pay', t.balance === 0 && t.methods.length ? 'ok' : ''],
    ];
    return `<div class="ck-steps" role="tablist">${items.map(([id, label, sub, st], i) => `
      <button role="tab" aria-selected="${S.ck === id}" class="ck-step ${S.ck === id ? 'is-current' : ''}" data-act="ck:${id}">
        <span class="step-n ${st ? `is-${st}` : ''}">${st === 'ok' && S.ck !== id ? ic('check') : st === 'warn' ? ic('alert') : i + 1}</span>
        <span><b>${label}</b><small>${sub}</small></span>
      </button>`).join('')}</div>`;
  };

  const ckProducts = () => {
    const todo = allIssues();
    return `
      ${todo.length ? callout('warn', `${todo.length} thing${todo.length === 1 ? '' : 's'} to finish before submitting`, 'Fix opens the exact spot in the product, with your choices intact.') : ''}
      <div class="review-list">
        ${S.selected.map(pid => {
          const cfg = cfgOf(pid);
          const its = issues(pid);
          const detailed = DETAILED.includes(pid);
          return `
            <article class="review-card">
              <div class="review-thumb review-thumb-${pid}">${detailed ? `<div class="proof-sheet">${PR.render(pid, L(), { ...cfg, page: null })}</div>` : A.product(pid, L())}</div>
              <div class="review-main">
                <header><h3>${PRODUCT[pid].name}</h3>${statusPill(pid)}</header>
                ${detailed ? `
                  <dl class="facts">
                    <div><dt>Design</dt><dd>${D.templates[pid].find(t => t.id === cfg.template).name}${cfg.reviewedVersion === cfg.version ? ' · reviewed' : ''}${cfg.qr.status === 'saved' || cfg.qr.status === 'override' ? ' · QR code' : ''}</dd></div>
                    <div><dt>Distribution</dt><dd>${distMeta(pid)}${cfg.dist === 'mail' ? ` · ${D.mailClasses[cfg.mail.mailClass].label}` : ''}</dd></div>
                    ${cfg.dist !== 'download' ? `<div><dt>Paper</dt><dd>${D.pricing[pid].papers[cfg.paper].label}${cfg.pdfAddon ? ' + PDF copy' : ''}</dd></div>` : ''}
                    ${cfg.dist === 'mail' ? `<div><dt>Printed</dt><dd>${printed(cfg)} pieces</dd></div>` : ''}
                  </dl>` : `<p class="muted">${PRODUCT[pid].desc}</p>`}
                ${its.length ? `<ul class="fix-list">${its.map(i => `<li>${ic('alert')}<span>${esc(i.text)}</span><button class="btn btn-secondary btn-sm" data-act="fix:${pid}:${i.sec}">Fix</button></li>`).join('')}</ul>` : ''}
                <ul class="lines lines-compact">${lineItems(pid).map(i => `<li><span>${esc(i.label)}${i.detail ? `<small>${esc(i.detail)}</small>` : ''}</span><b>${i.amount == null ? '—' : money(i.amount)}</b></li>`).join('')}</ul>
                <div class="review-actions">
                  ${detailed ? `<button class="btn btn-ghost btn-sm" data-act="fix:${pid}:review">${ic('eye')}View proof</button><button class="btn btn-ghost btn-sm" data-act="fix:${pid}:dist">${ic('edit')}Change distribution</button>` : ''}
                  <button class="btn btn-ghost btn-sm btn-danger-text" data-act="toggleProduct:${pid}">${ic('trash')}Remove</button>
                </div>
              </div>
              <div class="review-amt">${productTotal(pid) == null ? '—' : money(productTotal(pid))}</div>
            </article>`;
        }).join('')}
      </div>
      <div class="ck-foot"><button class="btn btn-ghost" data-act="go:start">${ic('plus')}Add another product</button><button class="btn btn-primary btn-lg" data-act="ck:credits">Continue to credits${ic('arrowR')}</button></div>`;
  };

  const ckCredits = () => {
    const t = totals();
    const C = S.credits;
    const pc = C.promo && D.credits.promoCodes[C.promo];
    return `
      <div class="credit-grid">
        <section class="credit ${pc ? 'is-applied' : ''}">
          <header>${ic('tag')}<div><h3>Promo code</h3><p>One code per order.</p></div>${pc ? `<b class="credit-amt">−${money(t.promo)}</b>` : ''}</header>
          ${pc ? `
            <div class="applied">${ic('check')}<span><b>${C.promo}</b> · ${pc.label}</span><button class="btn btn-ghost btn-sm" data-act="promoRemove">Remove</button></div>
          ` : `
            <div class="inline-form">
              <label class="field ${C.promoErr ? 'has-error' : ''}"><span class="field-label">Code</span><input data-bind="credits.code" value="${esc(C.code)}" placeholder="e.g. WILLOW10" autocapitalize="characters"></label>
              <button class="btn btn-secondary" data-act="promoApply">Apply</button>
            </div>
            ${C.promoErr ? `<p class="field-error">${ic('alert')}${C.promoErr}</p>` : '<p class="hint"><span>Try <b>WILLOW10</b> in this prototype.</span></p>'}
          `}
        </section>
        ${['store', 'ad'].map(k => {
          const on = k === 'store' ? C.storeOn : C.adOn;
          const bal = k === 'store' ? D.credits.storeCredit : D.credits.adBudget;
          const applied = t[k];
          const asked = Number(C[k]) || 0;
          return `
            <section class="credit ${on ? 'is-applied' : ''}">
              <header>${ic(k === 'store' ? 'wallet' : 'megaphone')}<div><h3>${k === 'store' ? 'Store credit' : 'Ad budget'}</h3><p>${k === 'store' ? 'Credit from refunds and promotions.' : 'Marketing allowance from Cedar Realty.'}</p></div>${on ? `<b class="credit-amt">−${money(applied)}</b>` : ''}</header>
              ${toggle(`credits.${k}On`, on, `Apply ${k === 'store' ? 'store credit' : 'ad budget'}`, `Available: ${money(bal)}`)}
              ${on ? `
                <div class="inline-form">
                  <label class="field"><span class="field-label">Amount to use</span><span class="input-prefix"><i>$</i><input data-bind="credits.${k}" data-num="1" inputmode="decimal" value="${esc(C[k])}"></span></label>
                  <button class="btn btn-ghost btn-sm" data-act="creditMax:${k}">Use max</button>
                </div>
                ${asked > applied ? `<p class="hint">${ic('info')}<span>Limited to ${money(applied)} — ${asked > bal ? 'your available balance' : 'what’s left on this order'}.</span></p>` : ''}
                <div class="balance-bar"><span style="width:${Math.min(100, (applied / bal) * 100)}%"></span></div>
                <p class="balance-text"><span>Using <b>${money(applied)}</b></span><span>Left after this order <b>${money(r2(bal - applied))}</b></span></p>
              ` : ''}
            </section>`;
        }).join('')}
      </div>
      <div class="ck-foot"><button class="btn btn-ghost" data-act="ck:products">${ic('chevronL')}Products</button><button class="btn btn-primary btn-lg" data-act="ck:payment">Continue to payment · ${money(t.due)} left${ic('arrowR')}</button></div>`;
  };

  const ckPayment = () => {
    const t = totals();
    const P = S.pay;
    const corp = D.payment.corporate[0];
    const multi = t.methods.length > 1;
    const methodRow = (id, icn, title, sub, extra = '') => {
      const on = !!P.sel[id];
      return `
        <div class="pay-method ${on ? 'is-selected' : ''}">
          <label class="pay-head">
            <input type="checkbox" data-act-change="payToggle:${id}" ${on ? 'checked' : ''}>
            ${ic(icn)}<span><b>${title}</b><small>${sub}</small></span>
            ${on && !multi ? `<b class="pay-amt">${money(t.due)}</b>` : ''}
          </label>
          ${on && multi ? `
            <div class="pay-alloc">
              <label class="field"><span class="field-label">Amount on this method</span><span class="input-prefix"><i>$</i><input data-bind="pay.amt.${id}" data-num="1" inputmode="decimal" value="${esc(P.amt[id] ?? '')}"></span></label>
              ${t.balance > 0 ? `<button class="btn btn-ghost btn-sm" data-act="payRemainder:${id}">Put remaining ${money(t.balance)} here</button>` : ''}
            </div>` : ''}
          ${on ? extra : ''}
        </div>`;
    };
    const ccErr = P.tried && !P.costCenter.trim();
    const corpExtra = `
      <div class="pay-extra">
        <p class="explain">${ic('info')}<span>Orders on this account go to <b>${corp.approver}</b> (${corp.approverRole}) for approval. Nothing prints until it’s approved.</span></p>
        <div class="field-pair field-pair-even">
          ${field('Cost center', 'pay.costCenter', P.costCenter, { placeholder: 'e.g. MKT-4410', error: ccErr ? 'Required for corporate billing' : '' })}
          <label class="field"><span class="field-label">Organization</span><select data-bind="pay.org">${D.payment.orgs.map(o => `<option ${P.org === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        </div>
        <label class="field"><span class="field-label">Note for approver <em>optional</em></span><textarea data-bind="pay.comment" rows="2" placeholder="e.g. Launch package for 128 Willow Lane — goes live Saturday">${esc(P.comment)}</textarea></label>
      </div>`;
    const reasons = [];
    if (allIssues().length) reasons.push(['products', `${allIssues().length} product item${allIssues().length === 1 ? '' : 's'} to finish`]);
    if (!t.methods.length && t.due > 0) reasons.push(['', 'Choose a payment method']);
    if (t.methods.length && t.balance !== 0) reasons.push(['', t.balance > 0 ? `Allocate the remaining ${money(t.balance)}` : `Allocations exceed the total by ${money(-t.balance)}`]);
    if (P.sel.corp && !P.costCenter.trim()) reasons.push(['', 'Add a cost center for corporate billing']);
    if (!P.ack) reasons.push(['', 'Confirm the proof acknowledgement']);
    const approval = !!P.sel.corp;
    return `
      <div class="pay-due"><span>Remaining after credits</span><b>${money(t.due)}</b></div>
      <h4 class="drawer-h">Saved cards</h4>
      ${P.cards.map(c => methodRow(c.id, 'card', `${c.brand} •••• ${c.last4}`, `${c.holder} · exp ${c.exp}${c.isNew ? ' · added just now' : ''}`)).join('')}
      ${P.addCard ? `
        <div class="add-card">
          ${callout('info', 'Simulated', 'Nothing is stored or charged. Enter any test-looking values.')}
          <div class="addr-form">
            ${field('Name on card', 'pay.newCard.name', P.newCard.name, { cls: 'span-2' })}
            ${field('Card number', 'pay.newCard.number', P.newCard.number, { cls: 'span-2', attrs: 'inputmode="numeric" autocomplete="off"', error: P.cardErr })}
            <div class="field-pair">${field('Expiry', 'pay.newCard.exp', P.newCard.exp, { placeholder: 'MM/YY', attrs: 'autocomplete="off"' })}${field('CVC', 'pay.newCard.cvc', P.newCard.cvc, { attrs: 'autocomplete="off" maxlength="4"' })}</div>
            ${field('Billing ZIP', 'pay.newCard.zip', P.newCard.zip, { attrs: 'maxlength="5"' })}
          </div>
          <div class="btn-row"><button class="btn btn-ghost btn-sm" data-act="addCardToggle">Cancel</button><button class="btn btn-secondary btn-sm" data-act="addCardSave">Add card</button></div>
        </div>` : `<button class="link-btn" data-act="addCardToggle">${ic('plus')}Add a card</button>`}
      <h4 class="drawer-h">Corporate billing</h4>
      ${methodRow('corp', 'building', corp.name, `Approval by ${corp.approver}`, corpExtra)}
      ${multi ? `<div class="alloc-sum ${t.balance === 0 ? 'is-ok' : 'is-off'}">${ic(t.balance === 0 ? 'check' : 'alert')}<span>Allocated ${money(t.allocated)} of ${money(t.due)}</span><b>${t.balance === 0 ? 'Fully covered' : t.balance > 0 ? `${money(t.balance)} unallocated` : `${money(-t.balance)} over`}</b></div>` : ''}
      <label class="check ack ${P.tried && !P.ack ? 'has-error' : ''}">
        <input type="checkbox" data-bind="pay.ack" ${P.ack ? 'checked' : ''}>
        <span><b>I’ve reviewed every proof and accept responsibility for its content.</b>
        <small>That includes spelling, prices, photos, contact details, QR links and mailing lists. Printing can’t be changed once production starts.</small></span>
      </label>
      <div class="submit-box">
        ${reasons.length ? `<div class="reasons"><b>Before you can ${approval ? 'submit' : 'place this order'}:</b><ul>${reasons.map(([go, r]) => `<li>${go ? `<button class="link-btn" data-act="ck:${go}">${r}</button>` : r}</li>`).join('')}</ul></div>` : ''}
        <div class="submit-row">
          <p>${approval
            ? `${ic('clock')}<span><b>Submit for Approval</b> sends this order to ${corp.approver}. ${t.methods.length > 1 ? 'Card portions are authorized now and charged only after approval.' : 'You’ll get an email when it’s approved.'}</span>`
            : `${ic('lock')}<span><b>Place order</b> charges your card now (simulated) and sends files to production.</span>`}</p>
          <button class="btn btn-primary btn-lg" data-act="submit" ${reasons.length ? 'aria-disabled="true"' : ''}>${approval ? 'Submit for Approval' : `Place order · ${money(t.due)}`}</button>
        </div>
      </div>`;
  };

  const ckSummary = () => {
    const t = totals();
    const P = S.pay;
    return `
      <aside class="summary summary-ck" aria-label="Order total">
        <div class="summary-head"><span class="eyebrow">Order total</span><b>${esc(L().street)}</b><small>${S.selected.map(p => PRODUCT[p].name).join(' · ')}</small></div>
        <ul class="lines">
          ${S.selected.map(pid => `<li><span>${PRODUCT[pid].name}<small>${distMeta(pid)}</small></span><b>${money(productTotal(pid))}</b></li>`).join('')}
        </ul>
        <ul class="lines lines-math">
          <li><span>Subtotal</span><b>${money(t.subtotal)}</b></li>
          <li><span>Estimated tax<small>Illustrative estimate</small></span><b>${money(t.tax)}</b></li>
          ${t.promo ? `<li class="is-credit"><span>Promo ${S.credits.promo}</span><b>−${money(t.promo)}</b></li>` : ''}
          ${t.store ? `<li class="is-credit"><span>Store credit</span><b>−${money(t.store)}</b></li>` : ''}
          ${t.ad ? `<li class="is-credit"><span>Ad budget</span><b>−${money(t.ad)}</b></li>` : ''}
        </ul>
        <div class="summary-total"><span>Remaining to pay</span><b>${money(t.due)}</b></div>
        ${t.methods.length ? `
          <ul class="lines lines-alloc">
            ${t.methods.map(m => {
              const card = P.cards.find(c => c.id === m);
              return `<li><span>${card ? `${card.brand} •••• ${card.last4}` : 'Corporate billing'}</span><b>${money(t.alloc[m])}</b></li>`;
            }).join('')}
            <li class="${t.balance === 0 ? 'is-ok' : 'is-off'}"><span>Balance remaining</span><b>${money(t.balance)}</b></li>
          </ul>` : '<p class="summary-note">No payment method chosen yet.</p>'}
        ${t.store || t.ad ? `<div class="left-after">${t.store ? `<span>Store credit left <b>${money(r2(D.credits.storeCredit - t.store))}</b></span>` : ''}${t.ad ? `<span>Ad budget left <b>${money(r2(D.credits.adBudget - t.ad))}</b></span>` : ''}</div>` : ''}
      </aside>`;
  };

  const viewCheckout = () => `
    <div class="layout">
      <main class="main">
        <div class="ck-head"><h1>Review &amp; submit</h1>${ckSteps()}</div>
        <div class="ck-body">${S.ck === 'products' ? ckProducts() : S.ck === 'credits' ? ckCredits() : ckPayment()}</div>
      </main>
      ${ckSummary()}
    </div>`;

  const viewDone = () => {
    const o = S.order;
    return `
      <div class="done">
        <div class="done-card">
          <span class="done-ico">${ic(o.approval ? 'clock' : 'check')}</span>
          <h1>${o.approval ? 'Submitted for approval' : 'Order placed'}</h1>
          <p>${o.approval ? `${o.approver} will review order <b>${o.id}</b>. We’ll email you as soon as it’s approved — nothing prints before then.` : `Order <b>${o.id}</b> is headed to production.`}</p>
          <ol class="timeline">
            <li class="is-done"><b>Submitted</b><small>Today, ${o.time}</small></li>
            ${o.approval ? `<li class="is-current"><b>Awaiting approval</b><small>${o.approver} · usually within 1 business day</small></li>` : ''}
            <li><b>Printing</b><small>After ${o.approval ? 'approval' : 'payment'}</small></li>
            <li><b>Mailed &amp; shipped</b><small>${o.summary}</small></li>
          </ol>
          <dl class="facts facts-done">
            <div><dt>Listing</dt><dd>${esc(L().street)}</dd></div>
            <div><dt>Products</dt><dd>${S.selected.map(p => PRODUCT[p].name).join(', ')}</dd></div>
            <div><dt>Paid with</dt><dd>${o.methods}</dd></div>
            <div><dt>Total after credits</dt><dd>${money(o.due)}</dd></div>
          </dl>
          <div class="btn-row center"><button class="btn btn-secondary" data-act="scenario:fresh">Start another order</button><button class="btn btn-ghost" data-act="notes">${ic('note')}Design notes</button></div>
          <p class="hint center">${ic('info')}Simulated — no payment, printing, mailing or approval request actually happened.</p>
        </div>
      </div>`;
  };

  // ---------------------------------------------------------------- render
  const render = () => {
    const active = document.activeElement;
    const focusKey = active?.dataset?.bind;
    const focusIsRange = active?.type === 'range';
    const sel = focusKey && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
    const scrolls = {};
    document.querySelectorAll('[data-scroll]').forEach(el => { scrolls[el.dataset.scroll] = el.scrollTop; });

    const views = { start: viewStart, customize: viewCustomize, checkout: viewCheckout, done: viewDone };
    $root.innerHTML = `
      ${topbar()}
      ${S.view !== 'start' ? contextBar() : `<div class="ctx ctx-start"><div class="ctx-title"><span class="eyebrow">New order</span><h1>Start with the property</h1></div>${steps()}</div>`}
      ${views[S.view]()}
      ${drawer()}
      ${modal()}
      ${S.toast ? `<div class="toast" role="status">${ic('check')}${S.toast}</div>` : ''}`;
    $root.querySelectorAll('.drawer-body, .modal-body').forEach((el, i) => { el.dataset.scroll = el.className + i; if (scrolls[el.dataset.scroll]) el.scrollTop = scrolls[el.dataset.scroll]; });

    if (focusKey) {
      const els = [...$root.querySelectorAll(`[data-bind="${CSS.escape(focusKey)}"]`)];
      const el = els.find(e => (e.type === 'range') === focusIsRange) || els[0];
      if (el) {
        el.focus({ preventScroll: true });
        if (sel && el.setSelectionRange && el.type !== 'range') try { el.setSelectionRange(sel[0], sel[1]); } catch { /* not a text input */ }
      }
    }
    if (S.hl && S.scrollTo) {
      const t = document.getElementById(`sec-${S.hl}`) || document.querySelector(`[data-sec="${S.hl}"]`);
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      S.scrollTo = false;
    }
  };

  let toastTimer;
  let hlTimer;
  const toast = msg => {
    S.toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { S.toast = null; render(); }, 2800);
  };
  const highlight = key => {
    S.hl = key;
    S.scrollTo = true;
    clearTimeout(hlTimer);
    hlTimer = setTimeout(() => { S.hl = null; render(); }, 1800);
  };
  const bumpVersion = cfg => { cfg.version += 1; };

  // ---------------------------------------------------------------- actions
  const actions = {
    go: v => {
      if (v === 'customize' && !S.selected.length) return;
      if (v === 'customize' && !S.selected.includes(S.active)) S.active = S.selected[0];
      S.view = v;
      S.listingMenu = false;
      window.scrollTo({ top: 0 });
    },
    listingMenu: () => { S.listingMenu = !S.listingMenu; },
    chooseListing: id => {
      S.listingMenu = false;
      if (id === S.listingId) return;
      S.listingId = id;
      Object.values(S.products).forEach(bumpVersion);
      toast(`All proofs now use ${L().street}. Please review them again.`);
    },
    selectListing: id => { S.listingId = id; },
    toggleProduct: id => {
      const i = S.selected.indexOf(id);
      if (i >= 0) {
        S.selected.splice(i, 1);
        if (S.view !== 'start') toast(`${PRODUCT[id].name} removed from this order`);
        if (S.active === id) S.active = S.selected[0];
        if (!S.selected.length && S.view !== 'start') S.view = 'start';
      } else {
        S.selected.push(id);
        S.selected.sort((a, b) => D.products.findIndex(p => p.id === a) - D.products.findIndex(p => p.id === b));
      }
    },
    startCustomize: () => {
      S.active = S.selected[0];
      S.view = 'customize';
      window.scrollTo({ top: 0 });
    },
    tab: pid => {
      S.active = pid;
      if (S.view !== 'customize') S.view = 'customize';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    template: id => {
      const cfg = cfgOf(S.active);
      if (cfg.template === id) return;
      cfg.template = id;
      bumpVersion(cfg);
    },
    toggleDefault: () => {
      const cfg = cfgOf(S.active);
      if (S.defaults[S.active] === cfg.template) {
        delete S.defaults[S.active];
      } else {
        S.defaults[S.active] = cfg.template;
        toast(`${D.templates[S.active].find(t => t.id === cfg.template).name} is now your default for ${PRODUCT[S.active].name.toLowerCase()}`);
      }
    },
    page: id => { cfgOf(S.active).page = id; },
    review: () => {
      const cfg = cfgOf(S.active);
      cfg.reviewedVersion = cfg.reviewedVersion === cfg.version ? 0 : cfg.version;
    },
    openEditor: () => {
      S.draft = clone(cfgOf(S.active).content);
      S.modal = 'editor';
      S.editorConfirm = false;
    },
    hero: k => { S.draft.hero = k; },
    editorClose: () => {
      const dirty = JSON.stringify(S.draft) !== JSON.stringify(cfgOf(S.active).content);
      if (dirty && !S.editorConfirm) { S.editorConfirm = true; return; }
      S.modal = null;
    },
    editorKeep: () => { S.editorConfirm = false; },
    editorDiscard: () => { S.modal = null; S.editorConfirm = false; },
    editorSave: () => {
      const cfg = cfgOf(S.active);
      cfg.content = clone(S.draft);
      cfg.savedAt = nowTime();
      bumpVersion(cfg);
      S.modal = null;
      toast('Design saved. Review the updated proof when you’re ready.');
    },
    qrToggle: () => { const q = cfgOf(S.active).qr; q.open = !q.open; },
    qrCheck: () => {
      const q = cfgOf(S.active).qr;
      const r = checkUrl(q.url);
      if (r.ok) {
        Object.assign(q, { status: 'valid', url: r.url, error: '', errorKind: '', note: r.added ? 'we added https://' : '' });
      } else {
        Object.assign(q, { status: 'invalid', error: r.msg, errorKind: r.kind, override: false });
        if (r.url) q.url = r.url;
      }
    },
    qrSave: () => {
      const cfg = cfgOf(S.active);
      const q = cfg.qr;
      q.status = q.status === 'valid' ? 'saved' : 'override';
      q.savedUrl = q.url;
      q.error = '';
      cfg.savedAt = nowTime();
      bumpVersion(cfg);
      toast('QR code saved to the design');
    },
    qrDiscard: () => {
      const q = cfgOf(S.active).qr;
      if (q.savedUrl) Object.assign(q, { url: q.savedUrl, status: q.override ? 'override' : 'saved', error: '' });
      else Object.assign(q, { url: '', status: 'none', error: '', override: false });
    },
    qrDelete: () => { cfgOf(S.active).qr.confirmDelete = true; },
    qrDeleteCancel: () => { cfgOf(S.active).qr.confirmDelete = false; },
    qrDeleteConfirm: () => {
      const cfg = cfgOf(S.active);
      Object.assign(cfg.qr, { url: '', savedUrl: '', status: 'none', confirmDelete: false, override: false });
      cfg.savedAt = nowTime();
      bumpVersion(cfg);
      toast('QR code removed');
    },
    dist: id => { cfgOf(S.active).dist = id; },
    mailClass: id => { cfgOf(S.active).mail.mailClass = id; },
    paper: id => {
      const cfg = cfgOf(S.active);
      cfg.paper = id;
    },
    qty: delta => {
      const cfg = cfgOf(S.active);
      const b = cfg[cfg.dist];
      b.qty = Math.max(0, b.qty + Number(delta));
    },
    qtySet: n => { const cfg = cfgOf(S.active); cfg[cfg.dist].qty = Number(n); },
    pickupLoc: id => { cfgOf(S.active).pickup.location = id; },
    dlFormat: f => { cfgOf(S.active).download.format = f; },
    shipEdit: () => { cfgOf(S.active).ship.editAddr = true; },
    shipDone: () => { cfgOf(S.active).ship.editAddr = false; },
    useOffice: () => {
      const m = cfgOf(S.active).mail;
      m.sampleAddr = { ...D.agent.office };
      m.sampleEdit = false;
      toast('Sample copy will go to the Cedar Realty office');
    },
    sampleEdit: () => { cfgOf(S.active).mail.sampleEdit = true; },
    sampleDone: () => { cfgOf(S.active).mail.sampleEdit = false; },
    removeList: (pid, id) => {
      const m = cfgOf(pid).mail;
      m.lists = m.lists.filter(x => x !== id);
    },
    openLists: () => { S.drawer = { view: 'lists', pid: S.active }; },
    closeDrawer: () => { S.drawer = null; S.editList = null; },
    drawerBack: () => { S.drawer = { ...S.drawer, view: 'lists' }; },
    toggleList: id => {
      const m = cfgOf(S.drawer.pid).mail;
      m.lists = m.lists.includes(id) ? m.lists.filter(x => x !== id) : [...m.lists, id];
    },
    editList: id => { S.editList = id && S.editList !== id ? id : null; },
    createMethod: m => {
      const pid = S.drawer?.pid || S.active;
      S.drawer = m === 'radius' ? { view: 'radius', pid } : { view: 'method', method: m, pid };
    },
    radiusSave: () => {
      const R = S.radius;
      const res = A.radiusSelect(R);
      const name = R.nameEdited ? R.name : `${L().street.replace(/^\d+\s/, '')} · ${R.qty} nearest ${R.sf && R.mf ? 'homes' : R.mf ? 'multi-family' : 'single-family'}`;
      const id = 'radius' + Date.now();
      S.lists.unshift({ id, name, qty: res.picked.length, created: 'Oct 30, 2026', source: `Radius · ${res.miles.toFixed(2)} mi around ${R.center}`, radius: true, preview: res.picked.slice(0, 6).map(h => `${h.num} ${h.street}`) });
      const m = cfgOf(S.drawer.pid).mail;
      m.lists = [...m.lists, id];
      S.drawer = { ...S.drawer, view: 'lists' };
      S.hl = 'list-' + id;
      clearTimeout(hlTimer);
      hlTimer = setTimeout(() => { S.hl = null; render(); }, 1800);
      toast(`${res.picked.length} addresses added to your ${SINGULAR[S.drawer.pid].toLowerCase()}`);
    },
    next: () => {
      const i = S.selected.indexOf(S.active);
      const nxt = S.selected[i + 1];
      if (nxt) { S.active = nxt; window.scrollTo({ top: 0, behavior: 'smooth' }); } else { S.view = 'checkout'; S.ck = 'products'; window.scrollTo({ top: 0 }); }
    },
    fix: (pid, secKey) => {
      S.view = 'customize';
      S.active = pid;
      const cfg = cfgOf(pid);
      if (secKey === 'qr') cfg.qr.open = true;
      if (secKey === 'sample') cfg.mail.sampleEdit = true;
      highlight(secKey === 'review' ? 'review' : secKey);
    },
    ck: step => { S.ck = step; window.scrollTo({ top: 0 }); },
    promoApply: () => {
      const code = S.credits.code.trim().toUpperCase();
      if (!code) { S.credits.promoErr = 'Enter a code first.'; return; }
      if (D.credits.promoCodes[code]) { S.credits.promo = code; S.credits.promoErr = ''; toast(`${code} applied`); } else S.credits.promoErr = `“${code}” isn’t a valid code for this order. Check for typos — codes aren’t case-sensitive.`;
    },
    promoRemove: () => { S.credits.promo = null; S.credits.code = ''; },
    creditMax: k => {
      const t = totals();
      const bal = k === 'store' ? D.credits.storeCredit : D.credits.adBudget;
      S.credits[k] = Math.min(bal, r2(t.due + t[k]));
    },
    payToggle: id => {
      S.pay.sel[id] = !S.pay.sel[id];
      const t = totals();
      if (t.methods.length > 1 && S.pay.sel[id]) {
        const others = t.methods.filter(m => m !== id);
        const used = others.reduce((s, m) => s + (Number(S.pay.amt[m]) || 0), 0);
        if (!used) others.forEach((m, i) => { S.pay.amt[m] = i === 0 ? r2(t.due) : 0; });
        S.pay.amt[id] = 0;
      }
    },
    payRemainder: id => {
      const t = totals();
      S.pay.amt[id] = r2((Number(S.pay.amt[id]) || 0) + t.balance);
    },
    addCardToggle: () => { S.pay.addCard = !S.pay.addCard; S.pay.cardErr = ''; },
    addCardSave: () => {
      const c = S.pay.newCard;
      const digits = c.number.replace(/\D/g, '');
      if (digits.length < 12 || !c.name.trim()) { S.pay.cardErr = 'Enter a name and a card number of at least 12 digits (simulated).'; return; }
      const id = 'new' + Date.now();
      S.pay.cards.push({ id, brand: digits[0] === '5' ? 'Mastercard' : 'Visa', last4: digits.slice(-4), holder: c.name, exp: c.exp || '—', isNew: true });
      S.pay.newCard = { name: '', number: '', exp: '', cvc: '', zip: '' };
      S.pay.addCard = false;
      S.pay.cardErr = '';
      toast('Card added for this order (simulated)');
    },
    submit: () => {
      S.pay.tried = true;
      const t = totals();
      const blocked = allIssues().length || (t.methods.length === 0 && t.due > 0) || t.balance !== 0 || (S.pay.sel.corp && !S.pay.costCenter.trim()) || !S.pay.ack;
      if (blocked) return;
      const corp = D.payment.corporate[0];
      S.order = {
        id: 'APM-26-' + String(10871 + Math.floor(Math.random() * 80)),
        approval: !!S.pay.sel.corp,
        approver: corp.approver,
        due: t.due,
        time: nowTime(),
        methods: t.methods.map(m => { const c = S.pay.cards.find(x => x.id === m); return `${c ? `${c.brand} •••• ${c.last4}` : 'Corporate billing'} ${money(t.alloc[m])}`; }).join(' + ') || 'Credits only',
        summary: S.selected.filter(p => DETAILED.includes(p)).map(distMeta).join(' · '),
      };
      S.view = 'done';
      window.scrollTo({ top: 0 });
    },
    notes: () => { S.modal = 'notes'; },
    closeModal: () => { S.modal = null; },
    scenario: id => scenario(id),
  };

  const scenario = id => {
    const keepToast = S.toast;
    S = initState();
    S.toast = keepToast;
    const f = S.products.flyer;
    const b = S.products.brochure;
    const readyFlyer = () => {
      Object.assign(f.qr, { open: false, url: L().url, savedUrl: L().url, status: 'saved' });
      f.version = 2;
      f.reviewedVersion = 2;
      f.savedAt = nowTime();
    };
    const addRadius = () => {
      const res = A.radiusSelect(S.radius);
      S.lists.unshift({ id: 'radius1', name: 'Willow Lane · 50 nearest single-family', qty: res.picked.length, created: 'Oct 30, 2026', source: `Radius · ${res.miles.toFixed(2)} mi around 128 Willow Lane`, radius: true, preview: res.picked.slice(0, 6).map(h => `${h.num} ${h.street}`) });
      b.mail.lists.push('radius1');
    };
    if (id === 'fresh') { S.selected = []; }
    if (id === 'flyer' || id === 'brochure') { S.view = 'customize'; S.active = id; }
    if (id === 'lists') { S.view = 'customize'; S.active = 'brochure'; S.drawer = { view: 'lists', pid: 'brochure' }; }
    if (id === 'editor') { S.view = 'customize'; S.active = 'flyer'; actions.openEditor(); return; }
    if (id === 'qr') { S.view = 'customize'; S.active = 'flyer'; actions.qrCheck(); highlight('qr'); }
    if (id === 'sample') { S.view = 'customize'; S.active = 'brochure'; highlight('sample'); }
    if (id === 'radius') { S.view = 'customize'; S.active = 'brochure'; S.drawer = { view: 'radius', pid: 'brochure' }; }
    if (id === 'checkout') {
      readyFlyer();
      addRadius();
      b.mail.sampleAddr = { ...D.agent.office };
      b.reviewedVersion = b.version;
      Object.assign(S.credits, { promo: 'WILLOW10', code: 'WILLOW10', storeOn: true, store: 20, adOn: true, ad: 30 });
      S.view = 'checkout';
      S.ck = 'payment';
    }
    S.modal = null;
    window.scrollTo({ top: 0 });
  };

  // ---------------------------------------------------------------- events
  const setPath = (path, value) => {
    const keys = path.split('.');
    let o = S;
    keys.slice(0, -1).forEach(k => { o = o[k]; });
    o[keys[keys.length - 1]] = value;
  };

  const afterBind = path => {
    let m = path.match(/^products\.(\w+)\.qr\.url$/);
    if (m) Object.assign(cfgOf(m[1]).qr, { status: 'draft', error: '', errorKind: '', override: false, note: '' });
    if (path === 'radius.name') S.radius.nameEdited = true;
    if (path === 'radius.qty') S.radius.qty = Math.max(1, Math.min(150, S.radius.qty || 0));
    if (path === 'credits.code') S.credits.promoErr = '';
    m = path.match(/^pay\.newCard/);
    if (m) S.pay.cardErr = '';
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const [name, ...args] = el.dataset.act.split(':');
    if (!actions[name]) return;
    if (el.getAttribute('aria-disabled') === 'true' && name !== 'submit') return;
    e.preventDefault();
    actions[name](...args);
    render();
  });

  document.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.actChange) {
      const [name, ...args] = el.dataset.actChange.split(':');
      actions[name](...args);
      render();
      return;
    }
    if (el.dataset.bind && (el.type === 'checkbox' || el.tagName === 'SELECT')) {
      setPath(el.dataset.bind, el.type === 'checkbox' ? el.checked : el.value);
      afterBind(el.dataset.bind);
      render();
    }
  });

  document.addEventListener('input', e => {
    const el = e.target;
    if (!el.dataset.bind || el.type === 'checkbox' || el.tagName === 'SELECT') return;
    let v = el.value;
    if (el.dataset.num) v = v === '' ? '' : Number(v.replace(/[^\d.]/g, ''));
    setPath(el.dataset.bind, v);
    afterBind(el.dataset.bind);
    render();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (S.modal === 'editor') actions.editorClose();
    else if (S.modal) S.modal = null;
    else if (S.drawer) S.drawer = null;
    else if (S.listingMenu) S.listingMenu = false;
    else return;
    render();
  });

  const applyHash = () => {
    const fromHash = location.hash.match(/scenario=(\w+)/);
    if (fromHash) scenario(fromHash[1]);
    if (fromHash && ['credits', 'products'].includes(location.hash.match(/step=(\w+)/)?.[1])) S.ck = location.hash.match(/step=(\w+)/)[1];
    render();
  };
  window.addEventListener('hashchange', applyHash);
  applyHash();
})();
