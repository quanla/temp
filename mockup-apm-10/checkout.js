const shipped = () =>
  ordered().some((i) => i < 3 && campaign().items[i].method === "Ship");
let attempted = false;
function totals() {
  const c = campaign(),
    sub = subtotal(),
    promo = c.promo ? Math.min(sub, 10) : 0,
    shipping = shipped()
      ? { Ground: 0, Priority: 12, Express: 24 }[c.service] || 0
      : 0,
    tax = Math.round((sub - promo + shipping) * 0.0825 * 100) / 100;
  const gross = sub - promo + shipping + tax,
    copay = Math.min(
      gross,
      ordered().reduce(
        (n, i) => n + (c.copay[i] ? Math.min(15, price(c.items[i], i)) : 0),
        0,
      ),
    );
  const store = Math.min(50, Math.max(0, +c.store || 0), gross - copay),
    voucher = c.voucher ? Math.min(10, gross - copay - store) : 0,
    ad =
      c.budget && ordered().includes(5)
        ? Math.min(30, price(c.items[5], 5), gross - copay - store - voucher)
        : 0;
  const total = Math.round((gross - copay - store - voucher - ad) * 100) / 100;
  return { sub, promo, shipping, tax, copay, store, voucher, ad, total };
}
const cardLabel = (x) => (x ? x.brand + " ending " + x.last : "Select a card");
function breakdown(i) {
  let p = campaign().items[i];
  return (
    '<div class="breakdown">' +
    (i < 3 && p.method === "Mail"
      ? '<div class="line"><span>Mailing lists</span><span>' +
        esc(
          [
            p.useRadius ? ev().street + " (New)" : null,
            ...db.lists
              .filter((l) => p.lists.includes(l.id))
              .map((l) => l.name),
          ]
            .filter(Boolean)
            .join(", "),
        ) +
        '</span></div><div class="line">Mailing quantity<b>' +
        (count(p) - (p.sample ? 1 : 0)) +
        "</b></div>"
      : "") +
    charges(p, i)
      .map(
        ([label, n]) =>
          '<div class="line"><span>' +
          esc(label) +
          "</span><b>" +
          unitCost(n) +
          "</b></div>",
      )
      .join("") +
    "</div>"
  );
}
function cartItem(i) {
  const c = campaign(),
    p = c.items[i];
  return (
    '<div class="cartitem"><div class="cartrow">' +
    proof(p, i, 0, true) +
    "<div><h3>" +
    products[i] +
    "</h3><small>" +
    summaryOf(i) +
    "</small></div><strong>" +
    cost(price(p, i)) +
    '</strong></div><div class="row">' +
    b("Edit", "editCart", "link", i, "edit") +
    b("Delete", "deleteCart", "link", i, "trash") +
    (i === 1
      ? b("Copay unavailable", "noCopay", "link")
      : c.copay[i]
        ? b("Copay applied · Remove", "uncopay", "secondary", i)
        : b("Copay available", "copay", "secondary", i)) +
    "</div><details><summary>Price and delivery breakdown</summary>" +
    breakdown(i) +
    "</details>" +
    issues(i)
      .map((x) => msg(esc(x), "error"))
      .join("") +
    "</div>"
  );
}
function sectionError(condition, label) {
  return attempted && condition ? msg(label, "error") : "";
}
function shippingPart() {
  const c = campaign(),
    addr = db.addresses.find((x) => x.id === c.ship);
  return section(
    "Shipping",
    select(
      "Delivery address *",
      "c.ship",
      [
        ["", "Choose an address"],
        ...db.addresses.map((a) => [a.id, a.name + " · " + a.street]),
      ],
      c.ship,
    ) +
      sectionError(!addr, "Choose or add a shipping address.") +
      (addr
        ? "<p>" +
          esc(
            [
              addr.name,
              addr.company,
              addr.phone,
              addr.street,
              addr.suite,
              addr.city,
              addr.state,
              addr.zip,
              addr.country,
            ]
              .filter(Boolean)
              .join(" · "),
          ) +
          "</p>"
        : "") +
      '<div class="row">' +
      b("Add address", "address", "secondary", "", "plus") +
      (addr
        ? b("Edit", "address", "link", addr.id) +
          b("Delete", "deleteAddress", "link", addr.id)
        : "") +
      "</div>" +
      select(
        "Shipping service *",
        "c.service",
        [
          ["", "Choose a service"],
          ["Ground", "Ground" + (db.hidden ? "" : " · Included")],
          ["Priority", "Priority" + (db.hidden ? "" : " · $12")],
          ["Express", "Express" + (db.hidden ? "" : " · $24")],
        ],
        c.service,
      ) +
      sectionError(!c.service, "Select a shipping service.") +
      (c.service
        ? "<small>Estimated delivery " +
          eventDate(
            localDay({ Ground: 7, Priority: 4, Express: 2 }[c.service]),
          ) +
          "</small>"
        : ""),
  );
}
const usableCards = () =>
  db.cards.filter((x) => x.profile !== false || x.owner === ev().id);
function paymentPart() {
  const c = campaign(),
    mode = c.pay;
  return section(
    "Payment",
    select(
      "Payment method",
      "c.pay",
      ["Saved card", "Corporate billing", "Split cards", "Google Pay"],
      mode,
    ) +
      (mode === "Saved card" || mode === "Split cards"
        ? '<div class="wallet">' +
          usableCards()
            .map(
              (x) =>
                '<div class="walletrow"><div><strong>' +
                esc(cardLabel(x)) +
                "</strong> " +
                (x.default ? badge("Default", "neutral") : "") +
                "<small>" +
                esc(x.name) +
                " · Expires " +
                esc(x.exp) +
                "</small></div>" +
                (mode === "Split cards"
                  ? db.hidden
                    ? field(
                        "Share (%)",
                        "percent." + x.id,
                        Math.round(
                          ((c.split[x.id] || 0) * 100) / (totals().total || 1),
                        ),
                        "number",
                        'min="0" max="100"',
                      )
                    : field(
                        "Amount to charge",
                        "split." + x.id,
                        c.split[x.id] || 0,
                        "number",
                        'step=".01" min="0"',
                      )
                  : b(
                      c.card === x.id ? "Selected" : "Select",
                      "selectCard",
                      c.card === x.id ? "secondary" : "link",
                      x.id,
                    )) +
                '<div class="row">' +
                ib("Edit card", "card", "edit", x.id) +
                ib("Remove card", "deleteCard", "trash", x.id) +
                (x.default
                  ? ""
                  : b("Make default", "defaultCard", "link", x.id)) +
                "</div></div>",
            )
            .join("") +
          "</div>" +
          b("Add a card", "card", "secondary", "", "plus") +
          (mode === "Split cards"
            ? msg(
                db.hidden
                  ? "Allocate 100% across your cards."
                  : "Enter an amount for each card. Their sum must cover the total.",
              ) +
              sectionError(
                Math.abs(balance()) > 0.005,
                "Card allocations must add up to the order total.",
              )
            : sectionError(
                !usableCards().some((x) => x.id === c.card),
                "Select a payment card.",
              ))
        : mode === "Google Pay"
          ? msg(
              "Google Pay covers the entire balance. Split payments are available under Split cards.",
            )
          : select(
              "Billing account",
              "c.bill",
              ["Acme Ad Budget", "ACME Billing"],
              c.bill,
            ) +
            field("Purchase reference *", "c.billRef", c.billRef) +
            b(
              c.applied ? "Billing account applied" : "Apply billing account",
              "applyBilling",
              "secondary",
            ) +
            sectionError(
              !c.applied,
              "Enter a purchase reference and apply the billing account.",
            )),
  );
}
const splitSum = () =>
  usableCards().reduce(
    (n, x) => n + Math.max(0, +campaign().split[x.id] || 0),
    0,
  );
function balance() {
  const c = campaign(),
    total = totals().total;
  if (c.pay === "Split cards") return total - splitSum();
  return (c.pay === "Saved card" &&
    !usableCards().some((x) => x.id === c.card)) ||
    (c.pay === "Corporate billing" && !c.applied)
    ? total
    : 0;
}
function creditsPart() {
  const c = campaign();
  return section(
    "Credits and promotions",
    (c.promo
      ? '<div class="line">' +
        badge(c.promo, "green") +
        b("Remove code", "removePromo", "link") +
        "</div>"
      : '<form id="promo-form" class="row">' +
        field(
          "Promo code",
          "code",
          "",
          "text",
          'placeholder="Try WELCOME10" required',
        ) +
        '<button class="secondary">Apply code</button></form><small id="promo-error" role="status"></small>') +
      (db.hidden
        ? check("Use available store credit", "maxStore", c.store > 0, true)
        : field(
            "Store credit to apply · $50 available",
            "c.store",
            c.store,
            "number",
            'min="0" max="50" step=".01"',
          )) +
      check(
        "Apply welcome voucher" + (db.hidden ? "" : " · $10"),
        "c.voucher",
        c.voucher,
        true,
      ) +
      (ordered().includes(5)
        ? check(
            "Apply ad budget" + (db.hidden ? "" : " · up to $30"),
            "c.budget",
            c.budget,
            true,
          )
        : "<small>Ad budget is available when you include a Facebook Ad.</small>"),
  );
}
function summaryPanel() {
  const c = campaign(),
    t = totals(),
    method =
      c.pay === "Saved card"
        ? cardLabel(db.cards.find((x) => x.id === c.card))
        : c.pay === "Corporate billing"
          ? c.bill
          : c.pay;
  const row = (s, n) =>
    '<div class="line"><span>' + s + "</span><b>" + money(n) + "</b></div>";
  return section(
    "Order summary",
    "<small>" +
      ordered().length +
      " order items · " +
      esc(ev().street) +
      "</small>" +
      (db.hidden
        ? msg(
            "Your company manages pricing. Review the products, delivery, and payment method below.",
          )
        : '<div class="summarylines">' +
          row("Subtotal", t.sub) +
          row("Promo code", -t.promo) +
          row("Shipping", t.shipping) +
          row("Sales tax", t.tax) +
          row("Store credit", -t.store) +
          row("Voucher", -t.voucher) +
          row("Ad budget", -t.ad) +
          row("Copay", -t.copay) +
          '</div><div class="total">Total <strong>' +
          money(t.total) +
          "</strong></div>") +
      (c.pay === "Split cards"
        ? usableCards()
            .map(
              (x) =>
                '<div class="line"><span>' +
                esc(cardLabel(x)) +
                "</span><b>" +
                cost(c.split[x.id] || 0) +
                "</b></div>",
            )
            .join("")
        : '<div class="line"><span>' +
          esc(method) +
          "</span><b>" +
          cost(t.total - balance()) +
          "</b></div>") +
      (db.hidden
        ? ""
        : '<div class="line"><small>Balance remaining</small><b>' +
          money(balance()) +
          "</b></div>") +
      "<hr>" +
      check("I accept the terms and conditions", "c.terms", c.terms) +
      b("Read full terms", "terms", "link") +
      sectionError(!c.terms, "Accept the terms before continuing.") +
      '<div class="block">' +
      b(
        db.mode === "Normal"
          ? "Complete Checkout"
          : db.mode === "Approver"
            ? "Approve"
            : "Submit for Approval",
        "place",
        "primary",
      ) +
      "</div>" +
      (db.mode === "Approver"
        ? b("Save and Return to Dashboard", "saveDashboard", "secondary")
        : "") +
      (attempted && invalidCheckout()
        ? msg("Review the highlighted sections to finish.", "error")
        : ""),
  );
}
function invalidCheckout() {
  const c = campaign();
  return (
    !selected().length ||
    ordered().some((i) => issues(i).length) ||
    !c.terms ||
    (shipped() && (!db.addresses.some((x) => x.id === c.ship) || !c.service)) ||
    Math.abs(balance()) > 0.005 ||
    (c.pay === "Corporate billing" && !c.applied) ||
    c.store < 0 ||
    c.store > 50
  );
}
screens.cart = () =>
  '<div class="crumb">' +
  b("Listing events", "events", "link") +
  ic("right") +
  b(esc(ev().street), "toEvent", "link") +
  ic("right") +
  ' Cart</div><div class="pagehead"><div><h1>Review your order</h1><p>' +
  esc(ev().street) +
  " · " +
  types[ev().type] +
  "</p></div>" +
  badge(db.mode === "Normal" ? "Checkout" : db.mode, "blue") +
  '</div><div class="layout"><div>' +
  section(
    "Products",
    ordered().length
      ? ordered().map(cartItem).join("")
      : msg(
          "No paid items. You can finish this event with its selected free tools.",
        ),
  ) +
  (shipped() ? shippingPart() : "") +
  creditsPart() +
  sectionError(
    campaign().store < 0 || campaign().store > 50,
    "Apply between 0 and 50 in store credit.",
  ) +
  paymentPart() +
  '</div><aside class="sticky">' +
  summaryPanel() +
  "</aside></div>";
function addressForm(id) {
  const a = db.addresses.find((x) => x.id === id) || {
    country: "United States",
  };
  const fields = [
    ["name", "Name", true],
    ["company", "Company"],
    ["phone", "Phone", true],
    ["country", "Country", true],
    ["street", "Address 1", true],
    ["suite", "Address 2 / suite"],
    ["city", "City", true],
    ["state", "State", true],
    ["zip", "ZIP code", true],
  ];
  formModal(
    id ? "Edit shipping address" : "Add shipping address",
    '<div class="grid2">' +
      fields
        .map(([k, s, req]) =>
          field(s + (req ? " *" : ""), k, a[k], "text", req ? "required" : ""),
        )
        .join("") +
      "</div>" +
      check("Is this a business address?", "business", a.business),
    (v) => {
      const newAddr = {
        ...v,
        business: !!v.business,
        id: id || "A" + Date.now(),
      };
      db.addresses = [...db.addresses.filter((x) => x.id !== id), newAddr];
      campaign().ship = newAddr.id;
      save();
      closeDialog();
      render();
    },
    "Save address",
    true,
  );
}
function cardForm(id) {
  const x = db.cards.find((x) => x.id === id) || {};
  formModal(
    id ? "Edit saved card" : "Add a demo card",
    msg("Use fictional details only. Example card: 4111 1111 1111 1111.") +
      '<div class="grid2">' +
      (id
        ? "<p>" + esc(cardLabel(x)) + "</p>"
        : field(
            "Card number *",
            "number",
            "",
            "text",
            'inputmode="numeric" placeholder="4111 1111 1111 1111" pattern="[0-9 ]{13,23}" required',
          )) +
      field("Name on card *", "name", x.name, "text", "required") +
      field(
        "Expiration *",
        "exp",
        x.exp || "12/30",
        "text",
        'pattern="(0[1-9]|1[0-2])/[0-9]{2}" required',
      ) +
      (id
        ? ""
        : field(
            "CVV *",
            "cvv",
            "",
            "password",
            'inputmode="numeric" pattern="[0-9]{3,4}" required',
          )) +
      "</div>" +
      field(
        "Billing address *",
        "billing",
        x.billing || "123 Roundhouse Kick, Fort Worth, TX 76180",
        "text",
        "required",
      ) +
      check("Save to profile", "profile", id ? x.profile !== false : true),
    (v) => {
      const newCard = {
        ...x,
        id: id || "C" + Date.now(),
        brand: x.brand || "Visa",
        name: v.name,
        exp: v.exp,
        billing: v.billing,
        profile: !!v.profile,
        owner: ev().id,
        last: x.last || v.number.replace(/ /g, "").slice(-4),
        default: x.default || !db.cards.length,
      };
      db.cards = [...db.cards.filter((y) => y.id !== id), newCard];
      campaign().card = newCard.id;
      save();
      closeDialog();
      render();
    },
    "Save card",
  );
}
function place() {
  attempted = true;
  if (invalidCheckout()) {
    render();
    document.querySelector(".error")?.scrollIntoView({ block: "center" });
    return;
  }
  const c = campaign(),
    e = ev();
  if (db.mode === "Approval required") {
    c.status = e.status = "Submitted for approval";
    setNotice(
      "Submission Successful. Your order for " +
        e.street +
        " is awaiting approval.",
    );
    filters.status = "All events";
    filters.q = "";
    filters.type = "All types";
    save();
    attempted = false;
    nav("events");
    return;
  }
  c.status = e.status = "Completed";
  c.number = c.number || ++db.sequence;
  c.receipt = totals().total;
  setNotice("");
  attempted = false;
  save();
  nav("complete");
}
screens.complete = () => {
  const c = campaign(),
    next = listScope().find(
      (x) => x.id !== ev().id && x.status !== "Completed",
    );
  return (
    '<div class="crumb">' +
    b("Listing events", "events", "link") +
    ic("right") +
    ' Order confirmation</div><div class="finish"><span class="successicon">' +
    ic("check") +
    "</span><h1>Order complete</h1><p>Order #APM-" +
    (c.number || "4819") +
    " · " +
    esc(ev().street) +
    "</p><p>A confirmation email with the order details has been sent to " +
    esc(ev().agent) +
    '.</p></div><div class="layout">' +
    section(
      "Order files",
      selected()
        .filter(
          (i) =>
            i === 4 ||
            (i < 3 && (c.items[i].pdf || c.items[i].method === "Download")),
        )
        .map(
          (i) =>
            '<div class="line"><b>' +
            products[i] +
            '</b><div class="row">' +
            sides(i)
              .map((s, j) =>
                b(s, "receiptFile", "secondary", i + "-" + j, "download"),
              )
              .join("") +
            "</div></div>",
        )
        .join("") || "<p>No downloadable files in this order.</p>",
    ) +
    section(
      "Your next event",
      (next
        ? "<p>You have available events.</p>" +
          b("Open next event", "open", "primary", next.id)
        : "") +
        '<div class="block">' +
        b("Back to Xpresso", "site", "link") +
        b("Start another order for this listing", "reorder", "secondary") +
        "</div><small>Questions? (866) 977-3627</small>",
    ) +
    "</div>"
  );
};
Object.assign(actions, {
  reorder: () => {
    const e = ev(),
      previous = campaign();
    (e.history ||= []).push({
      type: e.type,
      order: JSON.parse(JSON.stringify(previous)),
    });
    const next = {
      ...previous,
      number: null,
      receipt: null,
      status: "In progress",
      terms: false,
      promo: "",
      store: 0,
      voucher: false,
      budget: 0,
      copay: {},
      applied: false,
      split: {},
    };
    e.carts[e.type] = next;
    e.status = next.status;
    attempted = false;
    save();
    setNotice("A new order is ready with your previous product selections.");
    nav("event");
  },
  jumpSummary: () =>
    document.querySelector(".sticky").scrollIntoView({ block: "start" }),
  toEvent: () => nav("event"),
  editCart: (v) => openProduct(+v, "cart"),
  deleteCart: (v) =>
    confirmAction(
      "Delete " + products[v] + " from the cart?",
      "You can add it again from the event workspace.",
      () => {
        campaign().selected = selected().filter((i) => i !== +v);
        save();
        nav(selected().length ? "cart" : "event");
      },
      "Delete item",
    ),
  copay: (v) =>
    formModal(
      "Apply company copay",
      field("Agent reference *", "ref", "", "text", "required") +
        msg(
          db.hidden
            ? "Your company will cover part of this item."
            : "Your company will cover up to $15 for this item.",
        ),
      (x) => {
        campaign().copay[v] = x.ref;
        save();
        closeDialog();
        render();
      },
      "Apply copay",
    ),
  uncopay: (v) => {
    delete campaign().copay[v];
    save();
    render();
  },
  noCopay: () =>
    modal(
      "Copay unavailable",
      '<p>This property already has a brochure copay on another order.</p><div class="line"><b>#APM-4792 · Listing brochures</b><span>' +
        cost(15) +
        "</span></div>",
    ),
  address: addressForm,
  deleteAddress: (id) =>
    confirmAction(
      "Delete saved address?",
      "Orders using this address will need another delivery address.",
      () => {
        db.addresses = db.addresses.filter((x) => x.id !== id);
        campaign().ship = "";
        save();
        render();
      },
      "Delete address",
    ),
  card: cardForm,
  deleteCard: (id) =>
    confirmAction(
      "Remove saved card?",
      "This card will be removed from your payment options.",
      () => {
        db.cards = db.cards.filter((x) => x.id !== id);
        if (!db.cards.some((x) => x.default) && db.cards.length)
          db.cards[0].default = true;
        save();
        render();
      },
      "Remove card",
    ),
  defaultCard: (id) => {
    db.cards.forEach((x) => (x.default = x.id === id));
    save();
    render();
  },
  selectCard: (id) => {
    campaign().card = id;
    save();
    render();
  },
  applyBilling: () => {
    campaign().applied = !!campaign().billRef.trim();
    attempted = !campaign().applied;
    save();
    render();
  },
  removePromo: () => {
    campaign().promo = "";
    save();
    render();
  },
  terms: () =>
    modal(
      "Terms and conditions",
      "<p>By submitting this demonstration order, you confirm the artwork, recipients, delivery details, and payment allocation. Printed colors and delivery estimates may vary. Approval-based orders enter production after approval.</p><p>This prototype uses fictional transactions. No payment is collected and no marketing is sent.</p>",
    ),
  place,
  saveDashboard: () => {
    save();
    setNotice("Cart changes saved.");
    nav("dashboard");
  },
  receiptFile: (v) => {
    const [i, j] = v.split("-").map(Number);
    const p = campaign().items[i];
    exportFile(
      i,
      j,
      i === 4 || p.method === "Download" ? p.format : "PDF",
      false,
    );
  },
});
