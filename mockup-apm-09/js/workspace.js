/* Event workspace: the overview (hub), the product page frame, design editor, template picker, artwork check. */
const PANELS = {};
const tplGone = (it) => S.sim.tplGone && !it.tplPicked;
const crumbs = (parts) => `<nav class="crumbs" aria-label="Breadcrumb">${parts.map(([l, h], i) => (i ? '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>' : '') + (h ? `<a href="${h}">${esc(l)}</a>` : `<span class="cur" aria-current="page">${esc(l)}</span>`)).join('')}</nav>`;
const thumbArt = (e, k) => `<div class="pthumb">${design(e, k, 0, work(e).items[k])}</div>`;

/* Background artwork check for selected products that changed since the last check. */
function autoScan(e) {
  selKeys(e).forEach((k) => {
    const it = work(e).items[k], id = e.id + k;
    if (scanState(k, it) !== 'pending' || T.scanBusy[id]) return;
    T.scanBusy[id] = true;
    setTimeout(() => { delete T.scanBusy[id]; it.scanSig = sig(it); render(); }, 1400 + PKEYS.indexOf(k) * 150);
  });
}
function scanChip(e, k) {
  const it = work(e).items[k], st = scanState(k, it), n = scanIssues(k, it).length;
  if (T.scanBusy[e.id + k]) return '<span class="xs muted"><i class="fa-solid fa-rotate spin" aria-hidden="true"></i> Scanning your artwork for errors...</span>';
  if (st === 'issues') return `<button class="badge orange" data-act="openScan" data-arg="${k}"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>Artwork check: ${plural(n, 'possible issue')}</button>`;
  if (st === 'ignored') return `<button class="badge" data-act="openScan" data-arg="${k}">Artwork issues ignored</button>`;
  if (st === 'clean') return '<span class="xs muted"><i class="fa-solid fa-check ok" aria-hidden="true"></i> Artwork check passed</span>';
  return '';
}
function pieces(e, k) { const p = priceItem(e, k); return k === 'fbad' ? `${work(e).items.fbad.days} days` : p.qty ? plural(p.qty, 'piece') : 'Download'; }

/* ---------- Overview ---------- */
function overviewBlockers(e) {
  const w = work(e), out = [];
  if (!selKeys(e).length) out.push({ msg: 'Select at least one product', id: 'products' });
  if (pastOpenHouse(e) && !w.pastOk) out.push({ msg: 'Confirm the open house date', id: 'past-note' });
  allProblems(e).forEach(({ k, list }) => out.push({ msg: `${PRODUCTS[k].label}: ${list[0].msg}`, href: `#/event/${e.id}/p/${k}` }));
  return out;
}
function productCard(e, k) {
  const w = work(e), P = PRODUCTS[k], it = w.items[k];
  if (!avail(e, k)) {
    const why = k === 'social' && S.sim.noSocial ? 'No social accounts are connected. Connect one under Profile and settings, Social accounts.' : `You have no ${TYPES[e.type].label} template for ${P.label.toLowerCase()}. Add one under Profile and settings, Default templates.`;
    return `<div class="pcard na"><span class="icon-chip"><i class="fa-solid ${P.icon}" aria-hidden="true"></i></span><div class="pthumb"><i class="fa-solid fa-ban muted-2" aria-hidden="true"></i></div><div><h3>${P.label} <span class="badge">Not available</span></h3><p class="small muted">${why} <a href="#/settings">Open settings</a></p></div></div>`;
  }
  const on = w.sel[k], probs = on ? problems(e, k) : [], p = priceItem(e, k), warns = warningsOf(k, it);
  const priceTxt = P.free ? pr(0) : p.noPrice ? '' : pr(p.total);
  return `<div class="pcard ${on ? '' : 'off'}">
    <span class="switch" data-tip="${on ? 'Included' : 'Not included'}"><input type="checkbox" role="switch" data-model="W.sel.${k}" id="inc-${k}" ${on ? 'checked' : ''} aria-label="Include ${P.label}"><span class="track"></span></span>
    ${thumbArt(e, k)}
    <div><div class="row between"><h3><label for="inc-${k}">${P.label}</label></h3>${on && priceTxt ? `<span class="b">${priceTxt}</span>` : ''}</div>
      ${on ? `<p class="small muted">${k === 'social' || k === 'image' ? esc(summaryOf(e, k)) : esc(describe(e, k))}</p>
        ${probs.length ? probs.slice(0, 2).map((x) => `<div class="errmsg"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${x.msg}</span></div>`).join('') : ''}
        <div class="acts"><a class="btn sm ${probs.length ? 'primary' : 'secondary'}" href="#/event/${e.id}/p/${k}">${probs.length ? 'Fix this' : k === 'social' ? 'Review and post' : k === 'image' ? 'Customize and download' : 'Customize'}<span class="sr"> ${P.label}</span></a>
          ${probs.length ? '<span class="badge orange">Needs attention</span>' : `<span class="badge green">${k === 'social' ? 'Optional' : 'Ready'}</span>`}${it.edited ? '<span class="badge">Edited</span>' : ''}${warns.length ? `<span class="badge orange">${plural(warns.length, 'design warning')}</span>` : ''}${scanChip(e, k)}</div>`
    : `<p class="small muted">Not included in this order. ${P.free ? 'It is free.' : ''}</p>`}
    </div></div>`;
}
/* One plain sentence: what is sent, to how many, how. */
function describe(e, k) {
  const it = work(e).items[k], p = priceItem(e, k);
  if (k === 'fbad') return `Runs ${it.days} days from ${fmtD(it.start)} to people within ${it.radius} miles of the listing.`;
  if (it.method === 'mail') { const rec = mailQty(it), d = CLASSES[it.mailClass].days; return `Mailed to ${plural(rec, 'recipient')}${it.sample.on ? ' plus 1 sample card to you' : ''}. ${CLASSES[it.mailClass].label}, ${d[0]} to ${d[1]} business days.`; }
  if (it.method === 'ship') return `${plural(p.qty, 'piece')} shipped to you. Choose the address at checkout.`;
  if (it.method === 'pickup') return `${plural(p.qty, 'piece')} for pickup at the Fort Worth print center.`;
  return `Print-ready ${it.fileType} file to download.`;
}
function summaryLines(e) {
  const cart = cartKeys(e), free = freeKeys(e);
  return cart.map((k) => { const p = priceItem(e, k); return `<div class="kv"><span>${PRODUCTS[k].label} <span class="muted small">· ${pieces(e, k)}</span></span><span>${p.noPrice ? '<span class="bad small">No price</span>' : pr(p.total)}</span></div>`; }).join('') +
    free.map((k) => `<div class="kv"><span>${PRODUCTS[k].label}</span><span>${pr(0)}</span></div>`).join('');
}
function overviewCta(e, block, bare) {
  const blockers = overviewBlockers(e), n = cartKeys(e).length;
  const label = S.ui.variant === 'approver' ? 'Review order' : n ? 'Review and check out' : 'Finish without an order';
  return (blockers.length && !bare ? `<div class="stack tight" id="blockers" role="status"><div class="small b">Before you can continue:</div>${blockers.map((b) => `<div class="errmsg"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${b.href ? `<a href="${b.href}">${b.msg}</a>` : `<a href="#" data-act="focusId" data-arg="${b.id}">${b.msg}</a>`}</span></div>`).join('')}</div>` : '') +
    `<button type="button" class="btn primary ${block ? 'block' : ''} ${blockers.length ? 'blocked' : ''}" data-act="toCheckout">${label}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`;
}
L.ovSummary = () => { const e = ev(route().id); if (!e) return ''; const n = cartKeys(e).length;
  return `${summaryLines(e) || '<p class="muted small">Nothing selected yet.</p>'}${showP() && n ? `<div class="kv total"><span>Estimated subtotal</span><span>${money(eventTotal(e))}</span></div><p class="xs muted">Shipping, sales tax and credits are added at checkout.</p>` : ''}`; };
SCREENS.overview = (r) => {
  const e = ev(r.id); if (!e) return SCREENS.notfound();
  if (e.status === 'done') return SCREENS.complete(r);
  const w = work(e); autoScan(e);
  const others = S.events.filter((x) => x.a1 === e.a1 && x.id !== e.id && x.status !== 'done' && x.agent === e.agent);
  const det = typeDetail(e), blockers = overviewBlockers(e);
  const notes = [];
  if (S.ui.variant === 'approver') notes.push(note('info', `<b>You are reviewing ${esc(e.agent)}'s order as the approver.</b> You can change anything here before approving.`));
  if (e.status === 'submitted' && S.ui.variant !== 'approver') notes.push(note('info', '<b>Submitted for approval.</b> Your approver has not acted yet. Changes you make here update the submitted cart.'));
  if (pastOpenHouse(e)) notes.push(w.pastOk ? note('warning', `The open house date (${fmtDow(e.oh.date)}) has passed. You chose to continue anyway.`, { acts: btn('Change the date', 'openType', { cls: 'sm secondary' }) })
    : note('warning', `<b>This open house was on ${fmtDow(e.oh.date)}, which has already passed.</b> Anything you order now will arrive after the event.`, { id: 'past-note', acts: btn('Change the date', 'openType', { cls: 'sm primary' }) + btn('Proceed anyway', 'pastOk', { cls: 'sm' }) }));
  if (S.sim.badAddr && !e.addrFixed) notes.push(note('error', '<b>We could not verify this listing address.</b> Mailing lists around the address cannot be created until it is corrected.', { acts: btn('Correct the address', 'editEvent', { arg: e.id, cls: 'sm secondary' }) }));
  return { barNarrow: true, bar: `<div class="grow" data-live="ovBar"></div>${overviewCta(e, false, true)}`, html: `<div class="page">
    ${crumbs([['Events', '#/events'], [e.a1]])}
    <div class="stack loose">
    <div class="card listing"><div class="thumb">${photo(e.hue)}<span class="pc"><i class="fa-solid fa-camera" aria-hidden="true"></i> ${e.photos}</span></div>
      <div class="grow"><h1>${esc(e.a1)}</h1><div class="muted">${esc(e.city)}</div><div class="small">${whole(e.price)} · ${plural(e.beds, 'bed')} · ${plural(e.baths, 'bath')} · ${esc(e.agent)}</div>
        <div class="row wrap" style="margin-top:6px"><a class="btn link blue sm" href="#/events"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>Choose a different event</a>${btn('Edit listing details', 'editEvent', { arg: e.id, cls: 'link blue sm', icon: 'fa-pen' })}</div></div>
      <div class="panel" style="min-width:230px"><div class="xs muted">Event type</div><div class="b" style="font-size:16px">${TYPES[e.type].label}</div>${det ? `<div class="small">${det}</div>` : ''}
        <div style="margin-top:8px">${e.type === 'neighbor' ? '<span class="xs muted"><i class="fa-solid fa-lock" aria-hidden="true"></i> New Neighbor events cannot be changed to another type.</span>' : btn(e.type === 'open' || e.type === 'price' ? 'Change type or details' : 'Change event type', 'openType', { cls: 'sm secondary', icon: 'fa-right-left' })}</div></div></div>
    ${notes.join('')}
    <div class="split"><section aria-labelledby="mk-h" id="products" tabindex="-1" class="stack">
        <div><h2 id="mk-h">Marketing for this ${TYPES[e.type].label.toLowerCase()}</h2><p class="muted">Everything below is ready with your defaults. Switch products on or off, or customize any of them. Nothing is ordered until you check out.</p></div>
        ${PKEYS.map((k) => productCard(e, k)).join('')}
        ${others.length ? `<div class="panel"><div class="panel-h">Other events for this listing</div><div class="stack tight">${others.map((x) => `<a class="listrow" style="background:#fff" href="#/event/${x.id}"><span class="b">${TYPES[x.type].label}</span><span class="small muted grow">${fmtD(x.created)}</span><span class="badge ${STATUS[x.status][1]}">${STATUS[x.status][0]}</span></a>`).join('')}</div></div>` : ''}
      </section>
      <aside class="card aside-sticky stack" aria-labelledby="sum-h"><div class="row between"><h3 id="sum-h">Order summary</h3><span data-live="save"></span></div>
        <div data-live="ovSummary"></div>${overviewCta(e, true)}
        <p class="xs muted center">You can still change everything at checkout.</p></aside></div></div></div>` };
};
L.ovBar = () => { const e = ev(route().id); if (!e) return ''; const b = overviewBlockers(e), n = cartKeys(e).length;
  return b.length ? `<div class="why"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${b[0].msg}${b.length > 1 ? ` and ${b.length - 1} more` : ''}</span></div>` : `<div class="b">${plural(n, 'product')}${showP() && n ? ' · ' + money(eventTotal(e)) : ''}</div><div class="xs muted">${plural(freeKeys(e).length, 'free item')}</div>`; };
A.pastOk = () => { work(ev(route().id)).pastOk = true; touch(); };
A.focusId = (id) => { const el = document.getElementById(id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus({ preventScroll: true }); } return false; };
A.toCheckout = () => {
  const e = ev(route().id), b = overviewBlockers(e);
  if (b.length) { if (b[0].href) go(b[0].href); else A.focusId(b[0].id); return false; }
  if (!cartKeys(e).length) { finishEvent(e, 'free'); return false; }
  go(`#/event/${e.id}/checkout`); return false;
};

/* ---------- Change event type ---------- */
A.openType = () => { const e = ev(route().id); openModal('etype', { type: e.type, date: (e.oh || {}).date || iso(addDays(TODAY, 5)), start: (e.oh || {}).start || '13:00', end: (e.oh || {}).end || '16:00', old: (e.pc || {}).old || e.price, now: (e.pc || {}).now || '', err: false }); };
function typeErrors(p) {
  const er = {};
  if (p.type === 'open') { if (!p.date) er.date = 'Choose the open house date'; if (!p.start) er.start = 'Choose a start time'; if (!p.end) er.end = 'Choose an end time'; else if (p.start && p.end <= p.start) er.end = 'End time must be after the start time'; }
  if (p.type === 'price') { if (!(p.old > 0)) er.old = 'Enter the old price'; if (!(p.now > 0)) er.now = 'Enter the new price'; else if (p.now === p.old) er.now = 'The new price must be different'; }
  return er;
}
MODALS.etype = (p) => {
  const e = ev(route().id), er = p.err ? typeErrors(p) : {}, same = p.type === e.type;
  return { w: 600, title: 'Event type', sub: esc(e.a1) + '. Only types you have templates for are listed.',
    body: `<div class="stack"><div class="choices" role="radiogroup" aria-label="Event type">${OFFERED_TYPES.map((t) => choice('M.type', t, TYPES[t].label, t === e.type ? 'Current' : hasWork(e, t) ? 'Your saved work is kept' : 'Starts with your default products')).join('')}</div>
      ${p.type === 'open' ? `<div class="fgrid three">${tf('Open house date', 'M.date', { type: 'date', req: 1, err: er.date })}${tf('Start time', 'M.start', { type: 'time', req: 1, err: er.start })}${tf('End time', 'M.end', { type: 'time', req: 1, err: er.end })}</div>
        <div data-live="typePast"></div>` : ''}
      ${p.type === 'price' ? `<div class="fgrid">${tf('Old price', 'M.old', { type: 'number', num: 1, req: 1, min: 0, err: er.old })}${tf('New price', 'M.now', { type: 'number', num: 1, req: 1, min: 0, err: er.now })}</div>` : ''}
      ${same ? '' : note('info', `<b>${TYPES[p.type].label} has its own products and cart.</b> ${hasWork(e, p.type) ? 'You will pick up the ' + TYPES[p.type].label + ' cart you started earlier.' : 'It starts with your default products for that type.'} Your ${TYPES[e.type].label} selections stay saved and come back if you switch back.`)}</div>`,
    foot: btn('Cancel', 'closeModal', { cls: 'link' }) + btn(same ? 'Save' : 'Switch to ' + TYPES[p.type].label, 'applyType', { cls: 'primary' }) };
};
L.typePast = () => { const p = T.modal && T.modal.props; return p && p.date && parseD(p.date) < TODAY ? note('warning', 'This date has already passed. You can still continue, and we will ask you to confirm.') : ''; };
A.applyType = () => {
  const p = T.modal.props, e = ev(route().id);
  if (Object.keys(typeErrors(p)).length) { p.err = true; return; }
  const changed = p.type !== e.type; e.type = p.type;
  if (p.type === 'open') { e.oh = { date: p.date, start: p.start, end: p.end }; work(e).pastOk = false; }
  if (p.type === 'price') { e.pc = { old: p.old, now: p.now }; }
  closeModal(); touch(); toast(changed ? `Now working on ${TYPES[e.type].label}` : 'Event details saved');
};

/* ---------- Product page ---------- */
function stepsNav(e, cur) {
  const n = cartKeys(e).length;
  return `<nav class="steps" aria-label="Products in this event"><a class="step" href="#/event/${e.id}"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i>Overview</a>
    ${selKeys(e).map((k) => { const bad = problems(e, k).length; return `<a class="step ${k === cur ? 'on' : ''}" href="#/event/${e.id}/p/${k}"${k === cur ? ' aria-current="step"' : ''}>${PRODUCTS[k].label}<i class="st fa-solid ${bad ? 'fa-circle-exclamation bad' : 'fa-circle-check ok'}" aria-hidden="true"></i><span class="sr">${bad ? 'needs attention' : 'ready'}</span></a>`; }).join('')}
    ${n ? `<a class="step ${cur === 'cart' ? 'on' : ''}" href="#/event/${e.id}/checkout"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>Cart <span class="badge solid">${n}</span></a>` : ''}</nav>`;
}
function previewCard(e, k) {
  const it = work(e).items[k], P = PRODUCTS[k], busy = T.proc[e.id + k], warns = warningsOf(k, it), multi = P.sides.length > 1;
  let stage;
  if (tplGone(it)) stage = `<div class="center stack" style="align-items:center"><i class="fa-solid fa-triangle-exclamation bad" style="font-size:28px" aria-hidden="true"></i><p class="b">Template is no longer available, please select a new template</p>${btn('Choose a template', 'openTpl', { cls: 'primary' })}</div>`;
  else if (busy) stage = `<div class="art ${P.tall ? 'tall' : ''}" aria-busy="true"><div class="skel" style="aspect-ratio:${P.w}/${P.h}"></div></div>`;
  else if (it.side === 'all') stage = `<div class="allsides">${P.sides.map((s, i) => `<button data-act="setSide" data-arg="${i}" aria-label="Show ${s}">${design(e, k, i, it)}<span class="xs muted">${s}</span></button>`).join('')}</div>`;
  else { const [aw, ah] = artSize(k, it.side); stage = `<div class="art" style="max-width:min(520px, calc(48vh * ${(aw / ah).toFixed(3)}))">${design(e, k, it.side, it)}</div>`; }
  return `<div class="card stack aside-sticky" id="preview" tabindex="-1">
    <div class="row between wrap"><div><span class="b">${esc(it.tpl.name)}</span> <span class="muted small">${esc(it.tpl.style)} style${it.edited ? ' · edited' : ''}</span></div><span data-live="save"></span></div>
    ${multi ? `<div class="tabs" role="tablist" aria-label="Sides">${P.sides.map((s, i) => `<button class="tab ${it.side === i ? 'on' : ''}" role="tab" aria-selected="${it.side === i}" data-act="setSide" data-arg="${i}">${s}</button>`).join('')}<button class="tab ${it.side === 'all' ? 'on' : ''}" role="tab" aria-selected="${it.side === 'all'}" data-act="setSide" data-arg="all"><i class="fa-solid fa-table-cells" aria-hidden="true"></i> All sides</button></div>` : ''}
    <div class="preview">${stage}</div>
    ${busy ? '<p class="small muted" role="status"><i class="fa-solid fa-rotate spin" aria-hidden="true"></i> Processing data, please wait</p>' : ''}
    ${warns.map((w) => note('warning', esc(w), { acts: btn('Fix in the editor', 'openEditor', { cls: 'sm secondary' }) })).join('')}
    <div class="row wrap">${scanChip(e, k)}</div>
    <div class="row wrap">${btn('Edit design', 'openEditor', { cls: 'primary', icon: 'fa-pen', dis: tplGone(it) })}${btn('Change template', 'openTpl', { cls: 'secondary', icon: 'fa-table-cells-large' })}${btn('Reset', 'askReset', { icon: 'fa-rotate-left', dis: tplGone(it) })}${btn('Download proof', 'proof', { icon: 'fa-file-arrow-down', dis: tplGone(it) })}${btn('Editing help', 'openEdHelp', { cls: 'link blue', icon: 'fa-circle-question' })}</div>
    ${S.ui.internal ? `<div class="panel xs"><div class="row between wrap"><span class="badge solid-red">Internal</span>${btn('Download production files', 'prodFiles', { cls: 'sm', icon: 'fa-industry' })}</div>
      <div class="kv"><span>Order ID</span><a href="#" data-act="stub" data-arg="Opens this order in the internal order tool.">XD-7741902-${PKEYS.indexOf(k) + 1}</a></div><div class="kv"><span>Editor version</span><span>CC 5.38.2</span></div><div class="kv"><span>Company</span><span>${COMPANY}</span></div><div class="kv"><span>Branch</span><span>${esc(e.office)}</span></div><div class="kv"><span>Agent</span><span>${esc(e.agent)}</span></div></div>` : ''}
  </div>`;
}
SCREENS.product = (r) => {
  const e = ev(r.id), k = r.key;
  if (!e) return SCREENS.notfound();
  if (e.status === 'done') return SCREENS.complete(r);
  if (!PRODUCTS[k] || !avail(e, k) || !work(e).sel[k]) return SCREENS.overview(r);
  const w = work(e), it = w.items[k], P = PRODUCTS[k], keys = selKeys(e), i = keys.indexOf(k), next = keys[i + 1], fromCart = r.q.from === 'cart';
  if (r.q.edit) { history.replaceState(null, '', `#/event/${e.id}/p/${k}`); A.openEditor(); }
  const nextBtn = fromCart ? `<button class="btn primary" data-act="leave" data-arg="#/event/${e.id}/checkout">Back to cart<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`
    : `<button class="btn" data-act="leave" data-arg="#/event/${e.id}">Overview</button><button class="btn primary" data-act="leave" data-arg="${next ? `#/event/${e.id}/p/${next}` : cartKeys(e).length ? `#/event/${e.id}/checkout` : `#/event/${e.id}`}">${next ? 'Next: ' + PRODUCTS[next].label : cartKeys(e).length ? 'Review and check out' : 'Done'}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`;
  return { bar: `<div class="grow" data-live="barInfo"></div>${nextBtn}`, html: `<div class="page">
    ${crumbs([['Events', '#/events'], [e.a1, '#/event/' + e.id], [P.label]])}
    ${stepsNav(e, k)}
    <div class="row between wrap" style="margin-bottom:12px"><div><h1>${P.label} <span class="muted" style="font-weight:400;font-size:14px">${TYPES[e.type].label}, ${esc(e.a1)}</span></h1></div>
      ${keys.length > 1 ? btn('Remove this product', 'askRemove', { cls: 'danger sm', icon: 'fa-trash' }) : '<span class="xs muted" data-tip="An event needs at least one product">Only product in this event</span>'}</div>
    <div class="split prod">${previewCard(e, k)}<div class="stack">${PANELS[k](e, it, k)}</div></div></div>` };
};
L.barInfo = () => {
  const r = route(), e = ev(r.id); if (!e || !PRODUCTS[r.key]) return ''; const k = r.key, p = priceItem(e, k), probs = problems(e, k), P = PRODUCTS[k];
  const head = P.free ? `<span class="b">${P.label}</span> <span class="muted">${pr(0)}</span>` : `<span class="b">${pieces(e, k)}${showP() && !p.noPrice ? ' · ' + money(p.total) : ''}</span>`;
  return `<div>${head}</div>` + (probs.length ? `<div class="why" role="status"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${probs[0].id === 'preview' ? '' : 'Please complete required field(s): '}<a href="#" data-act="focusId" data-arg="${probs[0].id}">${probs[0].msg}</a>${probs.length > 1 ? ` and ${probs.length - 1} more` : ''}</span></div>` : `<div class="xs muted">${esc(P.free ? summaryOf(e, k) : p.summary)}</div>`);
};
A.setSide = (s) => { const it = rootOf('I'); it.side = s === 'all' ? 'all' : +s; };
A.proof = () => { toast('Preparing your watermarked proof...'); setTimeout(() => toast(`${PRODUCTS[route().key].label.toLowerCase()}-proof.pdf downloaded`), 1200); return false; };
A.prodFiles = () => { toast('Production files queued for download (internal)'); return false; };
A.openEdHelp = () => { openModal('edhelp', {}); };
const helpList = () => `<ol class="stack" style="padding-left:18px;margin:0">${HELP_ITEMS.map(([i, t, d]) => `<li><b><i class="fa-solid ${i}" aria-hidden="true"></i> ${t}.</b> ${d}</li>`).join('')}</ol>`;
MODALS.edhelp = () => ({ w: 600, title: 'How to edit a design', sub: 'The same guide is available inside the editor.', body: helpList(), foot: btn('Close', 'closeModal', { cls: 'link' }) + btn('Edit design', 'openEditor', { cls: 'primary' }) });

A.askRemove = () => { const k = route().key; openModal('confirm', { title: `Remove ${PRODUCTS[k].label.toLowerCase()}?`, text: `${PRODUCTS[k].label} will be taken out of this order. Your design and options are kept, so you can add it back from the overview.`, yes: 'Remove product', act: 'removeProduct', arg: k, danger: 1 }); };
A.removeProduct = (k) => { const r = route(), e = ev(r.id); work(e).sel[k] = false; closeModal(); touch(); toast(PRODUCTS[k].label + ' removed'); if (r.name === 'product') go(r.q.from === 'cart' ? `#/event/${e.id}/checkout` : `#/event/${e.id}`); };
A.askReset = () => { openModal('confirm', { title: 'Reset this design?', text: 'The design goes back to the template defaults and the listing data is refreshed. <b>Your edits will be lost.</b>', yes: 'Reset design', act: 'resetDesign', danger: 1 }); };
A.resetDesign = () => { const r = route(), e = ev(r.id), it = work(e).items[r.key], d = newItem(r.key, e); Object.assign(it, { fields: d.fields, edited: false, img: 0, lowRes: d.lowRes }); closeModal(); touch(); processing(e, r.key); toast('Design reset to the template defaults'); };

/* Leaving a product runs the artwork check when the design changed since the last one. */
A.leave = (target) => {
  const r = route(), e = ev(r.id), k = r.key, it = work(e).items[k], probs = problems(e, k);
  if (probs.length && target !== `#/event/${e.id}`) { A.focusId(probs[0].id); toast(probs[0].msg); return false; }
  const st = scanState(k, it);
  if (st === 'pending' && !tplGone(it)) { openModal('scan', { key: k, target, phase: 'scanning' }); T.scanTimer = setTimeout(() => { it.scanSig = sig(it); if (!T.modal || T.modal.name !== 'scan') return; if (scanIssues(k, it).length) { T.modal.props.phase = 'results'; render(); } else { T.modal = null; go(target); } }, 1700); return; }
  if (st === 'issues') { openModal('scan', { key: k, target, phase: 'results' }); return; }
  go(target); return false;
};
A.openScan = (k) => { openModal('scan', { key: k, target: null, phase: 'results' }); };
MODALS.scan = (p) => {
  const e = ev(route().id), it = work(e).items[p.key], P = PRODUCTS[p.key];
  if (p.phase === 'scanning') return { w: 400, title: 'Checking your artwork', body: `<div class="center stack" style="align-items:center;padding:12px 0"><i class="fa-solid fa-wand-magic-sparkles spin" style="font-size:26px;color:var(--blue)" aria-hidden="true"></i><p role="status">Scanning your artwork for errors...</p><p class="xs muted">This takes a few seconds. You can skip it.</p></div>`, foot: btn('Skip the check', 'scanSkip', { cls: 'link' }), onClose: 'scanCancel' };
  const issues = scanIssues(p.key, it);
  return { w: 700, title: `Artwork check found ${plural(issues.length, 'possible issue')}`, sub: P.label + '. ' + SCAN_HELP,
    body: `<div class="stack">${issues.map((x) => `<div class="row top"><div class="pthumb" style="flex:none">${design(e, p.key, x.side, it)}</div><div><span class="badge">${P.sides[x.side]}</span><p style="margin-top:4px">${esc(x.text)}</p></div></div>`).join('<hr class="divider">')}
      <div class="panel row wrap between"><span><span class="badge blue">Beta</span> Were these scan results helpful?</span>${p.fb ? '<span class="small ok"><i class="fa-solid fa-check" aria-hidden="true"></i> Thanks for the feedback</span>' : `<span class="row">${btn('Yes', 'scanFb', { arg: 'y', cls: 'sm', icon: 'fa-thumbs-up' })}${btn('No', 'scanFb', { arg: 'n', cls: 'sm', icon: 'fa-thumbs-down' })}</span>`}</div></div>`,
    foot: btn(p.target ? 'Proceed anyway' : 'Ignore these issues', 'scanProceed', { cls: 'secondary' }) + btn('Go back and fix', 'scanFix', { cls: 'primary' }) };
};
A.scanFb = (v) => { T.modal.props.fb = v; };
A.scanCancel = () => { clearTimeout(T.scanTimer); closeModal(); };
A.scanSkip = () => { clearTimeout(T.scanTimer); const t = T.modal.props.target; T.modal = null; go(t); return false; };
A.scanProceed = () => { const p = T.modal.props, e = ev(route().id), it = work(e).items[p.key]; it.scanOk = sig(it); T.modal = null; persist(); if (p.target) { go(p.target); return false; } };
A.scanFix = () => { const p = T.modal.props, r = route(), e = ev(r.id), it = work(e).items[p.key], side = scanIssues(p.key, it)[0].side; T.modal = null; if (r.name === 'product' && r.key === p.key) { A.openEditor(side); return; } it.side = side; go(`#/event/${e.id}/p/${p.key}?edit=1`); return false; };

/* ---------- Design editor (the canvas itself is a third-party component: placeholder) ---------- */
A.openEditor = (side) => {
  const r = route(), e = ev(r.id), it = work(e).items[r.key];
  openModal('editor', { key: r.key, tab: 'text', help: false, confirm: null, dirty: false, side: side != null && !isNaN(+side) ? +side : it.side === 'all' ? 0 : it.side, d: { fields: { ...it.fields }, img: it.img, lowRes: it.lowRes, tpl: it.tpl } });
};
const ED_FIELDS = [['headline', 'Headline'], ['address', 'Address'], ['price', 'Price'], ['details', 'Details'], ['desc', 'Description (field07)', 1], ['cname', 'Contact name'], ['ctitle', 'Contact title']];
MODALS.editor = (p) => {
  const e = ev(route().id), P = PRODUCTS[p.key], warns = warningsOf(p.key, p.d);
  const conf = { close: `<b>You have unsaved changes.</b> Save them before closing?<div class="row wrap" style="margin-top:8px">${btn('Save and close', 'edSave', { cls: 'primary sm' })}${btn('Discard changes', 'edDiscard', { cls: 'danger sm' })}${btn('Keep editing', 'edBack', { cls: 'link sm' })}</div>`,
    warn: `<b>This design has ${plural(warns.length, 'warning')}:</b><ul style="margin:4px 0 8px;padding-left:18px">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul><div class="row wrap">${btn('Return to editing', 'edBack', { cls: 'primary sm' })}${btn('Save anyway', 'edSaveAnyway', { cls: 'sm' })}</div>`,
    merge: `<b>Merge field error.</b> The field <code>{{listing.virtual_tour}}</code> could not be filled from the listing, so it would print as blank.<div class="row wrap" style="margin-top:8px">${btn('Return to fix', 'edBack', { cls: 'primary sm' })}${btn('Ignore and continue', 'edIgnoreMerge', { cls: 'sm' })}</div>` }[p.confirm];
  const side = p.tab === 'text' ? `<h4>Design fields</h4><p class="xs muted" style="margin-bottom:10px">Click an item on the canvas or edit it here.</p><div class="stack">${ED_FIELDS.map(([f, l, area]) => tf(l, 'M.d.fields.' + f, { area, then: 'edDirty', help: f === 'desc' ? 'Fits about 140 characters before it is cropped.' : '' })).join('')}</div>`
    : p.tab === 'images' ? `<h4>Listing photos</h4><p class="xs muted" style="margin-bottom:10px">Pick a photo to swap the main image.</p><div class="gal">${[0, 1, 2, 3, 4, 5].map((i) => `<button class="${p.d.img === i ? 'on' : ''}" data-act="edImg" data-arg="${i}" aria-label="Use photo ${i + 1}" aria-pressed="${p.d.img === i}">${photo(e.hue, i)}</button>`).join('')}</div>${p.d.lowRes ? '<p class="xs warn" style="margin-top:8px"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> The current photo is low resolution. Pick another one to fix the warning.</p>' : ''}`
      : `<h4>Sides</h4><div class="stack" style="margin-top:10px">${P.sides.map((s, i) => `<button class="tcell ${p.side === i ? 'on' : ''}" data-act="edSide" data-arg="${i}">${design(e, p.key, i, p.d)}<span class="small">${s}</span></button>`).join('')}</div>`;
  return { kind: 'full', sticky: true, onClose: 'edClose', raw: `<div class="ed-top"><h3 id="modal-title" style="color:#fff">Design editor <span style="font-weight:400;opacity:.75">${P.label}, ${P.sides[p.side]}</span></h3>
      <div class="grow"></div>${p.dirty ? '<span class="xs" style="opacity:.75">Unsaved changes</span>' : ''}
      <button class="btn link" data-act="edHelp" aria-pressed="${p.help}"><i class="fa-regular fa-circle-question" aria-hidden="true"></i>Help</button>
      <button class="btn link" data-act="edClose"><i class="fa-solid fa-xmark" aria-hidden="true"></i>Close</button>
      <button class="btn primary" data-act="edSave"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>Save</button></div>
    ${conf ? `<div class="ed-confirm" role="alertdialog" aria-label="Confirm">${conf}</div>` : ''}
    <div class="editor ${p.help ? 'help-on' : ''}">
      <div class="ed-tabs" role="tablist" aria-label="Editor panels">${[['text', 'fa-font', 'Text fields'], ['images', 'fa-image', 'Images'], ['sides', 'fa-clone', 'Sides']].map(([t, i, l]) => `<button role="tab" aria-selected="${p.tab === t}" class="${p.tab === t ? 'on' : ''}" data-act="edTab" data-arg="${t}" aria-label="${l}" data-tip="${l}"><i class="fa-solid ${i}" aria-hidden="true"></i></button>`).join('')}</div>
      <div class="ed-side" data-scroll="edside">${side}</div>
      <div class="ed-canvas"><span class="tag">Third-party editor canvas (placeholder)</span><div class="art ${P.tall ? 'tall' : ''}" data-live="edCanvas"></div></div>
      ${p.help ? `<div class="ed-help"><div class="row between"><h4>Editing help</h4><button class="ibtn" data-act="edHelp" aria-label="Close help"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div><div style="margin-top:10px">${helpList()}</div></div>` : ''}
    </div>` };
};
L.edCanvas = () => { const p = T.modal && T.modal.props; return p && p.d ? design(ev(route().id), p.key, p.side, p.d) : ''; };
A.edDirty = () => { T.modal.props.dirty = true; return false; };
A.edTab = (t) => { T.modal.props.tab = t; };
A.edSide = (i) => { T.modal.props.side = +i; };
A.edHelp = () => { T.modal.props.help = !T.modal.props.help; };
A.edImg = (i) => { const p = T.modal.props; p.d.img = +i; p.d.lowRes = false; p.dirty = true; };
A.edBack = () => { T.modal.props.confirm = null; };
A.edClose = () => { const p = T.modal.props; if (p.dirty && p.confirm !== 'close') { p.confirm = 'close'; return; } closeModal(); };
A.edDiscard = () => { closeModal(); toast('Changes discarded'); };
A.edIgnoreMerge = () => { T.modal.props.mergeOk = true; return A.edSave(); };
A.edSaveAnyway = () => { T.modal.props.warnOk = true; return A.edSave(); };
A.edSave = () => {
  const p = T.modal.props, r = route(), e = ev(r.id), it = work(e).items[p.key];
  if (S.sim.mergeErr && !p.mergeOk) { p.confirm = 'merge'; return; }
  if (warningsOf(p.key, p.d).length && !p.warnOk) { p.confirm = 'warn'; return; }
  if (p.dirty) { Object.assign(it, { fields: p.d.fields, img: p.d.img, lowRes: p.d.lowRes, edited: true }); processing(e, p.key, 900); touch(); }
  it.side = p.side; closeModal(); toast('Design saved');
};

/* ---------- Change template ---------- */
A.openTpl = () => { const it = rootOf('I'); openModal('tpl', { key: route().key, style: it.tpl.style, name: it.tpl.name, def: true }); };
MODALS.tpl = (p) => {
  const e = ev(route().id), it = work(e).items[p.key], P = PRODUCTS[p.key], changed = p.name !== it.tpl.name || p.style !== it.tpl.style;
  return { w: 888, title: 'Change template', sub: `${P.label} for ${TYPES[e.type].label}`,
    body: `<div class="stack"><div style="max-width:260px">${sel('Style', 'M.style', Object.keys(STYLES))}</div>
      <div class="tgrid" role="radiogroup" aria-label="Templates">${STYLES[p.style].map((n) => { const cur = !tplGone(it) && n === it.tpl.name && p.style === it.tpl.style, on = n === p.name; return `<button class="tcell ${on ? 'on' : ''}" role="radio" aria-checked="${on}" data-act="pickTpl" data-arg="${n}">${cur ? '<span class="badge solid">Current</span>' : ''}${design(e, p.key, 0, { ...it, tpl: { style: p.style, name: n } })}<span class="small ${on ? 'b' : ''}">${n}</span></button>`; }).join('')}</div>
      ${it.edited && changed ? note('warning', '<b>Your customization will be lost.</b> The new template starts from its defaults with your listing data.') : ''}
      ${chk('M.def', `Save as my default for ${TYPES[e.type].label} ${P.label.toLowerCase()}`)}</div>`,
    foot: btn('Cancel', 'closeModal', { cls: 'link' }) + btn(it.edited && changed ? 'Replace my design' : 'Use this template', 'applyTpl', { cls: 'primary', dis: !changed && !tplGone(it) }) };
};
A.pickTpl = (n) => { T.modal.props.name = n; };
A.applyTpl = () => {
  const p = T.modal.props, e = ev(route().id), it = work(e).items[p.key];
  if (!STYLES[p.style].includes(p.name)) p.name = STYLES[p.style][0];
  Object.assign(it, { tpl: { style: p.style, name: p.name }, tplPicked: true }); if (it.edited) { it.fields = newItem(p.key, e).fields; it.edited = false; }
  closeModal(); touch(); processing(e, p.key);
  toast(p.def ? `Template changed and saved as your default for ${TYPES[e.type].label} ${PRODUCTS[p.key].label.toLowerCase()}` : 'Template changed');
};
