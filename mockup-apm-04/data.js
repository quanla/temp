// Fictional data for the APM ordering prototype. Nothing here is real.
window.APM_DATA = {
  agent: {
    name: 'Jordan Ellis',
    title: 'Realtor®',
    company: 'Cedar Realty',
    phone: '(512) 555-0148',
    email: 'jordan@cedarrealty.example',
  },

  listings: [
    {
      id: 'willow',
      street: '128 Willow Lane',
      city: 'Austin',
      state: 'TX',
      zip: '78704',
      event: 'New Listing',
      date: 'Nov 8, 2026',
      dateLong: 'Saturday, November 8',
      price: '$1,145,000',
      beds: 4,
      baths: 3,
      sqft: '2,640',
      neighborhood: 'Bouldin Creek',
      headline: 'Light-filled modern living in Bouldin Creek',
      desc: 'A calm, sun-washed home on a quiet tree-lined street. Open living and dining flow to a shaded deck and pool, minutes from South Congress.',
      features: [
        'Vaulted great room with oak floors',
        'Chef’s kitchen with walk-in pantry',
        'Primary suite with spa bath',
        'Saltwater pool and shaded deck',
        'Detached studio / home office',
        'Two-car garage with EV charger',
      ],
    },
    {
      id: 'juniper',
      street: '4512 Juniper Ridge Dr',
      city: 'Austin',
      state: 'TX',
      zip: '78731',
      event: 'Open House',
      date: 'Nov 15, 2026',
      dateLong: 'Saturday, November 15',
      price: '$865,000',
      beds: 3,
      baths: 2.5,
      sqft: '2,180',
      neighborhood: 'Northwest Hills',
      headline: 'Hill Country views from every room',
      desc: 'A renovated mid-century home with walls of glass, a wraparound deck, and a short walk to trails and top-rated schools.',
      features: ['Walls of glass', 'Wraparound deck', 'Renovated kitchen', 'Walk to trails', 'Top-rated schools', 'Workshop'],
    },
    {
      id: 'barton',
      street: '77 Barton Hills Ct',
      city: 'Austin',
      state: 'TX',
      zip: '78704',
      event: 'Just Sold',
      date: 'Oct 24, 2026',
      dateLong: 'Friday, October 24',
      price: '$1,320,000',
      beds: 4,
      baths: 3.5,
      sqft: '3,050',
      neighborhood: 'Barton Hills',
      headline: 'Sold above asking in nine days',
      desc: 'Another Barton Hills home sold by Cedar Realty. Thinking about your next move? Let’s talk about what your home could bring.',
      features: ['Sold in 9 days', 'Multiple offers', 'Above asking', 'Greenbelt access', 'Pool', 'Studio'],
    },
  ],

  products: [
    { key: 'flyers', name: 'Flyers', blurb: '8.5 × 11 in single sheet', price: 'From $0.30 each' },
    { key: 'brochures', name: 'Brochures', blurb: 'Tri-fold, 11 × 8.5 in', price: 'From $0.36 each' },
    { key: 'postcards', name: 'Postcards', blurb: '6 × 9 in, mail-ready', price: 'From $0.28 each' },
    { key: 'social', name: 'Social Media', blurb: 'Posts and stories for each network', free: true },
    { key: 'images', name: 'Image Download', blurb: 'High-resolution listing graphics', free: true },
    { key: 'fbad', name: 'Facebook Ad', blurb: 'Promote the listing to nearby buyers', price: 'Budget set at launch' },
  ],

  productSpecs: {
    flyers: { size: '8.5 × 11 in · single sheet', unitName: 'flyer', sides: ['front', 'back'] },
    brochures: { size: 'Tri-fold · 11 × 8.5 in', unitName: 'brochure', sides: ['outside', 'inside'] },
    postcards: { size: '6 × 9 in', unitName: 'postcard', sides: ['front', 'back'] },
  },

  templates: [
    { id: 'willow', name: 'Willow', note: 'Full-bleed photo, modern serif' },
    { id: 'heritage', name: 'Heritage', note: 'Framed, classic and warm' },
    { id: 'gallery', name: 'Gallery', note: 'Photo grid, clean type' },
  ],

  papers: [
    { id: '80gloss', name: '80 lb Gloss Text', note: 'Light and glossy. Our standard.', add: 0 },
    { id: '100gloss', name: '100 lb Gloss Cover', note: 'Sturdier, card-like feel', add: 0.06 },
    { id: '100matte', name: '100 lb Matte Cover', note: 'Soft finish, no glare', add: 0.06 },
    {
      id: 'linen',
      name: '110 lb Linen',
      note: 'Textured premium stock',
      add: 0.1,
      unavailableFor: ['brochures'],
      why: 'Too thick to fold cleanly, so it isn’t offered for tri-fold brochures.',
    },
  ],

  lists: [
    { id: 'l1', name: 'Austin Past Clients', count: 100, created: 'Aug 12, 2026', source: 'Upload' },
    { id: 'l2', name: 'Zilker Sphere of Influence', count: 84, created: 'Jun 3, 2026', source: 'CRM Import' },
    { id: 'l3', name: 'Bouldin Creek Farm Area', count: 312, created: 'Mar 19, 2026', source: 'Street' },
    { id: 'l4', name: 'Open House Sign-ins', count: 23, created: 'Oct 5, 2026', source: 'Upload' },
  ],

  officeAddress: {
    name: 'Jordan Ellis',
    company: 'Cedar Realty',
    street1: '500 Congress Ave',
    street2: 'Suite 210',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
  },

  pickupLocations: [
    { id: 'p1', name: 'South Lamar Print Studio', addr: '2201 S Lamar Blvd, Austin, TX 78704', hours: 'Mon–Fri 8 am–6 pm' },
    { id: 'p2', name: 'Downtown Print Studio', addr: '601 W 6th St, Austin, TX 78701', hours: 'Mon–Sat 9 am–5 pm' },
  ],

  cards: [
    { id: 'visa', brand: 'Visa', last4: '4242', exp: '08/28' },
    { id: 'amex', brand: 'Amex', last4: '1009', exp: '03/27' },
  ],

  corp: {
    name: 'Cedar Realty corporate billing',
    approver: 'Morgan Reyes',
    approverRole: 'Marketing Director',
    costCenters: ['AUS-204 · Austin Marketing', 'AUS-310 · Listing Launches', 'HQ-100 · Brand'],
  },

  credits: {
    promo: { code: 'WILLOW10', amount: 10, label: '$10 off print' },
    store: { balance: 20 },
    ad: { balance: 250, suggested: 30 },
  },

  taxRate: 0.0825,
};
