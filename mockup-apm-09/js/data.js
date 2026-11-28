/* Sample data and pricing rules. Everything here is fake. */
/* The mockup runs on a fixed "today" so dates in the brief (October 2026) always make sense. */
const TODAY = new Date(2026, 9, 19);
const PHONE = '(866) 977-3627';
const COMPANY = 'Acme Demonstration Site';

const TYPES = {
  new: { label: 'New Listing', headline: 'Just Listed' },
  sold: { label: 'Sold', headline: 'Just Sold' },
  open: { label: 'Open House', headline: 'Open House' },
  price: { label: 'Price Change', headline: 'New Price' },
  neighbor: { label: 'New Neighbor', headline: 'Hello, Neighbor' },
};
/* Event types the agent has templates for. New Neighbor only exists on events created as New Neighbor. */
const OFFERED_TYPES = ['new', 'sold', 'open', 'price'];

const PRODUCTS = {
  postcard: { label: 'Postcards', one: 'postcard', icon: 'fa-envelope-open-text', print: true, sides: ['Front', 'Back'], methods: ['mail', 'ship', 'download'], w: 600, h: 400 },
  brochure: { label: 'Brochures', one: 'brochure', icon: 'fa-book-open', print: true, sides: ['Cover', 'Inside left', 'Inside right', 'Back'], methods: ['ship', 'mail', 'download'], w: 400, h: 520, tall: true },
  flyer: { label: 'Flyers', one: 'flyer', icon: 'fa-file-lines', print: true, sides: ['Front'], methods: ['ship', 'pickup', 'download'], w: 400, h: 520, tall: true },
  social: { label: 'Social Media', one: 'social post', icon: 'fa-share-nodes', free: true, sides: ['Post'], w: 500, h: 500, tall: true },
  image: { label: 'Image Download', one: 'image', icon: 'fa-image', free: true, sides: ['Square', 'Story'], w: 500, h: 500, tall: true },
  fbad: { label: 'Facebook Ad', one: 'Facebook ad', icon: 'fa-bullhorn', sides: ['Ad image'], w: 600, h: 314 },
};
const PKEYS = Object.keys(PRODUCTS);
const DEFAULT_ON = ['postcard', 'social', 'image', 'fbad'];
/* Which products the agent has a template for, per event type. */
const HAS_TEMPLATE = {
  new: PKEYS, sold: PKEYS, open: ['postcard', 'flyer', 'social', 'image', 'fbad'],
  price: ['postcard', 'social', 'image', 'fbad'], neighbor: ['postcard', 'social', 'image'],
};

const METHODS = {
  mail: { label: 'Mail', icon: 'fa-envelope', desc: 'We print, address and mail each piece.' },
  ship: { label: 'Ship', icon: 'fa-truck', desc: 'We print and ship the box to you.' },
  pickup: { label: 'Pickup', icon: 'fa-store', desc: 'Collect from the Fort Worth print center.' },
  download: { label: 'Download', icon: 'fa-download', desc: 'Get the print-ready file only.' },
};
const CLASSES = {
  first: { label: 'First Class', days: [3, 5], per: 0.18 },
  standard: { label: 'Standard', days: [5, 15], per: 0 },
};
const PAPERS = [
  { id: 'premium', label: 'Premium Cover Stock', per: 0 },
  { id: 'heavy', label: 'Heavy Cover Stock, 16 pt', per: 0.05 },
  { id: 'recycled', label: 'Recycled Cover Stock', per: 0.03 },
];
const COATINGS = [
  { id: 'none', label: 'None', per: 0 },
  { id: 'gloss', label: 'Gloss Coating', per: 0.04 },
  { id: 'matte', label: 'Matte Coating', per: 0.04 },
  { id: 'glosspp', label: 'Gloss Postal Protect', per: 0.06 },
  { id: 'softpp', label: 'Soft Touch Postal Protect', per: 0.09 },
];
/* Base price per piece. Mail uses the Standard rate; First Class adds CLASSES.first.per. */
const RATES = {
  postcard: { mail: 1.049, ship: 0.58, pickup: 0.58, download: 4.95 },
  brochure: { mail: 3.10, ship: 2.90, pickup: 2.90, download: 6.95 },
  flyer: { mail: 1.40, ship: 0.62, pickup: 0.62, download: 0 },
};
const QTY_RANGE = [25, 5000];
const PDF_ADDON = 2.5;
const FB_PER_DAY = 6;
const FB_MIN_DAYS = 5;
const TAX_RATE = 0.0825;
const SERVICES = [
  { id: 'ground', label: 'Ground', days: 5, price: 12.4 },
  { id: 'twoday', label: '2nd Day Air', days: 2, price: 24.85 },
  { id: 'next', label: 'Next Day Air', days: 1, price: 41.3 },
];
const PROMOS = { ACME10: 0.1 };
const CREDITS = { store: 40, adBudget: 120, voucher: { id: 'v1', label: 'Welcome voucher', amount: 15 } };
const ACCOUNTS = [
  { id: 'adb', label: 'Acme Ad Budget', fields: ['Cost center', 'Campaign code'] },
  { id: 'bill', label: 'ACME Billing', fields: ['PO number'] },
];
const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook', on: true },
  { id: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram', on: true },
  { id: 'x', label: 'X', icon: 'fa-brands fa-x-twitter', on: true },
  { id: 'linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin', on: true },
  { id: 'pinterest', label: 'Pinterest', icon: 'fa-brands fa-pinterest', on: false },
];
const STYLES = {
  Modern: ['Skyline', 'Clean Edge', 'Horizon', 'Slate', 'Open Plan', 'Daylight'],
  Classic: ['Heritage', 'Brownstone', 'Parkside', 'Ivy', 'Courtyard', 'Gable'],
  Luxury: ['Penthouse', 'Marble', 'Estate', 'Gilded', 'Terrace', 'Vista'],
  Bold: ['Headline', 'Spotlight', 'Billboard', 'Pop', 'Marquee', 'Signal'],
};
const STYLE_HUES = { Modern: 208, Classic: 150, Luxury: 32, Bold: 348 };
const LIST_TYPES = [
  ['radius', 'Radius around an address', 'fa-bullseye'], ['upload', 'Upload a file', 'fa-file-arrow-up'], ['manual', 'Manual entry', 'fa-keyboard'],
  ['street', 'Street', 'fa-road'], ['demo', 'Demographics', 'fa-people-group'], ['eddm', 'Saturation/EDDM', 'fa-map'],
  ['crm', 'CRM', 'fa-address-book'], ['hood', 'Neighborhoods', 'fa-tree-city'], ['newowner', 'New homeowners', 'fa-key'], ['owner', 'Property owners', 'fa-house-user'],
];
const HELP_ITEMS = [
  ['fa-arrow-pointer', 'Select', 'Click any text or image on the canvas to select it. Its field is highlighted in the form on the left.'],
  ['fa-up-right-and-down-left-from-center', 'Resize and zoom', 'Drag a corner handle to resize. Use the zoom control under the canvas to look closer.'],
  ['fa-arrows-up-down-left-right', 'Reposition', 'Drag a selected item to move it. Guides appear when it lines up with other items.'],
  ['fa-images', 'Swap an image', 'Select an image, then pick another listing photo from the Images tab.'],
  ['fa-clone', 'Switch sides', 'Use the side buttons in the top bar to move between the sides of the design.'],
  ['fa-floppy-disk', 'Save', 'Save keeps your changes and updates the preview. Close asks first if anything is unsaved.'],
];
const SCAN_HELP = 'Artwork check is in beta. It may miss problems or flag things that are fine.';

function seedEvents() {
  const base = [
    ['e1', '1301 NE Loop 820', 'Fort Worth, TX 76131', 'new', '2026-10-16', 'progress', 500000, 1, 1, 0, 12],
    ['e2', '1301 NE Loop 820', 'Fort Worth, TX 76131', 'sold', '2026-10-12', 'new', 500000, 1, 1, 0, 12],
    ['e3', '6213 Obsidian Creek Drive', 'Fort Worth, TX 76179', 'sold', '2026-10-12', 'new', 389000, 4, 3, 2410, 24],
    ['e4', '4901 N Beach St', 'Fort Worth, TX 76137', 'sold', '2026-10-12', 'submitted', 315000, 3, 2, 1680, 18],
    ['e5', '4901 N Beach St', 'Fort Worth, TX 76137', 'open', '2026-10-12', 'new', 315000, 3, 2, 1680, 18],
    ['e6', '2200 Lakeview Ct', 'Fort Worth, TX 76135', 'price', '2026-10-10', 'new', 499000, 4, 3, 2890, 31],
    ['e7', '818 Magnolia Ave', 'Fort Worth, TX 76104', 'open', '2026-10-09', 'new', 442000, 3, 2, 1925, 22],
    ['e8', '77 Sundance Square', 'Fort Worth, TX 76102', 'neighbor', '2026-10-08', 'new', 610000, 2, 2, 1450, 9],
  ];
  const more = ['3406 Camp Bowie Blvd', '1529 Elizabeth Blvd', '5116 Byers Ave', '2917 Hartwood Dr', '6500 Trail Lake Dr', '4208 Ridgehaven Rd', '912 W Magnolia Ave', '3817 Bellaire Dr S',
    '1104 Mistletoe Dr', '7400 Oakmont Blvd', '2305 Colonial Pkwy', '5933 Westover Dr', '608 Arch Adams St', '3200 Riverfront Dr', '1900 Forest Park Blvd', '4821 Overton Woods Dr',
    '2600 Museum Way', '8025 Marble Canyon Ct'];
  const types = ['new', 'sold', 'new', 'price', 'open', 'new', 'sold'];
  const zips = ['76107', '76110', '76109', '76132', '76116'];
  const evs = base.map(([id, a1, city, type, created, status, price, beds, baths, sqft, photos], i) => ({
    id, a1, city, type, created, status, price, beds, baths, sqft, photos, hue: (i * 47 + 200) % 360, agent: 'Chucky Norris', office: "Chuck's Office",
  }));
  more.forEach((a1, i) => {
    const d = new Date(2026, 9, 8 - i);
    evs.push({
      id: 'e' + (9 + i), a1, city: 'Fort Worth, TX ' + zips[i % 5], type: types[i % 7], created: iso(d), status: i === 3 ? 'progress' : 'new',
      price: 265000 + i * 23500, beds: 2 + (i % 4), baths: 1 + (i % 3), sqft: 1200 + i * 140, photos: 6 + ((i * 5) % 28), hue: (i * 61 + 20) % 360,
      agent: 'Chucky Norris', office: "Chuck's Office",
    });
  });
  /* Completed events */
  evs.push({ id: 'd1', a1: '6213 Obsidian Creek Drive', city: 'Fort Worth, TX 76179', type: 'new', created: '2026-09-21', status: 'done', price: 389000, beds: 4, baths: 3, sqft: 2410, photos: 24, hue: 294, agent: 'Chucky Norris', office: "Chuck's Office", cartNo: '48213377', total: 118.4 });
  evs.push({ id: 'd2', a1: '2200 Lakeview Ct', city: 'Fort Worth, TX 76135', type: 'new', created: '2026-09-02', status: 'done', price: 525000, beds: 4, baths: 3, sqft: 2890, photos: 31, hue: 75, agent: 'Chucky Norris', office: "Chuck's Office", cartNo: '48209114', total: 74.2 });
  /* Other agents, visible to an admin through "Select office and user" */
  [['Dana Whitfield', "Chuck's Office", '415 Pecan St', 'new'], ['Dana Whitfield', "Chuck's Office", '2709 Stadium Dr', 'sold'], ['Dana Whitfield', "Chuck's Office", '1001 Bluebonnet Cir', 'open'],
    ['Luis Ortega', 'Downtown Office', '300 Throckmorton St', 'new'], ['Luis Ortega', 'Downtown Office', '1212 Main St', 'price']].forEach(([agent, office, a1, type], i) => {
    evs.push({ id: 'o' + i, a1, city: 'Fort Worth, TX 76102', type, created: iso(new Date(2026, 9, 15 - i)), status: 'new', price: 300000 + i * 41000, beds: 3, baths: 2, sqft: 1700 + i * 90, photos: 10 + i, hue: (i * 83 + 130) % 360, agent, office });
  });
  evs.forEach((e) => {
    e.url = 'https://acme-realty.example/listing/' + e.a1.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    e.desc = 'Bright, move-in ready home minutes from downtown Fort Worth. Updated kitchen, covered patio and a fenced yard with mature trees.';
    if (e.type === 'open') e.oh = { date: e.id === 'e5' ? '2026-10-18' : '2026-10-31', start: '13:00', end: '16:00' };
    if (e.type === 'price') e.pc = { old: e.id === 'e6' ? 525000 : e.price + 20000, now: e.price };
  });
  return evs;
}
const OFFICES = { "Chuck's Office": ['Chucky Norris', 'Dana Whitfield'], 'Downtown Office': ['Luis Ortega'] };

function seedLists() {
  const names = ['Farm area - Fossil Creek', 'Past clients 2025', 'Sphere of influence', 'Summerfields neighborhood', 'Open house sign-ins', 'Investors - Tarrant County',
    'North Beach renters', 'Holiday card list', 'Park Glen owners', 'Just moved in - 76131', 'Heritage HOA', 'Expired listings Q3', 'Lakeview Ct neighbors', 'Broker referrals'];
  return names.map((name, i) => ({ id: 'l' + (i + 1), name, qty: 40 + ((i * 37) % 260), created: iso(new Date(2026, 8 - (i % 6), 3 + i)) }));
}
function seedAddresses() {
  return [
    { id: 'a1', name: 'Chucky Norris', company: "Chuck's Office", phone: '(817) 555-0142', country: 'United States', a1: '500 Main St', a2: 'Suite 210', city: 'Fort Worth', st: 'TX', zip: '76102', biz: true },
    { id: 'a2', name: 'Chucky Norris', company: '', phone: '(817) 555-0142', country: 'United States', a1: '123 Roundhouse Kick', a2: '', city: 'Fort Worth', st: 'TX', zip: '76180', biz: false },
  ];
}
function seedCards() {
  return [
    { id: 'c1', brand: 'Visa', last4: '1111', name: 'Chucky Norris', exp: '08/28', def: true },
    { id: 'c2', brand: 'Mastercard', last4: '4444', name: 'Chucky Norris', exp: '03/27', def: false },
  ];
}
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
