/* Option panels for each product, and the mailing list manager. */
const cur = () => { const r = route(), e = ev(r.id); return { r, e, k: r.key, it: e ? work(e).items[r.key] : null }; };
function sec(title, body, o = {}) { return `<section class="sec" ${o.id ? `id="${o.id}" tabindex="-1"` : ''} aria-label="${esc(title)}"><div class="sec-h"><h3 class="grow">${title}</h3>${o.right || ''}</div><div class="sec-b">${body}</div></section>`; }
const perTxt = (per, qty) => (showP() ? (per ? '+' + money(per * qty) : 'Free') : '');

/* ---------- Print products ---------- */
function printPanel(e, it, k) {
  const P = PRODUCTS[k], m = it.method, R = RATES[k], out = [];
  if (P.methods.length > 1) out.push(sec('How should we deliver it?', `<div class="choices" role="radiogroup" aria-label="Distribution method">${P.methods.map((x) => choice('I.method', x, `<i class="fa-solid ${METHODS[x].icon}" aria-hidden="true"></i> ${METHODS[x].label}`, METHODS[x].desc)).join('')}</div>`));

  if (m === 'mail') {
    const bad = S.sim.badAddr && !e.addrFixed, d = CLASSES, qty = mailQty(it) + (it.sample.on ? 1 : 0);
    let who = '';
    if (bad) who += note('error', `<b>We could not verify the listing address, so the radius list around it cannot be created.</b> Correct the address to continue.
      <div class="fgrid" style="margin-top:8px">${tf('Address 1', 'E.a1', { req: 1 })}${tf('Postal Code', 'E.zipFix', { req: 1, ph: '76131', err: T.addrErr ? 'Enter a 5-digit postal code' : '' })}</div>`, { acts: btn('Update address', 'fixAddr', { cls: 'sm primary' }) });
    who += `<div class="stack tight">${it.listIds.map((id) => { const l = S.lists.find((x) => x.id === id); return `<div class="listrow"><i class="fa-solid ${id === 'new' ? 'fa-bullseye' : 'fa-address-book'} muted" aria-hidden="true"></i><div class="grow"><span class="b">${esc(listName(e, id))}</span>${id === 'new' ? '<div class="xs muted">Nearest homes around the listing, created for this event</div>' : ''}</div>
        ${id === 'new' ? `<label class="sr" for="${mid('I.newQty')}">Recipients in the radius list</label><input class="input num" id="${mid('I.newQty')}" data-model="I.newQty" type="number" min="1" max="5000" value="${esc(it.newQty)}"${bad ? ' disabled' : ''}><span class="small muted">recipients</span>` : `<span class="small muted">${plural(l ? l.qty : 0, 'recipient')}</span>`}
        ${ibtn('fa-xmark', 'rmList', id, 'Remove ' + listName(e, id) + ' from this mailing', 'del')}</div>`; }).join('')}</div>
      ${it.listIds.length ? '' : '<div class="errmsg" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>Choose at least one mailing list.</span></div>'}
      <div class="row wrap">${btn('Manage mailing lists', 'openLists', { cls: 'secondary', icon: 'fa-list-check' })}${it.listIds.includes('new') ? '' : btn('Add the radius list for this address', 'addNewList', { icon: 'fa-plus' })}<span class="small b" data-live="listTotal" style="margin-left:auto"></span></div>
      <div class="sub stack">${sw('I.sample.on', '<span><b>Add sample card</b><br><span class="xs muted">Mails one extra piece to you, so you see what your recipients get.</span></span>')}
        ${it.sample.on ? (it.sample.edit ? `<div class="fgrid">${tf('Name', 'I.sample.name', { req: 1, cls: 'full' })}${tf('Address 1', 'I.sample.a1', { cls: 'full' })}${tf('City', 'I.sample.city')}<div class="fgrid">${tf('State', 'I.sample.st', { max: 2 })}${tf('Zip', 'I.sample.zip', { max: 10 })}</div></div><div data-live="sampleErr"></div><div>${btn('Done', 'sampleEdit', { cls: 'sm secondary' })}</div>`
        : `<div class="listrow"><i class="fa-solid fa-location-dot muted" aria-hidden="true"></i><span class="grow">${it.sample.name.trim() ? esc(it.sample.name) : '<span class="bad">Name is required</span>'}, ${esc(it.sample.a1)}, ${esc(it.sample.city)}, ${esc(it.sample.st)} ${esc(it.sample.zip)}</span>${btn('Edit address', 'sampleEdit', { cls: 'sm link blue' })}</div>`) : ''}</div>
      <div class="sub stack"><h4>Mailing class</h4><div class="choices" role="radiogroup" aria-label="Mailing class">${Object.entries(d).map(([c, x]) => choice('I.mailClass', c, x.label, `${x.days[0]} to ${x.days[1]} business days`, showP() ? (x.per ? '+' + money(x.per * qty) : 'Included') : '')).join('')}</div>${classWarning(e, it)}</div>`;
    out.push(sec('Who gets it?', who, { id: 'sec-who', right: '<span class="badge">Required</span>' }));
  } else if (m === 'download') {
    out.push(sec('Your file', `<div class="choices" role="radiogroup" aria-label="File type">${choice('I.fileType', 'JPG', 'JPG', 'Best for email and web')}${choice('I.fileType', 'PDF', 'PDF', 'Best for printing yourself')}</div>
      <div class="row wrap">${P.sides.map((s) => btn(`${s} (${it.fileType})`, 'dlSide', { arg: s, icon: 'fa-download', cls: 'secondary', dis: R.download > 0 }) + (showP() ? `<span class="small muted">${R.download ? '' : 'Free'}</span>` : '')).join('')}</div>
      ${R.download > 0 ? `<p class="small muted"><i class="fa-solid fa-lock" aria-hidden="true"></i> ${showP() ? money(R.download) + ' for all sides. ' : ''}The download buttons unlock on the confirmation page after checkout.</p>` : '<p class="small muted">These files are free. Download them now; nothing is added to your cart price.</p>'}`));
  } else {
    out.push(sec('How many?', `<div class="row wrap">${tf('Quantity', 'I.qty', { type: 'number', num: 1, req: 1, min: QTY_RANGE[0], maxv: QTY_RANGE[1], icls: 'num' })}<div class="grow small muted" style="align-self:flex-end;padding-bottom:7px">${m === 'ship' ? 'You choose the shipping address and service level at checkout.' : 'Ready in 2 business days at 4100 Print Center Dr, Fort Worth.'}</div></div><div data-live="qtyErr"></div>`, { right: '<span class="badge">Required</span>' }));
  }

  if (m !== 'download') {
    const qty = priceItem(e, k).qty;
    out.push(sec('Paper and finish', `${sel('Paper type', 'I.paper', PAPERS.map((p) => [p.id, p.label + (showP() ? ' (' + (p.per ? '+' + money(p.per * qty) : 'Free') + ')' : '')]))}
      <div><div class="lbl" id="coat-l" style="margin-bottom:4px">Coating options</div><div class="choices" role="radiogroup" aria-labelledby="coat-l">${COATINGS.map((c) => choice('I.coating', c.id, c.label, '', perTxt(c.per, qty))).join('')}</div></div>`));
    let extras = `<div class="row between">${chk('I.pdf', '<b>PDF download with purchase</b><br><span class="xs muted">A print-ready PDF of the final design, available after checkout.</span>')}<span class="nowrap">${showP() ? money(PDF_ADDON) : ''}</span></div>`;
    if (k === 'postcard' && m === 'mail') extras += `<div class="sub stack" id="sec-idv">${informedDelivery(e, it)}</div>`;
    out.push(sec('Extras', extras));
  }
  out.push(`<section class="card" aria-label="Price for this product"><div class="card-h"><h3>${showP() ? 'Price for this product' : 'Summary'}</h3></div><div data-live="priceBox"></div></section>`);
  return out.join('');
}
PANELS.postcard = PANELS.brochure = PANELS.flyer = printPanel;

function classWarning(e, it) {
  if (e.type !== 'open' || !e.oh || pastOpenHouse(e)) return '';
  const oh = parseD(e.oh.date), late = (c) => addBiz(TODAY, CLASSES[c].days[1]) >= oh;
  if (!late(it.mailClass)) return `<p class="small ok"><i class="fa-solid fa-check" aria-hidden="true"></i> Expected to arrive before the open house on ${fmtDow(e.oh.date)}.</p>`;
  return note('warning', `<b>${CLASSES[it.mailClass].label} mail cannot be guaranteed to arrive before the open house on ${fmtDow(e.oh.date)}.</b> ` + (it.mailClass === 'standard' && !late('first') ? 'First Class would arrive in time.' : 'No mailing class is guaranteed to arrive in time. Consider changing the date or shipping to yourself.'),
    it.mailClass === 'standard' && !late('first') ? { acts: btn('Switch to First Class', 'toFirst', { cls: 'sm primary' }) } : {});
}
A.toFirst = () => { cur().it.mailClass = 'first'; touch(); };
A.fixAddr = () => { const { e } = cur(); if (!e.a1.trim() || !/^\d{5}/.test(e.zipFix || '')) { T.addrErr = true; return; } T.addrErr = false; e.city = e.city.replace(/\d{5}.*$/, '').trim() + ' ' + e.zipFix; e.addrFixed = true; touch(); toast('Address verified. Radius list created.'); };
A.rmList = (id) => { const { it } = cur(); it.listIds = it.listIds.filter((x) => x !== id); touch(); };
A.addNewList = () => { cur().it.listIds.unshift('new'); touch(); };
A.sampleEdit = () => { const s = cur().it.sample; if (s.edit && !s.name.trim()) { A.focusId(mid('I.sample.name')); return false; } s.edit = !s.edit; };
A.dlSide = (s) => { toast(`${s} file downloaded`); return false; };
L.sampleErr = () => { const { it } = cur(); return it && it.sample && !it.sample.name.trim() ? '<div class="errmsg" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>Name is required for the sample card.</span></div>' : ''; };
L.listTotal = () => { const { it } = cur(); if (!it || !it.listIds) return ''; const rec = mailQty(it); return `${plural(rec, 'recipient')}${it.sample.on ? ' + 1 sample card' : ''} = ${plural(rec + (it.sample.on ? 1 : 0), 'piece')}`; };
L.qtyErr = () => { const { e, k } = cur(); return e && priceItem(e, k).noPrice ? `<div class="errmsg" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>Sorry, we have no pricing policy for selected quantity. Choose ${QTY_RANGE[0]} to ${QTY_RANGE[1].toLocaleString('en-US')}.</span></div>` : ''; };
L.priceBox = () => {
  const { e, k } = cur(); if (!e) return ''; const p = priceItem(e, k);
  if (p.noPrice) return '<p class="bad small">Sorry, we have no pricing policy for selected quantity.</p>';
  return p.lines.filter((x) => showP() || x.l === 'Quantity' || x.l === 'Mailing lists' || x.l === 'Delivery method').map((x) => `<div class="kv"><span class="muted">${x.l}<br><span class="xs">${esc(x.v)}</span></span><span>${x.p == null ? '' : pr(x.p)}</span></div>`).join('') +
    `<div class="kv total"><span>${p.qty ? 'Total quantity: ' + p.qty : 'Total'}</span><span>${showP() ? money(p.total) : ''}</span></div>`;
};

function informedDelivery(e, it) {
  const v = it.idv;
  let h = sw('I.idv.on', `<span><b>Informed Delivery by USPS</b> ${showP() ? '<span class="badge green">Free</span>' : ''}<br><span class="xs muted">Recipients see your postcard in their USPS email before it arrives.</span></span>`) +
    `<details class="small"><summary style="cursor:pointer;color:var(--blue)">What is Informed Delivery?</summary><p class="muted" style="margin-top:6px">USPS emails subscribers a daily preview of the mail arriving that day. When this is on, your postcard shows in that email in color with a clickable image and a link of your choice, so each recipient sees it twice: once in their inbox and once in the mailbox.</p></details>`;
  if (!v.on) return h;
  const n = v.all ? 13 : 4;
  h += `<div class="split" style="grid-template-columns:minmax(0,1fr) minmax(0,300px);gap:16px"><div class="stack">
      <div>${tf('Display Name', 'I.idv.name', { req: 1, max: 36, help: 'Shown as the sender in the email.' })}<div data-live="idvCount"></div></div>
      <div><div class="row between"><span class="lbl" id="ra-l">Ride Along Image</span>${btn(v.all ? 'Show fewer' : 'See All (13)', 'idvAll', { cls: 'link blue sm' })}</div><div class="gal" role="radiogroup" aria-labelledby="ra-l">${Array.from({ length: n }, (_, i) => `<button role="radio" aria-checked="${v.img === i}" class="${v.img === i ? 'on' : ''}" data-act="idvImg" data-arg="${i}" aria-label="Image ${i + 1}">${photo(e.hue, i)}</button>`).join('')}</div></div>
      <div class="stack tight"><span class="lbl">Redirect URL</span>${rad('I.idv.urlMode', 'xl', 'My Xpress Links page <a href="#" data-act="stub" data-arg="Opens your Xpress Links page (xpress.link/chucky-norris) in a new tab.">Preview</a>')}${rad('I.idv.urlMode', 'custom', 'A URL I type')}
        ${v.urlMode === 'custom' ? tf('Redirect URL', 'I.idv.url', { type: 'url', req: 1, ph: 'https://' }) + '<div data-live="idvUrlErr"></div>' : ''}</div></div>
    <div><div class="lbl" style="margin-bottom:4px">What the recipient sees</div><div data-live="idvPreview"></div></div></div>`;
  return h;
}
A.idvAll = () => { const v = cur().it.idv; v.all = !v.all; };
A.idvImg = (i) => { cur().it.idv.img = +i; touch(); };
L.idvCount = () => { const { it } = cur(); if (!it || !it.idv) return ''; const left = 36 - it.idv.name.length; return it.idv.name.trim() ? `<div class="helper">${plural(left, 'character')} remaining</div>` : '<div class="errmsg" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>Display Name is required.</span></div>'; };
L.idvUrlErr = () => { const { it } = cur(); return it && it.idv && !validUrl(it.idv.url) ? '<div class="errmsg"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>Enter a full URL starting with https://</span></div>' : ''; };
L.idvPreview = () => { const { e, it } = cur(); if (!it || !it.idv) return ''; const v = it.idv;
  return `<div class="mail"><div class="mh">USPS Informed Delivery · Daily Digest</div><div class="mb"><div class="xs muted">FROM</div><div class="b" style="margin-top:-8px">${esc(v.name) || '<span class="muted-2">Display Name</span>'}</div>${design(e, 'postcard', 0, it)}<a href="#" data-act="stub" data-arg="Opens ${v.urlMode === 'xl' ? 'your Xpress Links page' : esc(v.url)} in a new tab." class="small">Learn more about your mail <i class="fa-solid fa-arrow-up-right-from-square xs" aria-hidden="true"></i></a><div style="max-width:150px">${photo(e.hue, v.img)}</div></div></div>`; };

/* ---------- Mailing list manager: one drawer, steps inside it, no stacked dialogs ---------- */
A.openLists = () => { openModal('lists', { key: route().key, view: 'list', filter: '', only: false, page: 0, rm: null }); };
function filteredLists(p, it) { const q = p.filter.trim().toLowerCase(); return S.lists.filter((l) => (!q || l.name.toLowerCase().includes(q)) && (!p.only || it.listIds.includes(l.id))); }
L.listsTable = () => {
  const p = T.modal && T.modal.props; if (!p || p.view !== 'list') return ''; const { e, it } = cur(), all = filteredLists(p, it), per = 6, pages = Math.max(1, Math.ceil(all.length / per));
  if (p.page >= pages) p.page = pages - 1;
  const rows = all.slice(p.page * per, p.page * per + per).map((l) => p.rm === l.id
    ? `<tr><td colspan="5"><div class="row wrap between"><span>Remove <b>${esc(l.name)}</b>? The saved list is deleted for future orders too.</span><span class="row">${btn('Keep', 'listRmCancel', { cls: 'sm link' })}${btn('Remove list', 'listRm', { arg: l.id, cls: 'sm danger' })}</span></div></td></tr>`
    : `<tr><td style="width:36px"><label class="check"><input type="checkbox" data-pick="${l.id}" ${it.listIds.includes(l.id) ? 'checked' : ''} aria-label="Select ${esc(l.name)}"><span class="box"></span></label></td><td>${esc(l.name)}</td><td class="right">${l.qty}</td><td class="nowrap">${fmtD(l.created)}</td><td class="right nowrap">${ibtn('fa-pen', 'listEdit', l.id, 'Edit ' + l.name)} ${ibtn('fa-trash', 'listAskRm', l.id, 'Remove ' + l.name, 'del')}</td></tr>`).join('');
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th><span class="sr">Select</span></th><th>Name</th><th class="right">Quantity</th><th>Created</th><th><span class="sr">Actions</span></th></tr></thead><tbody>
    ${!p.filter && !p.only && p.page === 0 ? `<tr><td><label class="check"><input type="checkbox" data-pick="new" ${it.listIds.includes('new') ? 'checked' : ''} aria-label="Select the new radius list"><span class="box"></span></label></td><td>${esc(listName(e, 'new'))} <span class="badge blue">Created for this event</span></td><td class="right">${it.newQty}</td><td>${fmtD(e.created)}</td><td></td></tr>` : ''}
    ${rows || (all.length ? '' : `<tr><td colspan="5" class="center muted">No lists match. ${p.only ? 'Nothing is selected yet.' : 'Try a different name.'}</td></tr>`)}</tbody></table></div>
    <div class="row between wrap" style="margin-top:10px"><span class="small muted">${plural(all.length, 'saved list')}</span><div class="pager" role="navigation" aria-label="Pages"><button data-act="listPage" data-arg="${p.page - 1}" ${p.page ? '' : 'disabled'} aria-label="Previous page">&lsaquo;</button>${Array.from({ length: pages }, (_, i) => `<button class="${i === p.page ? 'on' : ''}" data-act="listPage" data-arg="${i}"${i === p.page ? ' aria-current="page"' : ''}>${i + 1}</button>`).join('')}<button data-act="listPage" data-arg="${p.page + 1}" ${p.page < pages - 1 ? '' : 'disabled'} aria-label="Next page">&rsaquo;</button></div></div>`;
};
L.listsFoot = () => { const { it } = cur(); return it && it.listIds ? `${plural(it.listIds.length, 'list')} selected · ${plural(mailQty(it), 'recipient')}` : ''; };
L.radiusEst = () => { const p = T.modal && T.modal.props; if (!p || !p.d) return ''; const found = Math.round(p.d.miles * p.d.miles * 310 * (p.d.owners ? 0.7 : 1) * (p.d.noBiz ? 0.9 : 1)) + 18, use = Math.min(found, +p.d.max || 0); p.d.est = use;
  return `<div class="map" aria-hidden="true"><div class="ring" style="width:${30 + p.d.miles * 22}px;height:${30 + p.d.miles * 22}px"></div><i class="fa-solid fa-location-dot pin"></i></div><p class="small" role="status" style="margin-top:8px"><b>About ${found.toLocaleString('en-US')} addresses</b> within ${p.d.miles} ${p.d.miles === 1 ? 'mile' : 'miles'}. ${use < found ? `The nearest ${use} will be used.` : 'All of them will be used.'}</p>`; };
MODALS.lists = (p) => {
  const { e, it } = cur(), back = (to) => `<button class="btn link blue sm" data-act="listView" data-arg="${to}"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>Back</button>`;
  if (p.view === 'types') return { kind: 'drawer', w: 700, title: 'Create a new mailing list', sub: 'Choose how to build the list.', body: `<div class="stack">${back('list')}<div class="typegrid">${LIST_TYPES.map(([id, l, i]) => `<button class="choice" data-act="listType" data-arg="${id}"><span class="icon-chip"><i class="fa-solid ${i}" aria-hidden="true"></i></span><span class="t" style="align-self:center">${l}</span></button>`).join('')}</div></div>` };
  if (p.view === 'radius') return { kind: 'drawer', w: 700, title: 'Radius around an address', sub: 'Step 2 of 2. The nearest addresses to the center are used first.',
    body: `<div class="stack">${back('types')}<div class="fgrid">${tf('List name', 'M.d.name', { req: 1, cls: 'full', err: p.err && !p.d.name.trim() ? 'Give the list a name' : '' })}${tf('Center address', 'M.d.center', { req: 1, cls: 'full', err: p.err && !validAddr(p.d.center) ? 'Enter a full street address, city and state' : '' })}
      ${sel('Radius', 'M.d.miles', [[0.25, '1/4 mile'], [0.5, '1/2 mile'], [1, '1 mile'], [2, '2 miles'], [3, '3 miles'], [5, '5 miles']], { num: 1 })}${tf('Maximum recipients', 'M.d.max', { type: 'number', num: 1, min: 1 })}</div>
      <div class="row wrap">${chk('M.d.owners', 'Homeowners only')}${chk('M.d.noBiz', 'Exclude businesses')}</div><div data-live="radiusEst"></div></div>`,
    foot: btn('Cancel', 'listView', { arg: 'list', cls: 'link' }) + btn('Create list', 'listCreate', { cls: 'primary' }) };
  if (p.view === 'other') return { kind: 'drawer', w: 700, title: LIST_TYPES.find((t) => t[0] === p.type)[1], sub: 'Step 2 of 2',
    body: `<div class="stack">${back('types')}<div class="empty"><i class="fa-solid ${LIST_TYPES.find((t) => t[0] === p.type)[2]}" aria-hidden="true"></i><h3>Placeholder step</h3><p>In the product, this is where you set up a "${LIST_TYPES.find((t) => t[0] === p.type)[1]}" list. Only the Radius type is built out in this mockup.</p></div></div>`, foot: btn('Choose another type', 'listView', { arg: 'types', cls: 'secondary' }) };
  if (p.view === 'edit') return { kind: 'drawer', w: 700, title: 'Edit mailing list', body: `<div class="stack">${back('list')}${tf('List name', 'M.d.name', { req: 1, err: p.err && !p.d.name.trim() ? 'Give the list a name' : '' })}${tf('Quantity', 'M.d.qty', { type: 'number', num: 1, min: 1, help: 'Use fewer than the full list by lowering the quantity. The nearest or first addresses are kept.' })}</div>`, foot: btn('Cancel', 'listView', { arg: 'list', cls: 'link' }) + btn('Save list', 'listSave', { cls: 'primary' }) };
  return { kind: 'drawer', w: 700, title: 'Manage mailing lists', sub: `${PRODUCTS[p.key].label} for ${esc(e.a1)}. Select every list this mailing should go to.`,
    body: `<div class="stack"><div class="toolbar"><div class="search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><label class="sr" for="${mid('M.filter')}">Filter by name</label><input class="input" id="${mid('M.filter')}" data-model="M.filter" data-then="listPage0" type="search" placeholder="Filter by name" value="${esc(p.filter)}"></div>${chk('M.only', 'Show selected only')}</div><div data-live="listsTable"></div></div>`,
    foot: `<span class="lead small b" data-live="listsFoot"></span>${btn('Create a new mailing list', 'listView', { arg: 'types', cls: 'secondary', icon: 'fa-plus' })}${btn('Done', 'closeModal', { cls: 'primary' })}` };
};
document.addEventListener('change', (e0) => { const id = e0.target.dataset && e0.target.dataset.pick; if (!id) return; const { it } = cur(); it.listIds = e0.target.checked ? [...it.listIds, id] : it.listIds.filter((x) => x !== id); touch(); refreshLive(); });
A.listPage0 = () => { T.modal.props.page = 0; return false; };
A.listPage = (i) => { T.modal.props.page = +i; };
A.listView = (v) => { const p = T.modal.props; p.view = v; p.err = false; p.rm = null; };
A.listType = (t) => { const p = T.modal.props, { e } = cur(); p.type = t; p.err = false; if (t === 'radius') { p.view = 'radius'; p.d = { name: '', center: `${e.a1}, ${e.city}`, miles: 1, max: 200, owners: false, noBiz: true }; } else p.view = 'other'; };
A.listCreate = () => { const p = T.modal.props, { it } = cur(); if (!p.d.name.trim() || !validAddr(p.d.center)) { p.err = true; return; } const id = 'l' + Date.now(); S.lists.unshift({ id, name: p.d.name.trim(), qty: p.d.est || 100, created: iso(TODAY) }); it.listIds.push(id); p.view = 'list'; p.page = 0; p.filter = ''; touch(); toast('List created and added to this mailing'); };
A.listEdit = (id) => { const p = T.modal.props, l = S.lists.find((x) => x.id === id); p.view = 'edit'; p.editId = id; p.d = { name: l.name, qty: l.qty }; };
A.listSave = () => { const p = T.modal.props; if (!p.d.name.trim()) { p.err = true; return; } Object.assign(S.lists.find((x) => x.id === p.editId), { name: p.d.name.trim(), qty: Math.max(1, +p.d.qty || 1) }); p.view = 'list'; touch(); };
A.listAskRm = (id) => { T.modal.props.rm = id; };
A.listRmCancel = () => { T.modal.props.rm = null; };
A.listRm = (id) => { S.lists = S.lists.filter((l) => l.id !== id); Object.values(S.work).forEach((w) => PKEYS.forEach((k) => { if (w.items[k].listIds) w.items[k].listIds = w.items[k].listIds.filter((x) => x !== id); })); T.modal.props.rm = null; touch(); };

/* ---------- Social Media ---------- */
const NOW_TIME = '10:00';
function socialWhy(e, it) {
  const on = PLATFORMS.filter((p) => p.on && it.plats[p.id]), out = [];
  if (!on.length) out.push('Choose at least one account');
  if (on.some((p) => p.id !== 'instagram') && !validUrl(it.url)) out.push('Enter the listing URL');
  if (it.when === 'later' && !(it.date && it.time && (it.date > iso(TODAY) || (it.date === iso(TODAY) && it.time > NOW_TIME)))) out.push('Pick a date and time in the future');
  return out;
}
PANELS.social = (e, it) => {
  const on = PLATFORMS.filter((p) => p.on && it.plats[p.id]);
  let res = '';
  if (T.posting) res = `<div class="stack tight" aria-busy="true">${on.map(() => '<div class="skel" style="height:36px"></div>').join('')}</div><p class="small muted" role="status"><i class="fa-solid fa-rotate spin" aria-hidden="true"></i> Posting...</p>`;
  else if (it.result) res = `<div class="stack tight" role="status">${it.result.map((x) => `<div class="listrow"><i class="${PLATFORMS.find((p) => p.id === x.id).icon}" aria-hidden="true"></i><span class="b">${PLATFORMS.find((p) => p.id === x.id).label}</span><span class="grow small ${x.ok ? '' : 'bad'}">${x.ok ? '<i class="fa-solid fa-circle-check ok" aria-hidden="true"></i> Posted' : '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> Failed'}. ${x.msg || ''}</span>${x.ok ? '' : btn('Retry', 'socialRetry', { arg: x.id, cls: 'sm secondary' })}</div>`).join('')}</div>`;
  else if (it.scheduled) res = note('success', `<b>Scheduled for ${fmtDow(it.scheduled.date)} at ${fmtT(it.scheduled.time)}</b> on ${it.scheduled.plats.join(', ')}. We will email you the result.`, { acts: btn('Cancel the scheduled post', 'socialUnschedule', { cls: 'sm' }) });
  return note('info', '<b>Sharing is free and optional.</b> Post now, schedule it, or skip it. It does not hold up your order.') +
    sec('Where to post', S.sim.noSocial ? note('warning', 'No social accounts are connected. Connect them under <a href="#/settings">Profile and settings, Social accounts</a>.') : `<div class="choices">${PLATFORMS.map((p) => `<label class="choice ${p.on && it.plats[p.id] ? 'on' : ''} ${p.on ? '' : 'off'}"><span class="check"><input type="checkbox" data-model="I.plats.${p.id}" ${p.on && it.plats[p.id] ? 'checked' : ''} ${p.on ? '' : 'disabled'}><span class="box"></span></span><span class="grow"><span class="t"><i class="${p.icon}" aria-hidden="true"></i> ${p.label}</span><br><span class="xs muted">${p.on ? '@chuckynorris' : 'Not connected'}</span></span></label>`).join('')}</div>
      <p class="xs muted">Pinterest is not connected. Connect accounts under <a href="#/settings">Profile and settings, Social accounts</a>.</p>`, { id: 'sec-plat' }) +
    sec('What to post', `${tf('Listing URL', 'I.url', { type: 'url', req: 1, help: 'Added as the link on the post. Does not apply to Instagram.' })}
      <div>${tf('Post comment', 'I.comment', { area: 1, rows: 4 })}<div class="row between wrap" style="margin-top:4px"><span data-live="socialCount" class="grow"></span>${btn('Copy to clipboard', 'copyComment', { cls: 'sm', icon: 'fa-copy' })}</div></div>
      ${sw('I.incDesc', '<span>Include listing description<br><span class="xs muted">Facebook only. Adds the full description under your comment.</span></span>', { dis: !it.plats.facebook })}`) +
    sec('When', `<div class="choices" role="radiogroup" aria-label="When to post">${choice('I.when', 'now', 'Post now', 'Goes out as soon as you post')}${choice('I.when', 'later', 'Schedule for future post', 'Pick a date and time')}</div>
      ${it.when === 'later' ? `<div class="fgrid">${tf('Date', 'I.date', { type: 'date', req: 1, min: iso(TODAY) })}${tf('Time', 'I.time', { type: 'time', req: 1 })}</div>` : ''}
      <div data-live="socialWhy"></div><div class="row wrap">${btn(it.when === 'later' ? 'Schedule post' : 'Post now', 'socialPost', { cls: 'primary', icon: it.when === 'later' ? 'fa-clock' : 'fa-paper-plane' })}<span class="small muted">to ${on.length ? on.map((p) => p.label).join(', ') : 'no accounts yet'}</span></div>${res}`, { id: 'sec-when' });
};
L.socialWhy = () => { const { e, it } = cur(); if (!it || !it.plats) return ''; const w = socialWhy(e, it); return w.length ? `<div class="stack tight">${w.map((m) => `<div class="errmsg"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${m} to ${it.when === 'later' ? 'schedule' : 'post'}.</span></div>`).join('')}</div>` : ''; };
L.socialCount = () => { const { it } = cur(); if (!it || it.comment == null) return ''; const n = it.comment.length; return `<span class="helper">${n} characters</span>` + (it.plats.x && n > 280 ? `<div class="xs warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> X allows 280 characters. Your comment will be shortened on X only.</div>` : ''); };
A.copyComment = () => { const { it } = cur(); try { navigator.clipboard.writeText(it.comment); } catch (x) { /* clipboard unavailable from file */ } toast('Comment copied to clipboard'); return false; };
A.socialPost = () => {
  const { e, it } = cur(); if (socialWhy(e, it).length) { A.focusId(!PLATFORMS.some((p) => p.on && it.plats[p.id]) ? 'sec-plat' : !validUrl(it.url) ? mid('I.url') : mid('I.date')); return false; }
  const on = PLATFORMS.filter((p) => p.on && it.plats[p.id]);
  if (it.when === 'later') { it.scheduled = { date: it.date, time: it.time, plats: on.map((p) => p.label) }; it.result = null; touch(); toast('Post scheduled'); return; }
  T.posting = true; it.scheduled = null;
  setTimeout(() => { T.posting = false; it.result = on.map((p) => p.id === 'linkedin' ? { id: p.id, ok: false, msg: 'LinkedIn authorization has expired. Reconnect LinkedIn in Profile and settings, then retry.' } : { id: p.id, ok: true, msg: p.id === 'x' && it.comment.length > 280 ? 'Your comment was shortened to 280 characters for X.' : '' }); touch(); render(); }, 1500);
};
A.socialRetry = (id) => { const x = cur().it.result.find((r) => r.id === id); x.ok = true; x.msg = 'Posted on retry.'; touch(); };
A.socialUnschedule = () => { cur().it.scheduled = null; touch(); };

/* ---------- Image Download ---------- */
PANELS.image = (e, it) => {
  const id = e.id + 'img', sides = PRODUCTS.image.sides;
  if (!T.imgReady) T.imgReady = {};
  if (!T.imgReady[id] && !T.loading[id]) { T.loading[id] = true; setTimeout(() => { T.loading[id] = false; T.imgReady[id] = true; render(); }, 1800); }
  let body;
  if (S.sim.imgErr && T.imgReady[id]) body = note('error', `<b>We could not create your files.</b> This template has a configuration error. Call ${PHONE} and we will fix it, or try again.`, { acts: btn('Try again', 'imgRetry', { cls: 'sm secondary' }) });
  else if (!T.imgReady[id]) body = `<p class="small muted" role="status"><i class="fa-solid fa-rotate spin" aria-hidden="true"></i> Your files are still being prepared. This usually takes a few seconds.</p><div class="stack tight" aria-busy="true">${sides.map(() => '<div class="skel" style="height:44px"></div>').join('')}</div>`;
  else body = `<div class="stack tight">${sides.map((s, i) => `<div class="listrow"><i class="fa-regular fa-image muted" aria-hidden="true"></i><span class="grow"><b>${s}</b> <span class="small muted">${i ? '1080 x 1920' : '1080 x 1080'} ${it.fileType}</span>${it.got[s + it.fileType] ? ' <span class="badge green">Downloaded</span>' : ''}</span>${btn('Download', 'imgGet', { arg: s, cls: 'secondary sm', icon: 'fa-download' })}</div>`).join('')}</div>`;
  return note('info', `<b>Image downloads are free.</b> They are not part of your order and you can download them any time.`) +
    sec('File type', `<div class="choices" role="radiogroup" aria-label="File type">${choice('I.fileType', 'JPG', 'JPG', 'Best for email, text and social')}${choice('I.fileType', 'PDF', 'PDF', 'Best for printing')}</div>`) + sec('Download', body);
};
A.imgGet = (s) => { const { it } = cur(); it.got[s + it.fileType] = true; touch(); toast(`${s} ${it.fileType} downloaded`); };
A.imgRetry = () => { const { e } = cur(); T.imgReady[e.id + 'img'] = false; };

/* ---------- Facebook Ad ---------- */
PANELS.fbad = (e, it) => {
  const o = it.own, end = it.start && it.days ? fmtD(addDays(parseD(it.start), +it.days)) : '';
  const pages = ['Chucky Norris Realty', 'Norris Home Team'];
  let own = '';
  if (it.page === 'own') {
    const steps = { none: 1, connecting: 1, connected: 2, pending: 3, approved: 4, rejected: 3, timeout: 3 }[o.state];
    own = `<div class="panel stack"><div class="small muted">Step ${Math.min(steps, 3)} of 3: connect, choose a page, get ad permission</div>`;
    if (o.state === 'none') own += `<p>Connect the Facebook account that manages your business page.</p><div>${btn('Connect Facebook account', 'fbConnect', { cls: 'primary', icon: 'fa-link' })}</div>`;
    else if (o.state === 'connecting') own += '<p role="status"><i class="fa-solid fa-rotate spin" aria-hidden="true"></i> Connecting to Facebook...</p>';
    else {
      own += `<div class="listrow" style="background:#fff"><i class="fa-brands fa-facebook" style="color:#1877F2" aria-hidden="true"></i><span class="grow"><b>Chucky Norris</b> <span class="small muted">connected</span></span>${o.rm ? `<span class="small">Remove this account?</span>${btn('Keep', 'fbRmCancel', { cls: 'sm link' })}${btn('Remove', 'fbRemove', { cls: 'sm danger' })}` : btn('Remove account', 'fbAskRm', { cls: 'sm link' })}</div>`;
      if (o.state === 'connected') own += `${sel('Business page', 'I.own.pageName', pages)}<div class="row wrap">${btn('Request ad placement permission', 'fbRequest', { cls: 'primary' })}<span class="xs muted">Facebook asks the page to let Xpressdocs place ads for it.</span></div>
        <div class="row xs muted"><label for="${mid('I.own.outcome')}">Mockup: outcome of the request</label><div style="width:150px">${sel('', 'I.own.outcome', [['approved', 'Approved'], ['rejected', 'Rejected'], ['timeout', 'Timed out']])}</div></div>`;
      if (o.state === 'pending') own += note('info', `<b>Waiting for approval on "${esc(o.pageName)}".</b> Approve the request in your Facebook notifications. We check the status every few seconds. <i class="fa-solid fa-rotate spin" aria-hidden="true"></i>`, { acts: btn('Resend request', 'fbRequest', { cls: 'sm secondary' }) + btn('Cancel request', 'fbReset', { cls: 'sm link' }) });
      if (o.state === 'approved') own += note('success', `<b>Approved.</b> The ad will post from "${esc(o.pageName)}".`, { acts: btn('Use a different page', 'fbReset', { cls: 'sm link' }) });
      if (o.state === 'rejected') own += note('error', `<b>The request was rejected on "${esc(o.pageName)}".</b> Start over to choose another page or send it again, or use the Xpressdocs page instead.`, { acts: btn('Reset', 'fbReset', { cls: 'sm secondary' }) + btn('Cancel and use the Xpressdocs page', 'fbUseXd', { cls: 'sm' }) });
      if (o.state === 'timeout') own += note('warning', `<b>The request timed out.</b> Facebook did not get an answer in time.`, { acts: btn('Resend request', 'fbRequest', { cls: 'sm secondary' }) + btn('Use the Xpressdocs page', 'fbUseXd', { cls: 'sm' }) });
    }
    own += '</div>';
  }
  let prev = '';
  if (it.preview === 'loading') prev = '<div class="fbad" aria-busy="true"><div class="top"><div class="skel" style="width:36px;height:36px;border-radius:50%"></div><div class="skel grow" style="height:14px"></div></div><div class="skel" style="height:180px;border-radius:0"></div></div><p class="small muted" role="status"><i class="fa-solid fa-rotate spin" aria-hidden="true"></i> Generating the preview. This can take up to 15 seconds.</p>';
  else if (it.preview === 'ready') prev = `<div data-live="fbPreview"></div><div class="row wrap">${btn('Refresh', 'fbPreview', { cls: 'sm', icon: 'fa-rotate' })}${btn('Open in a new tab', 'stub', { arg: 'Opens the Facebook-hosted ad preview in a new tab.', cls: 'sm', icon: 'fa-arrow-up-right-from-square' })}</div>`;
  else prev = `<p class="small muted">See the ad as it will appear in the Facebook feed.</p><div>${btn('Generate preview', 'fbPreview', { cls: 'secondary', icon: 'fa-eye' })}</div>`;
  return sec('Ad content', `${tf('Title', 'I.title', { req: 1, max: 60 })}${tf('Message', 'I.message', { area: 1, req: 1 })}${tf('Redirect URL', 'I.url', { type: 'url', req: 1, help: 'Where people go when they click the ad. Defaults to the listing URL.' })}<div data-live="fbErrContent"></div>`) +
    sec('Audience', `<div class="fgrid">${tf('Radius Centerpoint', 'I.center', { req: 1, cls: 'full', help: 'The ad is shown to people near this address.' })}<div class="full" data-live="fbCenter"></div>
      <div class="field full"><label for="${mid('I.radius')}">Radius Distance <span class="req" aria-hidden="true">*</span></label><div class="row"><input class="grow" id="${mid('I.radius')}" type="range" min="15" max="50" step="1" data-model="I.radius" value="${it.radius}" aria-describedby="rad-o"><output id="rad-o" class="b nowrap" data-live="fbRadius"></output></div><div class="helper">15 to 50 miles</div></div></div>`) +
    sec('Schedule', `<div class="fgrid">${tf('Start Date', 'I.start', { type: 'date', req: 1, min: iso(TODAY), maxv: iso(addDays(TODAY, 92)), help: 'Today up to three months ahead.' })}${tf('Duration', 'I.days', { type: 'number', num: 1, req: 1, min: FB_MIN_DAYS, maxv: 90, suffix: 'days', help: `${FB_MIN_DAYS} to 90 days.` })}</div><div data-live="fbSched"></div>
      ${S.ui.variant === 'approval' ? note('info', 'Your order needs approval. If it is approved after the start date, the ad starts on the approval date and still runs for the full duration.') : ''}`) +
    sec('Whose page posts the ad?', `<div class="choices" role="radiogroup" aria-label="Whose page posts the ad">${choice('I.page', 'xd', 'Xpressdocs business page', 'We post on your behalf. Nothing to set up.')}${choice('I.page', 'own', 'My Facebook business page', 'Personal branding. Needs a one-time connection.')}</div>${own}`, { id: 'sec-page' }) +
    sec('Ad preview', prev) +
    `<section class="card" aria-label="Price"><div class="card-h"><h3>${showP() ? 'Price for this ad' : 'Summary'}</h3></div><div data-live="priceBox"></div></section>`;
};
L.fbRadius = () => { const { it } = cur(); return it ? it.radius + ' miles' : ''; };
L.fbCenter = () => { const { it } = cur(); if (!it || it.center == null) return ''; return validAddr(it.center) ? '<span class="xs ok"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Address verified</span>' : '<div class="errmsg" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>We cannot find this address. Enter the street address, city and state.</span></div>'; };
L.fbSched = () => { const { e, it } = cur(); if (!it || it.days == null) return ''; const errs = problems(e, 'fbad').filter((p) => p.id === mid('I.days') || p.id === mid('I.start'));
  return errs.length ? errs.map((x) => `<div class="errmsg" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${x.msg}.</span></div>`).join('') : `<p class="small muted">Runs ${fmtD(it.start)} to ${fmtD(addDays(parseD(it.start), +it.days))}${showP() ? ` at ${money(FB_PER_DAY)} per day` : ''}.</p>`; };
L.fbErrContent = () => { const { e, it } = cur(); if (!it || it.title == null) return ''; const ids = [mid('I.title'), mid('I.message'), mid('I.url')]; return problems(e, 'fbad').filter((p) => ids.includes(p.id)).map((x) => `<div class="errmsg" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${x.msg}.</span></div>`).join(''); };
L.fbPreview = () => { const { e, it } = cur(); if (!it || it.title == null) return ''; const name = it.page === 'own' && it.own.state === 'approved' ? it.own.pageName : 'Xpressdocs Marketing';
  return `<div class="fbad"><div class="top"><span class="icon-chip"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i></span><div><div class="b">${esc(name)}</div><div class="xs muted">Sponsored</div></div></div><p style="padding:0 12px 10px">${esc(it.message)}</p>${design(e, 'fbad', 0, it)}<div class="bot"><div class="grow"><div class="xs muted">${esc((it.url || '').replace(/^https?:\/\//, '').split('/')[0])}</div><div class="b">${esc(it.title)}</div></div><span class="btn sm">Learn more</span></div></div>`; };
A.fbPreview = () => { const { it } = cur(); it.preview = 'loading'; setTimeout(() => { it.preview = 'ready'; render(); }, 2400); };
A.fbConnect = () => { const { it } = cur(); it.own.state = 'connecting'; setTimeout(() => { it.own.state = 'connected'; it.own.pageName = 'Chucky Norris Realty'; touch(); render(); }, 1200); };
A.fbRequest = () => { const { it } = cur(), o = it.own; o.state = 'pending'; touch(); clearTimeout(T.fbTimer); T.fbTimer = setTimeout(() => { if (o.state !== 'pending') return; o.state = o.outcome; touch(); render(); }, 3500); };
A.fbReset = () => { const o = cur().it.own; clearTimeout(T.fbTimer); o.state = 'connected'; touch(); };
A.fbUseXd = () => { const { it } = cur(); clearTimeout(T.fbTimer); it.page = 'xd'; it.own.state = 'connected'; touch(); };
A.fbAskRm = () => { cur().it.own.rm = true; };
A.fbRmCancel = () => { cur().it.own.rm = false; };
A.fbRemove = () => { const { it } = cur(); clearTimeout(T.fbTimer); it.own = { state: 'none', account: '', pageName: '', outcome: it.own.outcome }; touch(); toast('Facebook account removed'); };
