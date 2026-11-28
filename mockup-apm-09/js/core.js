/* State, helpers, pricing, validation, rendering, routing, modals. */
const KEY = 'apm09';
let S = load() || fresh();

/* Transient UI state: never persisted. */
const T = { modal: null, save: 'saved', proc: {}, loading: {}, toasts: [], demo: false, acct: false, scanBusy: {} };
const SCREENS = {}, MODALS = {}, A = {}, L = {};

function fresh() {
  return {
    ui: { internal: false, hide: false, variant: 'normal', admin: false, banner: true, copay: true },
    sim: { saveFail: false, tplGone: false, mergeErr: false, noSocial: false, badAddr: false, list: 'ready', imgErr: false },
    events: seedEvents(), work: {}, lists: seedLists(), addresses: seedAddresses(), cards: seedCards(),
    filters: { q: '', type: '', status: '', sort: 'newest', done: false }, shown: 20,
    viewAs: { office: "Chuck's Office", agent: 'Chucky Norris' }, cur: null, flash: null, co: {}, seenList: false,
  };
}
function load() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } }
function persist() { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage may be unavailable */ } }

/* ---------- Small helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = (n) => Math.round(n * 100) / 100;
const money = (n) => '$' + r2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = (n) => '$' + Math.round(n).toLocaleString('en-US');
/* Price display that respects "hide pricing". Zero shows as Free. */
const pr = (n) => (S.ui.hide ? '' : n === 0 ? 'Free' : money(n));
const showP = () => !S.ui.hide;
const parseD = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtD = (d) => { d = typeof d === 'string' ? parseD(d) : d; return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); };
const fmtDow = (d) => { d = typeof d === 'string' ? parseD(d) : d; return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); };
const fmtT = (t) => { if (!t) return ''; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (m ? ':' + String(m).padStart(2, '0') : '') + ap; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addBiz = (d, n) => { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() % 6) n--; } return x; };
const validUrl = (u) => /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(String(u || '').trim());
const validAddr = (a) => /\d/.test(a || '') && /,/.test(a || '') && String(a).trim().length > 10;
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');
const mid = (m) => 'f-' + m.replace(/[^a-zA-Z0-9]+/g, '-');

/* Model paths: first segment picks the root. S state, T transient, W current work, I current item, C checkout, M modal props, E current event. */
function rootOf(seg) {
  const r = route();
  if (seg === 'S') return S; if (seg === 'T') return T;
  if (seg === 'M') return T.modal ? T.modal.props : {};
  const e = ev(r.id || S.cur); if (!e) return {};
  if (seg === 'E') return e; if (seg === 'W') return work(e); if (seg === 'C') return co(e);
  if (seg === 'I') return work(e).items[(T.modal && T.modal.props.key) || r.key] || {};
  return {};
}
function get(path) { const p = path.split('.'); let o = rootOf(p[0]); for (let i = 1; i < p.length; i++) { if (o == null) return ''; o = o[p[i]]; } return o == null ? '' : o; }
function set(path, v) { const p = path.split('.'); let o = rootOf(p[0]); for (let i = 1; i < p.length - 1; i++) { if (o[p[i]] == null) o[p[i]] = {}; o = o[p[i]]; } o[p[p.length - 1]] = v; }

/* ---------- Form helpers ---------- */
function attrs(o) { return (o.ph ? ` placeholder="${esc(o.ph)}"` : '') + (o.max ? ` maxlength="${o.max}"` : '') + (o.min != null ? ` min="${o.min}"` : '') + (o.maxv != null ? ` max="${o.maxv}"` : '') + (o.req ? ' required aria-required="true"' : '') + (o.dis ? ' disabled' : '') + (o.then ? ` data-then="${o.then}"` : '') + (o.num ? ' data-num inputmode="decimal"' : '') + (o.err ? ` aria-invalid="true" aria-describedby="${o.eid}"` : '') + (o.auto ? ` autocomplete="${o.auto}"` : ''); }
function wrapField(label, inner, o) {
  return `<div class="field ${o.err ? 'error' : ''} ${o.cls || ''}"><label for="${o.id}">${label}${o.req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>${inner}` +
    (o.err ? `<div class="errmsg" id="${o.eid}"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${o.err}</span></div>` : '') + (o.help ? `<div class="helper">${o.help}</div>` : '') + '</div>';
}
function tf(label, model, o = {}) {
  o.id = mid(model); o.eid = o.id + '-e';
  const v = esc(get(model));
  const inner = o.area ? `<textarea class="input" id="${o.id}" data-model="${model}" rows="${o.rows || 3}"${attrs(o)}>${v}</textarea>`
    : `<input class="input ${o.icls || ''}" id="${o.id}" data-model="${model}" type="${o.type || 'text'}" value="${v}"${attrs(o)}>`;
  return wrapField(label, o.suffix ? `<div class="suffix">${inner}<span>${o.suffix}</span></div>` : inner, o);
}
function sel(label, model, opts, o = {}) {
  o.id = mid(model); o.eid = o.id + '-e';
  const cur = String(get(model));
  const inner = `<select class="select" id="${o.id}" data-model="${model}"${attrs(o)}>${opts.map((x) => { const [v, t] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}"${String(v) === cur ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
  return label ? wrapField(label, inner, o) : inner;
}
function chk(model, html, o = {}) { return `<label class="check"><input type="checkbox" data-model="${model}"${get(model) ? ' checked' : ''}${attrs(o)}><span class="box"></span><span>${html}</span></label>`; }
function rad(model, value, html, o = {}) { return `<label class="radio"><input type="radio" name="${mid(model)}" data-model="${model}" value="${esc(value)}"${String(get(model)) === String(value) ? ' checked' : ''}${attrs(o)}><span class="dot"></span><span>${html}</span></label>`; }
function sw(model, label, o = {}) { return `<label class="sw-row"><span>${label}</span><span class="switch"><input type="checkbox" role="switch" data-model="${model}"${get(model) ? ' checked' : ''}${attrs(o)}><span class="track"></span></span></label>`; }
/* A radio rendered as a card. */
function choice(model, value, title, desc, price, o = {}) {
  const on = String(get(model)) === String(value);
  return `<label class="choice ${on ? 'on' : ''} ${o.dis ? 'off' : ''}"><span class="radio"><input type="radio" name="${mid(model)}" data-model="${model}" value="${esc(value)}"${on ? ' checked' : ''}${attrs(o)}><span class="dot"></span></span><span class="grow"><span class="t">${title}</span>${desc ? `<br><span class="xs muted">${desc}</span>` : ''}</span>${price ? `<span class="p small">${price}</span>` : ''}</label>`;
}
function note(type, html, o = {}) {
  const ic = { info: 'fa-circle-info', warning: 'fa-triangle-exclamation', error: 'fa-circle-exclamation', success: 'fa-circle-check' }[type];
  return `<div class="note ${type} ${o.cls || ''}" role="${type === 'error' ? 'alert' : 'status'}"${o.id ? ` id="${o.id}"` : ''}><i class="fa-solid ${ic}" aria-hidden="true"></i><div class="grow">${html}${o.acts ? `<div class="acts">${o.acts}</div>` : ''}</div>${o.close ? `<button class="x" data-act="${o.close}" aria-label="Dismiss">&times;</button>` : ''}</div>`;
}
function btn(label, act, o = {}) { return `<button type="button" class="btn ${o.cls || ''}" data-act="${act}"${o.arg != null ? ` data-arg="${esc(o.arg)}"` : ''}${o.dis ? ' disabled' : ''}${o.aria ? ` aria-label="${esc(o.aria)}"` : ''}>${o.icon ? `<i class="fa-solid ${o.icon}" aria-hidden="true"></i>` : ''}${label}</button>`; }
function ibtn(icon, act, arg, label, cls) { return `<button type="button" class="ibtn ${cls || ''}" data-act="${act}" data-arg="${esc(arg)}" aria-label="${esc(label)}" data-tip="${esc(label)}"><i class="fa-solid ${icon}" aria-hidden="true"></i></button>`; }
function toast(msg) { const t = { msg, id: Date.now() + Math.random() }; T.toasts.push(t); drawToasts(); setTimeout(() => { T.toasts = T.toasts.filter((x) => x !== t); drawToasts(); }, 3200); }
function drawToasts() { let el = $('#toasts'); if (!el) { el = document.createElement('div'); el.id = 'toasts'; el.className = 'toasts'; el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); } el.innerHTML = T.toasts.map((t) => `<div class="toast">${esc(t.msg)}</div>`).join(''); }

/* ---------- Events, work and items ---------- */
function ev(id) { return S.events.find((e) => e.id === id); }
function work(e) { const k = e.id + '_' + e.type; if (!S.work[k]) S.work[k] = newWork(e); return S.work[k]; }
function hasWork(e, type) { return !!S.work[e.id + '_' + (type || e.type)]; }
function avail(e, k) { return HAS_TEMPLATE[e.type].includes(k) && !(k === 'social' && S.sim.noSocial); }
function newWork(e) {
  const sel = {}, items = {};
  let on = DEFAULT_ON;
  /* The sample event from the brief is already in progress: postcards and brochures in the cart. */
  if (e.id === 'e1' && e.type === 'new') on = ['postcard', 'brochure', 'social', 'image'];
  PKEYS.forEach((k) => { sel[k] = HAS_TEMPLATE[e.type].includes(k) && on.includes(k); items[k] = newItem(k, e); });
  return { sel, items, pastOk: false };
}
function newItem(k, e) {
  const raw = e.sqft === 0; /* listing data that the artwork check will flag */
  const it = {
    tpl: { style: 'Modern', name: STYLES.Modern[0] }, edited: false, side: 0, lowRes: k === 'flyer', img: 0,
    fields: {
      headline: TYPES[e.type].headline, address: e.a1, price: raw && k === 'postcard' ? '$' + e.price : whole(e.price),
      details: `${e.beds} bed, ${e.baths} bath, ${e.sqft} SQ.FT.`,
      desc: k === 'brochure' ? e.desc + ' Walk to parks, schools and the Trinity Trails, with quick access to I-35W and Loop 820 for an easy commute.' : e.desc.split('. ')[0] + '.',
      cname: raw && k === 'postcard' ? 'Name' : e.agent, ctitle: raw && k === 'postcard' ? 'Title' : 'REALTOR, ' + e.office,
    },
  };
  if (PRODUCTS[k].print) {
    Object.assign(it, {
      method: PRODUCTS[k].methods[0], listIds: ['new'], newQty: 49, mailClass: 'first', qty: k === 'flyer' ? 100 : 49, paper: 'premium', coating: 'none', pdf: k === 'postcard', fileType: 'JPG',
      sample: { on: k === 'postcard', name: 'Chuck Norris', a1: '123 Roundhouse Kick', city: 'Fort Worth', st: 'TX', zip: '76180', edit: false },
      idv: { on: false, name: 'Chucky Norris, Acme Realty', img: 0, urlMode: 'xl', url: e.url, all: false },
    });
  }
  if (k === 'social') Object.assign(it, { url: e.url, comment: `${TYPES[e.type].headline}! ${e.a1}, ${e.city.split(',')[0]}. ${e.desc}`, incDesc: true, plats: { facebook: true, instagram: true, x: true, linkedin: true }, when: 'now', date: iso(addDays(TODAY, 1)), time: '09:00', result: null, scheduled: null });
  if (k === 'image') Object.assign(it, { fileType: 'JPG', got: {} });
  if (k === 'fbad') Object.assign(it, { title: `${TYPES[e.type].label} - ${e.a1}`, message: e.desc.split('. ')[0] + '.', center: `${e.a1}, ${e.city}`, radius: 15, start: iso(TODAY), days: 7, url: e.url, page: 'xd', own: { state: 'none', account: '', pageName: '', outcome: 'approved' }, preview: 'none' });
  return it;
}
function co(e) {
  if (!S.co[e.id]) S.co[e.id] = { addr: 'a1', service: 'ground', promo: '', promoIn: '', store: 0, storeIn: '', voucher: false, ad: 0, adIn: '', copay: {}, mode: 'card', card: (S.cards.find((c) => c.def) || S.cards[0] || {}).id, split: false, splits: {}, acct: '', acctVals: {}, acctOk: false, terms: false, showErr: false, open: {}, form: null, cardForm: null, termsOpen: false };
  return S.co[e.id];
}
const cartKeys = (e) => PKEYS.filter((k) => work(e).sel[k] && avail(e, k) && !PRODUCTS[k].free);
const freeKeys = (e) => PKEYS.filter((k) => work(e).sel[k] && avail(e, k) && PRODUCTS[k].free);
const selKeys = (e) => PKEYS.filter((k) => work(e).sel[k] && avail(e, k));
function mailQty(it) { let q = 0; it.listIds.forEach((id) => { if (id === 'new') q += +it.newQty || 0; else { const l = S.lists.find((x) => x.id === id); if (l) q += l.qty; } }); return q; }
function listName(e, id) { if (id === 'new') return e.a1 + ' (New)'; const l = S.lists.find((x) => x.id === id); return l ? l.name : ''; }

/* Price of one product. Lines feed the cart breakdown; each has a label, a value and a price (0 = Free). */
function priceItem(e, k) {
  const it = work(e).items[k], P = PRODUCTS[k];
  if (P.free) return { total: 0, qty: 0, lines: [], summary: 'Free' };
  if (k === 'fbad') { const t = r2((+it.days || 0) * FB_PER_DAY); return { total: t, qty: 1, lines: [{ l: 'Ad run', v: `${it.days} days from ${fmtD(it.start)}`, p: t }, { l: 'Audience', v: `${it.radius} mile radius`, p: 0 }, { l: 'Posted by', v: it.page === 'xd' ? 'Xpressdocs business page' : 'Your Facebook page', p: 0 }], summary: `${it.days} days from ${fmtD(it.start)}, ${it.radius} mile radius` }; }
  const m = it.method, R = RATES[k], lines = [{ l: 'Delivery method', v: METHODS[m].label, p: 0 }];
  if (m === 'download') { lines.push({ l: 'File type', v: it.fileType, p: R.download }); return { total: R.download, qty: 0, lines, summary: 'Download, ' + it.fileType }; }
  let qty, noPrice = false, summary;
  if (m === 'mail') {
    const rec = mailQty(it); qty = rec + (it.sample.on ? 1 : 0);
    lines.push({ l: 'Mailing lists', v: it.listIds.map((id) => listName(e, id)).join(', ') + `. Total mailing quantity: ${rec}`, p: r2(rec * R.mail) });
    lines.push({ l: 'Mailing class', v: CLASSES[it.mailClass].label, p: r2(qty * CLASSES[it.mailClass].per) });
    if (it.sample.on) lines.push({ l: 'Sample card', v: '1 to ' + it.sample.name, p: r2(R.mail) });
    lines.push({ l: 'Quantity', v: String(qty), p: null });
    summary = `${CLASSES[it.mailClass].label} Mail, Quantity: ${qty}`;
  } else {
    qty = Math.floor(+it.qty || 0); noPrice = qty < QTY_RANGE[0] || qty > QTY_RANGE[1];
    lines.push({ l: 'Quantity', v: String(qty), p: r2(qty * R[m]) });
    summary = `${m === 'ship' ? 'Shipped' : 'Pickup'}, Quantity: ${qty}`;
  }
  const c = COATINGS.find((x) => x.id === it.coating), p = PAPERS.find((x) => x.id === it.paper);
  lines.push({ l: 'Coating', v: c.label, p: r2(qty * c.per) });
  lines.push({ l: 'Paper type', v: p.label, p: r2(qty * p.per) });
  if (it.pdf) lines.push({ l: 'PDF download', v: 'Included with purchase', p: PDF_ADDON });
  const total = r2(lines.reduce((s, x) => s + (x.p || 0), 0));
  return { total, qty, lines, noPrice, summary };
}
function summaryOf(e, k) {
  const it = work(e).items[k];
  if (k === 'social') return it.result ? 'Posted to ' + plural(it.result.filter((x) => x.ok).length, 'platform') : it.scheduled ? 'Scheduled for ' + fmtD(it.scheduled.date) + ' at ' + fmtT(it.scheduled.time) : 'Not posted yet';
  if (k === 'image') return `${it.fileType}, ${plural(PRODUCTS.image.sides.length, 'file')}`;
  return priceItem(e, k).summary;
}
const eventTotal = (e) => r2(cartKeys(e).reduce((s, k) => s + priceItem(e, k).total, 0));

/* Design warnings shown with the preview. */
function warningsOf(k, it) { const w = []; if (it.lowRes) w.push('The quality of your image(s) is too low.'); if ((it.fields.desc || '').length > 140) w.push('Your text has been cropped in the field field07.'); return w; }
/* Artwork check (beta): looks at the design's fields and returns problems per page. */
function scanIssues(k, it) {
  const f = it.fields, out = [], a = [], P = PRODUCTS[k];
  const m = (f.price || '').match(/\$\d{4,}/); if (m) a.push(`The price is formatted incorrectly without a comma (${m[0]})`);
  if (/\b0 SQ\.?FT/i.test(f.details || '')) a.push(a.length ? 'lists an invalid measurement of 0 SQ.FT.' : 'The design lists an invalid measurement of 0 SQ.FT.');
  if (a.length) out.push({ side: 0, text: a.join(' and ') + (/\.$/.test(a[a.length - 1]) ? '' : '.') });
  if (f.cname === 'Name' || f.ctitle === 'Title') out.push({ side: P.sides.length > 1 ? P.sides.length - 1 : 0, text: "Placeholder contact information ('Name', 'Title') is present in the upper-left corner." });
  return out;
}
const sig = (it) => JSON.stringify(it.fields) + it.tpl.name;
/* scan status: 'pending' (not checked since last change), 'issues', 'ignored', 'clean' */
function scanState(k, it) { const s = sig(it); if (it.scanSig !== s) return 'pending'; if (!scanIssues(k, it).length) return 'clean'; return it.scanOk === s ? 'ignored' : 'issues'; }

/* Reasons a product cannot go to checkout. Each has a message and the id of the control to fix. */
function problems(e, k) {
  const it = work(e).items[k], out = [], P = PRODUCTS[k], add = (msg, id) => out.push({ msg, id });
  if (T.proc[e.id + k]) add('Processing data, please wait', 'preview');
  if (tplGone(it)) add('Template is no longer available, please select a new template', 'preview');
  if (P.print) {
    if (P.methods.includes(it.method) === false) it.method = P.methods[0];
    if (it.method === 'mail') {
      if (S.sim.badAddr && !e.addrFixed && it.listIds.includes('new')) add('The listing address is invalid, so the radius list cannot be created', 'sec-who');
      if (!it.listIds.length) add('Choose at least one mailing list', 'sec-who');
      else if (!mailQty(it)) add('The mailing list has no recipients', 'sec-who');
      if (it.sample.on && !it.sample.name.trim()) add('The sample card needs a name', mid('I.sample.name'));
      if (k === 'postcard' && it.idv.on) {
        if (!it.idv.name.trim()) add('Informed Delivery needs a display name', mid('I.idv.name'));
        if (it.idv.urlMode === 'custom' && !validUrl(it.idv.url)) add('Informed Delivery needs a valid redirect URL', mid('I.idv.url'));
      }
    } else if (it.method !== 'download' && priceItem(e, k).noPrice) add('Sorry, we have no pricing policy for selected quantity', mid('I.qty'));
  }
  if (k === 'fbad') {
    if (!it.title.trim()) add('The ad needs a title', mid('I.title'));
    if (!it.message.trim()) add('The ad needs a message', mid('I.message'));
    if (!validUrl(it.url)) add('The ad needs a valid redirect URL', mid('I.url'));
    if (!validAddr(it.center)) add('The radius centerpoint must be a valid address', mid('I.center'));
    if (!(it.radius >= 15 && it.radius <= 50)) add('Radius distance must be 15 to 50 miles', mid('I.radius'));
    if (!(it.days >= FB_MIN_DAYS && it.days <= 90)) add(`Duration must be ${FB_MIN_DAYS} to 90 days`, mid('I.days'));
    if (!it.start || parseD(it.start) < TODAY || parseD(it.start) > addDays(TODAY, 92)) add('Start date must be between today and three months from now', mid('I.start'));
    if (it.page === 'own' && it.own.state !== 'approved') add('Your Facebook page is not approved to run ads yet', 'sec-page');
  }
  return out;
}
const allProblems = (e) => selKeys(e).map((k) => ({ k, list: problems(e, k) })).filter((x) => x.list.length);
function pastOpenHouse(e) { return e.type === 'open' && e.oh && parseD(e.oh.date) < TODAY; }

/* Autosave simulation. */
let saveTimer;
function touch() {
  const e = ev(route().id); if (e && e.status === 'new') e.status = 'progress';
  T.save = 'saving'; clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { T.save = S.sim.saveFail ? 'error' : 'saved'; refreshLive(); }, 700);
  persist();
}
L.save = () => T.save === 'saving' ? '<span class="xs muted"><i class="fa-solid fa-rotate spin" aria-hidden="true"></i> Saving...</span>'
  : T.save === 'error' ? `<span class="xs bad"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> There is an error saving item data, please retry later</span> ${btn('Retry', 'retrySave', { cls: 'sm secondary' })}`
    : '<span class="xs muted"><i class="fa-solid fa-circle-check ok" aria-hidden="true"></i> All changes saved</span>';
A.retrySave = () => { touch(); refreshLive(); return false; };
/* Marks a product as busy for a moment (regenerating the proof). */
function processing(e, k, ms) { T.proc[e.id + k] = true; setTimeout(() => { delete T.proc[e.id + k]; render(); }, ms || 1300); }

/* ---------- Routing ---------- */
function route() {
  const [path, q] = (location.hash.replace(/^#\/?/, '') || 'events').split('?');
  const p = path.split('/');
  const r = { name: p[0], q: Object.fromEntries(new URLSearchParams(q || '')) };
  if (p[0] === 'event') { r.id = p[1]; r.name = p[2] === 'p' ? 'product' : p[2] || 'overview'; r.key = p[3]; }
  return r;
}
function go(h) { if (location.hash === h) render(); else location.hash = h; }

/* ---------- Rendering ---------- */
function focusKey() {
  const a = document.activeElement; if (!a || a === document.body) return null;
  if (a.id) return '#' + CSS.escape(a.id);
  if (a.dataset.model) return `[data-model="${a.dataset.model}"]` + (a.type === 'radio' ? `[value="${CSS.escape(a.value)}"]` : '');
  if (a.dataset.act) return `[data-act="${a.dataset.act}"]` + (a.dataset.arg != null ? `[data-arg="${CSS.escape(a.dataset.arg)}"]` : '');
  return null;
}
function render() {
  const r = route(), fk = focusKey();
  const keep = $$('[data-scroll]').map((el) => [el.dataset.scroll, el.scrollTop]);
  if (r.id && ev(r.id)) S.cur = r.id;
  const out = (SCREENS[r.name] || SCREENS.notfound)(r) || {};
  document.body.classList.toggle('has-bar', !!out.bar && !out.barNarrow);
  document.body.classList.toggle('has-bar-n', !!out.barNarrow);
  document.body.classList.toggle('modal-open', !!T.modal);
  $('#app').innerHTML = shell(out, r);
  refreshLive();
  keep.forEach(([k, top]) => { const el = $(`[data-scroll="${k}"]`); if (el) el.scrollTop = top; });
  if (fk) { const el = $(fk); if (el && el.focus) el.focus({ preventScroll: true }); }
  if (T.modal && !$('.overlay').contains(document.activeElement)) { const f = $('.overlay [data-autofocus]') || $('.overlay .modal-b input:not([type=hidden]), .overlay .modal-b select, .overlay .modal-f .btn.primary, .overlay button'); if (f) f.focus({ preventScroll: true }); }
  persist();
}
function refreshLive() { $$('[data-live]').forEach((el) => { const f = L[el.dataset.live]; if (f) { const h = f(el.dataset.arg); if (el.innerHTML !== h) el.innerHTML = h; } }); }

function shell(out, r) {
  const e = ev(S.cur), n = e && e.status !== 'done' ? cartKeys(e).length : 0;
  const rail = [['fa-solid fa-house', 'Home', '#/xpresso'], ['fa-regular fa-rectangle-list', 'Orders', '#/xpresso'], ['fa-regular fa-chart-bar', 'Analytics', '#/xpresso'], ['fa-regular fa-user', 'Team', '#/xpresso']];
  if (out.bare) return out.html + modalHtml();
  return `<a class="skip" href="#main">Skip to content</a>
<header class="hdr">
  <button class="hbtn hdr-menu" data-act="openMenu" aria-label="Open menu"><i class="fa-solid fa-bars" aria-hidden="true"></i></button>
  <a class="logo" href="#/xpresso" aria-label="ACME Corporation, main site">${pinwheel()}<span>ACME<small>Corporation</small></span></a>
  <button class="pill-btn" data-act="stub" data-arg="Categories is part of the main Xpresso site.">Categories <i class="fa-solid fa-chevron-down xs" aria-hidden="true"></i></button>
  <div class="hdr-search"><label class="sr" for="gsearch">Search products</label><input id="gsearch" type="search" placeholder="Search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></div>
  <div class="hdr-icons">
    <button class="hbtn" data-act="openCart" aria-label="Cart, ${plural(n, 'product')}"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>${n ? `<span class="count">${n}</span>` : ''}</button>
    <a class="hbtn desk" href="#/help" aria-label="Help"><i class="fa-regular fa-circle-question" aria-hidden="true"></i></a>
    <div class="desk" style="position:relative"><button class="hbtn" data-act="toggleAcct" aria-label="Account menu" aria-expanded="${T.acct}"><i class="fa-regular fa-circle-user" aria-hidden="true"></i></button>
      ${T.acct ? `<div class="dropdown"><div class="xs muted" style="padding:6px 12px">${esc(S.viewAs.agent)}<br>${COMPANY}</div>${navLinks()}</div>` : ''}</div>
  </div>
</header>
<div class="shell">
  <nav class="rail" aria-label="Main">
    ${rail.map(([i, l, h]) => `<a class="rail-btn" href="${h}" data-label="${l}" aria-label="${l}"><i class="${i}" aria-hidden="true"></i></a>`).join('')}
    <hr><a class="rail-btn active" href="#/events" data-label="Auto Property Marketing" aria-label="Auto Property Marketing" aria-current="page"><i class="fa-solid fa-toolbox" aria-hidden="true"></i></a>
    <a class="rail-btn bottom" href="#/settings" data-label="Profile and settings" aria-label="Profile and settings"><i class="fa-solid fa-gear" aria-hidden="true"></i></a>
  </nav>
  <div class="col">
    <div class="titlebar">Auto Property Marketing</div>
    ${S.ui.banner ? note('info', '<b>Scheduled maintenance:</b> Saturday, Oct 24, 10pm to midnight Central. Ordering will be briefly unavailable.', { close: 'closeBanner', cls: 'sysbar' }) : ''}
    <main id="main" tabindex="-1">${out.html}</main>
    <footer class="footer"><span>Need help? Call <a href="tel:8669773627">${PHONE}</a></span><a href="#/help">Help</a><button class="btn link sm" style="height:auto;text-decoration:underline;color:inherit" data-act="stub" data-arg="This link opens the company privacy request form on the main site.">Do Not Sell or Share My Personal Information</button></footer>
  </div>
</div>
${out.bar ? `<div class="bar ${out.barNarrow ? 'narrow-only' : ''}" role="region" aria-label="Actions">${out.bar}</div>` : ''}
<button class="chat" data-act="stub" data-arg="Live chat opens here. Support is online Monday to Friday, 8am to 6pm Central." aria-label="Live chat, we're online"><span class="dot" aria-hidden="true"></span><i class="fa-regular fa-comment" aria-hidden="true"></i><span>We're Online</span></button>
<button class="demo-btn" data-act="toggleDemo" aria-expanded="${T.demo}"><i class="fa-solid fa-sliders" aria-hidden="true"></i><span>Mockup controls</span></button>
${T.demo ? demoPanel() : ''}${modalHtml()}`;
}
function navLinks() {
  return [['#/events', 'fa-calendar-check', 'Listing events'], ['#/settings', 'fa-gear', 'Profile and settings'], ['#/xpresso', 'fa-store', 'Back to Xpresso'], ['#/help', 'fa-circle-question', 'Help']]
    .map(([h, i, l]) => `<a href="${h}" data-act="closeMenus"><i class="fa-solid ${i}" aria-hidden="true"></i> ${l}</a>`).join('') +
    `<a href="#" data-act="stub" data-arg="Live chat opens here. Support is online Monday to Friday, 8am to 6pm Central."><i class="fa-solid fa-comment" aria-hidden="true"></i> Live chat</a><a href="#/expired" data-act="closeMenus"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Log out</a>`;
}
function pinwheel() { return '<svg class="pinwheel" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 20V2a12 12 0 0 1 12 12z" fill="#249AF3"/><path d="M20 20h18a12 12 0 0 1-12 12z" fill="#16D761"/><path d="M20 20v18A12 12 0 0 1 8 26z" fill="#FFC512"/><path d="M20 20H2A12 12 0 0 1 14 8z" fill="#EC008C"/></svg>'; }
function demoPanel() {
  return `<div class="demo" role="region" aria-label="Mockup controls"><h4>Mockup controls</h4><p class="xs muted">These switches are not part of the design. They show the variants the brief asks for.</p>
  <div class="grp"><div class="xs">Who is looking</div>${sw('S.ui.internal', 'Internal user')}${sw('S.ui.admin', 'Office or company admin')}${sw('S.ui.hide', 'Hide pricing')}${sw('S.ui.copay', 'Company offers copay')}</div>
  <div class="grp"><div class="xs">Checkout variant</div><div class="stack tight">${rad('S.ui.variant', 'normal', 'Normal: agent pays')}${rad('S.ui.variant', 'approval', 'Approval required')}${rad('S.ui.variant', 'approver', 'Approver reviewing')}</div></div>
  <div class="grp"><div class="xs">Simulate</div>${sw('S.sim.saveFail', 'Autosave fails')}${sw('S.sim.tplGone', 'Template no longer available')}${sw('S.sim.mergeErr', 'Merge field error on save')}${sw('S.sim.badAddr', 'Invalid listing address')}${sw('S.sim.noSocial', 'No social accounts connected')}${sw('S.sim.imgErr', 'Image template configuration error')}
    <div class="row" style="margin-top:6px"><label for="${mid('S.sim.list')}" class="grow">Events list</label>${sel('', 'S.sim.list', [['ready', 'Loaded'], ['loading', 'Loading'], ['empty', 'Empty'], ['error', 'Error']])}</div></div>
  <div class="grp row wrap"><a class="btn sm" href="#/expired">Session expired</a><a class="btn sm" href="#/approvals">Approvals</a>${btn('Show banner', 'showBanner', { cls: 'sm' })}${btn('Reset mockup', 'resetAll', { cls: 'sm danger' })}</div></div>`;
}
A.toggleDemo = () => { T.demo = !T.demo; };
A.toggleAcct = () => { T.acct = !T.acct; };
A.closeMenus = () => { T.acct = false; T.modal = null; setTimeout(render, 0); return 'nav'; };
A.closeBanner = () => { S.ui.banner = false; };
A.showBanner = () => { S.ui.banner = true; };
A.resetAll = () => { sessionStorage.removeItem(KEY); S = fresh(); T.modal = null; go('#/events'); };
A.stub = (msg) => { openModal('info', { title: 'Outside this mockup', text: msg }); };
A.openMenu = () => { openModal('menu', {}); };

/* ---------- Modals: only ever one at a time ---------- */
let opener = null;
function openModal(name, props) { if (!T.modal) opener = focusKey(); T.modal = { name, props: props || {} }; }
function closeModal() { T.modal = null; setTimeout(() => { const el = opener && $(opener); if (el) el.focus(); }, 0); }
A.closeModal = () => { closeModal(); };
function modalHtml() {
  if (!T.modal) return '';
  const m = MODALS[T.modal.name](T.modal.props) || {};
  const kind = m.kind || '';
  return `<div class="overlay ${kind}" data-overlay><div class="modal w${m.w || 500}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    ${m.raw || `<div class="modal-h"><div><h3 id="modal-title">${m.title}</h3>${m.sub ? `<div class="xs muted">${m.sub}</div>` : ''}</div><button class="x" data-act="${m.onClose || 'closeModal'}" aria-label="Close">&times;</button></div>
    <div class="modal-b" data-scroll="modal">${m.body}</div>${m.foot ? `<div class="modal-f">${m.foot}</div>` : ''}`}</div></div>`;
}
MODALS.info = (p) => ({ w: 400, title: p.title, body: `<p>${esc(p.text)}</p>`, foot: btn('OK', 'closeModal', { cls: 'primary' }) });
MODALS.menu = () => ({ kind: 'drawer', w: 400, title: 'Menu', sub: `${esc(S.viewAs.agent)} at ${COMPANY}`, body: `<nav class="dropdown static" aria-label="Menu">${navLinks()}</nav>` });
/* A generic confirm. props: title, text, yes (label), act, arg, danger */
MODALS.confirm = (p) => ({ w: 400, title: p.title, body: `<p>${p.text}</p>`, foot: btn('Cancel', 'closeModal', { cls: 'link' }) + btn(p.yes, p.act, { arg: p.arg, cls: p.danger ? 'danger' : 'primary' }) });

/* ---------- Event wiring ---------- */
document.addEventListener('click', (ev0) => {
  const el = ev0.target.closest('[data-act]');
  if (!el) {
    if (ev0.target.matches('[data-overlay]') && T.modal && !(MODALS[T.modal.name](T.modal.props) || {}).sticky) { closeModal(); render(); }
    else if (T.acct && !ev0.target.closest('.dropdown')) { T.acct = false; render(); }
    return;
  }
  if (el.disabled) return;
  const f = A[el.dataset.act]; if (!f) return;
  const res = f(el.dataset.arg, el, ev0);
  if (res === 'nav') return; /* let the link navigate */
  if (el.tagName === 'A') ev0.preventDefault();
  if (res !== false) render();
});
function bindValue(el) {
  const m = el.dataset.model; let v = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.num != null || el.type === 'number' || el.type === 'range') v = v === '' ? '' : Number(v);
  set(m, v);
  if (/^[WICE]\./.test(m)) touch(); else persist();
}
document.addEventListener('input', (e0) => {
  const el = e0.target; if (!el.dataset || !el.dataset.model) return;
  if (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') return;
  bindValue(el); if (el.dataset.then && A[el.dataset.then]) A[el.dataset.then](el.value, el);
  refreshLive();
});
document.addEventListener('change', (e0) => {
  const el = e0.target; if (!el.dataset || !el.dataset.model) return;
  if (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') { bindValue(el); if (el.dataset.then && A[el.dataset.then]) A[el.dataset.then](el.value, el); render(); }
});
document.addEventListener('keydown', (e0) => {
  if (e0.key === 'Escape') { if (T.modal) { const m = MODALS[T.modal.name](T.modal.props) || {}; if (m.onClose) { A[m.onClose](); } else closeModal(); render(); } else if (T.acct || T.demo) { T.acct = T.demo = false; render(); } }
  if (e0.key === 'Tab' && T.modal) {
    const f = $$('.overlay a[href], .overlay button:not([disabled]), .overlay input:not([disabled]), .overlay select, .overlay textarea').filter((x) => x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e0.shiftKey && document.activeElement === first) { last.focus(); e0.preventDefault(); } else if (!e0.shiftKey && document.activeElement === last) { first.focus(); e0.preventDefault(); }
  }
  if (e0.key === 'Enter' && e0.target.dataset && e0.target.dataset.enter) { const f = A[e0.target.dataset.enter]; if (f) { e0.preventDefault(); if (f(e0.target.dataset.arg, e0.target) !== false) render(); } }
});
window.addEventListener('hashchange', () => { T.modal = null; T.acct = false; render(); window.scrollTo(0, 0); const m = $('#main'); if (m) m.focus({ preventScroll: true }); });
