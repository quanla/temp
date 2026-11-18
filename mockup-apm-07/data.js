// Fictional data for the APM ordering prototype. Nothing here is real.

const USER = { name: "Riley Chen", role: "Admin", initials: "RC" };

const AGENT = {
  name: "Jordan Ellis",
  title: "REALTOR®",
  company: "Cedar Realty",
  phone: "(512) 555-0148",
  email: "jordan.ellis@cedarrealty.example",
};

const LISTINGS = [
  {
    id: "willow",
    street: "128 Willow Lane",
    city: "Austin, TX 78704",
    zip: "78704",
    event: "New Listing",
    date: "Oct 28, 2026",
    price: "$689,000",
    beds: 4,
    baths: 3,
    sqft: "2,340",
    blurb: "A light-filled Bouldin Creek craftsman on a quiet, tree-lined street. Open kitchen, vaulted living room, and a shaded backyard patio five minutes from South Congress.",
    features: ["Updated chef's kitchen", "Primary suite with walk-in closet", "Covered backyard patio", "Two-car garage"],
    url: "https://cedarrealty.example/listings/128 willow-lane",
  },
  {
    id: "ramble",
    street: "4410 Ramble Ridge Dr",
    city: "Austin, TX 78745",
    zip: "78745",
    event: "Open House",
    date: "Nov 8, 2026",
    price: "$512,000",
    beds: 3,
    baths: 2,
    sqft: "1,860",
    blurb: "Single-story ranch with a refreshed kitchen and a big, flat backyard near Garrison Park.",
    features: ["Single story", "New roof (2025)", "Large flat yard", "Walk to Garrison Park"],
    url: "https://cedarrealty.example/listings/4410-ramble-ridge",
  },
  {
    id: "bluebonnet",
    street: "902 Bluebonnet Ct",
    city: "Round Rock, TX 78664",
    zip: "78664",
    event: "Just Sold",
    date: "Oct 19, 2026",
    price: "$438,500",
    beds: 3,
    baths: 2,
    sqft: "1,710",
    blurb: "Sold in six days with multiple offers. Thinking of selling? Let's talk.",
    features: ["Sold in 6 days", "Multiple offers", "Over asking price", "Cul-de-sac lot"],
    url: "https://cedarrealty.example/listings/902-bluebonnet",
  },
];

// Print products have a full workflow here. Digital ones are catalog entries only.
const PRODUCTS = {
  flyers: {
    name: "Flyers",
    size: "8.5 × 11 in",
    sides: ["Front", "Back"],
    from: "From $0.21 each",
    tiers: { 50: 0.38, 100: 0.32, 250: 0.26, 500: 0.21 },
    mail: { standard: 0.48, first: 0.62 },
    defaultTemplate: "classic",
    papers: [
      { id: "gloss100", name: "100 lb Gloss Text", note: "Vivid photos", add: 0 },
      { id: "matte80", name: "80 lb Matte Text", note: "Easy to write on", add: 0 },
      { id: "card14", name: "14 pt Cardstock", unavailable: "Not offered at 8.5 × 11 in. Choose a text weight." },
    ],
  },
  brochures: {
    name: "Brochures",
    size: "11 × 17 in, folds to 8.5 × 11",
    sides: ["Outside", "Inside"],
    from: "From $0.38 each",
    tiers: { 50: 0.7, 100: 0.58, 250: 0.46, 500: 0.38 },
    mail: { standard: 0.52, first: 0.68 },
    defaultTemplate: "classic",
    papers: [
      { id: "gloss100", name: "100 lb Gloss Text", note: "Vivid photos", add: 0 },
      { id: "silk100", name: "100 lb Silk Text", note: "Soft, low glare", add: 0.04 },
      { id: "card14", name: "14 pt Cardstock", unavailable: "Too thick to fold. Choose a text weight." },
    ],
  },
  postcards: {
    name: "Postcards",
    size: "6 × 9 in",
    sides: ["Front", "Back"],
    from: "From $0.42 mailed",
    tiers: { 50: 0.3, 100: 0.26, 250: 0.21, 500: 0.17 },
    mail: { standard: 0.42, first: 0.55 },
    defaultTemplate: "classic",
    papers: [
      { id: "card14", name: "14 pt Gloss Cardstock", note: "Standard postcard stock", add: 0 },
      { id: "card16", name: "16 pt Matte Cardstock", note: "Heavier, premium feel", add: 0.03 },
    ],
  },
};

const PRINT_ORDER = ["flyers", "brochures", "postcards"];

const DIGITAL = [
  { id: "social", name: "Social Media", desc: "Post images for Instagram and Facebook", price: "Free" },
  { id: "imagedl", name: "Image Download", desc: "High-resolution listing graphics", price: "Free" },
  { id: "fbad", name: "Facebook Ad", desc: "Sponsored ad around the listing", price: "From $25" },
];

const TEMPLATES = [
  { id: "classic", name: "Classic Split", note: "Large photo, details below", accent: "#1f3a4d" },
  { id: "bleed", name: "Full Bleed", note: "Photo fills the page", accent: "#2b2b2b" },
  { id: "grid", name: "Photo Grid", note: "Four photos, compact text", accent: "#3d5a40" },
  { id: "openhouse", name: "Open House", note: "Date banner for events", accent: "#7a3b2e" },
];

const PDF_ADDON = 5;
const SAMPLE_PRICE = 1;
const TAX_RATE = 0.0825;
const SHIPPING = {
  ground: { name: "Ground", note: "3–5 business days", price: 9 },
  twoday: { name: "2-Day", note: "2 business days", price: 18 },
};
const MAIL_CLASSES = {
  standard: { name: "Standard", note: "5–15 business days" },
  first: { name: "First Class", note: "3–5 business days" },
};
const QTY_OPTIONS = [50, 100, 250, 500];

const ADDRESSES = {
  office: { label: "Cedar Realty office", lines: ["Jordan Ellis, Cedar Realty", "500 W 2nd St, Suite 300", "Austin, TX 78701"] },
  home: { label: "Jordan Ellis (home)", lines: ["Jordan Ellis", "2207 Kinney Ave", "Austin, TX 78704"] },
};

const PICKUP_LOCATIONS = {
  south: { name: "Austin South Print Center", addr: "2100 S Lamar Blvd", ready: "Ready Wed, Nov 4 after 2 PM" },
  downtown: { name: "Downtown Print Center", addr: "310 Congress Ave", ready: "Ready Thu, Nov 5 after 10 AM" },
};

const SAVED_LISTS = [
  { id: "past", name: "Austin Past Clients", count: 100, created: "Aug 14, 2026", source: "Upload" },
  { id: "zilker", name: "Zilker Sphere of Influence", count: 240, created: "Jun 2, 2026", source: "CRM Import" },
  { id: "ohv", name: "Open House Visitors – Oct", count: 37, created: "Oct 12, 2026", source: "Upload" },
];

const CREDITS = {
  promo: { code: "WILLOW10", amount: 10 },
  store: { balance: 45 },
  ad: { balance: 150 },
};

const CARDS = [
  { id: "visa", label: "Visa ending 4242", exp: "08/28" },
  { id: "mc", label: "Mastercard ending 8810", exp: "02/27" },
];

const CORP = {
  name: "Cedar Realty – Marketing",
  acct: "••4471",
  approver: "Dana Whitfield",
  approverRole: "Marketing Manager",
  costCenters: ["CR-210 · Austin South Office", "CR-305 · Listing Marketing", "CR-410 · Brand & Events"],
};

const LIST_SOURCES = [
  { id: "radius", name: "Radius", desc: "Nearest homes around an address", rec: true },
  { id: "upload", name: "Upload", desc: "CSV or Excel file of addresses" },
  { id: "street", name: "Street", desc: "Every address on chosen streets" },
  { id: "demo", name: "Demographics", desc: "Filter an area by household traits" },
  { id: "crm", name: "CRM Import", desc: "Pull contacts from a connected CRM" },
];
