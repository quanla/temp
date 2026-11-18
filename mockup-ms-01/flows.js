/* MissySalon — prototype flows: actions, modals (booking, assignment, checkout, search, profile), secondary screens. */

/* ---------- modal plumbing ---------- */

function closeModal() {
  state.modal = null;
  renderModal();
}
function renderModal() {
  const el = $('#modal');
  const m = state.modal;
  if (!m) { el.innerHTML = ''; return; }
  const scrollers = [...el.querySelectorAll('[data-keep-scroll]')].map((n) => [n.dataset.keepScroll, n.scrollTop]);
  const html = {
    booking: renderBooking,
    assign: renderAssign,
    checkout: renderCheckout,
    search: renderSearch,
    customer: renderCustomer,
    feedback: renderFeedback,
    cancel: renderCancel,
    about: renderAbout,
    shortcuts: renderShortcuts,
    reject: renderReject,
  }[m.type](m);
  el.innerHTML = `<div class="modal-back">${html}</div>`;
  scrollers.forEach(([k, top]) => { const n = el.querySelector(`[data-keep-scroll="${k}"]`); if (n) n.scrollTop = top; });
  if (m.focus) {
    const f = el.querySelector(m.focus);
    if (f) { f.focus(); if (f.setSelectionRange && f.value) f.setSelectionRange(f.value.length, f.value.length); }
    m.focus = null;
  }
}
const modalHead = (title, sub = '') => `<header class="m-head"><div><h2>${title}</h2>${sub ? `<small>${sub}</small>` : ''}</div><button class="icon-btn" data-act="closeModal" title="Đóng (Esc)">${ic('x')}</button></header>`;

function afterInput(el) {
  const m = state.modal;
  const b = el.dataset.bind;
  if (m?.type === 'booking') {
    const side = $('#bk-side');
    if (side) side.innerHTML = bookingSide(m.draft, draftChecks(m.draft), m.showErr);
    const gm = b.match(/^modal\.draft\.guests\.(\d+)\.name$/);
    if (gm) { const s = $(`#sug-${gm[1]}`); if (s) s.innerHTML = guestSuggest(m.draft.guests[gm[1]], +gm[1]); }
    if (b === 'modal.draft.phone') { const s = $('#sug-phone'); if (s) s.innerHTML = phoneSuggest(m.draft); }
  } else if (m?.type === 'checkout') {
    const s = $('#co-sum');
    if (s) s.innerHTML = paySummary(m);
  } else if (m?.type === 'search') {
    m.idx = 0;
    const r = $('#search-res');
    if (r) r.innerHTML = searchResults(m);
  } else if (b === 'gc.q') {
    const l = $('#gc-list');
    if (l) l.innerHTML = gcList();
  }
}
function afterChange(el, prev) {
  const m = state.modal;
  const b = el.dataset.bind;
  if (m?.type === 'booking') {
    const d = m.draft;
    const sm = b.match(/^modal\.draft\.guests\.(\d+)\.services\.(\d+)\.(svc|dur|start)$/);
    if (sm) {
      const g = d.guests[sm[1]];
      const s = g.services[sm[2]];
      if (sm[3] === 'svc') {
        s.dur = CATALOG[s.svc].dur;
        const need = CATALOG[s.svc].staff ?? 1;
        s.therapists = Array.from({ length: need }, (_, i) => s.therapists[i] ?? null);
      }
      for (let i = +sm[2] + 1; i < g.services.length; i += 1) {
        const p0 = g.services[i - 1];
        if (g.services[i].start < p0.start + p0.dur) g.services[i].start = p0.start + p0.dur;
      }
    }
    const um = b.match(/^modal\.draft\.guests\.(\d+)\.services\.(\d+)\.uncertain$/);
    if (um) { const s = d.guests[um[1]].services[um[2]]; s.durMax = el.checked ? s.dur + 30 : 0; }
    if (b === 'modal.draft.time') {
      const delta = d.time - prev;
      d.guests.forEach((g) => g.services.forEach((s) => { s.start += delta; }));
    }
    renderModal();
  } else if (m) {
    renderModal();
  } else {
    render();
  }
}

/* ---------- booking ---------- */

const newSvc = (start, seat = '', svc = 'swed60') => ({
  id: uid('s'), svc, start, dur: CATALOG[svc].dur, durMax: 0, uncertain: false, bath: '', seat,
  therapists: Array.from({ length: CATALOG[svc].staff ?? 1 }, () => null), request: [], status: 'booked',
});
function blankDraft(mode, seat = '', start = null, size = 1) {
  const t = start ?? (mode === 'walkin' ? NOW : T('16:00'));
  const guests = Array.from({ length: size }, (_, i) => ({ id: uid('g'), name: '', customerId: '', prefs: '', arrived: mode === 'walkin', services: [newSvc(t, i === 0 ? seat : '')] }));
  return {
    mode, partyId: null, name: '', phone: '', email: '', channel: mode === 'walkin' ? 'Walk-in' : '', source: '',
    date: mode === 'follow' ? '06/11/2026' : dateLabel(state.dayOffset).split(', ')[1], time: t, confirmed: true,
    deposit: 0, depositMethod: 'Chuyển khoản', notes: '', extra: {}, showExtra: false, guests,
  };
}
function draftFromParty(p, mode = 'edit') {
  return {
    mode, partyId: mode === 'edit' ? p.id : null, name: p.name, phone: p.phone, email: p.email, channel: p.channel, source: p.source || '',
    date: mode === 'follow' ? '06/11/2026' : dateLabel(0).split(', ')[1], time: partyStart(p), confirmed: p.confirmed,
    deposit: mode === 'edit' ? p.deposit : 0, depositMethod: p.depositMethod || 'Chuyển khoản', notes: mode === 'edit' ? p.notes : '',
    extra: { ...p.extra }, showExtra: false, walkin: p.walkin,
    guests: p.guests.map((g) => ({
      id: mode === 'edit' ? g.id : uid('g'), name: g.name, customerId: g.customerId || '', prefs: g.prefs || '', prefsFrom: g.prefsFrom, arrived: mode === 'edit' && g.arrived,
      services: g.services.map((s) => ({
        id: mode === 'edit' ? s.id : uid('s'), svc: s.svc, start: s.start, dur: durOf(s), durMax: s.durMax || 0, uncertain: !!s.durMax, bath: s.bath || '', seat: mode === 'edit' ? s.seat : s.seat,
        therapists: [...s.therapists], request: [...(s.request || [])], status: mode === 'edit' ? s.status : 'booked',
      })),
    })),
  };
}
function openBooking(draft, extra = {}) {
  state.menu = null;
  state.modal = { type: 'booking', draft, showErr: false, focus: draft.mode === 'edit' ? null : '[data-bind="modal.draft.name"]', ...extra };
  renderModal();
}

function draftIds(d) {
  return new Set(d.guests.flatMap((g) => g.services.map((s) => s.id)));
}
function draftSeatClash(d, s) {
  const a = occStart(s);
  const b = occEnd(s);
  const ext = seatBusy(s.seat, a, b, d.partyId, draftIds(d));
  if (ext) return ext.label;
  for (const g of d.guests) {
    for (const o of g.services) {
      if (o !== s && o.seat === s.seat && occStart(o) < b && occEnd(o) > a) return `${g.name || 'khách khác'} trong nhóm`;
    }
  }
  return null;
}
function draftChecks(d) {
  const errs = [];
  const warns = [];
  const oks = [];
  if (!d.name.trim()) errs.push({ f: 'name', msg: 'Nhập tên nhóm hoặc tên khách đại diện' });
  if (!d.phone.trim() && !d.email.trim() && d.mode !== 'walkin') errs.push({ f: 'contact', msg: 'Cần ít nhất một liên hệ (SĐT, Zalo hoặc email)' });
  if (!d.channel) errs.push({ f: 'channel', msg: 'Chọn kênh đặt' });
  const ids = draftIds(d);
  let seatOk = true;
  d.guests.forEach((g, gi) => {
    const gname = g.name.trim() || `Khách ${gi + 1}`;
    if (!g.name.trim()) errs.push({ f: `g${gi}`, msg: `Khách ${gi + 1}: chưa có tên` });
    g.services.forEach((s, si) => {
      if (!s.seat) { seatOk = false; errs.push({ f: `s${gi}-${si}`, msg: `${gname}: chưa xếp phòng cho ${CATALOG[s.svc].short}` }); return; }
      if (s.start + s.dur > END) errs.push({ f: `s${gi}-${si}`, msg: `${gname}: kết thúc sau 23:00` });
      const clash = draftSeatClash(d, s);
      if (clash) { seatOk = false; errs.push({ f: `s${gi}-${si}`, msg: `${gname}: ${seatLabel(s.seat)} đã có ${clash}` }); }
      s.therapists.filter(Boolean).forEach((tid) => {
        const av = therAvail(TH[tid], s.start, s.start + s.dur, s.id, ids);
        if (av.k !== 'free') warns.push({ msg: `${gname}: ${TH[tid].name} — ${av.why}` });
      });
    });
  });
  const slots = staffSlots(d.partyId);
  const short = [];
  slots.forEach((sl) => {
    let need = 0;
    d.guests.forEach((g) => g.services.forEach((s) => { if (s.start < sl.t + 15 && s.start + s.dur > sl.t) need += CATALOG[s.svc].staff ?? 1; }));
    if (need && sl.free - need < 0) short.push({ t: sl.t, lack: need - Math.max(0, sl.free) });
  });
  if (short.length) {
    const a = short[0].t;
    const b = short[short.length - 1].t + 15;
    const lack = Math.max(...short.map((x) => x.lack));
    warns.push({ msg: `Thiếu tối đa ${lack} KTV trong ${fm(a)}–${fm(b)}`, hint: 'Có thể nhận và mượn KTV từ Cơ sở 1, hoặc dời giờ đến sau 15:30.', staff: true });
  } else if (d.guests.length) oks.push('Đủ KTV cho cả nhóm');
  if (seatOk && d.guests.length) oks.push('Phòng/giường còn trống cho mọi dịch vụ');
  return { errs, warns, oks };
}

function timeOptions(cur, from = START, to = END - 30) {
  const set = new Set();
  for (let t = from; t <= to; t += 15) set.add(t);
  set.add(cur);
  return [...set].sort((a, b) => a - b).map((t) => `<option value="${t}" ${t === cur ? 'selected' : ''}>${fm(t)}</option>`).join('');
}
const opt = (v, label, cur) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(label)}</option>`;
function field(label, control, err, req, cls = '') {
  return `<div class="field ${cls}"><label>${label}${req ? ' <i class="req">*</i>' : ''}</label>${control}${err ? `<span class="ferr">${ic('alert')}${err.msg}</span>` : ''}</div>`;
}
const inp = (bind, val, ph = '', extra = '') => `<input class="in" data-bind="${bind}" value="${esc(val)}" placeholder="${esc(ph)}" ${extra}>`;

function renderBooking(m) {
  const d = m.draft;
  const ch = draftChecks(d);
  const errOf = (f) => (m.showErr ? ch.errs.find((e) => e.f === f) : null);
  const titles = { new: 'Đặt lịch mới', edit: `Sửa đặt lịch · ${d.partyId}`, walkin: 'Khách vãng lai — nhận ngay', follow: 'Hẹn tiếp theo' };
  const subs = {
    new: 'Cơ sở 3 · điền nhóm, khách và dịch vụ — kiểm tra phòng/KTV hiển thị trực tiếp bên phải',
    edit: `${d.name} · thay đổi được kiểm tra trước khi lưu`,
    walkin: `Khách đến lúc ${fm(NOW)} · chỉ cần tên, dịch vụ, giường — liên hệ có thể bổ sung sau`,
    follow: 'Sao chép khách, dịch vụ và yêu cầu từ lần này sang ngày mới',
  };
  const extraFilled = Object.entries(d.extra).filter(([, v]) => v);
  const nSvc = sum(d.guests.map((g) => g.services.length));
  const foot = {
    walkin: `<button class="btn" data-act="closeModal">Hủy</button><button class="btn primary lg" data-act="bkSave" data-confirm="1">${ic('play')}Nhận khách & bắt đầu</button>`,
    follow: `<button class="btn" data-act="closeModal">Hủy</button><button class="btn primary lg" data-act="bkSave" data-confirm="1">${ic('calendar')}Tạo hẹn ${esc(d.date)}</button>`,
    new: `<button class="btn" data-act="closeModal">Hủy</button><button class="btn lg" data-act="bkSave" data-confirm="0">Lưu, chưa xác nhận</button><button class="btn primary lg" data-act="bkSave" data-confirm="1">${ic('check')}Lưu & xác nhận</button>`,
  };
  foot.edit = foot.new;
  return `<div class="modal xl" role="dialog" aria-label="${titles[d.mode]}">
    ${modalHead(titles[d.mode], subs[d.mode])}
    <div class="bk">
      <div class="bk-form" data-keep-scroll="bk">
        <section class="bk-sec">
          <h3><span class="step">1</span>Nhóm & liên hệ</h3>
          <div class="fgrid">
            ${field('Tên nhóm / khách đại diện', inp('modal.draft.name', d.name, 'VD: Gia đình Tanaka', `class="in ${errOf('name') ? 'invalid' : ''}"`), errOf('name'), true, 'span2')}
            ${field('Kênh đặt', `<select class="in ${errOf('channel') ? 'invalid' : ''}" data-bind="modal.draft.channel"><option value="">— Chọn —</option>${CHANNELS.map((c) => opt(c, c, d.channel)).join('')}</select>`, errOf('channel'), true)}
            ${field('Điện thoại / Zalo / WhatsApp', inp('modal.draft.phone', d.phone, '+84 …'), errOf('contact'), d.mode !== 'walkin')}
            ${field('Email', inp('modal.draft.email', d.email, 'không bắt buộc'))}
            ${field('Ngày', inp('modal.draft.date', d.date, 'dd/mm/yyyy', d.mode === 'walkin' ? 'disabled' : ''))}
            ${field('Giờ đến', `<select class="in" data-bind="modal.draft.time" data-type="num" ${d.mode === 'walkin' ? 'disabled' : ''}>${timeOptions(d.time)}</select>`)}
          </div>
          <div id="sug-phone">${phoneSuggest(d)}</div>
        </section>
        <section class="bk-sec">
          <h3><span class="step">2</span>Khách & dịch vụ <small>${d.guests.length} khách · ${nSvc} dịch vụ</small></h3>
          ${d.guests.map((g, gi) => guestEditor(g, gi, d, ch, m.showErr)).join('')}
          <div class="row-btns">
            <button class="btn" data-act="bkAddGuest">${ic('plus')}Thêm khách</button>
            <button class="btn ghost" data-act="bkAuto">${ic('sparkle')}Tự xếp phòng còn trống</button>
          </div>
        </section>
        <section class="bk-sec">
          <h3><span class="step">3</span>Đặt cọc & ghi chú</h3>
          <div class="fgrid">
            ${field('Đặt cọc', `<div class="money">${inp('modal.draft.deposit', d.deposit ? d.deposit.toLocaleString('en-US') : '', '0', 'data-type="money" inputmode="numeric"')}<span>₫</span></div>`)}
            ${field('Hình thức cọc', `<select class="in" data-bind="modal.draft.depositMethod">${['Chuyển khoản', 'Thẻ', 'Tiền mặt', 'Alipay', 'Đối tác thu hộ'].map((x) => opt(x, x, d.depositMethod)).join('')}</select>`)}
            ${field('Ghi chú nhóm', `<textarea class="in" rows="2" data-bind="modal.draft.notes" placeholder="Dịp đặc biệt, chuẩn bị phòng, lưu ý cho lễ tân…">${esc(d.notes)}</textarea>`, null, false, 'span3')}
          </div>
        </section>
        <section class="bk-sec extra">
          <button class="disclose" data-act="bkExtra">${ic(d.showExtra ? 'chevD' : 'chevR')}<b>Thông tin thêm</b><small>tùy chọn — đưa đón, hành lý, nguồn khách, quốc tịch, mã KM, đối tác, hoa hồng</small>
            ${!d.showExtra && extraFilled.length ? `<span class="chips">${extraFilled.map(([, v]) => `<em class="chip">${esc(v)}</em>`).join('')}</span>` : ''}
          </button>
          ${d.showExtra ? `<div class="fgrid">
            ${field(`${ic('car')}Đón khách`, inp('modal.draft.extra.pickup', d.extra.pickup || '', 'VD: KS Rex lúc 14:30'))}
            ${field(`${ic('car')}Trả khách`, inp('modal.draft.extra.dropoff', d.extra.dropoff || '', 'VD: KS Rex ~17:15'))}
            ${field(`${ic('bag')}Hành lý gửi`, inp('modal.draft.extra.luggage', d.extra.luggage || '', 'VD: 2 vali'))}
            ${field('Nguồn khách', `<select class="in" data-bind="modal.draft.source"><option value="">—</option>${SOURCES.map((x) => opt(x, x, d.source)).join('')}</select>`)}
            ${field('Quốc tịch', inp('modal.draft.extra.nationality', d.extra.nationality || '', 'VD: Nhật Bản'))}
            ${field('Mã khuyến mãi', inp('modal.draft.extra.promo', d.extra.promo || '', 'VD: AUTUMN10'))}
            ${field('Đối tác', `<select class="in" data-bind="modal.draft.extra.partner"><option value="">—</option>${PARTNERS.map((x) => opt(x, x, d.extra.partner)).join('')}</select>`)}
            ${field('Hoa hồng đối tác', inp('modal.draft.extra.commission', d.extra.commission || '', 'VD: 15%'))}
          </div>` : ''}
        </section>
      </div>
      <aside class="bk-side" id="bk-side">${bookingSide(d, ch, m.showErr)}</aside>
    </div>
    <footer class="m-foot"><small class="muted">Esc để đóng · dữ liệu mẫu, không gửi đi đâu</small><div class="row-btns">${foot[d.mode]}</div></footer>
  </div>`;
}

function phoneSuggest(d) {
  const digits = d.phone.replace(/\D/g, '');
  if (digits.length < 6) return '';
  const c = Object.values(CUSTOMERS).find((x) => x.phone.replace(/\D/g, '').includes(digits));
  if (!c || d.guests.some((g) => g.customerId === c.id)) return '';
  return `<button class="suggest" data-act="bkUseCustomer" data-gi="0" data-id="${c.id}">${ic('repeat')}Số này thuộc <b>${esc(c.name)}</b> — ${c.vip ? 'VIP · ' : ''}${c.visits} lần, gần nhất ${c.last}. Dùng hồ sơ cho khách 1?</button>`;
}
function guestSuggest(g, gi) {
  const c = CUSTOMERS[g.customerId];
  if (c) return `<span class="chip loyal ${c.vip ? 'vip' : ''}">${ic(c.vip ? 'crown' : 'repeat')}${c.vip ? 'VIP · ' : 'Khách quen · '}${c.visits} lần · gần nhất ${c.last}</span><button class="link" data-act="customer" data-id="${c.id}">Hồ sơ</button>`;
  const q = g.name.trim().toLowerCase();
  if (q.length < 3) return '';
  const hits = Object.values(CUSTOMERS).filter((x) => x.name.toLowerCase().includes(q));
  return hits.map((x) => `<button class="chip suggest" data-act="bkUseCustomer" data-gi="${gi}" data-id="${x.id}">${ic('repeat')}${esc(x.name)} · ${x.visits} lần — dùng hồ sơ</button>`).join('');
}

function guestEditor(g, gi, d, ch, showErr) {
  const hue = HUES[gi % HUES.length];
  return `<div class="ge" style="--h:${hue}">
    <div class="ge-head">
      <span class="ge-n">${gi + 1}</span>
      <input class="in ${showErr && !g.name.trim() ? 'invalid' : ''}" data-bind="modal.draft.guests.${gi}.name" value="${esc(g.name)}" placeholder="Tên khách ${gi + 1}">
      <div class="ge-sug" id="sug-${gi}">${guestSuggest(g, gi)}</div>
      ${d.guests.length > 1 ? `<button class="icon-btn sm" data-act="bkRemoveGuest" data-gi="${gi}" title="Bỏ khách này">${ic('x')}</button>` : ''}
    </div>
    <div class="ge-pref">${ic('note')}<input class="in sm" data-bind="modal.draft.guests.${gi}.prefs" value="${esc(g.prefs)}" placeholder="Yêu cầu riêng: áp lực, KTV nam/nữ, dị ứng…">${g.prefsFrom === 'profile' ? '<em class="tag">từ hồ sơ</em>' : ''}</div>
    <div class="svc-list">${g.services.map((s, si) => svcEditor(s, gi, si, d, ch, showErr)).join('')}</div>
    <button class="btn xs ghost" data-act="bkAddSvc" data-gi="${gi}">${ic('plus')}Thêm dịch vụ nối tiếp</button>
  </div>`;
}

function svcEditor(s, gi, si, d, ch, showErr) {
  const base = `modal.draft.guests.${gi}.services.${si}`;
  const err = showErr && ch.errs.find((e) => e.f === `s${gi}-${si}`);
  const a = occStart(s);
  const b = occEnd(s);
  const ids = draftIds(d);
  const seatOpts = ROOMS.map((room) => `<optgroup label="${room.name} · ${room.kind}">${room.beds.map((bed, i) => {
    const id = `${room.id}-${i}`;
    const busy = seatBusy(id, a, b, d.partyId, ids);
    return `<option value="${id}" ${id === s.seat ? 'selected' : ''}>${room.name} · ${bed}${busy ? '  — bận' : '  ✓ trống'}</option>`;
  }).join('')}</optgroup>`).join('');
  const therSel = s.therapists.map((tid, ti) => {
    const opts = THERAPISTS.map((th) => {
      const av = therAvail(th, s.start, s.start + s.dur, s.id, ids);
      const mark = { free: '✓ rảnh', partial: '◐ ', late: '◔ ', busy: '✕ ', away: '✕ ', off: '— ' }[av.k];
      return `<option value="${th.id}" ${th.id === tid ? 'selected' : ''}>${th.name} (${th.code}) ${mark}${av.k === 'free' ? '' : av.why}</option>`;
    }).join('');
    const label = s.therapists.length > 1 ? `KTV ${ti + 1}` : 'KTV yêu cầu';
    return field(label, `<select class="in" data-bind="${base}.therapists.${ti}"><option value="">Xếp khi khách đến</option>${opts}</select>`);
  }).join('');
  return `<div class="se ${err ? 'has-err' : ''}">
    <div class="se-row">
      ${field('Bắt đầu', `<select class="in" data-bind="${base}.start" data-type="num">${timeOptions(s.start)}</select>`)}
      ${field('Chọn dịch vụ', `<select class="in" data-bind="${base}.svc">${Object.entries(CATALOG).map(([id, c]) => opt(id, `${c.name} ${c.dur}' · ${kv(c.price)}${c.staff ? ' · 2 KTV' : ''}`, s.svc)).join('')}</select>`, null, false, 'grow')}
      ${field('Thời lượng', `<select class="in" data-bind="${base}.dur" data-type="num">${[30, 45, 60, 75, 90, 105, 120, 150].map((x) => opt(x, `${x}'`, s.dur)).join('')}</select>`)}
      <label class="check"><input type="checkbox" data-bind="${base}.uncertain" ${s.durMax ? 'checked' : ''}>Chưa chắc${s.durMax ? `<select class="in sm" data-bind="${base}.durMax" data-type="num">${[s.dur + 15, s.dur + 30, s.dur + 45].map((x) => opt(x, `đến ${x}'`, s.durMax)).join('')}</select>` : ''}</label>
      ${si > 0 || d.guests[gi].services.length > 1 ? `<button class="icon-btn sm" data-act="bkRemoveSvc" data-gi="${gi}" data-si="${si}" title="Bỏ dịch vụ">${ic('x')}</button>` : ''}
    </div>
    <div class="se-row">
      ${field('Phòng · giường', `<select class="in ${err ? 'invalid' : ''}" data-bind="${base}.seat"><option value="">— Chọn phòng —</option>${seatOpts}</select>`, null, true, 'grow')}
      ${field('Tắm', `<select class="in" data-bind="${base}.bath">${opt('', 'Không', s.bath)}${opt('before', "Tắm trước (+15')", s.bath)}${opt('after', "Tắm sau (+15')", s.bath)}</select>`)}
      ${therSel}
    </div>
    ${err ? `<span class="ferr">${ic('alert')}${err.msg}</span>` : ''}
  </div>`;
}

function bookingSide(d, ch, showErr) {
  const all = d.guests.flatMap((g, gi) => g.services.map((s) => ({ g, gi, s })));
  const nGuests = d.guests.length;
  let cls;
  let head;
  let sub;
  if (ch.errs.length) {
    cls = showErr ? 'bad' : 'neutral';
    head = `Còn ${ch.errs.length} mục cần bổ sung`;
    sub = 'Có thể lưu khi đã điền đủ các mục bắt buộc.';
  } else if (ch.warns.length) {
    cls = 'warn';
    head = `Nhận được nhóm ${nGuests} khách — có lưu ý`;
    sub = 'Vẫn lưu được; lễ tân cần xử lý các lưu ý dưới đây.';
  } else {
    cls = 'ok';
    head = `Nhận được nhóm ${nGuests} khách`;
    sub = 'Phòng và KTV đều sẵn sàng.';
  }
  const t0 = Math.min(...all.map((x) => occStart(x.s)), d.time);
  const t1 = Math.max(...all.map((x) => occEnd(x.s)), d.time + 30);
  const span = Math.max(60, t1 - t0);
  const pct = (m) => ((m - t0) / span) * 100;
  const total = sum(all.map((x) => CATALOG[x.s.svc].price));
  return `<div class="verdict ${cls}">${ic(cls === 'ok' ? 'check' : cls === 'neutral' ? 'info' : 'alert')}<div><b>${head}</b><small>${sub}</small></div></div>
  <div class="side-sec"><h4>Kiểm tra</h4>
    <ul class="checks">
      ${ch.errs.map((e) => `<li class="${showErr ? 'bad' : 'todo'}">${ic(showErr ? 'alert' : 'chevR')}<span>${esc(e.msg)}</span></li>`).join('')}
      ${ch.warns.map((w) => `<li class="warn">${ic('alert')}<span>${esc(w.msg)}${w.hint ? `<small>${esc(w.hint)}</small>` : ''}</span></li>`).join('')}
      ${ch.oks.map((o) => `<li class="ok">${ic('check')}<span>${esc(o)}</span></li>`).join('')}
    </ul>
  </div>
  <div class="side-sec"><h4>Xem trước lịch <small>${fm(t0)}–${fm(t1)}</small></h4>
    <div class="preview">
      ${all.map(({ g, gi, s }) => `<div class="pv-row"><span>${esc(g.name || `Khách ${gi + 1}`)}</span><div class="pv-lane">
        <i class="pv-bar ${s.seat ? '' : 'noseat'}" style="--h:${HUES[gi % HUES.length]};left:${pct(occStart(s))}%;width:${pct(occEnd(s)) - pct(occStart(s))}%" title="${seatLabel(s.seat)}">${CATALOG[s.svc].short}</i>
      </div></div>`).join('')}
    </div>
  </div>
  <div class="side-sec"><h4>Tạm tính</h4>
    <div class="mini-bill">
      <div><span>${all.length} dịch vụ</span><b>${vnd(total)}</b></div>
      ${d.deposit ? `<div><span>Đặt cọc (${esc(d.depositMethod)})</span><b>−${vnd(d.deposit)}</b></div>` : ''}
      <div class="tot"><span>Dự kiến thu tại quầy</span><b>${vnd(Math.max(0, total - d.deposit))}</b></div>
    </div>
  </div>`;
}

function saveDraft(confirm) {
  const m = state.modal;
  const d = m.draft;
  const ch = draftChecks(d);
  if (ch.errs.length) {
    m.showErr = true;
    renderModal();
    toast(`Chưa lưu được — còn ${ch.errs.length} mục cần bổ sung (đánh dấu đỏ)`, 'err');
    return;
  }
  if (d.mode === 'follow') {
    closeModal();
    toast(`Đã tạo hẹn tiếp theo cho ${esc(d.name)} ngày ${esc(d.date)} lúc ${fm(d.time)}`, 'ok');
    return;
  }
  const walk = d.mode === 'walkin';
  const guests = d.guests.map((g) => ({
    id: g.id, name: g.name.trim(), customerId: g.customerId || undefined, prefs: g.prefs, prefsFrom: g.prefsFrom, arrived: walk || !!g.arrived,
    services: g.services.map((s, si) => {
      const full = s.therapists.every(Boolean);
      return {
        id: s.id, svc: s.svc, start: s.start, dur: s.dur !== CATALOG[s.svc].dur ? s.dur : undefined, durMax: s.durMax || undefined, bath: s.bath || undefined,
        seat: s.seat, therapists: [...s.therapists], request: d.mode === 'edit' ? s.request : s.therapists.filter(Boolean),
        status: s.status && s.status !== 'booked' ? s.status : walk && si === 0 && full ? 'active' : 'booked',
      };
    }),
  }));
  const fields = {
    name: d.name.trim(), phone: d.phone, email: d.email, channel: d.channel, source: d.source, deposit: d.deposit, depositMethod: d.depositMethod,
    notes: d.notes, extra: { ...d.extra }, guests, confirmed: walk || confirm,
  };
  let p = d.partyId && partyById(d.partyId);
  if (p) Object.assign(p, fields);
  else {
    const n = PARTIES.length;
    p = P({ id: walk ? `V-${1200 + n}` : `P-${2060 + n}`, kind: walk ? 'visit' : 'appt', walkin: walk, ...fields });
    p.hue = HUES[n % HUES.length];
    PARTIES.push(p);
  }
  closeModal();
  state.selParty = p.id;
  state.selSvcs = new Set();
  state.view = 'calendar';
  render();
  scrollToParty(p);
  const missing = partySvcs(p).filter((x) => needOf(x.s) > assigned(x.s).length).length;
  toast(walk ? `Đã nhận ${esc(p.name)}${missing ? ` · ${missing} dịch vụ cần chọn KTV để bắt đầu` : ' · dịch vụ đã bắt đầu'}`
    : `${d.mode === 'edit' ? 'Đã cập nhật' : 'Đã tạo'} ${p.id} · ${esc(p.name)}${p.confirmed ? ' · đã xác nhận' : ' · chưa xác nhận'}${ch.warns.length ? ` · ${ch.warns.length} lưu ý` : ''}`, ch.warns.length || missing ? 'warn' : 'ok');
}

function autoSeat(d) {
  const ids = draftIds(d);
  let filled = 0;
  d.guests.forEach((g) => g.services.forEach((s) => {
    if (s.seat && !draftSeatClash(d, s)) return;
    const used = d.guests.flatMap((gg) => gg.services).filter((o) => o !== s && o.seat).map((o) => SEAT[o.seat].room.id);
    const prefer = (CATALOG[s.svc].skill === 'da' ? ['R8'] : s.svc === 'foot60' ? ['R6'] : s.svc === 'four90' ? ['R3'] : []).concat(used);
    const order = [...SEATS].sort((x, y) => (prefer.includes(y.room.id) ? 1 : 0) - (prefer.includes(x.room.id) ? 1 : 0));
    const pick = order.find((seat) => {
      const tmp = { ...s, seat: seat.id };
      return !seatBusy(seat.id, occStart(tmp), occEnd(tmp), d.partyId, ids) && !d.guests.some((gg) => gg.services.some((o) => o !== s && o.seat === seat.id && occStart(o) < occEnd(s) && occEnd(o) > occStart(s)));
    });
    if (pick) { s.seat = pick.id; filled += 1; }
  }));
  return filled;
}

/* ---------- therapist assignment ---------- */

function openAssign(svcId, note = '') {
  const x = findSvc(svcId);
  if (!x) return;
  state.menu = null;
  state.modal = { type: 'assign', svcId, pick: [...x.s.therapists.filter(Boolean)], orig: [...x.s.therapists.filter(Boolean)], reason: '', note };
  renderModal();
}
function assignInfo(m) {
  const x = findSvc(m.svcId);
  const { s } = x;
  const a = s.start;
  const b = endOf(s);
  const cands = THERAPISTS.map((th) => ({ th, av: therAvail(th, a, b, s.id) }));
  const freeQueue = cands.filter((c) => c.av.k === 'free').sort((p, q) => p.th.rot - q.th.rot);
  const nextRot = freeQueue.find((c) => !m.orig.includes(c.th.id));
  const added = m.pick.filter((id) => !m.orig.includes(id));
  const skip = nextRot && added.length && !added.includes(nextRot.th.id) && !s.request?.some((r) => added.includes(r)) ? nextRot.th : null;
  return { x, cands, nextRot, skip, need: needOf(s) };
}
function renderAssign(m) {
  const { x, cands, nextRot, skip, need } = assignInfo(m);
  const { p, g, s } = x;
  const skill = def(s).skill;
  const groups = [
    ['free', 'Gợi ý — rảnh suốt dịch vụ', 'Xếp theo lượt'],
    ['partial', 'Rảnh một phần', 'Vào ca muộn hoặc hết ca giữa chừng'],
    ['late', 'Rảnh muộn vài phút', 'Khách sẽ bắt đầu trễ'],
    ['busy', 'Đang có lịch', 'Chọn sẽ tạo xung đột'],
    ['away', 'Ở cơ sở khác', ''],
    ['off', 'Ngoài ca / nghỉ', ''],
  ];
  const picked = m.pick.map((id) => cands.find((c) => c.th.id === id));
  const conflicts = picked.filter((c) => c.av.k !== 'free');
  const card = (c) => {
    const on = m.pick.includes(c.th.id);
    const tags = [];
    if (nextRot && c.th.id === nextRot.th.id) tags.push('<em class="tag first">Đến lượt</em>');
    if (s.request?.includes(c.th.id)) tags.push(`<em class="tag star">${ic('star')}Khách yêu cầu</em>`);
    if (c.th.from) tags.push(`<em class="tag">Mượn từ ${c.th.from}</em>`);
    if (skill && c.th.skills.includes(skill)) tags.push(`<em class="tag ok">${skill === '4tay' ? 'Kỹ năng 4 tay' : 'Chăm sóc da'}</em>`);
    if (skill && !c.th.skills.includes(skill) && c.av.k === 'free') tags.push('<em class="tag warn">Chưa có kỹ năng</em>');
    return `<button class="cand k-${c.av.k} ${on ? 'on' : ''}" data-act="asPick" data-id="${c.th.id}" aria-pressed="${on}">
      <span class="tav k-${c.av.k === 'partial' || c.av.k === 'late' ? 'finishing' : c.av.k}">${c.th.code}</span>
      <span class="cand-t"><b>${c.th.name}${tags.join('')}</b><small>${esc(c.av.why)} · ca ${c.th.off ? '—' : `${fm(c.th.shift[0])}–${fm(c.th.shift[1])}`}</small></span>
      <span class="cand-ck">${on ? ic('check') : ''}</span>
    </button>`;
  };
  return `<div class="modal md" role="dialog" aria-label="Phân công KTV">
    ${modalHead(`Phân công KTV · ${esc(g.name)}`, `${def(s).name} ${durOf(s)}' · ${fm(s.start)}–${fm(endOf(s))} · ${seatLabel(s.seat)} · ${esc(p.name)}`)}
    <div class="m-body" data-keep-scroll="as">
      ${m.note ? `<div class="banner warn">${ic('alert')}${esc(m.note)}</div>` : ''}
      <div class="need-bar ${m.pick.length >= need ? 'ok' : 'bad'}">
        <span>${ic('users')}Cần <b>${need} KTV</b>${need > 1 ? ' cho một khách (massage 4 tay)' : ''}</span>
        <span class="need-dots">${Array.from({ length: need }, (_, i) => `<i class="${m.pick[i] ? 'on' : ''}">${m.pick[i] ? TH[m.pick[i]].name : 'trống'}</i>`).join('')}</span>
      </div>
      ${g.prefs ? `<div class="pref">${ic('note')}<span>${esc(g.prefs)}</span></div>` : ''}
      ${groups.map(([k, label, hint]) => {
        const list = cands.filter((c) => c.av.k === k).sort((p1, p2) => p1.th.rot - p2.th.rot);
        if (!list.length) return '';
        if (k === 'off' || k === 'away') return `<div class="cand-group"><h4>${label}<span>${list.length}</span></h4><div class="cand-mini">${list.map((c) => `<span title="${esc(c.av.why)}">${c.th.name} · ${esc(c.av.why)}</span>`).join('')}</div></div>`;
        return `<div class="cand-group"><h4>${label}<span>${list.length}</span>${hint ? `<small>${hint}</small>` : ''}</h4>${list.map(card).join('')}</div>`;
      }).join('')}
    </div>
    <footer class="m-foot col">
      ${m.pick.length < need ? `<div class="banner bad">${ic('alert')}Còn thiếu ${need - m.pick.length} KTV — dịch vụ chưa thể bắt đầu. Vẫn có thể lưu để giữ chỗ.</div>` : ''}
      ${conflicts.map((c) => `<div class="banner warn">${ic('alert')}${c.th.name}: ${esc(c.av.why)} — lưu sẽ tạo xung đột lịch.</div>`).join('')}
      ${skip ? `<div class="banner info">${ic('repeat')}<span>Bỏ qua lượt của <b>${skip.name}</b>. Lý do:
        <select class="in sm" data-bind="modal.reason">${['', 'Khách yêu cầu KTV khác', 'Kỹ năng phù hợp hơn', 'KTV xin nghỉ lượt', 'Giới tính theo yêu cầu khách', 'Khác'].map((r) => opt(r, r || '— chọn lý do —', m.reason)).join('')}</select></span></div>` : ''}
      <div class="row-btns end"><button class="btn" data-act="closeModal">Hủy</button><button class="btn primary lg" data-act="asSave" ${skip && !m.reason ? 'disabled' : ''}>${ic('check')}Lưu phân công (${m.pick.length}/${need})</button></div>
    </footer>
  </div>`;
}

/* ---------- checkout ---------- */

function openCheckout(id) {
  const p = partyById(id);
  state.menu = null;
  state.modal = {
    type: 'checkout', partyId: id, discountPct: p.discountPct || 0, split: false, inv: 0,
    pays: { all: p.id === 'V-1187' ? [{ m: 'cash', amt: 600000, given: 1000000 }] : [], 0: [], 1: [], 2: [] },
    paidInv: {}, adv: false, addProd: '',
    comm: {},
  };
  renderModal();
}
function coTarget(m, bill) {
  if (!m.split) return { key: 'all', due: bill.due };
  const b = bill.byGuest[m.inv];
  return { key: m.inv, due: Math.max(0, b.net - (m.inv === 0 ? bill.deposit : 0)) };
}
function renderCheckout(m) {
  const p = partyById(m.partyId);
  const bill = partyBill(p, m.discountPct);
  if (p.payment === 'paid') return renderReceipt(p, bill);
  const pays = m.pays[coTarget(m, bill).key];
  return `<div class="modal xl" role="dialog" aria-label="Thanh toán">
    ${modalHead(`Thanh toán · ${esc(p.name)}`, `${p.id} · ${p.guests.length} khách · ${sum(p.guests.map((g) => g.services.length))} dịch vụ${p.payment === 'draft' ? ' · <b class="warn">hóa đơn tạm chưa lưu</b>' : ''}`)}
    <div class="co">
      <div class="co-inv" data-keep-scroll="co">
        <div class="co-bar">
          <label class="switch"><input type="checkbox" data-bind="modal.split" ${m.split ? 'checked' : ''}><span></span>Tách hóa đơn theo khách</label>
          <label class="co-disc">Giảm giá dịch vụ
            <select class="in sm" data-bind="modal.discountPct" data-type="num">${[0, 5, 10, 15, 20].map((v) => opt(v, `${v}%`, m.discountPct)).join('')}</select>
            ${p.promo ? `<em class="tag ok">${esc(p.promo)}</em>` : ''}
          </label>
        </div>
        ${bill.byGuest.map((b) => `<div class="inv ${m.split && m.inv === b.gi ? 'cur' : ''}">
          <div class="inv-h"><span class="gav sm" style="--h:${p.hue}">${initials(b.g.name)}</span><b>${esc(b.g.name)}</b>${m.split ? `<em class="tag">Hóa đơn ${b.gi + 1}</em>${m.paidInv[b.gi] ? `<em class="tag ok">${ic('check')}Đã thu</em>` : ''}` : ''}<span class="grow"></span><b>${vnd(b.net)}</b></div>
          <table class="lines"><thead><tr><th>Mục</th><th>Giá gốc</th><th>Giảm</th><th>Thành tiền</th><th></th></tr></thead><tbody>
          ${b.lines.map((l) => `<tr><td><b>${esc(l.name)}</b><small>${esc(l.sub)}</small></td><td class="num">${vnd(l.price)}</td><td class="num ${l.disc ? 'disc' : 'muted'}">${l.disc ? `−${vnd(l.disc)}` : '—'}</td><td class="num"><b>${vnd(l.price - l.disc)}</b></td><td>${l.prodIdx != null ? `<button class="icon-btn sm" data-act="coRemoveProd" data-i="${l.prodIdx}" title="Bỏ sản phẩm">${ic('x')}</button>` : ''}</td></tr>`).join('')}
          </tbody></table>
        </div>`).join('')}
        <div class="co-add">
          <select class="in sm" data-bind="modal.addProd"><option value="">+ Thêm sản phẩm / thẻ quà tặng…</option>${PRODUCTS.map((pr) => opt(pr.id, `${pr.name} · ${vnd(pr.price)}`, m.addProd)).join('')}</select>
          ${p.guests.length > 1 ? `<select class="in sm" data-bind="modal.addProdGi" data-type="num">${p.guests.map((g, i) => opt(i, `cho ${g.name}`, m.addProdGi ?? 0)).join('')}</select>` : ''}
          <button class="btn sm" data-act="coAddProd" ${m.addProd ? '' : 'disabled'}>Thêm</button>
        </div>
        <div class="totals">
          <div><span>Dịch vụ (giá gốc)</span><b>${vnd(bill.svcGross)}</b></div>
          ${bill.prodGross ? `<div><span>Sản phẩm</span><b>${vnd(bill.prodGross)}</b></div>` : ''}
          <div class="disc"><span>Giảm ${m.discountPct}% dịch vụ${p.promo ? ` · ${esc(p.promo)}` : ''}</span><b>${bill.disc ? `−${vnd(bill.disc)}` : '0 ₫'}</b></div>
          <div class="sub"><span>Tổng sau giảm</span><b>${vnd(bill.net)}</b></div>
          ${bill.deposit ? `<div class="dep"><span>${ic('check')}Đã đặt cọc · ${esc(p.depositMethod)}${m.split ? ' (trừ vào hóa đơn 1)' : ''}</span><b>−${vnd(bill.deposit)}</b></div>` : ''}
          <div class="due"><span>Còn phải trả</span><b>${vnd(bill.due)}</b></div>
        </div>
        <details class="adv" ${m.adv ? 'open' : ''}>
          <summary data-act="coAdv">${ic('settings')}Nâng cao · hoa hồng & lương KTV</summary>
          <p class="muted">Mặc định theo bảng hoa hồng của cơ sở. Chỉ chỉnh khi có thỏa thuận riêng — thay đổi được ghi lại cho quản lý.</p>
          <table class="lines"><thead><tr><th>KTV</th><th>Dịch vụ</th><th>Mặc định</th><th>Điều chỉnh</th></tr></thead><tbody>
          ${p.guests.flatMap((g) => g.services.flatMap((s) => assigned(s).map((tid) => {
            const k = `${s.id}-${tid}`;
            const base = Math.round((def(s).price / assigned(s).length) * 0.12);
            return `<tr><td><b>${TH[tid].name}</b> <small>(${TH[tid].code})</small></td><td>${esc(g.name)} · ${def(s).short}</td><td class="num">${vnd(base)}</td><td><div class="money sm"><input class="in sm" data-bind="modal.comm.${k}" data-type="money" value="${m.comm[k] != null ? m.comm[k].toLocaleString('en-US') : ''}" placeholder="${base.toLocaleString('en-US')}"><span>₫</span></div></td></tr>`;
          }))).join('')}
          </tbody></table>
        </details>
      </div>
      <div class="co-pay">
        ${m.split ? `<div class="inv-tabs">${bill.byGuest.map((b) => `<button class="${m.inv === b.gi ? 'on' : ''}" data-act="coInv" data-i="${b.gi}">HĐ ${b.gi + 1} · ${esc(b.g.name.split(' ')[0])}${m.paidInv[b.gi] ? ` ${ic('check')}` : ''}<small>${vnd(Math.max(0, b.net - (b.gi === 0 ? bill.deposit : 0)))}</small></button>`).join('')}</div>` : ''}
        <h4>Phương thức thanh toán</h4>
        <div class="methods">${Object.entries(METHODS).map(([k, v]) => `<button class="method" data-act="coAddPay" data-m="${k}">${ic(v.icon)}<span>${v.label}</span></button>`).join('')}</div>
        <div class="pays">${pays.length ? pays.map((r, i) => payRow(m, r, i, coTarget(m, bill).key)).join('') : `<div class="empty sm">${ic('wallet')}<small>Chọn một phương thức ở trên. Có thể kết hợp nhiều phương thức.</small></div>`}</div>
        <div id="co-sum">${paySummary(m)}</div>
      </div>
    </div>
  </div>`;
}
function payRow(m, r, i, key) {
  const base = `modal.pays.${key}.${i}`;
  let extra = '';
  if (r.m === 'cash') extra = `<label class="mini">Khách đưa<div class="money sm"><input class="in sm" data-bind="${base}.given" data-type="money" value="${r.given ? r.given.toLocaleString('en-US') : ''}" placeholder="—"><span>₫</span></div></label>`;
  if (r.m === 'gift') {
    const gc = GIFTCARDS.find((x) => x.code === r.code);
    extra = `<label class="mini">Mã thẻ<input class="in sm" data-bind="${base}.code" value="${esc(r.code || '')}" placeholder="GC-…"></label>${gc ? `<small class="${gc.state !== 'active' ? 'bad' : 'ok'}">${gc.state === 'locked' ? `${ic('lock')}Thẻ đang khóa` : gc.state === 'used' ? 'Thẻ đã dùng hết' : `${esc(gc.owner)} · còn ${vnd(gc.remaining)} · HSD ${gc.expiry}`}</small>` : r.code ? '<small class="bad">Không tìm thấy thẻ</small>' : ''}`;
  }
  if (r.m === 'partner') extra = `<label class="mini">Đối tác<select class="in sm" data-bind="${base}.partner">${PARTNERS.map((x) => opt(x, x, r.partner)).join('')}</select></label>`;
  if (r.m === 'card') extra = `<label class="mini">4 số cuối<input class="in sm" data-bind="${base}.last4" value="${esc(r.last4 || '')}" placeholder="—" maxlength="4"></label>`;
  return `<div class="pay">
    <span class="pay-m">${ic(METHODS[r.m].icon)}${METHODS[r.m].label}</span>
    <div class="money"><input class="in" data-bind="${base}.amt" data-type="money" inputmode="numeric" value="${r.amt.toLocaleString('en-US')}"><span>₫</span></div>
    <button class="icon-btn sm" data-act="coRemovePay" data-i="${i}" title="Bỏ">${ic('x')}</button>
    ${extra ? `<div class="pay-x">${extra}</div>` : ''}
  </div>`;
}
function payState(m) {
  const p = partyById(m.partyId);
  const bill = partyBill(p, m.discountPct);
  const tg = coTarget(m, bill);
  const rows = m.pays[tg.key];
  const paid = sum(rows.map((r) => r.amt));
  const rem = tg.due - paid;
  const errs = [];
  rows.forEach((r) => {
    if (r.m === 'gift') {
      const gc = GIFTCARDS.find((x) => x.code === r.code);
      if (!gc) errs.push('Nhập mã thẻ quà tặng hợp lệ');
      else if (gc.state !== 'active') errs.push(`Thẻ ${gc.code} không dùng được (${gc.state === 'locked' ? 'đang khóa' : 'đã hết'})`);
      else if (r.amt > gc.remaining) errs.push(`Thẻ ${gc.code} chỉ còn ${vnd(gc.remaining)}`);
    }
  });
  const cash = rows.find((r) => r.m === 'cash' && r.given > r.amt);
  return { p, bill, tg, rows, paid, rem, errs, change: cash ? cash.given - cash.amt : 0 };
}
function paySummary(m) {
  const s = payState(m);
  const pct = s.tg.due ? Math.min(100, (s.paid / s.tg.due) * 100) : 100;
  let hint;
  if (s.errs.length) hint = `<div class="banner bad">${ic('alert')}${esc(s.errs[0])}</div>`;
  else if (s.rem > 0) hint = `<div class="banner warn">${ic('alert')}<span>Còn thiếu <b>${vnd(s.rem)}</b> — thêm phương thức khác hoặc <button class="link" data-act="coFill">điền phần còn lại vào dòng cuối</button></span></div>`;
  else if (s.rem < 0) hint = `<div class="banner bad">${ic('alert')}Nhập dư ${vnd(-s.rem)} — kiểm tra lại số tiền</div>`;
  else hint = `<div class="banner ok">${ic('check')}Đã đủ số tiền${s.rows.length > 1 ? ` · ${s.rows.length} phương thức` : ''}</div>`;
  const ok = s.rem === 0 && !s.errs.length && (s.rows.length || s.tg.due === 0);
  return `<div class="due-card ${ok ? 'ok' : ''}">
      <small>${m.split ? `Hóa đơn ${m.inv + 1} · còn phải trả` : 'Còn phải trả'}</small>
      <b>${vnd(s.tg.due)}</b>
      <div class="paybar"><i style="width:${pct}%"></i></div>
      <div class="due-split"><span>Đã nhập <b>${vnd(s.paid)}</b></span><span>Còn lại <b class="${s.rem ? 'bad' : 'ok'}">${vnd(Math.max(0, s.rem))}</b></span></div>
      ${s.change ? `<div class="due-split"><span>${ic('cash')}Tiền thối lại khách</span><b>${vnd(s.change)}</b></div>` : ''}
    </div>
    ${hint}
    <div class="co-actions">
      <button class="btn" data-act="coPrint">${ic('printer')}In tạm tính</button>
      <button class="btn" data-act="coDraft">Lưu tạm</button>
      <button class="btn primary lg grow" data-act="coComplete" ${ok ? '' : 'disabled'}>${ic('check')}${m.split ? `Thu hóa đơn ${m.inv + 1}` : 'Hoàn tất thanh toán'}</button>
    </div>`;
}
function renderReceipt(p, bill) {
  const rows = LEDGER.filter((l) => l.party === p.id);
  return `<div class="modal md" role="dialog" aria-label="Hóa đơn">
    ${modalHead(`Hóa đơn · ${esc(p.name)}`, `${p.id} · đã thanh toán`)}
    <div class="m-body receipt">
      <div class="verdict ok">${ic('check')}<div><b>Đã thanh toán đủ ${vnd(bill.net)}</b><small>${rows.length ? `Lúc ${rows[rows.length - 1].t}` : ''}</small></div></div>
      <table class="lines">${bill.byGuest.flatMap((b) => b.lines.map((l) => `<tr><td>${esc(b.g.name)} · ${esc(l.name)}</td><td class="num">${vnd(l.price - l.disc)}</td></tr>`)).join('')}</table>
      <div class="totals">${bill.disc ? `<div class="disc"><span>Đã giảm</span><b>−${vnd(bill.disc)}</b></div>` : ''}${rows.map((r) => `<div><span>${ic(METHODS[r.m].icon)}${METHODS[r.m].label}${r.kind === 'deposit' ? ' (cọc)' : ''}</span><b>${vnd(r.amt)}</b></div>`).join('')}</div>
    </div>
    <footer class="m-foot"><span></span><div class="row-btns"><button class="btn" data-act="feedback" data-id="${p.id}">${ic('message')}Phiếu phản hồi</button><button class="btn primary" data-act="coPrint">${ic('printer')}In hóa đơn</button></div></footer>
  </div>`;
}

/* ---------- search & customer ---------- */

function searchResults(m) {
  const q = m.q.trim().toLowerCase();
  const digits = q.replace(/\D/g, '');
  const match = (p) => !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.guests.some((g) => g.name.toLowerCase().includes(q)) || (digits.length >= 3 && p.phone.replace(/\D/g, '').includes(digits));
  const ps = PARTIES.filter((p) => !p.cancelled && match(p));
  const appts = ps.filter((p) => !p.guests.some((g) => g.arrived));
  const visits = ps.filter((p) => p.guests.some((g) => g.arrived));
  const custs = Object.values(CUSTOMERS).filter((c) => !q || c.name.toLowerCase().includes(q) || (digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits)));
  const flat = [
    ...appts.slice(0, 6).map((p) => ({ kind: 'Cuộc hẹn', act: 'goParty', id: p.id, title: p.name, sub: `${p.id} · ${fm(partyStart(p))} · ${p.guests.length} khách · ${p.confirmed ? 'đã xác nhận' : 'chưa xác nhận'}`, hue: p.hue })),
    ...visits.slice(0, 6).map((p) => ({ kind: 'Khách đã đến', act: 'goParty', id: p.id, title: p.name, sub: `${p.id} · ${fm(partyStart(p))} · ${p.payment === 'paid' ? 'đã thanh toán' : allDone(p) ? 'chờ thanh toán' : 'đang phục vụ'}`, hue: p.hue })),
    ...custs.slice(0, 4).map((c) => ({ kind: 'Khách hàng', act: 'customer', id: c.id, title: c.name, sub: `${c.vip ? 'VIP · ' : ''}${c.visits} lần · ${c.phone}` })),
  ];
  m.flat = flat;
  if (!flat.length) return `<div class="empty">${ic('search', 'big')}<b>Không tìm thấy “${esc(m.q)}”</b><small>Thử tên khác, 4 số cuối điện thoại hoặc mã như P-2043.</small><button class="btn primary" data-act="newBooking">${ic('plus')}Đặt lịch mới cho khách này</button></div>`;
  let last = '';
  return flat.map((r, i) => {
    const h = r.kind !== last ? `<h4>${r.kind}</h4>` : '';
    last = r.kind;
    return `${h}<button class="sres ${i === m.idx ? 'on' : ''}" data-act="${r.act}" data-id="${r.id}">${r.hue != null ? `<i class="dot" style="--h:${r.hue}"></i>` : ic('user')}<span><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></span>${ic('arrowR')}</button>`;
  }).join('');
}
function renderSearch(m) {
  return `<div class="modal search" role="dialog" aria-label="Tìm kiếm">
    <div class="search-in">${ic('search')}<input class="in" data-bind="modal.q" value="${esc(m.q)}" placeholder="Tên khách, số điện thoại, mã đặt lịch (P-2043)…" autocomplete="off"><kbd>Esc</kbd></div>
    <div class="search-res" id="search-res">${searchResults(m)}</div>
    <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> chọn</span><span><kbd>Enter</kbd> mở</span><span>Tìm trong cuộc hẹn, khách đã đến và hồ sơ khách</span></div>
  </div>`;
}
function searchKeys(e) {
  const m = state.modal;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    m.idx = Math.max(0, Math.min((m.flat?.length || 1) - 1, m.idx + (e.key === 'ArrowDown' ? 1 : -1)));
    $('#search-res').innerHTML = searchResults(m);
    $('.sres.on')?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    const r = m.flat?.[m.idx];
    if (r) { e.preventDefault(); ACTIONS[r.act]({ id: r.id }); }
  }
}

function renderCustomer(m) {
  const c = CUSTOMERS[m.id];
  const gcs = GIFTCARDS.filter((g) => g.owner === c.name);
  return `<div class="modal md" role="dialog" aria-label="Hồ sơ khách">
    ${modalHead(`${esc(c.name)}${c.vip ? ` <em class="chip vip">${ic('crown')}VIP</em>` : ''}`, `Khách từ ${c.since} · ${c.nationality}`)}
    <div class="m-body">
      <div class="kpis">
        <div><small>Số lần đến</small><b>${c.visits}</b></div>
        <div><small>Lần gần nhất</small><b>${c.last}</b></div>
        <div><small>Tổng chi tiêu</small><b>${vnd(c.spend)}</b></div>
        <div><small>Sinh nhật</small><b>${c.birthday}</b></div>
      </div>
      <dl class="info">
        <div><dt>${ic('phone')}Liên hệ</dt><dd>${esc(c.phone)}${c.email ? ` · ${esc(c.email)}` : ''}</dd></div>
        <div><dt>${ic('star')}KTV quen</dt><dd>${TH[c.fav] ? `${TH[c.fav].name} (${TH[c.fav].code})` : '—'}</dd></div>
        ${c.notes ? `<div><dt>${ic('note')}Ghi chú</dt><dd>${esc(c.notes)}</dd></div>` : ''}
      </dl>
      <h3 class="sec-h">Sở thích được mang sang lịch mới</h3>
      <div class="chips wrap">${c.prefs.map((p) => `<em class="chip">${esc(p)}</em>`).join('')}</div>
      ${gcs.length ? `<h3 class="sec-h">Thẻ quà tặng</h3>${gcs.map((g) => `<div class="gc-mini">${ic('gift')}<b>${g.code}</b><span>còn ${vnd(g.remaining)} · HSD ${g.expiry}</span></div>`).join('')}` : ''}
      <h3 class="sec-h">Lịch sử dịch vụ</h3>
      <table class="lines"><thead><tr><th>Ngày</th><th>Dịch vụ</th><th>KTV</th><th>Phản hồi</th><th>Tiền</th></tr></thead><tbody>
      ${c.history.map((h) => `<tr><td>${h.date}<small>${h.branch}</small></td><td>${esc(h.svc)}</td><td>${h.ther}</td><td>${'★'.repeat(h.fb)}<span class="muted">${'★'.repeat(5 - h.fb)}</span></td><td class="num">${vnd(h.amt)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    <footer class="m-foot"><span></span><div class="row-btns"><button class="btn" data-act="custBook" data-id="${c.id}">${ic('plus')}Đặt lịch cho khách này</button></div></footer>
  </div>`;
}

/* ---------- small modals ---------- */

function renderFeedback(m) {
  const p = partyById(m.id);
  return `<div class="modal sm" role="dialog">${modalHead('Phản hồi của khách', esc(p.name))}
    <div class="m-body">
      ${p.guests.map((g, gi) => `<div class="fb"><b>${esc(g.name)}</b><div class="stars">${[1, 2, 3, 4, 5].map((n) => `<button class="${(m.r[gi] || 0) >= n ? 'on' : ''}" data-act="fbStar" data-g="${gi}" data-n="${n}" aria-label="${n} sao">${ic('star')}</button>`).join('')}</div></div>`).join('')}
      ${field('Ghi chú phản hồi', `<textarea class="in" rows="3" data-bind="modal.text" placeholder="Khách khen KTV, góp ý về phòng…">${esc(m.text)}</textarea>`)}
    </div>
    <footer class="m-foot"><span></span><div class="row-btns"><button class="btn" data-act="closeModal">Hủy</button><button class="btn primary" data-act="fbSave">Lưu phản hồi</button></div></footer></div>`;
}
function renderCancel(m) {
  const p = partyById(m.id);
  return `<div class="modal sm" role="dialog">${modalHead(`Hủy lịch · ${esc(p.name)}`, `${p.id} · ${fm(partyStart(p))} · ${p.guests.length} khách`)}
    <div class="m-body">
      ${field('Lý do hủy', `<select class="in" data-bind="modal.reason">${['Khách báo hủy', 'Khách không đến', 'Trùng lịch', 'Đặt nhầm', 'Khác'].map((r) => opt(r, r, m.reason)).join('')}</select>`)}
      ${p.deposit ? `<div class="banner warn">${ic('wallet')}Khách đã cọc ${vnd(p.deposit)} — chọn cách xử lý:</div>
        <div class="radio">${['Giữ cọc', 'Hoàn cọc', 'Chuyển sang lịch khác'].map((r) => `<label><input type="radio" name="dep" ${m.dep === r ? 'checked' : ''} data-act="cancelDep" data-v="${r}">${r}</label>`).join('')}</div>` : ''}
    </div>
    <footer class="m-foot"><span></span><div class="row-btns"><button class="btn" data-act="closeModal">Không hủy</button><button class="btn danger-fill" data-act="cancelDo">Hủy lịch</button></div></footer></div>`;
}
function renderReject(m) {
  const f = state.forms.rej;
  return `<div class="modal sm" role="dialog">${modalHead('Ghi nhận từ chối đặt lịch', 'Giúp quản lý biết nhu cầu bị bỏ lỡ')}
    <div class="m-body"><div class="fgrid two">
      ${field('Thời gian khách muốn', inp('forms.rej.req', f.req))}
      ${field('Số khách', `<select class="in" data-bind="forms.rej.size" data-type="num">${[1, 2, 3, 4, 5, 6, 8].map((n) => opt(n, n, f.size)).join('')}</select>`)}
      ${field('Kênh', `<select class="in" data-bind="forms.rej.channel">${CHANNELS.map((c) => opt(c, c, f.channel)).join('')}</select>`)}
      ${field('Lý do', `<select class="in" data-bind="forms.rej.reason">${['Không đủ KTV', 'Hết phòng', 'Hết phòng đôi', 'Ngoài giờ', 'Nhóm quá lớn', 'Khác'].map((c) => opt(c, c, f.reason)).join('')}</select>`)}
    </div></div>
    <footer class="m-foot"><span></span><div class="row-btns"><button class="btn" data-act="closeModal">Hủy</button><button class="btn primary" data-act="rejSave">Ghi nhận</button></div></footer></div>`;
}
function renderShortcuts() {
  const rows = [['N', 'Đặt lịch mới'], ['W', 'Khách vãng lai'], ['/  hoặc  ⌘K', 'Tìm kiếm'], ['T', 'Về hôm nay'], ['[  ]', 'Ngày trước / sau'], ['← →', 'Dời mục đã chọn 15 phút'], ['↑ ↓', 'Đổi giường mục đã chọn'], ['⇧ + nhấp', 'Chọn nhiều dịch vụ'], ['Enter', 'Thanh toán nhóm đang chọn (nếu xong)'], ['Nhấp đúp ô trống', 'Đặt lịch tại giường & giờ đó'], ['Chuột phải', 'Thao tác nhanh trên khối'], ['Esc', 'Đóng / bỏ chọn']];
  return `<div class="modal sm" role="dialog">${modalHead('Phím tắt', 'Bổ sung cho các nút — mọi thao tác đều có nút hiển thị')}
    <div class="m-body"><table class="lines kb">${rows.map(([k, v]) => `<tr><td><kbd>${k}</kbd></td><td>${v}</td></tr>`).join('')}</table></div></div>`;
}
function renderAbout() {
  return `<div class="modal md" role="dialog">${modalHead('Về mockup này', 'MissySalon · ý tưởng giao diện điều phối — dữ liệu hư cấu')}
    <div class="m-body prose">
      <h3>Ba hướng đã cân nhắc</h3>
      <ol>
        <li><b>Dòng thời gian + bàn làm việc bên phải</b> (đã chọn) — lưới phòng × giờ chiếm trung tâm, ngăn bên phải đổi theo ngữ cảnh: Cần xử lý → chi tiết nhóm → thanh toán. Không bao giờ rời khỏi lịch.</li>
        <li><b>Bảng luồng khách</b> — các cột Sắp đến / Đã đến / Đang làm / Chờ thanh toán như kanban, lịch phòng thu nhỏ phía trên. Mạnh khi theo dõi tiến trình, yếu khi xếp phòng.</li>
        <li><b>Bảng điều khiển theo lệnh</b> — ô tìm kiếm/lệnh làm trung tâm, kết quả và hành động dạng thẻ. Nhanh cho lễ tân thạo phím, khó cho người mới.</li>
      </ol>
      <h3>Quyết định tương tác chính</h3>
      <ul>
        <li>Ba trạng thái tách biệt: <b>Lịch hẹn</b> (xác nhận), <b>Tiến trình</b> (đến / đang làm), <b>Thanh toán</b>.</li>
        <li>Khối lịch: viền đứt = chưa đến, nền đặc = đã đến, thanh tiến độ = đang làm; trạng thái luôn có chữ + biểu tượng.</li>
        <li>Hai hàng cố định cuối lưới: <b>giường trống</b> và <b>KTV còn rảnh</b> theo 15 phút — tách chỗ khỏi người.</li>
        <li>Băng đỏ “Thiếu KTV” trên thanh giờ cảnh báo khung giờ tương lai.</li>
        <li>Kéo-thả có xem trước & chặn trùng; chọn nhiều để dời cả nhóm; luôn có Hoàn tác.</li>
      </ul>
      <p class="muted">Xem README.md trong thư mục để có bản đầy đủ, gồm phần tách ý tưởng mới với chức năng hiện có.</p>
    </div></div>`;
}

/* ---------- secondary screens ---------- */

function renderOverview() {
  const ps = PARTIES.filter((p) => !p.cancelled);
  const guests = sum(ps.map((p) => p.guests.length));
  const svcs = sum(ps.map((p) => sum(p.guests.map((g) => g.services.length))));
  const paid = ps.filter((p) => p.payment === 'paid').length;
  const unpaid = ps.filter((p) => p.payment !== 'paid' && p.guests.some((g) => g.arrived)).length;
  const byM = Object.keys(METHODS).map((k) => ({ k, amt: sum(LEDGER.filter((l) => l.m === k).map((l) => l.amt)) }));
  const total = sum(byM.map((x) => x.amt));
  const max = Math.max(...byM.map((x) => x.amt), 1);
  const deposits = sum(LEDGER.filter((l) => l.kind === 'deposit').map((l) => l.amt));
  const prods = LEDGER.filter((l) => l.kind === 'product');
  const gifts = LEDGER.filter((l) => l.kind === 'giftcard');
  const cin = sum(CASHBOOK.filter((c) => c.type === 'in').map((c) => c.amt));
  const cout = sum(CASHBOOK.filter((c) => c.type === 'out').map((c) => c.amt));
  const cashSales = sum(LEDGER.filter((l) => l.m === 'cash').map((l) => l.amt));
  const f = state.forms.cash;
  const svcAll = svcList();
  const therStats = THERAPISTS.filter((t) => !t.off).map((t) => {
    const mine = svcAll.filter((x) => x.s.therapists.includes(t.id) && (x.s.status === 'done' || x.s.status === 'active'));
    return { t, n: mine.length, mins: sum(mine.map((x) => durOf(x.s))), comm: sum(mine.map((x) => Math.round((def(x.s).price / assigned(x.s).length) * 0.12))) };
  }).filter((x) => x.n).sort((a, b) => b.comm - a.comm);
  const att = attention().filter((a) => a.sev !== 'info');
  return `<div class="page" ${state.view === 'money' ? 'data-focus="money"' : ''}>
    <div class="page-head"><div><h1>Tổng quan ngày</h1><small>Cơ sở 3 · ${dateLabel(0)} · cập nhật ${fm(NOW)}</small></div>
      <div class="row-btns"><button class="btn" data-act="nav" data-v="calendar">${ic('calendar')}Về lịch trong ngày</button><button class="btn" data-act="toastInfo" data-msg="Xuất báo cáo ngày (mockup)">${ic('upload')}Xuất báo cáo</button></div></div>
    <div class="stats">
      <div><small>Nhóm khách</small><b>${ps.length}</b><em>${ps.filter((p) => p.walkin).length} vãng lai</em></div>
      <div><small>Khách</small><b>${guests}</b><em>${ps.filter((p) => p.guests.some((g) => g.arrived)).length} nhóm đã đến</em></div>
      <div><small>Liệu trình</small><b>${svcs}</b><em>${svcAll.filter((x) => x.s.status === 'done').length} đã xong</em></div>
      <div><small>Hóa đơn</small><b>${paid} <span>đã TT</span></b><em class="${unpaid ? 'warn' : ''}">${unpaid} chưa thanh toán</em></div>
      <div><small>Đã thu hôm nay</small><b>${vnd(total)}</b><em>gồm ${vnd(deposits)} tiền cọc</em></div>
    </div>
    <div class="ov-grid">
      <section class="card">
        <h3>Doanh thu theo phương thức</h3>
        <div class="hbars">${byM.map((x) => `<div class="hbar"><span>${ic(METHODS[x.k].icon)}${METHODS[x.k].label}</span><div><i style="width:${(x.amt / max) * 100}%"></i></div><b>${vnd(x.amt)}</b></div>`).join('')}</div>
        <div class="tot-line"><span>Tổng</span><b>${vnd(total)}</b></div>
      </section>
      <section class="card">
        <h3>Sản phẩm & thẻ quà tặng</h3>
        ${[...prods, ...gifts].map((l) => `<div class="li"><span>${ic(l.kind === 'giftcard' ? 'gift' : 'bag')}${esc(l.note)}<small>${l.t} · ${METHODS[l.m].label}</small></span><b>${vnd(l.amt)}</b></div>`).join('')}
        <div class="tot-line"><span>Sản phẩm ${vnd(sum(prods.map((l) => l.amt)))} · Thẻ ${vnd(sum(gifts.map((l) => l.amt)))}</span></div>
        <button class="btn sm" data-act="nav" data-v="giftcards">${ic('gift')}Bán / tra cứu thẻ</button>
      </section>
      <section class="card">
        <h3>Trước khi đóng ngày <span class="count">${att.length}</span></h3>
        ${att.slice(0, 6).map((a) => `<button class="li link-row sev-${a.sev}" data-act="${a.party ? 'goParty' : 'goTime'}" ${dataAttrs(a.party ? { id: a.party } : { t: a.id.split('-')[1] })}><span>${ic(a.icon)}${esc(a.title)}</span>${ic('chevR')}</button>`).join('') || `<div class="empty sm">${ic('check')}<small>Không còn việc treo.</small></div>`}
      </section>
      <section class="card span2" id="money">
        <h3>Thu chi tại quầy <small>tiền mặt trong két dự kiến: <b>${vnd(cin + cashSales - cout)}</b></small></h3>
        <div class="cash-form">
          <div class="seg">${[['in', 'Thu'], ['out', 'Chi']].map(([v, l]) => `<button class="${f.type === v ? 'on' : ''}" data-act="cashType" data-v="${v}">${l}</button>`).join('')}</div>
          <select class="in sm" data-bind="forms.cash.cat">${['Vật tư', 'Đưa đón', 'Ăn trưa KTV', 'Sửa chữa', 'Quỹ đầu ca', 'Khác'].map((c) => opt(c, c, f.cat)).join('')}</select>
          <div class="money sm"><input class="in sm" data-bind="forms.cash.amt" data-type="money" placeholder="Số tiền" value="${f.amt ? f.amt.toLocaleString('en-US') : ''}"><span>₫</span></div>
          <input class="in sm grow" data-bind="forms.cash.note" placeholder="Ghi chú" value="${esc(f.note)}">
          <button class="btn sm primary" data-act="cashAdd">${ic('plus')}Ghi</button>
        </div>
        <table class="lines"><thead><tr><th>Giờ</th><th>Loại</th><th>Nội dung</th><th>Người ghi</th><th>Số tiền</th></tr></thead><tbody>
        ${CASHBOOK.map((c) => `<tr><td>${c.t}</td><td><em class="chip ${c.type === 'in' ? 'ok' : 'warn'}">${c.type === 'in' ? 'Thu' : 'Chi'}</em></td><td>${esc(c.cat)}<small>${esc(c.note)}</small></td><td>${c.by}</td><td class="num ${c.type === 'out' ? 'disc' : ''}">${c.type === 'out' ? '−' : '+'}${vnd(c.amt)}</td></tr>`).join('')}
        </tbody></table>
        <div class="tot-line"><span>Thu ${vnd(cin)} · Chi ${vnd(cout)}</span></div>
      </section>
      <section class="card">
        <h3>Lương & hoa hồng KTV <small>tạm tính</small></h3>
        ${therStats.slice(0, 7).map((x) => `<div class="li"><span><span class="tav sm">${x.t.code}</span>${x.t.name}<small>${x.n} DV · ${x.mins}'</small></span><b>${vnd(x.comm)}</b></div>`).join('')}
        <button class="btn sm" data-act="toastInfo" data-msg="Mở bảng lương chi tiết (màn hình phụ)">${ic('wallet')}Mở bảng lương</button>
      </section>
      <section class="card span3">
        <h3>Nhật ký từ chối đặt lịch <span class="count">${REJECTIONS.length}</span><button class="btn sm" data-act="logReject">${ic('plus')}Ghi nhận</button></h3>
        <table class="lines"><thead><tr><th>Ghi lúc</th><th>Cơ sở</th><th>Khách muốn</th><th>Số khách</th><th>Kênh</th><th>Lý do</th></tr></thead><tbody>
        ${REJECTIONS.map((r) => `<tr><td>${r.t}</td><td>${r.branch}</td><td>${r.req}</td><td>${r.size}</td><td>${r.channel}</td><td><em class="chip">${esc(r.reason)}</em></td></tr>`).join('')}
        </tbody></table>
      </section>
    </div>
  </div>`;
}

function gcList() {
  const q = state.gc.q.trim().toLowerCase();
  const list = GIFTCARDS.filter((g) => !q || g.code.toLowerCase().includes(q) || g.owner.toLowerCase().includes(q) || g.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§'));
  if (!list.length) return `<div class="empty sm">${ic('gift')}<small>Không có thẻ khớp “${esc(state.gc.q)}”.</small></div>`;
  const label = { active: ['ok', 'Đang dùng'], locked: ['bad', 'Đã khóa'], used: ['', 'Đã dùng hết'] };
  return list.map((g) => `<button class="gc-row ${state.gc.sel === g.code ? 'on' : ''}" data-act="gcSel" data-id="${g.code}">
    <span>${ic('gift')}<b>${g.code}</b><small>${esc(g.owner)}</small></span>
    <span class="num"><b>${vnd(g.remaining)}</b><small>/ ${vnd(g.value + g.bonus)}</small></span>
    <em class="chip ${label[g.state][0]}">${label[g.state][1]}</em>
  </button>`).join('');
}
function renderGiftcards() {
  const g = GIFTCARDS.find((x) => x.code === state.gc.sel);
  const s = state.gc.sell;
  return `<div class="page">
    <div class="page-head"><div><h1>Thẻ quà tặng</h1><small>Tìm, bán và khóa thẻ · dùng chung cho mọi cơ sở</small></div><button class="btn" data-act="nav" data-v="calendar">${ic('calendar')}Về lịch trong ngày</button></div>
    <div class="gc-grid">
      <section class="card">
        <div class="search-in sm">${ic('search')}<input class="in" data-bind="gc.q" value="${esc(state.gc.q)}" placeholder="Mã thẻ, tên chủ thẻ, SĐT…"></div>
        <div id="gc-list">${gcList()}</div>
      </section>
      <section class="card">
        ${g ? `<div class="gc-card ${g.state}">
          <div class="gc-face"><small>MissySalon · Thẻ quà tặng</small><b>${g.code}</b><span>${vnd(g.remaining)}</span><em>HSD ${g.expiry}</em></div>
          <dl class="info">
            <div><dt>${ic('user')}Chủ thẻ</dt><dd>${esc(g.owner)} · ${esc(g.phone)}</dd></div>
            <div><dt>${ic('wallet')}Giá trị</dt><dd>${vnd(g.value)}${g.bonus ? ` + tặng ${vnd(g.bonus)}` : ''}</dd></div>
            <div><dt>${ic('sparkle')}Khuyến mãi</dt><dd>${esc(g.promo)}</dd></div>
            <div><dt>${ic('calendar')}Phát hành</dt><dd>${g.issued}</dd></div>
            <div><dt>${ic(g.state === 'locked' ? 'lock' : 'check')}Trạng thái</dt><dd>${g.state === 'locked' ? `<span class="bad">Đã khóa — ${esc(g.lockReason)}</span>` : g.state === 'used' ? 'Đã dùng hết' : '<span class="ok">Đang hoạt động</span>'}</dd></div>
          </dl>
          <h3 class="sec-h">Lịch sử sử dụng</h3>
          ${g.usage.length ? `<table class="lines">${g.usage.map((u) => `<tr><td>${u.date}</td><td>${esc(u.note)}</td><td class="num disc">−${vnd(u.amt)}</td></tr>`).join('')}</table>` : '<p class="muted">Chưa sử dụng.</p>'}
          <div class="row-btns">${g.state === 'used' ? '' : `<button class="btn" data-act="gcLock" data-id="${g.code}">${ic(g.state === 'locked' ? 'unlock' : 'lock')}${g.state === 'locked' ? 'Mở khóa' : 'Khóa thẻ'}</button>`}<button class="btn" data-act="coPrint">${ic('printer')}In thẻ</button></div>
        </div>` : '<div class="empty">Chọn một thẻ</div>'}
      </section>
      <section class="card">
        <h3>${ic('plus')}Bán thẻ mới</h3>
        <div class="fgrid one">
          ${field('Chủ thẻ', inp('gc.sell.owner', s.owner, 'Tên người nhận'), null, true)}
          ${field('Điện thoại', inp('gc.sell.phone', s.phone, '+84 …'))}
          ${field('Mệnh giá', `<select class="in" data-bind="gc.sell.value" data-type="num">${[500000, 1000000, 2000000, 3000000, 5000000].map((v) => opt(v, vnd(v), s.value)).join('')}</select>`)}
          ${field('Khuyến mãi', `<select class="in" data-bind="gc.sell.promo">${['', 'Tặng thêm 10%', 'Combo cặp đôi'].map((v) => opt(v, v || 'Không', s.promo)).join('')}</select>`)}
        </div>
        <div class="mini-bill"><div class="tot"><span>Khách trả</span><b>${vnd(s.value)}</b></div>${s.promo === 'Tặng thêm 10%' ? `<div><span>Giá trị thẻ</span><b>${vnd(s.value * 1.1)}</b></div>` : ''}</div>
        <button class="btn primary" data-act="gcSell">${ic('gift')}Bán & in thẻ</button>
      </section>
    </div>
  </div>`;
}

function renderShifts() {
  const svcAll = svcList();
  return `<div class="page">
    <div class="page-head"><div><h1>Ca làm & lượt KTV</h1><small>Cơ sở 3 · ${dateLabel(0)}</small></div>
      <div class="row-btns"><button class="btn" data-act="toastInfo" data-msg="Nhập ca từ file Excel (màn hình phụ)">${ic('upload')}Nhập ca từ file</button><button class="btn" data-act="nav" data-v="calendar">${ic('calendar')}Về lịch</button></div></div>
    <div class="ov-grid">
      <section class="card span2">
        <h3>Ca hôm nay</h3>
        <table class="lines"><thead><tr><th>Lượt</th><th>KTV</th><th>Ca</th><th>Bây giờ</th><th>Đã làm</th><th>Bỏ lượt</th></tr></thead><tbody>
        ${[...THERAPISTS].sort((a, b) => a.rot - b.rot).map((t) => {
          const st = therNow(t);
          const n = svcAll.filter((x) => x.s.therapists.includes(t.id) && x.s.status !== 'booked').length;
          const sk = SKIPS.filter((s) => s.th === t.id).length;
          return `<tr><td class="num">${t.off ? '—' : t.rot}</td><td><span class="tav sm k-${st.k}">${t.code}</span> <b>${t.name}</b>${t.from ? ` <em class="tag">từ ${t.from}</em>` : ''}</td>
            <td>${t.off ? '<em class="chip">Nghỉ</em>' : `${fm(t.shift[0])}–${fm(t.shift[1])}`}${t.away ? `<small>${t.away.branch} ${fm(t.away.from)}–${fm(t.away.to)}</small>` : ''}</td>
            <td><small class="k-${st.k}">${esc(st.label)}</small></td><td class="num">${n}</td><td class="num">${sk ? `<em class="chip warn">${sk}</em>` : '—'}</td></tr>`;
        }).join('')}
        </tbody></table>
      </section>
      <section class="card">
        <h3>Nhật ký bỏ lượt <span class="count">${SKIPS.length}</span></h3>
        ${SKIPS.map((s) => `<div class="li"><span>${ic('repeat')}<b>${TH[s.th].name}</b><small>${s.t} · ${esc(s.reason)} · ${s.by}</small></span></div>`).join('')}
        <p class="muted">Bỏ lượt được ghi tự động khi lễ tân chọn KTV khác người đến lượt.</p>
      </section>
    </div>
  </div>`;
}

/* ---------- actions ---------- */

const ACTIONS = {
  nav({ v }) {
    if (v === 'customers') { ACTIONS.search(); return; }
    if (v === 'reports' || v === 'settings') { toast(v === 'reports' ? 'Báo cáo: màn hình phụ, ngoài phạm vi mockup' : 'Cài đặt: màn hình phụ, ngoài phạm vi mockup', 'warn'); return; }
    state.view = v;
    render();
    if (v === 'money') setTimeout(() => $('#money')?.scrollIntoView({ behavior: 'smooth' }), 30);
  },
  day({ d }) {
    state.dayOffset += Number(d);
    state.loading = true;
    state.selParty = null; state.selSvcs = new Set(); state.selNote = null;
    state.view = 'calendar';
    render();
    setTimeout(() => { state.loading = false; render(); if (state.dayOffset === 0) scrollToTime(T('12:45')); }, 450);
  },
  today() {
    if (state.dayOffset === 0) { state.view = 'calendar'; render(); scrollToTime(NOW); return; }
    ACTIONS.day({ d: -state.dayOffset });
  },
  search() { state.menu = null; state.modal = { type: 'search', q: '', idx: 0, focus: '.search-in input' }; renderModal(); },
  newBooking(d = {}) {
    const t = d.t ? Number(d.t) : null;
    openBooking(blankDraft('new', '', t, d.size ? Number(d.size) : 1));
  },
  walkin() { openBooking(blankDraft('walkin', '', NOW)); },
  closeModal,
  zoom({ z }) {
    const tl = $('#tl');
    const center = tl ? START + (tl.scrollLeft + tl.clientWidth / 2 - LAB_W) / state.zoom : NOW;
    state.zoom = Number(z);
    render();
    const tl2 = $('#tl');
    if (tl2) tl2.scrollLeft = (center - START) * state.zoom - tl2.clientWidth / 2 + LAB_W;
  },
  toggleTher() { state.showTher = !state.showTher; render(); },
  goNow() { scrollToTime(NOW); },
  goTime({ t }) { closeModal(); state.view = 'calendar'; state.selParty = null; render(); scrollToTime(Number(t)); },
  staffAt({ t }) { state.view = 'calendar'; state.selParty = null; state.selSvcs = new Set(); state.panelTab = 'staff'; state.therAt = Number(t); render(); scrollToTime(Number(t)); },
  panelTab({ tab }) { state.panelTab = tab; state.selParty = null; state.selSvcs = new Set(); state.selNote = null; if (tab === 'staff') state.therAt = NOW; render(); },
  goParty({ id }) {
    if (CUSTOMERS[id]) { ACTIONS.customer({ id }); return; }
    closeModal();
    if (state.dayOffset !== 0) { state.dayOffset = 0; }
    selectParty(id);
  },
  selectParty({ id, svc }) { selectParty(id); if (svc) { state.selSvcs = new Set([svc]); render(); } },
  selectNote({ id }) { state.selNote = id; state.selParty = null; state.selSvcs = new Set(); state.view = 'calendar'; render(); const n = NOTES.find((x) => x.id === id); scrollToTime(n.start); },
  closeDetail() { state.selParty = null; state.selNote = null; state.selSvcs = new Set(); render(); },
  clearSel() { ACTIONS.closeDetail(); },
  unselSvc({ id }) { state.selSvcs.delete(id); render(); },
  selectAll({ id }) {
    const p = partyById(id);
    state.selParty = id;
    state.selSvcs = new Set(partySvcs(p).filter((x) => x.st !== 'done' && x.st !== 'paid').map((x) => x.s.id));
    render();
    toast(`Đã chọn ${state.selSvcs.size} dịch vụ của ${esc(p.name)} — kéo một khối hoặc dùng ← → ↑ ↓ để dời cùng lúc`, 'ok');
  },
  nudge({ m }) { if (state.selSvcs.size) moveSvcs([...state.selSvcs], Number(m), 0); },
  nudgeRow({ r }) { if (state.selSvcs.size) moveSvcs([...state.selSvcs], 0, Number(r)); },
  nudgeParty({ id, m }) {
    const p = partyById(id);
    const ids = partySvcs(p).filter((x) => x.st === 'booked' || x.st === 'arrived').map((x) => x.s.id);
    if (!ids.length) { toast('Không có dịch vụ nào có thể dời (đang làm hoặc đã xong)', 'err'); return; }
    moveSvcs(ids, Number(m), 0);
  },
  undo() {
    const last = undoStack.pop();
    if (!last) return;
    last.forEach((u) => { const x = findSvc(u.id); if (x) { x.s.seat = u.seat; x.s.start = u.start; } });
    state.toast = null;
    render();
    toast('Đã hoàn tác', 'ok');
  },
  toastClose() { state.toast = null; renderToast(); },
  toastInfo({ msg }) { toast(esc(msg), 'warn'); },
  arrive({ id, g }) {
    const p = partyById(id);
    const list = p.guests.filter((x) => (g ? x.id === g : !x.arrived));
    list.forEach((x) => { x.arrived = true; });
    if (p.kind === 'appt') p.kind = 'visit';
    state.selParty = id;
    render();
    const waiting = list.flatMap((x) => x.services).filter((s) => s.status === 'booked');
    const missing = waiting.filter((s) => needOf(s) > assigned(s).length).length;
    toast(`${list.map((x) => esc(x.name)).join(', ')} đã đến${missing ? ` · ${missing} dịch vụ cần chọn KTV trước khi bắt đầu` : ' · bấm “Bắt đầu” khi khách vào phòng'}`, missing ? 'warn' : 'ok');
  },
  startSvc({ id }) {
    const x = findSvc(id);
    if (needOf(x.s) > assigned(x.s).length) { openAssign(id, 'Chọn đủ KTV để bắt đầu dịch vụ.'); return; }
    x.g.arrived = true;
    x.s.status = 'active';
    render();
    toast(`${esc(x.g.name)} bắt đầu ${def(x.s).name} · ${assigned(x.s).map((t) => TH[t].name).join(' + ')}`, 'ok');
  },
  startAll({ id }) {
    const p = partyById(id);
    const ready = partySvcs(p).filter((x) => x.st === 'arrived');
    const ok = ready.filter((x) => needOf(x.s) <= assigned(x.s).length);
    ok.forEach((x) => { x.s.status = 'active'; });
    render();
    const miss = ready.find((x) => needOf(x.s) > assigned(x.s).length);
    if (miss) openAssign(miss.s.id, `${ok.length ? `Đã bắt đầu ${ok.length} dịch vụ. ` : ''}${miss.g.name} cần thêm KTV để bắt đầu.`);
    else toast(`Đã bắt đầu ${ok.length} dịch vụ`, 'ok');
  },
  finishSvc({ id }) {
    const x = findSvc(id);
    x.s.status = 'done';
    render();
    toast(`${esc(x.g.name)} xong ${def(x.s).short}${allDone(x.p) ? ' · nhóm sẵn sàng thanh toán' : ''}`, 'ok');
  },
  confirm({ id }) {
    const p = partyById(id);
    p.confirmed = !p.confirmed;
    render();
    toast(`${esc(p.name)}: ${p.confirmed ? 'đã xác nhận' : 'đã bỏ xác nhận'}`, 'ok');
  },
  call({ id }) { const p = partyById(id); toast(`Đang gọi ${esc(p.phone || 'khách')} (mô phỏng)…`, 'ok'); },
  assign({ id }) { openAssign(id); },
  reassign({ id }) {
    const p = partyById(id);
    const x = partySvcs(p).find((y) => needOf(y.s) > assigned(y.s).length && y.st !== 'paid') || partySvcs(p).find((y) => y.st !== 'paid');
    if (x) openAssign(x.s.id);
  },
  asPick({ id }) {
    const m = state.modal;
    const need = needOf(findSvc(m.svcId).s);
    if (m.pick.includes(id)) m.pick = m.pick.filter((x) => x !== id);
    else if (need === 1) m.pick = [id];
    else if (m.pick.length < need) m.pick.push(id);
    else m.pick = [...m.pick.slice(1), id];
    renderModal();
  },
  asSave() {
    const m = state.modal;
    const info = assignInfo(m);
    const { s, g } = info.x;
    s.therapists = Array.from({ length: info.need }, (_, i) => m.pick[i] ?? null);
    if (info.skip) SKIPS.push({ t: fm(NOW), th: info.skip.id, reason: m.reason, by: state.user.name });
    closeModal();
    render();
    const miss = info.need - m.pick.length;
    toast(`${esc(g.name)}: ${m.pick.map((t) => TH[t].name).join(' + ') || 'chưa có KTV'}${miss > 0 ? ` · còn thiếu ${miss}` : ''}${info.skip ? ` · đã ghi bỏ lượt ${info.skip.name}` : ''}`, miss > 0 ? 'warn' : 'ok');
  },
  checkout({ id }) { openCheckout(id); },
  coAddPay({ m: method }) {
    const m = state.modal;
    const s = payState(m);
    const row = { m: method, amt: Math.max(0, s.rem) };
    if (method === 'gift') {
      const gc = GIFTCARDS.find((g) => g.owner === s.p.guests[0].name && g.state === 'active');
      row.code = gc?.code || '';
      if (gc) row.amt = Math.min(row.amt, gc.remaining);
    }
    if (method === 'partner') row.partner = s.p.extra.partner || PARTNERS[0];
    s.rows.push(row);
    renderModal();
  },
  coRemovePay({ i }) { const s = payState(state.modal); s.rows.splice(Number(i), 1); renderModal(); },
  coFill() {
    const s = payState(state.modal);
    if (!s.rows.length) { s.rows.push({ m: 'cash', amt: s.rem }); } else { s.rows[s.rows.length - 1].amt += s.rem; }
    renderModal();
  },
  coInv({ i }) { state.modal.inv = Number(i); renderModal(); },
  coAddProd() {
    const m = state.modal;
    const p = partyById(m.partyId);
    const pr = PRODUCTS.find((x) => x.id === m.addProd);
    if (!pr) return;
    p.products.push({ name: pr.name, price: pr.price, gi: m.addProdGi ?? 0 });
    m.addProd = '';
    renderModal();
    toast(`Đã thêm ${esc(pr.name)}`, 'ok');
  },
  coRemoveProd({ i }) { const p = partyById(state.modal.partyId); p.products.splice(Number(i), 1); renderModal(); },
  coAdv() { state.modal.adv = !state.modal.adv; renderModal(); },
  coPrint() { toast('Đã gửi lệnh in tới máy in quầy (mô phỏng)', 'ok'); },
  coDraft() {
    const p = partyById(state.modal.partyId);
    p.payment = 'draft';
    p.discountPct = state.modal.discountPct;
    closeModal();
    render();
    toast(`Đã lưu tạm hóa đơn ${esc(p.name)} — vẫn hiển thị trong “Cần xử lý”`, 'warn');
  },
  coComplete() {
    const m = state.modal;
    const s = payState(m);
    s.rows.forEach((r) => {
      LEDGER.push({ party: s.p.id, m: r.m, amt: r.amt, t: fm(NOW), kind: 'service' });
      if (r.m === 'gift') {
        const gc = GIFTCARDS.find((x) => x.code === r.code);
        gc.remaining -= r.amt;
        gc.usage.unshift({ date: '30/10/2026', amt: r.amt, note: `Thanh toán ${s.p.id}` });
      }
    });
    s.p.discountPct = m.discountPct;
    if (m.split) {
      m.paidInv[m.inv] = true;
      const next = s.bill.byGuest.findIndex((b) => !m.paidInv[b.gi]);
      if (next >= 0) { m.inv = next; renderModal(); toast(`Đã thu hóa đơn ${s.tg.key + 1} · còn hóa đơn ${next + 1}`, 'ok'); return; }
    }
    s.p.payment = 'paid';
    closeModal();
    state.selParty = s.p.id;
    render();
    toast(`Đã thanh toán ${esc(s.p.name)} · ${s.rows.map((r) => `${METHODS[r.m].label} ${kv(r.amt)}`).join(' + ')}${s.change ? ` · thối ${vnd(s.change)}` : ''}`, 'ok');
  },
  customer({ id }) { state.menu = null; state.modal = { type: 'customer', id }; renderModal(); },
  custBook({ id }) {
    const c = CUSTOMERS[id];
    const d = blankDraft('new');
    d.name = c.name; d.phone = c.phone; d.email = c.email; d.source = 'Khách quen';
    Object.assign(d.guests[0], { name: c.name, customerId: c.id, prefs: c.prefs.slice(0, 2).join(' · '), prefsFrom: 'profile' });
    if (c.fav) d.guests[0].services[0].therapists = [c.fav];
    openBooking(d);
  },
  history({ id }) {
    const p = partyById(id);
    const g = p.guests.find((x) => x.customerId);
    if (g) ACTIONS.customer({ id: g.customerId });
    else toast(`${esc(p.name)} là khách mới — chưa có lịch sử`, 'warn');
  },
  editBooking({ id }) { openBooking(draftFromParty(partyById(id))); },
  addGuest({ id }) {
    const d = draftFromParty(partyById(id));
    d.guests.push({ id: uid('g'), name: '', customerId: '', prefs: '', services: [newSvc(d.time)] });
    openBooking(d, { focus: `[data-bind="modal.draft.guests.${d.guests.length - 1}.name"]` });
  },
  addService({ id }) {
    const p = partyById(id);
    if (allDone(p)) { openCheckout(id); return; }
    const d = draftFromParty(p);
    const g = d.guests[0];
    const lastS = g.services[g.services.length - 1];
    g.services.push(newSvc(lastS.start + lastS.dur, ''));
    openBooking(d);
  },
  followUp({ id }) { openBooking(draftFromParty(partyById(id), 'follow')); },
  feedback({ id }) { state.modal = { type: 'feedback', id, r: {}, text: '' }; renderModal(); },
  fbStar({ g, n }) { state.modal.r[g] = Number(n); renderModal(); },
  fbSave() { closeModal(); toast('Đã lưu phản hồi của khách', 'ok'); },
  cancelParty({ id }) { state.menu = null; state.modal = { type: 'cancel', id, reason: 'Khách báo hủy', dep: 'Giữ cọc' }; renderModal(); },
  cancelDep({ v }) { state.modal.dep = v; renderModal(); },
  cancelDo() {
    const p = partyById(state.modal.id);
    p.cancelled = true;
    p.cancelReason = state.modal.reason;
    const dep = state.modal.dep;
    closeModal();
    state.selParty = null; state.selSvcs = new Set();
    render();
    toast(`Đã hủy ${esc(p.name)} · ${esc(p.cancelReason)}${p.deposit ? ` · cọc: ${esc(dep.toLowerCase())}` : ''}`, 'warn');
  },
  partyMenu({ id }, el) {
    const p = partyById(id);
    openMenu(el, [
      { label: 'Sửa đặt lịch', icon: 'edit', act: 'editBooking', data: { id } },
      { label: p.confirmed ? 'Bỏ xác nhận' : 'Xác nhận', icon: 'check', act: 'confirm', data: { id }, disabled: p.walkin },
      { label: 'Hẹn tiếp theo', icon: 'calendar', act: 'followUp', data: { id } },
      { label: 'In phiếu dịch vụ', icon: 'printer', act: 'coPrint' },
      '-',
      { label: 'Hủy lịch', icon: 'ban', act: 'cancelParty', data: { id }, danger: true },
    ]);
    const r = el.getBoundingClientRect();
    state.menu.x = r.right - 220;
    renderMenu();
  },
  noteDone({ id }) { const n = NOTES.find((x) => x.id === id); n.done = true; render(); toast(`Đã xong: ${esc(n.title)}`, 'ok'); },
  noteRemove({ id }) { const n = NOTES.find((x) => x.id === id); n.removed = true; state.selNote = null; render(); toast(`Đã gỡ ghi chú “${esc(n.title)}”`, 'warn'); },
  branchMenu(_, el) {
    openMenu(el, BRANCHES.map((b) => ({ label: `${b.name} · ${b.area}`, icon: 'pin', act: 'branchPick', data: { id: b.id }, on: b.id === 'CS3' })), 'Chọn cơ sở');
  },
  branchPick({ id }) { if (id !== 'CS3') toast('Mockup chỉ có dữ liệu Cơ sở 3', 'warn'); },
  userMenu(_, el) {
    openMenu(el, [
      ...ACCOUNTS.map((a) => ({ label: `${a.name} · ${a.role}`, icon: 'user', act: 'switchUser', data: { id: a.id }, on: a.id === state.user.id })),
      '-',
      { label: 'Khóa màn hình', icon: 'lock', act: 'toastInfo', data: { msg: 'Đã khóa — nhập PIN để mở (mô phỏng)' } },
    ], 'Máy dùng chung · đổi người dùng');
    const r = el.getBoundingClientRect();
    state.menu.x = r.right - 240;
    renderMenu();
  },
  switchUser({ id }) {
    const a = ACCOUNTS.find((x) => x.id === id);
    if (a.id === state.user.id) return;
    state.user = a;
    render();
    toast(`Đã chuyển sang ${a.name} (${a.role}) — sau khi nhập PIN (mô phỏng)`, 'ok');
  },
  langMenu(_, el) {
    openMenu(el, [{ label: 'Tiếng Việt', icon: 'globe', act: 'toastInfo', data: { msg: 'Đang dùng Tiếng Việt' }, on: true }, { label: 'English', icon: 'globe', act: 'toastInfo', data: { msg: 'English UI: ngoài phạm vi mockup' } }], 'Ngôn ngữ');
    state.menu.y -= 120;
    renderMenu();
  },
  about() { state.modal = { type: 'about' }; renderModal(); },
  shortcuts() { state.modal = { type: 'shortcuts' }; renderModal(); },
  logReject() { state.modal = { type: 'reject' }; renderModal(); },
  rejSave() {
    const f = state.forms.rej;
    REJECTIONS.unshift({ t: fm(NOW), branch: 'Cơ sở 3', req: f.req, size: f.size, channel: f.channel, reason: f.reason });
    closeModal();
    render();
    toast('Đã ghi nhận vào nhật ký từ chối', 'ok');
  },
  cashType({ v }) { state.forms.cash.type = v; render(); },
  cashAdd() {
    const f = state.forms.cash;
    if (!f.amt) { toast('Nhập số tiền', 'err'); return; }
    CASHBOOK.push({ t: fm(NOW), type: f.type, cat: f.cat, note: f.note, amt: f.amt, by: state.user.name });
    state.forms.cash = { type: f.type, cat: f.cat, amt: 0, note: '' };
    render();
    toast(`Đã ghi ${f.type === 'in' ? 'thu' : 'chi'} ${vnd(f.amt)}`, 'ok');
  },
  gcSel({ id }) { state.gc.sel = id; render(); },
  gcLock({ id }) {
    const g = GIFTCARDS.find((x) => x.code === id);
    g.state = g.state === 'locked' ? 'active' : 'locked';
    g.lockReason = g.state === 'locked' ? `Khóa bởi ${state.user.name} lúc ${fm(NOW)}` : '';
    render();
    toast(`${g.code}: ${g.state === 'locked' ? 'đã khóa' : 'đã mở khóa'}`, 'ok');
  },
  gcSell() {
    const s = state.gc.sell;
    if (!s.owner.trim()) { toast('Nhập tên chủ thẻ', 'err'); return; }
    const code = `GC-${5620 + GIFTCARDS.length}`;
    const bonus = s.promo === 'Tặng thêm 10%' ? s.value * 0.1 : 0;
    GIFTCARDS.unshift({ code, owner: s.owner.trim(), phone: s.phone, value: s.value, bonus, remaining: s.value + bonus, promo: s.promo || '—', issued: '30/10/2026', expiry: '30/10/2027', state: 'active', usage: [] });
    LEDGER.push({ party: code, m: 'card', amt: s.value, t: fm(NOW), kind: 'giftcard', note: `Bán thẻ ${code}` });
    state.gc.sel = code;
    state.gc.sell = { owner: '', phone: '', value: 1000000, promo: '' };
    render();
    toast(`Đã bán ${code} · ${vnd(s.value)}`, 'ok');
  },
  bkAddGuest() {
    const d = state.modal.draft;
    d.guests.push({ id: uid('g'), name: '', customerId: '', prefs: '', arrived: d.mode === 'walkin', services: [newSvc(d.time)] });
    state.modal.focus = `[data-bind="modal.draft.guests.${d.guests.length - 1}.name"]`;
    renderModal();
  },
  bkRemoveGuest({ gi }) { state.modal.draft.guests.splice(Number(gi), 1); renderModal(); },
  bkAddSvc({ gi }) {
    const g = state.modal.draft.guests[gi];
    const last = g.services[g.services.length - 1];
    g.services.push(newSvc(last.start + last.dur, '', 'facial60'));
    renderModal();
  },
  bkRemoveSvc({ gi, si }) { state.modal.draft.guests[gi].services.splice(Number(si), 1); renderModal(); },
  bkExtra() { state.modal.draft.showExtra = !state.modal.draft.showExtra; renderModal(); },
  bkAuto() { const n = autoSeat(state.modal.draft); renderModal(); toast(n ? `Đã xếp ${n} dịch vụ vào giường trống` : 'Mọi dịch vụ đã có giường phù hợp', n ? 'ok' : 'warn'); },
  bkUseCustomer({ gi, id }) {
    const d = state.modal.draft;
    const c = CUSTOMERS[id];
    const g = d.guests[gi];
    Object.assign(g, { name: c.name, customerId: c.id, prefs: c.prefs.slice(0, 2).join(' · '), prefsFrom: 'profile' });
    if (Number(gi) === 0) {
      if (!d.phone) d.phone = c.phone;
      if (!d.email) d.email = c.email;
      if (!d.name) d.name = c.name;
      if (!d.source) d.source = 'Khách quen';
    }
    const s0 = g.services[0];
    if (c.fav && s0 && !s0.therapists[0] && therAvail(TH[c.fav], s0.start, s0.start + s0.dur).k === 'free') s0.therapists[0] = c.fav;
    renderModal();
    toast(`Đã dùng hồ sơ ${esc(c.name)} — sở thích và KTV quen được mang sang`, 'ok');
  },
  bkSave({ confirm }) { saveDraft(confirm === '1'); },
};

/* ---------- boot ---------- */

render();
requestAnimationFrame(() => { const tl = $('#tl'); if (tl) tl.scrollLeft = (T('12:45') - START) * state.zoom; });
