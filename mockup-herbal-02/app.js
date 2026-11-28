(() => {
  const IMG = 'https://herbalspa.vn/data/news/300/';

  // Treatment menu as published on herbalspa.vn (prices are "from").
  const RITUALS = [
    { id: 'four-hands-harmony', name: 'Four-Hands Harmony', tag: 'Best seller', hands: 2, focus: ['multi', 'oil'], vnd: 1350000, usd: 54, img: 'giao-huong-bon-tay-54.webp',
      desc: 'Warm oils and hot stones, two therapists in seamless harmony for deep relaxation.' },
    { id: 'six-hands-essence', name: 'Six-Hands Essence', tag: 'Signature', hands: 3, focus: ['multi', 'oil'], vnd: 2100000, usd: 84, img: 'nghe-thuat-sau-tay-toan-than-155.webp',
      desc: 'Three therapists, one full-body rhythm — eases stress and restores inner balance.' },
    { id: 'eight-hands', name: 'The Art of Eight Hands', tag: 'Premium', hands: 4, focus: ['multi', 'oil'], vnd: 3150000, usd: 126, img: 'tuyet-tac-tam-tay-664.webp',
      desc: 'Four therapists whose movements merge into one deeply immersive state.' },
    { id: 'fusion-oil', name: 'Herbal Fusion Oil Journey', hands: 1, focus: ['oil', 'deep'], vnd: 950000, usd: 38, img: 'mieu-dao-66.webp',
      desc: 'Deep herbal oil work with hot stones and compresses to ease muscle tension.' },
    { id: 'four-hands-deep', name: 'Four-Hands Deep Restore', tag: 'Best seller', hands: 2, focus: ['multi', 'deep'], vnd: 1850000, usd: 74, img: 'moc-ban-bon-tay-kho-158.webp',
      desc: 'A synchronized dry full-body therapy by two therapists to release stress and restore energy.' },
    { id: 'six-hands-rebalance', name: 'Six-Hands Total Rebalance', hands: 3, focus: ['multi', 'skin'], vnd: 2700000, usd: 108, img: 'doc-ban-toan-dien-sau-tay-206.webp',
      desc: 'Face and body together, three therapists restoring balance across the whole body.' },
    { id: 'aroma', name: 'Herbal Aroma Journey', hands: 1, focus: ['oil', 'gentle'], vnd: 630000, usd: 25.2, img: 'an-duong-kieu-herbal-1.webp',
      desc: 'Gentle full-body relaxation with warm herbal essential oils and fluid strokes.' },
    { id: 'head-serenity', name: 'Herbal Head Serenity – Four Hands', hands: 2, focus: ['multi', 'gentle'], vnd: 1650000, usd: 66, img: 'dong-chay-goi-dau-bon-tay-1035.webp',
      desc: 'Herbal head wash with full-body care by two therapists — the breath slows, calm spreads.' },
    { id: 'dry-deep', name: 'Dry Deep Bodywork', tag: 'Thai + Shiatsu', hands: 1, focus: ['deep'], vnd: 680000, usd: 27.2, img: 'dong-moc-toan-than-kho-2.webp',
      desc: 'Deep pressure, acupressure and assisted stretching to work through muscular tension.' },
    { id: 'foot', name: 'Foot Balance', hands: 1, focus: ['deep', 'gentle'], vnd: 630000, usd: 25.2, img: 'phuc-hoi-doi-chan-4.webp',
      desc: 'Pressure-point techniques and targeted sole cupping to relieve fatigue.' },
    { id: 'facial', name: 'Intensive Facial Treatment', hands: 1, focus: ['skin'], vnd: 800000, usd: 32, img: 'duong-da-chuyen-sau-5.webp',
      desc: 'Deep cleanse and rebalance for soft, smooth, naturally radiant skin.' },
    { id: 'body-skin', name: 'Intensive Body Skin Care', hands: 1, focus: ['skin'], vnd: 1000000, usd: 40, img: 'tai-tao-da-toan-than-7.webp',
      desc: 'Full-body exfoliation and nourishing ritual with natural herbs.' },
    { id: 'prenatal', name: 'Prenatal Calm', tag: 'From 4th month', hands: 1, focus: ['gentle'], vnd: 630000, usd: 25.2, img: 'an-yen-thai-ky-13.webp',
      desc: 'Gentle, nurturing care for expectant mothers, supporting comfort and circulation.' },
    { id: 'cupping', name: 'Herbal Cupping Flow', hands: 1, focus: ['deep', 'oil'], vnd: 970000, usd: 38.8, img: 'lieu-trinh-giac-hoi-truyen-thong-34.webp',
      desc: 'Oil-based hands-on work with herbal cupping for deep-seated tension.' },
    { id: 'four-hands-facial', name: 'Four Hands Facial Nourish', hands: 2, focus: ['multi', 'skin'], vnd: 1650000, usd: 66, img: 'tinh-hoa-bon-tay-cham-soc-da-55.webp',
      desc: 'Two therapists — one for skin vitality, one gently easing the body.' },
    { id: 'ear', name: 'Ear Care Treatment', hands: 1, focus: ['gentle'], vnd: 450000, usd: 18, img: 'cham-soc-tai-878.webp',
      desc: 'Traditional Vietnamese ear care for lightness and refined comfort.' },
  ];

  const REVIEWS = [
    { name: 'Molly Cormican', text: 'The best massage of my life!! It’s so relaxing and clean. The staff are very attentive and so friendly. The whole experience was perfect.' },
    { name: 'Andri', text: 'I searched online for the best spas in Da Nang and we decided to come here. A fantastic massage that completely met our expectations.' },
    { name: 'Angelina Urevna', text: 'I have been to many massage places across Asia, and here I received the best service. Polite, friendly staff who speak English — and the massage itself was amazing.' },
    { name: 'Danielle Miranda', text: 'I’m an athlete and needed a relaxing day — this was a 5-star experience. Relaxing and therapeutic at the same time. I will be back soon!' },
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const state = { focus: 'all', hands: 0, currency: 'vnd', tray: [], promo: false, quote: 0 };

  const fmt = (r) => state.currency === 'vnd'
    ? r.vnd.toLocaleString('vi-VN') + ' ₫'
    : '$' + r.usd.toFixed(2);

  const fmtTotal = (vnd, usd) => state.currency === 'vnd'
    ? Math.round(vnd).toLocaleString('vi-VN') + ' ₫'
    : '$' + usd.toFixed(2);

  const handsLabel = (n) => n === 1 ? '1 therapist' : `${n} therapists · ${n * 2} hands`;

  // ---------- Ritual grid ----------
  const grid = $('[data-ritual-grid]');

  const visibleRituals = () => RITUALS.filter((r) =>
    (state.focus === 'all' || r.focus.includes(state.focus)) &&
    (state.hands === 0 || r.hands === state.hands));

  const renderGrid = () => {
    const list = visibleRituals();
    grid.innerHTML = list.map((r) => {
      const inTray = state.tray.includes(r.id);
      return `
        <article class="ritual${inTray ? ' picked' : ''}">
          <div class="ritual-img">
            <img src="${IMG + r.img}" alt="${r.name}" loading="lazy">
            ${r.tag ? `<span class="ritual-tag">${r.tag}</span>` : ''}
            <span class="ritual-hands" aria-label="${handsLabel(r.hands)}">${'●'.repeat(r.hands)}</span>
          </div>
          <div class="ritual-body">
            <small>${handsLabel(r.hands)}</small>
            <h3>${r.name}</h3>
            <p>${r.desc}</p>
            <div class="ritual-foot">
              <span class="price"><i>from</i> ${fmt(r)}</span>
              <button type="button" data-add="${r.id}" aria-pressed="${inTray}">${inTray ? '✓ Added' : '＋ Add'}</button>
            </div>
          </div>
        </article>`;
    }).join('');
    $('[data-result-count]').textContent = `${list.length} of ${RITUALS.length} rituals`;
    $('[data-empty]').hidden = list.length > 0;
  };

  const setOn = (buttons, active) => buttons.forEach((b) => b.classList.toggle('on', b === active));

  $$('[data-focus]').forEach((b) => b.addEventListener('click', () => {
    state.focus = b.dataset.focus;
    setOn($$('[data-focus]'), b);
    renderGrid();
  }));

  $$('[data-hands]').forEach((b) => b.addEventListener('click', () => {
    state.hands = Number(b.dataset.hands);
    setOn($$('[data-hands]'), b);
    renderGrid();
  }));

  $$('[data-currency]').forEach((b) => b.addEventListener('click', () => {
    state.currency = b.dataset.currency;
    setOn($$('[data-currency]'), b);
    renderGrid();
    renderTray();
  }));

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const id = btn.dataset.add;
    const adding = !state.tray.includes(id);
    state.tray = adding ? [...state.tray, id] : state.tray.filter((x) => x !== id);
    renderGrid();
    renderTray();
    toast(adding ? 'Added to your ritual' : 'Removed from your ritual');
  });

  // ---------- Tray ----------
  const tray = $('[data-tray]');
  const scrim = $('[data-scrim]');

  const openTray = () => {
    tray.classList.add('open');
    tray.setAttribute('aria-hidden', 'false');
    scrim.hidden = false;
  };
  const closeTray = () => {
    tray.classList.remove('open');
    tray.setAttribute('aria-hidden', 'true');
    scrim.hidden = true;
  };

  $$('[data-open-tray]').forEach((b) => b.addEventListener('click', openTray));
  $('[data-close-tray]').addEventListener('click', closeTray);
  scrim.addEventListener('click', closeTray);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeTray());

  const renderTray = () => {
    const items = state.tray.map((id) => RITUALS.find((r) => r.id === id));
    $('[data-tray-items]').innerHTML = items.map((r) => `
      <li>
        <img src="${IMG + r.img}" alt="">
        <div><b>${r.name}</b><small>${handsLabel(r.hands)}</small></div>
        <span>${fmt(r)}</span>
        <button type="button" data-remove="${r.id}" aria-label="Remove ${r.name}">✕</button>
      </li>`).join('');
    $('[data-tray-empty]').hidden = items.length > 0;
    const factor = state.promo ? 0.7 : 1;
    const vnd = items.reduce((s, r) => s + r.vnd, 0) * factor;
    const usd = items.reduce((s, r) => s + r.usd, 0) * factor;
    $('[data-tray-total]').textContent = fmtTotal(vnd, usd);
    $$('[data-tray-count]').forEach((el) => { el.textContent = items.length; });
  };

  $('[data-tray-items]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    state.tray = state.tray.filter((x) => x !== btn.dataset.remove);
    renderTray();
    renderGrid();
  });

  $('[data-promo]').addEventListener('change', (e) => {
    state.promo = e.target.checked;
    renderTray();
  });

  $('[data-tray-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get('name');
    $('[data-tray-note]').textContent = `Thank you, ${name}. In the real site, reception would confirm within the hour.`;
  });

  // ---------- Quick book ----------
  const dateInput = $('[data-date]');
  dateInput.value = new Date().toISOString().slice(0, 10);
  $('[data-quick-book]').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('rituals').scrollIntoView({ behavior: 'smooth' });
    toast('Pick a ritual, then plan your visit');
  });

  // ---------- Morning offer (Vietnam time, UTC+7) ----------
  const morningStatus = () => {
    const now = new Date();
    const vn = new Date(now.getTime() + (now.getTimezoneOffset() + 420) * 60000);
    const mins = vn.getHours() * 60 + vn.getMinutes();
    const el = $('[data-morning-status]');
    const pad = (n) => String(n).padStart(2, '0');
    if (mins >= 540 && mins < 780) {
      const left = 780 - mins;
      el.innerHTML = `<span class="dot live"></span> Open now in Vietnam — ${Math.floor(left / 60)}h ${pad(left % 60)}m left today`;
    } else {
      const until = mins < 540 ? 540 - mins : 1440 - mins + 540;
      el.innerHTML = `<span class="dot"></span> Next morning window opens in ${Math.floor(until / 60)}h ${pad(until % 60)}m (Vietnam time)`;
    }
  };
  morningStatus();
  setInterval(morningStatus, 30000);

  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (_) { /* clipboard may be blocked */ }
    b.textContent = 'Copied ✓';
    setTimeout(() => { b.textContent = 'Copy code'; }, 1800);
  }));

  // ---------- Gallery ----------
  const track = $('[data-gallery-track]');
  $$('[data-gallery]').forEach((b) => b.addEventListener('click', () => {
    track.scrollBy({ left: Number(b.dataset.gallery) * track.clientWidth * 0.8, behavior: 'smooth' });
  }));

  // ---------- Branch tabs ----------
  $$('[data-city]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-city]').forEach((x) => {
      x.classList.toggle('on', x === b);
      x.setAttribute('aria-selected', String(x === b));
    });
    $$('[data-city-item]').forEach((card) => {
      card.hidden = b.dataset.city !== 'all' && card.dataset.cityItem !== b.dataset.city;
    });
  }));

  // ---------- Reviews ----------
  const dots = $('[data-quote-dots]');
  dots.innerHTML = REVIEWS.map((r, i) => `<button type="button" role="tab" aria-label="Review by ${r.name}" data-q="${i}"></button>`).join('');
  const showQuote = (i) => {
    state.quote = i;
    const q = $('[data-quote]');
    q.classList.remove('in');
    void q.offsetWidth;
    $('[data-quote-text]').textContent = `“${REVIEWS[i].text}”`;
    $('[data-quote-name]').textContent = REVIEWS[i].name;
    q.classList.add('in');
    $$('[data-q]').forEach((d, j) => d.classList.toggle('on', j === i));
  };
  dots.addEventListener('click', (e) => {
    const d = e.target.closest('[data-q]');
    if (d) showQuote(Number(d.dataset.q));
  });
  showQuote(0);
  setInterval(() => showQuote((state.quote + 1) % REVIEWS.length), 7000);

  // ---------- Breathing cue ----------
  const breath = $('[data-breath]');
  let inhale = true;
  setInterval(() => {
    inhale = !inhale;
    breath.textContent = inhale ? 'breathe in' : 'breathe out';
  }, 4000);

  // ---------- Toast ----------
  let toastTimer;
  const toast = (msg) => {
    const t = $('[data-toast]');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  };

  renderGrid();
  renderTray();
})();
