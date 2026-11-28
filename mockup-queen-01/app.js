(() => {
  const SP = 'https://www.queenspadanang.vn/uploads/product/';
  const GAL = 'https://www.queenspadanang.vn/uploads/gal/';
  const I18N = window.QUEEN_I18N;

  // Price list from queenspadanang.vn — each option is [minutes, VND, USD]. Names live in i18n.js under "t.<img id>".
  const CATS = [
    { id: 'body', items: [
      { img: 'sp_479.png', sig: true, opts: [[60, 1100000, 41], [90, 1500000, 57], [120, 1800000, 68]] },
      { img: 'sp_456.jpg', sig: true, opts: [[90, 800000, 32.5], [120, 1050000, 42.5]] },
      { img: 'sp_457.jpg', sig: true, opts: [[90, 850000, 34], [120, 1100000, 43]] },
      { img: 'sp_455.jpg', sig: true, opts: [[60, 550000, 21.5], [90, 800000, 31.5]] },
      { img: 'sp_452.jpg', opts: [[70, 590000, 23.5], [90, 750000, 30.5], [120, 980000, 40.5]] },
      { img: 'sp_459.jpg', opts: [[90, 850000, 34], [120, 1100000, 43]] },
      { img: 'sp_460.jpg', opts: [[70, 650000, 25], [90, 830000, 32.5]] },
      { img: 'sp_451.jpg', opts: [[70, 550000, 22.5], [90, 700000, 29], [120, 950000, 39]] },
      { img: 'sp_454.jpg', opts: [[70, 590000, 24.5], [90, 750000, 31], [120, 980000, 41.5]] },
      { img: 'sp_453.jpg', opts: [[60, 550000, 20.5], [90, 800000, 31]] },
      { img: 'sp_440.jpg', opts: [[60, 500000, 19.5], [90, 750000, 29]] },
      { img: 'sp_462.jpg', opts: [[60, 550000, 21.5], [90, 800000, 32.5]] },
    ] },
    { id: 'foot', items: [
      { img: 'sp_467.jpg', opts: [[60, 500000, 19.5]] },
      { img: 'sp_469.jpg', opts: [[70, 540000, 21.5]] },
      { img: 'sp_470.jpg', opts: [[70, 580000, 24.5]] },
    ] },
    { id: 'face', items: [
      { img: 'sp_465.jpg', opts: [[60, 500000, 19.5]] },
      { img: 'sp_466.jpg', opts: [[40, 400000, 15]] },
    ] },
    { id: 'scrub', items: [
      { img: 'sp_472.jpg', opts: [[50, 500000, 19.5]] },
    ] },
    { id: 'wax', items: [
      { img: 'sp_475.jpg', opts: [[0, 450000, 17]] },
      { img: 'sp_474.jpg', opts: [[0, 350000, 13]] },
      { img: 'sp_477.jpg', opts: [[0, 300000, 10.5]] },
      { img: 'sp_476.jpg', opts: [[0, 250000, 8.5]] },
      { img: 'sp_478.jpg', opts: [[0, 600000, 24]] },
      { img: 'sp_473.jpg', opts: [[0, 120000, 4.5]] },
    ] },
  ];

  const CHAMBERS = [
    { id: 'egypt', imgs: ['slide_816.jpg', 'slide_815.jpg', 'slide_814.jpg', 'slide_813.jpg', 'slide_812.jpg'] },
    { id: 'arabic', imgs: ['slide_808.jpg', 'slide_807.jpg'] },
    { id: 'forest', imgs: ['slide_806.jpg', 'slide_805.jpg'] },
    { id: 'bath', imgs: ['slide_804.jpg', 'slide_803.jpg'] },
  ];
  const BOOKABLE = CHAMBERS.slice(0, 3);

  const MOMENTS = ['slide_801.jpg', 'slide_800.jpg', 'slide_782.jpg', 'slide_799.jpg', 'slide_781.jpg', 'slide_783.jpg', 'slide_776.jpg', 'slide_774.png'];

  const OPEN = 10 * 60;
  const CLOSE = 21 * 60 + 30;
  const LANG_KEY = 'queen-spa-vxm-lang';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Language ----------
  const codes = I18N.languages.map((l) => l.code);
  const initialLang = () => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (codes.includes(saved)) return saved;
    } catch (_) { /* storage may be blocked */ }
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return codes.includes(nav) ? nav : 'en';
  };

  const state = { lang: initialLang(), cat: 'body', cur: 'vnd', chamber: 'egypt', chamberImg: 0, pick: null, slot: null, room: 0, moment: null, requested: false };

  const t = (key, vars) => {
    const raw = I18N[state.lang][key] ?? I18N.en[key] ?? key;
    return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : raw;
  };
  const tName = (item) => t('t.' + item.img.split('.')[0]);

  const money = (vnd, usd) => state.cur === 'vnd'
    ? Math.round(vnd).toLocaleString('vi-VN') + ' ₫'
    : 'US$' + (Math.round(usd * 10) / 10).toString();
  const mins = (m) => m ? `${m}′` : t('perArea');
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  const setRadio = (btns, on) => btns.forEach((b) => {
    b.classList.toggle('on', b === on);
    b.setAttribute(b.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-checked', String(b === on));
  });

  const langSelect = $('[data-lang]');
  langSelect.innerHTML = I18N.languages.map((l) => `<option value="${l.code}" lang="${l.code}">${l.label}</option>`).join('');

  const renderStatic = () => {
    document.documentElement.lang = state.lang;
    document.title = t('meta.title');
    langSelect.value = state.lang;
    langSelect.setAttribute('aria-label', t('lang.label'));
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
  };

  // ---------- Open state (Vietnam time) ----------
  const vnNow = () => {
    const d = new Date();
    return new Date(d.getTime() + (d.getTimezoneOffset() + 420) * 60000);
  };
  const renderOpen = () => {
    const n = vnNow();
    const m = n.getHours() * 60 + n.getMinutes();
    const open = m >= OPEN && m < CLOSE;
    const el = $('[data-open-state]');
    el.classList.toggle('is-open', open);
    el.textContent = t(open ? 'open.now' : 'open.closed');
  };

  // ---------- Chambers ----------
  const chamberText = (c, part) => t(`ch.${c.id}.${part}`);

  const renderChamberTabs = () => {
    $('[data-chamber-tabs]').innerHTML = CHAMBERS.map((c) => `
      <button type="button" role="tab" aria-selected="${c.id === state.chamber}" class="${c.id === state.chamber ? 'on' : ''}" data-chamber="${c.id}">
        <b>${chamberText(c, 'name')}</b><small>${chamberText(c, 'kind')}</small>
      </button>`).join('');
  };

  const renderChamber = (animate = true) => {
    const c = CHAMBERS.find((x) => x.id === state.chamber);
    setRadio($$('[data-chamber]'), $(`[data-chamber="${c.id}"]`));
    const img = $('[data-chamber-img]');
    if (animate) {
      img.classList.remove('in');
      void img.offsetWidth;
      img.classList.add('in');
    }
    img.src = GAL + c.imgs[state.chamberImg];
    img.alt = `${chamberText(c, 'name')} · ${chamberText(c, 'kind')}`;
    $('[data-chamber-desc]').textContent = chamberText(c, 'desc');
    $('[data-chamber-thumbs]').innerHTML = c.imgs.map((src, i) => `
      <button type="button" class="${i === state.chamberImg ? 'on' : ''}" data-thumb="${i}" aria-label="${chamberText(c, 'name')} ${i + 1}">
        <img src="${GAL + src}" alt="">
      </button>`).join('');
  };

  $('[data-chamber-tabs]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-chamber]');
    if (!b) return;
    state.chamber = b.dataset.chamber;
    state.chamberImg = 0;
    renderChamber();
  });
  $('[data-chamber-thumbs]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-thumb]');
    if (!b) return;
    state.chamberImg = Number(b.dataset.thumb);
    renderChamber();
  });

  const renderRoomOptions = () => {
    $('[data-room]').innerHTML = [t('ticket.noPref'), ...BOOKABLE.map((c) => `${chamberText(c, 'name')} · ${chamberText(c, 'kind')}`)]
      .map((n, i) => `<option value="${i}"${i === state.room ? ' selected' : ''}>${n}</option>`).join('');
  };
  $('[data-room]').addEventListener('change', (e) => { state.room = Number(e.target.value); });

  // ---------- Menu ----------
  const renderCatTabs = () => {
    $('[data-cat-tabs]').innerHTML = CATS.map((c) => `
      <button type="button" role="tab" aria-selected="${c.id === state.cat}" class="${c.id === state.cat ? 'on' : ''}" data-cat="${c.id}">${t('cat.' + c.id)}<small>${c.items.length}</small></button>`).join('');
  };

  const isPicked = (catId, i, oi) => state.pick && state.pick.cat === catId && state.pick.i === i && state.pick.oi === oi;

  const renderMenu = () => {
    setRadio($$('[data-cat]'), $(`[data-cat="${state.cat}"]`));
    const cat = CATS.find((c) => c.id === state.cat);
    $('[data-treatments]').innerHTML = cat.items.map((item, i) => `
      <li class="${state.pick && state.pick.cat === cat.id && state.pick.i === i ? 'active' : ''}">
        <img src="${SP + item.img}" alt="" loading="lazy">
        <div class="t-name">
          <b>${tName(item)}</b>
          ${item.sig ? `<small>${t('sig')}</small>` : ''}
        </div>
        <div class="t-opts">
          ${item.opts.map(([m, v, u], oi) => `
            <button type="button" data-pick="${i}:${oi}" aria-pressed="${isPicked(cat.id, i, oi)}">
              <span>${mins(m)}</span><b>${money(v, u)}</b>
            </button>`).join('')}
        </div>
      </li>`).join('');
  };

  $('[data-cat-tabs]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat;
    renderMenu();
  });

  $('[data-treatments]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    const [i, oi] = b.dataset.pick.split(':').map(Number);
    state.pick = { cat: state.cat, i, oi };
    state.slot = null;
    state.requested = false;
    renderMenu();
    renderTicket();
    if (window.innerWidth <= 1100) $('[data-ticket]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $$('[data-cur]').forEach((b) => b.addEventListener('click', () => {
    state.cur = b.dataset.cur;
    setRadio($$('[data-cur]'), b);
    renderMenu();
    renderTicket();
  }));

  // ---------- Reservation ticket ----------
  const dateInput = $('[data-date]');
  dateInput.value = vnNow().toISOString().slice(0, 10);
  dateInput.min = dateInput.value;

  const picked = () => {
    if (!state.pick) return null;
    const item = CATS.find((c) => c.id === state.pick.cat).items[state.pick.i];
    const [m, v, u] = item.opts[state.pick.oi];
    return { item, m, v, u };
  };

  const slotsFor = (length) => {
    const isToday = dateInput.value === vnNow().toISOString().slice(0, 10);
    const n = vnNow();
    const earliest = isToday ? n.getHours() * 60 + n.getMinutes() + 30 : OPEN;
    const out = [];
    for (let s = OPEN; s + Math.max(length, 30) <= CLOSE; s += 30) out.push({ s, ok: s >= earliest });
    return out;
  };

  const note = $('[data-ticket-note]');
  const renderNote = () => {
    const p = picked();
    note.classList.remove('warn');
    note.textContent = state.requested && p && state.slot !== null
      ? t('ticket.requested', { name: tName(p.item), date: dateInput.value, time: hhmm(state.slot), guests: $('[data-guests]').value })
      : t('ticket.note');
  };

  const renderTicket = () => {
    const p = picked();
    $('[data-ticket-empty]').hidden = !!p;
    $('[data-ticket-form]').hidden = !p;
    if (!p) return;
    $('[data-pick-img]').src = SP + p.item.img;
    $('[data-pick-name]').textContent = tName(p.item);
    $('[data-pick-meta]').textContent = `${mins(p.m)} · ${money(p.v, p.u)} ${t('ticket.perGuest')}`;
    const slots = slotsFor(p.m);
    if (state.slot !== null && !slots.some((x) => x.s === state.slot && x.ok)) state.slot = null;
    $('[data-slots]').innerHTML = slots.map(({ s, ok }) => `
      <button type="button" data-slot="${s}" ${ok ? '' : 'disabled'} class="${s === state.slot ? 'on' : ''}">${hhmm(s)}</button>`).join('')
      || `<p class="no-slots">${t('ticket.noSlots')}</p>`;
    const g = Number($('[data-guests]').value);
    $('[data-total]').textContent = money(p.v * g, p.u * g);
    renderNote();
  };

  const resetRequest = () => { state.requested = false; renderTicket(); };

  $('[data-slots]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]');
    if (!b || b.disabled) return;
    state.slot = Number(b.dataset.slot);
    resetRequest();
  });
  dateInput.addEventListener('change', resetRequest);
  $('[data-guests]').addEventListener('change', resetRequest);

  $('[data-ticket-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.slot === null) {
      note.textContent = t('ticket.chooseTime');
      note.classList.add('warn');
      return;
    }
    state.requested = true;
    renderNote();
  });

  // ---------- Moments + lightbox ----------
  const renderMoments = () => {
    $('[data-mosaic]').innerHTML = MOMENTS.map((src, i) => `
      <button type="button" data-moment="${i}" aria-label="${t('m.' + i)}">
        <img src="${GAL + src}" alt="${t('m.' + i)}" loading="lazy">
      </button>`).join('');
  };

  const lb = $('[data-lightbox]');
  const renderLightbox = () => {
    lb.hidden = state.moment === null;
    if (state.moment === null) return;
    $('[data-lightbox-img]').src = GAL + MOMENTS[state.moment];
    $('[data-lightbox-img]').alt = t('m.' + state.moment);
    $('[data-lightbox-cap]').textContent = t('m.' + state.moment);
  };
  const closeLb = () => { state.moment = null; renderLightbox(); };
  $('[data-mosaic]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-moment]');
    if (!b) return;
    state.moment = Number(b.dataset.moment);
    renderLightbox();
  });
  $('[data-lightbox-close]').addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });

  // ---------- Render all ----------
  const renderAll = () => {
    renderStatic();
    renderOpen();
    renderChamberTabs();
    renderChamber(false);
    renderRoomOptions();
    renderCatTabs();
    renderMenu();
    renderTicket();
    renderMoments();
    renderLightbox();
  };

  langSelect.addEventListener('change', () => {
    state.lang = langSelect.value;
    try { localStorage.setItem(LANG_KEY, state.lang); } catch (_) { /* storage may be blocked */ }
    renderAll();
  });

  renderAll();
  setInterval(renderOpen, 60000);
})();
