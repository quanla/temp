// Renders print proofs as HTML. Sizes are in em, driven by the frame width
// (container query units), so the same markup works as a large proof or a thumbnail.
(function () {
  const A = window.APM_ART;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const HEROES = ['exterior-day', 'exterior-dusk', 'backyard'];
  const KICKER = { 'New Listing': 'Just Listed', 'Open House': 'Open House', 'Just Sold': 'Just Sold' };

  const photo = (kind, cls = '') => `<div class="d-photo ${cls}">${A.photo(kind)}</div>`;

  function facts(L) {
    return `<div class="d-facts"><span><b>${L.beds}</b> Beds</span><span><b>${L.baths}</b> Baths</span><span><b>${L.sqft}</b> Sq ft</span><span class="d-price">${L.price}</span></div>`;
  }

  function qrBlock(ctx) {
    const q = ctx.p.qr;
    if (q.status === 'saved') {
      return `<div class="d-qr">${A.qr(q.url)}<span>Scan for photos &amp; tour</span></div>`;
    }
    if (q.status === 'draft') {
      const attrs = ctx.interactive ? 'role="button" tabindex="0" data-act="openDrawer" data-arg="qr" title="Fix QR code link"' : '';
      return `<div class="d-qr d-qr--pending" ${attrs}><div class="d-qr-box">!</div><span>QR link needs attention</span></div>`;
    }
    return '';
  }

  function agentBlock(ctx) {
    const a = ctx.agent;
    return `<div class="d-agent"><div class="d-avatar">${A.portrait()}</div><div class="d-agent-text"><b>${esc(a.name)}</b><span>${a.title} · ${esc(a.company)}</span><span>${a.phone}</span><span>${a.email}</span></div></div>`;
  }

  function logoBlock() {
    return `<div class="d-logo">${A.logo()}<span>CEDAR<br>REALTY</span></div>`;
  }

  function foot(ctx) {
    return `<div class="d-foot">${agentBlock(ctx)}${logoBlock()}${qrBlock(ctx)}</div>`;
  }

  function hero(ctx, extraCls = '') {
    const e = ctx.p.edits;
    const main = HEROES[e.hero] || HEROES[0];
    if (ctx.p.template === 'gallery') {
      return `<div class="d-hero d-hero--grid ${extraCls}">${photo(main, 'd-photo--main')}${photo('living')}${photo('kitchen')}</div>`;
    }
    return `<div class="d-hero ${extraCls}">${photo(main)}</div>`;
  }

  function flyer(ctx, side) {
    const { L, p } = ctx;
    const e = p.edits;
    if (side === 'back') {
      return `<div class="doc doc-flyer tpl-${p.template}">
  <div class="d-band"><span>Open House</span><b>${esc(L.dateLong)} · 1–4 PM</b></div>
  <div class="d-grid2">${photo('living')}${photo('kitchen')}</div>
  <div class="d-main">
    <div class="d-kicker">Home highlights</div>
    <ul class="d-list">${L.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    ${facts(L)}
  </div>
  ${foot(ctx)}
</div>`;
    }
    return `<div class="doc doc-flyer tpl-${p.template}">
  ${hero(ctx)}
  <div class="d-main">
    <div class="d-kicker">${KICKER[L.event] || L.event}</div>
    <h3 class="d-head">${esc(e.headline)}</h3>
    <div class="d-addr">${esc(L.street)}, ${L.city}, ${L.state} ${L.zip}</div>
    ${facts(L)}
    <p class="d-desc">${esc(e.desc)}</p>
  </div>
  ${foot(ctx)}
</div>`;
  }

  function brochure(ctx, side) {
    const { L, p } = ctx;
    const e = p.edits;
    if (side === 'inside') {
      return `<div class="doc doc-brochure tpl-${p.template}">
  <div class="b-panel">
    ${photo('living', 'b-photo-tall')}
    <div class="d-kicker">Welcome home</div>
    <p class="d-desc">${esc(e.desc)}</p>
  </div>
  <div class="b-panel">
    <div class="d-kicker">Home highlights</div>
    <h3 class="d-head d-head--sm">${esc(L.street)}</h3>
    <ul class="d-list d-list--one">${L.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    ${facts(L)}
  </div>
  <div class="b-panel">
    ${photo('kitchen', 'b-photo')}
    ${photo('backyard', 'b-photo')}
    <div class="d-band d-band--inline"><span>Open House</span><b>${esc(L.dateLong)} · 1–4 PM</b></div>
  </div>
</div>`;
    }
    return `<div class="doc doc-brochure tpl-${p.template}">
  <div class="b-panel">
    <div class="d-kicker">The neighborhood</div>
    <h3 class="d-head d-head--sm">Life in ${esc(L.neighborhood)}</h3>
    <p class="d-desc">Tree-lined streets, live music, and some of Austin’s best coffee are a short walk away. Zilker Park and Lady Bird Lake are minutes by bike.</p>
    ${photo('backyard', 'b-photo')}
  </div>
  <div class="b-panel b-panel--agent">
    <div class="b-portrait">${A.portrait()}</div>
    <b class="b-agent-name">${esc(ctx.agent.name)}</b>
    <span class="b-agent-meta">${ctx.agent.title} · ${esc(ctx.agent.company)}</span>
    <span class="b-agent-meta">${ctx.agent.phone}</span>
    <span class="b-agent-meta">${ctx.agent.email}</span>
    ${qrBlock(ctx)}
    ${logoBlock()}
  </div>
  <div class="b-panel b-panel--cover">
    ${hero(ctx, 'b-cover-hero')}
    <div class="b-cover-text">
      <div class="d-kicker">${KICKER[L.event] || L.event}</div>
      <h3 class="d-head">${esc(e.headline)}</h3>
      <div class="d-addr">${esc(L.street)} · ${L.city}, ${L.state}</div>
    </div>
  </div>
</div>`;
  }

  function postcard(ctx, side) {
    const { L, p } = ctx;
    const e = p.edits;
    if (side === 'back') {
      return `<div class="doc doc-postcard tpl-${p.template}">
  <div class="pc-left">
    <div class="d-kicker">${KICKER[L.event] || L.event}</div>
    <h3 class="d-head d-head--sm">${esc(L.street)}</h3>
    ${facts(L)}
    <p class="d-desc">${esc(e.desc)}</p>
    ${agentBlock(ctx)}
  </div>
  <div class="pc-right">
    <div class="pc-indicia">PRSRT STD<br>US POSTAGE<br>PAID</div>
    ${qrBlock(ctx)}
    <div class="pc-address">Current Resident<br>1804 Kinney Ave<br>Austin, TX 78704</div>
  </div>
</div>`;
    }
    return `<div class="doc doc-postcard tpl-${p.template}">
  ${photo(HEROES[e.hero] || HEROES[0], 'pc-photo')}
  <div class="pc-overlay">
    <div class="d-kicker">${KICKER[L.event] || L.event}</div>
    <h3 class="d-head">${esc(e.headline)}</h3>
    <div class="d-addr">${esc(L.street)} · ${L.price}</div>
  </div>
</div>`;
  }

  const RENDER = { flyers: flyer, brochures: brochure, postcards: postcard };

  function render(key, ctx, side) {
    return `<div class="proof-frame proof-frame--${key}">${RENDER[key](ctx, side)}</div>`;
  }

  window.APM_PROOF = { render, esc };
})();
