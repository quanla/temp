/* Cart, checkout (three variants), order complete. */
const APPROVER = 'Carla Reyes';
function totals(e) {
  const c = co(e), keys = cartKeys(e), w = work(e), subtotal = eventTotal(e);
  const promo = c.promo && PROMOS[c.promo] ? r2(subtotal * PROMOS[c.promo]) : 0;
  const shipped = keys.some((k) => w.items[k].method === 'ship'), svc = SERVICES.find((s) => s.id === c.service);
  const shipping = shipped && svc ? svc.price : 0, tax = r2((subtotal - promo) * TAX_RATE), total = r2(subtotal - promo + shipping + tax);
  let left = total; const take = (n) => { const x = r2(Math.max(0, Math.min(left, n || 0))); left = r2(left - x); return x; };
  const copay = S.ui.copay ? take(keys.reduce((s, k) => s + (c.copay[k] || 0), 0)) : 0, store = take(c.store), voucher = take(c.voucher ? CREDITS.voucher.amount : 0), ad = take(c.ad);
  const due = left, charges = [];
  if (due > 0 && S.ui.variant !== 'approval') {
    if (c.mode === 'card') { if (c.split) S.cards.forEach((cd) => { const a = +c.splits[cd.id] || 0; if (a > 0) charges.push({ label: `${cd.brand} ending ${cd.last4}`, amt: r2(a) }); }); else { const cd = S.cards.find((x) => x.id === c.card); if (cd) charges.push({ label: `${cd.brand} ending ${cd.last4}`, amt: due }); } }
    if (c.mode === 'acct' && c.acctOk) charges.push({ label: ACCOUNTS.find((a) => a.id === c.acct).label, amt: due });
    if (c.mode === 'gpay') charges.push({ label: 'Google Pay', amt: due });
  }
  const charged = r2(charges.reduce((s, x) => s + x.amt, 0));
  return { subtotal, promo, shipped, svc, shipping, tax, total, copay, store, voucher, ad, due, charges, charged, balance: r2(due - charged) };
}
function coErrors(e) {
  const c = co(e), t = totals(e), er = {};
  const probs = allProblems(e).filter((x) => !PRODUCTS[x.k].free);
  if (probs.length) er.items = probs.map((x) => `${PRODUCTS[x.k].label}: ${x.list[0].msg}`);
  if (t.shipped && !S.addresses.find((a) => a.id === c.addr)) er.ship = 'Choose or add a shipping address';
  if (t.shipped && !t.svc) er.service = 'Choose a service level';
  if (t.due > 0 && S.ui.variant !== 'approval') {
    if (c.mode === 'card') { if (c.split) { if (Math.abs(t.balance) > 0.004) er.pay = `Split amounts must add up to ${money(t.due)}. ${t.balance > 0 ? money(t.balance) + ' is not assigned to a card yet' : 'You are over by ' + money(-t.balance)}`; } else if (!S.cards.find((x) => x.id === c.card)) er.pay = 'Choose a card or add a new one'; }
    if (c.mode === 'acct') { if (!c.acct) er.pay = 'Select a billing account'; else if (!c.acctOk) er.pay = 'Fill in the billing account fields and select Apply'; }
  }
  if (!c.terms) er.terms = 'Accept the terms and conditions';
  return er;
}
const errLine = (m, id) => (m ? `<div class="errmsg" role="alert"${id ? ` id="${id}"` : ''}><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${m}.</span></div>` : '');
const addrLine = (a) => `${esc(a.name)}${a.company ? ', ' + esc(a.company) : ''}<br><span class="small muted">${esc(a.a1)}${a.a2 ? ', ' + esc(a.a2) : ''}, ${esc(a.city)}, ${esc(a.st)} ${esc(a.zip)}${a.biz ? ' · Business address' : ''}</span>`;

function itemRow(e, k) {
  const c = co(e), p = priceItem(e, k), P = PRODUCTS[k], open = c.open[k], probs = problems(e, k);
  let copay = '';
  if (S.ui.copay && showP()) {
    if (k === 'postcard') copay = c.copay[k] ? `<div class="row wrap small"><span class="badge green">Copay Applied</span><span>Acme Brand Fund pays ${money(c.copay[k])}</span>${btn('Remove copay', 'copayRemove', { arg: k, cls: 'sm link' })}</div>`
      : c.copayForm === k ? `<div class="panel stack"><h4>Apply copay</h4><div class="fgrid">${sel('Copay program', 'C.copayProg', [['fund', 'Acme Brand Fund: 50% up to $25.00']])}${tf('MLS number', 'C.copayMls', { req: 1, ph: 'For example 20481177', err: c.copayErr ? 'Enter the MLS number for this listing' : '' })}</div><div class="row">${btn('Apply copay', 'copayApply', { arg: k, cls: 'sm primary' })}${btn('Cancel', 'copayCancel', { cls: 'sm link' })}</div></div>`
        : `<div class="row wrap small"><span class="badge blue">Copay Available</span><span class="muted">Your company can share this cost.</span>${btn('Apply copay', 'copayOpen', { arg: k, cls: 'sm secondary' })}</div>`;
    else if (P.print) copay = `<div class="small"><span class="badge">Copay unavailable</span> ${btn(c.copayWhy === k ? 'Hide reason' : 'Why?', 'copayWhy', { arg: k, cls: 'sm link blue' })}
      ${c.copayWhy === k ? `<div class="panel" style="margin-top:6px"><p>Copay for this property has already been used on these orders:</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Order number</th><th>Name</th><th class="right">Amount</th></tr></thead><tbody><tr><td>48190022</td><td>Dana Whitfield</td><td class="right">$25.00</td></tr><tr><td>48177310</td><td>Chucky Norris</td><td class="right">$25.00</td></tr></tbody></table></div></div>` : ''}</div>`;
  }
  return `<div class="item"><div class="pthumb">${design(e, k, 0, work(e).items[k])}</div>
    <div class="stack tight"><div><h4>${P.label}</h4><div class="small muted">${esc(p.summary)}</div></div>
      ${probs.length ? errLine(probs[0].msg) : ''}${copay}
      <div class="row wrap"><button class="btn sm link blue" data-act="coToggle" data-arg="${k}" aria-expanded="${!!open}"><i class="fa-solid fa-chevron-${open ? 'up' : 'down'}" aria-hidden="true"></i>${open ? 'Hide details' : 'Details'}</button><a class="btn sm link blue" href="#/event/${e.id}/p/${k}?from=cart"><i class="fa-solid fa-pen" aria-hidden="true"></i>Edit<span class="sr"> ${P.label}</span></a>${btn('Delete', 'askRemoveCart', { arg: k, cls: 'sm link', icon: 'fa-trash', aria: 'Delete ' + P.label })}</div>
      ${open ? `<div class="breakdown">${p.lines.map((x) => `<div class="kv small"><span><span class="muted">${x.l}:</span> ${esc(x.v)}</span><span>${x.p == null ? '' : pr(x.p)}</span></div>`).join('')}</div>` : ''}</div>
    <div class="b iprice right">${p.noPrice ? '<span class="bad small">No price</span>' : pr(p.total)}</div></div>`;
}
function shippingSec(e, er) {
  const c = co(e), f = c.form;
  const form = f ? `<div class="panel stack"><h4>${f.id ? 'Edit address' : 'Add a new address'}</h4><div class="fgrid">${tf('Name', 'C.form.name', { req: 1, auto: 'name', err: c.formErr && !f.name.trim() ? 'Enter a name' : '' })}${tf('Company', 'C.form.company', { auto: 'organization' })}${tf('Phone', 'C.form.phone', { type: 'tel', auto: 'tel' })}${sel('Country', 'C.form.country', ['United States', 'Canada'])}
      ${tf('Address 1', 'C.form.a1', { req: 1, cls: 'full', auto: 'address-line1', err: c.formErr && !f.a1.trim() ? 'Enter the street address' : '' })}${tf('Address 2 / suite', 'C.form.a2', { cls: 'full', auto: 'address-line2' })}
      ${tf('City', 'C.form.city', { req: 1, err: c.formErr && !f.city.trim() ? 'Enter the city' : '' })}<div class="fgrid">${tf('State', 'C.form.st', { req: 1, max: 2, err: c.formErr && !f.st.trim() ? 'Required' : '' })}${tf('Zip', 'C.form.zip', { req: 1, max: 10, err: c.formErr && !/^\d{5}/.test(f.zip) ? 'Enter a zip' : '' })}</div>
      <div class="full">${chk('C.form.biz', 'Is this a business address?')}</div></div><div class="row">${btn('Save address', 'addrSave', { cls: 'primary sm' })}${btn('Cancel', 'addrCancel', { cls: 'link sm' })}</div></div>` : '';
  return `<section class="card stack" id="co-ship" tabindex="-1" aria-labelledby="ship-h"><h3 id="ship-h">Shipping</h3><p class="small muted">For the products you chose to have shipped.</p>
    <div class="stack tight" role="radiogroup" aria-label="Shipping address">${S.addresses.map((a) => c.rmAddr === a.id ? `<div class="listrow"><span class="grow">Delete the address for <b>${esc(a.name)}</b>, ${esc(a.a1)}?</span>${btn('Keep', 'addrRmCancel', { cls: 'sm link' })}${btn('Delete address', 'addrRm', { arg: a.id, cls: 'sm danger' })}</div>`
    : `<div class="choice ${c.addr === a.id ? 'on' : ''}" style="cursor:default">${rad('C.addr', a.id, addrLine(a))}<span class="grow"></span>${ibtn('fa-pen', 'addrEdit', a.id, 'Edit address')}${ibtn('fa-trash', 'addrAskRm', a.id, 'Delete address', 'del')}</div>`).join('')}</div>
    ${er.ship ? errLine(er.ship) : ''}${f ? form : `<div>${btn('Add a new address', 'addrNew', { cls: 'secondary sm', icon: 'fa-plus' })}</div>`}
    <div class="sub stack" id="co-svc" tabindex="-1"><h4>Service level</h4>${S.addresses.find((a) => a.id === c.addr) ? `<div class="choices" role="radiogroup" aria-label="Service level">${SERVICES.map((s) => choice('C.service', s.id, s.label, 'Estimated delivery ' + fmtDow(addBiz(TODAY, s.days + 2)), pr(s.price))).join('')}</div>` : '<p class="small muted">Choose an address to see service levels and delivery dates.</p>'}${er.service ? errLine(er.service) : ''}</div></section>`;
}
function creditsSec(e) {
  const c = co(e);
  const amt = (key, label, avail) => `<div class="row wrap between"><div><b>${label}</b><div class="xs muted">${money(avail)} available</div></div>${c[key] ? `<span class="row"><span class="badge green">${money(c[key])} applied</span>${btn('Remove', 'creditRm', { arg: key, cls: 'sm link' })}</span>`
    : `<span class="row"><label class="sr" for="${mid('C.' + key + 'In')}">${label} amount to apply</label><input class="input num" id="${mid('C.' + key + 'In')}" data-model="C.${key}In" data-num type="number" min="0" max="${avail}" step="0.01" placeholder="0.00" value="${esc(c[key + 'In'])}" data-enter="creditApply" data-arg="${key}">${btn('Apply', 'creditApply', { arg: key, cls: 'sm secondary' })}</span>`}</div>${c.creditErr === key ? errLine(`Enter an amount up to ${money(avail)}`) : ''}`;
  return `<section class="card stack" aria-labelledby="cr-h"><h3 id="cr-h">Credits</h3>
    <div class="row wrap between"><div><b>Promo code</b><div class="xs muted">Mockup: try ACME10</div></div>${c.promo ? `<span class="chip">${c.promo} · ${PROMOS[c.promo] * 100}% off<button data-act="promoRm" aria-label="Remove promo code">&times;</button></span>`
    : `<span class="row"><label class="sr" for="${mid('C.promoIn')}">Promo code</label><input class="input" style="width:140px" id="${mid('C.promoIn')}" data-model="C.promoIn" placeholder="Enter code" value="${esc(c.promoIn)}" data-enter="promoApply">${btn('Apply', 'promoApply', { cls: 'sm secondary' })}</span>`}</div>${c.promoErr ? errLine('That code is not valid for this order') : ''}
    ${showP() ? `<hr class="divider" style="margin:0">${amt('store', 'Store credit', CREDITS.store)}<hr class="divider" style="margin:0"><div class="row between wrap">${chk('C.voucher', `<b>${CREDITS.voucher.label}</b><br><span class="xs muted">One-time voucher</span>`)}<span>${money(CREDITS.voucher.amount)}</span></div><hr class="divider" style="margin:0">${amt('ad', 'Ad budget', CREDITS.adBudget)}` : ''}</section>`;
}
function paymentSec(e, er) {
  const c = co(e), t = totals(e);
  if (S.ui.variant === 'approval') return `<section class="card stack" id="co-pay" tabindex="-1" aria-labelledby="pay-h"><h3 id="pay-h">Payment</h3>${note('info', `<b>You do not pay for this order.</b> ${APPROVER} reviews it and chooses the payment. Nothing is charged or produced until it is approved.`)}</section>`;
  if (t.due <= 0) return `<section class="card stack" id="co-pay" tabindex="-1" aria-labelledby="pay-h"><h3 id="pay-h">Payment</h3>${note('success', '<b>Nothing to pay.</b> Your credits cover this order.')}</section>`;
  let body = '';
  if (c.mode === 'card') {
    const cf = c.cardForm;
    body = `<div class="stack tight">${S.cards.map((cd) => { const on = c.split ? (+c.splits[cd.id] > 0) : c.card === cd.id; return `<div class="choice ${on ? 'on' : ''}" style="cursor:default;flex-wrap:wrap">${c.split ? '' : `<span class="radio"><input type="radio" name="card" data-model="C.card" value="${cd.id}" ${on ? 'checked' : ''} aria-label="${cd.brand} ending ${cd.last4}"><span class="dot"></span></span>`}<i class="fa-brands fa-cc-${cd.brand.toLowerCase()}" style="font-size:22px;line-height:22px" aria-hidden="true"></i>
        <span class="grow"><b>${cd.brand} ending ${cd.last4}</b> ${cd.def ? '<span class="badge">Default</span>' : ''}<br><span class="xs muted">${esc(cd.name)} · expires ${cd.exp}</span></span>
        ${c.split && showP() ? `<label class="sr" for="${mid('C.splits.' + cd.id)}">Amount on ${cd.brand} ending ${cd.last4}</label><input class="input num" id="${mid('C.splits.' + cd.id)}" data-model="C.splits.${cd.id}" data-num type="number" min="0" step="0.01" placeholder="0.00" value="${esc(c.splits[cd.id] == null ? '' : c.splits[cd.id])}">` : ''}
        ${cd.def ? '' : btn('Make default', 'cardDefault', { arg: cd.id, cls: 'sm link blue' })}${ibtn('fa-pen', 'cardEdit', cd.id, 'Edit card')}${ibtn('fa-trash', 'cardRm', cd.id, 'Remove card', 'del')}</div>`; }).join('')}</div>
      ${c.split ? '<div data-live="splitInfo"></div>' : ''}
      ${cf ? `<div class="panel stack"><h4>${cf.id ? 'Edit card' : 'Add a new card'}</h4><div class="fgrid">${cf.id ? '' : tf('Card number', 'C.cardForm.number', { req: 1, cls: 'full', ph: '4111 1111 1111 1111', auto: 'off', help: 'Mockup: use a fake number such as 4111 1111 1111 1111.', err: c.cardErr && String(cf.number).replace(/\D/g, '').length < 12 ? 'Enter the card number' : '' })}
          ${tf('Name on card', 'C.cardForm.name', { req: 1, cls: 'full', err: c.cardErr && !cf.name.trim() ? 'Enter the name on the card' : '' })}${tf('Expiration', 'C.cardForm.exp', { req: 1, ph: 'MM/YY', max: 5, err: c.cardErr && !/^\d\d\/\d\d$/.test(cf.exp) ? 'Use MM/YY' : '' })}${cf.id ? '' : tf('CVV', 'C.cardForm.cvv', { req: 1, max: 4, ph: '123', err: c.cardErr && !/^\d{3,4}$/.test(cf.cvv) ? 'Enter the 3 or 4 digit code' : '' })}
          ${sel('Billing address', 'C.cardForm.bill', S.addresses.map((a) => [a.id, `${a.a1}, ${a.city}, ${a.st} ${a.zip}`]), { cls: 'full' })}${cf.id ? '' : `<div class="full">${chk('C.cardForm.save', 'Save this card to my profile')}</div>`}</div>
          <div class="row">${btn(cf.id ? 'Save card' : 'Add card', 'cardSave', { cls: 'primary sm' })}${btn('Cancel', 'cardCancel', { cls: 'link sm' })}</div></div>` : `<div>${btn('Add a new card', 'cardNew', { cls: 'secondary sm', icon: 'fa-plus' })}</div>`}
      ${showP() && S.cards.length > 1 ? `<div class="sub">${sw('C.split', '<span><b>Split the charge across several cards</b><br><span class="xs muted">Enter an amount for each card. Not available with Google Pay.</span></span>', { then: 'splitInit' })}</div>` : ''}`;
  } else if (c.mode === 'acct') {
    const a = ACCOUNTS.find((x) => x.id === c.acct);
    body = c.acctOk ? note('success', `<b>${a.label} applied.</b> ${a.fields.map((f) => `${f}: ${esc(c.acctVals[f])}`).join(' · ')}`, { acts: btn('Change', 'acctChange', { cls: 'sm' }) })
      : `<div class="fgrid">${sel('Billing account', 'C.acct', [['', 'Select an account'], ...ACCOUNTS.map((x) => [x.id, x.label])], { cls: 'full', req: 1 })}${a ? a.fields.map((f) => tf(f, 'C.acctVals.' + f, { req: 1, err: c.acctErr && !String(c.acctVals[f] || '').trim() ? 'Required' : '' })).join('') : ''}</div>${a ? `<div>${btn('Apply', 'acctApply', { cls: 'primary sm' })}</div>` : ''}`;
  } else body = `<div class="row wrap"><span class="btn" style="background:#000;color:#fff;cursor:default"><i class="fa-brands fa-google-pay" style="font-size:28px" aria-hidden="true"></i></span><span class="small muted">You confirm in Google Pay after you select ${S.ui.variant === 'approver' ? 'Approve' : 'Complete Checkout'}.</span></div>`;
  return `<section class="card stack" id="co-pay" tabindex="-1" aria-labelledby="pay-h"><h3 id="pay-h">Payment</h3>
    <div class="choices" role="radiogroup" aria-label="Payment method">${choice('C.mode', 'card', '<i class="fa-regular fa-credit-card" aria-hidden="true"></i> Credit card', 'Saved or new')}${choice('C.mode', 'acct', '<i class="fa-solid fa-building-columns" aria-hidden="true"></i> Billing account', 'Corporate billing')}${choice('C.mode', 'gpay', '<i class="fa-brands fa-google" aria-hidden="true"></i> Google Pay', c.split ? 'Turn off split payment to use' : 'Digital wallet', '', { dis: c.split })}</div>
    ${body}${er.pay ? errLine(er.pay, 'pay-err') : ''}</section>`;
}
L.splitInfo = () => { const e = ev(route().id); if (!e) return ''; const t = totals(e); return Math.abs(t.balance) < 0.005 ? `<p class="small ok"><i class="fa-solid fa-check" aria-hidden="true"></i> The cards add up to ${money(t.due)}.</p>` : `<p class="small warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${t.balance > 0 ? money(t.balance) + ' of ' + money(t.due) + ' still to assign.' : 'Over by ' + money(-t.balance) + '.'}</p>`; };
L.coSummary = () => {
  const e = ev(route().id); if (!e) return ''; const t = totals(e), c = co(e), n = cartKeys(e).length;
  if (!showP()) return `<div class="kv"><span>Products</span><span>${n}</span></div>${cartKeys(e).map((k) => `<div class="kv small"><span class="muted">${PRODUCTS[k].label}</span><span>${pieces(e, k)}</span></div>`).join('')}<p class="xs muted" style="margin-top:8px">Pricing is managed by your company.</p>`;
  const neg = (l, v) => (v ? `<div class="kv"><span>${l}</span><span class="ok">-${money(v)}</span></div>` : '');
  return `<div class="kv"><span>Subtotal (${plural(n, 'product')})</span><span>${money(t.subtotal)}</span></div>${neg(`Promo code ${c.promo}`, t.promo)}
    ${t.shipped ? `<div class="kv"><span>Shipping${t.svc ? ` <span class="muted small">${t.svc.label}</span>` : ''}</span><span>${t.svc ? money(t.shipping) : '<span class="muted small">Choose a service</span>'}</span></div>` : ''}
    <div class="kv"><span>Sales tax</span><span>${money(t.tax)}</span></div><div class="kv total"><span>Total</span><span>${money(t.total)}</span></div>
    ${t.copay + t.store + t.voucher + t.ad > 0 ? `<div class="xs muted" style="margin-top:8px">Credits applied</div>${neg('Copay', t.copay)}${neg('Store credit', t.store)}${neg('Voucher', t.voucher)}${neg('Ad budget', t.ad)}` : ''}
    ${S.ui.variant === 'approval' ? `<p class="xs muted" style="margin-top:8px">Payment is chosen by your approver.</p>` : `<div class="xs muted" style="margin-top:8px">Charged to</div>${t.charges.length ? t.charges.map((x) => `<div class="kv"><span>${x.label}</span><span>${money(x.amt)}</span></div>`).join('') : `<div class="kv"><span class="muted">${t.due > 0 ? 'No payment method yet' : 'Nothing to charge'}</span><span>${money(0)}</span></div>`}
    <div class="kv b"><span>Balance remaining</span><span class="${Math.abs(t.balance) > 0.004 ? 'bad' : ''}">${money(t.balance)}</span></div>`}`;
};
function finalButtons(e, block) {
  const v = S.ui.variant, cls = `btn primary ${block ? 'block' : ''}`;
  if (T.placing) return `<button class="${cls}" disabled><i class="fa-solid fa-rotate spin" aria-hidden="true"></i>Working...</button>`;
  return v === 'approver' ? `<button class="${cls}" data-act="placeOrder">Approve</button>${btn('Save and Return to Dashboard', 'saveReturn', { cls: 'secondary ' + (block ? 'block' : '') })}`
    : `<button class="${cls}" data-act="placeOrder">${v === 'approval' ? 'Submit for Approval' : 'Complete Checkout'}</button>`;
}
L.coBar = () => { const e = ev(route().id); if (!e) return ''; const t = totals(e); return `<div class="b">${showP() ? 'Total ' + money(t.total) : plural(cartKeys(e).length, 'product')}</div><div class="xs muted">${S.ui.variant === 'approval' ? 'Sent to your approver' : showP() && t.charges[0] ? t.charges.map((x) => x.label).join(' + ') : ''}</div>`; };

SCREENS.checkout = (r) => {
  const e = ev(r.id); if (!e) return SCREENS.notfound();
  if (e.status === 'done') return SCREENS.complete(r);
  const c = co(e), keys = cartKeys(e), free = freeKeys(e), v = S.ui.variant, t = totals(e), er = c.showErr ? coErrors(e) : {}, social = work(e).items.social;
  const head = crumbs([['Events', '#/events'], [e.a1, '#/event/' + e.id], [v === 'approver' ? 'Approve order' : 'Cart and checkout']]) + stepsNav(e, 'cart');
  if (!keys.length) return { html: `<div class="page">${head}<div class="empty"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i><h1>Your cart is empty</h1><p>There are no priced products in this event. Add a product from the overview.</p><p style="margin-top:14px"><a class="btn primary" href="#/event/${e.id}">Back to the overview</a></p></div></div>` };
  const erList = Object.entries(er).flatMap(([k, m]) => (Array.isArray(m) ? m.map((x) => [k, x]) : [[k, m]]));
  const target = { items: 'co-items', ship: 'co-ship', service: 'co-svc', pay: 'co-pay', terms: 'co-terms' };
  return { barNarrow: true, bar: `<div class="grow" data-live="coBar"></div>${finalButtons(e)}`, html: `<div class="page">${head}
    <div class="row between wrap" style="margin-bottom:12px"><div><h1>${v === 'approver' ? `Approve order for ${esc(e.agent)}` : 'Cart and checkout'}</h1><p class="muted">${TYPES[e.type].label}, ${esc(e.a1)}, ${esc(e.city)}</p></div><span data-live="save"></span></div>
    <div class="stack" style="margin-bottom:16px">${v === 'approver' ? note('info', `<b>You are the approver.</b> ${esc(e.agent)} submitted this cart. Review it, change the payment if needed, then approve. Or save your changes and come back later.`) : ''}
      ${v === 'approval' ? note('info', `<b>This order needs approval.</b> When you submit, ${APPROVER} gets it for review. You will get an email when it is approved, and nothing is charged before then.`) : ''}
      ${pastOpenHouse(e) ? note('warning', `The open house date (${fmtDow(e.oh.date)}) has passed. <a href="#/event/${e.id}">Go back to change it</a>.`) : ''}</div>
    <div class="split wide-aside"><div class="stack">
      <section class="card" id="co-items" tabindex="-1" aria-labelledby="it-h"><div class="card-h"><h3 id="it-h">Products (${keys.length})</h3><a class="btn sm link blue" href="#/event/${e.id}"><i class="fa-solid fa-plus" aria-hidden="true"></i>Add or change products</a></div>
        ${keys.map((k) => itemRow(e, k)).join('')}
        ${free.length ? `<div class="sub" style="margin-top:4px"><div class="xs muted" style="margin-bottom:6px">Also in this event, free and not part of the order</div><div class="stack tight">${free.map((k) => `<div class="listrow"><i class="fa-solid ${PRODUCTS[k].icon} muted" aria-hidden="true"></i><span class="grow"><b>${PRODUCTS[k].label}</b> <span class="small muted">${esc(summaryOf(e, k))}</span></span><a class="btn sm link blue" href="#/event/${e.id}/p/${k}?from=cart">${k === 'social' && !social.result && !social.scheduled ? 'Review and post' : 'Open'}</a></div>`).join('')}</div></div>` : ''}</section>
      ${t.shipped ? shippingSec(e, er) : ''}${creditsSec(e)}${paymentSec(e, er)}
      <section class="card stack" id="co-terms" tabindex="-1" aria-labelledby="tm-h"><h3 id="tm-h">Terms and conditions</h3>
        <div class="row wrap">${chk('C.terms', 'I have reviewed my designs and accept the terms and conditions', { req: 1 })}<button class="btn sm link blue" data-act="termsToggle" aria-expanded="${c.termsOpen}">${c.termsOpen ? 'Hide the terms' : 'Read the terms'}</button></div>
        ${c.termsOpen ? `<div class="panel small" style="max-height:180px;overflow:auto" tabindex="0"><p><b>Terms and conditions (sample text).</b> You are responsible for the accuracy of your artwork, including spelling, prices, photos, license numbers and required disclosures. Orders go to production once placed and cannot be changed after that point.</p><p style="margin-top:8px">Mail delivery times are estimates from USPS and are not guaranteed. Mailing lists are licensed for one use. Digital ads are subject to the platform's review and may be delayed or declined. Refunds are handled by support at ${PHONE}.</p></div>` : ''}
        ${er.terms ? errLine(er.terms) : ''}</section></div>
      <aside class="card aside-sticky stack" aria-labelledby="os-h"><h3 id="os-h">Order summary</h3><div data-live="coSummary"></div>
        ${erList.length ? `<div class="stack tight" id="co-errs" role="alert"><div class="small b bad">Fix ${plural(erList.length, 'thing')} to continue:</div>${erList.map(([k, m]) => `<div class="errmsg"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><a href="#" data-act="focusId" data-arg="${target[k]}">${m}</a></div>`).join('')}</div>` : ''}
        ${finalButtons(e, true)}<p class="xs muted center">Need help? Call ${PHONE}</p></aside></div></div>` };
};
A.coToggle = (k) => { const c = co(ev(route().id)); c.open[k] = !c.open[k]; };
A.termsToggle = () => { const c = co(ev(route().id)); c.termsOpen = !c.termsOpen; };
A.askRemoveCart = (k) => { openModal('confirm', { title: `Delete ${PRODUCTS[k].label.toLowerCase()} from the cart?`, text: 'The product is removed from this order. Your design is kept, so you can add it back from the overview.', yes: 'Delete product', act: 'removeProduct', arg: k, danger: 1 }); };
const C0 = () => co(ev(route().id));
A.copayOpen = (k) => { const c = C0(); c.copayForm = k; c.copayProg = 'fund'; c.copayMls = c.copayMls || ''; c.copayErr = false; };
A.copayCancel = () => { C0().copayForm = null; };
A.copayApply = (k) => { const c = C0(), e = ev(route().id); if (!String(c.copayMls).trim()) { c.copayErr = true; return; } c.copay[k] = Math.min(25, r2(priceItem(e, k).total / 2)); c.copayForm = null; touch(); };
A.copayRemove = (k) => { delete C0().copay[k]; touch(); };
A.copayWhy = (k) => { const c = C0(); c.copayWhy = c.copayWhy === k ? null : k; };
/* Addresses */
A.addrNew = () => { const c = C0(); c.form = { id: null, name: '', company: '', phone: '', country: 'United States', a1: '', a2: '', city: '', st: '', zip: '', biz: false }; c.formErr = false; };
A.addrEdit = (id) => { const c = C0(); c.form = { ...S.addresses.find((a) => a.id === id) }; c.formErr = false; };
A.addrCancel = () => { C0().form = null; };
A.addrSave = () => { const c = C0(), f = c.form; if (!f.name.trim() || !f.a1.trim() || !f.city.trim() || !f.st.trim() || !/^\d{5}/.test(f.zip)) { c.formErr = true; return; } if (f.id) Object.assign(S.addresses.find((a) => a.id === f.id), f); else { f.id = 'a' + Date.now(); S.addresses.push(f); } c.addr = f.id; c.form = null; touch(); toast('Address saved'); };
A.addrAskRm = (id) => { C0().rmAddr = id; };
A.addrRmCancel = () => { C0().rmAddr = null; };
A.addrRm = (id) => { const c = C0(); S.addresses = S.addresses.filter((a) => a.id !== id); c.rmAddr = null; if (c.addr === id) { c.addr = ''; c.service = ''; } touch(); };
/* Credits */
A.promoApply = () => { const c = C0(), code = String(c.promoIn).trim().toUpperCase(); if (PROMOS[code]) { c.promo = code; c.promoErr = false; c.promoIn = ''; } else c.promoErr = true; touch(); };
A.promoRm = () => { C0().promo = ''; touch(); };
A.creditApply = (key) => { const c = C0(), max = key === 'store' ? CREDITS.store : CREDITS.adBudget, v = +c[key + 'In']; if (!(v > 0) || v > max) { c.creditErr = key; return; } c[key] = r2(v); c.creditErr = null; touch(); };
A.creditRm = (key) => { const c = C0(); c[key] = 0; c[key + 'In'] = ''; touch(); };
/* Payment */
A.splitInit = () => { const c = C0(), e = ev(route().id); if (c.split) { const t = totals(e), half = r2(t.due / 2); c.splits = {}; S.cards.forEach((cd, i) => { c.splits[cd.id] = i === 0 ? r2(t.due - half) : i === 1 ? half : ''; }); if (c.mode === 'gpay') c.mode = 'card'; } };
A.cardNew = () => { const c = C0(); c.cardForm = { id: null, number: '', name: '', exp: '', cvv: '', bill: (S.addresses[0] || {}).id, save: true }; c.cardErr = false; };
A.cardEdit = (id) => { const c = C0(), cd = S.cards.find((x) => x.id === id); c.cardForm = { id, name: cd.name, exp: cd.exp, bill: (S.addresses[0] || {}).id }; c.cardErr = false; };
A.cardCancel = () => { C0().cardForm = null; };
A.cardSave = () => {
  const c = C0(), f = c.cardForm, num = String(f.number || '').replace(/\D/g, '');
  if (!f.name.trim() || !/^\d\d\/\d\d$/.test(f.exp) || (!f.id && (num.length < 12 || !/^\d{3,4}$/.test(f.cvv)))) { c.cardErr = true; return; }
  if (f.id) Object.assign(S.cards.find((x) => x.id === f.id), { name: f.name, exp: f.exp });
  else { const id = 'c' + Date.now(); S.cards.push({ id, brand: num[0] === '5' ? 'Mastercard' : num[0] === '3' ? 'Amex' : 'Visa', last4: num.slice(-4), name: f.name, exp: f.exp, def: false }); c.card = id; }
  c.cardForm = null; touch(); toast(f.id ? 'Card updated' : f.save ? 'Card added and saved to your profile' : 'Card added for this order');
};
A.cardDefault = (id) => { S.cards.forEach((cd) => { cd.def = cd.id === id; }); toast('Default card updated'); };
A.cardRm = (id) => { const cd = S.cards.find((x) => x.id === id); openModal('confirm', { title: 'Remove this card?', text: `${cd.brand} ending ${cd.last4} will be removed from your profile.`, yes: 'Remove card', act: 'cardRmYes', arg: id, danger: 1 }); };
A.cardRmYes = (id) => { const c = C0(); S.cards = S.cards.filter((x) => x.id !== id); if (S.cards.length && !S.cards.some((x) => x.def)) S.cards[0].def = true; if (c.card === id) c.card = (S.cards[0] || {}).id || ''; delete c.splits[id]; if (S.cards.length < 2) c.split = false; closeModal(); touch(); };
A.acctApply = () => { const c = C0(), a = ACCOUNTS.find((x) => x.id === c.acct); if (a.fields.some((f) => !String(c.acctVals[f] || '').trim())) { c.acctErr = true; return; } c.acctOk = true; c.acctErr = false; touch(); };
A.acctChange = () => { C0().acctOk = false; };

A.placeOrder = () => {
  const e = ev(route().id), c = co(e), er = coErrors(e), first = Object.keys(er)[0];
  if (first) { c.showErr = true; render(); A.focusId({ items: 'co-items', ship: 'co-ship', service: 'co-svc', pay: 'co-pay', terms: 'co-terms' }[first]); return false; }
  T.placing = true; setTimeout(() => { T.placing = false; finishEvent(e, S.ui.variant); }, 1300);
};
A.saveReturn = () => { toast('Changes saved'); go('#/approvals'); return false; };
function finishEvent(e, kind) {
  if (kind === 'approval') { e.status = 'submitted'; S.flash = { a1: e.a1 }; persist(); go('#/events'); return; }
  const t = cartKeys(e).length ? totals(e) : { total: 0 };
  Object.assign(e, { status: 'done', cartNo: String(48213000 + (parseInt(e.id.replace(/\D/g, ''), 10) || 7) * 907), total: t.total, doneKind: kind });
  persist(); go(`#/event/${e.id}/complete`);
}

/* ---------- Order complete ---------- */
SCREENS.complete = (r) => {
  const e = ev(r.id); if (!e) return SCREENS.notfound();
  if (e.status !== 'done') return SCREENS.overview(r);
  const has = hasWork(e), w = has ? work(e) : null, keys = has ? cartKeys(e) : [], free = has ? freeKeys(e) : [], kind = e.doneKind || 'normal';
  const next = S.events.filter((x) => x.agent === e.agent && x.status !== 'done' && x.status !== 'submitted');
  const files = [];
  keys.forEach((k) => { const it = w.items[k]; if (PRODUCTS[k].print && (it.pdf || it.method === 'download')) PRODUCTS[k].sides.forEach((s) => files.push([`${PRODUCTS[k].label}, ${s}`, it.method === 'download' ? it.fileType : 'PDF'])); });
  if (free.includes('image')) PRODUCTS.image.sides.forEach((s) => files.push([`Image, ${s}`, w.items.image.fileType]));
  const social = free.includes('social') ? w.items.social : null;
  return { html: `<div class="page narrow stack loose">
    <div class="card center" style="padding:28px 20px"><div class="bigcheck"><i class="fa-solid fa-check" aria-hidden="true"></i></div>
      <h1>${kind === 'free' ? 'All set' : kind === 'approver' ? 'Order approved' : 'Order placed'}</h1>
      <p style="margin-top:4px">${TYPES[e.type].label} for <b>${esc(e.a1)}</b></p>
      ${kind === 'free' ? '<p class="muted">Nothing was ordered. Your free items are below.</p>' : `<p class="b" style="font-size:16px;margin-top:8px">Cart #${e.cartNo}</p><p class="muted">We sent an email with the details to chucky.norris@acme.example.${showP() && e.total ? ' Total ' + money(e.total) + '.' : ''}</p>`}</div>
    ${keys.length ? `<section class="card" aria-labelledby="oc-h"><div class="card-h"><h3 id="oc-h">What you ordered</h3></div>${keys.map((k) => { const p = priceItem(e, k); return `<div class="kv"><span><b>${PRODUCTS[k].label}</b><br><span class="small muted">${esc(p.summary)}</span></span><span>${pr(p.total)}</span></div>`; }).join('')}</section>` : ''}
    ${files.length ? `<section class="card stack" aria-labelledby="dl-h"><h3 id="dl-h">Your files</h3><div class="stack tight">${files.map(([l, t]) => `<div class="listrow"><i class="fa-regular fa-file muted" aria-hidden="true"></i><span class="grow">${l} <span class="small muted">${t}</span></span>${btn('Download', 'dlSide', { arg: l, cls: 'sm secondary', icon: 'fa-download' })}</div>`).join('')}</div></section>` : ''}
    ${social ? (social.result || social.scheduled ? note('success', `<b>Social Media:</b> ${esc(summaryOf(e, 'social'))}.`) : note('info', '<b>Your social post has not gone out.</b> Share it now to your connected accounts, or skip it.', { acts: btn('Post now', 'postFromDone', { cls: 'sm primary' }) })) : ''}
    <div class="panel"><div class="panel-h">${next.length ? `You have ${plural(next.length, 'available event')}` : 'No more events waiting'}${next.length ? '<a href="#/events">View All</a>' : ''}</div>
      <div class="stack tight">${next.slice(0, 2).map(eventRow).join('')}</div></div>
    <div class="row wrap between"><div class="row wrap"><a class="btn primary" href="#/events">Back to events</a><a class="btn" href="#/xpresso">Go to the main site</a>${btn('Order more for this listing', 'reopen', { arg: e.id, cls: 'link blue' })}</div><span class="small muted">Questions? Call <a href="tel:8669773627">${PHONE}</a></span></div></div>` };
};
A.postFromDone = () => { const e = ev(route().id), it = work(e).items.social; it.result = PLATFORMS.filter((p) => p.on && it.plats[p.id]).map((p) => ({ id: p.id, ok: true })); toast('Posted to your connected accounts'); };
A.reopen = (id) => { const e = ev(id); openModal('confirm', { title: 'Order more for this listing?', text: 'This reopens the event with the same designs so you can order again or add products. Your completed order is not changed.', yes: 'Reopen event', act: 'reopenYes', arg: id }); };
A.reopenYes = (id) => { const e = ev(id); e.status = 'progress'; delete S.co[e.id]; T.modal = null; go('#/event/' + id); return false; };

/* ---------- Cart drawer from the header ---------- */
A.openCart = () => { openModal('cart', {}); };
MODALS.cart = () => {
  const e = ev(S.cur), live = e && e.status !== 'done', keys = live ? cartKeys(e) : [];
  if (!keys.length) return { kind: 'drawer', w: 400, title: 'Cart', body: `<div class="empty"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i><h3>Your cart is empty</h3><p>${live ? 'This event has no priced products selected.' : 'Each listing event has its own cart. Open an event to start an order.'}</p></div>`, foot: `<a class="btn primary" href="${live ? '#/event/' + e.id : '#/events'}" data-act="closeMenus">${live ? 'Open the event' : 'View events'}</a>` };
  return { kind: 'drawer', w: 400, title: `Cart (${keys.length})`, sub: `${TYPES[e.type].label}, ${esc(e.a1)}`,
    body: `${keys.map((k) => { const p = priceItem(e, k); return `<div class="item" style="grid-template-columns:64px minmax(0,1fr) auto"><div class="pthumb" style="width:64px;height:48px">${design(e, k, 0, work(e).items[k])}</div><div><h4>${PRODUCTS[k].label}</h4><div class="small muted">${esc(p.summary)}</div></div><div class="b">${p.noPrice ? '' : pr(p.total)}</div></div>`; }).join('')}
      ${showP() ? `<div class="kv total"><span>Subtotal</span><span>${money(eventTotal(e))}</span></div>` : ''}${freeKeys(e).length ? `<p class="xs muted" style="margin-top:8px">Plus ${freeKeys(e).map((k) => PRODUCTS[k].label).join(' and ')}, free.</p>` : ''}`,
    foot: `<a class="btn link" href="#/event/${e.id}" data-act="closeMenus">Open the event</a><a class="btn primary" href="#/event/${e.id}/checkout" data-act="closeMenus">Go to checkout</a>` };
};
