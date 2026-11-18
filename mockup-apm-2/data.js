// Fictional data for the APM ordering prototype. Nothing here maps to real people, listings or prices.
window.DATA = (() => {
  const agent = {
    name: 'Jordan Ellis',
    title: 'REALTOR®',
    brokerage: 'Cedar Realty',
    phone: '(512) 555-0148',
    email: 'jordan@cedarrealty.example',
    license: 'TX Lic. #0712345',
    office: {
      name: 'Jordan Ellis',
      company: 'Cedar Realty',
      street1: '1800 S Lamar Blvd',
      street2: 'Suite 210',
      city: 'Austin',
      state: 'TX',
      zip: '78704',
    },
  };

  const listings = [
    {
      id: 'willow',
      street: '128 Willow Lane',
      city: 'Austin',
      state: 'TX',
      zip: '78704',
      event: 'New Listing',
      eventDate: 'Sat, Nov 8, 2026',
      eventNote: 'Goes live Saturday',
      price: 849000,
      beds: 4,
      baths: 3,
      sqft: 2460,
      lot: '0.21 ac',
      url: 'https://cedarrealty.example/listings/128-willow-lane',
      tagline: 'Light-filled modern craftsman near Zilker Park',
      blurb: 'Four bedrooms, a chef’s kitchen with a quartz island and a shaded back deck under mature pecans — on a quiet, tree-lined street minutes from South Congress.',
      highlights: ['Chef’s kitchen with quartz island', 'Primary suite on the main level', 'Shaded deck under mature pecans', '8 minutes to Zilker Park'],
      palette: { siding: '#E7E2D8', roof: '#363B40', trim: '#FFFFFF', door: '#8A5A33', accent: '#5C7A5A' },
      photos: ['exterior', 'dusk', 'living', 'kitchen'],
    },
    {
      id: 'ramble',
      street: '4410 Ramble Creek Dr',
      city: 'Austin',
      state: 'TX',
      zip: '78745',
      event: 'Open House',
      eventDate: 'Sat, Nov 14, 2026 · 1–4 PM',
      eventNote: 'Open house in 2 weeks',
      price: 615000,
      beds: 3,
      baths: 2,
      sqft: 1880,
      lot: '0.18 ac',
      url: 'https://cedarrealty.example/listings/4410-ramble-creek',
      tagline: 'Updated ranch with a creek-view backyard',
      blurb: 'Single-story living with an open kitchen, new windows and a backyard that backs onto the greenbelt.',
      highlights: ['Backs onto greenbelt', 'New windows 2025', 'Open kitchen', 'Two-car garage'],
      palette: { siding: '#C9B79C', roof: '#4B4036', trim: '#F4EFE6', door: '#2F4B5A', accent: '#7A8C5A' },
      photos: ['exterior', 'dusk', 'living', 'kitchen'],
    },
    {
      id: 'bluebonnet',
      street: '2207 Bluebonnet Ct',
      city: 'Round Rock',
      state: 'TX',
      zip: '78664',
      event: 'Just Sold',
      eventDate: 'Closed Oct 22, 2026',
      eventNote: 'Sold in 6 days',
      price: 498000,
      beds: 3,
      baths: 2.5,
      sqft: 2104,
      lot: '0.16 ac',
      url: 'https://cedarrealty.example/listings/2207-bluebonnet',
      tagline: 'Sold over asking in six days',
      blurb: 'Another happy closing in Round Rock. Curious what your home could sell for?',
      highlights: ['Sold in 6 days', 'Multiple offers', 'Cul-de-sac lot', 'Top-rated schools'],
      palette: { siding: '#D8DDE2', roof: '#2E3338', trim: '#FFFFFF', door: '#A33A2E', accent: '#55708C' },
      photos: ['exterior', 'dusk', 'living', 'kitchen'],
    },
    {
      id: 'larkspur',
      street: '915 Larkspur Ave #3',
      city: 'Austin',
      state: 'TX',
      zip: '78702',
      event: 'Price Improved',
      eventDate: 'Updated Nov 2, 2026',
      eventNote: 'Now $529,000',
      price: 529000,
      beds: 2,
      baths: 2,
      sqft: 1320,
      lot: 'Condo',
      url: 'https://cedarrealty.example/listings/915-larkspur-3',
      tagline: 'East Austin townhome with a rooftop deck',
      blurb: 'Walkable to coffee, trails and the rail line, with a private rooftop deck and skyline views.',
      highlights: ['Rooftop deck', 'Skyline views', 'Walk score 91', 'HOA covers exterior'],
      palette: { siding: '#3F4A4F', roof: '#1E2326', trim: '#D9D4CB', door: '#C98A2E', accent: '#C98A2E' },
      photos: ['exterior', 'dusk', 'living', 'kitchen'],
    },
  ];

  const products = [
    { id: 'flyer', name: 'Flyers', size: '8.5 × 11 in', desc: 'Single-sheet feature flyers for showings, open houses and the info box.', from: 'From $0.16 / piece', detailed: true },
    { id: 'brochure', name: 'Brochures', size: '11 × 17 in, folded', desc: 'Four-panel brochure with room for the full story, photos and highlights.', from: 'From $0.42 / piece', detailed: true },
    { id: 'postcard', name: 'Postcards', size: '9 × 6 in', desc: 'Just-listed and farming mailers sent straight to a neighborhood.', from: 'From $0.48 / mailed piece', detailed: true },
    { id: 'social', name: 'Social Media', size: 'Square + story', desc: 'Branded posts sized for Instagram and Facebook.', free: true },
    { id: 'image', name: 'Image Download', size: 'JPG / PNG', desc: 'High-resolution marketing images for MLS and email.', free: true },
    { id: 'fbad', name: 'Facebook Ad', size: '7-day campaign', desc: 'Promote the listing to nearby buyers with a fixed budget.', from: 'Budget from $25' },
  ];

  const templates = {
    flyer: [
      { id: 'modern', name: 'Modern Edge', note: 'Large hero, clean spec band' },
      { id: 'classic', name: 'Classic Estate', note: 'Serif, framed photography' },
      { id: 'bold', name: 'Open House Bold', note: 'Full-bleed photo, event first' },
    ],
    brochure: [
      { id: 'modern', name: 'Modern Edge', note: 'Charcoal cover, photo grid' },
      { id: 'classic', name: 'Classic Estate', note: 'Cream stock, serif story' },
      { id: 'bold', name: 'Gallery', note: 'Photo-led, minimal copy' },
    ],
    postcard: [
      { id: 'modern', name: 'Modern Edge', note: 'Hero + price band' },
      { id: 'classic', name: 'Classic Estate', note: 'Serif, framed photo' },
      { id: 'bold', name: 'Neighborhood Bold', note: 'Big type for farming' },
    ],
  };

  // Illustrative pricing. "mail" rates include print + postage per mailed piece.
  const pricing = {
    flyer: {
      papers: {
        gloss100: { label: '100 lb Gloss Text', note: 'Bright, photo-friendly', print: 0.18, mailDelta: 0 },
        matte80: { label: '80 lb Matte Text', note: 'Lighter, easy to write on', print: 0.16, mailDelta: -0.02 },
        card14: { label: '14 pt Cardstock', note: 'Sturdy, premium feel', print: 0.26, mailUnavailable: 'Cardstock flyers aren’t priced for Mail at this size. Choose a text-weight paper, or switch to Ship or Pickup.' },
      },
      mail: { first: 0.66, standard: 0.5 },
      minQty: 25,
    },
    brochure: {
      papers: {
        gloss100: { label: '100 lb Gloss Text', note: 'Bright, photo-friendly', print: 0.42, mailDelta: 0 },
        matte100: { label: '100 lb Matte Text', note: 'Soft, low-glare finish', print: 0.46, mailDelta: 0.04 },
        silk14: { label: '14 pt Silk Cover', note: 'Heavy, luxury feel', print: 0.58, mailUnavailable: 'Silk cover is too heavy to price as a folded self-mailer. Choose Gloss or Matte to keep Mail available.' },
      },
      mail: { first: 0.74, standard: 0.56 },
      minQty: 25,
    },
    postcard: {
      papers: {
        gloss14: { label: '14 pt Gloss Cover', note: 'Standard postcard stock', print: 0.22, mailDelta: 0 },
        uv16: { label: '16 pt UV Coated', note: 'Extra shine and stiffness', print: 0.3, mailDelta: 0.06 },
      },
      mail: { first: 0.62, standard: 0.48 },
      minQty: 50,
    },
    shipFee: 8,
    pdfAddon: 4,
    downloadPdf: 4,
    sampleCopy: 1,
    radiusRecord: 0.1,
    taxRate: 1 / 12, // illustrative; yields $10.00 on a $120.00 subtotal
  };

  const mailClasses = {
    first: { label: 'First Class', days: '3–5 business days' },
    standard: { label: 'Standard', days: '5–15 business days' },
  };

  const savedLists = [
    { id: 'zilker', name: 'Zilker past clients', qty: 100, created: 'Sep 12, 2026', source: 'CRM import' },
    { id: 'bouldin', name: 'Bouldin Creek farm area', qty: 240, created: 'Jul 3, 2026', source: 'Street' },
    { id: 'signins', name: 'Open house sign-ins — Oct', qty: 38, created: 'Oct 20, 2026', source: 'Upload' },
    { id: 'sphere', name: 'Cedar Realty sphere', qty: 412, created: 'Mar 18, 2026', source: 'CRM import' },
  ];

  const pickupLocations = [
    { id: 'lamar', name: 'APM Print Center — South Lamar', addr: '2410 S Lamar Blvd, Austin, TX 78704', ready: 'Ready in 2 business days' },
    { id: 'domain', name: 'APM Print Center — The Domain', addr: '11500 Rock Rose Ave, Austin, TX 78758', ready: 'Ready in 3 business days' },
  ];

  const credits = {
    promoCodes: { WILLOW10: { amount: 10, label: 'New listing launch — $10 off' } },
    storeCredit: 45,
    adBudget: 150,
  };

  const payment = {
    cards: [
      { id: 'visa', brand: 'Visa', last4: '4821', holder: 'Jordan Ellis', exp: '08/28' },
      { id: 'mc', brand: 'Mastercard', last4: '1907', holder: 'Cedar Realty Marketing', exp: '02/27' },
    ],
    corporate: [
      { id: 'corp', name: 'Cedar Realty — Austin Marketing', approver: 'Dana Whitfield', approverRole: 'Marketing Manager', needsCostCenter: true },
    ],
    orgs: ['Austin — South', 'Austin — Central', 'Round Rock', 'Corporate Marketing'],
  };

  return { agent, listings, products, templates, pricing, mailClasses, savedLists, pickupLocations, credits, payment };
})();
