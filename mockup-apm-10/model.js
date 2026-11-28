"use strict";
const products = [
  "Postcards",
  "Brochures",
  "Flyers",
  "Social Media",
  "Image Download",
  "Facebook Ad",
];
const types = [
  "New Listing",
  "Sold",
  "Open House",
  "Price Change",
  "New Neighbor",
];
const icons = {
  home: "f015",
  orders: "f016",
  chart: "f080",
  team: "f0c0",
  tools: "f0b1",
  sliders: "f1de",
  cart: "f07a",
  help: "f29c",
  user: "f2be",
  search: "f002",
  down: "f107",
  arrow: "f061",
  right: "f105",
  back: "f060",
  calendar: "f073",
  image: "f03e",
  check: "f00c",
  clock: "f017",
  flag: "f11d",
  list: "f03a",
  filter: "f0b0",
  sort: "f160",
  more: "f141",
  location: "f041",
  info: "f05a",
  close: "f00d",
  chat: "f0e6",
  layout: "f009",
  edit: "f040",
  trash: "f014",
  post: "f003",
  book: "f02d",
  file: "f0f6",
  social: "f1e0",
  ad: "f09a",
  download: "f019",
  external: "f08e",
  menu: "f0c9",
  save: "f0c7",
  warning: "f071",
  refresh: "f021",
  mail: "f0e0",
  plus: "f067",
  gear: "f013",
  layers: "f24d",
  tag: "f02b",
  brief: "f0b1",
  checkCircle: "f058",
  bell: "f0a2",
  phone: "f095",
};
const productIcons = ["post", "book", "file", "social", "image", "ad"];
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (x) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        x
      ],
  );
const ic = (k) =>
  '<i aria-hidden="true" class="icon">' +
  String.fromCharCode(parseInt(icons[k] || icons.file, 16)) +
  "</i>";
const addresses = [
  "1301 NE Loop 820",
  "1301 NE Loop 820",
  "6213 Obsidian Creek Drive",
  "4901 N Beach St",
  "4901 N Beach St",
  "2200 Lakeview Ct",
  "7601 River Park Drive",
  "412 Sagebrush Lane",
  "2800 Birchman Avenue",
  "912 Meadow Ridge",
  "615 Willow Way",
  "4451 Magnolia Drive",
];
const money = (n) => "$" + Number(n || 0).toFixed(2);
const localDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
function seed() {
  const events = Array.from({ length: 26 }, (_, i) => ({
    id: i + 1,
    street:
      addresses[i] ||
      1400 + i * 13 + " " + ["Oak", "Meadow", "Silver Creek"][i % 3] + " Lane",
    city: "Fort Worth",
    state: "TX",
    zip: i < 2 ? "76131" : "76137",
    agent: i > 23 ? "Jordan Lee" : "Chucky Norris",
    office: i > 23 ? "West Office" : "Chuck's Office",
    type: [0, 1, 1, 1, 2, 3, 4][i % 7],
    date:
      i === 0
        ? "2026-10-16"
        : i < 5
          ? "2026-10-12"
          : i === 5
            ? "2026-10-10"
            : "2026-10-" +
              String(Math.max(1, 10 - Math.floor(i / 3))).padStart(2, "0"),
    photo: i % 5 === 2 ? "interior" : "house",
    count: [12, 12, 8, 16, 16, 10][i % 6],
    carts: {},
    status:
      i === 23
        ? "Completed"
        : i === 3
          ? "Submitted for approval"
          : i === 0 || i === 5
            ? "In progress"
            : "Ready to start",
    description:
      "A bright Fort Worth home with generous living spaces. Enjoy a quiet neighborhood close to local shops.",
    price: i === 5 ? 499000 : 500000,
  }));
  return {
    events,
    active: 1,
    office: "Chuck's Office",
    agent: "Chucky Norris",
    mode: "Normal",
    internal: false,
    hidden: false,
    banner: true,
    connected: true,
    defaults: {},
    lists: Array.from({ length: 9 }, (_, i) => ({
      id: "list" + i,
      name: [
        "Past clients",
        "Fort Worth neighbors",
        "Fall buyers",
        "Open house guests",
        "Local investors",
        "Westside contacts",
        "Relocation clients",
        "Northside contacts",
        "Referral partners",
      ][i],
      qty: 12 + i * 4,
      date: "Oct 6, 2026",
    })),
    addresses: [
      {
        id: "home",
        name: "Chuck Norris",
        company: "Acme",
        phone: "555-0100",
        country: "United States",
        street: "123 Roundhouse Kick",
        suite: "",
        city: "Fort Worth",
        state: "TX",
        zip: "76180",
        business: false,
      },
    ],
    cards: [
      {
        id: "visa",
        name: "Chucky Norris",
        brand: "Visa",
        last: "1111",
        exp: "12/30",
        default: true,
      },
    ],
    sequence: 4820,
  };
}
let db;
try {
  db = JSON.parse(sessionStorage.getItem("apm-studio-v1"));
} catch {}
if (!db) db = seed();
function persist() {
  try {
    sessionStorage.setItem("apm-studio-v1", JSON.stringify(db));
  } catch {}
}
const ev = () => db.events.find((x) => x.id === db.active) || db.events[0];
function available(e, t = e.type) {
  return products
    .map((_, i) => i)
    .filter(
      (i) => (i !== 3 || db.connected) && (t !== 4 || [0, 2, 4].includes(i)),
    );
}
function offered(e) {
  return e.type === 4 ? [4] : [0, 1, 2, 3];
}
function config(e, i) {
  return {
    template: db.defaults[e.agent + "-" + e.type + "-" + i] || "Parkside",
    headline: types[e.type],
    contact: e.agent,
    photo: e.photo,
    method:
      db.defaults[e.agent + "-" + e.type + "-" + i] === "Gallery"
        ? "Download"
        : i === 1
          ? "Ship"
          : "Mail",
    qty: 49,
    radius: 49,
    useRadius: true,
    addressValid: true,
    lists: [],
    sample: i === 0,
    sampleName: "Chuck Norris",
    sampleAddr: "123 Roundhouse Kick, Fort Worth, TX 76180",
    mailClass: "First Class",
    paper: "Premium Cover Stock",
    coating: "None",
    pdf: i === 0,
    format: "JPG",
    informed: false,
    display: e.agent,
    ride: 0,
    redirectType: "Xpress Links",
    redirect: "https://example.com/chucky",
    url: "https://example.com/listing/" + e.id,
    comment: "Explore " + e.street + " in Fort Worth.",
    include: true,
    platforms: ["Facebook"],
    schedule: false,
    when: "",
    results: [],
    title: types[e.type] + " - " + e.street,
    message: e.description.split(".")[0] + ".",
    center: e.street + ", " + e.city + ", " + e.state + " " + e.zip,
    distance: 15,
    start: localDay(),
    duration: 7,
    page: "Xpressdocs",
    account: false,
    business: "Chucky Norris Realty",
    permission: "Not requested",
    edited: false,
    checked: false,
    preview: false,
    zoom: 100,
    pos: 50,
  };
}
function campaign(e = ev()) {
  if (!e) return null;
  if (!e.carts[e.type]) {
    const sample = e.id === 1 && e.type === 0;
    return {
      selected: sample
        ? [0, 1, 3, 4]
        : [0, 3, 4, 5].filter((i) => available(e).includes(i)),
      items: products.map((_, i) => config(e, i)),
      date: localDay(e.id === 5 ? -1 : 8),
      from: "10:00",
      to: "13:00",
      old: 525000,
      newPrice: 499000,
      allowPast: false,
      terms: false,
      ship: "home",
      service: "Ground",
      pay: "Saved card",
      card: (db.cards.find((c) => c.default) || {}).id,
      bill: "Acme Ad Budget",
      billRef: "",
      applied: false,
      split: {},
      promo: "",
      store: 0,
      voucher: false,
      budget: 0,
      copay: {},
      status: Object.keys(e.carts).length ? "Ready to start" : e.status,
    };
  }
  return e.carts[e.type];
}
function ensureCampaign(e = ev()) {
  if (e && !e.carts[e.type]) e.carts[e.type] = campaign(e);
  return campaign(e);
}
const selected = () =>
  campaign().selected.filter((i) => available(ev()).includes(i));
const ordered = () => selected().filter((i) => ![3, 4].includes(i));
const count = (p) =>
  p.method === "Mail"
    ? (p.useRadius ? Number(p.radius) : 0) +
      db.lists
        .filter((l) => p.lists.includes(l.id))
        .reduce((n, l) => n + l.qty, 0) +
      (p.sample ? 1 : 0)
    : p.method === "Download"
      ? 1
      : Number(p.qty);
const coatCost = (p) =>
  ({
    None: 0,
    "Gloss Coating": 0.05,
    "Matte Coating": 0.08,
    "Gloss Postal Protect": 0.12,
    "Soft Touch Postal Protect": 0.18,
  })[p.coating] || 0;
function charges(p, i) {
  if (i === 5)
    return [["Ad placement", p.duration * (3 + Number(p.distance) / 10)]];
  if (i >= 3) return [];
  if (p.method === "Download")
    return [[p.format + " design file", p.format === "PDF" ? 2.5 : 1.5]];
  const n = count(p);
  let rows = [
    [p.method + " · " + n + " pieces", n * [1.229, 2.9, 0.85][i]],
    [p.paper, p.paper === "Heavy Cover Stock" ? n * 0.15 : 0],
    [p.coating + " coating", n * coatCost(p)],
  ];
  if (p.method === "Mail") {
    rows.push([p.mailClass, p.mailClass === "Standard" ? -n * 0.12 : 0]);
    if (p.sample) rows.push(["Sample card (included in quantity)", 0]);
  }
  if (p.pdf) rows.push(["PDF download", 2.5]);
  return rows;
}
const price = (p, i) =>
  Math.round(charges(p, i).reduce((n, r) => n + r[1], 0) * 100) / 100;
const subtotal = () =>
  ordered().reduce((n, i) => n + price(campaign().items[i], i), 0);
const cost = (n) => (db.hidden ? "" : money(n));
const unitCost = (n) => (db.hidden ? "" : n ? money(n) : "Free");
function issues(i) {
  const p = campaign().items[i],
    a = [];
  if (p.missing)
    a.push("Template is no longer available. Please select a new template.");
  if (p.failed) a.push("There is an error saving item data. Please retry.");
  if (i < 3 && p.method === "Mail") {
    if (!p.addressValid && p.useRadius)
      a.push("Correct the listing address to create the radius list.");
    if (
      !(p.useRadius && p.radius > 0) &&
      !p.lists.some((id) => db.lists.some((l) => l.id === id))
    )
      a.push("Select at least one mailing list with recipients.");
    if (p.sample && (!p.sampleName.trim() || !p.sampleAddr.trim()))
      a.push("Enter a name and address for the sample card.");
    if (
      i === 0 &&
      p.informed &&
      (!p.display.trim() ||
        p.display.length > 36 ||
        (p.redirectType === "Custom URL" && !validUrl(p.redirect)))
    )
      a.push("Complete the Informed Delivery display name and redirect URL.");
  }
  if (
    i < 3 &&
    ["Ship", "Pickup"].includes(p.method) &&
    (!Number.isInteger(+p.qty) || p.qty < 1 || p.qty > 5000)
  )
    a.push("Sorry, we have no pricing policy for the selected quantity.");
  if (i === 5) {
    let last = new Date();
    last.setMonth(last.getMonth() + 3);
    if (
      !p.title.trim() ||
      !p.message.trim() ||
      !validUrl(p.redirectAd ?? p.url) ||
      !/^\d+\s+\S+/.test(p.center) ||
      p.distance < 15 ||
      p.distance > 50 ||
      !p.start ||
      p.start < localDay() ||
      new Date(p.start) > last ||
      p.duration < 3 ||
      p.duration > 90
    )
      a.push("Complete the ad fields using the ranges shown.");
    if (p.page === "My business page" && p.permission !== "Approved")
      a.push("Connect a business page and obtain placement permission.");
  }
  return a;
}
function validUrl(v) {
  try {
    return ["http:", "https:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
}
const eventDate = (v) =>
  new Date(v + "T12:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
