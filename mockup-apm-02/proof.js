// Proof renderer. Pages scale with their container via cqw units, so the same markup serves the
// large proof stage, the editor and the cart thumbnails.
window.Proof = (() => {
  const { agent } = window.DATA;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money0 = n => '$' + Math.round(n).toLocaleString('en-US');
  const ph = (L, kind, cls = '') => `<div class="pf-photo ${cls}">${window.Art.photo(L, kind)}</div>`;
  const specs = L => `
    <div class="pf-specs">
      <span><b>${L.beds}</b> Beds</span>
      <span><b>${L.baths}</b> Baths</span>
      <span><b>${L.sqft.toLocaleString()}</b> Sq Ft</span>
      <span><b>${L.lot}</b> Lot</span>
    </div>`;

  const qrBlock = (cfg, label = 'Scan for photos & tour') => {
    const q = cfg.qr;
    if (q.status === 'saved' || q.status === 'override') {
      return `<div class="pf-qr">${window.Art.qr(q.savedUrl)}<span>${label}</span></div>`;
    }
    return '';
  };

  const agentBar = (cfg, dark) => `
    <div class="pf-agent ${dark ? 'is-dark' : ''}">
      <div class="pf-headshot">${window.Art.headshot()}</div>
      <div class="pf-agent-text">
        <b>${agent.name}</b>
        <span>${agent.title} · ${agent.brokerage}</span>
        <span>${agent.phone} · ${agent.email}</span>
      </div>
      ${qrBlock(cfg)}
      <div class="pf-logo"><i>◆</i>${agent.brokerage}</div>
    </div>`;

  const content = (L, cfg) => ({
    headline: cfg.content.headline || L.event,
    tagline: cfg.content.tagline || L.tagline,
    blurb: cfg.content.blurb || L.blurb,
    hero: cfg.content.hero || 'exterior',
  });

  // ---------- flyer ----------
  const flyer = (L, cfg) => {
    const c = content(L, cfg);
    const others = L.photos.filter(p => p !== c.hero);
    const t = cfg.template;
    if (t === 'classic') {
      return `<div class="proof proof-flyer t-classic">
        <div class="pf-pad">
          <div class="pf-kicker">${esc(c.headline)}</div>
          <div class="pf-frame">${ph(L, c.hero)}</div>
          <h1 class="pf-addr">${esc(L.street)}</h1>
          <div class="pf-city">${esc(L.city)}, ${L.state} ${L.zip} · Offered at ${money0(L.price)}</div>
          <div class="pf-rule"></div>
          <p class="pf-tag">${esc(c.tagline)}</p>
          <div class="pf-two">
            ${ph(L, others[1], 'pf-sm')}
            ${ph(L, others[2], 'pf-sm')}
          </div>
          ${specs(L)}
        </div>
        ${agentBar(cfg)}
      </div>`;
    }
    if (t === 'bold') {
      return `<div class="proof proof-flyer t-bold">
        <div class="pf-full">${ph(L, c.hero === 'exterior' ? 'dusk' : c.hero)}
          <div class="pf-over">
            <div class="pf-badge">${esc(c.headline)}</div>
            <h1>${esc(L.street)}</h1>
            <div class="pf-when">${esc(L.eventDate)}</div>
          </div>
        </div>
        <div class="pf-pad">
          <div class="pf-pricerow"><b>${money0(L.price)}</b><span>${esc(L.city)}, ${L.state} ${L.zip}</span></div>
          ${specs(L)}
          <p class="pf-blurb">${esc(c.blurb)}</p>
        </div>
        ${agentBar(cfg, true)}
      </div>`;
    }
    return `<div class="proof proof-flyer t-modern">
      <div class="pf-hero">${ph(L, c.hero)}<div class="pf-flag">${esc(c.headline)}</div></div>
      <div class="pf-band">
        <div><h1>${esc(L.street)}</h1><span>${esc(L.city)}, ${L.state} ${L.zip}</span></div>
        <b>${money0(L.price)}</b>
      </div>
      <div class="pf-pad">
        ${specs(L)}
        <div class="pf-cols">
          <div>
            <p class="pf-tag">${esc(c.tagline)}</p>
            <p class="pf-blurb">${esc(c.blurb)}</p>
            <ul class="pf-list">${L.highlights.slice(0, 3).map(h => `<li>${esc(h)}</li>`).join('')}</ul>
          </div>
          <div class="pf-stack">${ph(L, others[1], 'pf-sm')}${ph(L, others[2], 'pf-sm')}</div>
        </div>
      </div>
      ${agentBar(cfg)}
    </div>`;
  };

  // ---------- brochure (11x17 bifold; outside = back + cover, inside = two panels) ----------
  const mailPanel = (L, cfg, recipient) => {
    const mailing = cfg.dist === 'mail';
    const cls = cfg.mail.mailClass === 'first' ? 'FIRST-CLASS MAIL' : 'PRSRT STD';
    return `<div class="pb-mail ${mailing ? '' : 'is-off'}">
      <div class="pb-return"><b>${agent.brokerage}</b><br>${agent.office.street1}, ${agent.office.street2}<br>${agent.office.city}, ${agent.office.state} ${agent.office.zip}</div>
      ${mailing ? `<div class="pb-indicia">${cls}<br>U.S. POSTAGE PAID<br>APM DEMO</div>
      <div class="pb-to">${esc(recipient.name)}<br>${esc(recipient.line1)}<br>${esc(recipient.line2)}</div>` : '<div class="pb-to pb-to-blank">Mailing panel left blank<br>for shipped or picked-up copies</div>'}
    </div>`;
  };

  const brochure = (L, cfg, page, recipient) => {
    const c = content(L, cfg);
    const t = cfg.template;
    const others = L.photos.filter(p => p !== c.hero);
    if (page === 'inside') {
      return `<div class="proof proof-brochure t-${t}">
        <div class="pb-panel pb-inside-l">
          <div class="pf-kicker">The home</div>
          <h2>${esc(c.tagline)}</h2>
          <p class="pf-blurb">${esc(c.blurb)}</p>
          ${specs(L)}
          <ul class="pf-list">${L.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
          ${ph(L, others[1], 'pb-wide')}
        </div>
        <div class="pb-panel pb-inside-r">
          <div class="pb-grid">${ph(L, others[2], 'pb-tall')}${ph(L, others[0])}${ph(L, c.hero)}</div>
          <div class="pf-kicker">The neighborhood</div>
          <p class="pf-blurb">Zilker Park, Barton Springs and South Congress are all within ten minutes. Top-rated schools and tree-shaded sidewalks make this one of Austin’s most walkable pockets.</p>
          <div class="pb-stats"><span><b>8 min</b>Zilker Park</span><span><b>A+</b>Schools</span><span><b>84</b>Walk score</span></div>
        </div>
      </div>`;
    }
    return `<div class="proof proof-brochure t-${t}">
      <div class="pb-panel pb-back">
        ${agentBar(cfg, t === 'modern')}
        <p class="pb-note">Thinking about moving? I’d love to share what homes near you are selling for.</p>
        ${mailPanel(L, cfg, recipient)}
      </div>
      <div class="pb-panel pb-cover">
        ${ph(L, c.hero, 'pb-coverphoto')}
        <div class="pb-covertext">
          <div class="pf-flag">${esc(c.headline)}</div>
          <h1>${esc(L.street)}</h1>
          <span>${esc(L.city)}, ${L.state} ${L.zip}</span>
          <b>${money0(L.price)}</b>
        </div>
      </div>
    </div>`;
  };

  // ---------- postcard (9x6) ----------
  const postcard = (L, cfg, page, recipient) => {
    const c = content(L, cfg);
    if (page === 'back') {
      const mailing = cfg.dist === 'mail';
      return `<div class="proof proof-postcard t-${cfg.template}">
        <div class="pp-back">
          <div class="pp-left">
            <div class="pf-kicker">${esc(c.headline)}</div>
            <h2>${esc(L.street)}</h2>
            ${specs(L)}
            <p class="pf-blurb">${esc(c.blurb)}</p>
            ${agentBar(cfg)}
          </div>
          <div class="pp-right">${mailPanel(L, cfg, recipient)}</div>
        </div>
      </div>`;
    }
    return `<div class="proof proof-postcard t-${cfg.template}">
      ${ph(L, c.hero === 'exterior' ? 'dusk' : c.hero, 'pp-photo')}
      <div class="pp-band"><div class="pf-flag">${esc(c.headline)}</div><h1>${esc(L.street)}</h1><b>${money0(L.price)}</b></div>
    </div>`;
  };

  const render = (productId, L, cfg, page, recipient) => {
    recipient = recipient || { name: 'Current Resident', line1: '132 Willow Ln', line2: 'Austin, TX 78704-1129' };
    if (productId === 'brochure') return brochure(L, cfg, page || 'outside', recipient);
    if (productId === 'postcard') return postcard(L, cfg, page || 'front', recipient);
    return flyer(L, cfg);
  };

  const pages = { flyer: [['front', 'Front']], brochure: [['outside', 'Outside'], ['inside', 'Inside']], postcard: [['front', 'Front'], ['back', 'Back']] };

  return { render, pages };
})();
