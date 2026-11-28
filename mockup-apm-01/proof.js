// Print-proof renderers. Sizes use container-query units so the same markup works as a
// full-size proof and as a template thumbnail.

const fmtPrice = (n) => "$" + n.toLocaleString("en-US");

function proofQr(p, mini) {
    if (p.qr.status === "saved") {
        return `<div class="pf-qr">${qrSvg(p.qr.savedUrl)}<span>Scan for photos &amp; 3D tour</span></div>`;
    }
    if (p.qr.status === "draft" && !mini) {
        return `<div class="pf-qr pf-qr-pending"><span>QR not saved</span></div>`;
    }
    return "";
}

function proofAgent(p, mini) {
    return `<div class="pf-agent">
        <div class="pf-head">${headshot()}</div>
        <div class="pf-agent-text">
            <b>${AGENT.name}</b>
            <span>${AGENT.title}</span>
            <span>${AGENT.phone} · ${AGENT.email}</span>
        </div>
        <div class="pf-brand">${cedarLogo()}<span>Cedar<br>Realty</span></div>
        ${proofQr(p, mini)}
    </div>`;
}

function renderProof(key, p, L, opts = {}) {
    const layout = CAT[key].layout;
    const tpl = opts.template || p.template;
    const side = opts.side || p.side;
    const c = p.copy;
    const hero = ART[c.photo]();
    const stats = `${L.beds} Beds · ${L.baths} Baths · ${L.sqft.toLocaleString()} Sq Ft`;

    if (layout === "flyer") {
        return `<div class="proof proof-flyer"><div class="pf pf-flyer tpl-${tpl}">
            <div class="pf-hero">${hero}
                <div class="pf-over"><span>${esc(c.headline)}</span><b>${L.street}</b></div>
                <span class="pf-tag">${esc(c.headline)}</span>
            </div>
            <div class="pf-body">
                <div class="pf-main">
                    <div class="pf-price">${fmtPrice(L.price)}</div>
                    <div class="pf-addr">${L.street}<small>${L.city}</small></div>
                    <div class="pf-stats">${stats}</div>
                    <p class="pf-blurb">${esc(c.blurb)}</p>
                    <div class="pf-open">${icon("calendar", 12)} ${L.note}</div>
                </div>
                <div class="pf-side">
                    <div class="pf-thumb">${ART.kitchen()}</div>
                    <div class="pf-thumb">${ART.backyard()}</div>
                </div>
            </div>
            ${proofAgent(p, opts.mini)}
        </div></div>`;
    }

    if (layout === "postcard") {
        return `<div class="proof proof-postcard"><div class="pf pf-postcard tpl-${tpl}">
            ${side === "a"
                ? `<div class="pf-pc-front">${hero}<div class="pf-pc-band"><span>${esc(c.headline)}</span><b>${L.street}</b><small>${fmtPrice(L.price)} · ${stats}</small></div></div>`
                : `<div class="pf-pc-back"><div class="pf-pc-msg"><b>${esc(c.headline)} in your neighborhood</b><p>${esc(c.blurb)}</p>${proofAgent(p, opts.mini)}</div><div class="pf-pc-addr"><div class="pf-stamp">PRSRT STD<br>U.S. POSTAGE</div><div class="pf-addr-lines"><i></i><i></i><i></i></div></div></div>`}
        </div></div>`;
    }

    // Tri-fold brochure: outside (flap · back · cover) and inside (three panels).
    const outside = `
        <div class="pf-panel">
            <h4>The neighborhood</h4>
            <ul class="pf-near">
                <li><b>0.8 mi</b> South Congress shops</li>
                <li><b>1.2 mi</b> Zilker Park</li>
                <li><b>1.5 mi</b> Barton Springs Pool</li>
                <li><b>2.1 mi</b> Downtown Austin</li>
            </ul>
            <div class="pf-photo">${ART.living()}</div>
            <p class="pf-small">Bouldin Creek · Travis Heights Elementary · walkable to coffee and the creek trail.</p>
        </div>
        <div class="pf-panel pf-panel-back">
            <div class="pf-head pf-head-lg">${headshot()}</div>
            <b class="pf-agent-name">${AGENT.name}</b>
            <span class="pf-small">${AGENT.title}</span>
            <span class="pf-small">${AGENT.phone}<br>${AGENT.email}</span>
            ${proofQr(p, opts.mini)}
            <div class="pf-brand pf-brand-lg">${cedarLogo()}<span>Cedar Realty</span></div>
        </div>
        <div class="pf-panel pf-panel-cover">
            <div class="pf-cover-photo">${hero}</div>
            <span class="pf-tag pf-tag-static">${esc(c.headline)}</span>
            <div class="pf-addr">${L.street}<small>${L.city}</small></div>
            <div class="pf-price">${fmtPrice(L.price)}</div>
        </div>`;
    const inside = `
        <div class="pf-panel">
            <div class="pf-photo pf-photo-tall">${ART.kitchen()}</div>
            <h4>Welcome home</h4>
            <p class="pf-small">${esc(c.blurb)}</p>
        </div>
        <div class="pf-panel">
            <h4>Highlights</h4>
            <ul class="pf-feat">
                <li>Chef's kitchen with quartz island</li>
                <li>Primary suite with walk-in closet</li>
                <li>Covered patio and saltwater pool</li>
                <li>Detached studio / home office</li>
                <li>New roof, HVAC, and windows (2023)</li>
            </ul>
            <div class="pf-grid">
                <div><b>${L.beds}</b>Beds</div><div><b>${L.baths}</b>Baths</div>
                <div><b>${L.sqft.toLocaleString()}</b>Sq ft</div><div><b>${L.lot}</b>Lot</div>
            </div>
        </div>
        <div class="pf-panel">
            <div class="pf-photo pf-photo-tall">${ART.backyard()}</div>
            <h4>Open house</h4>
            <p class="pf-small">${L.note}<br>${L.mls}</p>
        </div>`;
    return `<div class="proof proof-tri"><div class="pf pf-tri tpl-${tpl}">${side === "a" ? outside : inside}</div></div>`;
}
