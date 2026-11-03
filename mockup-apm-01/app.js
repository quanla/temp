// APM ordering mockup — one state object, string-template views, delegated events.

const round = (n) => Math.round(n * 100) / 100;
const num = (v) => (typeof v === "number" && !isNaN(v) ? v : parseFloat(v) || 0);
const money = (n) => (n < 0 ? "−" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clock = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const plural = (n, one, many = one + "s") => `${n.toLocaleString()} ${n === 1 ? one : many}`;

const DEFAULT_BLURB = "Renovated 1948 craftsman on a quiet, tree-lined street in Bouldin Creek. Open living with oak floors, a chef's kitchen, and a backyard built for Austin evenings.";

function newProduct(key) {
    return {
        template: key === "brochures" ? "classic" : "modern",
        defaultTemplate: null,
        side: "a",
        zoom: "fit",
        approved: false,
        approvedAt: null,
        stale: false,
        savedAt: null,
        copy: { headline: "Just Listed", blurb: DEFAULT_BLURB, photo: "exterior" },
        qr: key === "flyers"
            ? { status: "draft", url: "https://cedarrealty.example/listngs/128-willow", check: "unreachable", override: false, savedUrl: null, savedAt: null, confirmDelete: false }
            : { status: "none", url: "", check: null, override: false, savedUrl: null, savedAt: null, confirmDelete: false },
        qrOpen: key === "flyers",
        dist: key === "flyers" ? "ship" : "mail",
        qty: 100,
        paper: "gloss",
        pdf: key === "flyers",
        pickupLoc: "soco",
        dlFormat: "pdf",
        lists: key === "brochures" ? ["sphere"] : [],
        sample: false,
        sampleAddr: { name: "Jordan Ellis", company: "Cedar Realty", street1: "", street2: "", city: "Austin", state: "TX", zip: "" },
        mailClass: "standard",
        showLines: false,
        visited: false,
    };
}

function initialState() {
    return {
        view: "start",
        listingId: "willow",
        selected: [],
        active: null,
        products: { flyers: newProduct("flyers"), brochures: newProduct("brochures"), postcards: newProduct("postcards") },
        lists: SEED_LISTS.map((l) => ({ ...l })),
        cards: SEED_CARDS.map((c) => ({ ...c })),
        aud: {
            tab: "saved",
            method: "radius",
            sel: [],
            r: { center: "128 Willow Lane", zip: "78704", qty: 50, type: "single", exclude: true, status: "idle", name: "Radius — 50 homes near 128 Willow Ln" },
        },
        co: {
            step: "products",
            promoInput: "",
            promo: null,
            promoError: "",
            useStore: true,
            storeAmt: 20,
            useAd: true,
            adAmt: 30,
            primary: "acct:austin",
            split: false,
            secondary: "card:visa",
            secondaryAmt: 50,
            costCenter: "",
            note: "",
            addingCard: false,
            newCard: { name: "", number: "", exp: "", zip: "" },
            cardError: "",
            ack: false,
            tried: false,
        },
        modal: null,
        editor: null,
        toast: null,
        flash: null,
        orderNo: null,
    };
}

let S = initialState();

const listing = () => LISTINGS.find((l) => l.id === S.listingId);
const printSelected = () => S.selected.filter((k) => CAT[k].print);

// ---------- Derived order data ----------

function recipients(p, lists = p.lists) {
    return lists.reduce((sum, id) => sum + (S.lists.find((l) => l.id === id)?.count || 0), 0);
}

function printedQty(key, p = S.products[key]) {
    if (p.dist === "mail") return recipients(p) + (p.sample ? 1 : 0);
    if (p.dist === "download") return 0;
    return Math.max(0, Math.floor(num(p.qty)));
}

function linesFor(key, p = S.products[key]) {
    const lines = [];
    if (p.dist === "download") {
        lines.push(p.dlFormat === "pdf"
            ? { label: "Print-ready PDF download", amt: PDF_ADDON, kind: "addon" }
            : { label: "JPG download (web & email)", amt: 0, kind: "addon" });
        return lines;
    }
    const qty = printedQty(key, p);
    const paper = PAPERS[key].find((x) => x.id === p.paper);
    const price = paperPrice(key, p.paper, qty);
    if (price == null) {
        lines.push({ label: `Printing · ${paper.name} unavailable`, amt: 0, kind: "print", missing: true });
    } else {
        lines.push({ label: `Printing · ${qty} × ${paper.name} @ $${price.toFixed(2)}`, amt: round(qty * price), kind: "print" });
    }
    if (p.dist === "mail") {
        const cls = MAIL_CLASSES.find((c) => c.id === p.mailClass);
        lines.push({ label: `Postage · ${qty} × ${cls.name} @ $${cls.price.toFixed(2)}`, amt: round(qty * cls.price), kind: "postage" });
    }
    if (p.dist === "ship") lines.push({ label: "Ground shipping to your office", amt: shipCost(qty), kind: "ship" });
    if (p.dist === "pickup") lines.push({ label: "Pickup at print partner", amt: 0, kind: "ship" });
    if (p.pdf) lines.push({ label: "Print-ready PDF copy", amt: PDF_ADDON, kind: "addon" });
    return lines;
}

const itemTotal = (key, p) => round(linesFor(key, p).reduce((a, l) => a + l.amt, 0));

function missingAddr(a) {
    const miss = [];
    if (!a.name.trim()) miss.push("name");
    if (!a.street1.trim()) miss.push("street address");
    if (!a.city.trim()) miss.push("city");
    if (!/^[A-Za-z]{2}$/.test(a.state.trim())) miss.push("state");
    if (!/^\d{5}$/.test(a.zip.trim())) miss.push("5-digit ZIP");
    return miss;
}

function issues(key) {
    const p = S.products[key], out = [];
    if (!CAT[key].print) return out;
    if (p.qr.status === "draft") out.push({ field: "qr", text: "QR code isn't saved — fix the link or remove it" });
    if (p.dist === "mail") {
        if (!p.lists.length) out.push({ field: "lists", text: "Choose at least one mailing list" });
        if (p.sample) {
            const miss = missingAddr(p.sampleAddr);
            if (miss.length) out.push({ field: "sample", text: `Sample copy address needs ${miss.join(", ")}` });
        }
    }
    if ((p.dist === "ship" || p.dist === "pickup") && printedQty(key) < 25) out.push({ field: "qty", text: "Quantity must be at least 25" });
    if (p.dist !== "download" && paperPrice(key, p.paper, printedQty(key)) == null) out.push({ field: "paper", text: "Selected paper isn't available — choose another" });
    if (!p.approved) out.push({ field: "approve", text: p.stale ? "Proof changed since you approved it — review again" : "Review and approve the proof" });
    return out;
}

function totals() {
    const co = S.co;
    const keys = printSelected();
    const all = keys.flatMap((k) => linesFor(k));
    const sum = (kind) => round(all.filter((l) => l.kind === kind).reduce((a, l) => a + l.amt, 0));
    const printing = sum("print"), postage = sum("postage"), shipping = sum("ship"), addons = sum("addon");
    const subtotal = round(printing + postage + shipping + addons);
    const tax = round((printing + addons) * TAX_RATE);
    const total = round(subtotal + tax);
    let left = total;
    const promo = co.promo ? Math.min(PROMOS[co.promo].amount, left) : 0;
    left = round(left - promo);
    const store = co.useStore ? round(Math.min(Math.max(num(co.storeAmt), 0), STORE_CREDIT_BALANCE, left)) : 0;
    left = round(left - store);
    const ad = co.useAd ? round(Math.min(Math.max(num(co.adAmt), 0), AD_BUDGET_BALANCE, left)) : 0;
    left = round(left - ad);
    const due = left;
    const secondaryAmt = co.split ? round(Math.min(Math.max(num(co.secondaryAmt), 0), due)) : 0;
    const primaryAmt = round(due - secondaryAmt);
    return { printing, postage, shipping, addons, subtotal, tax, total, promo, store, ad, credits: round(promo + store + ad), due, primaryAmt, secondaryAmt };
}

function payMethod(id) {
    const [kind, ref] = id.split(":");
    if (kind === "acct") {
        const a = BILLING_ACCOUNTS.find((x) => x.id === ref);
        return { kind, ref, label: a.name, short: "Corporate billing", icon: "building", acct: a };
    }
    const c = S.cards.find((x) => x.id === ref);
    return { kind, ref, label: `${c.brand} •• ${c.last4}`, short: `${c.brand} •• ${c.last4}`, icon: "card", card: c };
}

function usedMethods(t = totals()) {
    const co = S.co;
    const out = [{ ...payMethod(co.primary), amt: t.primaryAmt }];
    if (co.split) out.push({ ...payMethod(co.secondary), amt: t.secondaryAmt });
    return out;
}

function checkoutBlockers(t = totals()) {
    const co = S.co, out = [];
    const productIssues = printSelected().reduce((n, k) => n + issues(k).length, 0);
    if (productIssues) out.push({ step: "products", text: `${plural(productIssues, "product item")} to finish` });
    const used = usedMethods(t);
    if (co.split && co.primary === co.secondary) out.push({ step: "payment", text: "Choose two different payment methods" });
    if (co.split && (t.secondaryAmt <= 0 || t.primaryAmt <= 0)) out.push({ step: "payment", text: "Split amounts must both be above $0" });
    if (used.some((m) => m.acct?.needsCostCenter && m.amt > 0) && !co.costCenter) out.push({ step: "payment", text: "Choose a cost center for corporate billing" });
    if (!co.ack) out.push({ step: "ack", text: "Confirm the proof acknowledgement" });
    return out;
}

const needsApproval = () => usedMethods().some((m) => m.kind === "acct" && m.amt > 0);

// ---------- Small UI helpers ----------

const bindId = (bind) => "f-" + bind.replace(/[^a-z0-9]/gi, "-");

function field({ bind, label, value, type = "text", placeholder = "", invalid = false, hint = "", after = "", attrs = "", cls = "" }) {
    const id = bindId(bind);
    return `<label class="fld ${cls} ${invalid ? "is-invalid" : ""}" for="${id}">
        <span class="fld-label">${label}</span>
        <input id="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" data-bind="${bind}" ${after ? `data-after="${after}"` : ""} ${type === "number" ? 'data-type="number"' : ""} ${invalid ? 'aria-invalid="true"' : ""} ${attrs}>
        ${hint ? `<span class="fld-hint">${hint}</span>` : ""}
    </label>`;
}

function toggle({ bind, checked, label, sub = "", after = "", right = "" }) {
    const id = bindId(bind);
    return `<label class="toggle" for="${id}">
        <input id="${id}" type="checkbox" role="switch" data-bind="${bind}" ${after ? `data-after="${after}"` : ""} ${checked ? "checked" : ""}>
        <span class="toggle-track" aria-hidden="true"><span></span></span>
        <span class="toggle-text"><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span>
        ${right ? `<span class="toggle-right">${right}</span>` : ""}
    </label>`;
}

function radioCard({ name, bind, value, checked, title, sub = "", right = "", disabled = false, why = "", iconName = "", after = "" }) {
    const id = bindId(`${bind}-${value}`);
    return `<label class="rcard ${checked ? "is-on" : ""} ${disabled ? "is-off" : ""}" for="${id}">
        <input id="${id}" type="radio" name="${name}" value="${value}" data-bind="${bind}" ${after ? `data-after="${after}"` : ""} ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span class="rcard-dot" aria-hidden="true">${checked ? icon("check", 12) : ""}</span>
        ${iconName ? `<span class="rcard-ic">${icon(iconName, 18)}</span>` : ""}
        <span class="rcard-text"><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}${why ? `<small class="rcard-why">${icon("info", 12)} ${why}</small>` : ""}</span>
        ${right ? `<span class="rcard-right">${right}</span>` : ""}
    </label>`;
}

const badge = (text, kind = "") => `<span class="badge ${kind}">${text}</span>`;
const proposal = (text = "Design proposal") => `<span class="badge proposal" title="Behavior proposed by this mockup, not an established requirement">${icon("flask", 11)} ${text}</span>`;

function statusPill(key) {
    const n = issues(key).length;
    if (!CAT[key].print) return badge("Set up later", "muted");
    return n ? `<span class="status warn">${icon("alert", 12)} ${n} to finish</span>` : `<span class="status ok">${icon("check", 12)} Ready</span>`;
}

// ---------- Header ----------

const STEPS = [
    { id: "start", label: "Listing & products" },
    { id: "customize", label: "Customize" },
    { id: "review", label: "Review & checkout" },
];

function stepIndex() {
    if (S.view === "audience") return 1;
    if (S.view === "done") return 3;
    return STEPS.findIndex((s) => s.id === S.view);
}

function Header() {
    const L = listing();
    const idx = stepIndex();
    const t = totals();
    const count = S.selected.length;
    return `<header class="top">
        <div class="brand"><span class="logo">APM</span><span class="brand-sub">Marketing Orders</span></div>
        <nav class="steps" aria-label="Order progress">
            ${STEPS.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "now" : "";
        const can = S.view !== "done" && (i === 0 || S.selected.length > 0);
        return `<button class="step ${state}" data-act="go" data-arg="${s.id}" ${can ? "" : "disabled"} ${i === idx ? 'aria-current="step"' : ""}>
                    <span class="step-n">${i < idx ? icon("check", 12) : i + 1}</span>${s.label}
                </button>${i < STEPS.length - 1 ? '<span class="step-line"></span>' : ""}`;
    }).join("")}
        </nav>
        <div class="top-right">
            <button class="ghost sm" data-act="modal" data-arg="notes">${icon("note", 15)} Design notes</button>
            ${S.view !== "done" ? `<button class="cart-btn" data-act="go" data-arg="review" ${count ? "" : "disabled"} aria-label="Order: ${count} products, ${money(t.subtotal)}">
                ${icon("cart", 16)}<span>${count}</span><b>${money(t.subtotal)}</b>
            </button>` : ""}
            <span class="avatar" title="${USER.name}, ${USER.role}">${USER.initials}</span>
        </div>
    </header>
    ${S.view !== "start" ? `<div class="context-bar">
        <div class="ctx-photo">${ART[L.photo]()}</div>
        <div class="ctx-text"><b>${L.street}</b><span>${L.city}</span></div>
        ${badge(L.event, "green")}
        <span class="ctx-meta">${icon("calendar", 13)} ${L.date} · ${L.note}</span>
        <span class="ctx-meta">${icon("users", 13)} For ${AGENT.name}, Cedar Realty</span>
        ${S.view !== "done" ? `<button class="link sm ctx-change" data-act="go" data-arg="start">Change</button>` : ""}
    </div>` : ""}`;
}

// ---------- 1. Listing & products ----------

function ViewStart() {
    const L = listing();
    const sel = S.selected;
    return `<main class="start">
        <section class="start-hero">
            <div>
                <p class="eyebrow">New order · ${USER.name}, ${USER.role}</p>
                <h1>What are we marketing?</h1>
                <p class="lede">Pick the listing or event first. Its address, price, photos, and agent details flow into every product you add, so you only enter them once.</p>
            </div>
        </section>

        <section class="block">
            <div class="sec-head"><h2>Listing or event</h2><span>3 active for Jordan Ellis</span></div>
            <div class="listing-row" role="radiogroup" aria-label="Listing">
                ${LISTINGS.map((l) => {
        const on = l.id === S.listingId;
        return `<button class="listing-card ${on ? "is-on" : ""}" role="radio" aria-checked="${on}" data-act="listing" data-arg="${l.id}">
                        <div class="lc-photo">${ART[l.photo]()}${on ? `<span class="lc-check">${icon("check", 14)} Active listing</span>` : ""}</div>
                        <div class="lc-body">
                            <div class="lc-top">${badge(l.event, on ? "green" : "")}<span class="lc-date">${icon("calendar", 12)} ${l.date}</span></div>
                            <b>${l.street}</b>
                            <span>${l.city}</span>
                            <span class="lc-meta">${fmtPrice(l.price)} · ${l.beds} bd · ${l.baths} ba · ${l.sqft.toLocaleString()} sq ft</span>
                        </div>
                    </button>`;
    }).join("")}
                <button class="listing-card listing-new" data-act="toast" data-arg="Creating a new event isn't part of this mockup.">
                    <span class="ln-plus">${icon("plus", 22)}</span><b>New listing or event</b><span>Open house, price change, just sold…</span>
                </button>
            </div>
        </section>

        <section class="block">
            <div class="sec-head"><h2>Products for ${L.street}</h2><span>Select every piece you need — you'll customize them one by one.</span></div>
            <div class="prod-grid">
                ${CAT_ORDER.map((k) => {
        const c = CAT[k], on = sel.includes(k);
        const focus = k === "flyers" || k === "brochures";
        return `<button class="prod-card ${on ? "is-on" : ""}" aria-pressed="${on}" data-act="toggleProduct" data-arg="${k}">
                        <span class="pc-check" aria-hidden="true">${on ? icon("check", 14) : ""}</span>
                        <div class="pc-art">${PRODUCT_ART[k]()}</div>
                        <div class="pc-body">
                            <div class="pc-title"><b>${c.name}</b>${c.free ? badge("Free", "green") : ""}${focus ? badge("Popular for new listings") : ""}</div>
                            <p>${c.blurb}</p>
                            <span class="pc-price">${c.free ? "Included with your plan" : c.from}</span>
                            ${!c.print ? `<span class="pc-note">${icon("info", 12)} Quick setup after checkout (not detailed in this mockup)</span>` : ""}
                        </div>
                        <span class="pc-state">${on ? "Selected" : "Select"}</span>
                    </button>`;
    }).join("")}
            </div>
        </section>

        <div class="start-bar ${sel.length ? "" : "is-empty"}">
            <div class="sb-listing"><div class="ctx-photo">${ART[L.photo]()}</div><div><b>${L.street}</b><span>${L.event} · ${L.date}</span></div></div>
            <div class="sb-chips">${sel.length
        ? sel.map((k) => `<span class="chip">${CAT[k].name}<button class="chip-x" data-act="toggleProduct" data-arg="${k}" aria-label="Remove ${CAT[k].name}">${icon("x", 12)}</button></span>`).join("")
        : `<span class="muted">No products selected yet</span>`}</div>
            <button class="primary lg" data-act="startCustomize" ${sel.length ? "" : "disabled"}>
                ${sel.length ? `Customize ${plural(sel.length, "product")}` : "Select a product"} ${icon("arrowR", 16)}
            </button>
        </div>
    </main>`;
}

// ---------- 2. Customize workspace ----------

function Rail() {
    const t = totals();
    const ready = printSelected().filter((k) => !issues(k).length).length;
    return `<aside class="rail" data-scroll="rail">
        <div class="rail-head"><h3>This order</h3><span>${ready} of ${printSelected().length} print items ready</span></div>
        <ol class="rail-list">
            ${S.selected.map((k, i) => {
        const on = k === S.active;
        return `<li><button class="rail-item ${on ? "is-on" : ""}" data-act="goProduct" data-arg="${k}" ${on ? 'aria-current="true"' : ""}>
                    <span class="ri-n">${i + 1}</span>
                    <span class="ri-text"><b>${CAT[k].name}</b>${statusPill(k)}</span>
                    <span class="ri-amt">${CAT[k].print ? money(itemTotal(k)) : CAT[k].free ? "Free" : "—"}</span>
                </button></li>`;
    }).join("")}
        </ol>
        <button class="link sm" data-act="go" data-arg="start">${icon("plus", 14)} Add or remove products</button>
        <div class="rail-total">
            <div class="rt-row"><span>Subtotal</span><b>${money(t.subtotal)}</b></div>
            <small>Before tax and credits. Postage and shipping included.</small>
            <button class="secondary full" data-act="go" data-arg="review">Review order ${icon("arrowR", 14)}</button>
        </div>
    </aside>`;
}

function Stage(key) {
    const p = S.products[key], L = listing(), c = CAT[key];
    const sides = c.layout === "tri" ? [["a", "Outside"], ["b", "Inside"]] : c.layout === "postcard" ? [["a", "Front"], ["b", "Back"]] : null;
    const tpl = TEMPLATES.find((x) => x.id === p.template);
    const approval = p.approved
        ? `<span class="status ok">${icon("shield", 13)} Proof approved by ${USER.name} · ${p.approvedAt}</span>`
        : p.stale
            ? `<span class="status warn">${icon("alert", 13)} Proof changed since your approval</span>`
            : `<span class="status pending">${icon("eye", 13)} Proof not yet approved</span>`;
    return `<section class="stage">
        <div class="stage-bar">
            <div class="sb-title">
                <h2>${c.name}</h2>
                <span class="muted">${tpl.name} template · ${c.layout === "tri" ? "Letter tri-fold" : c.layout === "flyer" ? "8.5 × 11 in" : "6 × 9 in"}</span>
            </div>
            <span class="save-state">${icon("check", 13)} ${p.savedAt ? `Changes saved ${p.savedAt}` : "All changes saved"}</span>
            ${sides ? `<div class="seg" role="tablist" aria-label="Proof side">${sides.map(([v, label]) => `<button role="tab" aria-selected="${p.side === v}" class="${p.side === v ? "is-on" : ""}" data-act="side" data-arg="${v}">${label}</button>`).join("")}</div>` : ""}
            <div class="seg" aria-label="Zoom">
                <button class="${p.zoom === "fit" ? "is-on" : ""}" data-act="zoom" data-arg="fit">Fit</button>
                <button class="${p.zoom === "full" ? "is-on" : ""}" data-act="zoom" data-arg="full">Actual size</button>
            </div>
        </div>
        <div class="canvas" data-scroll="canvas-${key}">
            <div class="sheet sheet-${c.layout} zoom-${p.zoom}">${renderProof(key, p, L)}</div>
        </div>
        <div class="stage-foot" data-field="approve">
            ${approval}
            <div class="sf-actions">
                <button class="secondary" data-act="openEditor">${icon("edit", 15)} Edit text &amp; photos</button>
                ${p.approved
            ? `<button class="ghost" data-act="unapprove">Undo approval</button>`
            : `<button class="primary" data-act="approve">${icon("check", 15)} Approve proof</button>`}
            </div>
        </div>
    </section>`;
}

function QrSection(key) {
    const p = S.products[key], q = p.qr;
    const head = q.status === "saved"
        ? `<span class="status ok">${icon("check", 12)} Saved</span>`
        : q.status === "draft"
            ? `<span class="status warn">${icon("alert", 12)} Not saved</span>`
            : `<span class="status muted">Optional</span>`;
    let body = "";
    if (p.qrOpen) {
        if (q.status === "none") {
            body = `<p class="help">Add a QR code that opens a web page — usually the listing page or a 3D tour.</p>
                <button class="secondary sm" data-act="qrAdd">${icon("plus", 14)} Add QR code</button>`;
        } else if (q.status === "saved" && !q.editing) {
            body = `<div class="qr-saved">
                <div class="qr-img">${qrSvg(q.savedUrl)}</div>
                <div class="qr-meta"><b>Opens</b><span class="mono">${esc(q.savedUrl)}</span><small>Saved ${q.savedAt}${q.override ? " · link not verified" : ""}</small></div>
            </div>
            ${q.confirmDelete
                    ? `<div class="callout danger" role="alert">${icon("trash", 15)}<div><b>Remove the QR code from this ${CAT[key].name.toLowerCase().replace(/s$/, "")}?</b><span>The proof will need a fresh approval.</span><div class="row-actions"><button class="danger sm" data-act="qrDelete">Remove</button><button class="ghost sm" data-act="qrDeleteCancel">Keep it</button></div></div></div>`
                    : `<div class="row-actions"><button class="ghost sm" data-act="qrEdit">${icon("edit", 13)} Change link</button><button class="ghost sm danger-text" data-act="qrDeleteAsk">${icon("trash", 13)} Delete</button></div>`}`;
        } else {
            const url = q.url.trim();
            const fmtErr = !url ? "Enter the web address the QR code should open." : !/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(url) ? "This isn't a complete web address. It should start with https:// — for example https://cedarrealty.example/listings/128-willow" : "";
            let state = "";
            if (fmtErr && (url || q.check === "tried")) state = `<div class="callout danger">${icon("alert", 15)}<div><b>${!url ? "Link required" : "Check the address"}</b><span>${fmtErr}</span></div></div>`;
            else if (q.check === "checking") state = `<div class="callout info">${icon("refresh", 15, "spin")}<div><b>Checking the link…</b><span>Simulated — no request leaves this page.</span></div></div>`;
            else if (q.check === "unreachable") {
                state = `<div class="callout warn" role="alert">${icon("alert", 15)}<div>
                    <b>We couldn't open this page</b>
                    <span>People who scan the code may see an error. Did you mean <button class="link inline mono" data-act="qrSuggest">…/listings/128-willow</button>?</span>
                    ${toggle({ bind: `products.${key}.qr.override`, checked: q.override, label: "Use this link anyway", sub: "I've checked it myself — e.g. the page goes live later." })}
                </div></div>`;
            } else if (q.check === "ok") state = `<div class="callout ok">${icon("check", 15)}<div><b>Link works — ready to save</b><span>Saving updates the code on your proof.</span></div></div>`;
            const canSave = !fmtErr && (q.check === "ok" || (q.check === "unreachable" && q.override));
            body = `${field({ bind: `products.${key}.qr.url`, label: "Destination URL", value: q.url, placeholder: "https://", after: "qrUrl", invalid: !!fmtErr && !!url, attrs: 'spellcheck="false" autocomplete="off"', cls: "mono-input" })}
                ${state}
                <div class="row-actions">
                    ${q.check === "ok" || (q.check === "unreachable" && q.override)
                    ? `<button class="primary sm" data-act="qrSave" ${canSave ? "" : "disabled"}>${icon("qr", 14)} Generate &amp; save</button>`
                    : `<button class="secondary sm" data-act="qrCheck" ${q.check === "checking" ? "disabled" : ""}>${icon("link", 14)} Check link</button>`}
                    ${q.status === "saved" ? `<button class="ghost sm" data-act="qrEditCancel">Cancel</button>` : `<button class="ghost sm danger-text" data-act="qrDiscard">Remove QR</button>`}
                </div>`;
        }
    }
    return `<div class="sub ${p.qrOpen ? "is-open" : ""}" data-field="qr">
        <button class="sub-head" data-act="qrToggle" aria-expanded="${p.qrOpen}">${icon("qr", 16)}<b>QR code</b>${head}${icon("chevD", 16, "chev")}</button>
        ${p.qrOpen ? `<div class="sub-body">${body}</div>` : ""}
    </div>`;
}

const DISTS = [
    { id: "mail", title: "Mail", icon: "mail", sub: "We print and mail one piece to each address on your lists." },
    { id: "ship", title: "Ship", icon: "truck", sub: "A bulk box of prints delivered to you." },
    { id: "pickup", title: "Pickup", icon: "store", sub: "Collect a printed batch from a print partner." },
    { id: "download", title: "Download", icon: "download", sub: "A digital JPG or PDF. Nothing is printed." },
];

function PaperChoice(key, qty) {
    const p = S.products[key];
    return `<div class="opt" data-field="paper">
        <div class="opt-head"><b>Paper</b><small>Price per printed piece</small></div>
        <div class="rlist">${PAPERS[key].map((x) => {
        const price = paperPrice(key, x.id, qty);
        return radioCard({
            name: `paper-${key}`, bind: `products.${key}.paper`, value: x.id, checked: p.paper === x.id,
            title: x.name, sub: x.note, right: price == null ? badge("Unavailable", "muted") : `$${price.toFixed(2)}`,
            disabled: price == null && p.paper !== x.id, why: price == null ? x.why : "", after: "",
        });
    }).join("")}</div>
    </div>`;
}

function QtyChoice(key) {
    const p = S.products[key];
    const q = num(p.qty);
    const bad = q < 25;
    return `<div class="opt" data-field="qty">
        <div class="opt-head"><b>Quantity</b><small>Minimum 25 · printed and boxed together</small></div>
        <div class="qty-row">
            <div class="stepper">
                <button data-act="qtyStep" data-arg="-25" aria-label="Decrease by 25">−</button>
                <input id="${bindId(`products.${key}.qty`)}" type="number" min="25" step="25" value="${esc(p.qty)}" data-bind="products.${key}.qty" data-type="number" aria-label="Quantity" ${bad ? 'aria-invalid="true"' : ""}>
                <button data-act="qtyStep" data-arg="25" aria-label="Increase by 25">+</button>
            </div>
            <div class="presets">${[50, 100, 250, 500].map((n) => `<button class="chip-btn ${q === n ? "is-on" : ""}" data-act="qty" data-arg="${n}">${n}</button>`).join("")}</div>
        </div>
        ${bad ? `<p class="fld-error">${icon("alert", 12)} Enter at least 25 copies.</p>` : ""}
    </div>`;
}

function MailOptions(key) {
    const p = S.products[key];
    const lists = p.lists.map((id) => S.lists.find((l) => l.id === id));
    const recip = recipients(p);
    const printed = printedQty(key);
    const miss = p.sample ? missingAddr(p.sampleAddr) : [];
    const a = p.sampleAddr;
    const segs = [...lists.map((l, i) => ({ label: l.name, n: l.count, cls: `seg-${i % 3}` })), ...(p.sample ? [{ label: "Your sample copy", n: 1, cls: "seg-sample" }] : [])];
    return `
    <div class="opt" data-field="lists">
        <div class="opt-head"><b>Recipients</b><small>Each address gets one piece</small></div>
        ${lists.length ? `<ul class="list-pills">${lists.map((l) => `<li>
            <span class="lp-ic">${icon(l.source === "Radius" ? "radius" : "users", 15)}</span>
            <span class="lp-text"><b>${esc(l.name)}</b><small>${l.source} · created ${l.created}</small></span>
            <span class="lp-n">${l.count.toLocaleString()}</span>
            <button class="icon-btn" data-act="removeList" data-arg="${l.id}" aria-label="Remove ${esc(l.name)}">${icon("x", 14)}</button>
        </li>`).join("")}</ul>` : `<div class="callout warn">${icon("users", 15)}<div><b>No mailing list yet</b><span>Choose a saved list or build one around the listing.</span></div></div>`}
        <button class="secondary sm" data-act="openAudience">${icon("users", 14)} ${lists.length ? "Change or add lists" : "Choose or create lists"}</button>
        ${printed ? `<div class="compose" aria-label="Quantity composition">
            <div class="compose-bar">${segs.map((s) => `<span class="${s.cls}" style="flex:${Math.max(s.n, printed * 0.015)}" title="${esc(s.label)}: ${s.n}"></span>`).join("")}</div>
            <div class="compose-eq">${segs.map((s) => `<span><i class="${s.cls}"></i>${s.n.toLocaleString()} ${s.cls === "seg-sample" ? "sample" : esc(s.label.split(" — ")[0])}</span>`).join('<em>+</em>')}<em>=</em><b>${printed.toLocaleString()} printed</b></div>
            <small class="muted">${recip.toLocaleString()} mailed to recipients${p.sample ? " · 1 mailed to you" : ""}. Postage and printing scale with this number.</small>
        </div>` : ""}
    </div>

    <div class="opt" data-field="sample">
        ${toggle({ bind: `products.${key}.sample`, checked: p.sample, label: "Mail me a sample copy", sub: "Adds 1 printed piece so you see exactly what recipients get.", right: p.sample ? badge("+1 piece", "green") : "" })}
        ${p.sample ? `<div class="addr ${miss.length ? "has-miss" : ""}">
            ${miss.length
                ? `<div class="callout warn" role="alert">${icon("alert", 15)}<div><b>Where should we send the sample?</b><span>Missing ${miss.join(", ")}. Without it, the sample can't be printed with this order.</span><div class="row-actions"><button class="secondary sm" data-act="officeAddr">${icon("building", 13)} Use Cedar Realty office</button></div></div></div>`
                : `<div class="callout ok">${icon("check", 15)}<div><b>Sample address complete</b><span>${esc(a.name)}${a.company ? `, ${esc(a.company)}` : ""} · ${esc(a.street1)}${a.street2 ? `, ${esc(a.street2)}` : ""}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</span></div></div>`}
            <div class="fgrid">
                ${field({ bind: `products.${key}.sampleAddr.name`, label: "Name", value: a.name, invalid: miss.includes("name") })}
                ${field({ bind: `products.${key}.sampleAddr.company`, label: "Company <i>optional</i>", value: a.company })}
                ${field({ bind: `products.${key}.sampleAddr.street1`, label: "Street address", value: a.street1, invalid: miss.includes("street address"), cls: "span2", placeholder: "Street and number" })}
                ${field({ bind: `products.${key}.sampleAddr.street2`, label: "Apt, suite <i>optional</i>", value: a.street2, cls: "span2" })}
                ${field({ bind: `products.${key}.sampleAddr.city`, label: "City", value: a.city, invalid: miss.includes("city") })}
                <div class="fgrid-2">
                    ${field({ bind: `products.${key}.sampleAddr.state`, label: "State", value: a.state, invalid: miss.includes("state"), attrs: 'maxlength="2"' })}
                    ${field({ bind: `products.${key}.sampleAddr.zip`, label: "ZIP", value: a.zip, invalid: miss.includes("5-digit ZIP"), attrs: 'maxlength="5" inputmode="numeric"' })}
                </div>
            </div>
        </div>` : ""}
    </div>

    <div class="opt">
        <div class="opt-head"><b>Mailing class</b><small>Delivery times are estimates</small></div>
        <div class="rlist">${MAIL_CLASSES.map((c) => radioCard({
                    name: `cls-${key}`, bind: `products.${key}.mailClass`, value: c.id, checked: p.mailClass === c.id,
                    title: c.name, sub: c.days, right: `$${c.price.toFixed(2)}<small>/ piece</small>`,
                })).join("")}</div>
    </div>
    ${PaperChoice(key, printed)}
    <div class="opt">${toggle({ bind: `products.${key}.pdf`, checked: p.pdf, label: "Add a print-ready PDF", sub: "Keep a copy for email or reprints.", right: money(PDF_ADDON) })}</div>`;
}

function ShipOptions(key) {
    const p = S.products[key];
    const o = AGENT.office;
    return `${QtyChoice(key)}
    ${PaperChoice(key, printedQty(key))}
    <div class="opt">
        <div class="opt-head"><b>Ship to</b><small>Ground, ${money(shipCost(printedQty(key)))}</small></div>
        <div class="ship-card">${icon("building", 18)}<div><b>${o.name}, ${o.company}</b><span>${o.street1}, ${o.street2}, ${o.city}, ${o.state} ${o.zip}</span><small>${icon("clock", 12)} Estimated arrival Wed, Nov 4 – Fri, Nov 6</small></div>
        <button class="link sm" data-act="toast" data-arg="Changing the ship-to address isn't part of this mockup.">Change</button></div>
    </div>
    <div class="opt">${toggle({ bind: `products.${key}.pdf`, checked: p.pdf, label: "Add a print-ready PDF", sub: "Keep a copy for email or reprints.", right: money(PDF_ADDON) })}</div>`;
}

function PickupOptions(key) {
    const p = S.products[key];
    return `${QtyChoice(key)}
    ${PaperChoice(key, printedQty(key))}
    <div class="opt">
        <div class="opt-head"><b>Pickup location</b>${proposal()}</div>
        <div class="rlist">${PICKUP_LOCATIONS.map((l) => radioCard({
        name: `pick-${key}`, bind: `products.${key}.pickupLoc`, value: l.id, checked: p.pickupLoc === l.id,
        title: l.name, sub: `${l.addr} · ${l.ready}`, iconName: "pin",
    })).join("")}</div>
    </div>
    <div class="opt">${toggle({ bind: `products.${key}.pdf`, checked: p.pdf, label: "Add a print-ready PDF", sub: "Keep a copy for email or reprints.", right: money(PDF_ADDON) })}</div>`;
}

function DownloadOptions(key) {
    const p = S.products[key];
    return `<div class="opt">
        <div class="opt-head"><b>File type</b><small>Available right after checkout</small></div>
        <div class="rlist">
            ${radioCard({ name: `dl-${key}`, bind: `products.${key}.dlFormat`, value: "jpg", checked: p.dlFormat === "jpg", title: "JPG image", sub: "For email, websites, and texting", right: "Free", iconName: "image" })}
            ${radioCard({ name: `dl-${key}`, bind: `products.${key}.dlFormat`, value: "pdf", checked: p.dlFormat === "pdf", title: "Print-ready PDF", sub: "High resolution with bleed for any printer", right: money(PDF_ADDON), iconName: "file" })}
        </div>
    </div>`;
}

function Panel(key) {
    const p = S.products[key], c = CAT[key];
    const list = issues(key);
    const lines = linesFor(key);
    const total = itemTotal(key);
    const idx = printSelected().indexOf(key);
    const nextKey = printSelected()[idx + 1] || S.selected.find((k) => !CAT[k].print && S.selected.indexOf(k) > S.selected.indexOf(key));
    const tpl = TEMPLATES.find((x) => x.id === p.template);
    const opts = { mail: MailOptions, ship: ShipOptions, pickup: PickupOptions, download: DownloadOptions }[p.dist](key);
    return `<section class="panel">
        <div class="panel-scroll" data-scroll="panel-${key}">
            <div class="psec">
                <div class="psec-head"><span class="psec-n">1</span><h3>Design</h3><span class="status ok">${icon("check", 12)} ${tpl.name}</span></div>
                <div class="tpl-row" role="radiogroup" aria-label="Template">
                    ${TEMPLATES.map((t) => `<button class="tpl ${p.template === t.id ? "is-on" : ""}" role="radio" aria-checked="${p.template === t.id}" data-act="template" data-arg="${t.id}">
                        <div class="tpl-thumb tpl-thumb-${c.layout}">${renderProof(key, p, listing(), { template: t.id, side: "a", mini: true })}</div>
                        <span><b>${t.name}</b>${p.defaultTemplate === t.id ? `<small>${icon("star", 10)} Your default</small>` : `<small>${t.note}</small>`}</span>
                    </button>`).join("")}
                </div>
                ${p.defaultTemplate === p.template
            ? `<p class="help ok-text">${icon("star", 13)} ${tpl.name} is your default for ${c.name.toLowerCase()}. New orders start with it.</p>`
            : `<button class="link sm" data-act="setDefault">${icon("star", 13)} Save ${tpl.name} as my default for ${c.name.toLowerCase()}</button>`}
                ${QrSection(key)}
            </div>

            <div class="psec">
                <div class="psec-head"><span class="psec-n">2</span><h3>How should these reach people?</h3></div>
                <div class="dist-grid" role="radiogroup" aria-label="Distribution">
                    ${DISTS.map((d) => `<button class="dist ${p.dist === d.id ? "is-on" : ""}" role="radio" aria-checked="${p.dist === d.id}" data-act="dist" data-arg="${d.id}">
                        <span class="dist-top">${icon(d.icon, 18)}<b>${d.title}</b>${p.dist === d.id ? `<span class="dist-check">${icon("check", 12)}</span>` : ""}</span>
                        <small>${d.sub}</small>
                    </button>`).join("")}
                </div>
            </div>

            <div class="psec">
                <div class="psec-head"><span class="psec-n">3</span><h3>${{ mail: "Audience & mailing", ship: "Quantity & shipping", pickup: "Quantity & pickup", download: "Download format" }[p.dist]}</h3></div>
                ${opts}
            </div>
        </div>

        <div class="panel-foot">
            ${list.length ? `<div class="pf-issues">
                <span class="status warn">${icon("alert", 12)} ${plural(list.length, "thing")} left for ${c.name.toLowerCase()}</span>
                <ul>${list.map((i) => `<li><button class="link sm" data-act="fix" data-arg="${key}:${i.field}">${i.text}</button></li>`).join("")}</ul>
            </div>` : `<div class="pf-issues"><span class="status ok">${icon("check", 12)} ${c.name} ready for checkout</span></div>`}
            <div class="pf-price-row">
                <div><small>${c.name} · ${p.dist === "download" ? "digital" : `${printedQty(key).toLocaleString()} printed`}</small><b class="big-amt">${money(total)}</b></div>
                <button class="link sm" data-act="lines" aria-expanded="${p.showLines}">How is this priced? ${icon("chevD", 13, p.showLines ? "rot" : "")}</button>
            </div>
            ${p.showLines ? `<ul class="lines">${lines.map((l) => `<li class="${l.missing ? "warn-text" : ""}"><span>${l.label}</span><b>${money(l.amt)}</b></li>`).join("")}<li class="lines-note">Tax is calculated at checkout on printing and add-ons.</li></ul>` : ""}
            <button class="primary lg full" data-act="next">
                ${nextKey ? `Next: ${CAT[nextKey].name}` : "Review order"} ${icon("arrowR", 16)}
            </button>
        </div>
    </section>`;
}

function OtherProduct(key) {
    const c = CAT[key];
    return `<section class="stage other">
        <div class="other-card">
            <div class="pc-art">${PRODUCT_ART[key]()}</div>
            <h2>${c.name}</h2>
            <p>${c.blurb}</p>
            <div class="callout info">${icon("info", 15)}<div><b>Set up after checkout</b><span>This mockup focuses on printed flyers and brochures. ${c.name} stays linked to ${listing().street} and appears in your order at ${c.free ? "no cost" : "the budget you choose during ad setup"}.</span></div></div>
            <div class="row-actions"><button class="ghost" data-act="toggleProduct" data-arg="${key}">Remove from order</button><button class="primary" data-act="next">Continue ${icon("arrowR", 15)}</button></div>
        </div>
    </section>`;
}

function ViewCustomize() {
    const key = S.active;
    return `<main class="cz ${CAT[key].print ? "" : "cz-other"}">
        ${Rail()}
        ${CAT[key].print ? Stage(key) + Panel(key) : OtherProduct(key)}
    </main>`;
}

// ---------- 3. Audience: saved lists + radius builder ----------

function ViewAudience() {
    const key = S.active, p = S.products[key], a = S.aud;
    const draft = { ...p, lists: a.sel };
    const recip = recipients(draft);
    const printed = recip + (p.sample ? 1 : 0);
    const before = itemTotal(key), after = itemTotal(key, draft);
    const delta = round(after - before);
    return `<main class="aud">
        <div class="aud-top">
            <button class="ghost" data-act="audCancel">${icon("arrowL", 15)} Back to ${CAT[key].name}</button>
            <span class="crumbs">${CAT[key].name} <i>›</i> Mail <i>›</i> <b>Recipients</b></span>
        </div>
        <div class="aud-grid">
            <section class="aud-main">
                <div class="tabs" role="tablist">
                    <button role="tab" aria-selected="${a.tab === "saved"}" class="${a.tab === "saved" ? "is-on" : ""}" data-act="audTab" data-arg="saved">Saved lists <span class="count">${S.lists.length}</span></button>
                    <button role="tab" aria-selected="${a.tab === "create"}" class="${a.tab === "create" ? "is-on" : ""}" data-act="audTab" data-arg="create">${icon("plus", 14)} Create a list</button>
                </div>
                ${a.tab === "saved" ? SavedLists() : CreateList()}
            </section>
            <aside class="aud-side">
                <h3>Who receives ${CAT[key].name.toLowerCase()}</h3>
                ${a.sel.length ? `<ul class="aside-lists">${a.sel.map((id) => {
        const l = S.lists.find((x) => x.id === id);
        return `<li><span>${esc(l.name)}</span><b>${l.count.toLocaleString()}</b></li>`;
    }).join("")}</ul>` : `<p class="muted">No lists selected.</p>`}
                <dl class="aside-sum">
                    <div><dt>Recipients</dt><dd>${recip.toLocaleString()}</dd></div>
                    <div><dt>Sample copy</dt><dd>${p.sample ? "+1" : "Off"}</dd></div>
                    <div class="strong"><dt>Printed pieces</dt><dd>${printed.toLocaleString()}</dd></div>
                    <div><dt>${CAT[key].name} cost</dt><dd>${money(after)}</dd></div>
                </dl>
                ${delta !== 0 ? `<p class="delta ${delta > 0 ? "up" : "down"}">${delta > 0 ? "+" : "−"}${money(Math.abs(delta))} vs. current order — printing and postage are per piece.</p>` : `<p class="delta">No change from your current order.</p>`}
                <button class="primary lg full" data-act="audApply" ${a.sel.length ? "" : "disabled"}>${a.sel.length ? `Use ${plural(a.sel.length, "list")} · ${plural(recip, "recipient")}` : "Select a list"}</button>
                <button class="ghost full" data-act="audCancel">Cancel</button>
            </aside>
        </div>
    </main>`;
}

function SavedLists() {
    const a = S.aud;
    return `<table class="tbl">
        <thead><tr><th class="c-check"><span class="sr">Select</span></th><th>List name</th><th class="num">Recipients</th><th>Created</th><th><span class="sr">Actions</span></th></tr></thead>
        <tbody>${S.lists.map((l) => {
        const on = a.sel.includes(l.id);
        return `<tr class="${on ? "is-on" : ""}">
                <td class="c-check"><input type="checkbox" id="lst-${l.id}" data-act-check="audToggle" data-arg="${l.id}" ${on ? "checked" : ""} aria-label="Select ${esc(l.name)}"></td>
                <td><label for="lst-${l.id}"><b>${esc(l.name)}</b><small>${icon(l.source === "Radius" ? "radius" : l.source === "Street" ? "street" : l.source === "Upload" ? "upload" : "users", 12)} ${l.source}${l.fresh ? ` ${badge("New", "green")}` : ""}</small></label></td>
                <td class="num">${l.count.toLocaleString()}</td>
                <td>${l.created}</td>
                <td class="num"><button class="link sm" data-act="toast" data-arg="List editing isn't part of this mockup.">${icon("edit", 13)} Edit</button></td>
            </tr>`;
    }).join("")}</tbody>
    </table>
    <p class="help">Need a different audience? <button class="link inline" data-act="audTab" data-arg="create">Create a list</button> from an upload, a radius around the listing, a street, demographics, or your CRM.</p>`;
}

function CreateList() {
    const a = S.aud;
    return `<div class="methods" role="radiogroup" aria-label="List source">
        ${LIST_METHODS.map((m) => `<button class="method ${a.method === m.id ? "is-on" : ""}" role="radio" aria-checked="${a.method === m.id}" data-act="audMethod" data-arg="${m.id}">
            ${icon(m.icon, 18)}<b>${m.name}</b><small>${m.note}</small>
        </button>`).join("")}
    </div>
    ${a.method === "radius" ? RadiusBuilder() : OtherMethod(a.method)}`;
}

function RadiusBuilder() {
    const r = S.aud.r, key = S.active;
    const ready = r.status === "ready" || r.status === "stale";
    const miles = (0.08 + Math.sqrt(num(r.qty)) * 0.035).toFixed(2);
    const typeLabel = { single: "single-family homes", multi: "multi-family units", both: "homes and units" }[r.type];
    const rows = radiusResults(num(r.qty), r.type);
    const qtyBad = !(num(r.qty) >= 10 && num(r.qty) <= 500);
    return `<div class="radius">
        <div class="radius-form">
            ${field({ bind: "aud.r.center", label: "Center address", value: r.center, after: "radius" })}
            <div class="fgrid-2">
                ${field({ bind: "aud.r.zip", label: "ZIP", value: r.zip, after: "radius", attrs: 'maxlength="5"' })}
                ${field({ bind: "aud.r.qty", label: "Recipients", value: r.qty, type: "number", after: "radius", invalid: qtyBad, attrs: 'min="10" max="500"' })}
            </div>
            ${qtyBad ? `<p class="fld-error">${icon("alert", 12)} Choose between 10 and 500 recipients.</p>` : ""}
            <p class="help">${icon("pin", 13)} Centered on the active listing. We pick the ${num(r.qty) || 0} nearest matching addresses.</p>
            <div class="opt-head"><b>Property type</b></div>
            <div class="seg seg-full">
                ${[["single", "Single-family"], ["multi", "Multi-family"], ["both", "Both"]].map(([v, l]) => `<button class="${r.type === v ? "is-on" : ""}" aria-pressed="${r.type === v}" data-act="radiusType" data-arg="${v}">${l}</button>`).join("")}
            </div>
            ${toggle({ bind: "aud.r.exclude", checked: r.exclude, label: "Exclude 128 Willow Lane", sub: "Don't mail the listing itself.", after: "radius" })}
            ${field({ bind: "aud.r.name", label: "Save list as", value: r.name })}
            <button class="secondary full" data-act="radiusFind" ${r.status === "loading" || qtyBad ? "disabled" : ""}>
                ${r.status === "loading" ? `${icon("refresh", 15, "spin")} Finding addresses…` : r.status === "stale" ? `${icon("refresh", 15)} Update preview` : `${icon("radius", 15)} Preview addresses`}
            </button>
        </div>
        <div class="radius-map">
            <div class="map">${radiusMap({ qty: num(r.qty), type: r.type, exclude: r.exclude, ready })}
                ${!ready ? `<div class="map-empty">${r.status === "loading" ? `${icon("refresh", 18, "spin")} Searching around ${esc(r.center)}…` : `${icon("radius", 18)} Preview to see who's included`}</div>` : ""}
                ${r.status === "stale" ? `<div class="map-stale">${icon("alert", 13)} Settings changed — update the preview</div>` : ""}
            </div>
            <div class="map-legend">
                <span><i class="lg-sfh"></i>Single-family</span><span><i class="lg-mfh"></i>Multi-family</span><span><i class="lg-x"></i>${r.exclude ? "Excluded: listing" : "Listing (included)"}</span>
            </div>
            ${ready ? `<div class="results">
                <div class="results-head"><b>${num(r.qty)} ${typeLabel}</b><span>within about ${miles} mi of ${esc(r.center)}${r.exclude ? ", listing excluded" : ""}</span></div>
                <table class="tbl tbl-compact"><thead><tr><th>Recipient</th><th>Address</th><th>Type</th><th class="num">Distance</th></tr></thead>
                <tbody>${rows.map((x) => `<tr><td>Current Resident</td><td>${x.addr}, Austin TX ${r.zip}</td><td>${x.kind}</td><td class="num">${x.dist} mi</td></tr>`).join("")}
                ${!r.exclude ? `<tr class="hl"><td>Current Resident</td><td>128 Willow Lane, Austin TX ${r.zip}</td><td>Listing</td><td class="num">0.00 mi</td></tr>` : ""}</tbody></table>
                <p class="help">Showing ${rows.length + (r.exclude ? 0 : 1)} of ${num(r.qty)}. ${proposal("Proposed: names shown as Current Resident")}</p>
                <div class="row-actions">
                    <button class="primary" data-act="radiusSave" ${r.status === "ready" ? "" : "disabled"}>${icon("check", 15)} Save list &amp; add to ${CAT[key].name}</button>
                    <span class="muted sm">Adds ${num(r.qty)} recipients · ${printedQty(key) + num(r.qty)} printed pieces</span>
                </div>
            </div>` : ""}
        </div>
    </div>`;
}

function OtherMethod(id) {
    const m = LIST_METHODS.find((x) => x.id === id);
    const bodies = {
        upload: `<div class="drop">${icon("upload", 26)}<b>Drop a CSV or Excel file</b><span>Columns: name, street, city, state, ZIP. We'll show a preview and flag rows we can't mail to.</span><button class="secondary sm" data-act="toast" data-arg="Uploading isn't part of this mockup.">Choose file</button></div>`,
        street: `<div class="fgrid">${field({ bind: "aud.street", label: "Street name", value: "Willow Ln", cls: "span2" })}</div><p class="help">Every mailable address on the street, both sides, with an option to limit by block.</p>`,
        demo: `<div class="chips-row">${["Homeowners", "Renters", "Owned 7+ years", "Est. equity 40%+", "Households with children"].map((c, i) => `<span class="chip ${i === 2 ? "is-on" : ""}">${c}</span>`).join("")}</div><p class="help">Combine an area with household traits. Filters shown are illustrative.</p>`,
        crm: `<div class="crm-row">${["Follow Up Boss", "kvCORE", "Salesforce"].map((c) => `<button class="secondary sm" disabled>${icon("link", 13)} ${c}</button>`).join("")}</div><p class="help">Pick a saved contact group from a connected CRM. Connections are not simulated here.</p>`,
    };
    return `<div class="method-body">
        <div class="mb-head"><h3>${m.name}</h3>${proposal("Illustrative state")}</div>
        ${bodies[id]}
    </div>`;
}

// ---------- 4. Review, credits, payment, approval ----------

function ViewReview() {
    const co = S.co, t = totals();
    const prodIssues = printSelected().reduce((n, k) => n + issues(k).length, 0);
    const steps = [
        { id: "products", label: "Products", done: !prodIssues },
        { id: "credits", label: "Credits", done: co.visitedCredits },
        { id: "payment", label: "Payment", done: co.visitedPayment && !checkoutBlockers(t).some((b) => b.step === "payment") },
    ];
    const body = { products: ReviewProducts, credits: ReviewCredits, payment: ReviewPayment }[co.step]();
    return `<main class="rv">
        <div class="rv-main">
            <div class="rv-head"><h1>Review &amp; checkout</h1><p class="lede">Check every proof and destination, apply credits, then choose how this is paid.</p></div>
            <div class="co-steps" role="tablist">
                ${steps.map((s, i) => `<button role="tab" aria-selected="${co.step === s.id}" class="co-step ${co.step === s.id ? "is-on" : ""} ${s.done ? "is-done" : ""}" data-act="coStep" data-arg="${s.id}">
                    <span class="step-n">${s.done && co.step !== s.id ? icon("check", 12) : i + 1}</span>${s.label}
                </button>`).join("")}
            </div>
            ${body}
        </div>
        ${Summary(t)}
    </main>`;
}

function ReviewProducts() {
    const keys = S.selected;
    const n = printSelected().reduce((a, k) => a + issues(k).length, 0);
    return `<div class="rv-items">
        ${keys.map((k) => {
        const c = CAT[k];
        if (!c.print) {
            return `<article class="item item-mini"><div class="item-icon">${PRODUCT_ART[k]()}</div><div><b>${c.name}</b><span class="muted">Set up after checkout · linked to ${listing().street}</span></div><b class="item-amt">${c.free ? "Free" : "Budget later"}</b></article>`;
        }
        const p = S.products[k], list = issues(k), lines = linesFor(k);
        const dist = DISTS.find((d) => d.id === p.dist);
        const detail = p.dist === "mail"
            ? `${plural(recipients(p), "recipient")} on ${plural(p.lists.length, "list")}${p.sample ? " + 1 sample" : ""} · ${MAIL_CLASSES.find((x) => x.id === p.mailClass).name}`
            : p.dist === "ship" ? `${printedQty(k)} copies shipped to Cedar Realty, S Lamar`
                : p.dist === "pickup" ? `${printedQty(k)} copies · ${PICKUP_LOCATIONS.find((l) => l.id === p.pickupLoc).name}`
                    : p.dlFormat.toUpperCase() + " file";
        return `<article class="item">
                <div class="item-proof item-proof-${c.layout}">${renderProof(k, p, listing(), { side: "a", mini: true })}</div>
                <div class="item-body">
                    <div class="item-top"><h3>${c.name}</h3>${statusPill(k)}<button class="link sm" data-act="goProduct" data-arg="${k}">${icon("edit", 13)} Edit</button></div>
                    <div class="item-tags">
                        <span class="tag">${icon("layers", 12)} ${TEMPLATES.find((x) => x.id === p.template).name}</span>
                        <span class="tag">${icon(dist.icon, 12)} ${dist.title}</span>
                        ${p.dist !== "download" ? `<span class="tag">${PAPERS[k].find((x) => x.id === p.paper).name}</span>` : ""}
                        ${p.qr.status === "saved" ? `<span class="tag">${icon("qr", 12)} QR</span>` : ""}
                        ${p.approved ? `<span class="tag ok">${icon("shield", 12)} Proof approved</span>` : ""}
                    </div>
                    <p class="item-detail">${detail}</p>
                    ${list.length ? `<ul class="item-issues">${list.map((i) => `<li>${icon("alert", 13)} ${i.text} <button class="link sm" data-act="fix" data-arg="${k}:${i.field}">Fix</button></li>`).join("")}</ul>` : ""}
                    <ul class="lines">${lines.map((l) => `<li><span>${l.label}</span><b>${money(l.amt)}</b></li>`).join("")}</ul>
                </div>
                <b class="item-amt">${money(itemTotal(k))}</b>
            </article>`;
    }).join("")}
        <div class="rv-next">
            ${n ? `<span class="status warn">${icon("alert", 12)} ${plural(n, "item")} to finish before payment — use Fix to jump straight there.</span>` : `<span class="status ok">${icon("check", 12)} All products are ready</span>`}
            <button class="primary lg" data-act="coStep" data-arg="credits">Continue to credits ${icon("arrowR", 15)}</button>
        </div>
    </div>`;
}

function ReviewCredits() {
    const co = S.co, t = totals();
    return `<div class="credits">
        <div class="credit">
            <div class="credit-head">${icon("tag", 18)}<div><b>Promo code</b><small>One code per order</small></div>${co.promo ? `<b class="amt-green">${money(-t.promo)}</b>` : ""}</div>
            ${co.promo
            ? `<div class="applied">${icon("check", 14)} <span><b>${co.promo}</b> applied — ${PROMOS[co.promo].label.split(" · ")[1]}</span><button class="link sm" data-act="promoRemove">Remove</button></div>`
            : `<div class="promo-row">
                    ${field({ bind: "co.promoInput", label: "Code", value: co.promoInput, placeholder: "e.g. LISTED10", after: "promo", invalid: !!co.promoError, attrs: 'autocomplete="off" spellcheck="false"' })}
                    <button class="secondary" data-act="promoApply">Apply</button>
                </div>
                ${co.promoError ? `<p class="fld-error">${icon("alert", 12)} ${co.promoError}</p>` : ""}
                <p class="help">Available on your account: <button class="link inline mono" data-act="promoUse">LISTED10</button></p>`}
        </div>
        <div class="credit">
            <div class="credit-head">${icon("star", 18)}<div><b>Store credit</b><small>Balance ${money(STORE_CREDIT_BALANCE)}</small></div>${t.store ? `<b class="amt-green">${money(-t.store)}</b>` : ""}</div>
            ${toggle({ bind: "co.useStore", checked: co.useStore, label: "Apply store credit" })}
            ${co.useStore ? `<div class="credit-amt">${field({ bind: "co.storeAmt", label: "Amount to use", value: co.storeAmt, type: "number", attrs: `min="0" max="${STORE_CREDIT_BALANCE}" step="0.01"` })}
                <button class="link sm" data-act="creditMax" data-arg="store">Use max</button></div>
                <div class="balance"><span>${money(STORE_CREDIT_BALANCE)}</span>${icon("arrowR", 12)}<b>${money(round(STORE_CREDIT_BALANCE - t.store))} left after this order</b></div>` : ""}
        </div>
        <div class="credit">
            <div class="credit-head">${icon("chart", 18)}<div><b>Ad budget</b><small>Cedar Realty co-op budget · ${money(AD_BUDGET_BALANCE)} available</small></div>${t.ad ? `<b class="amt-green">${money(-t.ad)}</b>` : ""}</div>
            ${toggle({ bind: "co.useAd", checked: co.useAd, label: "Apply ad budget" })}
            ${co.useAd ? `<div class="credit-amt">${field({ bind: "co.adAmt", label: "Amount to use", value: co.adAmt, type: "number", attrs: `min="0" max="${AD_BUDGET_BALANCE}" step="0.01"` })}
                <button class="link sm" data-act="creditMax" data-arg="ad">Use max</button></div>
                <div class="balance"><span>${money(AD_BUDGET_BALANCE)}</span>${icon("arrowR", 12)}<b>${money(round(AD_BUDGET_BALANCE - t.ad))} left after this order</b></div>` : ""}
        </div>
        <div class="rv-next"><button class="ghost" data-act="coStep" data-arg="products">${icon("arrowL", 15)} Products</button><button class="primary lg" data-act="coStep" data-arg="payment">Continue to payment ${icon("arrowR", 15)}</button></div>
    </div>`;
}

function methodOptions(bind, current, exclude) {
    const opts = [
        ...BILLING_ACCOUNTS.map((a) => ({ id: `acct:${a.id}`, title: a.name, sub: `Requires approval · ${a.note}`, icon: "building" })),
        ...S.cards.map((c) => ({ id: `card:${c.id}`, title: `${c.brand} •• ${c.last4}`, sub: `${c.holder} · expires ${c.exp}`, icon: "card" })),
    ];
    return opts.map((o) => radioCard({ name: bind, bind, value: o.id, checked: current === o.id, title: o.title, sub: o.sub, iconName: o.icon, disabled: o.id === exclude })).join("");
}

function ReviewPayment() {
    const co = S.co, t = totals();
    const used = usedMethods(t);
    const corp = used.find((m) => m.kind === "acct" && m.amt > 0);
    const ccMissing = corp?.acct.needsCostCenter && !co.costCenter;
    const nc = co.newCard;
    return `<div class="pay">
        <div class="pay-due"><span>Balance to pay after credits</span><b>${money(t.due)}</b></div>
        <div class="opt">
            <div class="opt-head"><b>${co.split ? "First payment method" : "Pay with"}</b>${co.split ? `<small>${money(t.primaryAmt)}</small>` : ""}</div>
            <div class="rlist">${methodOptions("co.primary", co.primary)}</div>
            ${co.addingCard ? `<div class="newcard">
                <div class="mb-head"><b>Add a card</b><span class="badge muted">${icon("lock", 11)} Simulated — nothing is sent or stored</span></div>
                <div class="fgrid">
                    ${field({ bind: "co.newCard.name", label: "Name on card", value: nc.name, cls: "span2" })}
                    ${field({ bind: "co.newCard.number", label: "Card number", value: nc.number, placeholder: "4242 4242 4242 4242", cls: "span2", attrs: 'inputmode="numeric" autocomplete="off"' })}
                    ${field({ bind: "co.newCard.exp", label: "Expires", value: nc.exp, placeholder: "MM/YY", attrs: 'autocomplete="off"' })}
                    ${field({ bind: "co.newCard.zip", label: "Billing ZIP", value: nc.zip, attrs: 'maxlength="5" autocomplete="off"' })}
                </div>
                ${co.cardError ? `<p class="fld-error">${icon("alert", 12)} ${co.cardError}</p>` : ""}
                <div class="row-actions"><button class="primary sm" data-act="cardSave">Save card</button><button class="ghost sm" data-act="cardCancel">Cancel</button></div>
            </div>` : `<button class="link sm" data-act="cardAdd">${icon("plus", 14)} Add a card</button>`}
        </div>

        <div class="opt">
            ${toggle({ bind: "co.split", checked: co.split, label: "Split across two payment methods", sub: "For example: part on corporate billing, part on a card." })}
            ${co.split ? `<div class="split">
                <div class="rlist">${methodOptions("co.secondary", co.secondary, co.primary)}</div>
                <div class="split-amts">
                    ${field({ bind: "co.secondaryAmt", label: `Amount on ${payMethod(co.secondary).short}`, value: co.secondaryAmt, type: "number", attrs: 'min="0" step="0.01"' })}
                    <div class="split-rest"><small>Remaining on ${payMethod(co.primary).short}</small><b>${money(t.primaryAmt)}</b></div>
                </div>
                ${co.primary === co.secondary ? `<p class="fld-error">${icon("alert", 12)} Pick a different second method.</p>` : ""}
            </div>` : ""}
        </div>

        ${corp ? `<div class="opt corp" data-field="corp">
            <div class="opt-head"><b>Corporate billing details</b><small>${corp.acct.name}</small></div>
            <p class="help">${icon("info", 13)} ${corp.acct.note}. They'll see your note and the proofs before anything is printed or charged.</p>
            <div class="fgrid">
                <label class="fld ${ccMissing && co.tried ? "is-invalid" : ""}" for="f-co-costCenter">
                    <span class="fld-label">Cost center ${corp.acct.needsCostCenter ? "" : "<i>optional</i>"}</span>
                    <select id="f-co-costCenter" data-bind="co.costCenter">
                        <option value="">Choose…</option>
                        ${COST_CENTERS.map((c) => `<option ${co.costCenter === c ? "selected" : ""}>${c}</option>`).join("")}
                    </select>
                    ${ccMissing ? `<span class="fld-hint">Required by this billing account.</span>` : ""}
                </label>
                <label class="fld" for="f-co-org"><span class="fld-label">Organization</span><input id="f-co-org" value="Cedar Realty — Austin" readonly></label>
                <label class="fld span2" for="f-co-note"><span class="fld-label">Note to approver <i>optional</i></span>
                    <textarea id="f-co-note" rows="2" data-bind="co.note" placeholder="e.g. New listing launch — open house Nov 7">${esc(co.note)}</textarea></label>
            </div>
        </div>` : ""}
        <div class="rv-next"><button class="ghost" data-act="coStep" data-arg="credits">${icon("arrowL", 15)} Credits</button><span class="muted sm">Finish with the acknowledgement in the summary.</span></div>
    </div>`;
}

function Summary(t) {
    const co = S.co;
    const used = usedMethods(t);
    const blockers = checkoutBlockers(t);
    const approval = needsApproval();
    const ready = !blockers.length;
    return `<aside class="summary">
        <h3>Order summary</h3>
        <ul class="sum-lines">
            <li><span>Printing</span><b>${money(t.printing)}</b></li>
            <li><span>Postage</span><b>${money(t.postage)}</b></li>
            <li><span>Shipping &amp; pickup</span><b>${money(t.shipping)}</b></li>
            <li><span>Add-ons</span><b>${money(t.addons)}</b></li>
            <li class="sub"><span>Subtotal</span><b>${money(t.subtotal)}</b></li>
            <li><span>Estimated tax <small>8.25% on printing &amp; add-ons</small></span><b>${money(t.tax)}</b></li>
            <li class="sub"><span>Order total</span><b>${money(t.total)}</b></li>
            ${t.promo ? `<li class="cr"><span>Promo ${co.promo}</span><b>${money(-t.promo)}</b></li>` : ""}
            ${t.store ? `<li class="cr"><span>Store credit</span><b>${money(-t.store)}</b></li>` : ""}
            ${t.ad ? `<li class="cr"><span>Ad budget</span><b>${money(-t.ad)}</b></li>` : ""}
            <li class="due"><span>Balance remaining</span><b>${money(t.due)}</b></li>
        </ul>
        <div class="alloc">
            <small>Paid by</small>
            ${used.map((m) => `<div class="alloc-row">${icon(m.icon, 14)}<span>${m.kind === "acct" ? m.label : m.short}${m.kind === "acct" ? "<i>after approval</i>" : ""}</span><b>${money(m.amt)}</b></div>`).join("")}
        </div>
        <label class="ack ${co.tried && !co.ack ? "is-invalid" : ""}" for="f-co-ack">
            <input id="f-co-ack" type="checkbox" data-bind="co.ack" ${co.ack ? "checked" : ""}>
            <span>I've reviewed every proof, quantity, and mailing list. I'm responsible for the content, and printed or mailed pieces can't be changed once ${approval ? "approved" : "ordered"}.</span>
        </label>
        <button class="primary lg full" data-act="submit">${approval ? `${icon("shield", 16)} Submit for Approval` : `${icon("lock", 16)} Place order · ${money(t.due)}`}</button>
        <p class="help center">${approval
            ? `Your approver reviews it next. Nothing is printed or charged until it's approved.`
            : `Your card is charged now and printing starts within one business day.`} Simulated — no real payment.</p>
        ${co.tried && blockers.length ? `<ul class="blockers" role="alert">${blockers.map((b) => `<li>${icon("alert", 12)} <button class="link sm" data-act="${b.step === "ack" ? "focusAck" : "coStep"}" data-arg="${b.step}">${b.text}</button></li>`).join("")}</ul>` : ""}
        ${!co.tried && !ready ? `<p class="help center muted">${plural(blockers.length, "step")} left before submitting.</p>` : ""}
    </aside>`;
}

// ---------- Done ----------

function ViewDone() {
    const t = S.done;
    return `<main class="done-view">
        <div class="done-card">
            <div class="done-ic">${icon(t.approval ? "shield" : "check", 30)}</div>
            <p class="eyebrow">Order ${S.orderNo}</p>
            <h1>${t.approval ? "Submitted for approval" : "Order placed"}</h1>
            <p class="lede">${t.approval ? `${t.approver} has been asked to approve ${money(t.corpAmt)} on corporate billing.` : "Printing starts within one business day."} We'll email ${AGENT.email} at each step.</p>
            <ol class="timeline">
                <li class="done-step"><span>${icon("check", 12)}</span><div><b>Submitted</b><small>Today, ${clock()} by ${USER.name}</small></div></li>
                ${t.approval ? `<li class="now"><span>2</span><div><b>Approval</b><small>${t.approver} · usually within 1 business day</small></div></li>` : ""}
                <li><span>${t.approval ? 3 : 2}</span><div><b>Printing</b><small>Proofs locked; files sent to print</small></div></li>
                <li><span>${t.approval ? 4 : 3}</span><div><b>Delivery</b><small>${t.dest}</small></div></li>
            </ol>
            <div class="done-items">${t.items.map((i) => `<div><b>${i.name}</b><span>${i.detail}</span><b>${i.amt}</b></div>`).join("")}</div>
            <div class="row-actions center">
                <button class="primary" data-act="restart">Start another order for 128 Willow Lane</button>
                <button class="ghost" data-act="reset">Reset mockup</button>
            </div>
        </div>
    </main>`;
}

// ---------- Modals ----------

function EditorModal() {
    const e = S.editor, key = e.key, p = S.products[key];
    const draft = { ...p, copy: { headline: e.headline, blurb: e.blurb, photo: e.photo } };
    const dirty = e.headline !== p.copy.headline || e.blurb !== p.copy.blurb || e.photo !== p.copy.photo;
    return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ed-title">
        <div class="dialog dialog-wide">
            <header class="dlg-head"><h2 id="ed-title">Edit text &amp; photos · ${CAT[key].name}</h2>${proposal("Focused editor — design proposal")}<button class="icon-btn" data-act="editorCancel" aria-label="Close">${icon("x", 18)}</button></header>
            <div class="ed-grid">
                <div class="ed-preview"><div class="sheet sheet-${CAT[key].layout} zoom-fit">${renderProof(key, draft, listing())}</div></div>
                <div class="ed-form">
                    <label class="fld" for="f-ed-headline"><span class="fld-label">Headline <i>${e.headline.length}/24</i></span>
                        <input id="f-ed-headline" data-bind="editor.headline" maxlength="24" value="${esc(e.headline)}"></label>
                    <div class="chips-row">${["Just Listed", "Open House", "Price Improved", "Coming Soon"].map((h) => `<button class="chip-btn ${e.headline === h ? "is-on" : ""}" data-act="edHeadline" data-arg="${h}">${h}</button>`).join("")}</div>
                    <label class="fld" for="f-ed-blurb"><span class="fld-label">Description <i>${e.blurb.length}/240</i></span>
                        <textarea id="f-ed-blurb" rows="5" maxlength="240" data-bind="editor.blurb">${esc(e.blurb)}</textarea></label>
                    <div class="fld"><span class="fld-label">Main photo</span>
                        <div class="photo-pick">${Object.keys(ART).map((k) => `<button class="${e.photo === k ? "is-on" : ""}" aria-pressed="${e.photo === k}" data-act="edPhoto" data-arg="${k}">${ART[k]()}<span>${PHOTO_LABEL[k]}</span></button>`).join("")}</div>
                    </div>
                    <p class="help">${icon("lock", 13)} Price, address, beds/baths, and agent details come from the listing and stay consistent across every product.</p>
                </div>
            </div>
            <footer class="dlg-foot">
                <span class="${dirty ? "warn-text" : "muted"}">${dirty ? `${icon("edit", 13)} Unsaved changes${p.approved ? " · saving will reset proof approval" : ""}` : "No changes yet"}</span>
                <button class="ghost" data-act="editorCancel">${dirty ? "Discard" : "Close"}</button>
                <button class="primary" data-act="editorSave" ${dirty ? "" : "disabled"}>Save changes</button>
            </footer>
        </div>
    </div>`;
}

function NotesModal() {
    return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="notes-title">
        <div class="dialog">
            <header class="dlg-head"><h2 id="notes-title">Design notes</h2><button class="icon-btn" data-act="closeModal" aria-label="Close">${icon("x", 18)}</button></header>
            <div class="notes">
                <h3>Directions explored</h3>
                <ol>
                    <li><b>A · Proof Studio (built here).</b> Three-pane workspace: order rail, large live proof, configuration panel with a persistent price. Light/charcoal with a deeper, calmer green.</li>
                    <li><b>B · Guided Wizard.</b> One decision per screen with large cards and plain-language prompts. Friendliest for occasional agents, slow for coordinators placing many orders.</li>
                    <li><b>C · Order Board.</b> Spreadsheet-like grid of listing × product rows with inline settings and bulk actions. Fastest for coordinators, but the proof becomes a thumbnail.</li>
                </ol>
                <h3>Try these scenarios</h3>
                <ul>
                    <li>Select Flyers and Brochures, then customize. Flyers ship 100 copies.</li>
                    <li>Flyer QR: the saved link fails — use the suggestion or override, then Generate &amp; save.</li>
                    <li>Brochures: turn on the sample copy, resolve the missing address, then Change lists → Create a list → Radius → Preview → Save (100 + 50 + 1 = 151).</li>
                    <li>Checkout: apply LISTED10, keep store credit and ad budget, choose a cost center, acknowledge, Submit for Approval.</li>
                </ul>
                <p class="help">Items tagged ${proposal()} are behavior this mockup proposes beyond the brief.</p>
            </div>
        </div>
    </div>`;
}

function Toast() {
    return S.toast ? `<div class="toast" role="status">${icon("check", 15)} ${esc(S.toast)}</div>` : "";
}

function App() {
    const view = { start: ViewStart, customize: ViewCustomize, audience: ViewAudience, review: ViewReview, done: ViewDone }[S.view]();
    const modal = S.modal === "editor" ? EditorModal() : S.modal === "notes" ? NotesModal() : "";
    return `${Header()}${view}${modal}${Toast()}`;
}

// ---------- Actions ----------

let toastTimer;
function toast(msg) {
    S.toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { S.toast = null; render(); }, 3200);
}

function touchDesign(key) {
    const p = S.products[key];
    p.savedAt = clock();
    if (p.approved) {
        p.approved = false;
        p.stale = true;
    }
}

function goView(view) {
    S.view = view;
    S.scrollTop = true;
}

function nextAfter(key) {
    const order = [...printSelected(), ...S.selected.filter((k) => !CAT[k].print)];
    return order[order.indexOf(key) + 1];
}

function simulate(ms, fn) {
    setTimeout(() => { fn(); render(); }, ms);
}

const ACT = {
    go(view) {
        if (view === "customize" && !S.active) S.active = printSelected()[0] || S.selected[0];
        if (view === "customize" && !S.selected.includes(S.active)) S.active = S.selected[0];
        goView(view);
    },
    listing(id) { S.listingId = id; },
    toggleProduct(key) {
        S.selected = S.selected.includes(key) ? S.selected.filter((k) => k !== key) : [...S.selected, key];
        if (S.view === "customize" && !S.selected.includes(S.active)) {
            if (!S.selected.length) return goView("start");
            S.active = S.selected[0];
        }
    },
    startCustomize() {
        S.selected.sort((a, b) => (CAT[b].print ? 1 : 0) - (CAT[a].print ? 1 : 0));
        S.active = S.selected[0];
        goView("customize");
    },
    goProduct(key) { S.active = key; goView("customize"); },
    side(v) { S.products[S.active].side = v; },
    zoom(v) { S.products[S.active].zoom = v; },
    template(id) {
        const p = S.products[S.active];
        if (p.template === id) return;
        p.template = id;
        touchDesign(S.active);
    },
    setDefault() {
        const p = S.products[S.active];
        p.defaultTemplate = p.template;
        toast(`${TEMPLATES.find((t) => t.id === p.template).name} saved as your default for ${CAT[S.active].name.toLowerCase()}`);
    },
    approve() {
        const p = S.products[S.active];
        p.approved = true;
        p.stale = false;
        p.approvedAt = clock();
    },
    unapprove() { S.products[S.active].approved = false; },
    openEditor() {
        const p = S.products[S.active];
        S.editor = { key: S.active, ...p.copy };
        S.modal = "editor";
    },
    edHeadline(h) { S.editor.headline = h; },
    edPhoto(k) { S.editor.photo = k; },
    editorSave() {
        const e = S.editor, p = S.products[e.key];
        p.copy = { headline: e.headline, blurb: e.blurb, photo: e.photo };
        touchDesign(e.key);
        S.modal = null;
        toast("Text and photos saved to the proof");
    },
    editorCancel() { S.modal = null; S.editor = null; },
    closeModal() { S.modal = null; },
    modal(name) { S.modal = name; },
    toast(msg) { toast(msg); },
    qrToggle() { const p = S.products[S.active]; p.qrOpen = !p.qrOpen; },
    qrAdd() { Object.assign(S.products[S.active].qr, { status: "draft", url: "", check: null, override: false }); },
    qrSuggest() {
        const q = S.products[S.active].qr;
        q.url = listing().url;
        q.override = false;
        ACT.qrCheck();
    },
    qrCheck() {
        const key = S.active, q = S.products[key].qr;
        const url = q.url.trim();
        if (!url || !/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(url)) { q.check = "tried"; return; }
        q.check = "checking";
        // Simulated reachability: misspelled paths "fail", everything else passes.
        simulate(750, () => { q.check = /listngs|lisitngs|\/404/.test(url) ? "unreachable" : "ok"; });
    },
    qrSave() {
        const key = S.active, q = S.products[key].qr;
        Object.assign(q, { status: "saved", savedUrl: q.url.trim(), savedAt: clock(), editing: false, confirmDelete: false, override: q.check === "unreachable" && q.override });
        touchDesign(key);
        toast("QR code generated and placed on the proof");
    },
    qrEdit() { const q = S.products[S.active].qr; q.editing = true; q.url = q.savedUrl; q.check = null; },
    qrEditCancel() { S.products[S.active].qr.editing = false; },
    qrDeleteAsk() { S.products[S.active].qr.confirmDelete = true; },
    qrDeleteCancel() { S.products[S.active].qr.confirmDelete = false; },
    qrDelete() {
        Object.assign(S.products[S.active].qr, { status: "none", url: "", savedUrl: null, check: null, confirmDelete: false, override: false });
        touchDesign(S.active);
        toast("QR code removed");
    },
    qrDiscard() {
        Object.assign(S.products[S.active].qr, { status: "none", url: "", check: null, override: false });
        toast("QR code removed from the proof");
    },
    dist(id) { S.products[S.active].dist = id; },
    qty(n) { S.products[S.active].qty = +n; },
    qtyStep(d) { const p = S.products[S.active]; p.qty = Math.max(25, Math.round((num(p.qty) + +d) / 25) * 25); },
    officeAddr() {
        const o = AGENT.office;
        S.products[S.active].sampleAddr = { ...o };
        toast("Sample copy will go to Cedar Realty's office");
    },
    removeList(id) { const p = S.products[S.active]; p.lists = p.lists.filter((x) => x !== id); },
    lines() { const p = S.products[S.active]; p.showLines = !p.showLines; },
    next() {
        const n = nextAfter(S.active);
        if (n) { S.active = n; goView("customize"); } else { S.co.step = "products"; goView("review"); }
    },
    fix(arg) {
        const [key, f] = arg.split(":");
        S.active = key;
        if (f === "qr") S.products[key].qrOpen = true;
        goView("customize");
        S.scrollTop = false;
        S.flash = f;
    },
    openAudience() {
        const p = S.products[S.active];
        S.aud.sel = [...p.lists];
        S.aud.tab = "saved";
        goView("audience");
    },
    audTab(t) { S.aud.tab = t; },
    audToggle(id) { const a = S.aud; a.sel = a.sel.includes(id) ? a.sel.filter((x) => x !== id) : [...a.sel, id]; },
    audMethod(m) { S.aud.method = m; },
    audCancel() { goView("customize"); },
    audApply() {
        const p = S.products[S.active];
        p.lists = [...S.aud.sel];
        goView("customize");
        S.scrollTop = false;
        S.flash = "lists";
        toast(`${plural(recipients(p), "recipient")} on ${plural(p.lists.length, "list")} · ${printedQty(S.active)} printed pieces`);
    },
    radiusType(v) { S.aud.r.type = v; AFTER.radius(); },
    radiusFind() {
        const r = S.aud.r;
        r.status = "loading";
        simulate(900, () => { r.status = "ready"; });
    },
    radiusSave() {
        const r = S.aud.r, key = S.active, p = S.products[key];
        const id = `radius${S.lists.length + 1}`;
        S.lists.unshift({ id, name: r.name.trim() || "Radius list", count: num(r.qty), created: TODAY, source: "Radius", fresh: true });
        p.lists = [...new Set([...S.aud.sel, id])];
        r.status = "idle";
        goView("customize");
        S.scrollTop = false;
        S.flash = "lists";
        toast(`Added "${r.name}" (${num(r.qty)}) · ${CAT[key].name} now ${printedQty(key)} printed pieces`);
    },
    coStep(step) {
        const co = S.co;
        if (step === "ack") return ACT.focusAck();
        co.step = step;
        if (step === "credits") co.visitedCredits = true;
        if (step === "payment") co.visitedPayment = true;
        if (S.view !== "review") goView("review");
    },
    promoUse() { S.co.promoInput = "LISTED10"; ACT.promoApply(); },
    promoApply() {
        const co = S.co, code = co.promoInput.trim().toUpperCase();
        if (!code) { co.promoError = "Enter a code first."; return; }
        if (!PROMOS[code]) { co.promoError = `"${code}" isn't valid for this order. Check the spelling or try another code.`; return; }
        co.promo = code;
        co.promoError = "";
        toast(`${code} applied — ${money(PROMOS[code].amount)} off`);
    },
    promoRemove() { S.co.promo = null; S.co.promoInput = ""; },
    creditMax(which) {
        const co = S.co;
        // Max is limited by both the balance and what's left to pay.
        if (which === "store") { co.storeAmt = STORE_CREDIT_BALANCE; co.storeAmt = totals().store; }
        if (which === "ad") { co.adAmt = AD_BUDGET_BALANCE; co.adAmt = totals().ad; }
    },
    cardAdd() { S.co.addingCard = true; S.co.cardError = ""; },
    cardCancel() { S.co.addingCard = false; S.co.cardError = ""; },
    cardSave() {
        const co = S.co, nc = co.newCard;
        const digits = nc.number.replace(/\D/g, "");
        if (!nc.name.trim() || digits.length < 15 || !/^\d{2}\/\d{2}$/.test(nc.exp.trim()) || !/^\d{5}$/.test(nc.zip.trim())) {
            co.cardError = "Check the name, card number (15–16 digits), expiry (MM/YY), and ZIP.";
            return;
        }
        const brand = digits[0] === "4" ? "Visa" : digits[0] === "5" ? "Mastercard" : digits[0] === "3" ? "Amex" : "Card";
        const id = `new${S.cards.length}`;
        S.cards.push({ id, brand, last4: digits.slice(-4), exp: nc.exp.trim(), holder: nc.name.trim() });
        co.primary = `card:${id}`;
        co.addingCard = false;
        co.newCard = { name: "", number: "", exp: "", zip: "" };
        toast(`${brand} •• ${digits.slice(-4)} added (simulated)`);
    },
    focusAck() { S.flashAck = true; },
    submit() {
        const co = S.co, t = totals();
        co.tried = true;
        if (checkoutBlockers(t).length) return;
        const used = usedMethods(t);
        const corp = used.find((m) => m.kind === "acct");
        const approval = needsApproval();
        S.orderNo = "APM-" + (24800 + Math.floor(Math.random() * 90));
        S.done = {
            approval,
            approver: corp ? corp.acct.note.split(": ")[1] : "",
            corpAmt: corp ? corp.amt : 0,
            dest: printSelected().map((k) => {
                const p = S.products[k];
                return `${CAT[k].name}: ${p.dist === "mail" ? "mail drop to recipients" : p.dist === "ship" ? "ships to your office" : p.dist === "pickup" ? "ready for pickup" : "download link"}`;
            }).join(" · "),
            items: [
                ...printSelected().map((k) => ({ name: CAT[k].name, detail: `${DISTS.find((d) => d.id === S.products[k].dist).title} · ${S.products[k].dist === "download" ? S.products[k].dlFormat.toUpperCase() : `${printedQty(k)} printed`}`, amt: money(itemTotal(k)) })),
                { name: "Credits applied", detail: [t.promo && "Promo", t.store && "Store credit", t.ad && "Ad budget"].filter(Boolean).join(" · ") || "None", amt: money(-t.credits) },
                { name: "Balance", detail: used.map((m) => `${m.kind === "acct" ? "Corporate billing" : m.short} ${money(m.amt)}`).join(" + "), amt: money(t.due) },
            ],
        };
        goView("done");
    },
    restart() {
        const keep = { lists: S.lists, cards: S.cards, listingId: S.listingId };
        S = { ...initialState(), ...keep };
    },
    reset() { S = initialState(); },
};

const AFTER = {
    qrUrl() { const q = S.products[S.active].qr; q.check = null; q.override = false; },
    radius() { const r = S.aud.r; if (r.status === "ready") r.status = "stale"; },
    promo() { S.co.promoError = ""; },
};

// ---------- Render + events ----------

const root = document.getElementById("app");
let lastView = null;

function render() {
    const ae = document.activeElement;
    const focusId = ae && ae.id;
    let selS = null, selE = null;
    try { selS = ae.selectionStart; selE = ae.selectionEnd; } catch (e) { /* not a text input */ }
    const scrolls = {};
    if (lastView === S.view) document.querySelectorAll("[data-scroll]").forEach((el) => { scrolls[el.dataset.scroll] = el.scrollTop; });

    root.innerHTML = App();

    document.querySelectorAll("[data-scroll]").forEach((el) => { if (scrolls[el.dataset.scroll] != null) el.scrollTop = scrolls[el.dataset.scroll]; });
    if (S.scrollTop) { window.scrollTo(0, 0); S.scrollTop = false; }
    lastView = S.view;
    if (focusId) {
        const el = document.getElementById(focusId);
        if (el) {
            el.focus({ preventScroll: true });
            try { if (selS != null) el.setSelectionRange(selS, selE); } catch (e) { /* number inputs */ }
        }
    }
    if (S.flash) {
        const el = document.querySelector(`[data-field="${S.flash}"]`);
        if (el) {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
            el.classList.add("flash");
            const target = el.querySelector("[aria-invalid='true'], input:not([type=hidden]):not([disabled]), button.primary, button.secondary");
            target?.focus({ preventScroll: true });
        }
        S.flash = null;
    }
    if (S.flashAck) {
        const el = document.querySelector(".ack");
        el?.classList.add("flash");
        el?.querySelector("input")?.focus();
        S.flashAck = false;
    }
}

function setPath(path, value) {
    const parts = path.split(".");
    let o = S;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
}

document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]");
    if (!t || t.disabled) return;
    e.preventDefault();
    ACT[t.dataset.act]?.(t.dataset.arg, t);
    render();
});

document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.actCheck) {
        ACT[t.dataset.actCheck](t.dataset.arg);
        render();
        return;
    }
    if (!t.dataset.bind) return;
    let v;
    if (t.type === "checkbox") v = t.checked;
    else if (t.dataset.type === "number") v = t.value === "" ? "" : parseFloat(t.value);
    else v = t.value;
    setPath(t.dataset.bind, v);
    if (t.dataset.after) AFTER[t.dataset.after]();
    render();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && S.modal) {
        S.modal = null;
        render();
    }
    if (e.key === "Enter" && e.target.id === bindId("co.promoInput")) {
        ACT.promoApply();
        render();
    }
});

render();
