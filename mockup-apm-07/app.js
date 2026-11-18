// APM ordering prototype: local state, a single render(), and delegated events.

const STEPS = [
  { id: "product", label: "Product" },
  { id: "design", label: "Design" },
  { id: "delivery", label: "Delivery" },
  { id: "review", label: "Review" },
];
const REVIEW_STAGES = [
  { id: "products", label: "Products" },
  { id: "credits", label: "Credits" },
  { id: "payment", label: "Payment" },
];
const GOOD_URL = "https://cedarrealty.example/listings/128-willow-lane";

function freshDesign(pid) {
  const flyers = pid === "flyers";
  return {
    template: PRODUCTS[pid].defaultTemplate,
    defaultTemplate: PRODUCTS[pid].defaultTemplate,
    side: 0,
    hero: "exterior",
    text: { headline: "Just Listed", price: "", blurb: "" },
    approved: false,
    changedSinceApproval: false,
    qr: flyers
      ? { url: LISTINGS[0].url, status: "invalid", editing: false, draft: "", override: false }
      : { url: GOOD_URL, status: "saved", editing: false, draft: "", override: false },
    attempted: false,
  };
}

function freshDelivery(pid) {
  return {
    method: pid === "flyers" ? "ship" : "mail",
    qty: 100,
    customQty: "",
    paper: PRODUCTS[pid].papers[0].id,
    pdf: false,
    shipTo: "office",
    speed: "ground",
    pickup: "south",
    format: "pdf",
    lists: [],
    mailClass: "standard",
    sample: pid !== "flyers",
    sampleAddr: { name: "Jordan Ellis", company: "Cedar Realty", street1: "500 W 2nd St", street2: "Suite 300", city: "Austin", state: "TX", zip: "" },
    optionsOpen: false,
    attempted: false,
    showDetails: false,
  };
}

const state = {
  step: "product",
  maxStep: 0,
  listingId: "willow",
  selected: [],
  active: null,
  design: Object.fromEntries(PRINT_ORDER.map((p) => [p, freshDesign(p)])),
  delivery: Object.fromEntries(PRINT_ORDER.map((p) => [p, freshDelivery(p)])),
  lists: SAVED_LISTS.map((l) => ({ ...l })),
  drawer: null,
  drawerData: {},
  createMenu: false,
  focus: null,
  radius: null,
  productError: false,
  review: {
    stage: "products",
    promoOpen: false,
    promoInput: "",
    promoApplied: false,
    promoError: "",
    useStore: true,
    storeAmt: 20,
    useAd: true,
    adAmt: 30,
    method: "corp",
    costCenter: "",
    comments: "",
    split: false,
    splitVisa: "",
    splitMc: "",
    newCard: { name: "", number: "", exp: "", zip: "" },
    ack: false,
    attempted: false,
    showLines: false,
  },
  order: null,
  toast: null,
  focusField: null,
};

// ---------- helpers ----------

const money = (n) => (n < 0 ? "−" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round = (n) => Math.round(n * 100) / 100;
const listing = () => LISTINGS.find((l) => l.id === state.listingId);
const stepIdx = (id) => STEPS.findIndex((s) => s.id === id);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function setPath(path, value) {
  const keys = path.split(".");
  let o = state;
  while (keys.length > 1) o = o[keys.shift()];
  o[keys[0]] = value;
}

function attrs(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== false && v !== null)
    .map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`))
    .join(" ");
}

function proofCtx(pid, override = {}) {
  const d = state.design[pid];
  const L = listing();
  const qrOn = d.qr.status === "saved" || d.qr.status === "override";
  return {
    L,
    tpl: tplOf(override.template || d.template),
    text: { headline: d.text.headline, price: d.text.price, blurb: d.text.blurb },
    photos: [override.hero || d.hero, "living", "kitchen"],
    qr: qrOn ? d.qr.url : null,
  };
}

function qrCheck(url) {
  const v = (url || "").trim();
  if (!v) return { ok: false, msg: "Enter the page this QR code should open." };
  if (!/^https?:\/\//i.test(v)) return { ok: false, msg: "Start the link with https://", fix: "https://" + v.replace(/^\/+/, "") };
  if (/\s/.test(url.replace(/^\s+|\s+$/g, ""))) return { ok: false, msg: "Links can't contain spaces.", fix: v.replace(/\s+/g, "-") };
  if (!/^https?:\/\/[^/\s]+\.[a-z]{2,}/i.test(v)) return { ok: false, msg: "This doesn't look like a complete web address." };
  return { ok: true, msg: "Ready to save" };
}

// ---------- pricing ----------

function tierPrice(pid, qty) {
  const tiers = PRODUCTS[pid].tiers;
  let each = tiers[50];
  for (const q of QTY_OPTIONS) if (qty >= q) each = tiers[q];
  return each;
}

function effectiveQty(d) {
  return d.qty === "custom" ? Number(d.customQty) || 0 : d.qty;
}

function qtyError(d) {
  if (d.qty !== "custom") return null;
  const n = Number(d.customQty);
  if (!d.customQty) return "Enter a quantity.";
  if (!Number.isInteger(n) || n < 25) return "The minimum is 25 pieces.";
  if (n > 5000) return "Online pricing stops at 5,000. Request a quote from print support for larger runs.";
  return null;
}

function recipientCount(pid) {
  const d = state.delivery[pid];
  return d.lists.reduce((s, id) => s + (state.lists.find((l) => l.id === id)?.count || 0), 0);
}

function priceOf(pid) {
  const P = PRODUCTS[pid];
  const d = state.delivery[pid];
  const paper = P.papers.find((p) => p.id === d.paper) || P.papers[0];
  const add = paper.add || 0;
  const lines = [];
  let printed = 0;
  if (d.method === "mail") {
    const r = recipientCount(pid);
    const each = round(P.mail[d.mailClass] + add);
    printed = r ? r + (d.sample ? 1 : 0) : 0;
    lines.push({ label: `${r} mailed × ${money(each)}`, note: "Printing + postage", amount: round(r * each) });
    if (d.sample && r) lines.push({ label: "Sample copy to you", note: "Printed in the same run", amount: SAMPLE_PRICE });
  } else if (d.method === "ship" || d.method === "pickup") {
    const q = qtyError(d) ? 0 : effectiveQty(d);
    const each = round(tierPrice(pid, q) + add);
    printed = q;
    lines.push({ label: `${q} ${P.name.toLowerCase()} × ${money(each)}`, note: add ? `Includes ${paper.name}` : "", amount: round(q * each) });
    if (d.method === "ship") lines.push({ label: `${SHIPPING[d.speed].name} shipping`, note: SHIPPING[d.speed].note, amount: SHIPPING[d.speed].price });
  } else {
    lines.push({ label: `Digital ${d.format.toUpperCase()} files`, note: "No printing", amount: 0 });
  }
  if (d.pdf && d.method !== "download") lines.push({ label: "Print-ready PDF", note: "Emailed with your order", amount: PDF_ADDON });
  const total = round(lines.reduce((s, l) => s + l.amount, 0));
  return { lines, total, printed };
}

function totals() {
  const r = state.review;
  const subtotal = round(state.selected.reduce((s, p) => s + priceOf(p).total, 0));
  const tax = round(subtotal * TAX_RATE);
  let left = round(subtotal + tax);
  const credits = [];
  const take = (label, want) => {
    const amt = round(Math.max(0, Math.min(want, left)));
    if (amt > 0) {
      credits.push({ label, amount: amt });
      left = round(left - amt);
    }
  };
  const creditsVisible = state.step === "done" || (state.step === "review" && r.stage !== "products");
  if (!creditsVisible) return { subtotal, tax, credits, remaining: left };
  if (r.promoApplied) take(`Promo ${CREDITS.promo.code}`, CREDITS.promo.amount);
  if (r.useStore) take("Store credit", Math.min(Number(r.storeAmt) || 0, CREDITS.store.balance));
  if (r.useAd) take("Ad budget", Math.min(Number(r.adAmt) || 0, CREDITS.ad.balance));
  return { subtotal, tax, credits, remaining: left };
}

// ---------- validation ----------

function designIssue(pid) {
  const d = state.design[pid];
  if (d.qr.status === "invalid") return { key: "qr", msg: "Fix or remove the QR code link before approving." };
  if (d.qr.editing) return { key: "qr", msg: "Save or cancel your QR code change first." };
  return null;
}

function sampleMissing(d) {
  const a = d.sampleAddr;
  const missing = [];
  if (!a.name.trim() && !a.company.trim()) missing.push("name");
  if (!a.street1.trim()) missing.push("street");
  if (!a.city.trim()) missing.push("city");
  if (!/^[A-Za-z]{2}$/.test(a.state.trim())) missing.push("state");
  if (!/^\d{5}$/.test(a.zip.trim())) missing.push("ZIP code");
  return missing;
}

function deliveryIssues(pid) {
  const d = state.delivery[pid];
  const issues = [];
  if (d.method === "mail") {
    if (!d.lists.length) issues.push({ key: "lists", msg: "Choose at least one mailing list." });
    if (d.sample && sampleMissing(d).length) issues.push({ key: "sample", msg: `Sample copy address needs a ${sampleMissing(d).join(", ")}.` });
  }
  if ((d.method === "ship" || d.method === "pickup") && qtyError(d)) issues.push({ key: "qty", msg: qtyError(d) });
  return issues;
}

function deliveryDone(pid) {
  return state.delivery[pid].touched && !deliveryIssues(pid).length;
}

// ---------- actions ----------

function toast(msg) {
  state.toast = msg;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => {
    state.toast = null;
    render();
  }, 3200);
}

function goStep(id) {
  state.step = id;
  state.maxStep = Math.max(state.maxStep, stepIdx(id));
  state.focus = null;
  state.createMenu = false;
  if ((id === "design" || id === "delivery") && !state.selected.includes(state.active)) state.active = state.selected[0];
  scrollTopNext = true;
}

let scrollTopNext = false;

const ACT = {
  nav(ds) {
    const i = stepIdx(ds.step);
    if (i <= state.maxStep && state.step !== "done") goStep(ds.step);
  },
  toggleProduct(ds) {
    const s = state.selected;
    state.selected = s.includes(ds.id) ? s.filter((x) => x !== ds.id) : PRINT_ORDER.filter((p) => s.includes(p) || p === ds.id);
    state.productError = false;
    if (!state.selected.length) state.maxStep = 0;
  },
  digital(ds) {
    toast(`${ds.name} opens in its own workflow after this print order. Not included in this prototype.`);
  },
  stub(ds) {
    toast(ds.msg || "Not part of this prototype.");
  },
  openDrawer(ds) {
    state.drawer = ds.drawer;
    state.createMenu = false;
    const pid = state.active;
    if (ds.drawer === "templates") state.drawerData = { template: state.design[pid].template, makeDefault: false };
    if (ds.drawer === "editor") state.drawerData = { ...state.design[pid].text, price: state.design[pid].text.price || listing().price, blurb: state.design[pid].text.blurb || listing().blurb, hero: state.design[pid].hero };
    if (ds.drawer === "lists") state.drawerData = { picked: [...state.delivery[pid].lists] };
    if (ds.drawer === "listing") state.drawerData = { q: "", pick: state.listingId };
    if (ds.drawer === "proof") state.drawerData = { side: state.design[pid]?.side || 0 };
  },
  closeDrawer() {
    state.drawer = null;
  },
  pickListing(ds) {
    state.drawerData.pick = ds.id;
  },
  useListing() {
    if (state.drawerData.pick !== state.listingId) {
      state.listingId = state.drawerData.pick;
      PRINT_ORDER.forEach((p) => {
        state.design[p].approved = false;
        if (state.design[p].qr.status === "saved") state.design[p].qr.url = listing().url;
      });
      toast(`Listing changed to ${listing().street}. Proofs will need a fresh review.`);
    }
    state.drawer = null;
  },
  next() {
    const s = state.step;
    if (s === "product") {
      if (!state.selected.length) {
        state.productError = true;
        return;
      }
      state.active = state.selected[0];
      goStep("design");
    } else if (s === "design") approveAndContinue();
    else if (s === "delivery") deliveryContinue();
    else if (s === "review") reviewContinue();
  },
  back() {
    const s = state.step;
    const i = state.selected.indexOf(state.active);
    if (s === "design") {
      if (i > 0) state.active = state.selected[i - 1];
      else goStep("product");
    } else if (s === "delivery") {
      if (i > 0) state.active = state.selected[i - 1];
      else {
        goStep("design");
        state.active = state.selected[state.selected.length - 1];
      }
    } else if (s === "review") {
      const si = REVIEW_STAGES.findIndex((x) => x.id === state.review.stage);
      if (si > 0) state.review.stage = REVIEW_STAGES[si - 1].id;
      else {
        goStep("delivery");
        state.active = state.selected[state.selected.length - 1];
      }
    }
    scrollTopNext = true;
  },
  tab(ds) {
    state.active = ds.id;
    state.createMenu = false;
    scrollTopNext = true;
  },
  side(ds) {
    if (state.drawer === "proof") state.drawerData.side = Number(ds.side);
    else state.design[state.active].side = Number(ds.side);
  },
  pickTemplate(ds) {
    state.drawerData.template = ds.id;
  },
  applyTemplate() {
    const d = state.design[state.active];
    const changed = d.template !== state.drawerData.template;
    d.template = state.drawerData.template;
    if (state.drawerData.makeDefault) d.defaultTemplate = d.template;
    if (changed) markChanged(d);
    state.drawer = null;
    toast(changed ? `Template changed to ${tplOf(d.template).name}.` : "Template kept.");
  },
  saveEditor() {
    const d = state.design[state.active];
    const x = state.drawerData;
    d.text = { headline: x.headline, price: x.price === listing().price ? "" : x.price, blurb: x.blurb === listing().blurb ? "" : x.blurb };
    d.hero = x.hero;
    markChanged(d);
    state.drawer = null;
    toast("Text and photos saved to the proof.");
  },
  pickHero(ds) {
    state.drawerData.hero = ds.scene;
  },
  qrEdit() {
    const q = state.design[state.active].qr;
    q.editing = true;
    q.draft = q.url || "";
    q.override = false;
    state.focusField = "f-qr-url";
  },
  qrCancel() {
    state.design[state.active].qr.editing = false;
  },
  qrFix() {
    const q = state.design[state.active].qr;
    q.draft = qrCheck(q.draft).fix || q.draft;
    state.focusField = "f-qr-url";
  },
  qrSave() {
    const d = state.design[state.active];
    const q = d.qr;
    const check = qrCheck(q.draft);
    if (!check.ok && !(q.override && q.draft.trim())) return;
    const changed = q.url !== q.draft.trim() || q.status === "invalid";
    q.url = q.draft.trim();
    q.status = check.ok ? "saved" : "override";
    q.editing = false;
    if (changed) markChanged(d);
    toast(check.ok ? "QR code saved and added to the proof." : "QR code saved with an unverified link.");
  },
  qrRemove() {
    const d = state.design[state.active];
    d.qr = { url: "", status: "none", editing: false, draft: "", override: false };
    markChanged(d);
    toast("QR code removed from the proof.");
  },
  method(ds) {
    const d = state.delivery[state.active];
    d.method = ds.m;
    d.touched = true;
    d.attempted = false;
  },
  qty(ds) {
    const d = state.delivery[state.active];
    d.qty = ds.q === "custom" ? "custom" : Number(ds.q);
    if (ds.q === "custom") state.focusField = "f-custom-qty";
  },
  mailClass(ds) {
    state.delivery[state.active].mailClass = ds.c;
  },
  speed(ds) {
    state.delivery[state.active].speed = ds.s;
  },
  paper(ds) {
    state.delivery[state.active].paper = ds.p;
  },
  format(ds) {
    state.delivery[state.active].format = ds.f;
  },
  toggleOptions() {
    const d = state.delivery[state.active];
    d.optionsOpen = !d.optionsOpen;
  },
  fixSample() {
    const d = state.delivery[state.active];
    d.optionsOpen = true;
    d.attempted = true;
    const a = d.sampleAddr;
    state.focusField = !a.street1.trim() ? "f-sample-street1" : !a.city.trim() ? "f-sample-city" : !/^\d{5}$/.test(a.zip) ? "f-sample-zip" : "f-sample-name";
  },
  officeAddress() {
    Object.assign(state.delivery[state.active].sampleAddr, { name: "Jordan Ellis", company: "Cedar Realty", street1: "500 W 2nd St", street2: "Suite 300", city: "Austin", state: "TX", zip: "78701" });
    toast("Sample copy will go to the Cedar Realty office.");
  },
  removeList(ds) {
    const d = state.delivery[state.active];
    d.lists = d.lists.filter((x) => x !== ds.id);
  },
  pickList(ds) {
    const p = state.drawerData.picked;
    state.drawerData.picked = p.includes(ds.id) ? p.filter((x) => x !== ds.id) : [...p, ds.id];
  },
  useLists() {
    const d = state.delivery[state.active];
    d.lists = [...state.drawerData.picked];
    d.touched = true;
    state.drawer = null;
  },
  toggleCreate() {
    state.createMenu = !state.createMenu;
    if (state.drawer === "lists") state.drawer = null;
  },
  createFrom(ds) {
    state.createMenu = false;
    state.drawer = null;
    state.focus = { source: ds.src, pid: state.active };
    const L = listing();
    if (ds.src === "radius") state.radius = { center: L.street, zip: L.zip, qty: 50, type: "single", excludeTarget: true, name: "", showAll: false };
    if (ds.src === "upload") state.focus.upload = { file: null };
    if (ds.src === "street") state.focus.streets = ["Willow Ln"];
    if (ds.src === "demo") state.focus.demo = { zip: L.zip, value: "400-800", years: "7+" };
    if (ds.src === "crm") state.focus.crm = { connected: false, tag: "Past clients" };
    scrollTopNext = true;
  },
  cancelFocus() {
    state.focus = null;
    scrollTopNext = true;
  },
  radiusType(ds) {
    state.radius.type = ds.t;
  },
  useListingCenter() {
    state.radius.center = listing().street;
    state.radius.zip = listing().zip;
  },
  toggleAllAddresses() {
    state.radius.showAll = !state.radius.showAll;
  },
  confirmRadius() {
    const r = state.radius;
    if (radiusErrors().length) {
      r.attempted = true;
      return;
    }
    addList({ name: r.name.trim() || defaultRadiusName(), count: Number(r.qty), source: "Radius" });
  },
  fakeUpload() {
    state.focus.upload.file = "open-house-signins.csv";
  },
  toggleStreet(ds) {
    const s = state.focus.streets;
    state.focus.streets = s.includes(ds.s) ? s.filter((x) => x !== ds.s) : [...s, ds.s];
  },
  crmConnect() {
    state.focus.crm.connected = true;
  },
  confirmOther() {
    const f = state.focus;
    const counts = otherSourceCount();
    if (!counts.count) return;
    addList({ name: counts.name, count: counts.count, source: LIST_SOURCES.find((s) => s.id === f.source).name });
  },
  stage(ds) {
    state.review.stage = ds.s;
  },
  editProduct(ds) {
    state.active = ds.id;
    goStep(ds.to);
  },
  promoOpen() {
    state.review.promoOpen = true;
    state.focusField = "f-promo";
  },
  applyPromo() {
    const r = state.review;
    if (r.promoInput.trim().toUpperCase() === CREDITS.promo.code) {
      r.promoApplied = true;
      r.promoError = "";
      r.promoOpen = false;
    } else {
      r.promoError = r.promoInput.trim() ? "That code isn't valid for this order. Check the spelling or expiry date." : "Enter a promo code.";
    }
  },
  removePromo() {
    Object.assign(state.review, { promoApplied: false, promoInput: "", promoOpen: false });
  },
  payMethod(ds) {
    state.review.method = ds.m;
    state.review.split = false;
  },
  toggleSplit() {
    const r = state.review;
    r.split = !r.split;
    if (r.split) {
      const rem = totals().remaining;
      const half = round(rem / 2);
      r.splitVisa = half.toFixed(2);
      r.splitMc = round(rem - half).toFixed(2);
    }
  },
  toggleLines() {
    state.review.showLines = !state.review.showLines;
  },
  toggleDetails() {
    const d = state.delivery[state.active];
    d.showDetails = !d.showDetails;
  },
  newOrder() {
    location.reload();
  },
};

function markChanged(d) {
  if (d.approved) d.changedSinceApproval = true;
  d.approved = false;
}

function defaultRadiusName() {
  return `Willow Lane – ${state.radius.qty} nearest ${state.radius.type === "multi" ? "multi-family" : state.radius.type === "single" ? "single-family" : ""} homes`.replace("  ", " ");
}

function addList({ name, count, source }) {
  const id = "new-" + Date.now();
  state.lists.unshift({ id, name, count, created: "Oct 31, 2026", source, fresh: true });
  const pid = state.focus.pid;
  state.active = pid;
  const d = state.delivery[pid];
  d.lists.push(id);
  d.touched = true;
  state.focus = null;
  scrollTopNext = true;
  toast(`Added “${name}” · ${count} recipients. Saved to your mailing lists.`);
}

function approveAndContinue() {
  const pid = state.active;
  const d = state.design[pid];
  const issue = designIssue(pid);
  if (issue) {
    d.attempted = true;
    return;
  }
  d.approved = true;
  d.changedSinceApproval = false;
  d.attempted = false;
  const i = state.selected.indexOf(pid);
  const next = state.selected.slice(i + 1).find((p) => !state.design[p].approved) || state.selected.find((p) => !state.design[p].approved);
  if (next) {
    state.active = next;
    scrollTopNext = true;
    toast(`${PRODUCTS[pid].name} proof approved. Next: ${PRODUCTS[next].name}.`);
  } else {
    goStep("delivery");
    state.active = state.selected[0];
  }
}

function deliveryContinue() {
  const pid = state.active;
  const d = state.delivery[pid];
  d.touched = true;
  const issues = deliveryIssues(pid);
  if (issues.length) {
    d.attempted = true;
    if (issues[0].key === "sample") ACT.fixSample();
    return;
  }
  d.attempted = false;
  const next = state.selected.find((p) => !deliveryDone(p));
  if (next) {
    state.active = next;
    scrollTopNext = true;
  } else {
    goStep("review");
    state.review.stage = "products";
  }
}

function paymentIssues() {
  const r = state.review;
  const t = totals();
  const issues = {};
  if (r.method === "corp" && !r.costCenter) issues.costCenter = "Choose a cost center so the approver can route this order.";
  if (r.method !== "corp" && r.split) {
    const sum = round((Number(r.splitVisa) || 0) + (Number(r.splitMc) || 0));
    if (sum !== t.remaining) issues.split = `Allocations add up to ${money(sum)}. They need to equal ${money(t.remaining)}.`;
  }
  if (r.method === "new" && r.newCard.number.replace(/\D/g, "").length < 12) issues.newCard = "Enter the card details (simulated).";
  if (!r.ack) issues.ack = "Confirm you've reviewed the proofs before submitting.";
  if (r.useStore && Number(r.storeAmt) > CREDITS.store.balance) issues.store = "More than your store credit balance.";
  if (r.useAd && Number(r.adAmt) > CREDITS.ad.balance) issues.ad = "More than your ad budget balance.";
  return issues;
}

function reviewContinue() {
  const r = state.review;
  if (r.stage === "products") r.stage = "credits";
  else if (r.stage === "credits") {
    const iss = paymentIssues();
    if (iss.store || iss.ad) {
      r.attempted = true;
      return;
    }
    r.stage = "payment";
  } else {
    const iss = paymentIssues();
    if (Object.keys(iss).length) {
      r.attempted = true;
      return;
    }
    const t = totals();
    state.order = { id: "APM-" + (20417 + Math.floor(Math.random() * 60)), approval: r.method === "corp", totals: t };
    state.step = "done";
    state.maxStep = 4;
  }
  scrollTopNext = true;
}

// ---------- views: shell ----------

function view() {
  // Shared gradients live first in the DOM so hidden thumbnails never own the ids.
  return `<svg class="defs-host" width="0" height="0" aria-hidden="true"><defs>${PHOTO_DEFS}</defs></svg>
    <header class="topbar">
      <div class="brand"><span class="brand-mark">APM</span><span class="brand-name">Marketing Orders</span></div>
      <label class="top-search">${icon("search")}<input placeholder="Search orders and listings" aria-label="Search"></label>
      <div class="top-right">
        <button class="top-btn" data-act="stub" data-msg="No new notifications." title="Notifications">${icon("bell")}</button>
        <button class="top-btn" data-act="stub" data-msg="Help center opens in a new tab (not in this prototype)." title="Help">${icon("help")}</button>
        <button class="top-btn cart" title="Cart" data-act="stub" data-msg="This order is your cart. Review it in the Review step.">${icon("cart")}${state.selected.length ? `<span class="count">${state.selected.length}</span>` : ""}</button>
        <div class="user"><span class="avatar">${USER.initials}</span><span class="user-name">${USER.name}</span><span class="role">${USER.role}</span></div>
      </div>
    </header>
    <nav class="rail" aria-label="Apps">
      ${[["home", "Home"], ["orders", "Orders", true], ["building", "Listings"], ["users", "Audiences"], ["layers", "Library"], ["chart", "Reports"], ["gear", "Settings"]]
        .map(([ic, label, on]) => `<button class="rail-item ${on ? "on" : ""}" ${on ? "" : `data-act="stub" data-msg="${label} isn't part of this prototype."`}>${icon(ic)}<span>${label}</span></button>`)
        .join("")}
    </nav>
    ${sidebar()}
    <main class="content">
      <section class="panel">
        ${panelHead()}
        ${state.step === "done" ? doneView() : state.focus ? focusView() : stepView()}
      </section>
    </main>
    ${drawerView()}
    ${state.toast ? `<div class="toast" role="status">${icon("check")}${esc(state.toast)}</div>` : ""}`;
}

function sidebar() {
  const nav = (label, on, badge) => `<button class="side-item ${on ? "on" : ""}" ${on ? "" : `data-act="stub" data-msg="${label} isn't part of this prototype."`}>${label}${badge ? `<span class="side-badge">${badge}</span>` : ""}</button>`;
  return `<aside class="sidebar">
    <div class="side-group"><div class="side-title">Orders</div>
      ${nav("New order", true)}${nav("Drafts", false, 2)}${nav("Awaiting approval", false, 1)}${nav("Order history")}
    </div>
    <div class="side-group"><div class="side-title">Audiences</div>${nav("Mailing lists")}</div>
    <div class="side-group"><div class="side-title">Library</div>${nav("Templates")}${nav("Brand profile")}</div>
    ${orderProgress()}
  </aside>`;
}

function orderProgress() {
  if (!state.selected.length) return "";
  const L = listing();
  const t = totals();
  const mark = (ok, label) => `<span class="pmark ${ok ? "ok" : ""}">${ok ? icon("check") : `<i></i>`}${label}</span>`;
  return `<div class="side-order">
    <div class="side-title">This order</div>
    <div class="so-listing">${esc(L.street)}</div>
    ${state.selected
      .map(
        (p) => `<div class="so-row ${p === state.active && (state.step === "design" || state.step === "delivery") ? "cur" : ""}">
          <span class="so-name">${PRODUCTS[p].name}</span>
          <span class="so-marks">${mark(state.design[p].approved, "Design")}${mark(deliveryDone(p) && state.maxStep >= 2, "Delivery")}</span>
        </div>`
      )
      .join("")}
    ${state.maxStep >= 2 ? `<div class="so-total"><span>Est. total</span><b>${money(t.subtotal)}</b></div>` : ""}
  </div>`;
}

function panelHead() {
  const L = listing();
  const cur = state.step === "done" ? 4 : stepIdx(state.step);
  return `<div class="panel-head">
    <div class="ph-top">
      <div><div class="crumbs">Orders <span>/</span> New order</div><h1>${state.step === "done" ? "Order submitted" : "New marketing order"}</h1></div>
      ${state.step !== "done" ? `<div class="saved">${icon("check")}Draft saved automatically</div>` : ""}
    </div>
    <ol class="wizard">
      ${STEPS.map((s, i) => {
        const st = i < cur || (i <= state.maxStep && i !== cur) ? "done" : i === cur ? "active" : "todo";
        const can = i <= state.maxStep && i !== cur && state.step !== "done";
        return `<li class="wz ${st}"><button ${attrs({ "data-act": can ? "nav" : null, "data-step": s.id, disabled: !can, "aria-current": st === "active" ? "step" : null, "aria-label": `${s.label}${st === "done" ? " (completed)" : ""}` })}>
          <span class="wz-num">${st === "done" ? icon("check") : i + 1}</span><span class="wz-label">${s.label}</span></button></li>`;
      }).join("")}
    </ol>
    ${cur > 0 && cur < 4 ? `<div class="listing-strip">
      <span class="ls-thumb">${photoThumb("exterior")}</span>
      <b>${esc(L.street)}</b><span class="muted">${esc(L.city)}</span>
      <span class="tag">${esc(L.event)}</span><span class="muted">${esc(L.date)}</span>
      <span class="ls-agent muted">${esc(AGENT.name)} · ${esc(AGENT.company)}</span>
    </div>` : ""}
  </div>`;
}

function footer({ back, hint, primary, primaryAct = "next", extra = "" }) {
  return `<div class="panel-foot">
    <div class="pf-left">${back ? `<button class="btn" data-act="${back.act || "back"}">${icon("chevronLeft")}${back.label}</button>` : ""}</div>
    <div class="pf-hint">${hint || ""}</div>
    <div class="pf-right">${extra}<button class="btn primary" data-act="${primaryAct}">${primary}</button></div>
  </div>`;
}

function stepView() {
  if (state.step === "product") return productStep();
  if (state.step === "design") return designStep();
  if (state.step === "delivery") return deliveryStep();
  return reviewStep();
}

function columns(main, side) {
  return `<div class="panel-body" id="scroll-body"><div class="cols"><div class="col-main">${main}</div><aside class="col-side">${side}</aside></div></div>`;
}

function productTabs(kind) {
  return `<div class="ptabs" role="tablist">
    ${state.selected
      .map((p, i) => {
        let status;
        if (kind === "design") {
          const d = state.design[p];
          status = d.approved ? `<span class="st ok">${icon("check")}Approved</span>` : d.attempted && designIssue(p) ? `<span class="st err">${icon("warning")}Needs a fix</span>` : d.changedSinceApproval ? `<span class="st">Changed · review again</span>` : `<span class="st">Not reviewed</span>`;
        } else {
          const d = state.delivery[p];
          const iss = deliveryIssues(p);
          status = deliveryDone(p) ? `<span class="st ok">${icon("check")}${methodShort(p)}</span>` : d.attempted && iss.length ? `<span class="st err">${icon("warning")}Needs info</span>` : `<span class="st">${d.touched || d.method !== "mail" ? methodShort(p) : "Not set"}</span>`;
        }
        return `<button class="ptab ${p === state.active ? "on" : ""}" role="tab" aria-selected="${p === state.active}" data-act="tab" data-id="${p}">
          <span class="ptab-n">${i + 1}</span><span class="ptab-name">${PRODUCTS[p].name}</span>${status}</button>`;
      })
      .join("")}
  </div>`;
}

function methodShort(p) {
  const d = state.delivery[p];
  if (d.method === "mail") return `Mail · ${recipientCount(p)}`;
  if (d.method === "ship") return `Ship · ${effectiveQty(d)}`;
  if (d.method === "pickup") return `Pickup · ${effectiveQty(d)}`;
  return `Download · ${d.format.toUpperCase()}`;
}

// ---------- step 1: product ----------

function productStep() {
  const L = listing();
  const main = `
    <div class="section-label">Listing</div>
    <div class="card listing-card">
      <span class="lc-photo">${photoThumb("exterior")}</span>
      <div class="lc-body">
        <div class="lc-addr">${esc(L.street)}<span class="muted"> · ${esc(L.city)}</span></div>
        <div class="lc-meta"><span class="tag">${esc(L.event)}</span><span>${esc(L.date)}</span><span>${esc(L.price)}</span><span>${L.beds} bd · ${L.baths} ba · ${L.sqft} sq ft</span></div>
        <div class="muted small">Agent: ${esc(AGENT.name)}, ${esc(AGENT.company)}</div>
      </div>
      <button class="btn" data-act="openDrawer" data-drawer="listing">Change listing</button>
    </div>

    <div class="section-label">Print products <span class="muted normal">Select one or more. Each gets its own design and delivery.</span></div>
    <div class="prod-grid ${state.productError ? "has-error" : ""}">
      ${PRINT_ORDER.map((p) => {
        const on = state.selected.includes(p);
        return `<button ${attrs({ class: `prod-card ${on ? "on" : ""}`, "data-act": "toggleProduct", "data-id": p, role: "checkbox", "aria-checked": String(on) })}>
          <span class="pc-check">${on ? icon("check") : ""}</span>
          <span class="pc-art pc-${p}">${proofSVG(p, 0, proofCtx(p), "pc-svg")}</span>
          <span class="pc-name">${PRODUCTS[p].name}</span>
          <span class="pc-meta">${PRODUCTS[p].size}</span>
          <span class="pc-meta">${PRODUCTS[p].from}</span>
        </button>`;
      }).join("")}
    </div>
    ${state.productError ? `<div class="field-err">${icon("warning")}Select at least one print product to continue.</div>` : ""}

    <div class="section-label">Digital &amp; advertising <span class="muted normal">Set up separately</span></div>
    <div class="card digital-list">
      ${DIGITAL.map((g) => `<div class="dl-row"><span class="dl-name">${g.name}</span><span class="muted">${g.desc}</span><span class="${g.price === "Free" ? "free" : "muted"}">${g.price}</span><button class="link" data-act="digital" data-name="${g.name}">Set up ${icon("chevronRight")}</button></div>`).join("")}
    </div>`;

  const side = `<div class="card summary">
    <div class="card-title">Your order</div>
    <div class="sum-listing">${esc(L.street)}</div>
    ${state.selected.length
      ? `<ol class="sum-list">${state.selected.map((p) => `<li><span>${PRODUCTS[p].name}</span><span class="muted">${PRODUCTS[p].size}</span></li>`).join("")}</ol>
         <p class="muted small">Next you'll approve a proof for each product, then choose how it's delivered. Prices are set by quantity and delivery.</p>`
      : `<p class="muted small empty">No products selected yet.</p>`}
  </div>`;

  return (
    columns(main, side) +
    footer({ hint: state.selected.length ? `${plural(state.selected.length, "product")} for ${esc(L.street)}` : "", primary: `Continue to design ${icon("chevronRight")}` })
  );
}

// ---------- step 2: design ----------

function designStep() {
  const pid = state.active;
  const P = PRODUCTS[pid];
  const d = state.design[pid];
  const L = listing();
  const tpl = tplOf(d.template);
  const issue = d.attempted ? designIssue(pid) : null;

  const main = `
    ${productTabs("design")}
    <div class="step-head"><h2>Design · ${P.name}</h2><span class="muted">${P.size} · ${P.sides.join(" and ")}</span></div>
    <div class="card rows">
      <div class="row">
        <div class="row-ico">${icon("layers")}</div>
        <div class="row-main"><div class="row-label">Template</div><div>${tpl.name}${d.defaultTemplate === d.template ? ` <span class="pill">Your default</span>` : ""}</div><div class="muted small">${tpl.note}</div></div>
        <button class="btn" data-act="openDrawer" data-drawer="templates">Browse templates</button>
      </div>
      <div class="row">
        <div class="row-ico">${icon("image")}</div>
        <div class="row-main"><div class="row-label">Text &amp; photos</div>
          <div>${esc(d.text.headline)} · ${esc(d.text.price || L.price)} · Cover: ${d.hero === "exterior" ? "Front exterior" : d.hero === "backyard" ? "Backyard" : d.hero === "living" ? "Living room" : "Kitchen"}</div>
          <div class="muted small">Filled in from the listing. Edit to adjust wording or photos.</div></div>
        <button class="btn" data-act="openDrawer" data-drawer="editor">Edit text &amp; photos</button>
      </div>
      ${qrRow(pid, issue)}
    </div>
    <div class="approve-note ${d.approved ? "ok" : ""}">
      ${d.approved ? `${icon("check")}<span><b>Proof approved.</b> Any change will ask you to review it again.</span>` : d.changedSinceApproval ? `${icon("info")}<span><b>Proof updated since you approved it.</b> Check the preview, then approve again.</span>` : `${icon("info")}<span>Check every side of the proof. Approving confirms the content is ready to print.</span>`}
    </div>`;

  const side = proofPanel(pid);
  const i = state.selected.indexOf(pid);
  const nextName = state.selected.slice(i + 1).find((p) => !state.design[p].approved) || state.selected.find((p) => p !== pid && !state.design[p].approved);
  return (
    columns(main, side) +
    footer({
      back: { label: i > 0 ? PRODUCTS[state.selected[i - 1]].name : "Products" },
      hint: nextName ? `Next: ${PRODUCTS[nextName].name} design` : "Next: Delivery",
      primary: d.approved && !nextName && state.selected.every((p) => state.design[p].approved) ? `Continue to delivery ${icon("chevronRight")}` : `Approve proof &amp; continue ${icon("chevronRight")}`,
    })
  );
}

function qrRow(pid, issue) {
  const q = state.design[pid].qr;
  const err = issue && issue.key === "qr";
  let main, action;
  if (q.editing) {
    const check = qrCheck(q.draft);
    const touched = q.draft !== "";
    main = `<div class="row-label">QR code</div>
      <div class="qr-edit">
        <label class="lbl" for="f-qr-url">Destination URL <span class="req">Required</span></label>
        <div class="input-row">
          <input id="f-qr-url" class="input ${touched && !check.ok ? "invalid" : check.ok ? "valid" : ""}" data-bind="design.${pid}.qr.draft" value="${esc(q.draft)}" placeholder="https://" aria-invalid="${!check.ok}">
        </div>
        ${check.ok
          ? `<div class="field-ok">${icon("check")}Ready to save. The QR code will open this page.</div>`
          : `<div class="field-err">${icon("warning")}${check.msg}${check.fix ? ` <button class="link" data-act="qrFix">Use ${esc(check.fix.length > 52 ? check.fix.slice(0, 52) + "…" : check.fix)}</button>` : ""}</div>
             ${q.draft.trim() ? `<label class="check small"><input type="checkbox" data-bind="design.${pid}.qr.override" ${q.override ? "checked" : ""}><span>Use this link anyway. I understand the QR code may not open the right page.</span></label>` : ""}`}
        <div class="btn-row">
          <button class="btn ${check.ok || (q.override && q.draft.trim()) ? "primary-soft" : ""}" data-act="qrSave" ${check.ok || (q.override && q.draft.trim()) ? "" : "disabled"}>${check.ok ? "Generate &amp; save" : "Save anyway"}</button>
          <button class="btn ghost" data-act="qrCancel">Cancel</button>
          ${q.url ? `<button class="link danger" data-act="qrRemove">${icon("trash")}Remove QR code</button>` : ""}
        </div>
      </div>`;
    action = "";
  } else if (q.status === "invalid") {
    const c = qrCheck(q.url);
    main = `<div class="row-label">QR code</div><div class="mono">${esc(q.url)}</div><div class="field-err">${icon("warning")}This link can't be used yet: ${c.msg.toLowerCase()}</div>`;
    action = `<button class="btn" data-act="qrEdit">Fix link</button>`;
  } else if (q.status === "none") {
    main = `<div class="row-label">QR code</div><div class="muted">No QR code on this ${PRODUCTS[pid].name.toLowerCase().replace(/s$/, "")}.</div>`;
    action = `<button class="btn" data-act="qrEdit">${icon("plus")}Add QR code</button>`;
  } else {
    main = `<div class="row-label">QR code</div><div class="mono">${esc(q.url)}</div>
      ${q.status === "override" ? `<div class="field-warn">${icon("warning")}Saved without verification. Scan a printed sample before mailing.</div>` : `<div class="field-ok">${icon("check")}Saved · shown on the proof</div>`}`;
    action = `<button class="btn" data-act="qrEdit">Edit</button>`;
  }
  return `<div class="row ${err ? "row-error" : ""}" id="row-qr">
    <div class="row-ico">${q.status !== "none" && !q.editing && q.url && q.status !== "invalid" ? qrThumb(q.url) : icon("qr")}</div>
    <div class="row-main">${main}${err ? `<div class="field-err strong">${issue.msg}</div>` : ""}</div>
    ${action}
  </div>`;
}

function proofPanel(pid) {
  const P = PRODUCTS[pid];
  const d = state.design[pid];
  return `<div class="card proof-card">
    <div class="card-title-row"><span class="card-title">Proof</span>
      <div class="seg small">${P.sides.map((s, i) => `<button class="${d.side === i ? "on" : ""}" data-act="side" data-side="${i}">${s}</button>`).join("")}</div>
    </div>
    <button class="proof-frame proof-${pid}" data-act="openDrawer" data-drawer="proof" title="View larger">${proofSVG(pid, d.side, proofCtx(pid))}</button>
    <div class="proof-foot"><span class="muted small">${tplOf(d.template).name} · ${P.size}</span><button class="link" data-act="openDrawer" data-drawer="proof">${icon("zoom")}View larger</button></div>
  </div>`;
}

// ---------- step 3: delivery ----------

const METHODS = [
  { id: "mail", icon: "mail", name: "Mail", desc: "We mail one piece to each recipient on your lists." },
  { id: "ship", icon: "truck", name: "Ship", desc: "A bulk box of printed pieces delivered to you." },
  { id: "pickup", icon: "store", name: "Pickup", desc: "Collect a printed batch at a print center." },
  { id: "download", icon: "download", name: "Download", desc: "Get JPG or PDF files. Nothing is printed." },
];

function deliveryStep() {
  const pid = state.active;
  const d = state.delivery[pid];
  const P = PRODUCTS[pid];
  let fields = "";
  if (d.method === "mail") fields = mailFields(pid);
  else if (d.method === "ship") fields = shipFields(pid);
  else if (d.method === "pickup") fields = pickupFields(pid);
  else fields = downloadFields(pid);

  const main = `
    ${productTabs("delivery")}
    <div class="step-head"><h2>Delivery · ${P.name}</h2><span class="muted">How should these reach people?</span></div>
    <div class="methods" role="radiogroup" aria-label="Delivery method">
      ${METHODS.map((m) => `<button class="method ${d.method === m.id ? "on" : ""}" role="radio" aria-checked="${d.method === m.id}" data-act="method" data-m="${m.id}">
        <span class="m-radio"></span>${icon(m.icon, "m-ico")}<span class="m-name">${m.name}</span><span class="m-desc">${m.desc}</span></button>`).join("")}
    </div>
    ${fields}
    ${d.method !== "download" ? optionsSection(pid) : ""}`;

  const i = state.selected.indexOf(pid);
  const next = state.selected.slice(i + 1).find((p) => !deliveryDone(p)) || state.selected.find((p) => p !== pid && !deliveryDone(p));
  return (
    columns(main, priceCard(pid)) +
    footer({
      back: { label: i > 0 ? PRODUCTS[state.selected[i - 1]].name : "Design" },
      primary: next ? `Continue to ${PRODUCTS[next].name} ${icon("chevronRight")}` : `Continue to review ${icon("chevronRight")}`,
    })
  );
}

function mailFields(pid) {
  const d = state.delivery[pid];
  const P = PRODUCTS[pid];
  const err = d.attempted && !d.lists.length;
  const rows = d.lists.map((id) => state.lists.find((l) => l.id === id)).filter(Boolean);
  const total = recipientCount(pid);
  return `
    <div class="section-label">Recipients</div>
    <div class="card ${err ? "card-error" : ""}" id="recipients">
      ${rows.length
        ? `<table class="tbl compact">
            <tbody>
              ${rows.map((l) => `<tr><td>${icon("list", "muted-ico")}${esc(l.name)}${l.fresh ? ` <span class="pill">New</span>` : ""}</td><td class="muted">${l.source}</td><td class="num">${l.count}</td><td class="act"><button class="icon-btn" data-act="removeList" data-id="${l.id}" title="Remove ${esc(l.name)}" aria-label="Remove ${esc(l.name)}">${icon("x")}</button></td></tr>`).join("")}
              ${d.sample ? `<tr class="sub"><td>${icon("mail", "muted-ico")}Sample copy to you</td><td class="muted">${esc(d.sampleAddr.name || "Agent")}</td><td class="num">1</td><td></td></tr>` : ""}
            </tbody>
            <tfoot><tr><td>Total printed</td><td class="muted">${total} mailed${d.sample ? " + 1 sample" : ""}</td><td class="num">${total + (d.sample ? 1 : 0)}</td><td></td></tr></tfoot>
          </table>`
        : `<div class="empty-state">${icon("users")}<div><b>No recipients yet.</b><div class="muted small">Pick a saved list or create one around the listing.</div></div></div>`}
      <div class="card-actions">
        <button class="btn" data-act="openDrawer" data-drawer="lists">${icon("list")}Choose saved lists</button>
        <div class="menu-wrap">
          <button class="btn" data-act="toggleCreate" aria-expanded="${state.createMenu}">${icon("plus")}Create list ${icon("chevronDown")}</button>
          ${state.createMenu ? createMenu() : ""}
        </div>
      </div>
      ${err ? `<div class="field-err pad">${icon("warning")}Choose at least one mailing list. Mail sends one piece to each recipient.</div>` : ""}
    </div>

    <div class="section-label">Mailing class</div>
    <div class="radio-cards two">
      ${Object.entries(MAIL_CLASSES).map(([id, c]) => `<button class="rcard ${d.mailClass === id ? "on" : ""}" role="radio" aria-checked="${d.mailClass === id}" data-act="mailClass" data-c="${id}">
        <span class="m-radio"></span><span class="rc-name">${c.name}</span><span class="rc-note">${c.note}</span><span class="rc-price">${money(P.mail[id])} per piece</span></button>`).join("")}
    </div>
    <p class="muted small">Delivery times are estimates from the postal service.</p>`;
}

function createMenu() {
  return `<div class="menu" role="menu">
    ${LIST_SOURCES.map((s) => `<button class="menu-item" role="menuitem" data-act="createFrom" data-src="${s.id}">
      ${icon({ radius: "pin", upload: "upload", street: "route", demo: "filter", crm: "crm" }[s.id])}
      <span><b>${s.name}</b>${s.rec ? ` <span class="pill">Suggested for listings</span>` : ""}<span class="muted small block">${s.desc}</span></span></button>`).join("")}
  </div>`;
}

function qtyPicker(pid) {
  const d = state.delivery[pid];
  const err = qtyError(d);
  return `<div class="field">
    <div class="lbl">Quantity</div>
    <div class="seg">${QTY_OPTIONS.map((q) => `<button class="${d.qty === q ? "on" : ""}" data-act="qty" data-q="${q}">${q}</button>`).join("")}<button class="${d.qty === "custom" ? "on" : ""}" data-act="qty" data-q="custom">Other</button></div>
    ${d.qty === "custom" ? `<input id="f-custom-qty" class="input narrow ${err ? "invalid" : ""}" inputmode="numeric" data-bind="delivery.${pid}.customQty" value="${esc(d.customQty)}" placeholder="e.g. 175">` : ""}
    ${err ? `<div class="field-err">${icon("warning")}${err}</div>` : `<div class="muted small">${money(tierPrice(pid, effectiveQty(d)))} each at this quantity. Larger runs cost less per piece.</div>`}
  </div>`;
}

function shipFields(pid) {
  const d = state.delivery[pid];
  return `
    <div class="section-label">Quantity &amp; shipping</div>
    <div class="card form">
      ${qtyPicker(pid)}
      <div class="field">
        <label class="lbl" for="f-shipto">Ship to</label>
        <select id="f-shipto" class="input" data-bind="delivery.${pid}.shipTo">${Object.entries(ADDRESSES).map(([k, a]) => `<option value="${k}" ${d.shipTo === k ? "selected" : ""}>${a.label}</option>`).join("")}</select>
        <div class="addr muted small">${ADDRESSES[d.shipTo].lines.join("<br>")}</div>
      </div>
      <div class="field">
        <div class="lbl">Shipping speed</div>
        <div class="radio-inline">${Object.entries(SHIPPING).map(([k, s]) => `<button class="rpill ${d.speed === k ? "on" : ""}" role="radio" aria-checked="${d.speed === k}" data-act="speed" data-s="${k}"><span class="m-radio"></span>${s.name} <span class="muted">${s.note} · ${money(s.price)}</span></button>`).join("")}</div>
      </div>
    </div>`;
}

function pickupFields(pid) {
  const d = state.delivery[pid];
  const loc = PICKUP_LOCATIONS[d.pickup];
  return `
    <div class="section-label">Quantity &amp; pickup</div>
    <div class="card form">
      ${qtyPicker(pid)}
      <div class="field">
        <label class="lbl" for="f-pickup">Pickup location</label>
        <select id="f-pickup" class="input" data-bind="delivery.${pid}.pickup">${Object.entries(PICKUP_LOCATIONS).map(([k, l]) => `<option value="${k}" ${d.pickup === k ? "selected" : ""}>${l.name} · ${l.addr}</option>`).join("")}</select>
        <div class="muted small">${icon("clock", "inline")}${loc.ready}. Bring your order number.</div>
      </div>
    </div>`;
}

function downloadFields(pid) {
  const d = state.delivery[pid];
  return `
    <div class="section-label">File format</div>
    <div class="radio-cards two">
      ${[["pdf", "PDF", "Print-ready, with bleed. Best for a local printer."], ["jpg", "JPG", "One image per side. Best for email and web."]].map(([id, n, note]) => `<button class="rcard ${d.format === id ? "on" : ""}" role="radio" aria-checked="${d.format === id}" data-act="format" data-f="${id}"><span class="m-radio"></span><span class="rc-name">${n}</span><span class="rc-note">${note}</span></button>`).join("")}
    </div>
    <p class="muted small">Files are ready to download right after the order is placed.</p>`;
}

function optionsSection(pid) {
  const d = state.delivery[pid];
  const P = PRODUCTS[pid];
  const paper = P.papers.find((p) => p.id === d.paper);
  const missing = d.method === "mail" && d.sample ? sampleMissing(d) : [];
  const summary = [paper.name, d.method === "mail" ? (d.sample ? `Sample copy to ${d.sampleAddr.name || "you"}` : "No sample copy") : null, d.pdf ? "PDF included" : "No PDF"].filter(Boolean).join(" · ");
  const a = d.sampleAddr;
  const showErr = d.attempted;
  const fieldErr = (cond, msg) => (showErr && cond ? `<div class="field-err">${msg}</div>` : "");
  return `
    <div class="section-label">Options <span class="muted normal">Optional · defaults are fine for most orders</span></div>
    <div class="card options ${missing.length ? "has-warn" : ""}">
      <button class="opt-head" data-act="toggleOptions" aria-expanded="${d.optionsOpen}">
        <span>${icon(d.optionsOpen ? "chevronDown" : "chevronRight")}</span>
        <span class="opt-summary">${esc(summary)}</span>
        <span class="link">${d.optionsOpen ? "Hide" : "Change"}</span>
      </button>
      ${missing.length && !d.optionsOpen ? `<div class="opt-warn">${icon("warning")}Sample copy address is missing a ${missing.join(", ")}. <button class="link" data-act="fixSample">Add it</button></div>` : ""}
      ${d.optionsOpen
        ? `<div class="opt-body">
        <div class="field">
          <div class="lbl">Paper</div>
          <div class="paper-list">${P.papers.map((p) => p.unavailable
            ? `<div class="paper disabled" aria-disabled="true"><span class="m-radio"></span><span><b>${p.name}</b><span class="muted small block">Unavailable · ${p.unavailable}</span></span></div>`
            : `<button class="paper ${d.paper === p.id ? "on" : ""}" role="radio" aria-checked="${d.paper === p.id}" data-act="paper" data-p="${p.id}"><span class="m-radio"></span><span><b>${p.name}</b><span class="muted small block">${p.note}</span></span><span class="paper-price">${p.add ? `+${money(p.add)} each` : "Included"}</span></button>`).join("")}</div>
        </div>
        ${d.method === "mail"
          ? `<div class="field">
          <label class="check"><input type="checkbox" data-bind="delivery.${pid}.sample" ${d.sample ? "checked" : ""}><span><b>Mail me a sample copy</b> <span class="muted">+${money(SAMPLE_PRICE)} · adds 1 to the printed quantity</span></span></label>
          ${d.sample
            ? `<div class="addr-grid ${missing.length && showErr ? "warn" : ""}">
              <div class="ag-head"><span class="lbl">Sample copy address</span><button class="link" data-act="officeAddress">Use office address</button></div>
              <div><label class="lbl sm" for="f-sample-name">Name</label><input id="f-sample-name" class="input" data-bind="delivery.${pid}.sampleAddr.name" value="${esc(a.name)}"></div>
              <div><label class="lbl sm" for="f-sample-company">Company <span class="muted">optional</span></label><input id="f-sample-company" class="input" data-bind="delivery.${pid}.sampleAddr.company" value="${esc(a.company)}"></div>
              <div class="span2"><label class="lbl sm" for="f-sample-street1">Street address</label><input id="f-sample-street1" class="input ${showErr && !a.street1.trim() ? "invalid" : ""}" data-bind="delivery.${pid}.sampleAddr.street1" value="${esc(a.street1)}">${fieldErr(!a.street1.trim(), "Enter a street address.")}</div>
              <div class="span2"><label class="lbl sm" for="f-sample-street2">Apt, suite <span class="muted">optional</span></label><input id="f-sample-street2" class="input" data-bind="delivery.${pid}.sampleAddr.street2" value="${esc(a.street2)}"></div>
              <div><label class="lbl sm" for="f-sample-city">City</label><input id="f-sample-city" class="input ${showErr && !a.city.trim() ? "invalid" : ""}" data-bind="delivery.${pid}.sampleAddr.city" value="${esc(a.city)}">${fieldErr(!a.city.trim(), "Enter a city.")}</div>
              <div class="state-zip">
                <div><label class="lbl sm" for="f-sample-state">State</label><input id="f-sample-state" class="input" maxlength="2" data-bind="delivery.${pid}.sampleAddr.state" value="${esc(a.state)}"></div>
                <div><label class="lbl sm" for="f-sample-zip">ZIP</label><input id="f-sample-zip" class="input ${!/^\d{5}$/.test(a.zip) && showErr ? "invalid" : ""}" inputmode="numeric" maxlength="5" data-bind="delivery.${pid}.sampleAddr.zip" value="${esc(a.zip)}" placeholder="5 digits"></div>
              </div>
              ${showErr && !/^\d{5}$/.test(a.zip) ? `<div class="span2 field-err">${icon("warning")}Add a 5-digit ZIP so the sample copy can be mailed, or use the office address.</div>` : ""}
              ${!missing.length ? `<div class="span2 field-ok">${icon("check")}Address complete</div>` : ""}
            </div>`
            : ""}
        </div>`
          : ""}
        <div class="field">
          <label class="check"><input type="checkbox" data-bind="delivery.${pid}.pdf" ${d.pdf ? "checked" : ""}><span><b>Add a print-ready PDF</b> <span class="muted">+${money(PDF_ADDON)} · emailed with your order</span></span></label>
        </div>
      </div>`
        : ""}
    </div>`;
}

function priceCard(pid) {
  const P = PRODUCTS[pid];
  const d = state.delivery[pid];
  const pr = priceOf(pid);
  const t = totals();
  const why = {
    mail: "Mail pricing covers printing and postage for each recipient, so adding recipients raises the total.",
    ship: "Price per piece drops at 100, 250, and 500. Shipping is a flat rate per box.",
    pickup: "Price per piece drops at 100, 250, and 500. No shipping charge.",
    download: "Digital files are included with your order.",
  }[d.method];
  return `<div class="card price-card">
    <div class="pc-head"><span class="pc-thumb proof-${pid}">${proofSVG(pid, 0, proofCtx(pid), "mini-svg")}</span>
      <div><div class="card-title">${P.name}</div><div class="muted small">${METHODS.find((m) => m.id === d.method).name}${pr.printed ? ` · ${pr.printed} printed` : ""}</div></div></div>
    <table class="price-lines">
      ${pr.lines.map((l) => `<tr><td>${esc(l.label)}${d.showDetails && l.note ? `<span class="muted small block">${esc(l.note)}</span>` : ""}</td><td class="num">${l.amount || d.method !== "download" ? money(l.amount) : "Included"}</td></tr>`).join("")}
      <tr class="total"><td>${P.name} total</td><td class="num">${money(pr.total)}</td></tr>
    </table>
    ${d.showDetails ? `<p class="muted small why">${why}</p>` : ""}
    <button class="link small" data-act="toggleDetails">${d.showDetails ? "Hide price details" : "Why this price?"}</button>
  </div>
  <div class="card mini-total"><span class="muted">Order so far · ${plural(state.selected.length, "product")}</span><b>${money(t.subtotal)}</b></div>`;
}

// ---------- focused view: create a mailing list ----------

function radiusErrors() {
  const r = state.radius;
  const errs = [];
  const res = radiusResult(r);
  if (!r.center.trim()) errs.push({ key: "center", msg: "Enter a center address." });
  if (!/^\d{5}$/.test(r.zip)) errs.push({ key: "zip", msg: "Enter a 5-digit ZIP." });
  if (!(Number(r.qty) >= 1)) errs.push({ key: "qty", msg: "Enter how many homes to include." });
  else if (res.short) errs.push({ key: "qty", msg: `Only ${res.available} ${r.type === "single" ? "single-family" : r.type === "multi" ? "multi-family" : ""} homes in this area. Lower the count or include both home types.` });
  return errs;
}

function focusView() {
  const f = state.focus;
  const src = LIST_SOURCES.find((s) => s.id === f.source);
  const P = PRODUCTS[f.pid];
  const body = f.source === "radius" ? radiusView() : otherSourceView();
  const head = `<div class="focus-head">
    <button class="link" data-act="cancelFocus">${icon("chevronLeft")}Back to ${P.name} delivery</button>
    <h2>Create mailing list · ${src.name}${f.source !== "radius" ? ` <span class="pill proposed">Proposed design</span>` : ""}</h2>
  </div>`;
  return body.replace("<!--HEAD-->", head);
}

function radiusView() {
  const r = state.radius;
  const res = radiusResult(r);
  const errs = r.attempted || res.short ? radiusErrors() : [];
  const errFor = (k) => errs.find((e) => e.key === k);
  const pid = state.focus.pid;
  const d = state.delivery[pid];
  const each = PRODUCTS[pid].mail[d.mailClass];
  const n = res.short ? 0 : res.picked.length;
  const shown = r.showAll ? res.picked : res.picked.slice(0, 6);
  const typeLabel = { single: "single-family", multi: "multi-family", both: "" }[r.type];
  const main = `
    <div class="card form">
      <div class="field-row">
        <div class="field grow"><label class="lbl" for="f-r-center">Center address</label><input id="f-r-center" class="input ${errFor("center") ? "invalid" : ""}" data-bind="radius.center" value="${esc(r.center)}">
          ${errFor("center") ? `<div class="field-err">${errFor("center").msg}</div>` : r.center.trim() !== listing().street ? `<button class="link small" data-act="useListingCenter">Use the listing address</button>` : `<div class="muted small">The listing address</div>`}</div>
        <div class="field zip"><label class="lbl" for="f-r-zip">ZIP</label><input id="f-r-zip" class="input ${errFor("zip") ? "invalid" : ""}" maxlength="5" inputmode="numeric" data-bind="radius.zip" value="${esc(r.zip)}">${errFor("zip") ? `<div class="field-err">${errFor("zip").msg}</div>` : ""}</div>
      </div>
      <div class="field"><label class="lbl" for="f-r-qty">Number of recipients</label>
        <input id="f-r-qty" class="input narrow ${errFor("qty") ? "invalid" : ""}" inputmode="numeric" data-bind="radius.qty" data-num value="${esc(r.qty)}">
        ${errFor("qty") ? `<div class="field-err">${icon("warning")}${errFor("qty").msg}</div>` : `<div class="muted small">We pick the nearest homes first.</div>`}
      </div>
      <div class="field"><div class="lbl">Home type</div>
        <div class="seg">${[["single", "Single-family"], ["multi", "Multi-family"], ["both", "Both"]].map(([k, l]) => `<button class="${r.type === k ? "on" : ""}" data-act="radiusType" data-t="${k}">${l}</button>`).join("")}</div>
      </div>
      <label class="check"><input type="checkbox" data-bind="radius.excludeTarget" ${r.excludeTarget ? "checked" : ""}><span>Exclude ${esc(listing().street)} itself</span></label>
      <div class="field"><label class="lbl" for="f-r-name">List name</label><input id="f-r-name" class="input" data-bind="radius.name" value="${esc(r.name)}" placeholder="${esc(defaultRadiusName())}"><div class="muted small">Saved to your mailing lists for later orders.</div></div>
    </div>
    <div class="impact">
      ${icon("info")}<div>${n ? `<b>Adds ${n} mailed ${PRODUCTS[pid].name.toLowerCase()}</b> to this order · +${money(round(n * each))} at ${MAIL_CLASSES[d.mailClass].name} (${money(each)} each, printing and postage).` : "Adjust the settings to see the effect on your order."}</div>
    </div>`;
  const side = `<div class="card map-card">
      <div class="card-title-row"><span class="card-title">Preview</span><span class="muted small">${n ? `${n} ${typeLabel} homes within ${res.radius.toFixed(2)} mi` : "No homes selected"}</span></div>
      <div class="map-wrap">${mapSVG(res.short ? { picked: [], radius: 0 } : res)}</div>
      <div class="legend"><span><i class="lg sel"></i>Included</span><span><i class="lg"></i>Not included</span><span><i class="lg sq"></i>Multi-family</span><span><i class="lg pin"></i>Listing</span></div>
    </div>
    ${n ? `<div class="card">
      <table class="tbl compact"><thead><tr><th>Nearest addresses</th><th>Type</th><th class="num">Distance</th></tr></thead>
      <tbody>${shown.map((h) => `<tr><td>${h.addr}</td><td class="muted">${h.type === "single" ? "Single-family" : "Multi-family"}</td><td class="num muted">${h.dist.toFixed(2)} mi</td></tr>`).join("")}</tbody></table>
      <button class="link small pad" data-act="toggleAllAddresses">${r.showAll ? "Show fewer" : `Show all ${n} addresses`}</button>
    </div>` : ""}`;
  return `<div class="panel-body" id="scroll-body"><!--HEAD--><div class="cols focus-cols"><div class="col-main">${main}</div><aside class="col-side">${side}</aside></div></div>` +
    footer({ back: { label: "Cancel", act: "cancelFocus" }, hint: "Returns to the order with this list selected", primary: `Add ${n || ""} recipients to order`.replace("  ", " "), primaryAct: "confirmRadius" });
}

function otherSourceCount() {
  const f = state.focus;
  if (f.source === "upload") return f.upload.file ? { count: 61, name: "Open house sign-ins" } : { count: 0 };
  if (f.source === "street") {
    const count = allHomes().filter((h) => f.streets.includes(h.street) && !h.target).length;
    return { count, name: f.streets.length === 1 ? `${f.streets[0]} residents` : `${f.streets.length} streets near Willow Ln` };
  }
  if (f.source === "demo") return { count: { "7+": 212, "3-7": 288, any: 540 }[f.demo.years] * ({ "400-800": 1, "800+": 0.4, any: 1.6 }[f.demo.value]) | 0, name: `${f.demo.zip} homeowners` };
  if (f.source === "crm") return f.crm.connected ? { count: { "Past clients": 84, "Sphere": 156, "Hot leads": 23 }[f.crm.tag], name: `CRM · ${f.crm.tag}` } : { count: 0 };
  return { count: 0 };
}

function otherSourceView() {
  const f = state.focus;
  const c = otherSourceCount();
  let main = "";
  if (f.source === "upload") {
    main = f.upload.file
      ? `<div class="card form"><div class="file-row">${icon("file")}<b>${f.upload.file}</b><span class="muted">64 rows</span></div>
          <div class="lbl">Columns we matched</div>
          <table class="tbl compact"><tbody>${[["Full Name", "Name"], ["Address", "Street address"], ["City", "City"], ["St", "State"], ["Zip", "ZIP"]].map(([a, b]) => `<tr><td class="mono">${a}</td><td>${icon("chevronRight", "muted-ico")}${b}</td><td class="field-ok">${icon("check")}</td></tr>`).join("")}</tbody></table>
          <div class="field-warn">${icon("warning")}3 rows have no ZIP and will be skipped. 61 recipients will be added.</div></div>`
      : `<div class="card dropzone">${icon("upload")}<b>Drop a CSV or Excel file</b><span class="muted small">Needs name, street, city, state, and ZIP columns</span><button class="btn" data-act="fakeUpload">Choose file</button></div>`;
  } else if (f.source === "street") {
    main = `<div class="card form"><div class="lbl">Streets near ${esc(listing().street)}</div>
      <div class="chips">${H_STREETS.slice(3, 8).concat(["Kinney Ave"]).map((s) => `<button class="chip ${f.streets.includes(s) ? "on" : ""}" data-act="toggleStreet" data-s="${s}">${f.streets.includes(s) ? icon("check") : ""}${s}</button>`).join("")}</div>
      <div class="muted small">Every deliverable address on the chosen streets, excluding the listing.</div></div>`;
  } else if (f.source === "demo") {
    main = `<div class="card form">
      <div class="field"><label class="lbl" for="f-d-zip">Area (ZIP)</label><input id="f-d-zip" class="input narrow" data-bind="focus.demo.zip" value="${esc(f.demo.zip)}"></div>
      <div class="field"><label class="lbl" for="f-d-val">Home value</label><select id="f-d-val" class="input" data-bind="focus.demo.value">${[["any", "Any"], ["400-800", "$400K – $800K"], ["800+", "Over $800K"]].map(([k, l]) => `<option value="${k}" ${f.demo.value === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="field"><label class="lbl" for="f-d-yrs">Years in home</label><select id="f-d-yrs" class="input" data-bind="focus.demo.years">${[["any", "Any"], ["3-7", "3–7 years"], ["7+", "7+ years (likely to move)"]].map(([k, l]) => `<option value="${k}" ${f.demo.years === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
    </div>`;
  } else {
    main = f.crm.connected
      ? `<div class="card form"><div class="field-ok">${icon("check")}Connected to Cedar CRM (simulated)</div>
          <div class="field"><label class="lbl" for="f-crm-tag">Import contacts tagged</label><select id="f-crm-tag" class="input" data-bind="focus.crm.tag">${["Past clients", "Sphere", "Hot leads"].map((t) => `<option ${f.crm.tag === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div class="muted small">Only contacts with a complete mailing address are imported.</div></div>`
      : `<div class="card dropzone">${icon("crm")}<b>Connect your CRM</b><span class="muted small">Import contacts by tag. Nothing is sent back to the CRM.</span><button class="btn" data-act="crmConnect">Connect Cedar CRM</button></div>`;
  }
  const side = `<div class="card summary"><div class="card-title">Result</div>
    ${c.count ? `<div class="big-num">${c.count}</div><div class="muted small">recipients in “${esc(c.name)}”</div>` : `<p class="muted small">Recipients appear here once the list is ready.</p>`}
    <p class="muted small">This source is an illustrative proposal. The Radius list is the developed example.</p></div>`;
  return `<div class="panel-body" id="scroll-body"><!--HEAD--><div class="cols focus-cols"><div class="col-main">${main}</div><aside class="col-side">${side}</aside></div></div>` +
    footer({ back: { label: "Cancel", act: "cancelFocus" }, primary: c.count ? `Add ${c.count} recipients to order` : "Add recipients to order", primaryAct: "confirmOther" });
}

// ---------- step 4: review ----------

function reviewStep() {
  const r = state.review;
  const si = REVIEW_STAGES.findIndex((x) => x.id === r.stage);
  const iss = r.attempted ? paymentIssues() : {};
  const t = totals();
  const section = (s, i, content, summary) => {
    const st = i < si ? "done" : i === si ? "open" : "todo";
    return `<section class="rv ${st}">
      <div class="rv-head">
        <span class="rv-num">${st === "done" ? icon("check") : i + 1}</span>
        <span class="rv-title">${s.label}</span>
        ${st === "done" ? `<span class="rv-sum muted">${summary}</span><button class="link" data-act="stage" data-s="${s.id}">Edit</button>` : ""}
      </div>
      ${st === "open" ? `<div class="rv-body">${content}</div>` : ""}
    </section>`;
  };
  const credSum = t.credits.length ? `${t.credits.map((c) => c.label.replace(/^Promo .*/, "Promo")).join(", ")} · −${money(t.credits.reduce((s, c) => s + c.amount, 0))}` : "None applied";
  const main = `
    <div class="step-head"><h2>Review order</h2><span class="muted">Confirm products, apply credits, then choose how to pay.</span></div>
    ${section(REVIEW_STAGES[0], 0, reviewProducts(), `${plural(state.selected.length, "product")} · ${money(t.subtotal)}`)}
    ${section(REVIEW_STAGES[1], 1, reviewCredits(iss), credSum)}
    ${section(REVIEW_STAGES[2], 2, reviewPayment(iss), "")}`;
  const primary = r.stage === "products" ? `Continue to credits ${icon("chevronRight")}` : r.stage === "credits" ? `Continue to payment ${icon("chevronRight")}` : r.method === "corp" ? "Submit for Approval" : t.remaining ? `Place order · ${money(t.remaining)}` : "Place order";
  const hint = r.stage === "payment" ? (r.method === "corp" ? `Nothing is charged until ${CORP.approver} approves.` : "Simulated payment. No card is charged.") : "";
  return columns(main, totalsCard()) + footer({ back: { label: si > 0 ? REVIEW_STAGES[si - 1].label : "Delivery" }, hint, primary });
}

function reviewProducts() {
  return `<div class="rv-products">${state.selected
    .map((p) => {
      const d = state.design[p];
      const pr = priceOf(p);
      const del = state.delivery[p];
      const where = del.method === "mail" ? `Mail · ${MAIL_CLASSES[del.mailClass].name} · ${recipientCount(p)} recipients${del.sample ? " + 1 sample" : ""}` : del.method === "ship" ? `Ship ${effectiveQty(del)} · ${SHIPPING[del.speed].name} to ${ADDRESSES[del.shipTo].label}` : del.method === "pickup" ? `Pickup ${effectiveQty(del)} · ${PICKUP_LOCATIONS[del.pickup].name}` : `Download · ${del.format.toUpperCase()}`;
      const paper = PRODUCTS[p].papers.find((x) => x.id === del.paper);
      return `<div class="rvp">
        <span class="rvp-thumb proof-${p}">${proofSVG(p, 0, proofCtx(p), "mini-svg")}</span>
        <div class="rvp-main">
          <div class="rvp-name">${PRODUCTS[p].name} <span class="muted">· ${tplOf(d.template).name}</span></div>
          <div class="small">${where}</div>
          <div class="muted small">${del.method !== "download" ? `${paper.name}${del.pdf ? " · PDF add-on" : ""} · ` : ""}${d.approved ? `<span class="ok-text">${icon("check", "inline")}Proof approved</span>` : `<span class="err-text">Proof not approved</span>`}</div>
          <div class="rvp-links"><button class="link small" data-act="editProduct" data-id="${p}" data-to="design">Edit design</button><button class="link small" data-act="editProduct" data-id="${p}" data-to="delivery">Edit delivery</button></div>
        </div>
        <div class="rvp-price">${money(pr.total)}<span class="muted small block">${pr.printed ? `${pr.printed} printed` : "Digital"}</span></div>
      </div>`;
    })
    .join("")}</div>`;
}

function reviewCredits(iss) {
  const r = state.review;
  const t = totals();
  const storeApplied = t.credits.find((c) => c.label === "Store credit")?.amount || 0;
  const adApplied = t.credits.find((c) => c.label === "Ad budget")?.amount || 0;
  const promo = r.promoApplied
    ? `<div class="credit-row"><span class="cr-name">${icon("tag")}Promo <b>${CREDITS.promo.code}</b></span><span class="ok-text">−${money(CREDITS.promo.amount)}</span><button class="link small" data-act="removePromo">Remove</button></div>`
    : r.promoOpen
      ? `<div class="credit-row col"><label class="lbl" for="f-promo">Promo code</label>
          <div class="input-row"><input id="f-promo" class="input narrow upper ${r.promoError ? "invalid" : ""}" data-bind="review.promoInput" value="${esc(r.promoInput)}" placeholder="e.g. WILLOW10"><button class="btn" data-act="applyPromo">Apply</button></div>
          ${r.promoError ? `<div class="field-err">${icon("warning")}${r.promoError}</div>` : `<div class="muted small">Try WILLOW10 in this prototype.</div>`}</div>`
      : `<div class="credit-row"><button class="link" data-act="promoOpen">${icon("plus")}Add promo code</button></div>`;
  const balRow = (key, label, bal, on, amt, applied, err) => `
    <div class="credit-row">
      <label class="check"><input type="checkbox" data-bind="review.${key === "store" ? "useStore" : "useAd"}" ${on ? "checked" : ""}><span>${label} <span class="muted">· ${money(bal)} available</span></span></label>
      ${on ? `<span class="amt"><span class="muted">Apply $</span><input class="input tiny ${err ? "invalid" : ""}" id="f-${key}-amt" inputmode="decimal" data-bind="review.${key}Amt" value="${esc(amt)}"></span>` : ""}
    </div>
    ${on ? (err ? `<div class="field-err indent">${err}</div>` : `<div class="muted small indent">${money(applied)} applied · ${money(round(bal - applied))} left after this order</div>`) : ""}`;
  return `<div class="credits">
    ${promo}
    ${balRow("store", "Store credit", CREDITS.store.balance, r.useStore, r.storeAmt, storeApplied, iss.store)}
    ${balRow("ad", "Ad budget", CREDITS.ad.balance, r.useAd, r.adAmt, adApplied, iss.ad)}
  </div>`;
}

function reviewPayment(iss) {
  const r = state.review;
  const t = totals();
  const opt = (id, title, sub, extra = "") => `<div class="pay ${r.method === id ? "on" : ""}">
    <button class="pay-head" role="radio" aria-checked="${r.method === id}" data-act="payMethod" data-m="${id}"><span class="m-radio"></span><span class="pay-title">${title}</span><span class="muted small">${sub}</span></button>
    ${r.method === id && extra ? `<div class="pay-body">${extra}</div>` : ""}
  </div>`;
  const corp = `
    <div class="field"><label class="lbl" for="f-cc">Cost center <span class="req">Required</span></label>
      <select id="f-cc" class="input ${iss.costCenter ? "invalid" : ""}" data-bind="review.costCenter"><option value="">Choose a cost center</option>${CORP.costCenters.map((c) => `<option ${r.costCenter === c ? "selected" : ""}>${c}</option>`).join("")}</select>
      ${iss.costCenter ? `<div class="field-err">${icon("warning")}${iss.costCenter}</div>` : ""}</div>
    <div class="field"><label class="lbl" for="f-comments">Note for approver <span class="muted">optional</span></label><textarea id="f-comments" class="input" rows="2" data-bind="review.comments" placeholder="e.g. Launch mailing for the Willow Lane listing">${esc(r.comments)}</textarea></div>
    <div class="muted small">${icon("users", "inline")}Routed to ${CORP.approver} (${CORP.approverRole}). You'll get an email when it's approved.</div>`;
  const cardExtra = (id) => r.split
    ? `<div class="split">
        ${CARDS.map((c) => `<div class="split-row"><span>${c.label}</span><span class="amt"><span class="muted">$</span><input class="input tiny ${iss.split ? "invalid" : ""}" id="f-split-${c.id}" inputmode="decimal" data-bind="review.split${c.id === "visa" ? "Visa" : "Mc"}" value="${esc(c.id === "visa" ? r.splitVisa : r.splitMc)}"></span></div>`).join("")}
        <div class="split-row total"><span>Allocated</span><span>${money(round((Number(r.splitVisa) || 0) + (Number(r.splitMc) || 0)))} of ${money(t.remaining)}</span></div>
        ${iss.split ? `<div class="field-err">${icon("warning")}${iss.split}</div>` : ""}
        <button class="link small" data-act="toggleSplit">Pay with one card</button></div>`
    : `<button class="link small" data-act="toggleSplit">Split between two cards</button>`;
  const newCard = `<div class="addr-grid">
      <div class="span2 muted small">Simulated form. Card details are not stored or sent.</div>
      <div class="span2"><label class="lbl sm" for="f-nc-name">Name on card</label><input id="f-nc-name" class="input" data-bind="review.newCard.name" value="${esc(r.newCard.name)}"></div>
      <div class="span2"><label class="lbl sm" for="f-nc-num">Card number</label><input id="f-nc-num" class="input ${iss.newCard ? "invalid" : ""}" inputmode="numeric" data-bind="review.newCard.number" value="${esc(r.newCard.number)}" autocomplete="off">${iss.newCard ? `<div class="field-err">${iss.newCard}</div>` : ""}</div>
      <div><label class="lbl sm" for="f-nc-exp">Expiry</label><input id="f-nc-exp" class="input" placeholder="MM/YY" data-bind="review.newCard.exp" value="${esc(r.newCard.exp)}"></div>
      <div><label class="lbl sm" for="f-nc-zip">Billing ZIP</label><input id="f-nc-zip" class="input" data-bind="review.newCard.zip" value="${esc(r.newCard.zip)}"></div>
    </div>`;
  return `<div class="pay-list" role="radiogroup" aria-label="Payment method">
      ${opt("corp", `${icon("building", "inline")}Corporate billing`, `${CORP.name} ${CORP.acct} · needs approval`, corp)}
      ${opt("visa", `${icon("card", "inline")}${CARDS[0].label}`, `Expires ${CARDS[0].exp}`, cardExtra("visa"))}
      ${opt("mc", `${icon("card", "inline")}${CARDS[1].label}`, `Expires ${CARDS[1].exp}`, cardExtra("mc"))}
      ${opt("new", `${icon("plus", "inline")}Add a card`, "Use a different card", newCard)}
    </div>
    <label class="check ack ${iss.ack ? "invalid" : ""}"><input type="checkbox" data-bind="review.ack" ${r.ack ? "checked" : ""}><span>I've reviewed every proof and accept responsibility for its content, spelling, and mailing addresses.</span></label>
    ${iss.ack ? `<div class="field-err">${icon("warning")}${iss.ack}</div>` : ""}`;
}

function totalsCard() {
  const r = state.review;
  const t = totals();
  const payLabel = r.method === "corp" ? `${CORP.name} after approval` : r.method === "new" ? "New card (simulated)" : r.split ? "Split between two cards" : CARDS.find((c) => c.id === r.method).label;
  return `<div class="card totals">
    <div class="card-title">Order total</div>
    <table class="price-lines">
      <tr><td>Subtotal <span class="muted">· ${plural(state.selected.length, "product")}</span></td><td class="num">${money(t.subtotal)}</td></tr>
      ${r.showLines ? state.selected.map((p) => `<tr class="sub"><td>${PRODUCTS[p].name}</td><td class="num">${money(priceOf(p).total)}</td></tr>`).join("") : ""}
      <tr><td>Tax <span class="muted">· ${(TAX_RATE * 100).toFixed(2)}%</span></td><td class="num">${money(t.tax)}</td></tr>
      ${t.credits.map((c) => `<tr class="credit"><td>${c.label}</td><td class="num">−${money(c.amount)}</td></tr>`).join("")}
      <tr class="total"><td>Balance remaining</td><td class="num">${money(t.remaining)}</td></tr>
    </table>
    <button class="link small" data-act="toggleLines">${r.showLines ? "Hide line items" : "Show line items"}</button>
    ${r.stage === "payment" ? `<div class="pay-to muted small">${icon(r.method === "corp" ? "building" : "card", "inline")}${t.remaining ? `${money(t.remaining)} · ${esc(payLabel)}` : "Fully covered by credits"}</div>` : ""}
  </div>`;
}

// ---------- done ----------

function doneView() {
  const o = state.order;
  const t = o.totals;
  return `<div class="panel-body" id="scroll-body"><div class="done-view">
    <div class="done-badge">${icon("check")}</div>
    <h2>${o.approval ? "Submitted for approval" : "Order placed"}</h2>
    <p class="muted">Order <b>${o.id}</b> · ${esc(listing().street)} · ${plural(state.selected.length, "product")}</p>
    <ol class="timeline">
      <li class="ok">${icon("check")}<span><b>Submitted</b><span class="muted small block">Oct 31, 2026</span></span></li>
      ${o.approval ? `<li class="cur"><i></i><span><b>Waiting for ${CORP.approver}</b><span class="muted small block">${CORP.approverRole} · usually within 1 business day</span></span></li>` : ""}
      <li><i></i><span><b>Printing</b><span class="muted small block">Starts after ${o.approval ? "approval" : "payment"}</span></span></li>
      <li><i></i><span><b>Delivered</b><span class="muted small block">${state.selected.map((p) => `${PRODUCTS[p].name}: ${METHODS.find((m) => m.id === state.delivery[p].method).name}`).join(" · ")}</span></span></li>
    </ol>
    <div class="card done-sum"><table class="price-lines">
      <tr><td>Subtotal + tax</td><td class="num">${money(round(t.subtotal + t.tax))}</td></tr>
      <tr class="credit"><td>Credits</td><td class="num">−${money(round(t.credits.reduce((s, c) => s + c.amount, 0)))}</td></tr>
      <tr class="total"><td>${o.approval ? "Billed after approval" : "Charged (simulated)"}</td><td class="num">${money(t.remaining)}</td></tr>
    </table></div>
    <div class="btn-row center"><button class="btn primary" data-act="newOrder">Start another order</button><button class="btn" data-act="stub" data-msg="Order history isn't part of this prototype.">View order history</button></div>
  </div></div>`;
}

// ---------- drawers ----------

function drawerView() {
  if (!state.drawer) return "";
  const x = state.drawerData;
  const pid = state.active;
  let title = "", body = "", foot = "", wide = false;
  if (state.drawer === "listing") {
    title = "Choose a listing or event";
    const q = (x.q || "").toLowerCase();
    body = `<label class="top-search in-drawer">${icon("search")}<input id="f-listing-q" data-bind="drawerData.q" value="${esc(x.q)}" placeholder="Search by address"></label>
      <div class="pick-list">${LISTINGS.filter((l) => !q || (l.street + l.city).toLowerCase().includes(q)).map((l) => `<button class="pick ${x.pick === l.id ? "on" : ""}" role="radio" aria-checked="${x.pick === l.id}" data-act="pickListing" data-id="${l.id}">
        <span class="m-radio"></span><span class="pick-main"><b>${esc(l.street)}</b><span class="muted small block">${esc(l.city)} · ${esc(l.price)}</span></span><span class="tag">${esc(l.event)}</span><span class="muted small">${esc(l.date)}</span></button>`).join("") || `<p class="muted small">No listings match.</p>`}</div>
      <p class="muted small">Every product in this order uses the same listing.</p>`;
    foot = `<button class="btn" data-act="closeDrawer">Cancel</button><button class="btn primary" data-act="useListing">Use this listing</button>`;
  } else if (state.drawer === "templates") {
    title = `${PRODUCTS[pid].name} templates`;
    body = `<div class="tpl-grid ${pid === "flyers" ? "" : "landscape"}">${TEMPLATES.map((t) => `<button class="tpl ${x.template === t.id ? "on" : ""}" role="radio" aria-checked="${x.template === t.id}" data-act="pickTemplate" data-id="${t.id}">
        <span class="tpl-art proof-${pid}">${proofSVG(pid, 0, proofCtx(pid, { template: t.id }), "mini-svg")}</span>
        <span class="tpl-name">${x.template === t.id ? icon("check", "inline") : ""}${t.name}</span><span class="muted small">${t.note}</span></button>`).join("")}</div>
      <label class="check"><input type="checkbox" data-bind="drawerData.makeDefault" ${x.makeDefault ? "checked" : ""}><span>Save as my default ${PRODUCTS[pid].name.toLowerCase()} template</span></label>`;
    foot = `<button class="btn" data-act="closeDrawer">Cancel</button><button class="btn primary" data-act="applyTemplate">Use template</button>`;
    wide = true;
  } else if (state.drawer === "editor") {
    title = `Edit text & photos · ${PRODUCTS[pid].name}`;
    body = `<div class="proposed-note">${icon("info")}<span><b>Proposed design.</b> A focused editor for the fields agents change most. Layout and branding stay locked to the template.</span></div>
      <div class="field"><label class="lbl" for="f-ed-headline">Headline</label><select id="f-ed-headline" class="input" data-bind="drawerData.headline">${["Just Listed", "New Listing", "Open House", "Price Improved", "Coming Soon"].map((h) => `<option ${x.headline === h ? "selected" : ""}>${h}</option>`).join("")}</select></div>
      <div class="field"><label class="lbl" for="f-ed-price">Price shown</label><input id="f-ed-price" class="input narrow" data-bind="drawerData.price" value="${esc(x.price)}"></div>
      <div class="field"><label class="lbl" for="f-ed-blurb">Description <span class="muted">${x.blurb.length}/220</span></label><textarea id="f-ed-blurb" class="input" rows="4" maxlength="220" data-bind="drawerData.blurb">${esc(x.blurb)}</textarea></div>
      <div class="field"><div class="lbl">Cover photo</div><div class="photo-pick">${[["exterior", "Front"], ["backyard", "Backyard"], ["living", "Living"], ["kitchen", "Kitchen"]].map(([s, l]) => `<button class="ph ${x.hero === s ? "on" : ""}" data-act="pickHero" data-scene="${s}" aria-pressed="${x.hero === s}">${photoThumb(s)}<span>${l}</span></button>`).join("")}</div>
        <div class="muted small">Photos come from the listing. Upload is handled in Listings.</div></div>`;
    foot = `<button class="btn" data-act="closeDrawer">Cancel</button><button class="btn primary" data-act="saveEditor">Save to proof</button>`;
  } else if (state.drawer === "lists") {
    title = "Choose saved mailing lists";
    const sel = state.lists.filter((l) => x.picked.includes(l.id));
    body = `<table class="tbl lists">
      <thead><tr><th></th><th>List</th><th class="num">Recipients</th><th>Created</th><th></th></tr></thead>
      <tbody>${state.lists.map((l) => `<tr class="${x.picked.includes(l.id) ? "on" : ""}">
        <td><input type="checkbox" aria-label="Select ${esc(l.name)}" ${x.picked.includes(l.id) ? "checked" : ""} data-act="pickList" data-id="${l.id}"></td>
        <td><button class="plain" data-act="pickList" data-id="${l.id}">${esc(l.name)}</button><span class="muted small block">${l.source}</span></td>
        <td class="num">${l.count}</td><td class="muted">${l.created}</td>
        <td class="act"><button class="link small" data-act="stub" data-msg="List editing opens in Audiences → Mailing lists (not in this prototype).">Edit</button></td></tr>`).join("")}</tbody></table>
      <div class="drawer-create"><span class="muted small">Need a new audience?</span><button class="link" data-act="toggleCreate">${icon("plus")}Create list</button></div>`;
    foot = `<span class="foot-sum">${sel.length ? `${plural(sel.length, "list")} · <b>${sel.reduce((s, l) => s + l.count, 0)} recipients</b>` : "No lists selected"}</span><button class="btn" data-act="closeDrawer">Cancel</button><button class="btn primary" data-act="useLists">Use selected lists</button>`;
    wide = true;
  } else if (state.drawer === "proof") {
    const P = PRODUCTS[pid];
    return `<div class="overlay" data-act="closeDrawer"></div>
      <div class="lightbox" role="dialog" aria-label="${P.name} proof">
        <div class="lb-head"><b>${P.name} proof</b><div class="seg small">${P.sides.map((s, i) => `<button class="${x.side === i ? "on" : ""}" data-act="side" data-side="${i}">${s}</button>`).join("")}</div>
          <button class="icon-btn" data-act="closeDrawer" aria-label="Close">${icon("x")}</button></div>
        <div class="lb-body proof-${pid}">${proofSVG(pid, x.side, proofCtx(pid))}</div>
      </div>`;
  }
  return `<div class="overlay" data-act="closeDrawer"></div>
    <aside class="drawer ${wide ? "wide" : ""}" role="dialog" aria-label="${esc(title)}">
      <div class="drawer-head"><b>${esc(title)}</b><button class="icon-btn" data-act="closeDrawer" aria-label="Close">${icon("x")}</button></div>
      <div class="drawer-body" id="scroll-drawer">${body}</div>
      <div class="drawer-foot">${foot}</div>
    </aside>`;
}

// ---------- render + events ----------

const app = document.getElementById("app");

function render() {
  const a = document.activeElement;
  const fid = a && a.id;
  const sel = a && "selectionStart" in a ? [a.selectionStart, a.selectionEnd] : null;
  const scrolls = {};
  app.querySelectorAll("[id^=scroll-]").forEach((el) => (scrolls[el.id] = el.scrollTop));
  app.innerHTML = view();
  app.querySelectorAll("[id^=scroll-]").forEach((el) => {
    if (scrollTopNext && el.id === "scroll-body") el.scrollTop = 0;
    else if (scrolls[el.id] != null) el.scrollTop = scrolls[el.id];
  });
  scrollTopNext = false;
  const target = state.focusField || fid;
  state.focusField = null;
  if (target) {
    const el = document.getElementById(target);
    if (el) {
      el.focus({ preventScroll: target === fid });
      if (target === fid && sel && el.setSelectionRange && sel[0] != null) {
        try {
          el.setSelectionRange(sel[0], sel[1]);
        } catch {}
      }
      if (target !== fid) el.scrollIntoView({ block: "center" });
    }
  }
  // After a failed attempt, bring the first error into view.
  const err = app.querySelector(".row-error, .card-error, .field-err.strong");
  if (err && render.lastErr !== err.outerHTML.length) {
    render.lastErr = err.outerHTML.length;
    if (!target) err.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  if (!err) render.lastErr = null;
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) {
    if (state.createMenu && !e.target.closest(".menu")) {
      state.createMenu = false;
      render();
    }
    return;
  }
  if (t.disabled) return;
  if (t.tagName === "INPUT" && t.type === "checkbox") e.preventDefault();
  const fn = ACT[t.dataset.act];
  if (!fn) return;
  if (t.dataset.act !== "toggleCreate" && t.dataset.act !== "createFrom") state.createMenu = false;
  fn(t.dataset, e);
  render();
});

function onField(e) {
  const el = e.target;
  if (!el.dataset || !el.dataset.bind) return;
  let v = el.type === "checkbox" ? el.checked : el.value;
  if ("num" in el.dataset && v !== "") v = Number(v);
  setPath(el.dataset.bind, v);
  if (el.dataset.bind.startsWith("radius.")) state.radius.attempted = false;
  render();
}
document.addEventListener("input", (e) => {
  if (e.target.type !== "checkbox" && e.target.tagName !== "SELECT") onField(e);
});
document.addEventListener("change", (e) => {
  if (e.target.type === "checkbox" || e.target.tagName === "SELECT") onField(e);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && (state.drawer || state.createMenu)) {
    state.drawer = null;
    state.createMenu = false;
    render();
  }
  if (e.key === "Enter" && e.target.id === "f-promo") {
    ACT.applyPromo();
    render();
  }
});

render();
