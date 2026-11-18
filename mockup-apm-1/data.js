// Fictional data and pricing for the APM mockup. Every number here is illustrative.

const TODAY = "Oct 30, 2026";

const LISTINGS = [
    {
        id: "willow",
        street: "128 Willow Lane",
        city: "Austin, TX 78704",
        event: "New Listing",
        date: "Nov 2, 2026",
        note: "Open house Sat, Nov 7 · 1–4 PM",
        price: 689000,
        beds: 3,
        baths: 2.5,
        sqft: 2140,
        lot: "0.21 ac",
        built: "1948 · renovated 2023",
        mls: "MLS #5531207",
        photo: "exterior",
        url: "https://cedarrealty.example/listings/128-willow",
    },
    {
        id: "ridge",
        street: "4410 Ridgeview Drive",
        city: "Austin, TX 78731",
        event: "Open House",
        date: "Nov 14, 2026",
        note: "Sat, Nov 14 · 12–3 PM",
        price: 1145000,
        beds: 4,
        baths: 3.5,
        sqft: 3380,
        lot: "0.34 ac",
        built: "2004",
        mls: "MLS #5529884",
        photo: "backyard",
        url: "https://cedarrealty.example/listings/4410-ridgeview",
    },
    {
        id: "barton",
        street: "77 Barton Hills Ct, Unit 12",
        city: "Austin, TX 78704",
        event: "Just Sold",
        date: "Oct 20, 2026",
        note: "Closed in 9 days",
        price: 415000,
        beds: 2,
        baths: 2,
        sqft: 1180,
        lot: "—",
        built: "1984",
        mls: "MLS #5517320",
        photo: "kitchen",
        url: "https://cedarrealty.example/listings/77-barton-hills",
    },
];

const AGENT = {
    name: "Jordan Ellis",
    title: "REALTOR® · Cedar Realty",
    phone: "(512) 555-0148",
    email: "jordan@cedarrealty.example",
    license: "TX Lic. #0712345",
    office: { name: "Jordan Ellis", company: "Cedar Realty", street1: "2200 S Lamar Blvd", street2: "Suite 300", city: "Austin", state: "TX", zip: "78704" },
};

const USER = { name: "Riley Chen", role: "Marketing Coordinator", initials: "RC" };

const CAT = {
    postcards: { name: "Postcards", blurb: "6×9 mailers for Just Listed, Open House, and Just Sold.", from: "from $0.29 / piece", print: true, layout: "postcard" },
    brochures: { name: "Brochures", blurb: "Letter tri-fold with room for the full story.", from: "from $0.72 / piece", print: true, layout: "tri" },
    flyers: { name: "Flyers", blurb: "8.5×11 sheet for showings and open houses.", from: "from $0.38 / piece", print: true, layout: "flyer" },
    social: { name: "Social Media", blurb: "Square and story posts sized for Instagram and Facebook.", free: true },
    images: { name: "Image Download", blurb: "High-res listing graphics for email and web.", free: true },
    fbad: { name: "Facebook Ad", blurb: "Promoted listing ad with your own budget.", from: "Budget set during ad setup" },
};
const CAT_ORDER = ["postcards", "brochures", "flyers", "social", "images", "fbad"];

const TEMPLATES = [
    { id: "modern", name: "Modern", note: "Clean, photo-forward" },
    { id: "classic", name: "Classic", note: "Serif, framed photos" },
    { id: "bold", name: "Bold", note: "Dark, high contrast" },
];

const PAPERS = {
    flyers: [
        { id: "gloss", name: "Gloss text 100#", note: "Bright photos, lightweight", price: 0.38 },
        { id: "matte", name: "Matte cover 80#", note: "Sturdier, no glare", price: 0.46 },
        { id: "linen", name: "Linen cover 100#", note: "Textured premium stock", price: null, why: "Only available for 250+ copies. Pick another paper or raise the quantity." },
    ],
    brochures: [
        { id: "gloss", name: "Gloss text 100#", note: "Folds cleanly, vivid color", price: 0.72 },
        { id: "silk", name: "Silk cover 80#", note: "Soft sheen, premium feel", price: 0.85 },
        { id: "recycled", name: "Recycled matte 80#", note: "100% post-consumer fiber", price: null, why: "Pricing is temporarily unavailable. Pick another paper; we'll email you when it's back." },
    ],
    postcards: [
        { id: "gloss", name: "Gloss 14pt", note: "Postal-ready thickness", price: 0.29 },
        { id: "matte", name: "Matte 16pt", note: "Thicker, writable back", price: 0.36 },
    ],
};

// Linen unlocks at 250 copies — shows that an option can become available.
function paperPrice(key, paperId, qty) {
    const paper = PAPERS[key].find((p) => p.id === paperId);
    if (!paper) return null;
    if (paper.id === "linen" && qty >= 250) return 0.58;
    return paper.price;
}

const MAIL_CLASSES = [
    { id: "first", name: "First Class", days: "3–5 business days", price: 0.61 },
    { id: "standard", name: "Standard", days: "5–15 business days", price: 0.29 },
];

const PICKUP_LOCATIONS = [
    { id: "soco", name: "Cedar Print Partners — South Congress", addr: "1611 S Congress Ave, Austin", ready: "Ready Wed, Nov 4 after 10 AM" },
    { id: "dt", name: "Cedar Realty — Downtown office", addr: "401 Congress Ave, Suite 1500, Austin", ready: "Ready Thu, Nov 5 after 2 PM" },
];

const PDF_ADDON = 4.99;
const TAX_RATE = 0.0825;
const shipCost = (qty) => (qty > 250 ? 14 : 9);

const PROMOS = { LISTED10: { amount: 10, label: "LISTED10 · $10 off new-listing orders" } };
const STORE_CREDIT_BALANCE = 45;
const AD_BUDGET_BALANCE = 150;

const BILLING_ACCOUNTS = [
    { id: "austin", name: "Cedar Realty · Austin Marketing", note: "Approver: Dana Whitfield, Marketing Manager", needsCostCenter: true },
    { id: "agentdev", name: "Cedar Realty · Agent Development Fund", note: "Approver: Sam Ortiz, Broker", needsCostCenter: false },
];
const COST_CENTERS = ["4100 · Listing Marketing", "4200 · Brand & Events", "4300 · Recruiting"];

const SEED_CARDS = [
    { id: "visa", brand: "Visa", last4: "4242", exp: "08/28", holder: "Jordan Ellis" },
    { id: "amex", brand: "Amex", last4: "1005", exp: "02/27", holder: "Cedar Realty" },
];

const SEED_LISTS = [
    { id: "sphere", name: "Willow Lane sphere — past clients & neighbors", count: 100, created: "Sep 14, 2026", source: "Upload" },
    { id: "signins", name: "Zilker open-house sign-ins", count: 38, created: "Aug 2, 2026", source: "CRM Import" },
    { id: "farm", name: "Bouldin Creek farm area", count: 420, created: "Jun 21, 2026", source: "Street" },
];

const LIST_METHODS = [
    { id: "upload", name: "Upload", icon: "upload", note: "CSV or Excel of names and addresses" },
    { id: "radius", name: "Radius", icon: "radius", note: "Nearest homes around an address" },
    { id: "street", name: "Street", icon: "street", note: "Every address on chosen streets" },
    { id: "demo", name: "Demographics", icon: "chart", note: "Filter an area by household traits" },
    { id: "crm", name: "CRM Import", icon: "users", note: "Pull a saved contact group" },
];

const NEARBY_STREETS = ["Willow Ln", "S 1st St", "Bouldin Ave", "W Mary St", "Kinney Ave", "W Johanna St", "Eva St", "W Monroe St"];

function radiusResults(qty, type) {
    const r = rng(hashStr(`res${type}`));
    return Array.from({ length: Math.min(qty, 6) }, (_, i) => {
        const street = NEARBY_STREETS[Math.floor(r() * NEARBY_STREETS.length)];
        const num = 100 + Math.floor(r() * 90) * 2 + (i % 2);
        const multi = type === "multi" || (type === "both" && i % 4 === 0);
        return { addr: `${num} ${street}${multi ? `, Unit ${1 + Math.floor(r() * 6)}` : ""}`, kind: multi ? "Multi-family" : "Single-family", dist: (0.05 + r() * 0.3).toFixed(2) };
    });
}
