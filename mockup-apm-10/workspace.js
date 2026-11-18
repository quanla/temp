const actions = {},
  screens = {};
let view = "events",
  panel = "",
  product = 0,
  returnView = "event",
  notice = "",
  saveState = "",
  saveTimer,
  modalTimer,
  selectedSide = 0,
  showAll = false;
const filters = {
  q: "",
  type: "All types",
  status: "All events",
  sort: "Newest first",
  completed: false,
  limit: 20,
};
const b = (label, action, cls = "", v = "", icon = "") =>
  '<button type="button" class="' +
  cls +
  '" data-act="' +
  esc(action) +
  '" data-v="' +
  esc(v) +
  '">' +
  (icon ? ic(icon) : "") +
  label +
  "</button>";
const ib = (label, action, icon, v = "") =>
  '<button type="button" title="' +
  esc(label) +
  '" aria-label="' +
  esc(label) +
  '" data-act="' +
  action +
  '" data-v="' +
  esc(v) +
  '" class="ib">' +
  ic(icon) +
  "</button>";
const field = (label, name, value, type = "text", attrs = "") =>
  '<label class="field"><span>' +
  label +
  '</span><input name="' +
  esc(name) +
  '" type="' +
  type +
  '" value="' +
  esc(value) +
  '" ' +
  attrs +
  "></label>";
const opts = (arr, current) =>
  arr
    .map((x) => {
      let [v, t] = Array.isArray(x) ? x : [x, x];
      return (
        '<option value="' +
        esc(v) +
        '" ' +
        (String(v) === String(current) ? "selected" : "") +
        ">" +
        esc(t) +
        "</option>"
      );
    })
    .join("");
const select = (label, name, arr, current) =>
  '<label class="field"><span>' +
  label +
  '</span><select name="' +
  name +
  '">' +
  opts(arr, current) +
  "</select></label>";
const check = (label, name, on, toggle = false) =>
  '<label class="check"><input type="checkbox" name="' +
  name +
  '" ' +
  (on ? "checked" : "") +
  ' class="' +
  (toggle ? "toggle" : "") +
  '"><span>' +
  label +
  "</span></label>";
const badge = (s, cl = "") =>
  '<span class="badge ' + cl + '">' + esc(s) + "</span>";
const statBadge = (s) =>
  badge(
    s,
    {
      "In progress": "blue",
      "Ready to start": "green",
      "Submitted for approval": "amber",
      Completed: "neutral",
    }[s],
  );
const msg = (s, kind = "info") =>
  '<div class="message ' +
  kind +
  '">' +
  ic(kind === "error" || kind === "warn" ? "warning" : "info") +
  "<span>" +
  s +
  "</span></div>";
const blank = (title, body) =>
  '<div class="empty">' +
  ic("list") +
  "<h3>" +
  title +
  "</h3><p>" +
  body +
  "</p></div>";
const img = (p = "house", alt = "Listing photograph") =>
  '<img src="assets/' +
  (p === "interior" ? "interior" : "house") +
  '.jpg" alt="' +
  esc(alt) +
  '">';
const section = (title, body, action = "") =>
  '<section class="card"><div class="sectionhead"><h2>' +
  title +
  "</h2>" +
  action +
  "</div>" +
  body +
  "</section>";
const nav = (v) => {
  closeDialog();
  view = v;
  render();
  window.scrollTo(0, 0);
  document.querySelector("#main").focus({ preventScroll: true });
};
function modal(title, body, buttons = "", wide = false) {
  clearTimeout(modalTimer);
  const d = document.querySelector("dialog");
  d.className = wide ? "wide" : "";
  d.innerHTML =
    '<div class="modalhead"><h2 id="dialog-title">' +
    title +
    "</h2>" +
    ib("Close dialog", "dismiss", "close") +
    '</div><div class="modalbody">' +
    body +
    '</div><div class="modalfoot">' +
    (buttons || b("Done", "dismiss", "primary")) +
    "</div>";
  if (!d.open) d.showModal();
  else d.querySelector(".modalhead button").focus();
  d.querySelector(".modalbody").scrollTop = 0;
}
function closeDialog() {
  clearTimeout(modalTimer);
  document.querySelector("dialog").close();
  panel = "";
}
const cancel = () => b("Cancel", "dismiss", "link");
function confirmAction(title, body, fn, verb = "Confirm") {
  actions.confirm = () => {
    closeDialog();
    fn();
  };
  modal(title, "<p>" + body + "</p>", cancel() + b(verb, "confirm", "primary"));
}
const formValues = () =>
  Object.fromEntries(new FormData(document.querySelector("dialog form")));
function formModal(title, body, fn, verb = "Save", wide = false) {
  modal(
    title,
    '<form id="dialog-form">' + body + "</form>",
    cancel() +
      '<button class="primary" type="submit" form="dialog-form">' +
      verb +
      "</button>",
    wide,
  );
  document.querySelector("#dialog-form").onsubmit = (e) => {
    e.preventDefault();
    fn(formValues());
  };
}
function save() {
  persist();
  saveState = "Saving…";
  updateSave();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveState = "Saved automatically";
    updateSave();
  }, 650);
}
function updateSave() {
  const s = document.querySelector("#save-status");
  if (s) s.textContent = saveState || "Saved automatically";
}
function setNotice(s) {
  notice = s;
  document.querySelector("#announce").textContent = s;
}
function openEvent(id) {
  db.active = Number(id);
  attempted = false;
  const c = ensureCampaign();
  if (c.status === "Submitted for approval" && db.mode !== "Approver")
    db.mode = "Approval required";
  persist();
  nav(c.status === "Completed" ? "complete" : "event");
}
const listScope = () =>
  db.events.filter((e) => e.agent === db.agent && e.office === db.office);
function resumeCard(e) {
  const c = campaign(e),
    paid = c.selected.filter(
      (i) => ![3, 4].includes(i) && available(e).includes(i),
    ),
    total = paid.reduce((n, i) => n + price(c.items[i], i), 0);
  return (
    '<article class="resume"><div class="resumephoto">' +
    img(e.photo, e.street) +
    '<span class="photocount">' +
    ic("image") +
    e.count +
    ' photos</span></div><div class="resumetext"><span class="kicker">' +
    ic("clock") +
    " Continue working</span><h2>" +
    esc(e.street) +
    "</h2><p>" +
    ic("location") +
    esc(e.city + ", " + e.state + " " + e.zip) +
    '</p><div class="row">' +
    badge(types[e.type], "outline") +
    statBadge(e.status) +
    '</div><small class="resumeaudience">' +
    paid
      .map((i) =>
        i < 3
          ? count(c.items[i]) +
            " " +
            {
              Mail: "by mail",
              Ship: "to ship",
              Pickup: "for pickup",
              Download: "download",
            }[c.items[i].method]
          : c.items[i].duration + " ad days",
      )
      .join(" · ") +
    '</small></div><div class="resumecost"><small>Current order</small><strong>' +
    (db.hidden ? paid.length + " order items" : cost(total)) +
    "</strong><p>" +
    paid.length +
    " products in cart</p>" +
    b("Resume event " + ic("arrow"), "open", "primary", e.id) +
    "</div></article>"
  );
}
function listingRow(e) {
  let c = campaign(e);
  const n = c.selected.filter(
    (i) => ![3, 4].includes(i) && available(e).includes(i),
  ).length;
  return (
    '<article class="eventrow"><div class="thumb">' +
    img(e.photo, e.street) +
    "<span>" +
    ic("image") +
    " " +
    e.count +
    '</span></div><div class="listing"><span class="type t' +
    e.type +
    '"><i></i>' +
    types[e.type] +
    '</span><button class="street" data-act="open" data-v="' +
    e.id +
    '">' +
    esc(e.street) +
    "</button><small>" +
    esc(e.city + ", " + e.state + " " + e.zip) +
    '</small><small class="compact-meta">' +
    esc(e.agent) +
    " · " +
    eventDate(e.date) +
    '</small></div><div class="agent"><span class="avatar tiny">' +
    esc(
      e.agent
        .split(" ")
        .map((x) => x[0])
        .join(""),
    ) +
    "</span>" +
    esc(e.agent) +
    '</div><div class="rowstatus">' +
    statBadge(e.status) +
    "<small>" +
    n +
    " cart items" +
    (db.hidden
      ? ""
      : " · " +
        cost(
          c.selected
            .filter((i) => available(e).includes(i))
            .reduce((a, i) => a + price(c.items[i], i), 0),
        )) +
    "</small></div><time>" +
    eventDate(e.date) +
    "</time>" +
    ib("Event actions for " + e.street, "eventMenu", "more", e.id) +
    ib("Open " + e.street, "open", "right", e.id) +
    "</article>"
  );
}
function results() {
  const matched = listScope()
    .filter(
      (e) =>
        (filters.completed || e.status !== "Completed") &&
        (filters.type === "All types" || types[e.type] === filters.type) &&
        (filters.status === "All events" || e.status === filters.status) &&
        [e.street, e.city, e.zip, e.agent, types[e.type]]
          .join(" ")
          .toLowerCase()
          .includes(filters.q.toLowerCase()),
    )
    .sort((a, b) =>
      filters.sort === "Address A–Z"
        ? a.street.localeCompare(b.street)
        : filters.sort === "Oldest first"
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
    );
  return (
    '<div class="listhead"><span>Listing</span><span>Agent</span><span>Order status</span><span>Created</span></div>' +
    (matched.length
      ? matched.slice(0, filters.limit).map(listingRow).join("")
      : blank(
          "No available events.",
          "Try a different search or adjust your filters.",
        )) +
    '<div class="listfoot">Showing ' +
    Math.min(matched.length, filters.limit) +
    " of " +
    matched.length +
    " events " +
    (matched.length > filters.limit
      ? b("Load 20 more", "moreEvents", "secondary")
      : "") +
    "</div>"
  );
}
screens.events = () => {
  const scope = listScope(),
    resume = scope.find((e) => e.status === "In progress");
  return (
    '<div class="crumb">Account resources ' +
    ic("right") +
    ' <b>Property marketing</b></div><div class="pagehead"><div><h1>Property marketing</h1><p>Manage listing events and the marketing orders that go with them.</p></div>' +
    b("Profile &amp; settings", "settings", "secondary", "", "gear") +
    "</div>" +
    (resume ? resumeCard(resume) : "") +
    '<div class="sectionhead events-heading"><h2>Listing events</h2>' +
    b(esc(db.agent) + " " + ic("down"), "office", "agentbutton", "", "user") +
    '</div><div class="tabs">' +
    ["All events", "In progress", "Submitted for approval"]
      .map((s, i) =>
        b(
          (i === 2 ? "Awaiting approval" : s) +
            " <span>" +
            scope.filter(
              (e) =>
                (filters.completed || e.status !== "Completed") &&
                (!i || e.status === s),
            ).length +
            "</span>",
          "status",
          filters.status === s ? "active" : "",
          s,
        ),
      )
      .join("") +
    '</div><div class="toolbar"><label class="search">' +
    ic("search") +
    '<input name="searchEvents" aria-label="Search listing events" value="' +
    esc(filters.q) +
    '" placeholder="Search address, city, or ZIP"></label>' +
    select("Event type", "filterType", ["All types", ...types], filters.type) +
    select(
      "Sort by",
      "sort",
      ["Newest first", "Oldest first", "Address A–Z"],
      filters.sort,
    ) +
    check("Show completed", "completed", filters.completed, true) +
    '</div><div id="results">' +
    results() +
    "</div>"
  );
};
function typeFields(t, c) {
  return t === 2
    ? '<div class="grid2">' +
        field("Open house date", "date", c.date, "date", "required") +
        field("Start time", "from", c.from, "time", "required") +
        field("End time", "to", c.to, "time", "required") +
        "</div>"
    : t === 3
      ? '<div class="grid2">' +
        field("Old listing price", "old", c.old, "number", 'min="1" required') +
        field(
          "New listing price",
          "newPrice",
          c.newPrice,
          "number",
          'min="1" required',
        ) +
        "</div>"
      : "";
}
function setup() {
  const e = ev(),
    c = campaign();
  return (
    '<div class="crumb">' +
    b("Listing events", "events", "link") +
    ic("right") +
    ' Event workspace</div><div class="pagehead"><div><div class="kicker">' +
    ic("brief") +
    " Event workspace</div><h1>" +
    esc(e.street) +
    "</h1><p>" +
    esc(e.city + ", " + e.state + " " + e.zip) +
    " · " +
    esc(e.agent) +
    "</p></div>" +
    statBadge(c.status) +
    '</div><div class="layout"><div>' +
    section(
      "Event details",
      '<div class="eventcover">' +
        img(e.photo, e.street) +
        "<div><h3>" +
        types[e.type] +
        "</h3><p>" +
        eventDate(e.date) +
        (e.type === 2
          ? " · Open house " + eventDate(c.date) + " " + c.from + "–" + c.to
          : "") +
        (e.type === 3
          ? " · $" +
            Number(c.old).toLocaleString() +
            " → $" +
            Number(c.newPrice).toLocaleString()
          : "") +
        "</p>" +
        (e.type === 4
          ? "<small>New Neighbor has a fixed event type.</small>"
          : b("Change event details", "type", "secondary", "", "edit")) +
        "</div></div>",
    ) +
    section(
      "Marketing products",
      "<p>Choose what to include. Open any product to review its design and options.</p>" +
        available(e)
          .map(
            (i) =>
              '<div class="productrow">' +
              check(
                '<span class="sr">Include ' + products[i] + "</span>",
                "item" + i,
                selected().includes(i),
              ) +
              '<span class="chip">' +
              ic(productIcons[i]) +
              "</span><div><strong>" +
              products[i] +
              "</strong><small>" +
              summaryOf(i) +
              "</small></div><b>" +
              unitCost(price(c.items[i], i)) +
              "</b>" +
              b(
                selected().includes(i) ? "Customize" : "Add & customize",
                "customize",
                "secondary",
                i,
              ) +
              "</div>",
          )
          .join("") +
        (!db.connected
          ? msg(
              "Connect social accounts in Profile &amp; settings to add Social Media.",
            )
          : "") +
        (!selected().length
          ? msg("Select at least one product to continue.", "warn")
          : ""),
    ) +
    "</div><aside>" +
    section(
      "Order at a glance",
      '<div class="metric">' +
        (db.hidden ? ordered().length + " items" : cost(subtotal())) +
        "</div><p>" +
        ordered().length +
        " order items · " +
        selected().filter((i) => [3, 4].includes(i)).length +
        " free tools</p>" +
        (e.history?.length
          ? "<p>Previous orders: " +
            e.history
              .map((x) => "#APM-" + (x.order.number || "4819"))
              .join(", ") +
            "</p>"
          : "") +
        ordered()
          .map(
            (i) =>
              '<div class="line"><span>' +
              products[i] +
              "</span><b>" +
              unitCost(price(c.items[i], i)) +
              "</b></div>",
          )
          .join("") +
        '<div class="block">' +
        b("Review cart " + ic("arrow"), "cart", "primary") +
        "</div><small>" +
        ic("check") +
        ' <span id="save-status">Saved automatically</span></small>',
    ) +
    section(
      "Listing information",
      "<p>1 bedroom · 1 bathroom</p><p>Listing price <b>$" +
        ev().price.toLocaleString() +
        "</b></p><p>" +
        esc(e.description) +
        "</p>",
    ) +
    "</aside></div>"
  );
}
screens.event = setup;
function summaryOf(i) {
  const p = campaign().items[i];
  return i === 5
    ? p.duration + " days · " + p.distance + " miles"
    : i === 3
      ? "Share now or schedule"
      : i === 4
        ? "Download artwork files"
        : p.method === "Mail"
          ? p.mailClass + " Mail · " + count(p) + " pieces"
          : p.method + " · " + count(p) + " pieces";
}
Object.assign(actions, {
  dismiss: closeDialog,
  open: openEvent,
  events: () => nav("events"),
  settings: () => nav("settings"),
  help: () => nav("help"),
  site: () => nav("site"),
  dashboard: () => nav("dashboard"),
  expired: () => nav("expired"),
  banner: () => {
    db.banner = false;
    persist();
    render();
  },
  clearNotice: () => {
    notice = "";
    render();
  },
  moreEvents: () => {
    filters.limit += 20;
    render();
  },
  status: (v) => {
    filters.status = v;
    filters.limit = 20;
    render();
  },
  office: () => {
    const offices = [...new Set(db.events.map((e) => e.office))];
    formModal(
      "Select office &amp; user",
      select("Office", "office", offices, db.office) +
        select(
          "Agent",
          "agent",
          [
            ...new Set(
              db.events
                .filter((e) => e.office === db.office)
                .map((e) => e.agent),
            ),
          ],
          db.agent,
        ),
      (v) => {
        Object.assign(db, v);
        db.active = listScope()[0]?.id;
        ensureCampaign();
        filters.q = "";
        filters.status = "All events";
        filters.type = "All types";
        filters.limit = 20;
        persist();
        nav("events");
      },
      "View events",
    );
    document.querySelector("dialog [name=office]").onchange = (e) =>
      (document.querySelector("dialog [name=agent]").innerHTML = opts(
        [
          ...new Set(
            db.events
              .filter((x) => x.office === e.target.value)
              .map((x) => x.agent),
          ),
        ],
        null,
      ));
  },
  eventMenu: (id) => {
    const e = db.events.find((x) => x.id == id);
    modal(
      esc(e.street),
      '<div class="actionlist">' +
        b("Open event", "open", "secondary", id, "brief") +
        b("Edit listing details", "editListing", "", id, "edit") +
        b("Delete event", "deleteEvent", "danger", id, "trash") +
        "</div>",
    );
  },
  editListing: (id) => {
    const e = db.events.find((x) => x.id == id);
    formModal(
      "Edit listing details",
      field("Street address", "street", e.street, "text", "required") +
        '<div class="grid2">' +
        ["city", "state", "zip"]
          .map((k) =>
            field(
              k === "zip" ? "ZIP code" : k[0].toUpperCase() + k.slice(1),
              k,
              e[k],
              "text",
              "required",
            ),
          )
          .join("") +
        "</div>",
      (v) => {
        Object.assign(e, v);
        persist();
        closeDialog();
        render();
      },
    );
  },
  deleteEvent: (id) =>
    confirmAction(
      "Delete event?",
      "The event and all its saved carts will be removed.",
      () => {
        db.events = db.events.filter((e) => e.id != id);
        persist();
        nav("events");
      },
      "Delete event",
    ),
  type: () => {
    const e = ev(),
      c = campaign();
    function show(t) {
      const dest = e.carts[t] || {
        date: localDay(8),
        from: "10:00",
        to: "13:00",
        old: 525000,
        newPrice: 499000,
      };
      formModal(
        "Change event details",
        select(
          "Event type",
          "type",
          offered(e).map((k) => [k, types[k]]),
          t,
        ) +
          typeFields(t, dest) +
          (t !== e.type
            ? msg(
                "This opens a separate cart for " +
                  types[t] +
                  ". Your " +
                  types[e.type] +
                  " cart is saved and will be here when you switch back.",
              )
            : "") +
          '<p class="error" id="type-error"></p>',
        (v) => {
          if (+v.type === 2 && v.to <= v.from) {
            document.querySelector("#type-error").textContent =
              "End time must follow start time.";
            return;
          }
          e.type = +v.type;
          delete v.type;
          Object.assign(ensureCampaign(), v, { allowPast: false });
          e.status = campaign().status;
          save();
          nav("event");
        },
        t === e.type ? "Save changes" : "Switch event type",
      );
      document.querySelector("dialog [name=type]").onchange = (x) =>
        show(+x.target.value);
    }
    show(e.type);
  },
  cart: () => {
    if (!ev()) {
      nav("events");
      return;
    }
    if (view === "product") {
      leaveProduct(() => enterCart());
      return;
    }
    enterCart();
  },
  customize: (v) => {
    if (!selected().includes(+v)) campaign().selected.push(+v);
    openProduct(+v, "event");
  },
});
function enterCart() {
  const c = ensureCampaign();
  if (!selected().length) {
    setNotice("Select at least one marketing product.");
    nav("event");
    return;
  }
  if (ev().type === 2 && c.date < localDay() && !c.allowPast) {
    modal(
      "This open house is in the past",
      msg("Change the event date or continue with this date.", "warn"),
      b("Change date", "type", "secondary") +
        b("Continue anyway", "allowPast", "primary"),
    );
    return;
  }
  nav(c.status === "Completed" ? "complete" : "cart");
}
actions.allowPast = () => {
  campaign().allowPast = true;
  save();
  enterCart();
};
