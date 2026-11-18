/* Events list, listing edit and delete, office and user picker, and the stub pages. */
const STATUS = { new: ['Not started', ''], progress: ['In progress', 'blue'], submitted: ['Submitted for approval', 'orange'], done: ['Completed', 'green'] };

function visibleEvents() {
  const f = S.filters, agent = S.ui.admin ? S.viewAs.agent : 'Chucky Norris', q = f.q.trim().toLowerCase();
  let list = S.events.filter((e) => e.agent === agent && (f.done || e.status !== 'done'));
  if (q) list = list.filter((e) => (e.a1 + ' ' + e.city + ' ' + TYPES[e.type].label).toLowerCase().includes(q));
  if (f.type) list = list.filter((e) => e.type === f.type);
  if (f.status) list = list.filter((e) => e.status === f.status);
  const by = { newest: (a, b) => b.created.localeCompare(a.created), oldest: (a, b) => a.created.localeCompare(b.created), address: (a, b) => a.a1.replace(/^\d+\s*/, '').localeCompare(b.a1.replace(/^\d+\s*/, '')) };
  return list.slice().sort(by[f.sort]);
}
function typeDetail(e) {
  if (e.type === 'open' && e.oh) return `${fmtDow(e.oh.date)}, ${fmtT(e.oh.start)} to ${fmtT(e.oh.end)}` + (pastOpenHouse(e) ? ' <span class="badge red">Date has passed</span>' : '');
  if (e.type === 'price' && e.pc) return `${whole(e.pc.old)} to ${whole(e.pc.now)}`;
  return '';
}
function eventRow(e) {
  const [st, color] = STATUS[e.status], href = e.status === 'done' ? `#/event/${e.id}/complete` : `#/event/${e.id}`;
  let prog = '';
  if (e.status === 'done') prog = `Cart #${e.cartNo}${showP() && e.total != null ? ' · ' + money(e.total) : ''}`;
  else { const n = cartKeys(e).length, fr = freeKeys(e).length, t = eventTotal(e); prog = (e.status === 'new' ? 'Ready with your defaults: ' : '') + plural(n + fr, 'product') + (showP() && n ? ` · ${money(t)}` + (e.status === 'new' ? ' est.' : '') : ''); }
  const cta = { new: ['Start', 'primary'], progress: ['Resume', 'primary'], submitted: ['Open', 'secondary'], done: ['View order', ''] }[e.status];
  const det = typeDetail(e);
  return `<article class="evrow" aria-label="${esc(TYPES[e.type].label + ', ' + e.a1)}">
    <a class="thumb" href="${href}" tabindex="-1" aria-hidden="true">${photo(e.hue)}<span class="pc"><i class="fa-solid fa-camera" aria-hidden="true"></i> ${e.photos}</span></a>
    <div class="grow">
      <div class="row between"><span class="b">${TYPES[e.type].label}${det ? ` <span class="small muted" style="font-weight:400">· ${det}</span>` : ''}</span><span class="small muted nowrap">${fmtD(e.created)}</span></div>
      <a class="addr" href="${href}">${esc(e.a1)}</a>
      <div class="small muted">${esc(e.city)} · ${esc(e.agent)}</div>
      <div class="foot"><span class="badge ${color}">${st}</span><span class="small muted">${prog}</span>
        <span class="sp">${e.status !== 'done' ? ibtn('fa-pen', 'editEvent', e.id, 'Edit listing details') + ibtn('fa-trash', 'askDeleteEvent', e.id, 'Delete event', 'del') : ''}<a class="btn sm ${cta[1]}" href="${href}">${cta[0]}<span class="sr"> ${esc(e.a1)}, ${TYPES[e.type].label}</span></a></span></div>
    </div></article>`;
}
const skelRows = (n) => `<div class="evgrid" aria-busy="true" aria-label="Loading events">${Array(n).fill('<div class="evrow"><div class="thumb skel"></div><div class="grow stack tight"><div class="skel" style="height:14px;width:40%"></div><div class="skel" style="height:14px;width:70%"></div><div class="skel" style="height:12px;width:50%"></div><div class="skel" style="height:20px;width:30%"></div></div></div>').join('')}</div>`;

SCREENS.events = () => {
  const f = S.filters, all = visibleEvents(), shown = all.slice(0, S.shown), state = S.sim.list;
  if (!S.seenList && !T.loading.list) { T.loading.list = true; setTimeout(() => { S.seenList = true; T.loading.list = false; render(); }, 800); }
  const chips = [];
  if (f.q) chips.push(['q', `Search: ${esc(f.q)}`]); if (f.type) chips.push(['type', TYPES[f.type].label]); if (f.status) chips.push(['status', STATUS[f.status][0]]); if (f.done) chips.push(['done', 'Including completed']);
  let body;
  if (state === 'loading' || T.loading.list) body = skelRows(6);
  else if (state === 'error') body = note('error', "<b>We couldn't load your events.</b> Check your connection and try again. If it keeps happening, call " + PHONE + '.', { acts: btn('Try again', 'listRetry', { cls: 'sm secondary' }) });
  else if (state === 'empty' || (!all.length && !chips.length)) body = `<div class="empty"><i class="fa-regular fa-calendar-xmark" aria-hidden="true"></i><h2>No available events.</h2><p>Events appear here when one of your listings is added, sold, repriced or gets an open house.</p><p style="margin-top:12px">${f.done ? '' : btn('Show completed events', 'showDone', { cls: 'secondary' })}</p></div>`;
  else if (!all.length) body = `<div class="empty"><i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i><h2>No events match your filters</h2><p>Try a different search or clear the filters.</p><p style="margin-top:12px">${btn('Clear filters', 'clearFilters', { cls: 'secondary' })}</p></div>`;
  else body = `<div class="evgrid">${shown.map(eventRow).join('')}</div>${T.loading.more ? '<div style="margin-top:10px">' + skelRows(2) + '</div>' : ''}
    <div class="row between wrap" style="margin-top:14px"><span class="small muted" role="status">Showing ${shown.length} of ${plural(all.length, 'event')}</span>${all.length > shown.length && !T.loading.more ? btn(`Show ${Math.min(20, all.length - shown.length)} more`, 'moreEvents', { cls: 'secondary' }) : ''}</div>`;
  const fl = S.flash;
  return { html: `<div class="page stack loose">
    <div class="row between wrap top"><div><h1>Listing events</h1><p class="muted">Marketing we prepared for your listings. Open an event to check it, choose who gets it, and order.</p>
      ${S.ui.admin ? `<p class="small" style="margin-top:4px">Viewing events for <b>${esc(S.viewAs.agent)}</b>, ${esc(S.viewAs.office)}. You are acting as this agent.</p>` : ''}</div>
      <div class="row wrap">${S.ui.admin ? btn('Select office and user', 'openViewAs', { cls: 'secondary', icon: 'fa-users' }) : ''}<a class="btn" href="#/settings"><i class="fa-solid fa-gear" aria-hidden="true"></i>Profile and settings</a></div></div>
    ${fl ? note('success', `<b>Submission successful.</b> Your order for ${esc(fl.a1)} was sent for approval. We will email you when it is approved; you can still open the event to make changes.`, { close: 'clearFlash' }) : ''}
    <div class="stack"><div class="toolbar" role="search">
      <div class="search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><label class="sr" for="${mid('S.filters.q')}">Search events by address</label><input class="input" id="${mid('S.filters.q')}" data-model="S.filters.q" data-then="resetShown" type="search" placeholder="Search by address or event" value="${esc(f.q)}"></div>
      <label class="sr" for="${mid('S.filters.type')}">Event type</label>${sel('', 'S.filters.type', [['', 'All event types'], ...Object.entries(TYPES).map(([k, t]) => [k, t.label])], { then: 'resetShown' })}
      <label class="sr" for="${mid('S.filters.status')}">Status</label>${sel('', 'S.filters.status', [['', 'Any status'], ['new', 'Not started'], ['progress', 'In progress'], ['submitted', 'Submitted for approval']], { then: 'resetShown' })}
      <label class="sr" for="${mid('S.filters.sort')}">Sort</label>${sel('', 'S.filters.sort', [['newest', 'Newest first'], ['oldest', 'Oldest first'], ['address', 'Street name']])}
      <div style="margin-left:auto">${sw('S.filters.done', 'Show completed events')}</div></div>
      ${chips.length ? `<div class="row wrap">${chips.map(([k, l]) => `<span class="chip">${l}<button data-act="dropFilter" data-arg="${k}" aria-label="Remove filter ${l}">&times;</button></span>`).join('')}${btn('Clear all', 'clearFilters', { cls: 'link blue sm' })}</div>` : ''}
    </div>
    <div data-live="evlist">${body}</div></div>` };
};
/* Typing in the search box refreshes only the list, so the input keeps focus. */
L.evlist = () => { const m = SCREENS.events().html.match(/<div data-live="evlist">([\s\S]*)<\/div><\/div>$/); return m ? m[1] : ''; };
A.resetShown = () => { S.shown = 20; };
A.moreEvents = () => { T.loading.more = true; setTimeout(() => { T.loading.more = false; S.shown += 20; render(); }, 700); };
A.clearFilters = () => { Object.assign(S.filters, { q: '', type: '', status: '', done: false }); S.shown = 20; };
A.dropFilter = (k) => { S.filters[k] = k === 'done' ? false : ''; };
A.showDone = () => { S.filters.done = true; };
A.listRetry = () => { S.sim.list = 'ready'; };
A.clearFlash = () => { S.flash = null; };

/* Edit listing details */
A.editEvent = (id) => { const e = ev(id); openModal('editEvent', { id, d: { a1: e.a1, city: e.city, price: e.price, beds: e.beds, baths: e.baths, sqft: e.sqft, url: e.url, desc: e.desc }, err: false }); };
MODALS.editEvent = (p) => ({
  w: 600, title: 'Edit listing details', sub: 'Designs you have not edited pick up these details.',
  body: `<div class="fgrid">${tf('Address 1', 'M.d.a1', { req: 1, cls: 'full', err: p.err && !p.d.a1.trim() ? 'Enter the street address' : '' })}${tf('City, state and postal code', 'M.d.city', { req: 1, cls: 'full', err: p.err && !p.d.city.trim() ? 'Enter the city, state and postal code' : '' })}
    ${tf('Price', 'M.d.price', { num: 1, type: 'number', min: 0 })}${tf('Square feet', 'M.d.sqft', { num: 1, type: 'number', min: 0 })}${tf('Bedrooms', 'M.d.beds', { num: 1, type: 'number', min: 0 })}${tf('Bathrooms', 'M.d.baths', { num: 1, type: 'number', min: 0 })}
    ${tf('Listing URL', 'M.d.url', { cls: 'full', type: 'url' })}${tf('Listing description', 'M.d.desc', { cls: 'full', area: 1 })}</div>`,
  foot: btn('Cancel', 'closeModal', { cls: 'link' }) + btn('Save details', 'saveEvent', { cls: 'primary' }),
});
A.saveEvent = () => {
  const p = T.modal.props, e = ev(p.id);
  if (!p.d.a1.trim() || !p.d.city.trim()) { p.err = true; return; }
  Object.assign(e, p.d); e.addrFixed = true;
  Object.keys(S.work).filter((k) => k.startsWith(e.id + '_')).forEach((wk) => { const w = S.work[wk]; PKEYS.forEach((k) => { if (!w.items[k].edited) w.items[k].fields = newItem(k, e).fields; }); });
  closeModal(); toast('Listing details saved');
};
A.askDeleteEvent = (id) => { const e = ev(id); openModal('confirm', { title: 'Delete this event?', text: `<b>${TYPES[e.type].label}</b> for ${esc(e.a1)} will be removed from your list, along with any designs and cart you started for it. This cannot be undone.`, yes: 'Delete event', act: 'deleteEvent', arg: id, danger: 1 }); };
A.deleteEvent = (id) => { S.events = S.events.filter((e) => e.id !== id); if (S.cur === id) S.cur = null; closeModal(); toast('Event deleted'); if (route().name !== 'events') go('#/events'); };

/* Admin: pick whose events to view */
A.openViewAs = () => { openModal('viewAs', { office: S.viewAs.office, agent: S.viewAs.agent }); };
MODALS.viewAs = (p) => {
  if (!OFFICES[p.office].includes(p.agent)) p.agent = OFFICES[p.office][0];
  return { w: 400, title: 'Select office and user', sub: 'You will see and act on this agent\'s events.', body: `<div class="stack">${sel('Office', 'M.office', Object.keys(OFFICES))}${sel('User', 'M.agent', OFFICES[p.office])}</div>`, foot: btn('Cancel', 'closeModal', { cls: 'link' }) + btn('View events', 'applyViewAs', { cls: 'primary' }) };
};
A.applyViewAs = () => { S.viewAs = { office: T.modal.props.office, agent: T.modal.props.agent }; S.shown = 20; closeModal(); };

/* ---------- Stub and utility pages ---------- */
SCREENS.settings = () => ({ html: `<div class="page narrow stack loose"><div class="crumbs"><a href="#/events">Events</a><i class="fa-solid fa-chevron-right" aria-hidden="true"></i><span class="cur">Profile and settings</span></div>
  ${note('info', '<b>Profile and settings is outside this mockup.</b> The redesign covers events, customizing and checkout. This page only shows what lives here so links have somewhere to land.')}
  <div class="stack">${[['fa-table-cells-large', 'Default templates', 'Per event type and product'], ['fa-layer-group', 'Default quantities, mailing class and coating', 'What each new event starts with'], ['fa-address-book', 'Default mailing lists', 'Lists added to every mailing'],
    ['fa-bolt', 'Automated checkout rules', 'Order automatically when an event is created'], ['fa-credit-card', 'Payment defaults', 'Card or billing account used first'], ['fa-id-badge', 'Headshots and contact details', 'Merged into every design'],
    ['fa-share-nodes', 'Social accounts', 'Connect Facebook, Instagram, X, LinkedIn and Pinterest'], ['fa-envelope', 'Subscribe or unsubscribe', 'Event emails for your listings']]
    .map(([i, t, s]) => `<div class="fcard row"><span class="icon-chip"><i class="fa-solid ${i}" aria-hidden="true"></i></span><div><div class="b">${t}</div><div class="xs muted">${s}</div></div></div>`).join('')}</div>
  <div><a class="btn secondary" href="#/events"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>Back to events</a></div></div>` });

SCREENS.help = () => ({ html: `<div class="page narrow stack loose"><div class="crumbs"><a href="#/events">Events</a><i class="fa-solid fa-chevron-right" aria-hidden="true"></i><span class="cur">Help</span></div>
  <div class="panel"><div class="panel-h">Talk to support</div><div class="stack">
    <div class="fcard row"><span class="icon-chip"><i class="fa-solid fa-phone" aria-hidden="true"></i></span><div><div class="b"><a href="tel:8669773627">${PHONE}</a></div><div class="xs muted">Monday to Friday, 8am to 6pm Central</div></div></div>
    <div class="fcard row"><span class="icon-chip"><i class="fa-solid fa-envelope" aria-hidden="true"></i></span><div><div class="b"><a href="mailto:support@xpressdocs.example">support@xpressdocs.example</a></div><div class="xs muted">We reply within one business day</div></div></div>
    <div class="fcard row"><span class="icon-chip"><i class="fa-solid fa-comment" aria-hidden="true"></i></span><div class="grow"><div class="b">Live chat</div><div class="xs muted">Online now. Monday to Friday, 8am to 6pm Central</div></div>${btn('Start chat', 'stub', { cls: 'secondary sm', arg: 'Live chat opens here. Support is online Monday to Friday, 8am to 6pm Central.' })}</div></div></div>
  <div class="card stack"><h2>How Auto Property Marketing works</h2>
    <p><b>1. We prepare it.</b> When a listing is added, sold, repriced or gets an open house, we create an event with designs already filled in from the listing.</p>
    <p><b>2. You check it.</b> Open the event to see every product, who it goes to and what it costs. Turn products on or off, or customize any of them.</p>
    <p><b>3. You order.</b> Review the cart and check out. Social posts and image downloads are free and do not need checkout.</p>
    <p class="muted">Editing a design? Open the design editor and choose Help in its top bar for a guide to selecting, resizing, moving, swapping images, switching sides and saving.</p></div>
  <div><a class="btn secondary" href="#/events"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>Back to events</a></div></div>` });

SCREENS.expired = () => ({ bare: true, html: `<header class="hdr"><span class="logo">${pinwheel()}<span>ACME<small>Corporation</small></span></span></header>
  <main id="main" tabindex="-1"><div class="page narrow"><div class="card center" style="max-width:440px;margin:60px auto;padding:32px">
    <div class="bigcheck" style="background:var(--soft);color:var(--text-2)"><i class="fa-regular fa-clock" aria-hidden="true"></i></div><h1>Your session has expired</h1>
    <p class="muted" style="margin:8px 0 20px">For your security we signed you out after a period of inactivity. Your work was saved automatically, so you can pick up where you left off.</p>
    <a class="btn primary block" href="#/events">Log back in</a><p class="xs muted" style="margin-top:14px">Need help? Call ${PHONE}</p></div></div></main>` });

SCREENS.xpresso = () => ({ html: `<div class="page narrow"><div class="empty"><i class="fa-solid fa-store" aria-hidden="true"></i><h1>Main Xpresso site</h1><p>The storefront, orders, analytics and team pages live here. They are outside this mockup.</p><p style="margin-top:14px"><a class="btn primary" href="#/events">Back to listing events</a></p></div></div>` });

SCREENS.approvals = () => {
  const list = S.events.filter((e) => e.status === 'submitted');
  return { html: `<div class="page narrow stack loose"><h1>Approvals dashboard</h1>${note('info', 'The approvals dashboard lives elsewhere on Xpresso and is not being redesigned. This stub lets you open a submitted cart as the approver.')}
    ${list.length ? `<div class="panel"><div class="panel-h">Waiting for your approval</div><div class="stack">${list.map((e) => `<div class="evrow"><div class="thumb">${photo(e.hue)}</div><div class="grow"><div class="b">${TYPES[e.type].label}</div><div class="addr">${esc(e.a1)}</div><div class="small muted">${esc(e.agent)}${showP() ? ' · ' + money(eventTotal(e)) : ''}</div></div>${btn('Review', 'reviewAsApprover', { arg: e.id, cls: 'primary sm' })}</div>`).join('')}</div></div>` : '<div class="empty"><i class="fa-regular fa-circle-check" aria-hidden="true"></i><p>Nothing is waiting for approval.</p></div>'}
    <div><a class="btn secondary" href="#/events">Go to listing events</a></div></div>` };
};
A.reviewAsApprover = (id) => { S.ui.variant = 'approver'; go(`#/event/${id}/checkout`); };
SCREENS.notfound = () => ({ html: `<div class="page narrow"><div class="empty"><i class="fa-regular fa-compass" aria-hidden="true"></i><h1>We can't find that page</h1><p>The event may have been deleted or already checked out.</p><p style="margin-top:14px"><a class="btn primary" href="#/events">Back to listing events</a></p></div></div>` });
