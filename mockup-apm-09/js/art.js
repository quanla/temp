/* Placeholder artwork: neutral listing photos and merged design previews, drawn as inline SVG. */
function photoInner(hue, v) {
  v = v || 0;
  const sky = `hsl(${hue},38%,${84 - (v % 3) * 3}%)`, ground = `hsl(${(hue + 100) % 360},22%,62%)`, wall = `hsl(${(hue + 40) % 360},18%,${90 - (v % 4) * 3}%)`, roof = `hsl(${hue},22%,36%)`, x = 110 + (v % 3) * 25;
  return `<rect width="400" height="300" fill="${sky}"/><circle cx="${330 - v * 20}" cy="60" r="26" fill="#fff" opacity=".55"/><rect y="215" width="400" height="85" fill="${ground}"/>
  <rect x="${x}" y="130" width="180" height="100" fill="${wall}"/><path d="M${x - 16} 134 L${x + 90} 70 L${x + 196} 134z" fill="${roof}"/>
  <rect x="${x + 76}" y="176" width="30" height="54" fill="${roof}"/><rect x="${x + 22}" y="156" width="34" height="30" fill="#fff" opacity=".8"/><rect x="${x + 126}" y="156" width="34" height="30" fill="#fff" opacity=".8"/>
  <rect x="${x + 214}" y="150" width="8" height="80" fill="${roof}"/><circle cx="${x + 218}" cy="140" r="30" fill="hsl(${(hue + 100) % 360},28%,48%)"/>`;
}
function photo(hue, v) { return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Listing photo placeholder">${photoInner(hue, v)}</svg>`; }
function ph(hue, v, x, y, w, h) { return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${photoInner(hue, v)}</svg>`; }
function wrapText(s, n, max) { const words = String(s).split(/\s+/), lines = []; let cur = ''; words.forEach((w) => { if ((cur + ' ' + w).trim().length > n) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) lines.push(cur); return lines.slice(0, max); }
function tx(x, y, s, size, fill, o) { o = o || {}; return `<text x="${x}" y="${y}" font-family="Lato, Arial, sans-serif" font-size="${size}" fill="${fill}"${o.b ? ' font-weight="900"' : ''}${o.a ? ` text-anchor="${o.a}"` : ''}>${esc(s)}</text>`; }
function para(x, y, s, size, fill, n, max) { return wrapText(s, n, max).map((l, i) => tx(x, y + i * (size + 5), l, size, fill)).join(''); }
function artSize(k, side) { const P = PRODUCTS[k]; return k === 'image' && side === 1 ? [360, 640] : [P.w, P.h]; }

/* The merged design for one side of a product. o.wm adds the proof watermark. */
function design(e, k, side, it, o) {
  o = o || {};
  const [W, H] = artSize(k, side), f = it.fields, styleNames = STYLES[it.tpl.style] || STYLES.Modern;
  const hue = (STYLE_HUES[it.tpl.style] || 208) + styleNames.indexOf(it.tpl.name) * 14, ac = `hsl(${hue},52%,36%)`, soft = `hsl(${hue},40%,95%)`, ink = '#334150', v = it.img || 0;
  const contact = (x, y, c) => tx(x, y, f.cname, 15, c, { b: 1 }) + tx(x, y + 18, f.ctitle, 11, c) + tx(x, y + 34, '(817) 555-0142', 11, c);
  let g = `<rect width="${W}" height="${H}" fill="#fff"/>`;
  if (k === 'postcard' && side === 0) {
    g += ph(e.hue, v, 0, 0, 600, 275) + `<rect y="275" width="600" height="125" fill="${ac}"/>` + tx(28, 325, f.headline, 36, '#fff', { b: 1 }) + tx(28, 352, f.address, 16, '#fff') + tx(28, 376, f.details, 12, '#fff') + tx(572, 330, f.price, 28, '#fff', { b: 1, a: 'end' });
  } else if (k === 'postcard') {
    g += `<rect width="600" height="400" fill="#fff"/><rect x="24" y="24" width="250" height="70" fill="${soft}"/>` + contact(36, 50, ink) + tx(24, 130, f.headline + ' at ' + f.address, 15, ac, { b: 1 }) + para(24, 156, f.desc, 12, ink, 44, 7) +
      ph(e.hue, v + 1, 24, 280, 120, 90) + ph(e.hue, v + 2, 154, 280, 120, 90) + `<line x1="300" y1="24" x2="300" y2="376" stroke="#D3D3D3"/><rect x="500" y="24" width="76" height="52" fill="none" stroke="${ink}"/>` + tx(538, 46, 'PRSRT', 9, ink, { a: 'middle' }) + tx(538, 60, 'US POSTAGE', 8, ink, { a: 'middle' }) +
      [0, 1, 2, 3].map((i) => `<rect x="330" y="${200 + i * 20}" width="${200 - i * 26}" height="9" fill="#E1E4E8"/>`).join('') + `<rect x="330" y="300" width="220" height="14" fill="url(#bars)"/><defs><pattern id="bars" width="5" height="14" patternUnits="userSpaceOnUse"><rect width="2" height="14" fill="${ink}"/></pattern></defs>`;
  } else if (k === 'brochure' && side === 0) {
    g += ph(e.hue, v, 0, 0, 400, 330) + `<rect y="330" width="400" height="190" fill="${ac}"/>` + tx(28, 390, f.headline, 38, '#fff', { b: 1 }) + tx(28, 422, f.address, 17, '#fff') + tx(28, 448, f.price, 20, '#fff', { b: 1 }) + tx(28, 490, f.cname, 12, '#fff');
  } else if (k === 'brochure' && side === 1) {
    g += tx(28, 52, 'About this home', 22, ac, { b: 1 }) + para(28, 84, f.desc, 13, ink, 50, 6) + ph(e.hue, v + 1, 28, 210, 344, 170) + ph(e.hue, v + 2, 28, 392, 166, 100) + ph(e.hue, v + 3, 206, 392, 166, 100);
  } else if (k === 'brochure' && side === 2) {
    g += `<rect width="400" height="520" fill="${soft}"/>` + tx(28, 52, 'Details', 22, ac, { b: 1 }) + ['Price: ' + f.price, f.details, 'Covered patio and fenced yard', 'Updated kitchen', 'Two-car garage'].map((s, i) => `<circle cx="34" cy="${86 + i * 28}" r="4" fill="${ac}"/>` + tx(48, 91 + i * 28, s, 14, ink)).join('') + ph(e.hue, v + 4, 28, 240, 344, 250);
  } else if (k === 'brochure') {
    g += `<rect y="0" width="400" height="12" fill="${ac}"/><circle cx="200" cy="170" r="54" fill="${soft}"/><circle cx="200" cy="156" r="20" fill="${ac}" opacity=".5"/><path d="M160 208a40 34 0 0 1 80 0z" fill="${ac}" opacity=".5"/>` + tx(200, 262, f.cname, 20, ink, { b: 1, a: 'middle' }) + tx(200, 286, f.ctitle, 13, ink, { a: 'middle' }) + tx(200, 310, '(817) 555-0142', 13, ink, { a: 'middle' }) + tx(200, 470, 'ACME Realty', 16, ac, { b: 1, a: 'middle' });
  } else if (k === 'flyer') {
    g += `<rect width="400" height="76" fill="${ac}"/>` + tx(24, 50, f.headline, 32, '#fff', { b: 1 }) + ph(e.hue, v, 24, 96, 352, 220) + tx(24, 350, f.address, 18, ink, { b: 1 }) + tx(376, 350, f.price, 18, ac, { b: 1, a: 'end' }) + tx(24, 372, f.details, 12, ink) + para(24, 398, f.desc, 12, ink, 60, 3) + `<rect y="460" width="400" height="60" fill="${soft}"/>` + tx(24, 486, f.cname, 14, ink, { b: 1 }) + tx(24, 504, f.ctitle + '  (817) 555-0142', 11, ink);
  } else if (k === 'fbad') {
    g += ph(e.hue, v, 0, 0, 600, 314) + `<rect x="0" y="24" width="${60 + f.headline.length * 17}" height="50" fill="${ac}"/>` + tx(20, 59, f.headline, 28, '#fff', { b: 1 }) + `<rect y="254" width="600" height="60" fill="#fff" opacity=".9"/>` + tx(20, 291, f.address, 20, ink, { b: 1 }) + tx(580, 291, f.price, 20, ac, { b: 1, a: 'end' });
  } else {
    /* social post, image download (square and story) */
    g += `<svg width="${W}" height="${H}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${photoInner(e.hue, v)}</svg><rect y="${H - 150}" width="${W}" height="150" fill="${ac}" opacity=".92"/>` + tx(28, H - 92, f.headline, W > 400 ? 44 : 36, '#fff', { b: 1 }) + tx(28, H - 58, f.address, W > 400 ? 20 : 15, '#fff') + tx(28, H - 28, f.price + '   ' + f.details, W > 400 ? 15 : 11, '#fff');
  }
  if (o.wm) g += `<g opacity=".28" transform="rotate(-24 ${W / 2} ${H / 2})">${tx(W / 2, H / 2 + 20, 'PROOF', W / 4.5, '#334150', { b: 1, a: 'middle' })}</g>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(PRODUCTS[k].label + ' design, ' + PRODUCTS[k].sides[side])}">${g}</svg>`;
}
