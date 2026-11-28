const menuLinks = () =>
  '<div class="actionlist">' +
  [
    ["Listing events", "events", "home"],
    ["Main Xpresso site", "site", "external"],
    ["Approvals dashboard", "dashboard", "orders"],
    ["Profile & settings", "settings", "gear"],
    ["Help center", "help", "help"],
    ["Live chat", "chat", "chat"],
    ["Demo controls", "controls", "sliders"],
    ["Log out", "expired", "user"],
  ]
    .map(([s, a, i]) => b(s, a, "", "", i))
    .join("") +
  "</div>";
function shell() {
  const cartCount = ev() ? ordered().length : 0;
  document.querySelector("#header").innerHTML =
    '<div class="brand"><span class="pinwheel" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>ACME<small>Corporation</small></span></div>' +
    b("Categories " + ic("down"), "menu", "categories") +
    '<div class="header-right"><form id="global-search"><input aria-label="Search property events" placeholder="Search Xpresso"><button aria-label="Submit search">' +
    ic("search") +
    '</button></form><button data-act="cart" class="headicon" aria-label="Cart, ' +
    cartCount +
    ' items">' +
    ic("cart") +
    "<sup>" +
    cartCount +
    "</sup></button>" +
    b(
      '<span class="sr">Help</span>' + ic("help"),
      "help",
      "headicon helpicon",
    ) +
    b(
      '<span class="avatar">CN</span><span class="sr">Account menu</span>',
      "menu",
      "account",
    ) +
    b('<span class="sr">Menu</span>' + ic("menu"), "menu", "mobilemenu") +
    "</div>";
  document.querySelector("#rail").innerHTML =
    "<div>" +
    [
      ["home", "site", "Xpresso home"],
      ["orders", "dashboard", "Orders and approvals"],
      ["chart", "site", "Analytics"],
      ["team", "office", "Office and agent"],
      ["tools", "events", "Property marketing"],
    ]
      .map(
        ([i, a, n], j) =>
          (j === 4 ? "<hr>" : "") +
          '<button title="' +
          n +
          '" aria-label="' +
          n +
          '" data-act="' +
          a +
          '" class="' +
          (j === 4 ? "active" : "") +
          '">' +
          ic(i) +
          "</button>",
      )
      .join("") +
    "</div>" +
    ib("Demo controls", "controls", "sliders");
  document.querySelector("#sectionbar").innerHTML =
    "<span>Account Resources &amp; Programs</span>" +
    b("Demo controls", "controls", "demo", "", "sliders");
  document.querySelector("#footer").innerHTML =
    '<div>Acme Demonstration Site <span>·</span> <a href="tel:18669773627">(866) 977-3627</a></div>' +
    b("Do Not Sell or Share My Personal Information", "privacy", "link");
  document.querySelector("#floating").innerHTML = b(
    '<i class="online"></i> We’re Online ' + ic("chat"),
    "chat",
    "chatbtn",
  );
}
function render() {
  shell();
  const main = document.querySelector("#main");
  main.innerHTML =
    (db.banner
      ? '<div class="sys">' +
        ic("bell") +
        "<span><b>System update</b><em></em> Fall marketing templates are now available.</span>" +
        ib("Dismiss system message", "banner", "close") +
        "</div>"
      : "") +
    (notice
      ? '<div class="notice" role="status">' +
        ic("info") +
        "<span>" +
        esc(notice) +
        "</span>" +
        ib("Dismiss notification", "clearNotice", "close") +
        "</div>"
      : "") +
    (screens[view] || screens.events)();
  updateSave();
  document.title =
    ({
      events: "Listing events",
      product: products[product],
      event: ev()?.street,
      cart: "Review your order",
      complete: "Order confirmation",
    }[view] || "Property marketing") + " · Xpresso";
}
function controls() {
  modal(
    "Demo controls",
    select(
      "Checkout role",
      "demo.mode",
      ["Normal", "Approval required", "Approver"],
      db.mode,
    ) +
      check("Internal user", "demo.internal", db.internal, true) +
      check("Hide pricing from agents", "demo.hidden", db.hidden, true) +
      check("Social accounts connected", "demo.connected", db.connected, true) +
      '<hr><h3>Preview a state</h3><div class="actionlist">' +
      [
        ["Event list · loading", "loading"],
        ["Event list · empty", "empty"],
        ["Session expired", "expired"],
        ["Approvals dashboard", "dashboard"],
        ...(ev()
          ? [
              ["Product · save failed", "saveFail"],
              ["Product · template unavailable", "missing"],
              ["Editor · merge field error", "merge"],
              ["Postcards · invalid address", "invalidAddress"],
              ["Image Download · preparing files", "preparing"],
              ["Image Download · configuration error", "fileError"],
            ]
          : []),
      ]
        .map(([s, v]) => b(s, "scenario", "", v))
        .join("") +
      "</div>",
  );
  panel = "controls";
}
function demoScenario(v) {
  if (["expired", "dashboard"].includes(v)) {
    nav(v);
    return;
  }
  if (v === "loading") {
    nav("loading");
    setTimeout(() => {
      if (view === "loading") nav("events");
    }, 1500);
    return;
  }
  if (v === "empty") {
    filters.q = "No matching listing";
    nav("events");
    return;
  }
  const i = ["preparing", "fileError"].includes(v)
    ? 4
    : v === "invalidAddress"
      ? 0
      : view === "product"
        ? product
        : 0;
  if (!selected().includes(i)) campaign().selected.push(i);
  const p = campaign().items[i];
  if (v === "saveFail") p.failed = true;
  if (v === "missing") p.missing = true;
  if (v === "merge") p.mergeError = true;
  if (v === "invalidAddress") {
    p.addressValid = false;
    p.method = "Mail";
    p.useRadius = true;
  }
  if (v === "fileError") p.fileState = "Error";
  openProduct(i, "event");
  if (v === "preparing") actions.fileRetry();
  if (v === "merge") editor();
}
screens.loading = () =>
  '<h1>Listing events</h1><div role="status"><span class="sr">Loading listing events</span>' +
  Array.from({ length: 5 }, () => '<div class="skeleton listskel"></div>').join(
    "",
  ) +
  "</div>";
screens.settings = () =>
  '<div class="crumb">' +
  b("Listing events", "events", "link") +
  ic("right") +
  " Profile</div><h1>Profile &amp; settings</h1>" +
  section(
    "APM defaults",
    "<p>This storefront settings area is outside the mockup. It manages default templates by event and product, quantities, mailing class, coatings and lists, automated checkout, payments, headshots, contact details, subscriptions and connected accounts.</p>" +
      b("Back to events", "events", "secondary"),
  );
screens.help = () =>
  "<h1>Help center</h1>" +
  section(
    "Contact support",
    '<p>Monday to Friday, 8am to 6pm Central</p><p><a href="tel:18669773627">(866) 977-3627</a> · <a href="mailto:support@example.com">support@example.com</a></p>' +
      b("Live chat", "chat", "primary", "", "chat"),
  ) +
  section("Design editor", helpText());
screens.dashboard = () =>
  '<div class="crumb">Account resources ' +
  ic("right") +
  " Approvals</div><h1>Approvals dashboard</h1>" +
  section(
    "Submitted carts",
    db.events
      .flatMap((e) => {
        return Object.entries(e.carts)
          .filter(([, c]) => c.status === "Submitted for approval")
          .map(
            ([t]) =>
              '<div class="line"><div><b>' +
              esc(e.street) +
              "</b><small>" +
              types[t] +
              " · " +
              esc(e.agent) +
              "</small></div>" +
              b("Review cart", "approveCart", "secondary", e.id + "/" + t) +
              "</div>",
          );
      })
      .join("") || "<p>No carts are awaiting approval.</p>",
  );
screens.site = () =>
  "<h1>Xpresso</h1>" +
  section(
    "Account resources &amp; programs",
    '<div class="actionlist">' +
      b("Property marketing", "events", "secondary", "", "brief") +
      b("Approvals dashboard", "dashboard", "secondary", "", "orders") +
      b("Profile &amp; settings", "settings", "secondary", "", "gear") +
      "</div>",
  );
screens.expired = () =>
  '<div class="finish"><span class="chip">' +
  ic("clock") +
  "</span><h1>Your session has expired</h1><p>Your saved work will be here when you log back in.</p>" +
  b("Log back in", "events", "primary") +
  "</div>";
Object.assign(actions, {
  menu: () => modal("Xpresso navigation", menuLinks()),
  controls,
  scenario: demoScenario,
  approveCart: (v) => {
    const [id, t] = v.split("/").map(Number);
    db.active = id;
    ev().type = t;
    ev().status = campaign().status;
    db.mode = "Approver";
    attempted = false;
    save();
    nav("cart");
  },
  privacy: () =>
    modal(
      "Privacy choices",
      msg("This demonstration uses fictional listing and order data."),
      b("Save privacy preference", "privacySaved", "primary"),
    ),
  privacySaved: () => {
    db.privacy = true;
    persist();
    closeDialog();
    setNotice("Privacy preference saved.");
    render();
  },
  chat: () => {
    formModal(
      "Live chat",
      "<p>" +
        ic("chat") +
        " Xpresso support · Online</p>" +
        field("Your message", "message", "", "text", "required"),
      (v) =>
        modal(
          "Live chat",
          "<p><b>You</b> · " +
            esc(v.message) +
            "</p>" +
            msg(
              "Demo support: Thanks for reaching out. For order assistance, call (866) 977-3627 during support hours.",
            ),
        ),
      "Send message",
    );
  },
});
document.addEventListener("keydown", (e) => {
  if (
    e.target.matches("[role=button][data-act]") &&
    ["Enter", " "].includes(e.key)
  ) {
    e.preventDefault();
    e.target.click();
  }
});
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  e.preventDefault();
  let a = el.dataset.act;
  if (a === "dismiss" && panel.startsWith("editor")) {
    actions.editorClose();
    return;
  }
  const globalNav = [
    "events",
    "site",
    "dashboard",
    "help",
    "expired",
    "settings",
  ];
  if (view === "product" && globalNav.includes(a)) {
    leaveProduct(() => actions[a]());
    return;
  }
  actions[a]?.(el.dataset.v || "");
});
document.querySelector("dialog").addEventListener("cancel", (e) => {
  if (panel.startsWith("editor")) {
    e.preventDefault();
    actions.editorClose();
  } else closeDialog();
});
function toggleIn(arr, x, on) {
  return on ? [...new Set([...arr, x])] : arr.filter((y) => y !== x);
}
function restoreText(name, pos) {
  const el = [...document.querySelectorAll("input,textarea")].find(
    (x) => x.name === name,
  );
  if (el) {
    el.focus();
    try {
      el.setSelectionRange(pos, pos);
    } catch {}
  }
}
document.addEventListener("input", (e) => {
  const { name, value } = e.target;
  if (name === "searchEvents") {
    filters.q = value;
    filters.limit = 20;
    document.querySelector("#results").innerHTML = results();
  }
  if (name === "listSearch") {
    const pos = e.target.selectionStart;
    listUI.query = value;
    listUI.page = 0;
    lists();
    restoreText(name, pos);
  }
  if (name?.startsWith("draft.")) {
    draft[name.slice(6)] = value;
    const art = document.querySelector(".artbtn"),
      temp = document.createElement("div");
    temp.innerHTML = proof(draft, product, selectedSide);
    for (const cl of ["art-photo", "art-copy"]) {
      const target = art.querySelector("." + cl),
        next = temp.querySelector("." + cl);
      target.innerHTML = next.innerHTML;
      target.style.cssText = next.style.cssText;
    }
  }
  if (name === "p.display") {
    document.querySelector("#remaining").textContent =
      36 - value.length + " characters remaining";
    document.querySelector("#from-name").textContent = "From " + value;
  }
});
document.addEventListener("change", (e) => {
  const el = e.target,
    n = el.name;
  if (!n) return;
  const v =
    el.type === "checkbox"
      ? el.checked
      : el.type === "number"
        ? Number(el.value)
        : el.value;
  if (n === "filterType" || n === "sort" || n === "completed") {
    filters[{ filterType: "type", sort: "sort", completed: "completed" }[n]] =
      v;
    filters.limit = 20;
    render();
    return;
  }
  if (n.startsWith("demo.")) {
    db[n.slice(5)] = v;
    persist();
    render();
    return;
  }
  if (n === "templateStyle") {
    templateStyle = v;
    templateModal();
    return;
  }
  if (n === "defaultTemplate") {
    templateDefault = v;
    return;
  }
  if (n === "listOnly") {
    listUI.only = v;
    listUI.page = 0;
    lists();
    return;
  }
  if (n.startsWith("list.")) {
    item().lists = toggleIn(item().lists, n.slice(5), v);
    save();
    lists();
    return;
  }
  if (n.startsWith("draft.")) {
    draft[n.slice(6)] = v;
    return;
  }
  if (n.startsWith("item")) {
    const c = campaign();
    c.selected = toggleIn(c.selected, +n.slice(4), v);
    markProgress();
    save();
    render();
    return;
  }
  if (n.startsWith("platform."))
    item().platforms = toggleIn(item().platforms, n.slice(9), v);
  else if (n.startsWith("p.")) {
    item()[n.slice(2)] = v;
    item().checked = false;
    if (n === "p.business") item().permission = "Not requested";
  } else if (n === "maxStore") campaign().store = v ? 50 : 0;
  else if (n.startsWith("percent."))
    campaign().split[n.slice(8)] = Math.round(totals().total * Number(v)) / 100;
  else if (n.startsWith("split.")) campaign().split[n.slice(6)] = v;
  else if (n.startsWith("c.")) {
    campaign()[n.slice(2)] = v;
    if (["c.bill", "c.billRef"].includes(n)) campaign().applied = false;
  } else return;
  markProgress();
  save();
  // Keep the clicked control alive through a text-field blur. Repaint after its click.
  if (
    el.tagName === "TEXTAREA" ||
    (el.tagName === "INPUT" &&
      !["checkbox", "radio", "range"].includes(el.type))
  ) {
    setTimeout(() => {
      if (
        !document.querySelector("dialog").open &&
        document.body.contains(el)
      ) {
        const next = document.activeElement,
          focusName = next?.name;
        render();
        if (focusName) document.getElementsByName(focusName)[0]?.focus();
      }
    }, 160);
  } else render();
});
function markProgress() {
  if (campaign().status === "Ready to start") {
    campaign().status = ev().status = "In progress";
  }
}
document.addEventListener("submit", (e) => {
  if (e.target.id === "global-search") {
    e.preventDefault();
    filters.q = e.target.querySelector("input").value;
    filters.status = "All events";
    nav("events");
  }
  if (e.target.id === "promo-form") {
    e.preventDefault();
    const code = new FormData(e.target).get("code").trim().toUpperCase();
    if (code === "WELCOME10") {
      campaign().promo = code;
      save();
      render();
    } else
      document.querySelector("#promo-error").textContent =
        "That promo code is unavailable. Try WELCOME10.";
  }
});
function blobDownload(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function jpegPDF(data, w, h) {
  const enc = new TextEncoder(),
    parts = [],
    offset = [0];
  let n = 0;
  function add(v) {
    v = typeof v === "string" ? enc.encode(v) : v;
    parts.push(v);
    n += v.length;
  }
  function obj(id, v) {
    offset[id] = n;
    add(id + " 0 obj\n");
    add(v);
    add("\nendobj\n");
  }
  add("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 720 480] /Resources << /XObject << /Photo 4 0 R >> >> /Contents 5 0 R >>",
  );
  offset[4] = n;
  add(
    "4 0 obj\n<< /Type /XObject /Subtype /Image /Width " +
      w +
      " /Height " +
      h +
      " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
      data.length +
      " >>\nstream\n",
  );
  add(data);
  add("\nendstream\nendobj\n");
  const cmds = "q 720 0 0 480 0 0 cm /Photo Do Q";
  obj(5, "<< /Length " + cmds.length + " >>\nstream\n" + cmds + "\nendstream");
  const start = n;
  add(
    "xref\n0 6\n0000000000 65535 f \n" +
      offset
        .slice(1)
        .map((i) => String(i).padStart(10, "0") + " 00000 n \n")
        .join("") +
      "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" +
      start +
      "\n%%EOF",
  );
  return new Blob(parts, { type: "application/pdf" });
}
async function exportFile(i, side, format, watermark) {
  const p = campaign().items[i],
    e = ev(),
    canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 720;
  const ctx = canvas.getContext("2d"),
    photo = new Image();
  photo.src = downloadPhotos[p.photo] || downloadPhotos.house;
  await photo.decode();
  ctx.fillStyle =
    {
      Parkside: "#24474c",
      Heritage: "#594a42",
      Horizon: "#364766",
      Gallery: "#272c32",
    }[p.template] || "#24474c";
  ctx.fillRect(0, 0, 1080, 720);
  const photoHeight = side ? 300 : 500;
  const scale =
    (Math.max(1080 / photo.width, photoHeight / photo.height) *
      Number(p.zoom || 100)) /
    100;
  const cropWidth = 1080 / scale,
    cropHeight = photoHeight / scale;
  ctx.drawImage(
    photo,
    ((photo.width - cropWidth) * p.pos) / 100,
    (photo.height - cropHeight) * 0.55,
    cropWidth,
    cropHeight,
    0,
    0,
    1080,
    photoHeight,
  );
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(p.headline + " · " + sides(i)[side], 44, 554);
  ctx.font = "bold 48px Georgia";
  ctx.fillText(side ? p.contact : e.street, 44, 620);
  ctx.font = "23px Arial";
  ctx.fillText(
    e.city + ", " + e.state + " " + e.zip + " · " + p.contact,
    44,
    672,
  );
  if (watermark) {
    ctx.save();
    ctx.translate(540, 340);
    ctx.rotate(-0.26);
    ctx.font = "bold 130px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.fillText("PROOF", 0, 0);
    ctx.restore();
  }
  const jpg = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
  blobDownload(
    format === "PDF"
      ? jpegPDF(new Uint8Array(await jpg.arrayBuffer()), 1080, 720)
      : jpg,
    products[i] +
      "-" +
      sides(i)[side] +
      (watermark ? "-proof" : "") +
      "." +
      format.toLowerCase(),
  );
}
db.events
  .filter(
    (e) => e.status === "Submitted for approval" || e.status === "Completed",
  )
  .forEach(ensureCampaign);
ensureCampaign();
const initial = new URLSearchParams(location.search);
if (
  initial.has("event") &&
  db.events.some((e) => e.id === Number(initial.get("event")))
) {
  db.active = +initial.get("event");
  view = ensureCampaign().status === "Completed" ? "complete" : "event";
}
render();
