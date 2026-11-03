// Generated illustrations: property "photography", agent headshot, product artwork, icons, QR codes and the radius map.
window.Art = (() => {
  let seq = 0;
  const uid = p => `${p}${++seq}`;

  const rng = seed => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hash = s => {
    let h = 2166136261;
    for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  };

  const svg = (body, vb = '0 0 800 520') => `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

  // ---- property photos ----
  const tree = (x, y, s, c1, c2) => `
    <rect x="${x - 4 * s}" y="${y}" width="${8 * s}" height="${70 * s}" fill="#5a4636"/>
    <circle cx="${x}" cy="${y - 10 * s}" r="${48 * s}" fill="${c1}"/>
    <circle cx="${x - 34 * s}" cy="${y + 14 * s}" r="${34 * s}" fill="${c2}"/>
    <circle cx="${x + 36 * s}" cy="${y + 10 * s}" r="${36 * s}" fill="${c1}"/>
    <circle cx="${x + 8 * s}" cy="${y - 40 * s}" r="${30 * s}" fill="${c2}" opacity=".9"/>`;

  const exterior = (p, dusk) => {
    const g = uid('g');
    const sky = dusk ? ['#2B3B63', '#C7826A', '#F2C38B'] : ['#A9CFEA', '#DCEBF3', '#F5EEDF'];
    const lawn = dusk ? ['#3E5A39', '#263A25'] : ['#8DB46A', '#5D8A45'];
    const glow = dusk ? '#FFD27A' : '#B9D3E2';
    const glow2 = dusk ? '#F7B24A' : '#E8F1F6';
    const shade = dusk ? .55 : 1;
    return svg(`
      <defs>
        <linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>
        <linearGradient id="${g}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lawn[0]}"/><stop offset="1" stop-color="${lawn[1]}"/></linearGradient>
        <linearGradient id="${g}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${glow2}"/><stop offset="1" stop-color="${glow}"/></linearGradient>
        <linearGradient id="${g}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9C6BE"/><stop offset="1" stop-color="#A9A69F"/></linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#${g}s)"/>
      ${dusk ? '<circle cx="660" cy="120" r="34" fill="#FBE3B0" opacity=".55"/>' : '<circle cx="680" cy="90" r="40" fill="#FFF7E0" opacity=".7"/>'}
      <g opacity="${dusk ? .7 : .85}">
        ${tree(40, 250, 1.3, '#4F6E45', '#5F7F52')}
        ${tree(760, 240, 1.4, '#486A40', '#577A4C')}
        <ellipse cx="400" cy="300" rx="420" ry="40" fill="${dusk ? '#2F4530' : '#6E9655'}"/>
      </g>
      <rect y="330" width="800" height="190" fill="url(#${g}l)"/>
      <!-- house -->
      <g filter="none">
        <rect x="190" y="180" width="300" height="160" fill="${p.siding}" style="filter:brightness(${shade})"/>
        ${Array.from({ length: 15 }, (_, i) => `<line x1="190" x2="490" y1="${190 + i * 10}" y2="${190 + i * 10}" stroke="#000" stroke-opacity=".05"/>`).join('')}
        <polygon points="170,186 340,92 510,186" fill="${p.roof}"/>
        <polygon points="190,186 340,104 490,186" fill="${p.siding}" style="filter:brightness(${shade * .94})"/>
        <rect x="490" y="220" width="170" height="120" fill="${p.siding}" style="filter:brightness(${shade * .9})"/>
        <polygon points="476,226 575,170 674,226" fill="${p.roof}"/>
        <rect x="270" y="132" width="140" height="40" fill="url(#${g}w)" stroke="${p.trim}" stroke-width="5"/>
        <line x1="340" x2="340" y1="132" y2="172" stroke="${p.trim}" stroke-width="4"/>
        <rect x="214" y="214" width="96" height="78" fill="url(#${g}w)" stroke="${p.trim}" stroke-width="6"/>
        <line x1="262" x2="262" y1="214" y2="292" stroke="${p.trim}" stroke-width="4"/>
        <rect x="372" y="214" width="96" height="78" fill="url(#${g}w)" stroke="${p.trim}" stroke-width="6"/>
        <line x1="420" x2="420" y1="214" y2="292" stroke="${p.trim}" stroke-width="4"/>
        <rect x="320" y="236" width="40" height="104" fill="${p.door}"/>
        <rect x="326" y="244" width="28" height="30" fill="url(#${g}w)" opacity=".8"/>
        <circle cx="352" cy="294" r="2.5" fill="#E4C27A"/>
        <rect x="512" y="250" width="126" height="90" fill="${dusk ? '#4A4A4A' : '#E9E9E6'}" stroke="${p.trim}" stroke-width="5"/>
        ${[0, 1, 2, 3, 4].map(i => `<line x1="512" x2="638" y1="${266 + i * 16}" y2="${266 + i * 16}" stroke="#000" stroke-opacity=".12"/>`).join('')}
        <rect x="300" y="226" width="80" height="8" fill="${p.trim}"/>
        <rect x="304" y="232" width="6" height="108" fill="${p.trim}"/>
        <rect x="370" y="232" width="6" height="108" fill="${p.trim}"/>
        ${dusk ? `<circle cx="312" cy="250" r="5" fill="#FFE3A3"/><circle cx="312" cy="250" r="22" fill="#FFD27A" opacity=".18"/>` : ''}
        <rect x="190" y="336" width="470" height="8" fill="#000" opacity=".12"/>
      </g>
      <polygon points="505,344 645,344 760,520 560,520" fill="url(#${g}d)" style="filter:brightness(${shade})"/>
      <polygon points="326,344 356,344 380,520 300,520" fill="url(#${g}d)" style="filter:brightness(${shade})"/>
      ${[200, 236, 270, 410, 446, 482].map((x, i) => `<ellipse cx="${x}" cy="${348 - (i % 2) * 4}" rx="${22 + (i % 3) * 4}" ry="18" fill="${dusk ? '#2F4A2E' : (i % 2 ? '#4E7A3E' : '#5E8A48')}"/>`).join('')}
      ${tree(120, 300, 1.05, dusk ? '#2E4A2C' : '#45693B', dusk ? '#3A5636' : '#557A47')}
      ${dusk ? Array.from({ length: 6 }, (_, i) => `<circle cx="${340 + i * 4}" cy="${470 + i * 8}" r="3" fill="#FFE3A3" opacity=".8"/>`).join('') : ''}
    `);
  };

  const living = p => {
    const g = uid('g');
    return svg(`
      <defs>
        <linearGradient id="${g}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B98E62"/><stop offset="1" stop-color="#8F6743"/></linearGradient>
        <linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F0E8"/><stop offset="1" stop-color="#E6DFD2"/></linearGradient>
        <linearGradient id="${g}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE4EF"/><stop offset=".55" stop-color="#9CC08A"/><stop offset="1" stop-color="#6E9A5A"/></linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#${g}w)"/>
      <rect y="360" width="800" height="160" fill="url(#${g}f)"/>
      ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 70}" y1="360" x2="${i * 90 - 120}" y2="520" stroke="#000" stroke-opacity=".06"/>`).join('')}
      <rect x="430" y="70" width="300" height="270" fill="url(#${g}o)" stroke="#FFFFFF" stroke-width="10"/>
      <line x1="580" x2="580" y1="70" y2="340" stroke="#FFF" stroke-width="8"/>
      <circle cx="510" cy="200" r="40" fill="#5F8A4C" opacity=".7"/><circle cx="660" cy="220" r="52" fill="#557E44" opacity=".7"/>
      <polygon points="430,340 730,340 800,420 360,420" fill="#FFF8E8" opacity=".35"/>
      <rect x="70" y="110" width="150" height="110" fill="#E3D6C1" stroke="#6E5A44" stroke-width="6"/>
      <path d="M86 196 L130 146 L160 176 L180 156 L206 196 Z" fill="${p.accent}" opacity=".75"/>
      <ellipse cx="300" cy="440" rx="260" ry="46" fill="#EEE6D8" opacity=".9"/>
      <rect x="70" y="300" width="330" height="90" rx="18" fill="#7E8F86"/>
      <rect x="84" y="262" width="300" height="70" rx="18" fill="#8D9E95"/>
      <rect x="60" y="300" width="40" height="96" rx="14" fill="#73847B"/>
      <rect x="370" y="300" width="40" height="96" rx="14" fill="#73847B"/>
      <rect x="120" y="276" width="70" height="44" rx="10" fill="#E8DCC6"/><rect x="250" y="280" width="64" height="40" rx="10" fill="${p.accent}"/>
      <rect x="200" y="410" width="150" height="16" rx="6" fill="#6E5A44"/><rect x="214" y="426" width="8" height="30" fill="#5A4836"/><rect x="328" y="426" width="8" height="30" fill="#5A4836"/>
      <circle cx="248" cy="402" r="8" fill="#FFF"/><rect x="290" y="396" width="34" height="14" rx="3" fill="#C4A574"/>
      <rect x="740" y="250" width="40" height="120" fill="#4A6B42" rx="20"/><rect x="742" y="350" width="36" height="40" fill="#C9B79C"/>
      <line x1="300" y1="0" x2="300" y2="70" stroke="#333" stroke-width="2"/><ellipse cx="300" cy="80" rx="40" ry="14" fill="#2E2E2E"/>
      <ellipse cx="300" cy="92" rx="36" ry="6" fill="#FFE7A8" opacity=".9"/>
    `);
  };

  const kitchen = p => {
    const g = uid('g');
    return svg(`
      <defs>
        <linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAFAF7"/><stop offset="1" stop-color="#ECEBE6"/></linearGradient>
        <linearGradient id="${g}q" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4F4F2"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E7E6E2"/></linearGradient>
        <linearGradient id="${g}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D5E8F2"/><stop offset="1" stop-color="#8FB57B"/></linearGradient>
      </defs>
      <rect width="800" height="520" fill="#EFEBE4"/>
      <rect y="420" width="800" height="100" fill="#B08A63"/>
      <rect x="40" y="40" width="720" height="130" fill="url(#${g}c)"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${48 + i * 120}" y="48" width="112" height="114" fill="none" stroke="#D7D4CC" stroke-width="2"/><rect x="${98 + i * 120}" y="140" width="12" height="3" fill="#9A958A"/>`).join('')}
      <rect x="320" y="56" width="160" height="100" fill="url(#${g}o)" stroke="#FFF" stroke-width="6"/>
      <rect x="40" y="170" width="720" height="70" fill="#E3DED4"/>
      ${Array.from({ length: 24 }, (_, i) => `<rect x="${40 + i * 30}" y="170" width="30" height="16" fill="none" stroke="#D3CDC2"/>`).join('')}
      <rect x="40" y="240" width="720" height="14" fill="#F2F1EE"/>
      <rect x="40" y="254" width="720" height="166" fill="${p.accent}" style="filter:saturate(.6) brightness(1.1)"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${48 + i * 120}" y="262" width="112" height="150" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/><rect x="${98 + i * 120}" y="272" width="12" height="3" fill="#E9E1CC"/>`).join('')}
      <rect x="150" y="330" width="500" height="22" fill="url(#${g}q)"/>
      <rect x="164" y="352" width="472" height="110" fill="#F7F5F1"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${176 + i * 116}" y="362" width="104" height="92" fill="none" stroke="#DCD8CF" stroke-width="2"/>`).join('')}
      ${[220, 400, 580].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="250" stroke="#2B2B2B" stroke-width="2"/><path d="M${x - 26} 280 Q${x} 240 ${x + 26} 280 Z" fill="#2B2B2B"/><ellipse cx="${x}" cy="281" rx="22" ry="4" fill="#FFE2A0"/>`).join('')}
      ${[250, 400, 550].map(x => `<rect x="${x - 22}" y="404" width="44" height="12" rx="4" fill="#3B3B3B"/><rect x="${x - 3}" y="416" width="6" height="70" fill="#3B3B3B"/>`).join('')}
      <circle cx="320" cy="322" r="14" fill="#C9A15A"/><circle cx="342" cy="324" r="10" fill="#B9452F"/><rect x="460" y="300" width="18" height="30" rx="3" fill="#6E8E5E"/>
    `);
  };

  const photo = (listing, kind) => {
    const p = listing.palette;
    if (kind === 'dusk') return exterior(p, true);
    if (kind === 'living') return living(p);
    if (kind === 'kitchen') return kitchen(p);
    return exterior(p, false);
  };
  const photoLabel = { exterior: 'Front exterior', dusk: 'Twilight', living: 'Living room', kitchen: 'Kitchen' };

  const headshot = () => {
    const g = uid('h');
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFD9D3"/><stop offset="1" stop-color="#A9BBB1"/></linearGradient></defs>
      <rect width="120" height="120" fill="url(#${g})"/>
      <path d="M14 120 C18 92 40 84 60 84 C80 84 102 92 106 120 Z" fill="#2E3A46"/>
      <path d="M48 86 L60 104 L72 86 Z" fill="#F4F1EC"/>
      <rect x="52" y="68" width="16" height="20" rx="6" fill="#C99A7A"/>
      <ellipse cx="60" cy="52" rx="20" ry="23" fill="#D6A886"/>
      <path d="M39 50 C38 30 50 24 61 24 C74 24 84 32 81 50 C78 40 70 36 60 37 C50 37 43 41 39 50 Z" fill="#3B2B22"/>
      <circle cx="52" cy="54" r="1.8" fill="#2B2B2B"/><circle cx="68" cy="54" r="1.8" fill="#2B2B2B"/>
      <path d="M53 64 Q60 69 67 64" stroke="#8A5A44" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  };

  // ---- product catalog art ----
  const sheet = (x, y, w, h, rot, inner) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x + 4}" y="${y + 6}" width="${w}" height="${h}" rx="3" fill="#000" opacity=".12"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#fff"/>${inner}</g>`;
  const mini = (listing, kind, x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">${photo(listing, kind).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`;
  const lines = (x, y, w, n, c = '#D8DCD9', gap = 9) => Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * gap}" width="${i === n - 1 ? w * .6 : w}" height="4" rx="2" fill="${c}"/>`).join('');

  const product = (id, listing) => {
    const L = listing;
    const bg = '<rect width="320" height="200" fill="none"/>';
    let body = '';
    if (id === 'flyer') {
      body = sheet(150, 18, 118, 152, 6, `${mini(L, 'living', 156, 24, 106, 64)}${lines(158, 98, 96, 3)}<rect x="158" y="132" width="60" height="18" rx="2" fill="#1E7F55"/>`)
        + sheet(62, 14, 124, 162, -4, `${mini(L, 'exterior', 68, 20, 112, 82)}<rect x="68" y="102" width="112" height="16" fill="#1F2427"/><rect x="74" y="108" width="40" height="4" fill="#fff"/>${lines(72, 126, 100, 3)}<rect x="152" y="150" width="22" height="22" fill="#1F2427"/>`);
    } else if (id === 'brochure') {
      body = `<g transform="translate(40 26)">
        <polygon points="0,10 80,0 80,150 0,160" fill="#E9ECEA"/>
        <polygon points="80,0 160,10 160,160 80,150" fill="#fff"/>
        <polygon points="160,10 240,0 240,150 160,160" fill="#F4F6F5"/>
        <svg x="84" y="8" width="72" height="60" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">${photo(L, 'kitchen').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
        <svg x="164" y="10" width="72" height="88" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">${photo(L, 'exterior').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
        ${lines(88, 78, 64, 5)}${lines(166, 106, 64, 3)}${lines(8, 30, 64, 8)}
        <rect x="8" y="118" width="40" height="28" fill="#fff" stroke="#C9CFCB"/>
        <rect x="164" y="134" width="44" height="14" fill="#1E7F55"/>
        <polygon points="80,0 80,150 76,151 76,1" fill="#000" opacity=".06"/><polygon points="160,10 160,160 164,160 164,10" fill="#000" opacity=".05"/>
      </g>`;
    } else if (id === 'postcard') {
      body = sheet(96, 70, 170, 112, 5, `<rect x="104" y="78" width="70" height="96" fill="#fff"/>${lines(108, 86, 56, 4)}<rect x="234" y="78" width="24" height="28" fill="#EEF1EF" stroke="#C9CFCB"/>${lines(190, 130, 60, 3, '#C9CFCB')}`)
        + sheet(40, 22, 176, 116, -6, `${mini(L, 'dusk', 40, 22, 176, 116)}<rect x="40" y="104" width="176" height="34" fill="#1F2427" opacity=".88"/><rect x="48" y="112" width="70" height="7" fill="#fff"/><rect x="48" y="124" width="46" height="5" fill="#8FD3AE"/>`);
    } else if (id === 'social') {
      body = `<rect x="110" y="8" width="100" height="186" rx="16" fill="#1F2427"/><rect x="116" y="22" width="88" height="160" rx="6" fill="#fff"/>
        <circle cx="126" cy="32" r="5" fill="#1E7F55"/><rect x="134" y="29" width="40" height="5" rx="2" fill="#D8DCD9"/>
        ${mini(L, 'exterior', 116, 42, 88, 88)}<rect x="122" y="112" width="52" height="12" fill="#1E7F55"/><rect x="125" y="116" width="34" height="4" fill="#fff"/>
        ${lines(122, 140, 70, 3)}
        <rect x="222" y="40" width="70" height="70" rx="6" fill="#fff" transform="rotate(8 257 75)"/>${''}
        <g transform="rotate(8 257 75)">${mini(L, 'living', 226, 44, 62, 62)}</g>
        <g transform="rotate(-8 60 90)"><rect x="26" y="52" width="70" height="70" rx="6" fill="#fff"/>${mini(L, 'kitchen', 30, 56, 62, 62)}</g>`;
    } else if (id === 'image') {
      body = sheet(56, 22, 190, 130, -3, `${mini(L, 'dusk', 62, 28, 178, 118)}`)
        + `<circle cx="248" cy="150" r="30" fill="#1E7F55"/><path d="M248 134 v24 m-10 -10 l10 10 l10 -10 M236 166 h24" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else if (id === 'fbad') {
      body = `<rect x="70" y="14" width="180" height="176" rx="10" fill="#fff" stroke="#D8DCD9"/>
        <circle cx="88" cy="32" r="9" fill="#24344D"/><rect x="102" y="26" width="60" height="5" rx="2" fill="#9AA3A8"/><rect x="102" y="35" width="38" height="4" rx="2" fill="#C9CFCB"/>
        ${lines(82, 50, 150, 2)}${mini(L, 'exterior', 70, 68, 180, 84)}
        <rect x="70" y="152" width="180" height="38" fill="#F2F4F3"/><rect x="80" y="160" width="90" height="5" rx="2" fill="#4A5257"/><rect x="80" y="170" width="60" height="4" rx="2" fill="#9AA3A8"/>
        <rect x="186" y="160" width="54" height="20" rx="4" fill="#24344D"/><rect x="194" y="168" width="38" height="4" rx="2" fill="#fff"/>`;
    }
    return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${bg}${body}</svg>`;
  };

  // ---- icons ----
  const P = {
    check: 'M5 12.5l4.5 4.5L19 7.5',
    alert: 'M12 8v5M12 16.5v.5M10.3 3.9L2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z',
    info: 'M12 11v6M12 7.5v.5M12 21a9 9 0 100-18 9 9 0 000 18z',
    mail: 'M3.5 6.5h17v11h-17zM4 7l8 6 8-6',
    truck: 'M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7M6.5 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
    store: 'M4 9.5V20h16V9.5M3 9.5l1.5-5h15l1.5 5zM3 9.5c0 1.4 1 2.5 2.25 2.5S7.5 10.9 7.5 9.5c0 1.4 1 2.5 2.25 2.5S12 10.9 12 9.5c0 1.4 1 2.5 2.25 2.5s2.25-1.1 2.25-2.5c0 1.4 1 2.5 2.25 2.5S21 10.9 21 9.5M10 20v-5h4v5',
    download: 'M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4 17.5v2.5h16v-2.5',
    chevronR: 'M9 5l7 7-7 7',
    chevronL: 'M15 5l-7 7 7 7',
    chevronD: 'M5 9l7 7 7-7',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM6.5 6.5h1v1h-1zM16.5 6.5h1v1h-1zM6.5 16.5h1v1h-1z',
    map: 'M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6zM9 4v14M15 6v14',
    pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    upload: 'M12 15.5V4.5M7.5 9L12 4.5 16.5 9M4 17.5V20h16v-2.5',
    street: 'M7 3l-3 18M17 3l3 18M12 4v3M12 10.5v3M12 17v3',
    users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.3a3.5 3.5 0 010 6.4M18 14.4c2 .8 3.5 2.8 3.5 5.6',
    crm: 'M4 5h16v4H4zM4 11h16v4H4zM4 17h10v2.5H4zM7 7h.01M7 13h.01',
    card: 'M2.5 6h19v12h-19zM2.5 10h19M6 15h4',
    building: 'M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M3 21h18',
    tag: 'M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5zM8 8.5h.01',
    wallet: 'M3.5 7h15a2 2 0 012 2v9a2 2 0 01-2 2h-15zM3.5 7l11-3v3M16 13.5h.01',
    megaphone: 'M3.5 10v4h3l7 4V6l-7 4zM17 9a4 4 0 010 6M6.5 14l1.5 5h3l-1-4',
    x: 'M6 6l12 12M18 6L6 18',
    plus: 'M12 5v14M5 12h14',
    clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
    image: 'M3.5 5h17v14h-17zM3.5 15.5l5-5 4 4 2.5-2.5 5.5 5.5M15.5 9a1 1 0 100-2 1 1 0 000 2z',
    share: 'M6 15a3 3 0 100-6 3 3 0 000 6zM18 8a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 10.6l6.8-3.6M8.6 13.4l6.8 3.6',
    lock: 'M5.5 11h13v9.5h-13zM8 11V8a4 4 0 018 0v3',
    file: 'M6 3h8l4 4v14H6zM14 3v4h4',
    home: 'M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5',
    layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
    trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
    search: 'M10.5 17.5a7 7 0 100-14 7 7 0 000 14zM20.5 20.5l-5-5',
    refresh: 'M20 11a8 8 0 00-14.5-4.5M4 4v4h4M4 13a8 8 0 0014.5 4.5M20 20v-4h-4',
    note: 'M5 4h14v16H5zM8.5 8.5h7M8.5 12h7M8.5 15.5h4',
    arrowR: 'M4.5 12h15M13.5 6l6 6-6 6',
    star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z',
    bed: 'M3 18V7M3 13h18v5M21 13v-2a3 3 0 00-3-3h-7v5M6.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
    bath: 'M4 12h17v3a5 5 0 01-5 5H9a5 5 0 01-5-5zM6 12V6a2 2 0 014 0M7 20l-1 1.5M18 20l1 1.5',
    ruler: 'M3.5 16.5L16.5 3.5l4 4-13 13zM7 13l2 2M10 10l2 2M13 7l2 2',
  };
  const icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || P.info}"/></svg>`;

  // ---- QR (illustrative: deterministic pattern with real finder geometry, not a scannable code) ----
  const qr = (text, fg = '#1F2427') => {
    const n = 25;
    const r = rng(hash(text));
    const m = Array.from({ length: n }, () => Array.from({ length: n }, () => r() > .52));
    const finder = (ox, oy) => {
      for (let y = -1; y < 8; y++) for (let x = -1; x < 8; x++) {
        const X = ox + x, Y = oy + y;
        if (X < 0 || Y < 0 || X >= n || Y >= n) continue;
        const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        m[Y][X] = x >= 0 && y >= 0 && x < 7 && y < 7 && ring !== 2;
      }
    };
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    for (let i = 8; i < n - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; }
    for (let y = 16; y < 21; y++) for (let x = 16; x < 21; x++) m[y][x] = Math.max(Math.abs(x - 18), Math.abs(y - 18)) !== 1;
    let d = '';
    m.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + 2} ${y + 2}h1v1h-1z`; }));
    return `<svg viewBox="0 0 ${n + 4} ${n + 4}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true"><rect width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="${fg}"/></svg>`;
  };

  // ---- radius map ----
  const H_STREETS = [
    { y: 50, name: 'Juniper St' },
    { y: 120, name: 'Oleander Dr' },
    { y: 190, name: 'Willow Ln' },
    { y: 260, name: 'Evergreen Ave' },
    { y: 330, name: 'Larkspur St' },
  ];
  const V_STREETS = [{ x: 70, name: 'Hollow Rd' }, { x: 190, name: 'Primrose Ave' }, { x: 330, name: 'Cottonwood Dr' }, { x: 470, name: 'Mesa Trl' }];
  const PX_PER_MILE = 520;
  const homes = (() => {
    const r = rng(7);
    const out = [];
    H_STREETS.forEach((s, si) => {
      ['n', 's'].forEach(side => {
        for (let i = 0; i < 25; i++) {
          const x = 14 + i * 22;
          if (V_STREETS.some(v => Math.abs(v.x - x) < 13)) continue;
          const y = s.y + (side === 'n' ? -14 : 14);
          const inParkArea = x > 360 && x < 460 && y > 270 && y < 320;
          if (inParkArea || y < 0 || y > 380) continue;
          const mfZone = (si === 3 && x > 470) || (si === 4 && x < 180);
          const mf = mfZone ? r() < .8 : r() < .1;
          out.push({ id: `${si}${side}${i}`, x, y, mf, street: s.name, num: 84 + i * 4 + (side === 's' ? 1 : 0), units: mf ? 2 + Math.floor(r() * 6) : 1 });
        }
      });
    });
    const target = out.find(h => h.id === '2n11');
    target.target = true;
    target.mf = false;
    return out;
  })();
  const target = homes.find(h => h.target);

  const radiusSelect = ({ qty, sf, mf, exclude }) => {
    const pool = homes.filter(h => (h.mf ? mf : sf) && !(exclude && h.target));
    const sorted = pool.map(h => ({ ...h, d: Math.hypot(h.x - target.x, h.y - target.y) })).sort((a, b) => a.d - b.d);
    const picked = sorted.slice(0, qty);
    const rpx = picked.length ? picked[picked.length - 1].d + 6 : 0;
    return { picked, rpx, miles: rpx / PX_PER_MILE, available: pool.length };
  };

  const map = ({ qty, sf, mf, exclude }) => {
    const { picked, rpx } = radiusSelect({ qty, sf, mf, exclude });
    const ids = new Set(picked.map(h => h.id));
    const g = uid('m');
    return `<svg viewBox="0 0 560 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of selected addresses around 128 Willow Lane">
      <defs><pattern id="${g}h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#E6E8E4"/><line x1="0" y1="0" x2="0" y2="6" stroke="#C9CDC7" stroke-width="2"/></pattern></defs>
      <rect width="560" height="380" fill="#F1F2EE"/>
      <rect x="360" y="270" width="100" height="50" rx="8" fill="#D7E7CF"/><text x="410" y="299" text-anchor="middle" font-size="10" fill="#5E7D54" font-weight="600">Pecan Park</text>
      <path d="M-10 365 C80 340 140 372 230 352 S400 360 570 340" stroke="#B9D5E6" stroke-width="10" fill="none"/>
      ${H_STREETS.map(s => `<line x1="0" x2="560" y1="${s.y}" y2="${s.y}" stroke="#fff" stroke-width="12"/><text x="548" y="${s.y + 3.5}" text-anchor="end" font-size="9" fill="#8A938F">${s.name}</text>`).join('')}
      ${V_STREETS.map(s => `<line y1="0" y2="380" x1="${s.x}" x2="${s.x}" stroke="#fff" stroke-width="12"/><text x="${s.x + 3}" y="372" font-size="9" fill="#8A938F" transform="rotate(-90 ${s.x + 3} 372)">${s.name}</text>`).join('')}
      <circle cx="${target.x}" cy="${target.y}" r="${rpx}" fill="#1E7F55" fill-opacity=".07" stroke="#1E7F55" stroke-width="1.5" stroke-dasharray="5 4"/>
      ${homes.filter(h => !h.target).map(h => {
        const on = ids.has(h.id);
        if (h.mf) return `<rect x="${h.x - 5}" y="${h.y - 5}" width="10" height="10" rx="1.5" fill="${on ? '#1E7F55' : `url(#${g}h)`}" stroke="${on ? '#17694A' : '#AEB4AE'}"/>`;
        return `<circle cx="${h.x}" cy="${h.y}" r="4.6" fill="${on ? '#1E7F55' : '#fff'}" stroke="${on ? '#17694A' : '#AEB4AE'}" stroke-width="1.4"/>`;
      }).join('')}
      <g transform="translate(${target.x} ${target.y})">
        <circle r="13" fill="${exclude ? '#fff' : '#1E7F55'}" stroke="#1F2427" stroke-width="2"/>
        <path d="M-6 1 L0 -5 L6 1 M-4 0 V5 H4 V0" stroke="${exclude ? '#1F2427' : '#fff'}" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
        ${exclude ? '<line x1="-11" y1="11" x2="11" y2="-11" stroke="#C23A2F" stroke-width="2.2"/>' : ''}
      </g>
      <g transform="translate(${target.x + 16} ${target.y - 34})"><rect width="${exclude ? 160 : 104}" height="22" rx="11" fill="#1F2427"/><text x="${exclude ? 80 : 52}" y="15" text-anchor="middle" font-size="10.5" fill="#fff" font-weight="600">128 Willow Ln${exclude ? ' · excluded' : ''}</text></g>
    </svg>`;
  };

  return { photo, photoLabel, headshot, product, icon, qr, map, radiusSelect, target, PX_PER_MILE, hash };
})();
