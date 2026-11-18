const item = () => campaign().items[product];
const sides = (i) =>
  i === 1
    ? ["Cover", "Inside left", "Inside right", "Back"]
    : i === 0
      ? ["Front", "Back"]
      : ["Front"];
const coatings = [
  "None",
  "Gloss Coating",
  "Matte Coating",
  "Gloss Postal Protect",
  "Soft Touch Postal Protect",
];
const platforms = ["Facebook", "Instagram", "X", "LinkedIn", "Pinterest"];
let draft = null,
  scanDestination = null,
  listUI = { query: "", only: false, page: 0 },
  templateStyle = "All styles",
  templatePick = "",
  sideMode = false;
function openProduct(i, origin) {
  product = i;
  returnView = origin;
  selectedSide = 0;
  showAll = false;
  draft = null;
  markProgress();
  save();
  nav("product");
}
function proof(p, i, side = 0, mini = false) {
  const e = ev(),
    reverse = side > 0;
  return (
    '<div class="art art-' +
    ["Parkside", "Heritage", "Horizon", "Gallery"].indexOf(p.template) +
    (reverse ? " reverse" : "") +
    (mini ? " mini" : "") +
    '"><div class="art-photo" style="--zoom:' +
    Number(p.zoom || 100) +
    "%;--pos:" +
    Number(p.pos || 50) +
    '%">' +
    img(p.photo, e.street) +
    '</div><div class="art-copy"><small>' +
    esc(reverse ? sides(i)[side] : p.headline) +
    "</small><strong>" +
    esc(reverse ? p.contact : e.street) +
    "</strong><span>" +
    esc(reverse ? e.description : e.city + ", " + e.state) +
    " · " +
    esc(e.zip) +
    "</span></div></div>"
  );
}
function productNav() {
  return (
    '<nav class="productnav" aria-label="Selected products">' +
    selected()
      .map((i) =>
        b(
          products[i],
          "switchProduct",
          i === product ? "active" : "",
          i,
          productIcons[i],
        ),
      )
      .join("") +
    "</nav>"
  );
}
function preview() {
  const p = item();
  return section(
    "Design preview",
    '<div class="proofstage">' +
      proof(p, product, selectedSide) +
      '</div><div class="sidebar">' +
      sides(product)
        .map((s, j) =>
          b(s, "side", selectedSide === j ? "secondary" : "link", j),
        )
        .join("") +
      (sides(product).length > 1
        ? b("All sides", "allSides", "link", "", "layers")
        : "") +
      "</div>" +
      (showAll
        ? '<div class="minis">' +
          sides(product)
            .map((s, j) =>
              b(proof(p, product, j, true) + esc(s), "side", "", j),
            )
            .join("") +
          "</div>"
        : "") +
      '<div class="row">' +
      b("Edit design", "editor", "primary", "", "edit") +
      b("Change template", "templates", "secondary") +
      b("Editor help", "editorHelp", "link", "", "help") +
      '</div><hr><div class="row">' +
      b("Download proof", "downloadProof", "link", "", "download") +
      b("Reset template", "resetTemplate", "link", "", "refresh") +
      "</div>" +
      (p.edited
        ? msg(
            "Design warning: check image resolution and cropped text in field07.",
            "warn",
          )
        : ""),
    badge(p.template, "outline"),
  );
}
const pf = (label, k, type = "text", attrs = "") =>
  field(label, "p." + k, item()[k], type, attrs);
const ps = (label, k, arr) => select(label, "p." + k, arr, item()[k]);
const pc = (label, k, toggle = true) =>
  check(label, "p." + k, item()[k], toggle);
function mailing() {
  const p = item(),
    e = ev();
  let html =
    '<h3>Mailing audience</h3><div class="option">' +
    pc(esc(e.street) + " (New)", "useRadius", false) +
    pf("Radius recipients", "radius", "number", 'min="1"') +
    "</div>";
  if (!p.addressValid)
    html += msg(
      "The radius list needs a valid address. " +
        b("Correct address", "fixAddress", "link"),
      "error",
    );
  html +=
    db.lists
      .filter((l) => p.lists.includes(l.id))
      .map(
        (l) =>
          '<div class="line">' +
          esc(l.name) +
          "<b>" +
          l.qty +
          " recipients</b></div>",
      )
      .join("") +
    b("Manage mailing lists", "lists", "secondary", "", "team") +
    "<hr>" +
    pc("Add sample card", "sample") +
    (p.sample
      ? '<div class="grid2">' +
        pf("Recipient name *", "sampleName") +
        pf("Sample mailing address *", "sampleAddr") +
        "</div>"
      : "") +
    ps("Mailing class", "mailClass", [
      ["First Class", "First Class · 3–5 business days"],
      ["Standard", "Standard · 5–15 business days"],
    ]);
  if (e.type === 2) {
    let d = new Date(),
      work = 0;
    while (
      localDay(Math.round((d - new Date()) / 86400000)) < campaign().date &&
      work < 16
    ) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() % 6 !== 0) work++;
    }
    if (work < (p.mailClass === "Standard" ? 15 : 5))
      html += msg(
        "Arrival before the open house cannot be guaranteed." +
          (p.mailClass === "Standard" && work >= 5
            ? " " + b("Switch to First Class", "firstClass", "link")
            : ""),
        "warn",
      );
  }
  return html;
}
function printOptions() {
  const p = item(),
    methods =
      p.template === "Gallery"
        ? ["Download"]
        : p.template === "Heritage"
          ? ["Mail", "Ship", "Pickup", "Download"]
          : ["Mail", "Ship", "Download"];
  return section(
    "Order options",
    (methods.length > 1
      ? ps("Distribution method", "method", methods)
      : "<p>Digital download</p>") +
      (p.method === "Mail"
        ? mailing()
        : p.method === "Download"
          ? fileOptions()
          : pf("Quantity *", "qty", "number", 'min="1"')) +
      (p.method !== "Download"
        ? '<hr><div class="grid2">' +
          ps("Paper type", "paper", [
            [
              "Premium Cover Stock",
              "Premium Cover Stock" + (db.hidden ? "" : " · Included"),
            ],
            [
              "Heavy Cover Stock",
              "Heavy Cover Stock" + (db.hidden ? "" : " · $0.15 / piece"),
            ],
          ]) +
          ps(
            "Coating",
            "coating",
            coatings.map((k) => [
              k,
              k + (db.hidden ? "" : " · " + unitCost(coatCost({ coating: k }))),
            ]),
          ) +
          "</div>" +
          pc(
            "PDF download with purchase" + (db.hidden ? "" : " · $2.50"),
            "pdf",
          )
        : "") +
      (product === 0 && p.method === "Mail"
        ? "<hr>" +
          pc(
            "Informed Delivery by USPS" + (db.hidden ? "" : " · Free"),
            "informed",
          ) +
          b("What is Informed Delivery?", "uspsHelp", "link") +
          (p.informed ? informed() : "")
        : ""),
  );
}
function informed() {
  const p = item();
  return (
    pf("Display name *", "display", "text", 'maxlength="36"') +
    '<small id="remaining">' +
    (36 - p.display.length) +
    ' characters remaining</small><div class="line"><span>Ride-along image ' +
    (p.ride + 1) +
    "</span>" +
    b("See all (13)", "rides", "secondary") +
    "</div>" +
    ps("Redirect destination", "redirectType", ["Xpress Links", "Custom URL"]) +
    (p.redirectType === "Custom URL"
      ? pf("Redirect URL *", "redirect", "url")
      : "") +
    '<a target="_blank" rel="noopener" href="' +
    esc(
      validUrl(
        p.redirectType === "Custom URL"
          ? p.redirect
          : "https://example.com/chucky",
      )
        ? p.redirectType === "Custom URL"
          ? p.redirect
          : "https://example.com/chucky"
        : "#",
    ) +
    '">Preview destination ' +
    ic("external") +
    '</a><div class="email"><small>USPS email preview</small><h3 id="from-name">From ' +
    esc(p.display) +
    "</h3>" +
    proof(p, 0, 0, true) +
    "<p>Learn more about your mail</p>" +
    rideImage(p.ride) +
    "</div>"
  );
}
function rideImage(i) {
  return (
    '<div class="ride crop' +
    (i % 4) +
    '">' +
    img(i % 2 ? "interior" : "house", "Ride-along option " + (i + 1)) +
    "<span>" +
    ["View listing", "Explore the home", "Take a tour"][i % 3] +
    "</span></div>"
  );
}
function fileOptions() {
  const p = item();
  return (
    ps("File type", "format", ["JPG", "PDF"]) +
    (p.fileState === "Preparing"
      ? msg("Preparing your files…") + '<div class="skeleton"></div>'
      : p.fileState === "Error"
        ? msg(
            "Template configuration error. Call (866) 977-3627. " +
              b("Retry", "fileRetry", "secondary"),
            "error",
          )
        : '<div class="row">' +
          sides(product)
            .map((s, i) =>
              b(
                "Download " + s.toLowerCase(),
                "downloadSide",
                "secondary",
                i,
                "download",
              ),
            )
            .join("") +
          "</div>")
  );
}
function social() {
  const p = item();
  return section(
    "Share this listing",
    "<p>You can checkout or leave this product before posting.</p>" +
      (!db.connected
        ? msg("Connect accounts in Profile &amp; settings.")
        : "<fieldset><legend>Connected accounts</legend>" +
          platforms
            .map((x) => check(x, "platform." + x, p.platforms.includes(x)))
            .join("") +
          "</fieldset>") +
      (p.platforms.some((x) => x !== "Instagram")
        ? pf("Listing URL *", "url", "url")
        : "") +
      '<label class="field">Post comment<textarea name="p.comment">' +
      esc(p.comment) +
      "</textarea></label>" +
      b("Copy comment", "copy", "link") +
      (p.platforms.includes("Facebook")
        ? pc("Include listing description on Facebook", "include")
        : "") +
      pc("Schedule for a future post", "schedule") +
      (p.schedule
        ? pf("Posting date and time *", "when", "datetime-local")
        : "") +
      '<div class="block">' +
      b(p.schedule ? "Schedule post" : "Post now", "post", "primary") +
      '</div><div role="status">' +
      p.results
        .map((x) => msg(esc(x), x.includes("failed") ? "error" : "info"))
        .join("") +
      "</div>",
  );
}
function adOptions() {
  const p = item();
  return (
    section(
      "Ad creative",
      '<div class="grid2">' +
        pf("Title *", "title") +
        field("Redirect URL *", "p.redirectAd", p.redirectAd ?? p.url, "url") +
        "</div>" +
        pf("Message *", "message"),
    ) +
    section(
      "Audience and schedule",
      '<div class="grid2">' +
        pf("Radius centerpoint *", "center") +
        pf(
          "Radius distance · 15–50 miles",
          "distance",
          "number",
          'min="15" max="50"',
        ) +
        pf(
          "Start date · within three months",
          "start",
          "date",
          'min="' + localDay() + '"',
        ) +
        pf("Duration · 3–90 days", "duration", "number", 'min="3" max="90"') +
        "</div>" +
        (db.mode !== "Normal"
          ? msg(
              "If approval comes after the start date, the ad starts on the approval date and runs for the full duration.",
            )
          : ""),
    ) +
    section(
      "Publishing page",
      ps("Post this ad from", "page", ["Xpressdocs", "My business page"]) +
        (p.page === "My business page"
          ? !p.account
            ? b("Connect Facebook account", "connectFB", "primary")
            : ps("Facebook business page", "business", [
                "Chucky Norris Realty",
                "Acme Properties",
              ]) +
              '<div class="line">Placement permission ' +
              badge(p.permission) +
              '</div><div class="row">' +
              (p.permission === "Pending"
                ? b("Check status", "permCheck", "secondary") +
                  b("Resend request", "requestPerm", "link")
                : p.permission === "Approved"
                  ? ""
                  : b(
                      p.permission === "Not requested"
                        ? "Request ad placement permission"
                        : "Reset request",
                      "requestPerm",
                      "secondary",
                    )) +
              (p.permission === "Rejected"
                ? b("Cancel placement", "cancelPlacement", "link")
                : "") +
              b("Remove account", "removeFB", "danger") +
              "</div>"
          : "<p>Xpressdocs will post on your behalf.</p>"),
    ) +
    section(
      "Ad preview",
      b(
        p.preview ? "Refresh preview" : "Generate preview",
        "adPreview",
        "secondary",
        "",
        "refresh",
      ) +
        (p.preview
          ? '<div class="email"><b>' +
            esc(p.page === "Xpressdocs" ? "Xpressdocs" : p.business) +
            "</b><small>Sponsored</small>" +
            proof(p, 5) +
            "<h3>" +
            esc(p.title) +
            "</h3><p>" +
            esc(p.message) +
            "</p>" +
            b("Open in new tab", "adTab", "link", "", "external") +
            "</div>"
          : ""),
    )
  );
}
screens.product = () => {
  const p = item(),
    err = issues(product);
  return (
    '<div class="crumb">' +
    b("Listing events", "exitEvents", "link") +
    ic("right") +
    b(esc(ev().street), "workspace", "link") +
    ic("right") +
    ' Customize</div><div class="pagehead"><div><h1>' +
    products[product] +
    "</h1><p>" +
    esc(ev().street) +
    " · " +
    types[ev().type] +
    "</p></div><small>" +
    ic("check") +
    ' <span id="save-status">Saved automatically</span></small></div>' +
    productNav() +
    '<div class="layout productlayout"><div>' +
    preview() +
    (db.internal
      ? section(
          "Internal order details",
          '<a href="#order" data-act="internalOrder">Order #APM-' +
            ev().id +
            "</a><p>Editor 4.8 · Acme Demonstration Site · " +
            esc(ev().office) +
            " · " +
            esc(ev().agent) +
            "</p>" +
            b(
              "Download production files",
              "production",
              "secondary",
              "",
              "download",
            ),
        )
      : "") +
    "</div><div>" +
    (product < 3
      ? printOptions()
      : product === 3
        ? social()
        : product === 4
          ? section("Download image", fileOptions())
          : adOptions()) +
    section(
      "Product summary",
      '<div class="line"><span>' +
        summaryOf(product) +
        "</span><strong>" +
        unitCost(price(p, product)) +
        "</strong></div>" +
        err.map((x) => msg(esc(x), "error")).join("") +
        (p.failed ? b("Retry save", "retrySave", "secondary") : "") +
        '<div class="block">' +
        b(
          returnView === "cart" ? "Return to cart" : "Done with product",
          "finishProduct",
          "primary",
        ) +
        "</div>" +
        (selected().length > 1
          ? b("Remove this product", "removeProduct", "danger")
          : ""),
    ) +
    "</div></div>"
  );
};
function leaveProduct(fn) {
  if (item().checked) {
    fn();
    return;
  }
  scanDestination = fn;
  modal(
    "Artwork check",
    msg("Scanning your artwork for errors…") + '<div class="skeleton"></div>',
    b("Skip scan", "scanDone", "secondary"),
  );
  modalTimer = setTimeout(scanResults, 700);
}
function scanResults() {
  modal(
    "Artwork check results",
    badge("Beta", "blue") +
      "<p>Review possible issues before continuing.</p>" +
      sides(product)
        .map(
          (s, i) =>
            '<div class="scanrow">' +
            proof(item(), product, i, true) +
            "<div><strong>" +
            s +
            "</strong><p>" +
            (i === 0
              ? "The price is formatted without a comma ($500000) and lists an invalid measurement of 0 SQ.FT."
              : "Placeholder contact information (“Name”, “Title”) appears in the upper-left corner.") +
            "</p></div></div>",
        )
        .join("") +
      '<div id="feedback">Were these scan results helpful? ' +
      b("Yes", "feedback", "link") +
      b("No", "feedback", "link") +
      "</div>",
    b("Go back and fix", "editor", "secondary") +
      b("Proceed anyway", "scanDone", "primary"),
    true,
  );
}
function editor() {
  if (!draft) draft = { ...item() };
  const p = draft;
  modal(
    "Edit " + products[product].toLowerCase(),
    '<div class="editorgrid"><div><div class="artbtn" role="group" aria-label="Editable artwork">' +
      proof(p, product, selectedSide)
        .replace(
          '<div class="art-photo"',
          '<div tabindex="0" role="button" aria-label="Select listing image" data-act="focusPhoto" class="art-photo"',
        )
        .replace(
          '<div class="art-copy">',
          '<div tabindex="0" role="button" aria-label="Select artwork text" data-act="focusHeadline" class="art-copy">',
        ) +
      '</div><div class="row">' +
      sides(product)
        .map((s, i) =>
          b(s, "editSide", selectedSide === i ? "secondary" : "link", i),
        )
        .join("") +
      "</div></div><div>" +
      field("Headline", "draft.headline", p.headline) +
      field("Contact name", "draft.contact", p.contact) +
      select("Image", "draft.photo", ["house", "interior"], p.photo) +
      field("Zoom", "draft.zoom", p.zoom, "range", 'min="100" max="160"') +
      field(
        "Horizontal position",
        "draft.pos",
        p.pos,
        "range",
        'min="0" max="100"',
      ) +
      "</div></div><details><summary>Editor help</summary>" +
      helpText() +
      "</details>",
    b("Close", "editorClose", "link") +
      b("Save design", "editorSave", "primary"),
    true,
  );
  panel = "editor";
}
function helpText() {
  return "<ol><li>Select the preview to edit its text.</li><li>Use Zoom to resize the photo.</li><li>Move Horizontal position to reposition it.</li><li>Choose Image to swap photographs.</li><li>Use the side buttons to switch pages.</li><li>Save design to review warnings and commit changes.</li></ol>";
}
function commitDesign() {
  Object.assign(item(), draft, {
    edited: true,
    checked: false,
    mergeError: false,
  });
  draft = null;
  save();
  closeDialog();
  render();
}
function templateModal() {
  const p = item(),
    names =
      templateStyle === "All styles"
        ? ["Parkside", "Heritage", "Horizon", "Gallery"]
        : templateStyle === "Classic"
          ? ["Parkside", "Heritage"]
          : ["Horizon", "Gallery"];
  modal(
    "Change template",
    select(
      "Style",
      "templateStyle",
      ["All styles", "Classic", "Modern"],
      templateStyle,
    ) +
      '<div class="templates">' +
      names
        .map((n) =>
          b(
            proof({ ...p, template: n }, product, 0, true) +
              "<strong>" +
              n +
              "</strong>" +
              (p.template === n ? " · Current" : ""),
            "pickTemplate",
            templatePick === n ? "chosen" : "",
            n,
          ),
        )
        .join("") +
      "</div>" +
      check(
        "Save as my default for " + types[ev().type],
        "defaultTemplate",
        templateDefault,
      ) +
      (p.edited
        ? msg(
            "Applying a new template replaces your design customizations.",
            "warn",
          )
        : ""),
    cancel() + b("Apply template", "applyTemplate", "primary"),
    true,
  );
}
let templateDefault = true;
function lists() {
  const p = item(),
    all = db.lists.filter(
      (x) =>
        x.name.toLowerCase().includes(listUI.query.toLowerCase()) &&
        (!listUI.only || p.lists.includes(x.id)),
    );
  listUI.page = Math.min(
    listUI.page,
    Math.max(0, Math.ceil(all.length / 5) - 1),
  );
  modal(
    "Manage mailing lists",
    field("Filter by name", "listSearch", listUI.query) +
      check("Show selected only", "listOnly", listUI.only, true) +
      '<div class="tablewrap"><table><thead><tr><th>Select</th><th>Name</th><th>Quantity</th><th>Created</th><th>Actions</th></tr></thead><tbody>' +
      all
        .slice(listUI.page * 5, listUI.page * 5 + 5)
        .map(
          (l) =>
            "<tr><td>" +
            check(
              '<span class="sr">Select ' + esc(l.name) + "</span>",
              "list." + l.id,
              p.lists.includes(l.id),
            ) +
            "</td><td>" +
            esc(l.name) +
            "</td><td>" +
            l.qty +
            "</td><td>" +
            esc(l.date) +
            "</td><td>" +
            ib("Edit " + l.name, "editList", "edit", l.id) +
            ib("Remove " + l.name, "deleteList", "trash", l.id) +
            "</td></tr>",
        )
        .join("") +
      '</tbody></table></div><div class="line">' +
      b("Previous", "listPage", "link", -1) +
      "Page " +
      (listUI.page + 1) +
      " of " +
      Math.max(1, Math.ceil(all.length / 5)) +
      b("Next", "listPage", "link", 1) +
      "</div>",
    b("Create a new mailing list", "newList", "secondary") +
      b("Done", "listDone", "primary"),
    true,
  );
}
function newList(kind = "Radius around an address") {
  const kinds = [
    "Upload a file",
    "Manual entry",
    "Radius around an address",
    "Street",
    "Demographics",
    "Saturation/EDDM",
    "CRM",
    "Neighborhoods",
    "New homeowners",
    "Property owners",
  ];
  formModal(
    "Create a mailing list",
    select("List type", "listKind", kinds, kind) +
      (kind === kinds[2]
        ? field(
            "List name *",
            "name",
            "Neighborhood radius",
            "text",
            "required",
          ) +
          field(
            "Center address *",
            "address",
            ev().street + ", " + ev().city,
            "text",
            'required pattern="[0-9]+ .+"',
          ) +
          '<div class="grid2">' +
          field(
            "Radius in miles *",
            "miles",
            2,
            "number",
            'min=".1" max="100" step=".1" required',
          ) +
          field(
            "Recipient count *",
            "qty",
            49,
            "number",
            'min="1" max="10000" required',
          ) +
          "</div>"
        : msg(
            "The " +
              esc(kind.toLowerCase()) +
              " setup is represented by this placeholder step.",
          )),
    (v) => {
      if (kind === kinds[2]) {
        const l = {
          ...v,
          qty: +v.qty,
          id: "L" + Date.now(),
          date: eventDate(localDay()),
        };
        db.lists.push(l);
        item().lists.push(l.id);
        save();
      }
      lists();
    },
    kind === kinds[2] ? "Create and select" : "Back to lists",
  );
  document.querySelector("dialog [name=listKind]").onchange = (e) =>
    newList(e.target.value);
}
function leaveCurrent(fn) {
  if (issues(product).length) {
    document
      .querySelector(".productlayout > div:last-child > :last-child")
      ?.scrollIntoView();
    return;
  }
  leaveProduct(fn);
}
Object.assign(actions, {
  exitEvents: () => leaveProduct(() => nav("events")),
  workspace: () => leaveProduct(() => nav("event")),
  switchProduct: (v) => {
    if (product !== +v) leaveProduct(() => openProduct(+v, returnView));
  },
  finishProduct: () => leaveCurrent(() => nav(returnView)),
  side: (v) => {
    selectedSide = +v;
    showAll = false;
    render();
  },
  allSides: () => {
    showAll = !showAll;
    render();
  },
  editor,
  editorHelp: () => modal("Design editor help", helpText()),
  editSide: (v) => {
    selectedSide = +v;
    editor();
  },
  focusPhoto: () => document.querySelector('[name="draft.photo"]').focus(),
  focusHeadline: () =>
    document.querySelector('[name="draft.headline"]').focus(),
  editorClose: () => {
    if (
      !draft ||
      ["headline", "contact", "photo", "zoom", "pos"].every(
        (k) => String(item()[k]) === String(draft[k]),
      )
    ) {
      draft = null;
      closeDialog();
      return;
    }
    modal(
      "Save your design changes?",
      msg("Your edits have not been applied."),
      b("Keep editing", "editor", "link") +
        b("Discard", "discardDraft", "secondary") +
        b("Save changes", "editorSave", "primary"),
    );
    panel = "editor-close";
  },
  discardDraft: () => {
    draft = null;
    closeDialog();
  },
  editorSave: () => {
    modal(
      "Review design warnings",
      msg("The quality of your image(s) is too low.", "warn") +
        msg("Your text has been cropped in the field field07.", "warn"),
      b("Return to editing", "editor", "secondary") +
        b("Save anyway", "mergeCheck", "primary"),
    );
    panel = "editor-save";
  },
  mergeCheck: () => {
    if (!draft.contact.trim() || item().mergeError) {
      modal(
        "Merge field error",
        msg("The contact name could not be merged.", "error"),
        b("Return to fix", "editor", "secondary") +
          b("Ignore and continue", "commitDesign", "primary"),
      );
      panel = "editor-save";
    } else commitDesign();
  },
  commitDesign,
  resetTemplate: () =>
    confirmAction(
      "Reset this design?",
      "Your edits will be lost and the listing data will be refreshed.",
      () => {
        const p = item(),
          base = config(ev(), product);
        for (const k of ["headline", "contact", "photo", "zoom", "pos"])
          p[k] = base[k];
        p.edited = false;
        p.checked = false;
        save();
        render();
      },
      "Reset template",
    ),
  templates: () => {
    templatePick = item().template;
    templateStyle = "All styles";
    templateDefault = true;
    templateModal();
  },
  pickTemplate: (v) => {
    templatePick = v;
    templateModal();
  },
  applyTemplate: () => {
    const p = item(),
      base = config(ev(), product);
    if (p.template !== templatePick || p.missing) {
      for (const k of ["headline", "contact", "photo", "zoom", "pos"])
        p[k] = base[k];
      p.edited = false;
      p.checked = false;
      p.template = templatePick;
      p.missing = false;
      if (templatePick === "Gallery") p.method = "Download";
      else if (templatePick !== "Heritage" && p.method === "Pickup")
        p.method = "Ship";
    }
    if (templateDefault)
      db.defaults[ev().agent + "-" + ev().type + "-" + product] = templatePick;
    save();
    closeDialog();
    render();
  },
  removeProduct: () =>
    confirmAction(
      "Remove " + products[product] + "?",
      "The product will be removed from this order.",
      () => {
        campaign().selected = selected().filter((i) => i !== product);
        save();
        nav(returnView);
      },
      "Remove product",
    ),
  scanDone: () => {
    item().checked = true;
    save();
    closeDialog();
    scanDestination?.();
  },
  feedback: () =>
    (document.querySelector("#feedback").textContent =
      "Thank you for your feedback."),
  lists,
  listDone: () => {
    closeDialog();
    render();
  },
  listPage: (v) => {
    listUI.page = Math.max(0, listUI.page + +v);
    lists();
  },
  newList: () => newList(),
  editList: (id) => {
    const l = db.lists.find((x) => x.id === id);
    formModal(
      "Edit mailing list",
      field("Name *", "name", l.name, "text", "required") +
        field("Recipients *", "qty", l.qty, "number", 'min="1" required'),
      (v) => {
        Object.assign(l, v, { qty: +v.qty });
        save();
        lists();
      },
    );
  },
  deleteList: (id) =>
    confirmAction(
      "Remove mailing list?",
      "This list will also be removed from saved mailing audiences.",
      () => {
        db.lists = db.lists.filter((l) => l.id !== id);
        save();
        lists();
      },
      "Remove list",
    ),
  fixAddress: () =>
    formModal(
      "Correct listing address",
      field(
        "Address 1 *",
        "street",
        ev().street,
        "text",
        'required pattern="[0-9]+ .+"',
      ) +
        field(
          "Postal code *",
          "zip",
          ev().zip,
          "text",
          'required pattern="[0-9]{5}"',
        ),
      (v) => {
        Object.assign(ev(), v);
        item().addressValid = true;
        save();
        closeDialog();
        render();
      },
    ),
  firstClass: () => {
    item().mailClass = "First Class";
    save();
    render();
  },
  rides: () =>
    modal(
      "Choose a ride-along image",
      '<div class="templates">' +
        Array.from({ length: 13 }, (_, i) =>
          b(
            rideImage(i) + "Option " + (i + 1),
            "ride",
            item().ride === i ? "chosen" : "",
            i,
          ),
        ).join("") +
        "</div>",
      "",
      true,
    ),
  ride: (v) => {
    item().ride = +v;
    save();
    closeDialog();
    render();
  },
  uspsHelp: () =>
    modal(
      "What is Informed Delivery?",
      "<p>USPS can show recipients a digital preview of your postcard in their daily mail email. A linked ride-along image lets them visit your listing.</p>",
    ),
  fileRetry: () => {
    const p = item();
    p.fileState = "Preparing";
    save();
    render();
    setTimeout(() => {
      p.fileState = "";
      save();
      render();
    }, 1000);
  },
  retrySave: () => {
    item().failed = false;
    save();
    render();
  },
  copy: async () => {
    try {
      await navigator.clipboard.writeText(item().comment);
      setNotice("Post comment copied.");
      render();
    } catch {
      modal(
        "Copy post comment",
        '<textarea aria-label="Comment to copy" readonly>' +
          esc(item().comment) +
          "</textarea>",
      );
      document.querySelector("dialog textarea").select();
    }
  },
  post: () => {
    const p = item();
    p.results = !p.platforms.length
      ? ["Post failed: choose at least one platform."]
      : p.platforms.some((x) => x !== "Instagram") && !validUrl(p.url)
        ? ["Post failed: enter a valid listing URL."]
        : p.schedule && (!p.when || new Date(p.when) <= new Date())
          ? ["Schedule failed: choose a date and time in the future."]
          : p.platforms.map((x) =>
              x === "Pinterest"
                ? "Pinterest failed: reconnect the expired account."
                : x +
                  " " +
                  (p.schedule
                    ? "scheduled for " + new Date(p.when).toLocaleString()
                    : "posted successfully") +
                  (x === "X" && p.comment.length > 280
                    ? " · Comment truncated to 280 characters."
                    : ""),
            );
    save();
    render();
  },
  cancelPlacement: () => {
    Object.assign(item(), { page: "Xpressdocs", permission: "Not requested" });
    save();
    render();
  },
  connectFB: () => {
    item().account = true;
    save();
    render();
  },
  requestPerm: () => {
    item().permission = "Pending";
    save();
    render();
  },
  permCheck: () => {
    modal("Checking placement permission", '<div class="skeleton"></div>');
    modalTimer = setTimeout(() => {
      modal(
        "Placement permission",
        msg("Choose a simulated response from Facebook."),
        ["Approved", "Rejected", "Timed out"]
          .map((v) => b(v, "permResult", "secondary", v))
          .join(""),
      );
    }, 550);
  },
  permResult: (v) => {
    item().permission = v;
    save();
    closeDialog();
    render();
  },
  removeFB: () =>
    confirmAction(
      "Remove Facebook account?",
      "You can reconnect the account and request permission again.",
      () => {
        Object.assign(item(), { account: false, permission: "Not requested" });
        save();
        render();
      },
      "Remove account",
    ),
  adPreview: () => {
    modal(
      "Generating ad preview",
      msg("Preview generation can take up to 15 seconds.") +
        '<div class="skeleton"></div>',
    );
    modalTimer = setTimeout(() => {
      item().preview = true;
      save();
      closeDialog();
      render();
    }, 750);
  },
  adTab: () => {
    const w = window.open("about:blank", "_blank");
    if (w) {
      w.opener = null;
      w.document.write(
        '<title>Facebook ad preview</title><base href="' +
          esc(location.href.split("#")[0]) +
          '"><link rel="stylesheet" href="style.css"><body class="apm-studio-jqv"><main><h1>' +
          esc(item().title) +
          "</h1>" +
          proof(item(), 5) +
          "<p>" +
          esc(item().message) +
          "</p></main>",
      );
      w.document.close();
    }
  },
  internalOrder: () =>
    modal(
      "Internal order #APM-" + ev().id,
      "<p>" + esc(ev().street) + " · " + esc(ev().agent) + "</p>",
    ),
  production: () => exportFile(product, 0, "PDF", false),
  downloadProof: () => exportFile(product, selectedSide, "PDF", true),
  downloadSide: (v) => exportFile(product, +v, item().format, false),
});
