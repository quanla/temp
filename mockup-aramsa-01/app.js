(() => {
  // Prices from aramsa.vn/pricing (English menu), VND, keyed by minutes.
  const MENU = [
    { cat: 'body', name: 'Aramsa Signature Full Body', star: true, p: { 60: 565000, 90: 765000, 120: 940000 },
      d: 'Natural coconut oil, hot stones and soothing herbal bags to release tension and restore balance.' },
    { cat: 'body', name: 'Body Massage “Thailand” Style', p: { 60: 600000, 90: 810000, 120: 1000000 },
      d: 'Herbal bags, muscle stretching, rhythmic pressure and yoga postures.' },
    { cat: 'body', name: 'Body Massage with Oil', note: 'no hot stones', p: { 60: 475000, 90: 650000, 120: 815000 },
      d: 'Relaxing coconut-oil massage with effective acupressure.' },
    { cat: 'body', name: 'Massage with Scented Candles', p: { 60: 600000, 90: 810000, 120: 1000000 },
      d: 'Warm candle wax with herbal bags and hot stones nourishes and renews the skin.' },
    { cat: 'body', name: 'Body Massage with Bamboo', p: { 75: 775000, 90: 900000, 120: 1150000 },
      d: 'Warm bamboo tubes roll over the back, combined with acupressure.' },
    { cat: 'body', name: 'Body Massage with Herbal Balls', p: { 75: 775000, 90: 900000, 120: 1150000 },
      d: 'Traditional Thai therapy with warm herbal balls and hot stones.' },
    { cat: 'body', name: 'Thai, Oil & Hot Stones', p: { 90: 875000, 120: 1125000 },
      d: 'Acupressure and bodywork first, then a full oil massage with hot stones.' },
    { cat: 'body', name: 'Four-Hand Massage', star: true, p: { 60: 1130000, 90: 1530000, 120: 1880000 },
      d: 'Two therapists at once for deeper relaxation and better circulation.' },
    { cat: 'body', name: 'Massage for Pregnant Women', p: { 60: 600000, 90: 810000, 120: 1000000 },
      d: 'Oil and gentle hot stones ease back pain and swelling.' },
    { cat: 'body', name: 'Massage for Sunburned Skin', p: { 60: 565000, 90: 765000, 120: 940000 },
      d: 'Aloe vera gel and oil soothe and restore sun-tired skin.' },

    { cat: 'focus', name: 'Traditional Vietnamese Massage', note: 'with 30′ cupping', p: { 90: 750000, 120: 940000 },
      d: 'Full-body oil massage plus Vietnamese cupping to boost blood flow.' },
    { cat: 'focus', name: 'Shiatsu Massage', p: { 60: 625000, 90: 875000, 120: 1125000 },
      d: 'Japanese pressure work with fingers, palms and elbows on acupoints.' },
    { cat: 'focus', name: 'Deep Tissue Massage', p: { 90: 875000, 120: 1125000 },
      d: 'Firm pressure with hands, knees and elbows for stiff, painful muscles.' },
    { cat: 'focus', name: 'Back Massage Therapy', p: { 30: 200000, 60: 540000, 90: 740000 },
      d: '30′ cupping · 60′ back massage · or 60′ back massage + 30′ cupping.' },
    { cat: 'focus', name: 'Leg & Foot Massage', p: { 60: 440000, 90: 625000, 120: 775000 },
      d: 'Relief for legs that walked the whole beachfront.' },

    { cat: 'care', name: 'Intensive Body Skin Care', note: '60′ + 15′ shower', p: { 75: 625000 },
      d: 'Milk-salt scrub and oatmeal body mask for smooth, hydrated skin.' },
    { cat: 'care', name: 'Intensive Facial Care', p: { 60: 375000 },
      d: 'Cleanse, exfoliate, hydrating mask, facial massage and sebum extraction.' },
    { cat: 'care', name: 'Facial Care (Mini)', p: { 30: 250000 },
      d: 'Face wash with a homemade mask, a facial massage, or exfoliation.' },
    { cat: 'care', name: 'Regular Hair Washing', p: { 40: 200000 },
      d: 'Optional face wash, 30′ shampoo and drying.' },
    { cat: 'care', name: 'Hair Washing Pro', p: { 60: 375000 },
      d: 'Face wash with homemade mask, shampoo with neck and shoulder massage.' },

    { cat: 'kids', name: 'Kid Leg & Foot Massage', note: 'under 1.4 m', p: { 60: 440000, 90: 625000, 120: 775000 },
      d: 'A gentle leg and foot massage for little travellers.' },
    { cat: 'kids', name: 'Kid Full Body Massage', note: 'under 1.4 m', p: { 60: 440000, 90: 625000, 120: 775000 },
      d: 'A softer full-body massage sized for kids.' },
    { cat: 'kids', name: 'Ear Cleaning', note: 'add-on', p: { 30: 250000 }, d: 'Traditional, delicate ear care.' },
    { cat: 'kids', name: 'Head Massage', note: 'add-on', p: { 30: 250000 }, d: 'Thirty minutes to quiet the mind.' },
    { cat: 'kids', name: 'Neck & Shoulder Massage', note: 'add-on', p: { 30: 315000, 45: 440000 }, d: 'For desk, plane and backpack shoulders.' },
    { cat: 'kids', name: 'Leg & Foot · Back', note: 'add-on', p: { 30: 250000 }, d: 'Leg & foot 30′ 250,000 ₫ · back 30′ 315,000 ₫.' },
  ];

  const COMBOS = {
    c60: { name: 'Combo 60', price: 540000, massage: 60, room: false },
    c90: { name: 'Combo 90', price: 690000, massage: 90, room: false },
    half: { name: 'Half-Day Combo', price: 830000, massage: 90, room: true },
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vnd = (n) => n.toLocaleString('en-US') + ' ₫';

  const state = { dur: 60, cat: 'body', combo: 'half' };

  const pickRadio = (group, btn) => group.forEach((b) => {
    const on = b === btn;
    b.classList.toggle('on', on);
    b.setAttribute(b.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-checked', String(on));
  });

  // ---------- Menu ----------
  // Closest offered length to the one the guest picked; ties go to the longer session.
  const nearest = (prices, want) => Object.keys(prices).map(Number)
    .sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || b - a)[0];

  const renderMenu = () => {
    const items = MENU.filter((m) => m.cat === state.cat);
    $('[data-menu]').innerHTML = items.map((m) => {
      const lens = Object.keys(m.p).map(Number);
      const len = nearest(m.p, state.dur);
      const exact = len === state.dur;
      return `
        <article class="item${m.star ? ' star' : ''}">
          <div class="item-top">
            <h3>${m.name}</h3>
            ${m.note ? `<small>${m.note}</small>` : ''}
          </div>
          <p>${m.d}</p>
          <div class="item-foot">
            <div class="lens">${lens.map((l) => `<span class="${l === len ? 'on' : ''}">${l}′</span>`).join('')}</div>
            <div class="item-price${exact ? '' : ' shifted'}">
              <b>${vnd(m.p[len])}</b>
              ${exact ? '' : `<small>${len} min option</small>`}
            </div>
          </div>
        </article>`;
    }).join('');
  };

  $$('[data-dur]').forEach((b) => b.addEventListener('click', () => {
    state.dur = Number(b.dataset.dur);
    pickRadio($$('[data-dur]'), b);
    renderMenu();
  }));

  $$('[data-cat]').forEach((b) => b.addEventListener('click', () => {
    state.cat = b.dataset.cat;
    pickRadio($$('[data-cat]'), b);
    renderMenu();
  }));

  // ---------- Day planner ----------
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (m) => {
    const x = ((m % 1440) + 1440) % 1440;
    const h = Math.floor(x / 60);
    return `${((h + 11) % 12) + 1}:${String(x % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };

  const buildPlan = (combo, arrive, flight) => {
    const leave = flight - 180; // suggested: leave the spa ~3 h before departure
    const steps = [{ t: arrive, title: 'Arrive at Aramsa', body: 'Drop your luggage with us — it stays free until you leave.' }];
    const massageStart = arrive + 15;
    steps.push({ t: massageStart, title: `Aramsa Signature · ${combo.massage}′`, body: 'Coconut oil, hot stones and herbal bags.', hl: true });
    const afterMassage = massageStart + combo.massage;
    if (combo.room) {
      const roomEnd = Math.min(arrive + 480, leave - 30);
      steps.push({ t: afterMassage, title: 'Your hotel room', body: `Nap, pack, recharge — room until ${fmt(roomEnd)} (up to 8 hours).` });
      steps.push({ t: roomEnd, title: 'Fresh shower', body: 'Clean towels, then you are ready to fly.' });
    } else {
      steps.push({ t: afterMassage, title: 'Free shower', body: 'Rinse off the oil and the sea salt.' });
      steps.push({ t: afterMassage + 30, title: 'Explore Nha Trang', body: 'Your bags stay with us while you see the city.' });
    }
    steps.push({ t: leave, title: 'Airport transfer', body: 'Car from the spa (suggested time — reception confirms).', hl: true });
    steps.push({ t: flight, title: 'Flight departs', body: 'Bon voyage — come back soon.' });
    return { steps, tight: leave < afterMassage + 30, long: leave - arrive > 600 };
  };

  const renderPlan = () => {
    const combo = COMBOS[state.combo];
    const arrive = toMin($('[data-arrive]').value || '11:00');
    let flight = toMin($('[data-flight]').value || '21:30');
    if (flight <= arrive) flight += 1440;
    const plan = buildPlan(combo, arrive, flight);
    $('[data-timeline]').innerHTML = plan.steps.map((s) => `
      <li class="${s.hl ? 'hl' : ''}">
        <time>${fmt(s.t)}</time>
        <div><b>${s.title}</b><span>${s.body}</span></div>
      </li>`).join('');
    const guests = Number($('[data-guests]').value);
    let note = `${combo.name} × ${guests} guests = <b>${vnd(combo.price * guests)}</b>`;
    if (plan.tight) note += '<em class="warn">Tight timing — call us and we will find a way.</em>';
    else if (plan.long && !combo.room) note += '<em class="tip">Long wait? The Half-Day Combo adds a hotel room.</em>';
    $('[data-plan-total]').innerHTML = note;
  };

  $$('[data-combo]').forEach((b) => b.addEventListener('click', () => {
    state.combo = b.dataset.combo;
    pickRadio($$('[data-combo]'), b);
    renderPlan();
  }));
  ['[data-arrive]', '[data-flight]', '[data-guests]'].forEach((s) => $(s).addEventListener('input', renderPlan));

  // ---------- Copy IDs ----------
  let toastTimer;
  const toast = (msg) => {
    const t = $('[data-toast]');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  };
  const copy = async (el) => {
    try { await navigator.clipboard.writeText(el.dataset.copy); } catch (_) { /* clipboard may be blocked */ }
    toast(`Copied “${el.dataset.copy}”`);
  };
  $$('[data-copy]').forEach((el) => {
    el.addEventListener('click', () => copy(el));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(el); } });
  });

  renderMenu();
  renderPlan();
})();
