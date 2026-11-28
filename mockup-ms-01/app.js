/* MissySalon — prototype core: state, helpers, shell, timeline, side panel, events. */

const START = T('07:00');
const END = T('23:00');
const NOW = T('14:05');
const ROW_H = 62;
const LAB_W = 196;
const HUES = [172, 228, 345, 32, 200, 268, 88, 12];
const DOW = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const METHODS = {
  cash: { label: 'Tiền mặt', icon: 'cash' },
  card: { label: 'Thẻ', icon: 'card' },
  bank: { label: 'Chuyển khoản', icon: 'bank' },
  alipay: { label: 'Alipay', icon: 'qr' },
  partner: { label: 'Công nợ đối tác', icon: 'handshake' },
  gift: { label: 'Thẻ quà tặng', icon: 'gift' },
};

PARTIES.forEach((p, i) => { p.hue = HUES[i % HUES.length]; });

const TH = Object.fromEntries(THERAPISTS.map((t) => [t.id, t]));
const SEATS = ROOMS.flatMap((room) => room.beds.map((bed, i) => ({
  id: `${room.id}-${i}`, room, bed, i, first: i === 0, last: i === room.beds.length - 1,
})));
const SEAT = Object.fromEntries(SEATS.map((s, idx) => [s.id, { ...s, idx }]));

const state = {
  view: 'calendar',
  dayOffset: 0,
  loading: false,
  zoom: 2,
  showTher: true,
  selParty: null,
  selNote: null,
  selSvcs: new Set(),
  panelTab: 'attention',
  therAt: NOW,
  cap: { size: 3, time: T('15:00'), dur: 90 },
  modal: null,
  menu: null,
  toast: null,
  user: ACCOUNTS[0],
  gc: { q: '', sel: 'GC-5521', sell: { owner: '', phone: '', value: 1000000, promo: '' } },
  forms: {
    cash: { type: 'out', cat: 'Vật tư', amt: 0, note: '' },
    rej: { req: '30/10 · 19:00', size: 2, channel: 'Điện thoại', reason: 'Hết phòng' },
  },
};
const undoStack = [];
let uidN = 5000;
const uid = (p = 'x') => `${p}${++uidN}`;

/* ---------- helpers ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const vnd = (n) => `${Math.round(n).toLocaleString('en-US')} ₫`;
const kv = (n) => `${Math.round(n / 1000).toLocaleString('en-US')}k`;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const dataAttrs = (data = {}) => Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');

function dayDate(offset) {
  const d = new Date(2026, 9, 30);
  d.setDate(d.getDate() + offset);
  return d;
}
function dateLabel(offset) {
  const d = dayDate(offset);
  return `${DOW[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const live = () => (state.dayOffset === 0 ? PARTIES.filter((p) => !p.cancelled) : []);
const liveNotes = () => (state.dayOffset === 0 ? NOTES.filter((n) => !n.removed) : []);
function svcList() {
  const out = [];
  for (const p of live()) for (const g of p.guests) for (const s of g.services) out.push({ p, g, s });
  return out;
}
const partyById = (id) => PARTIES.find((p) => p.id === id);
const findSvc = (id) => svcList().find((x) => x.s.id === id);
const def = (s) => CATALOG[s.svc];
const durOf = (s) => s.dur ?? def(s).dur;
const endOf = (s) => s.start + durOf(s);
const occStart = (s) => s.start - (s.bath === 'before' ? 15 : 0);
const occEnd = (s) => (s.durMax ? s.start + s.durMax : endOf(s)) + (s.bath === 'after' ? 15 : 0);
const needOf = (s) => def(s).staff ?? 1;
const assigned = (s) => s.therapists.filter(Boolean);
const seatLabel = (id) => (SEAT[id] ? `${SEAT[id].room.name} · ${SEAT[id].bed}` : 'Chưa xếp phòng');

function stateOf(p, g, s) {
  if (s.status === 'done') return p.payment === 'paid' ? 'paid' : 'done';
  if (s.status === 'active') return 'active';
  return g.arrived ? 'arrived' : 'booked';
}
const partySvcs = (p) => p.guests.flatMap((g) => g.services.map((s) => ({ p, g, s, st: stateOf(p, g, s) })));
const partyStart = (p) => Math.min(...partySvcs(p).map((x) => x.s.start));
const partyEnd = (p) => Math.max(...partySvcs(p).map((x) => endOf(x.s)));
const allDone = (p) => partySvcs(p).every((x) => x.st === 'done' || x.st === 'paid');

function partyBill(p, pct = p.discountPct || 0) {
  const byGuest = p.guests.map((g, gi) => {
    const lines = g.services.map((s) => ({
      name: `${def(s).name} ${durOf(s)}'`,
      sub: assigned(s).map((id) => TH[id].name).join(' + ') || 'chưa có KTV',
      price: def(s).price,
      disc: Math.round((def(s).price * pct) / 100),
      svc: true,
    }));
    p.products.forEach((pr, pi) => {
      if ((pr.gi ?? 0) === gi) lines.push({ name: pr.name, sub: 'Sản phẩm', price: pr.price, disc: 0, prodIdx: pi });
    });
    const gross = sum(lines.map((l) => l.price));
    const disc = sum(lines.map((l) => l.disc));
    return { g, gi, lines, gross, disc, net: gross - disc };
  });
  const lines = byGuest.flatMap((b) => b.lines);
  const gross = sum(byGuest.map((b) => b.gross));
  const disc = sum(byGuest.map((b) => b.disc));
  const net = gross - disc;
  return {
    byGuest, gross, disc, net,
    svcGross: sum(lines.filter((l) => l.svc).map((l) => l.price)),
    prodGross: sum(lines.filter((l) => !l.svc).map((l) => l.price)),
    deposit: p.deposit, due: Math.max(0, net - p.deposit),
  };
}

/* ---------- occupancy & staffing ---------- */

function seatItems(seatId, excludeParty) {
  const items = [];
  for (const { p, g, s } of svcList()) {
    if (s.seat === seatId && p.id !== excludeParty) items.push({ a: occStart(s), b: occEnd(s), label: `${g.name} ${fm(s.start)}–${fm(endOf(s))}`, id: s.id });
  }
  const seat = SEAT[seatId];
  for (const n of liveNotes()) {
    if (n.seat ? n.seat === seatId : n.room === seat.room.id) items.push({ a: n.start, b: n.end, label: `ghi chú “${n.title}”`, id: n.id, note: true });
  }
  return items.sort((x, y) => x.a - y.a);
}
function seatBusy(seatId, a, b, excludeParty, ignore) {
  return seatItems(seatId, excludeParty).find((it) => it.a < b && it.b > a && !(ignore && ignore.has(it.id))) || null;
}
function seatNow(seatId) {
  const items = seatItems(seatId);
  const cur = items.find((o) => o.a <= NOW && o.b > NOW);
  if (cur) {
    let end = cur.b;
    for (const o of items) if (o.a <= end && o.b > end) end = o.b;
    return `<em class="occ busy">bận → ${fm(end)}</em>`;
  }
  const nx = items.find((o) => o.a > NOW);
  return nx ? `<em class="occ free">trống → ${fm(nx.a)}</em>` : '<em class="occ free">trống cả tối</em>';
}

function onShiftAt(th, t) {
  if (th.off || t < th.shift[0] || t >= th.shift[1]) return false;
  return !(th.away && t >= th.away.from && t < th.away.to);
}

function staffSlots(excludeParty) {
  const L = svcList().filter((x) => x.p.id !== excludeParty);
  const out = [];
  for (let t = START; t < END; t += 15) {
    const on = THERAPISTS.filter((th) => onShiftAt(th, t)).length;
    const busy = new Set();
    let un = 0;
    for (const x of L) {
      if (x.s.start < t + 15 && endOf(x.s) > t) {
        assigned(x.s).forEach((id) => { if (onShiftAt(TH[id], t)) busy.add(id); });
        const st = stateOf(x.p, x.g, x.s);
        if (st !== 'done' && st !== 'paid') un += needOf(x.s) - assigned(x.s).length;
      }
    }
    out.push({ t, on, busy: busy.size, un, free: on - busy.size - un });
  }
  return out;
}
function shortageRanges(slots = staffSlots()) {
  const out = [];
  let cur = null;
  for (const sl of slots) {
    if (sl.free < 0 && sl.t >= NOW - 15) {
      if (!cur) cur = { start: sl.t, end: sl.t + 15, min: sl.free, un: sl.un };
      else { cur.end = sl.t + 15; cur.min = Math.min(cur.min, sl.free); cur.un = Math.max(cur.un, sl.un); }
    } else if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}
function seatSlots() {
  const out = [];
  for (let t = START; t < END; t += 15) out.push({ t, free: SEATS.filter((s) => !seatBusy(s.id, t, t + 15)).length });
  return out;
}

function therAvail(th, a, b, exceptId, ignore) {
  if (th.off) return { k: 'off', why: 'Nghỉ hôm nay' };
  const [s0, s1] = th.shift;
  if (b <= s0 || a >= s1) return { k: 'off', why: `Ngoài ca (${fm(s0)}–${fm(s1)})` };
  if (th.away && a < th.away.to && b > th.away.from) return { k: 'away', why: `Đang hỗ trợ ${th.away.branch} đến ${fm(th.away.to)}` };
  const clashes = svcList().filter(({ s }) => s.id !== exceptId && !(ignore && ignore.has(s.id)) && s.therapists.includes(th.id) && s.start < b && endOf(s) > a)
    .sort((x, y) => x.s.start - y.s.start);
  if (clashes.length) {
    const c = clashes[0];
    const freeAt = Math.max(...clashes.map((x) => endOf(x.s)));
    if (clashes.every((x) => x.s.start <= a) && freeAt - a <= 20) return { k: 'late', why: `Rảnh lúc ${fm(freeAt)} — trễ ${freeAt - a}'` };
    return { k: 'busy', why: `Bận ${fm(c.s.start)}–${fm(endOf(c.s))} · ${c.g.name}` };
  }
  if (a < s0) return { k: 'partial', why: `Vào ca lúc ${fm(s0)}` };
  if (b > s1) return { k: 'partial', why: `Hết ca lúc ${fm(s1)} — thiếu ${b - s1}'` };
  return { k: 'free', why: 'Rảnh suốt dịch vụ' };
}

function therNow(th, at = NOW) {
  if (th.off) return { k: 'off', label: 'Nghỉ hôm nay' };
  if (th.away && at >= th.away.from && at < th.away.to) return { k: 'away', label: `Hỗ trợ ${th.away.branch} · về lúc ${fm(th.away.to)}` };
  if (at < th.shift[0]) return { k: 'off', label: `Vào ca lúc ${fm(th.shift[0])}` };
  if (at >= th.shift[1]) return { k: 'off', label: `Hết ca lúc ${fm(th.shift[1])}` };
  const mine = svcList().filter((x) => x.s.therapists.includes(th.id)).sort((x, y) => x.s.start - y.s.start);
  const cur = mine.find((x) => x.s.start <= at && endOf(x.s) > at && x.s.status !== 'done');
  if (cur) {
    const st = stateOf(cur.p, cur.g, cur.s);
    const rem = endOf(cur.s) - at;
    if (st === 'active' || at > NOW) {
      if (at > NOW) return { k: 'busy', label: `Có lịch: ${cur.g.name} đến ${fm(endOf(cur.s))}`, x: cur };
      return rem <= 15 ? { k: 'finishing', label: `Sắp xong · còn ${rem}' (${cur.g.name})`, x: cur } : { k: 'busy', label: `Đang làm · còn ${rem}' (${cur.g.name})`, x: cur };
    }
    return { k: 'waiting', label: `Chờ ${cur.g.name}${st === 'booked' ? ` · khách trễ ${at - cur.s.start}'` : ' · khách đã đến'}`, x: cur };
  }
  const soon = mine.find((x) => x.s.start > at && x.s.start - at <= 15);
  if (soon) return { k: 'waiting', label: `Chờ ${soon.g.name} lúc ${fm(soon.s.start)}`, x: soon };
  const next = mine.find((x) => x.s.start > at);
  return { k: 'free', label: next ? `Rảnh đến ${fm(next.s.start)}` : `Rảnh đến hết ca ${fm(th.shift[1])}` };
}

/* ---------- attention ---------- */

function attention() {
  if (state.dayOffset !== 0) return [];
  const items = [];
  for (const p of live()) {
    const svcs = partySvcs(p);
    const first = partyStart(p);
    const rooms = [...new Set(svcs.map((x) => SEAT[x.s.seat]?.room.name).filter(Boolean))].join(', ');
    const late = svcs.filter((x) => x.st === 'booked' && x.s.start <= NOW);
    if (late.length) {
      const m = NOW - Math.min(...late.map((x) => x.s.start));
      items.push({
        id: `late-${p.id}`, sev: 'high', icon: 'clock', party: p.id,
        title: `${p.name} trễ ${m} phút`,
        sub: `Hẹn ${fm(first)} · ${rooms} · ${p.guests.length} khách${p.deposit ? ` · đã cọc ${kv(p.deposit)}` : ''}`,
        acts: [{ label: 'Đánh dấu đã đến', act: 'arrive', data: { id: p.id }, primary: true }, { label: 'Gọi khách', act: 'call', data: { id: p.id } }],
      });
    }
    const miss = svcs.filter((x) => ['booked', 'arrived', 'active'].includes(x.st) && needOf(x.s) > assigned(x.s).length && x.s.start - NOW <= 60 && endOf(x.s) > NOW);
    if (miss.length) {
      const x = miss[0];
      const mins = x.s.start - NOW;
      const four = needOf(x.s) > 1;
      items.push({
        id: `miss-${p.id}`, sev: mins <= 15 || four ? 'high' : 'mid', icon: 'userx', party: p.id,
        title: four ? `${x.g.name}: ${def(x.s).name} còn thiếu ${needOf(x.s) - assigned(x.s).length}/${needOf(x.s)} KTV` : `${p.name}: ${miss.length} dịch vụ chưa có KTV`,
        sub: `Bắt đầu ${fm(x.s.start)} (${mins > 0 ? `còn ${mins}'` : 'đã đến giờ'}) · ${SEAT[x.s.seat].room.name}`,
        acts: [{ label: 'Phân công KTV', act: 'assign', data: { id: x.s.id }, primary: true }],
      });
    }
    if (p.payment !== 'paid' && allDone(p)) {
      const bill = partyBill(p);
      items.push({
        id: `pay-${p.id}`, sev: 'mid', icon: 'wallet', party: p.id,
        title: p.payment === 'draft' ? `Hóa đơn chưa lưu: ${p.name}` : `${p.name} chờ thanh toán`,
        sub: p.payment === 'draft' ? `Hóa đơn tạm từ ${fm(partyEnd(p))} · ${vnd(bill.due)}` : `Xong lúc ${fm(partyEnd(p))} · còn phải trả ${vnd(bill.due)}`,
        acts: [{ label: p.payment === 'draft' ? 'Mở hóa đơn' : 'Thanh toán', act: 'checkout', data: { id: p.id }, primary: true }],
      });
    }
    const upcoming = svcs.some((x) => x.st === 'booked' && x.s.start > NOW);
    if (!p.confirmed && upcoming) {
      items.push({
        id: `conf-${p.id}`, sev: first - NOW <= 120 ? 'mid' : 'low', icon: 'help', party: p.id,
        title: `${p.name} chưa xác nhận`,
        sub: `${fm(first)} · ${p.guests.length} khách · ${p.channel || 'chưa rõ kênh'}`,
        acts: [{ label: 'Xác nhận', act: 'confirm', data: { id: p.id } }],
      });
    }
    if (!p.phone && !p.email && upcoming) {
      items.push({
        id: `contact-${p.id}`, sev: 'low', icon: 'phone', party: p.id,
        title: `${p.name}: thiếu thông tin liên hệ`,
        sub: `${fm(first)} · đặt qua ${p.channel}${p.extra.partner ? ` (${p.extra.partner})` : ''}`,
        acts: [{ label: 'Bổ sung', act: 'editBooking', data: { id: p.id } }],
      });
    }
    if (!p.channel) {
      items.push({
        id: `req-${p.id}`, sev: 'low', icon: 'edit', party: p.id,
        title: `${p.name}: thiếu kênh đặt (bắt buộc)`,
        sub: `${fm(first)} · ${p.guests.length} khách · cần cho báo cáo nguồn khách`,
        acts: [{ label: 'Bổ sung', act: 'editBooking', data: { id: p.id } }],
      });
    }
  }
  shortageRanges().forEach((r) => items.push({
    id: `short-${r.start}`, sev: r.start - NOW <= 60 ? 'high' : 'mid', icon: 'users',
    title: `Thiếu ${-r.min} KTV lúc ${fm(r.start)}–${fm(r.end)}`,
    sub: `${r.un} dịch vụ chưa có KTV trong khung này · gợi ý: mượn KTV hoặc dời nhóm`,
    acts: [{ label: 'Xem trên lịch', act: 'goTime', data: { t: r.start } }, { label: 'KTV lúc đó', act: 'staffAt', data: { t: r.start } }],
  }));
  liveNotes().filter((n) => n.end > NOW && !n.done).forEach((n) => items.push({
    id: `note-${n.id}`, sev: 'info', icon: 'wrench', note: n.id,
    title: n.title, sub: `${fm(n.start)}–${fm(n.end)} · ${n.seat ? seatLabel(n.seat) : ROOMS.find((r) => r.id === n.room).name} · ${n.by}`,
    acts: [{ label: 'Đánh dấu xong', act: 'noteDone', data: { id: n.id } }],
  }));
  const order = { high: 0, mid: 1, low: 2, info: 3 };
  return items.sort((a, b) => order[a.sev] - order[b.sev]);
}

/* ---------- icons ---------- */

const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  chevU: '<path d="m18 15-6-6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  userx: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 8l5 5M22 8l-5 5"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  bank: '<path d="M3 21h18M5 21V11M19 21V11M9 21V11M15 21V11M12 3 2 8h20z"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v7h-4M14 21v-3"/>',
  handshake: '<path d="m11 17 2 2a1 1 0 0 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 0 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1 1 0 0 1-3-3l2.8-2.8a5 5 0 0 1 6 .8L22 9M2 9l2.6-2.6a5 5 0 0 1 4.6-1.3M5 12l4 4"/>',
  gift: '<rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M21 9h-6a3 3 0 0 0 0 6h6z"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  crown: '<path d="m3 7 4.5 4L12 5l4.5 6L21 7l-2 12H5z"/>',
  car: '<path d="M3 13l2-6h14l2 6v5H3z"/><circle cx="7.5" cy="18" r="1.8"/><circle cx="16.5" cy="18" r="1.8"/><path d="M3 13h18"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  bed: '<path d="M2 19V6M2 13h20v6M22 13v-1a3 3 0 0 0-3-3h-8v4"/><circle cx="6.5" cy="10" r="1.6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  bars: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  swap: '<path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  move: '<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  drop: '<path d="M12 2.7s-6 6.6-6 11.3a6 6 0 0 0 12 0c0-4.7-6-11.3-6-11.3z"/>',
  bag: '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V4h6v3M9 20v1.5M15 20v1.5"/>',
  arrowR: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  door: '<path d="M3 21h18M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M14 12h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  split: '<path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.2-2.8L3 3M15 9l6-6"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M8 16h8"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- shell ---------- */

function renderTop() {
  return `
  <div class="brand"><span class="logo">${ic('leaf')}</span><div><b>MissySalon</b><small>Điều phối trong ngày</small></div></div>
  <button class="branch" data-act="branchMenu" title="Đổi cơ sở">
    <span class="branch-ic">${ic('pin')}</span>
    <span class="branch-t"><b>Cơ sở 3</b><small>Bùi Viện · 8 phòng · ${SEATS.length} giường/ghế</small></span>${ic('chevD')}
  </button>
  <div class="daynav">
    <button class="icon-btn" data-act="day" data-d="-1" title="Ngày trước  [">${ic('chevL')}</button>
    <button class="btn sm ${state.dayOffset === 0 ? 'on' : ''}" data-act="today" title="Về hôm nay  T">Hôm nay</button>
    <button class="icon-btn" data-act="day" data-d="1" title="Ngày sau  ]">${ic('chevR')}</button>
    <div class="date"><b>${dateLabel(state.dayOffset)}</b><small>${state.dayOffset === 0 ? `Bây giờ ${fm(NOW)} · ca chiều` : `${state.dayOffset > 0 ? '+' : ''}${state.dayOffset} ngày so với hôm nay`}</small></div>
  </div>
  <button class="searchbox" data-act="search">${ic('search')}<span>Tìm khách, SĐT, mã đặt lịch…</span><kbd>/</kbd></button>
  <div class="top-actions">
    <button class="btn" data-act="walkin" title="Khách vãng lai  W">${ic('login')}Khách vãng lai</button>
    <button class="btn primary" data-act="newBooking" title="Đặt lịch mới  N">${ic('plus')}Đặt lịch</button>
  </div>
  <button class="user" data-act="userMenu" title="Đổi người dùng trên máy dùng chung"><span class="av">${state.user.name[0]}</span><span class="user-t"><b>${state.user.name}</b><small>${state.user.role}</small></span>${ic('chevD')}</button>`;
}

const NAV = [
  ['calendar', 'calendar', 'Lịch trong ngày'],
  ['overview', 'chart', 'Tổng quan ngày'],
  ['customers', 'users', 'Khách hàng'],
  ['giftcards', 'gift', 'Thẻ quà tặng'],
  ['shifts', 'clock', 'Ca & lượt KTV'],
  ['money', 'wallet', 'Thu chi'],
  ['reports', 'bars', 'Báo cáo'],
];
function renderRail() {
  const n = attention().filter((a) => a.sev === 'high' || a.sev === 'mid').length;
  const cur = state.view === 'money' ? 'overview' : state.view;
  return `<nav class="rail-nav">${NAV.map(([id, icon, label]) => `
    <button class="rail-btn ${cur === id ? 'on' : ''}" data-act="nav" data-v="${id}" title="${label}">
      ${ic(icon)}<span>${label}</span>${id === 'calendar' && n ? `<i class="rail-badge">${n}</i>` : ''}
    </button>`).join('')}</nav>
  <div class="rail-foot">
    <button class="rail-btn" data-act="nav" data-v="settings" title="Cài đặt">${ic('settings')}<span>Cài đặt</span></button>
    <button class="rail-btn" data-act="langMenu" title="Ngôn ngữ">${ic('globe')}<span>Tiếng Việt</span></button>
    <button class="rail-btn" data-act="about" title="Về mockup  ?">${ic('info')}<span>Về mockup</span></button>
  </div>`;
}

function renderView() {
  if (state.view === 'overview' || state.view === 'money') return renderOverview();
  if (state.view === 'giftcards') return renderGiftcards();
  if (state.view === 'shifts') return renderShifts();
  return renderCalendarView();
}

function render() {
  const tl = $('#tl');
  const sc = tl ? [tl.scrollLeft, tl.scrollTop] : null;
  const pb = $('.panel-body');
  const pbs = pb ? pb.scrollTop : 0;
  const vb = $('.page');
  const vbs = vb ? vb.scrollTop : 0;
  $('#top').innerHTML = renderTop();
  $('#rail').innerHTML = renderRail();
  $('#view').innerHTML = renderView();
  const tl2 = $('#tl');
  if (tl2 && sc) [tl2.scrollLeft, tl2.scrollTop] = sc;
  const pb2 = $('.panel-body');
  if (pb2) pb2.scrollTop = pbs;
  const vb2 = $('.page');
  if (vb2) vb2.scrollTop = vbs;
  renderModal();
  renderMenu();
  renderToast();
}

/* ---------- calendar view ---------- */

function renderCalendarView() {
  const empty = state.dayOffset !== 0 && !state.loading;
  return `<section class="cal">
    ${renderPulse()}
    ${renderTools()}
    <div class="tl-wrap">
      ${state.loading ? renderSkeleton() : renderTimeline()}
      ${empty ? `<div class="empty-over"><div class="empty-card">
        ${ic('calendar', 'big')}
        <b>Chưa có cuộc hẹn nào cho ${dateLabel(state.dayOffset)}</b>
        <small>Dữ liệu mẫu chỉ có cho hôm nay. Nhấp đúp vào một ô trống hoặc tạo đặt lịch mới.</small>
        <div class="row-btns"><button class="btn primary" data-act="newBooking">${ic('plus')}Đặt lịch</button><button class="btn" data-act="today">Về hôm nay</button></div>
      </div></div>` : ''}
    </div>
  </section>
  <aside class="panel">${renderPanel()}</aside>`;
}

function renderSkeleton() {
  return `<div class="skel" aria-busy="true" aria-label="Đang tải lịch">
    <div class="skel-head"></div>
    ${Array.from({ length: 12 }, (_, i) => `<div class="skel-row"><i></i><b style="margin-left:${80 + ((i * 137) % 600)}px;width:${120 + ((i * 53) % 160)}px"></b></div>`).join('')}
    <div class="skel-label">Đang tải lịch ${dateLabel(state.dayOffset)}…</div>
  </div>`;
}

function renderPulse() {
  if (state.dayOffset !== 0) return `<div class="pulse"><span class="muted">${ic('info')} Đang xem ${dateLabel(state.dayOffset)} — chỉ số trực tiếp chỉ hiển thị cho hôm nay.</span></div>`;
  const L = svcList().map((x) => ({ ...x, st: stateOf(x.p, x.g, x.s) }));
  const activeN = L.filter((x) => x.st === 'active').length;
  const waiting = L.filter((x) => x.st === 'arrived').length;
  const soonG = new Set(L.filter((x) => x.st === 'booked' && x.s.start >= NOW && x.s.start <= NOW + 60).map((x) => x.g.id)).size;
  const late = new Set(L.filter((x) => x.st === 'booked' && x.s.start < NOW).map((x) => x.p.id)).size;
  const unpaid = live().filter((p) => p.payment !== 'paid' && allDone(p)).length;
  const seatsFree = SEATS.filter((s) => !seatBusy(s.id, NOW, NOW + 1)).length;
  const therFree = THERAPISTS.filter((t) => therNow(t).k === 'free').length;
  const items = [
    ['play', 'Đang làm', `${activeN} dịch vụ`, '', 'staff'],
    ['login', 'Đã đến, chờ', `${waiting}`, waiting ? 'warn' : '', 'upcoming'],
    ['clock', 'Sắp đến trong 60\'', `${soonG} khách`, '', 'upcoming'],
    ['alert', 'Trễ hẹn', `${late} nhóm`, late ? 'bad' : '', 'attention'],
    ['wallet', 'Chờ thanh toán', `${unpaid} nhóm`, unpaid ? 'warn' : '', 'attention'],
    ['bed', 'Giường trống ngay', `${seatsFree}/${SEATS.length}`, '', 'capacity'],
    ['users', 'KTV rảnh ngay', `${therFree}`, therFree < 3 ? 'warn' : '', 'staff'],
  ];
  return `<div class="pulse">${items.map(([i, l, v, c, tab]) => `<button class="pz ${c}" data-act="panelTab" data-tab="${tab}">${ic(i)}<span>${l}</span><b>${v}</b></button>`).join('')}</div>`;
}

function renderTools() {
  const zooms = [[1.5, 'Gọn'], [2, 'Vừa'], [3, 'Rộng']];
  return `<div class="tl-tools">
    <div class="seg" role="group" aria-label="Thu phóng thời gian">${zooms.map(([z, l]) => `<button class="${state.zoom === z ? 'on' : ''}" data-act="zoom" data-z="${z}">${l}</button>`).join('')}</div>
    <button class="btn sm ${state.showTher ? 'on' : ''}" data-act="toggleTher">${ic('users')}Lịch KTV</button>
    <button class="btn sm ghost" data-act="goNow">${ic('clock')}Về ${fm(NOW)}</button>
    <div class="legend">
      <span class="lg lg-booked">Cuộc hẹn</span><span class="lg lg-arrived">Đã đến / đang làm</span><span class="lg lg-done">Chờ thanh toán</span><span class="lg lg-paid">Đã xong</span><span class="lg lg-note">Ghi chú vận hành</span>
    </div>
    <button class="btn sm ghost hint-btn" data-act="shortcuts" title="Phím tắt">${ic('keyboard')}</button>
  </div>`;
}

function renderTimeline() {
  const px = state.zoom;
  const W = (END - START) * px;
  const x = (m) => (m - START) * px;
  const L = svcList();
  const bySeat = {};
  L.forEach((it) => { (bySeat[it.s.seat] ||= []).push(it); });
  const slots = staffSlots();
  const shorts = state.dayOffset === 0 ? shortageRanges(slots) : [];
  const hours = [];
  for (let h = START; h < END; h += 60) hours.push(`<div class="tl-hour" style="left:${x(h)}px;width:${60 * px}px">${fm(h)}</div>`);
  const shortBands = shorts.map((r) => `<button class="tl-short" style="left:${x(r.start)}px;width:${(r.end - r.start) * px}px" data-act="staffAt" data-t="${r.start}" title="Mở danh sách KTV lúc ${fm(r.start)}">${ic('alert')}Thiếu ${-r.min} KTV</button>`).join('');
  const isToday = state.dayOffset === 0;

  const rows = SEATS.map((seat) => {
    const blocks = (bySeat[seat.id] || []).map((it) => blockHtml(it, px)).join('');
    const notes = liveNotes().filter((n) => (n.seat ? n.seat === seat.id : seat.first && n.room === seat.room.id))
      .map((n) => noteHtml(n, px, n.seat ? 1 : seat.room.beds.length)).join('');
    const room = seat.room;
    const roomFree = room.beds.filter((_, i) => !seatBusy(`${room.id}-${i}`, NOW, NOW + 1)).length;
    let roomCell = '';
    if (seat.first) roomCell = `<b>${room.name}</b><small>${room.kind}</small>`;
    else if (seat.i === 1) roomCell = `<small>${room.beds.length} chỗ${isToday ? ` · <span class="${roomFree ? 'ok' : ''}">${roomFree} trống</span>` : ''}</small>`;
    return `<div class="tl-row ${seat.last ? 'room-end' : ''}">
      <div class="tl-lab">
        <div class="lab-room ${seat.last ? 'end' : ''}">${roomCell}</div>
        <div class="lab-bed">${esc(seat.bed)}${isToday ? seatNow(seat.id) : ''}</div>
      </div>
      <div class="tl-lane" data-seat="${seat.id}" style="width:${W}px">${isToday ? `<i class="past" style="width:${x(NOW)}px"></i>` : ''}${blocks}${notes}</div>
    </div>`;
  }).join('');

  const seatCells = isToday ? seatSlots().map((c) => {
    const cls = c.t + 15 <= NOW ? 'past' : c.free === 0 ? 'short' : c.free <= 2 ? 'low' : 'ok';
    return `<i class="sc ${cls}" style="left:${x(c.t)}px;width:${15 * px}px" title="${fm(c.t)}: ${c.free} giường/ghế trống">${c.free}</i>`;
  }).join('') : '';
  const staffCells = isToday ? slots.map((c) => {
    const cls = c.t + 15 <= NOW ? 'past' : c.free < 0 ? 'short' : c.free <= 1 ? 'low' : 'ok';
    return `<i class="sc ${cls}" style="left:${x(c.t)}px;width:${15 * px}px" title="${fm(c.t)}–${fm(c.t + 15)}: ${c.on} KTV trong ca · ${c.busy} đang có khách · ${c.un} dịch vụ chưa phân KTV">${c.free < 0 ? `−${-c.free}` : c.free}</i>`;
  }).join('') : '';

  const therRows = state.showTher ? THERAPISTS.map((th) => therRowHtml(th, L, px, W)).join('') : '';
  const onShift = THERAPISTS.filter((t) => onShiftAt(t, NOW)).length;

  return `<div class="tl-scroll" id="tl">
    <div class="tl-grid" style="width:${LAB_W + W}px;--px:${px}px">
      <div class="tl-head">
        <div class="tl-corner"><b>Phòng · giường</b><small>Thời gian →</small></div>
        <div class="tl-hours" style="width:${W}px">${hours.join('')}${shortBands}${isToday ? `<span class="now-lab" style="left:${x(NOW)}px">${fm(NOW)}</span>` : ''}</div>
      </div>
      ${rows}
      <div class="tl-sum">
        <div class="tl-row sum"><div class="tl-lab"><div class="sum-lab">${ic('bed')}<b>Giường/ghế trống</b><small>/ ${SEATS.length}</small></div></div><div class="tl-lane" style="width:${W}px">${seatCells}</div></div>
        <div class="tl-row sum"><div class="tl-lab"><div class="sum-lab">${ic('users')}<b>KTV còn rảnh</b><small>sau lịch đã nhận</small></div></div><div class="tl-lane" style="width:${W}px">${staffCells}</div></div>
      </div>
      <div class="tl-row sec">
        <div class="tl-lab"><button class="sec-btn" data-act="toggleTher">${ic(state.showTher ? 'chevD' : 'chevR')}<b>Kỹ thuật viên</b><small>${isToday ? `${onShift} trong ca` : ''}</small></button></div>
        <div class="tl-lane" style="width:${W}px"></div>
      </div>
      ${therRows}
      ${isToday ? `<div class="nowline" style="left:${LAB_W + x(NOW)}px"></div>` : ''}
    </div>
  </div>`;
}

function statusPill(p, g, s, st) {
  if (st === 'booked') {
    if (s.start < NOW) return `<span class="pill bad">${ic('clock')}<span class="pill-t">Trễ ${NOW - s.start}'</span></span>`;
    return p.confirmed ? `<span class="pill">${ic('check')}<span class="pill-t">Đã hẹn</span></span>` : `<span class="pill warn">${ic('help')}<span class="pill-t">Chưa xác nhận</span></span>`;
  }
  if (st === 'arrived') return `<span class="pill info">${ic('login')}<span class="pill-t">Đã đến</span></span>`;
  if (st === 'active') return `<span class="pill act">${ic('play')}<span class="pill-t">Còn ${Math.max(0, endOf(s) - NOW)}'</span></span>`;
  if (st === 'done') return p.payment === 'draft' ? `<span class="pill warn">${ic('wallet')}<span class="pill-t">HĐ tạm</span></span>` : `<span class="pill warn">${ic('wallet')}<span class="pill-t">Chờ thanh toán</span></span>`;
  return `<span class="pill muted">${ic('check')}<span class="pill-t">Đã thanh toán</span></span>`;
}

function blockHtml({ p, g, s }, px) {
  const st = stateOf(p, g, s);
  const a = occStart(s);
  const b = occEnd(s);
  const miss = needOf(s) - assigned(s).length;
  const showMiss = miss > 0 && (st === 'booked' || st === 'arrived' || st === 'active');
  const late = st === 'booked' && s.start < NOW;
  const cust = CUSTOMERS[g.customerId];
  const flags = [];
  if (cust?.vip) flags.push(`<span class="flag vip" title="Khách VIP">${ic('crown')}</span>`);
  else if (cust) flags.push(`<span class="flag" title="Khách quen · ${cust.visits} lần">${ic('repeat')}</span>`);
  if (s.request?.length) flags.push(`<span class="flag" title="Khách yêu cầu KTV">${ic('star')}</span>`);
  if (p.deposit && st !== 'paid') flags.push(`<span class="flag" title="Đã cọc ${vnd(p.deposit)}">₫</span>`);
  if (p.extra?.pickup) flags.push(`<span class="flag" title="${esc(p.extra.pickup)}">${ic('car')}</span>`);
  if (g.prefs) flags.push(`<span class="flag" title="${esc(g.prefs)}">${ic('note')}</span>`);
  const thers = assigned(s).map((id) => TH[id].name).join(' + ');
  const ther = showMiss
    ? `${thers ? `${thers} + ` : ''}<span class="b-miss">${ic('alert')}thiếu ${miss} KTV</span>`
    : thers || '<span class="b-soft">chưa xếp KTV</span>';
  const bathBefore = s.bath === 'before' ? `<i class="b-bath l" style="width:${15 * px}px" title="Tắm trước 15'">${ic('drop')}</i>` : '';
  const bathAfter = s.bath === 'after' ? `<i class="b-bath r" style="width:${15 * px}px" title="Tắm sau 15'">${ic('drop')}</i>` : '';
  const unc = s.durMax ? `<i class="b-unc" style="width:${(s.durMax - durOf(s)) * px}px;right:${s.bath === 'after' ? 15 * px : 0}px" title="Thời lượng chưa chắc: ${durOf(s)}–${s.durMax}'">?</i>` : '';
  const prog = st === 'active' ? `<i class="b-prog" style="width:${Math.min(100, ((NOW - s.start) / durOf(s)) * 100)}%"></i>` : '';
  const cls = [
    'blk', `st-${st}`,
    state.selSvcs.has(s.id) ? 'sel' : '',
    !state.selSvcs.has(s.id) && state.selParty === p.id ? 'rel' : '',
    late ? 'late' : '',
    showMiss ? 'miss' : '',
  ].join(' ');
  const multi = p.guests.length > 1;
  const tip = `${g.name} — ${p.name} (${p.id})\n${def(s).name} ${fm(s.start)}–${fm(endOf(s))}\n${seatLabel(s.seat)}${g.prefs ? `\nYêu cầu: ${g.prefs}` : ''}`;
  return `<div class="${cls}" style="--h:${p.hue};left:${(a - START) * px}px;width:${(b - a) * px - 3}px" data-svc="${s.id}" data-party="${p.id}" title="${esc(tip)}" tabindex="0">
    ${bathBefore}${unc}${bathAfter}
    <div class="b-in" style="padding-left:${s.bath === 'before' ? 15 * px + 6 : 9}px">
      <div class="b-l1"><span class="b-time">${fm(s.start)}–${fm(endOf(s))}</span>${statusPill(p, g, s, st)}</div>
      <div class="b-l2"><span class="b-name">${esc(g.name)}</span>${multi ? `<span class="b-grp" title="${esc(p.name)} · ${p.guests.length} khách">${ic('users')}${p.guests.length}</span>` : ''}${flags.join('')}</div>
      <div class="b-l3">${def(s).short} ${durOf(s)}'${s.durMax ? `–${s.durMax}'` : ''} · ${ther}</div>
    </div>
    ${prog}
  </div>`;
}

function noteHtml(n, px, rows) {
  return `<div class="note-blk ${state.selNote === n.id ? 'sel' : ''} ${n.done ? 'done' : ''}" style="left:${(n.start - START) * px}px;width:${(n.end - n.start) * px - 3}px;height:${rows * ROW_H - 7}px" data-act="selectNote" data-id="${n.id}" title="${esc(n.body)}">
    <b>${ic('wrench')}${esc(n.title)}</b><small>${fm(n.start)}–${fm(n.end)} · ghi chú</small>
  </div>`;
}

function therRowHtml(th, L, px, W) {
  const isToday = state.dayOffset === 0;
  const st = isToday ? therNow(th) : { k: 'off', label: '' };
  const mine = isToday ? L.filter((x) => x.s.therapists.includes(th.id)) : [];
  const [s0, s1] = th.shift;
  const bars = mine.map((x) => {
    const xs = stateOf(x.p, x.g, x.s);
    return `<button class="th-bar st-${xs}" style="--h:${x.p.hue};left:${(x.s.start - START) * px}px;width:${durOf(x.s) * px - 2}px" data-act="selectParty" data-id="${x.p.id}" data-svc="${x.s.id}" title="${esc(`${x.g.name} · ${def(x.s).name} ${fm(x.s.start)}–${fm(endOf(x.s))}`)}">${esc(x.g.name)}</button>`;
  }).join('');
  const away = th.away ? `<i class="th-away" style="left:${(th.away.from - START) * px}px;width:${(th.away.to - th.away.from) * px}px">${th.away.branch}</i>` : '';
  return `<div class="tl-row th">
    <div class="tl-lab"><div class="th-lab"><span class="tav k-${st.k}">${th.code}</span><b>${th.name}</b>${th.from ? `<em class="tag">từ ${th.from}</em>` : ''}<small class="k-${st.k}" title="${esc(st.label)}">${esc(shortTher(st))}</small></div></div>
    <div class="tl-lane" style="width:${W}px">${th.off ? `<i class="th-off">Nghỉ hôm nay</i>` : `<i class="th-shift" style="left:${(s0 - START) * px}px;width:${(s1 - s0) * px}px"></i>`}${away}${bars}</div>
  </div>`;
}
function shortTher(st) {
  return { free: 'Rảnh', finishing: 'Sắp xong', busy: 'Đang làm', waiting: 'Chờ khách', away: 'Cơ sở khác', off: 'Ngoài ca' }[st.k];
}

/* ---------- side panel ---------- */

function renderPanel() {
  if (state.dayOffset !== 0) {
    return `<div class="panel-head"><h2>Cần xử lý</h2></div><div class="panel-body"><div class="empty">${ic('check', 'big')}<b>Không có việc cần xử lý</b><small>Ngày này chưa có cuộc hẹn.</small></div></div>`;
  }
  if (state.selNote) return renderNoteDetail(NOTES.find((n) => n.id === state.selNote));
  const parties = new Set([...state.selSvcs].map((id) => findSvc(id)?.p.id).filter(Boolean));
  if (parties.size > 1) return renderMultiSel(parties);
  if (state.selParty) return renderDetail(partyById(state.selParty));
  const att = attention();
  const tabs = [
    ['attention', 'Cần xử lý', att.filter((a) => a.sev !== 'info').length],
    ['upcoming', 'Sắp đến', ''],
    ['staff', 'KTV', ''],
    ['capacity', 'Còn chỗ?', ''],
  ];
  const body = {
    attention: () => renderAttention(att),
    upcoming: renderUpcoming,
    staff: renderStaffTab,
    capacity: renderCapacity,
  }[state.panelTab]();
  return `<div class="panel-head tabs">${tabs.map(([id, l, n]) => `<button class="tab ${state.panelTab === id ? 'on' : ''}" data-act="panelTab" data-tab="${id}">${l}${n ? `<i>${n}</i>` : ''}</button>`).join('')}</div>
  <div class="panel-body">${body}</div>`;
}

function actBtns(acts, size = 'xs') {
  return acts.map((a) => `<button class="btn ${size} ${a.primary ? 'primary' : ''}" data-act="${a.act}" ${dataAttrs(a.data)}>${a.label}</button>`).join('');
}

function renderAttention(att) {
  if (!att.length) return `<div class="empty">${ic('check', 'big')}<b>Mọi thứ đã ổn</b><small>Không có cuộc hẹn trễ, hóa đơn treo hay thiếu KTV.</small></div>`;
  const groups = [['high', 'Ngay bây giờ'], ['mid', 'Trong 1–2 giờ tới'], ['low', 'Trước khi đóng ngày'], ['info', 'Ghi chú vận hành']];
  return groups.map(([sev, label]) => {
    const list = att.filter((a) => a.sev === sev);
    if (!list.length) return '';
    return `<div class="att-group"><h4>${label}<span>${list.length}</span></h4>${list.map((a) => `
      <div class="att sev-${a.sev}">
        <button class="att-main" data-act="${a.note ? 'selectNote' : a.party ? 'goParty' : 'goTime'}" ${dataAttrs(a.note ? { id: a.note } : a.party ? { id: a.party } : { t: a.id.split('-')[1] })}>
          <span class="att-ic">${ic(a.icon)}</span>
          <span class="att-t"><b>${esc(a.title)}</b><small>${esc(a.sub)}</small></span>
          ${ic('chevR', 'att-go')}
        </button>
        <div class="att-acts">${actBtns(a.acts)}</div>
      </div>`).join('')}</div>`;
  }).join('');
}

function renderUpcoming() {
  const ps = live().filter((p) => partySvcs(p).some((x) => x.st === 'booked' && endOf(x.s) > NOW))
    .sort((a, b) => partyStart(a) - partyStart(b));
  const arrived = live().filter((p) => partySvcs(p).some((x) => x.st === 'arrived' || x.st === 'active'));
  return `<div class="up-sum"><span>${ic('login')}<b>${arrived.length}</b> nhóm đang ở spa</span><span>${ic('clock')}<b>${ps.length}</b> nhóm sắp đến</span></div>
  ${ps.map((p) => {
    const first = partyStart(p);
    const lateM = NOW - first;
    const svcs = partySvcs(p);
    const rooms = [...new Set(svcs.map((x) => SEAT[x.s.seat].room.name))].join(', ');
    const miss = svcs.some((x) => needOf(x.s) > assigned(x.s).length);
    return `<div class="up">
      <button class="up-main" data-act="goParty" data-id="${p.id}">
        <span class="up-time ${lateM > 0 ? 'bad' : ''}"><b>${fm(first)}</b><small>${lateM > 0 ? `trễ ${lateM}'` : `còn ${-lateM}'`}</small></span>
        <span class="up-t"><b><i class="dot" style="--h:${p.hue}"></i>${esc(p.name)}</b>
          <small>${p.guests.length} khách · ${svcs.length} dịch vụ · ${rooms}</small>
          <span class="chips">${p.confirmed ? `<em class="chip ok">${ic('check')}Đã xác nhận</em>` : `<em class="chip warn">${ic('help')}Chưa xác nhận</em>`}${p.deposit ? `<em class="chip">Cọc ${kv(p.deposit)}</em>` : ''}${miss ? `<em class="chip bad">${ic('userx')}Thiếu KTV</em>` : ''}${p.guests.some((g) => CUSTOMERS[g.customerId]?.vip) ? `<em class="chip vip">${ic('crown')}VIP</em>` : ''}${p.extra.pickup ? `<em class="chip">${ic('car')}Đưa đón</em>` : ''}</span>
        </span>
      </button>
      ${first - NOW <= 30 ? `<button class="btn xs" data-act="arrive" data-id="${p.id}">Đã đến</button>` : ''}
    </div>`;
  }).join('')}`;
}

function renderStaffTab() {
  const at = state.therAt;
  const list = THERAPISTS.map((t) => ({ t, st: therNow(t, at) }));
  const groups = [['free', 'Rảnh'], ['finishing', 'Sắp xong'], ['waiting', 'Chờ khách'], ['busy', at === NOW ? 'Đang làm' : 'Có lịch'], ['away', 'Ở cơ sở khác'], ['off', 'Ngoài ca / nghỉ']];
  const queue = list.filter((x) => x.st.k === 'free').sort((a, b) => a.t.rot - b.t.rot);
  const times = [NOW];
  for (let t = T('14:15'); t <= T('22:00'); t += 15) times.push(t);
  return `<div class="staff-at">
    <label>Xem tình trạng lúc</label>
    <select class="in sm" data-bind="therAt" data-type="num">${times.map((t) => `<option value="${t}" ${t === at ? 'selected' : ''}>${t === NOW ? `Bây giờ (${fm(NOW)})` : fm(t)}</option>`).join('')}</select>
  </div>
  ${queue.length ? `<div class="queue"><small>Lượt kế tiếp</small>${queue.map((x, i) => `<span class="qchip ${i === 0 ? 'first' : ''}"><i>${i + 1}</i>${x.t.name}</span>`).join('')}</div>` : ''}
  ${groups.map(([k, label]) => {
    const g = list.filter((x) => x.st.k === k);
    if (!g.length) return '';
    return `<div class="att-group"><h4>${label}<span>${g.length}</span></h4>${g.map(({ t, st }) => `
      <div class="trow">
        <span class="tav k-${st.k}">${t.code}</span>
        <span class="trow-t"><b>${t.name}${t.from ? ` <em class="tag">mượn từ ${t.from}</em>` : ''}</b><small>${esc(st.label)}</small></span>
        <span class="trow-s">${t.off ? '—' : `${fm(t.shift[0])}–${fm(t.shift[1])}`}</span>
        ${st.x ? `<button class="icon-btn sm" data-act="goParty" data-id="${st.x.p.id}" title="Mở ${esc(st.x.p.name)}">${ic('chevR')}</button>` : '<span></span>'}
      </div>`).join('')}</div>`;
  }).join('')}`;
}

function capacityCheck(size, start, dur) {
  const end = start + dur;
  const freeSeats = SEATS.filter((seat) => !seatBusy(seat.id, start, end));
  const slots = staffSlots().filter((sl) => sl.t < end && sl.t + 15 > start);
  const minFree = slots.length ? Math.min(...slots.map((s) => s.free)) : 0;
  return { freeSeats, minFree, okSeats: freeSeats.length >= size, okStaff: minFree >= size };
}
function renderCapacity() {
  const c = state.cap;
  const r = capacityCheck(c.size, c.time, c.dur);
  let alt = null;
  if (!r.okSeats || !r.okStaff) {
    for (let t = c.time + 15; t + c.dur <= END; t += 15) {
      const r2 = capacityCheck(c.size, t, c.dur);
      if (r2.okSeats && r2.okStaff) { alt = t; break; }
    }
  }
  const times = [];
  for (let t = T('14:15'); t <= T('21:30'); t += 15) times.push(t);
  const byRoom = ROOMS.map((room) => ({ room, n: r.freeSeats.filter((s) => s.room.id === room.id).length })).filter((x) => x.n);
  const ok = r.okSeats && r.okStaff;
  return `<div class="cap">
    <p class="muted">Trả lời nhanh khi khách gọi: nhận được nhóm này không?</p>
    <div class="fgrid three">
      <div class="field"><label>Số khách</label><select class="in" data-bind="cap.size" data-type="num">${[1, 2, 3, 4, 5, 6, 8].map((n) => `<option ${n === c.size ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Giờ đến</label><select class="in" data-bind="cap.time" data-type="num">${times.map((t) => `<option value="${t}" ${t === c.time ? 'selected' : ''}>${fm(t)}</option>`).join('')}</select></div>
      <div class="field"><label>Thời lượng</label><select class="in" data-bind="cap.dur" data-type="num">${[45, 60, 90, 120].map((d) => `<option value="${d}" ${d === c.dur ? 'selected' : ''}>${d}'</option>`).join('')}</select></div>
    </div>
    <div class="verdict ${ok ? 'ok' : r.okSeats ? 'warn' : 'bad'}">
      ${ic(ok ? 'check' : 'alert')}
      <div><b>${ok ? `Nhận được nhóm ${c.size} khách lúc ${fm(c.time)}` : r.okSeats ? `Đủ giường nhưng thiếu KTV lúc ${fm(c.time)}` : `Không đủ giường lúc ${fm(c.time)}`}</b>
      <small>${fm(c.time)}–${fm(c.time + c.dur)}</small></div>
    </div>
    <div class="cap-lines">
      <div class="${r.okSeats ? 'ok' : 'bad'}">${ic('bed')}<span>Giường/ghế trống suốt khung giờ</span><b>${r.freeSeats.length} / cần ${c.size}</b></div>
      <div class="${r.okStaff ? 'ok' : 'bad'}">${ic('users')}<span>KTV rảnh tối thiểu (đã trừ lịch chưa phân)</span><b>${r.minFree} / cần ${c.size}</b></div>
    </div>
    ${byRoom.length ? `<div class="cap-rooms">${byRoom.map((x) => `<span class="chip">${x.room.name} · ${x.n} trống</span>`).join('')}</div>` : ''}
    <div class="row-btns">
      ${ok ? `<button class="btn primary" data-act="newBooking" data-t="${c.time}" data-size="${c.size}">${ic('plus')}Đặt lịch ${fm(c.time)}</button>` : ''}
      ${alt ? `<button class="btn primary" data-act="newBooking" data-t="${alt}" data-size="${c.size}">${ic('sparkle')}Gợi ý ${fm(alt)} — đặt lịch</button>` : ''}
      ${!ok ? `<button class="btn" data-act="logReject">${ic('ban')}Ghi nhận từ chối</button>` : ''}
    </div>
  </div>`;
}

function renderMultiSel(parties) {
  const items = [...state.selSvcs].map(findSvc).filter(Boolean);
  return `<div class="panel-head"><h2>Đã chọn ${items.length} dịch vụ</h2><button class="icon-btn" data-act="clearSel" title="Bỏ chọn (Esc)">${ic('x')}</button></div>
  <div class="panel-body">
    <p class="muted">${parties.size} nhóm khách. Kéo một khối bất kỳ để dời tất cả, hoặc dùng phím ← → (15 phút) và ↑ ↓ (đổi giường).</p>
    <div class="nudge">
      <button class="btn sm" data-act="nudge" data-m="-15">${ic('chevL')}15'</button>
      <button class="btn sm" data-act="nudge" data-m="15">15'${ic('chevR')}</button>
      <button class="btn sm" data-act="nudgeRow" data-r="-1">${ic('chevU')}Giường trên</button>
      <button class="btn sm" data-act="nudgeRow" data-r="1">${ic('chevD')}Giường dưới</button>
    </div>
    ${items.map((x) => `<div class="msel"><i class="dot" style="--h:${x.p.hue}"></i><b>${esc(x.g.name)}</b><small>${fm(x.s.start)}–${fm(endOf(x.s))} · ${seatLabel(x.s.seat)}</small><button class="icon-btn sm" data-act="unselSvc" data-id="${x.s.id}">${ic('x')}</button></div>`).join('')}
  </div>`;
}

function renderNoteDetail(n) {
  return `<div class="panel-head"><button class="back" data-act="closeDetail">${ic('chevL')}Cần xử lý</button><button class="icon-btn" data-act="closeDetail">${ic('x')}</button></div>
  <div class="panel-body">
    <div class="note-card">
      <span class="note-kind">${ic('wrench')}Ghi chú vận hành · không phải lịch khách</span>
      <h2>${esc(n.title)}</h2>
      <p><b>${fm(n.start)}–${fm(n.end)}</b> · ${n.seat ? seatLabel(n.seat) : `${ROOMS.find((r) => r.id === n.room).name} (cả phòng)`}</p>
      <p>${esc(n.body)}</p>
      <small>Tạo bởi ${esc(n.by)}</small>
    </div>
    <p class="muted">Ghi chú chặn giường/phòng trong khung giờ này — kéo-thả lịch khách vào đây sẽ bị từ chối.</p>
    <div class="row-btns">
      ${n.done ? `<span class="chip ok">${ic('check')}Đã xong</span>` : `<button class="btn primary" data-act="noteDone" data-id="${n.id}">${ic('check')}Đánh dấu xong</button>`}
      <button class="btn" data-act="noteRemove" data-id="${n.id}">${ic('x')}Gỡ ghi chú</button>
    </div>
  </div>`;
}

function renderDetail(p) {
  const svcs = partySvcs(p);
  const bill = partyBill(p);
  const arrivedN = p.guests.filter((g) => g.arrived).length;
  const doneAll = allDone(p);
  const activeN = svcs.filter((x) => x.st === 'active').length;
  const first = partyStart(p);
  const last = partyEnd(p);
  const lateM = arrivedN === 0 && first < NOW ? NOW - first : 0;
  const ready = svcs.filter((x) => x.st === 'arrived');

  const conf = p.walkin ? ['neutral', 'login', 'Khách vãng lai', 'Không cần xác nhận']
    : p.confirmed ? ['ok', 'check', 'Đã xác nhận', p.channel || '—'] : ['warn', 'help', 'Chưa xác nhận', p.channel || 'chưa rõ kênh'];
  const prog = doneAll ? ['ok', 'check', 'Xong dịch vụ', `kết thúc ${fm(last)}`]
    : activeN ? ['act', 'play', `Đang làm ${activeN}/${svcs.length}`, `xong dự kiến ${fm(last)}`]
      : arrivedN ? ['info', 'login', `Đã đến ${arrivedN}/${p.guests.length}`, ready.length ? `${ready.length} dịch vụ chờ bắt đầu` : '']
        : lateM ? ['bad', 'clock', 'Chưa đến', `trễ ${lateM} phút`] : ['neutral', 'clock', 'Chưa đến', `còn ${first - NOW} phút`];
  const pay = p.payment === 'paid' ? ['ok', 'check', 'Đã thanh toán', vnd(bill.net)]
    : p.payment === 'draft' ? ['warn', 'wallet', 'Hóa đơn tạm', `còn ${vnd(bill.due)}`]
      : p.deposit ? ['neutral', 'wallet', `Đã cọc ${kv(p.deposit)}`, `còn ${vnd(bill.due)}`] : ['neutral', 'wallet', 'Chưa thanh toán', vnd(bill.net)];
  const track = ([cls, icon, t, s], label) => `<div class="track ${cls}"><small>${label}</small><b>${ic(icon)}${t}</b><em>${esc(s)}</em></div>`;

  let primary;
  if (p.payment === 'paid') primary = { label: 'Xem hóa đơn', act: 'checkout', icon: 'note' };
  else if (doneAll) primary = { label: `Thanh toán · ${vnd(bill.due)}`, act: 'checkout', icon: 'wallet' };
  else if (arrivedN < p.guests.length && !activeN && !ready.length) primary = { label: p.guests.length > 1 ? `Cả nhóm đã đến (${p.guests.length})` : 'Khách đã đến', act: 'arrive', icon: 'login' };
  else if (ready.length) primary = { label: `Bắt đầu ${ready.length} dịch vụ`, act: 'startAll', icon: 'play' };
  else primary = { label: 'Thanh toán trước', act: 'checkout', icon: 'wallet' };

  const secondary = [];
  if (!p.walkin && !doneAll) secondary.push(p.confirmed ? { label: 'Bỏ xác nhận', act: 'confirm', icon: 'x' } : { label: 'Xác nhận', act: 'confirm', icon: 'check', strong: true });

  const guests = p.guests.map((g) => {
    const cust = CUSTOMERS[g.customerId];
    return `<div class="gcard" style="--h:${p.hue}">
      <div class="gcard-h">
        <span class="gav">${initials(g.name)}</span>
        <div class="gcard-t"><b>${esc(g.name)}</b>
          ${cust ? `<button class="chip loyal ${cust.vip ? 'vip' : ''}" data-act="customer" data-id="${cust.id}">${ic(cust.vip ? 'crown' : 'repeat')}${cust.vip ? 'VIP · ' : 'Khách quen · '}${cust.visits} lần · gần nhất ${cust.last}</button>` : '<em class="chip">Khách mới</em>'}
        </div>
        ${g.arrived ? `<span class="chip ok">${ic('check')}Đã đến</span>` : `<button class="btn xs" data-act="arrive" data-id="${p.id}" data-g="${g.id}">Đã đến</button>`}
      </div>
      ${g.prefs ? `<div class="pref">${ic('note')}<span>${esc(g.prefs)}${g.prefsFrom === 'profile' ? '<em>từ hồ sơ khách</em>' : ''}</span></div>` : ''}
      ${g.services.map((s) => svcRow(p, g, s)).join('')}
    </div>`;
  }).join('');

  const info = [
    ['phone', 'Liên hệ', [p.phone, p.email].filter(Boolean).join(' · ') || '<span class="bad">Chưa có — cần bổ sung</span>'],
    ['globe', 'Kênh / nguồn', `${p.channel || '<span class="bad">Thiếu kênh đặt</span>'}${p.source ? ` · ${p.source}` : ''}${p.extra.partner ? ` · đối tác ${p.extra.partner}${p.extra.commission ? ` (${p.extra.commission})` : ''}` : ''}`],
    p.deposit ? ['wallet', 'Đặt cọc', `${vnd(p.deposit)} · ${p.depositMethod}`] : null,
    p.extra.pickup ? ['car', 'Đưa đón', `${esc(p.extra.pickup)}${p.extra.dropoff ? `<br>${esc(p.extra.dropoff)}` : ''}`] : null,
    p.extra.nationality ? ['pin', 'Quốc tịch', esc(p.extra.nationality)] : null,
  ].filter(Boolean);

  return `<div class="panel-head">
    <button class="back" data-act="closeDetail" title="Esc">${ic('chevL')}Cần xử lý</button>
    <span class="pd-code">${p.id}</span>
    <button class="icon-btn" data-act="partyMenu" data-id="${p.id}" title="Thêm thao tác">${ic('more')}</button>
  </div>
  <div class="panel-body detail">
    <div class="pd-title"><i class="dot lg" style="--h:${p.hue}"></i><div><h2>${esc(p.name)}</h2><small>${fm(first)}–${fm(last)} · ${p.guests.length} khách · ${svcs.length} dịch vụ</small></div></div>
    <div class="tracks">${track(conf, 'Lịch hẹn')}${track(prog, 'Tiến trình')}${track(pay, 'Thanh toán')}</div>
    <div class="pd-actions">
      <button class="btn primary lg grow" data-act="${primary.act}" data-id="${p.id}">${ic(primary.icon)}${primary.label}</button>
      ${secondary.map((a) => `<button class="btn lg ${a.strong ? 'strong' : ''}" data-act="${a.act}" data-id="${p.id}">${ic(a.icon)}${a.label}</button>`).join('')}
    </div>
    ${!doneAll ? `<div class="nudge"><small>Dời cả nhóm</small>
      <button class="btn xs" data-act="nudgeParty" data-id="${p.id}" data-m="-15">−15'</button>
      <button class="btn xs" data-act="nudgeParty" data-id="${p.id}" data-m="15">+15'</button>
      <button class="btn xs" data-act="nudgeParty" data-id="${p.id}" data-m="30">+30'</button>
      <button class="btn xs ghost" data-act="selectAll" data-id="${p.id}">${ic('move')}Chọn cả nhóm để kéo</button>
    </div>` : ''}
    <h3 class="sec-h">Khách & dịch vụ</h3>
    ${guests}
    ${p.notes ? `<div class="pnote">${ic('note')}<span><b>Ghi chú nhóm</b>${esc(p.notes)}</span></div>` : ''}
    <dl class="info">${info.map(([i, l, v]) => `<div><dt>${ic(i)}${l}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <div class="mini-bill">
      <div><span>Tạm tính</span><b>${vnd(bill.gross)}</b></div>
      ${bill.disc ? `<div><span>Giảm ${p.discountPct}%${p.promo ? ` · ${esc(p.promo)}` : ''}</span><b>−${vnd(bill.disc)}</b></div>` : ''}
      ${p.deposit ? `<div><span>Đã cọc</span><b>−${vnd(p.deposit)}</b></div>` : ''}
      <div class="tot"><span>${p.payment === 'paid' ? 'Đã thu' : 'Còn phải trả'}</span><b>${vnd(p.payment === 'paid' ? bill.net : bill.due)}</b></div>
    </div>
    <div class="act-grid">
      ${[
        ['edit', 'Sửa đặt lịch', 'editBooking'],
        ['user', 'Thêm khách', 'addGuest'],
        ['plus', 'Thêm DV / SP', 'addService'],
        ['users', 'Đổi KTV', 'reassign'],
        ['history', 'Lịch sử khách', 'history'],
        ['message', 'Phản hồi', 'feedback'],
        ['calendar', 'Hẹn tiếp theo', 'followUp'],
        ['ban', 'Hủy lịch', 'cancelParty'],
      ].map(([i, l, a]) => `<button class="act ${a === 'cancelParty' ? 'danger' : ''}" data-act="${a}" data-id="${p.id}">${ic(i)}<span>${l}</span></button>`).join('')}
    </div>
  </div>`;
}

function svcRow(p, g, s) {
  const st = stateOf(p, g, s);
  const need = needOf(s);
  const got = assigned(s);
  const chips = s.therapists.map((id) => (id
    ? `<button class="tchip" data-act="assign" data-id="${s.id}" title="Đổi KTV"><span class="tav sm">${TH[id].code}</span>${TH[id].name}${s.request?.includes(id) ? `<span title="Khách yêu cầu">${ic('star')}</span>` : ''}</button>`
    : `<button class="tchip miss" data-act="assign" data-id="${s.id}">${ic('alert')}Chọn KTV</button>`)).join('');
  const empty = !s.therapists.length ? `<button class="tchip ${st === 'booked' && s.start - NOW > 60 ? 'soft' : 'miss'}" data-act="assign" data-id="${s.id}">${ic('plus')}Chọn KTV</button>` : '';
  let action = '';
  if (st === 'arrived') action = `<button class="btn xs primary" data-act="startSvc" data-id="${s.id}">${ic('play')}Bắt đầu</button>`;
  else if (st === 'active') action = `<span class="srow-rem">còn ${Math.max(0, endOf(s) - NOW)}'</span><button class="btn xs" data-act="finishSvc" data-id="${s.id}">Xong</button>`;
  else if (st === 'done') action = `<span class="chip warn">${ic('wallet')}Chờ TT</span>`;
  else if (st === 'paid') action = `<span class="chip ok">${ic('check')}Xong</span>`;
  return `<div class="srow st-${st}" data-svc-row="${s.id}">
    <div class="srow-t"><b>${fm(s.start)}</b><small>${fm(endOf(s))}</small></div>
    <div class="srow-m">
      <b>${def(s).name} <em>${durOf(s)}'${s.durMax ? `–${s.durMax}' (chưa chắc)` : ''}</em></b>
      <small>${seatLabel(s.seat)}${s.bath ? ` · ${ic('drop')}tắm ${s.bath === 'before' ? 'trước' : 'sau'}` : ''}${need > 1 ? ` · cần ${need} KTV` : ''}</small>
      <div class="tchips">${chips}${empty}${need > 1 && got.length < need ? `<em class="need bad">${got.length}/${need} KTV</em>` : ''}</div>
    </div>
    <div class="srow-a">${action}</div>
  </div>`;
}

/* ---------- menu & toast ---------- */

function renderMenu() {
  const el = $('#menu');
  if (!state.menu) { el.innerHTML = ''; return; }
  const m = state.menu;
  el.innerHTML = `<div class="menu" style="left:${m.x}px;top:${m.y}px" role="menu">${m.title ? `<div class="menu-title">${esc(m.title)}</div>` : ''}${m.items.map((it) => (it === '-' ? '<hr>' : `
    <button class="${it.danger ? 'danger' : ''} ${it.on ? 'on' : ''}" ${it.disabled ? 'disabled' : ''} data-act="${it.act}" ${dataAttrs(it.data)} role="menuitem">${ic(it.icon || 'chevR')}<span>${it.label}</span>${it.kbd ? `<kbd>${it.kbd}</kbd>` : ''}</button>`)).join('')}</div>`;
  const box = el.firstElementChild.getBoundingClientRect();
  if (box.right > innerWidth - 8) el.firstElementChild.style.left = `${innerWidth - box.width - 8}px`;
  if (box.bottom > innerHeight - 8) el.firstElementChild.style.top = `${Math.max(8, innerHeight - box.height - 8)}px`;
}
function openMenu(anchor, items, title) {
  const r = anchor.getBoundingClientRect();
  state.menu = { x: r.left, y: r.bottom + 6, items, title };
  renderMenu();
}

let toastTimer = null;
function toast(msg, kind = 'ok', opts = {}) {
  state.toast = { msg, kind, ...opts };
  renderToast();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.toast = null; renderToast(); }, opts.undo ? 7000 : 4200);
}
function renderToast() {
  const t = state.toast;
  $('#toast').innerHTML = t ? `<div class="toast ${t.kind}" role="status">${ic(t.kind === 'err' ? 'alert' : t.kind === 'warn' ? 'alert' : 'check')}<span>${t.msg}</span>${t.undo ? `<button data-act="undo">${ic('undo')}Hoàn tác</button>` : ''}<button class="x" data-act="toastClose">${ic('x')}</button></div>` : '';
}

/* ---------- moving blocks ---------- */

function moveSvcs(ids, dMin, dRow) {
  const items = ids.map(findSvc).filter(Boolean);
  if (!items.length) return;
  const locked = items.find((x) => ['done', 'paid'].includes(stateOf(x.p, x.g, x.s)));
  if (locked) { render(); return toast(`${esc(locked.g.name)}: dịch vụ đã xong, không thể dời`, 'err'); }
  const plan = [];
  for (const x of items) {
    const idx = SEAT[x.s.seat].idx + dRow;
    if (idx < 0 || idx >= SEATS.length) { render(); return toast('Không còn giường theo hướng này', 'err'); }
    const start = x.s.start + dMin;
    if (start < START || start + durOf(x.s) > END) { render(); return toast('Ngoài giờ hoạt động 07:00–23:00', 'err'); }
    if (stateOf(x.p, x.g, x.s) === 'active' && dMin !== 0) { render(); return toast(`${esc(x.g.name)} đang làm — chỉ có thể đổi giường, không đổi giờ`, 'err'); }
    plan.push({ x, seat: SEATS[idx].id, start });
  }
  const ignore = new Set(ids);
  for (const pl of plan) {
    const tmp = { ...pl.x.s, start: pl.start };
    const c = seatBusy(pl.seat, occStart(tmp), occEnd(tmp), null, ignore);
    if (c) { render(); return toast(`Không dời được: ${seatLabel(pl.seat)} đã có ${esc(c.label)}`, 'err'); }
    const self = plan.find((o) => o !== pl && o.seat === pl.seat && occStart({ ...o.x.s, start: o.start }) < occEnd(tmp) && occEnd({ ...o.x.s, start: o.start }) > occStart(tmp));
    if (self) { render(); return toast('Hai dịch vụ đang chọn sẽ trùng cùng một giường', 'err'); }
  }
  undoStack.push(plan.map((pl) => ({ id: pl.x.s.id, seat: pl.x.s.seat, start: pl.x.s.start })));
  plan.forEach((pl) => { pl.x.s.seat = pl.seat; pl.x.s.start = pl.start; });
  const warn = plan.flatMap((pl) => assigned(pl.x.s).map((tid) => ({ tid, av: therAvail(TH[tid], pl.start, endOf(pl.x.s), pl.x.s.id, ignore) })))
    .find((w) => w.av.k !== 'free');
  render();
  const what = `${plan.length} dịch vụ`;
  const where = [dMin ? `${dMin > 0 ? '+' : '−'}${Math.abs(dMin)}'` : '', dRow ? `sang ${seatLabel(plan[0].seat)}` : ''].filter(Boolean).join(' ');
  toast(`Đã dời ${what} ${where}${warn ? ` · Lưu ý: ${TH[warn.tid].name} — ${warn.av.why}` : ''}`, warn ? 'warn' : 'ok', { undo: true });
}

/* ---------- events ---------- */

function getPath(root, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), root);
}
function setPath(root, path, val) {
  const keys = path.split('.');
  const last = keys.pop();
  const obj = keys.reduce((o, k) => o[k], root);
  obj[last] = val;
}
function readVal(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.dataset.type === 'money') return parseInt(el.value.replace(/\D/g, ''), 10) || 0;
  if (el.dataset.type === 'num') return el.value === '' ? 0 : Number(el.value);
  return el.value;
}

function selectParty(id, scroll = true) {
  const p = partyById(id);
  if (!p) return;
  state.selParty = id;
  state.selNote = null;
  state.selSvcs = new Set();
  state.view = 'calendar';
  render();
  if (scroll) scrollToParty(p);
}
function scrollToParty(p) {
  const tl = $('#tl');
  if (!tl) return;
  const svcs = partySvcs(p);
  const t = Math.min(...svcs.map((x) => x.s.start));
  const idx = Math.min(...svcs.map((x) => SEAT[x.s.seat].idx));
  tl.scrollTo({ left: Math.max(0, (t - START) * state.zoom - 220), top: Math.max(0, idx * ROW_H - 90), behavior: 'smooth' });
}
function scrollToTime(t) {
  const tl = $('#tl');
  if (tl) tl.scrollTo({ left: Math.max(0, (t - START) * state.zoom - 220), behavior: 'smooth' });
}

/* drag & select on timeline */
let drag = null;
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.blk');
  if (!b || e.button !== 0 || state.modal) return;
  drag = { el: b, id: b.dataset.svc, x0: e.clientX, y0: e.clientY, moved: false, meta: e.shiftKey || e.metaKey || e.ctrlKey };
});
document.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x0;
  const dy = e.clientY - drag.y0;
  if (!drag.moved && Math.hypot(dx, dy) < 5) return;
  if (!drag.moved) {
    drag.moved = true;
    drag.ids = state.selSvcs.has(drag.id) && state.selSvcs.size > 1 ? [...state.selSvcs] : [drag.id];
    drag.els = drag.ids.map((id) => document.querySelector(`.blk[data-svc="${id}"]`)).filter(Boolean);
    drag.els.forEach((el) => el.classList.add('dragging'));
    document.body.classList.add('is-dragging');
  }
  const px = state.zoom;
  const dMin = Math.round(dx / px / 15) * 15;
  const dRow = Math.round(dy / ROW_H);
  drag.dMin = dMin;
  drag.dRow = dRow;
  drag.els.forEach((el) => { el.style.transform = `translate(${dMin * px}px, ${dRow * ROW_H}px)`; });
  const x = findSvc(drag.id);
  const idx = SEAT[x.s.seat].idx + dRow;
  const seat = SEATS[idx];
  const tmp = { ...x.s, start: x.s.start + dMin };
  const clash = seat ? seatBusy(seat.id, occStart(tmp), occEnd(tmp), null, new Set(drag.ids)) : true;
  const tip = $('#drag-tip');
  tip.className = `drag-tip ${clash ? 'bad' : ''}`;
  tip.style.left = `${e.clientX + 14}px`;
  tip.style.top = `${e.clientY + 14}px`;
  tip.innerHTML = `<b>${fm(tmp.start)}–${fm(endOf(tmp))}</b> · ${seat ? seatLabel(seat.id) : '—'}${drag.ids.length > 1 ? ` · ${drag.ids.length} dịch vụ` : ''}${clash ? `<br>${ic('alert')}${seat ? `Trùng ${esc(clash.label)}` : 'Ngoài phạm vi'}` : ''}`;
});
document.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const d = drag;
  drag = null;
  document.body.classList.remove('is-dragging');
  $('#drag-tip').className = 'drag-tip hidden';
  if (d.moved) {
    if (!d.dMin && !d.dRow) { render(); return; }
    moveSvcs(d.ids, d.dMin, d.dRow);
    return;
  }
  const x = findSvc(d.id);
  if (!x) return;
  if (d.meta) {
    if (state.selSvcs.has(d.id)) state.selSvcs.delete(d.id);
    else state.selSvcs.add(d.id);
    state.selParty = x.p.id;
  } else {
    state.selSvcs = new Set([d.id]);
    state.selParty = x.p.id;
  }
  state.selNote = null;
  render();
});

document.addEventListener('mouseover', (e) => {
  const b = e.target.closest('.blk');
  if (!b || drag) return;
  document.querySelectorAll(`.blk[data-party="${b.dataset.party}"]`).forEach((el) => el.classList.add('hl'));
});
document.addEventListener('mouseout', (e) => {
  const b = e.target.closest('.blk');
  if (!b) return;
  document.querySelectorAll('.blk.hl').forEach((el) => el.classList.remove('hl'));
});

document.addEventListener('dblclick', (e) => {
  const lane = e.target.closest('.tl-lane[data-seat]');
  if (!lane || e.target.closest('.blk, .note-blk')) return;
  const r = lane.getBoundingClientRect();
  const t = START + Math.floor((e.clientX - r.left) / state.zoom / 15) * 15;
  openBooking(blankDraft('new', lane.dataset.seat, t));
});

document.addEventListener('contextmenu', (e) => {
  const b = e.target.closest('.blk');
  if (!b) return;
  e.preventDefault();
  const x = findSvc(b.dataset.svc);
  const st = stateOf(x.p, x.g, x.s);
  if (!state.selSvcs.has(x.s.id)) { state.selSvcs = new Set([x.s.id]); state.selParty = x.p.id; state.selNote = null; render(); }
  state.menu = {
    x: e.clientX, y: e.clientY, title: `${x.g.name} · ${def(x.s).short} ${fm(x.s.start)}`,
    items: [
      { label: 'Xem chi tiết nhóm', icon: 'info', act: 'goParty', data: { id: x.p.id } },
      st === 'booked' ? { label: 'Khách đã đến', icon: 'login', act: 'arrive', data: { id: x.p.id, g: x.g.id } } : null,
      st === 'arrived' ? { label: 'Bắt đầu dịch vụ', icon: 'play', act: 'startSvc', data: { id: x.s.id } } : null,
      st === 'active' ? { label: 'Hoàn tất dịch vụ', icon: 'check', act: 'finishSvc', data: { id: x.s.id } } : null,
      st === 'done' ? { label: 'Thanh toán', icon: 'wallet', act: 'checkout', data: { id: x.p.id } } : null,
      { label: 'Phân công / đổi KTV', icon: 'users', act: 'assign', data: { id: x.s.id }, disabled: st === 'paid' },
      '-',
      { label: 'Chọn cả nhóm', icon: 'move', act: 'selectAll', data: { id: x.p.id } },
      { label: 'Dời +15 phút', icon: 'chevR', act: 'nudge', data: { m: 15 }, kbd: '→', disabled: st === 'done' || st === 'paid' || st === 'active' },
      { label: 'Sửa đặt lịch', icon: 'edit', act: 'editBooking', data: { id: x.p.id } },
      '-',
      { label: 'Hủy lịch', icon: 'ban', act: 'cancelParty', data: { id: x.p.id }, danger: true, disabled: st !== 'booked' },
    ].filter(Boolean),
  };
  renderMenu();
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (state.menu && !e.target.closest('.menu')) { state.menu = null; renderMenu(); if (!el) return; }
  if (state.menu && el && el.closest('.menu')) { state.menu = null; renderMenu(); }
  if (!el) {
    if (e.target.closest('.modal-back') && !e.target.closest('.modal')) closeModal();
    const lane = e.target.closest('.tl-lane');
    if (lane && !e.target.closest('.blk, .note-blk') && (state.selSvcs.size || state.selParty || state.selNote)) {
      state.selSvcs = new Set(); state.selParty = null; state.selNote = null; render();
    }
    return;
  }
  if (el.disabled) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.dataset.bind || el.tagName === 'SELECT' || el.type === 'checkbox') return;
  setPath(state, el.dataset.bind, readVal(el));
  afterInput(el);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (!el.dataset.bind) return;
  if (el.tagName !== 'SELECT' && el.type !== 'checkbox') {
    if (el.dataset.type === 'money') el.value = readVal(el).toLocaleString('en-US');
    return;
  }
  const prev = getPath(state, el.dataset.bind);
  setPath(state, el.dataset.bind, readVal(el));
  afterChange(el, prev);
});

document.addEventListener('keydown', (e) => {
  const inField = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  if (e.key === 'Escape') {
    if (state.menu) { state.menu = null; renderMenu(); return; }
    if (state.modal) { closeModal(); return; }
    if (state.selSvcs.size || state.selParty || state.selNote) { state.selSvcs = new Set(); state.selParty = null; state.selNote = null; render(); }
    return;
  }
  if (state.modal?.type === 'search') { searchKeys(e); return; }
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (!inField && !state.modal && e.key === '/')) { e.preventDefault(); ACTIONS.search(); return; }
  if (inField || state.modal || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === 'n' || k === 'N') ACTIONS.newBooking({});
  else if (k === 'w' || k === 'W') ACTIONS.walkin();
  else if (k === 't' || k === 'T') ACTIONS.today();
  else if (k === '[') ACTIONS.day({ d: -1 });
  else if (k === ']') ACTIONS.day({ d: 1 });
  else if (k === '?') ACTIONS.shortcuts();
  else if (state.view === 'calendar' && state.selSvcs.size && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) {
    e.preventDefault();
    const ids = [...state.selSvcs];
    if (k === 'ArrowLeft') moveSvcs(ids, -15, 0);
    if (k === 'ArrowRight') moveSvcs(ids, 15, 0);
    if (k === 'ArrowUp') moveSvcs(ids, 0, -1);
    if (k === 'ArrowDown') moveSvcs(ids, 0, 1);
  } else if (k === 'Enter' && state.selParty) {
    const p = partyById(state.selParty);
    if (allDone(p) && p.payment !== 'paid') ACTIONS.checkout({ id: p.id });
  }
});
