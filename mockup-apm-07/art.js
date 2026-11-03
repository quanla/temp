// Illustration helpers: icons, listing photography, proofs, QR codes, and the radius map.
// Everything is drawn as inline SVG so the prototype works offline.

const ICON_PATHS = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  orders: "M9 4h6v3H9zM7 5H5v16h14V5h-2M8 11h8M8 15h6",
  building: "M4 21V4h10v17M14 9h6v12M7 8h2M7 12h2M7 16h2M17 13h1M17 17h1M3 21h18",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 4.4V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  cart: "M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2M9 20.5h.01M17 20.5h.01",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  chevronLeft: "M15 6l-6 6 6 6",
  x: "M6 6l12 12M18 6L6 18",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  truck: "M2 6h12v10H2zM14 10h4l3 3v3h-7M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  store: "M4 10v10h16V10M3 4h18l-1 6H4zM9 20v-5h6v5",
  download: "M12 4v11M7 10l5 5 5-5M4 20h16",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2M14 18h2v2M18 18h2v2h-2",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01",
  warning: "M12 3l10 18H2zM12 10v5M12 18h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
  plus: "M12 5v14M5 12h14",
  pin: "M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  tag: "M3 12V3h9l9 9-9 9zM7.5 7.5h.01",
  zoom: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5M11 8v6M8 11h6",
  file: "M6 3h8l4 4v14H6zM14 3v4h4",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  upload: "M12 16V5M7 10l5-5 5 5M4 20h16",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  crm: "M4 5h16v10H4zM8 19h8M12 15v4M8 9h3M8 12h6",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
};

function icon(name, cls = "") {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON_PATHS[name] || ""}"/></svg>`;
}

// ---------- tiny utilities ----------

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function hashStr(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function wrap(text, maxChars) {
  const lines = [];
  let line = "";
  for (const w of String(text).split(/\s+/)) {
    if ((line + " " + w).trim().length > maxChars && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(lines, x, y, lh, attrs) {
  return `<text x="${x}" y="${y}" ${attrs}>${lines.map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join("")}</text>`;
}

// ---------- photography (400 × 300 scenes) ----------

const PHOTO_DEFS = `
  <linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb0d8"/><stop offset="1" stop-color="#dfeaf2"/></linearGradient>
  <linearGradient id="ph-lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ea55a"/><stop offset="1" stop-color="#4f773a"/></linearGradient>
  <linearGradient id="ph-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1ece2"/><stop offset="1" stop-color="#ddd5c6"/></linearGradient>
  <linearGradient id="ph-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7b0"/><stop offset="1" stop-color="#e9b867"/></linearGradient>
  <linearGradient id="ph-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c39467"/><stop offset="1" stop-color="#9c6d45"/></linearGradient>
  <linearGradient id="ph-window" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7e9f5"/><stop offset="1" stop-color="#a9cbb0"/></linearGradient>
  <linearGradient id="ph-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></linearGradient>
  <radialGradient id="ph-light" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

function sceneExterior() {
  let siding = "";
  for (let y = 138; y < 222; y += 7) siding += `<line x1="112" y1="${y}" x2="268" y2="${y}" stroke="#d6cdbd" stroke-width="1"/>`;
  return `
    <rect width="400" height="300" fill="url(#ph-sky)"/>
    <ellipse cx="60" cy="40" rx="70" ry="14" fill="#fff" opacity=".5"/>
    <ellipse cx="310" cy="28" rx="60" ry="10" fill="#fff" opacity=".45"/>
    <ellipse cx="370" cy="150" rx="60" ry="45" fill="#47683f"/><ellipse cx="320" cy="160" rx="40" ry="30" fill="#55784a"/>
    <ellipse cx="90" cy="165" rx="50" ry="30" fill="#557a4a"/>
    <rect x="40" y="120" width="11" height="105" fill="#5a4634"/>
    <circle cx="30" cy="105" r="42" fill="#3f6237"/><circle cx="70" cy="90" r="38" fill="#4b7141"/><circle cx="48" cy="70" r="30" fill="#5a8150"/>
    <polygon points="112,135 112,224 268,224 268,135 190,88" fill="url(#ph-wall)"/>
    ${siding}
    <polygon points="98,140 190,72 282,140 272,140 190,84 108,140" fill="#41464e"/>
    <polygon points="186,80 196,80 196,62 186,62" fill="#6b5446"/>
    <rect x="268" y="150" width="78" height="74" fill="#e8e1d4"/>
    <polygon points="262,152 307,122 352,152" fill="#4a4f57"/>
    <rect x="276" y="168" width="62" height="56" fill="#d6cdbc"/>
    ${[178, 190, 202, 214].map((y) => `<line x1="276" y1="${y}" x2="338" y2="${y}" stroke="#c4baa7"/>`).join("")}
    <polygon points="140,168 190,138 240,168" fill="#555b63"/>
    <rect x="146" y="168" width="88" height="6" fill="#fff"/>
    <rect x="150" y="174" width="5" height="46" fill="#fff"/><rect x="225" y="174" width="5" height="46" fill="#fff"/>
    <rect x="180" y="182" width="22" height="40" fill="#35513f"/><rect x="185" y="187" width="12" height="10" fill="url(#ph-glow)"/>
    <circle cx="198" cy="204" r="1.4" fill="#d9c27a"/>
    <rect x="122" y="152" width="22" height="30" fill="url(#ph-glow)" stroke="#fff" stroke-width="2.5"/>
    <rect x="236" y="152" width="22" height="30" fill="url(#ph-glow)" stroke="#fff" stroke-width="2.5"/>
    <line x1="133" y1="152" x2="133" y2="182" stroke="#fff" stroke-width="1.5"/><line x1="247" y1="152" x2="247" y2="182" stroke="#fff" stroke-width="1.5"/>
    <rect x="178" y="110" width="24" height="18" fill="url(#ph-glow)" stroke="#fff" stroke-width="2"/>
    <rect x="146" y="220" width="88" height="6" fill="#cfc5b3"/>
    <rect y="224" width="400" height="76" fill="url(#ph-lawn)"/>
    <polygon points="182,226 200,226 236,300 152,300" fill="#d9d1c1"/>
    <polygon points="276,226 338,226 360,300 262,300" fill="#c7c1b5"/>
    <ellipse cx="128" cy="226" rx="22" ry="9" fill="#3d6636"/><ellipse cx="160" cy="228" rx="14" ry="7" fill="#46713d"/>
    <ellipse cx="250" cy="227" rx="16" ry="8" fill="#3d6636"/>
    <ellipse cx="200" cy="290" rx="260" ry="18" fill="#000" opacity=".06"/>
    <rect width="400" height="300" fill="url(#ph-light)"/>`;
}

function sceneLiving() {
  let planks = "";
  for (let x = -40; x < 440; x += 34) planks += `<line x1="${x}" y1="210" x2="${x + 60}" y2="300" stroke="#8d6040" stroke-width="1" opacity=".5"/>`;
  return `
    <rect width="400" height="210" fill="#eee7dc"/>
    <rect x="0" y="0" width="400" height="14" fill="#e2d9cb"/>
    <rect x="200" y="34" width="168" height="140" fill="url(#ph-window)" stroke="#fff" stroke-width="6"/>
    <line x1="284" y1="34" x2="284" y2="174" stroke="#fff" stroke-width="4"/>
    <ellipse cx="330" cy="150" rx="40" ry="24" fill="#86a874" opacity=".7"/><ellipse cx="240" cy="160" rx="30" ry="16" fill="#86a874" opacity=".6"/>
    <rect y="210" width="400" height="90" fill="url(#ph-floor)"/>${planks}
    <ellipse cx="190" cy="262" rx="150" ry="26" fill="#ddd2bd"/>
    <rect x="40" y="168" width="200" height="56" rx="8" fill="#7d8e9a"/>
    <rect x="34" y="150" width="22" height="70" rx="8" fill="#6e7f8b"/><rect x="224" y="150" width="22" height="70" rx="8" fill="#6e7f8b"/>
    <rect x="56" y="140" width="80" height="44" rx="8" fill="#8c9ca7"/><rect x="142" y="140" width="80" height="44" rx="8" fill="#8c9ca7"/>
    <rect x="70" y="150" width="30" height="24" rx="5" fill="#d9b88a"/><rect x="180" y="150" width="30" height="24" rx="5" fill="#e3d6c3"/>
    <rect x="120" y="242" width="110" height="10" rx="3" fill="#6b4b33"/><rect x="128" y="252" width="6" height="18" fill="#6b4b33"/><rect x="216" y="252" width="6" height="18" fill="#6b4b33"/>
    <line x1="350" y1="90" x2="350" y2="250" stroke="#3a3a3a" stroke-width="3"/>
    <polygon points="330,90 370,90 362,62 338,62" fill="#f3e3c3"/>
    <rect x="18" y="214" width="26" height="30" fill="#b8a48a"/><ellipse cx="31" cy="200" rx="20" ry="26" fill="#557a48"/>
    <rect x="70" y="56" width="90" height="62" fill="#c7b59c" stroke="#fff" stroke-width="4"/>
    <rect width="400" height="300" fill="url(#ph-light)"/>`;
}

function sceneKitchen() {
  let tiles = "";
  for (let x = 0; x < 400; x += 16) tiles += `<line x1="${x}" y1="96" x2="${x}" y2="150" stroke="#d3d8dc"/>`;
  return `
    <rect width="400" height="300" fill="#f2efe9"/>
    <rect x="0" y="20" width="400" height="76" fill="#fbfaf8"/>
    ${[0, 66, 132, 268, 334].map((x) => `<rect x="${x + 4}" y="24" width="58" height="68" fill="#fff" stroke="#d7d3cc"/><rect x="${x + 50}" y="52" width="3" height="14" fill="#a8a29a"/>`).join("")}
    <rect x="200" y="28" width="64" height="60" fill="url(#ph-window)" stroke="#fff" stroke-width="4"/>
    <rect x="0" y="96" width="400" height="54" fill="#e6e9ec"/>${tiles}
    <rect x="0" y="150" width="400" height="10" fill="#f8f6f2"/>
    <rect x="0" y="160" width="400" height="70" fill="#435468"/>
    ${[0, 80, 160, 240, 320].map((x) => `<rect x="${x + 6}" y="166" width="68" height="58" fill="none" stroke="#56687d"/>`).join("")}
    <rect y="230" width="400" height="70" fill="#d9cbb5"/>
    <rect x="90" y="196" width="220" height="12" fill="#faf8f4"/>
    <rect x="96" y="208" width="208" height="70" fill="#fdfcfa" stroke="#e1dcd3"/>
    ${[124, 200, 276].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="120" stroke="#2a2a2a"/><path d="M${x - 14} 132 a14 14 0 0 1 28 0 z" fill="#2a2a2a"/><ellipse cx="${x}" cy="134" rx="10" ry="3" fill="#ffd98e"/>`).join("")}
    ${[130, 200, 270].map((x) => `<rect x="${x - 10}" y="250" width="20" height="6" fill="#6b4b33"/><line x1="${x - 7}" y1="256" x2="${x - 9}" y2="292" stroke="#2b2b2b" stroke-width="2"/><line x1="${x + 7}" y1="256" x2="${x + 9}" y2="292" stroke="#2b2b2b" stroke-width="2"/>`).join("")}
    <ellipse cx="300" cy="192" rx="16" ry="6" fill="#d39a4a"/><circle cx="294" cy="188" r="5" fill="#e6c14f"/><circle cx="304" cy="187" r="5" fill="#9cbf4a"/>
    <rect width="400" height="300" fill="url(#ph-light)"/>`;
}

function sceneBackyard() {
  let fence = "";
  for (let x = 0; x < 400; x += 14) fence += `<rect x="${x}" y="120" width="12" height="80" fill="${x % 28 ? "#a7835e" : "#9c7853"}"/>`;
  return `
    <rect width="400" height="300" fill="url(#ph-sky)"/>
    <circle cx="330" cy="70" r="70" fill="#4b7141"/><circle cx="380" cy="100" r="50" fill="#3f6237"/>
    ${fence}
    <rect y="200" width="400" height="100" fill="url(#ph-lawn)"/>
    <polygon points="60,210 340,210 400,300 0,300" fill="#cdbfa9"/>
    ${[230, 250, 272].map((y) => `<line x1="0" y1="${y}" x2="400" y2="${y}" stroke="#bbad96"/>`).join("")}
    <path d="M0 40 Q100 80 200 50 T400 60" fill="none" stroke="#333" stroke-width="1"/>
    ${[20, 60, 100, 140, 180, 220, 260, 300, 340, 380].map((x, i) => `<circle cx="${x}" cy="${52 + Math.sin(i) * 9}" r="3" fill="#ffe08a"/>`).join("")}
    <line x1="200" y1="110" x2="200" y2="240" stroke="#5a4634" stroke-width="3"/>
    <path d="M130 130 Q200 80 270 130 Z" fill="#2f5d62"/>
    <ellipse cx="200" cy="238" rx="56" ry="10" fill="#6b4b33"/>
    <rect x="128" y="226" width="20" height="30" fill="#3b3b3b"/><rect x="252" y="226" width="20" height="30" fill="#3b3b3b"/>
    <ellipse cx="60" cy="214" rx="40" ry="14" fill="#3d6636"/>
    <rect width="400" height="300" fill="url(#ph-light)"/>`;
}

const SCENES = { exterior: sceneExterior, living: sceneLiving, kitchen: sceneKitchen, backyard: sceneBackyard };

function photo(scene, x, y, w, h) {
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${SCENES[scene]()}</svg>`;
}

function photoThumb(scene, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs>${PHOTO_DEFS}</defs>${SCENES[scene]()}</svg>`;
}

function headshot(cx, cy, r) {
  return `<g><clipPath id="hs-${cx}-${cy}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <g clip-path="url(#hs-${cx}-${cy})">
      <rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="#c8d5de"/>
      <ellipse cx="${cx}" cy="${cy + r * 0.95}" rx="${r * 0.85}" ry="${r * 0.55}" fill="#2f3d4c"/>
      <polygon points="${cx - r * 0.18},${cy + r * 0.45} ${cx + r * 0.18},${cy + r * 0.45} ${cx},${cy + r * 0.75}" fill="#fff"/>
      <rect x="${cx - r * 0.13}" y="${cy + r * 0.12}" width="${r * 0.26}" height="${r * 0.35}" fill="#c8977a"/>
      <ellipse cx="${cx}" cy="${cy - r * 0.1}" rx="${r * 0.33}" ry="${r * 0.4}" fill="#d9a888"/>
      <path d="M${cx - r * 0.36} ${cy - r * 0.12} Q${cx - r * 0.4} ${cy - r * 0.62} ${cx} ${cy - r * 0.58} Q${cx + r * 0.42} ${cy - r * 0.6} ${cx + r * 0.36} ${cy - r * 0.1} Q${cx + r * 0.2} ${cy - r * 0.42} ${cx - r * 0.36} ${cy - r * 0.12}Z" fill="#3a2a20"/>
    </g></g>`;
}

function cedarLogo(x, y, color, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <polygon points="0,26 12,0 24,26" fill="${color}"/><rect x="10.5" y="26" width="3" height="6" fill="${color}"/>
    <text x="32" y="16" font-family="Source Sans 3, Arial" font-weight="700" font-size="15" letter-spacing="3" fill="${color}">CEDAR</text>
    <text x="32" y="31" font-family="Source Sans 3, Arial" font-size="10" letter-spacing="4.2" fill="${color}">REALTY</text></g>`;
}

// ---------- QR code (decorative, seeded from the URL) ----------

function qrCode(url, x, y, size, fg = "#111") {
  const n = 25;
  const m = size / n;
  const rnd = seeded(hashStr(url));
  const finder = (r, c) => {
    for (const [fr, fc] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      const dr = r - fr, dc = c - fc;
      if (dr >= -1 && dr <= 7 && dc >= -1 && dc <= 7) {
        if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return 0;
        if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return 1;
        return dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4 ? 1 : 0;
      }
    }
    return -1;
  };
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const f = finder(r, c);
      const on = f === -1 ? (r === 6 || c === 6 ? (r + c) % 2 === 0 : rnd() > 0.52) : f === 1;
      if (on) d += `M${(x + c * m).toFixed(2)} ${(y + r * m).toFixed(2)}h${m.toFixed(2)}v${m.toFixed(2)}h-${m.toFixed(2)}z`;
    }
  }
  return `<rect x="${x - m}" y="${y - m}" width="${size + 2 * m}" height="${size + 2 * m}" fill="#fff"/><path d="${d}" fill="${fg}"/>`;
}

function qrThumb(url) {
  return `<svg class="qr-thumb" viewBox="-2 -2 54 54">${qrCode(url, 0, 0, 50)}</svg>`;
}

// ---------- proofs ----------

const SERIF = `font-family="Playfair Display, Georgia, serif"`;
const SANS = `font-family="Source Sans 3, Arial, sans-serif"`;

function tplOf(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

function agentFooter(ctx, x, y, w, h, opts = {}) {
  const { qr } = ctx;
  const bg = opts.bg || "#f3f1ec";
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>
    ${headshot(x + 70, y + h / 2, 44)}
    <text x="${x + 132}" y="${y + h / 2 - 14}" ${SANS} font-size="26" font-weight="700" fill="#1f2328">${esc(AGENT.name)}</text>
    <text x="${x + 132}" y="${y + h / 2 + 12}" ${SANS} font-size="17" fill="#555">${esc(AGENT.title)} · ${esc(AGENT.company)}</text>
    <text x="${x + 132}" y="${y + h / 2 + 36}" ${SANS} font-size="17" fill="#555">${esc(AGENT.phone)} · ${esc(AGENT.email)}</text>
    ${qr ? `${qrCode(qr, x + w - 118, y + 14, 84)}<text x="${x + w - 76}" y="${y + h - 8}" ${SANS} font-size="12" text-anchor="middle" fill="#555" letter-spacing="1">SCAN FOR PHOTOS</text>` : ""}`;
}

function statsRow(L, x, y, w, color) {
  const items = [[L.beds, "BEDS"], [L.baths, "BATHS"], [L.sqft, "SQ FT"]];
  const cw = w / 3;
  return items
    .map(([v, k], i) => `<text x="${x + cw * i + cw / 2}" y="${y}" ${SANS} text-anchor="middle" font-size="30" font-weight="700" fill="${color}">${v}<tspan font-size="15" font-weight="600" dx="8" fill="#666" letter-spacing="2">${k}</tspan></text>`)
    .join("") + `<line x1="${x + cw}" y1="${y - 28}" x2="${x + cw}" y2="${y + 8}" stroke="#ddd"/><line x1="${x + 2 * cw}" y1="${y - 28}" x2="${x + 2 * cw}" y2="${y + 8}" stroke="#ddd"/>`;
}

function flyerFront(ctx) {
  const { L, tpl, text } = ctx;
  const a = tpl.accent;
  const headline = (text.headline || "Just Listed").toUpperCase();
  let body = `<rect width="850" height="1100" fill="#fff"/>`;
  if (tpl.id === "bleed") {
    body += photo(ctx.photos[0], 0, 0, 850, 820) + `<rect width="850" height="820" fill="url(#ph-shade)"/>`;
    body += `<rect x="40" y="40" width="${headline.length * 17 + 40}" height="46" fill="#fff"/><text x="60" y="72" ${SANS} font-size="22" font-weight="700" letter-spacing="5" fill="${a}">${esc(headline)}</text>`;
    body += cedarLogo(660, 44, "#fff", 1.4);
    body += `<text x="50" y="700" ${SERIF} font-size="56" fill="#fff">${esc(L.street)}</text><text x="52" y="740" ${SANS} font-size="22" fill="#eee">${esc(L.city)}</text>`;
    body += `<text x="800" y="740" ${SERIF} font-size="44" text-anchor="end" fill="#fff">${esc(text.price || L.price)}</text>`;
    body += `<text x="52" y="790" ${SANS} font-size="20" fill="#fff" letter-spacing="2">${L.beds} BEDS · ${L.baths} BATHS · ${L.sqft} SQ FT</text>`;
    body += textLines(wrap(text.blurb || L.blurb, 70), 50, 870, 27, `${SANS} font-size="19" fill="#333"`);
  } else if (tpl.id === "grid") {
    body += `<rect width="850" height="80" fill="${a}"/><text x="50" y="52" ${SANS} font-size="24" font-weight="700" letter-spacing="6" fill="#fff">${esc(headline)}</text>${cedarLogo(660, 24, "#fff", 1.1)}`;
    body += photo(ctx.photos[0], 0, 80, 560, 440) + photo(ctx.photos[1], 566, 80, 284, 217) + photo(ctx.photos[2], 566, 303, 284, 217);
    body += `<text x="50" y="590" ${SERIF} font-size="44" fill="#222">${esc(L.street)}</text><text x="52" y="624" ${SANS} font-size="19" fill="#666">${esc(L.city)}</text>`;
    body += `<text x="800" y="596" ${SERIF} font-size="40" text-anchor="end" fill="${a}">${esc(text.price || L.price)}</text>`;
    body += statsRow(L, 50, 700, 750, "#222") + `<line x1="50" y1="652" x2="800" y2="652" stroke="#e3e3e3"/>`;
    body += textLines(wrap(text.blurb || L.blurb, 70), 50, 770, 27, `${SANS} font-size="19" fill="#333"`);
    body += L.features.slice(0, 4).map((f, i) => `<text x="${i % 2 ? 450 : 50}" y="${900 + Math.floor(i / 2) * 32}" ${SANS} font-size="18" fill="#333"><tspan fill="${a}">■ </tspan>${esc(f)}</text>`).join("");
  } else {
    body += `<rect width="850" height="80" fill="${a}"/><text x="50" y="52" ${SANS} font-size="24" font-weight="700" letter-spacing="6" fill="#fff">${esc(headline)}</text>${cedarLogo(660, 24, "#fff", 1.1)}`;
    body += photo(ctx.photos[0], 0, 80, 850, 520);
    if (tpl.id === "openhouse") {
      body += `<rect x="0" y="540" width="850" height="60" fill="${a}" opacity=".94"/><text x="425" y="580" ${SANS} text-anchor="middle" font-size="24" font-weight="700" letter-spacing="4" fill="#fff">OPEN HOUSE · SAT, NOV 7 · 1–4 PM</text>`;
    }
    body += `<text x="50" y="670" ${SERIF} font-size="46" fill="#222">${esc(L.street)}</text><text x="52" y="706" ${SANS} font-size="19" fill="#666">${esc(L.city)}</text>`;
    body += `<text x="800" y="672" ${SERIF} font-size="40" text-anchor="end" fill="${a}">${esc(text.price || L.price)}</text>`;
    body += `<line x1="50" y1="736" x2="800" y2="736" stroke="#e3e3e3"/>` + statsRow(L, 50, 782, 750, "#222") + `<line x1="50" y1="806" x2="800" y2="806" stroke="#e3e3e3"/>`;
    body += textLines(wrap(text.blurb || L.blurb, 44), 50, 850, 26, `${SANS} font-size="18" fill="#333"`);
    body += L.features.slice(0, 4).map((f, i) => `<text x="530" y="${850 + i * 30}" ${SANS} font-size="17" fill="#333"><tspan fill="${a}">■ </tspan>${esc(f)}</text>`).join("");
  }
  body += agentFooter(ctx, 0, 975, 850, 125);
  return body;
}

function flyerBack(ctx) {
  const { L, tpl } = ctx;
  const a = tpl.accent;
  return `<rect width="850" height="1100" fill="#fff"/>
    <text x="50" y="90" ${SERIF} font-size="44" fill="#222">Inside ${esc(L.street)}</text>
    <rect x="50" y="110" width="80" height="4" fill="${a}"/>
    ${photo("living", 50, 150, 368, 260)}${photo("kitchen", 432, 150, 368, 260)}
    ${photo("backyard", 50, 424, 368, 260)}${photo(ctx.photos[0], 432, 424, 368, 260)}
    <text x="50" y="740" ${SANS} font-size="16" font-weight="700" letter-spacing="3" fill="${a}">HOME HIGHLIGHTS</text>
    ${L.features.map((f, i) => `<text x="${i % 2 ? 432 : 50}" y="${782 + Math.floor(i / 2) * 34}" ${SANS} font-size="19" fill="#333"><tspan fill="${a}">■ </tspan>${esc(f)}</text>`).join("")}
    <text x="50" y="900" ${SANS} font-size="18" fill="#555">Schedule a private tour — call or text ${esc(AGENT.phone)}</text>
    ${agentFooter(ctx, 0, 975, 850, 125)}`;
}

function brochureOutside(ctx) {
  const { L, tpl, text } = ctx;
  const a = tpl.accent;
  return `<rect width="1700" height="1100" fill="#fff"/>
    <rect width="850" height="1100" fill="#f5f3ee"/>
    ${headshot(425, 250, 110)}
    <text x="425" y="420" ${SANS} text-anchor="middle" font-size="34" font-weight="700" fill="#222">${esc(AGENT.name)}</text>
    <text x="425" y="456" ${SANS} text-anchor="middle" font-size="20" fill="#666">${esc(AGENT.title)} · ${esc(AGENT.company)}</text>
    <text x="425" y="510" ${SANS} text-anchor="middle" font-size="22" fill="#333">${esc(AGENT.phone)}</text>
    <text x="425" y="542" ${SANS} text-anchor="middle" font-size="20" fill="#333">${esc(AGENT.email)}</text>
    ${textLines(wrap("Jordan has helped Austin families buy and sell homes in Bouldin, Zilker, and Travis Heights for over a decade.", 52), 140, 620, 30, `${SANS} font-size="20" fill="#555"`)}
    ${ctx.qr ? qrCode(ctx.qr, 365, 760, 120) + `<text x="425" y="915" ${SANS} text-anchor="middle" font-size="14" letter-spacing="2" fill="#555">SCAN FOR THE FULL TOUR</text>` : ""}
    ${cedarLogo(350, 990, a, 1.3)}
    ${brochureCover(ctx)}
    <line x1="850" y1="0" x2="850" y2="1100" stroke="#999" stroke-dasharray="8 8"/>`;
}

function brochureCover(ctx) {
  const { L, tpl, text } = ctx;
  const a = tpl.accent;
  const headline = esc((text.headline || "Just Listed").toUpperCase());
  const price = esc(text.price || L.price);
  const stats = `${L.beds} BD · ${L.baths} BA · ${L.sqft} SF`;
  if (tpl.id === "bleed") {
    return `${photo(ctx.photos[0], 850, 0, 850, 1100)}<rect x="850" width="850" height="1100" fill="url(#ph-shade)"/>
      <text x="900" y="80" ${SANS} font-size="26" font-weight="700" letter-spacing="7" fill="#fff">${headline}</text>
      <text x="900" y="900" ${SERIF} font-size="62" fill="#fff">${esc(L.street)}</text>
      <text x="902" y="945" ${SANS} font-size="24" fill="#eee">${esc(L.city)}</text>
      <text x="902" y="1030" ${SERIF} font-size="46" fill="#fff">${price}</text>
      <text x="1650" y="1030" ${SANS} text-anchor="end" font-size="22" fill="#fff" letter-spacing="2">${stats}</text>`;
  }
  const top = `<rect x="850" width="850" height="90" fill="${a}"/>
    <text x="900" y="58" ${SANS} font-size="26" font-weight="700" letter-spacing="7" fill="#fff">${headline}</text>`;
  const details = `<text x="900" y="880" ${SERIF} font-size="58" fill="#222">${esc(L.street)}</text>
    <text x="902" y="925" ${SANS} font-size="24" fill="#666">${esc(L.city)}</text>
    <text x="902" y="1000" ${SERIF} font-size="44" fill="${a}">${price}</text>
    <text x="1650" y="1000" ${SANS} text-anchor="end" font-size="22" fill="#555" letter-spacing="2">${stats}</text>`;
  if (tpl.id === "grid") {
    return top + photo(ctx.photos[0], 850, 90, 850, 470) + photo("living", 850, 566, 422, 224) + photo("kitchen", 1278, 566, 422, 224) + details;
  }
  const banner = tpl.id === "openhouse"
    ? `<rect x="850" y="720" width="850" height="70" fill="${a}" opacity=".94"/><text x="1275" y="766" ${SANS} text-anchor="middle" font-size="28" font-weight="700" letter-spacing="4" fill="#fff">OPEN HOUSE · SAT, NOV 7 · 1–4 PM</text>`
    : "";
  return top + photo(ctx.photos[0], 850, 90, 850, 700) + banner + details;
}

function brochureInside(ctx) {
  const { L, tpl, text } = ctx;
  const a = tpl.accent;
  return `<rect width="1700" height="1100" fill="#fff"/>
    <text x="70" y="100" ${SERIF} font-size="46" fill="#222">Welcome home</text>
    <rect x="70" y="122" width="80" height="4" fill="${a}"/>
    ${textLines(wrap(text.blurb || L.blurb, 62), 70, 180, 32, `${SANS} font-size="22" fill="#444"`)}
    ${photo("living", 70, 330, 710, 360)}
    ${photo("kitchen", 70, 704, 350, 330)}${photo("backyard", 430, 704, 350, 330)}
    ${photo(ctx.photos[0], 920, 70, 710, 420)}
    <text x="920" y="560" ${SANS} font-size="18" font-weight="700" letter-spacing="3" fill="${a}">HOME HIGHLIGHTS</text>
    ${L.features.map((f, i) => `<text x="920" y="${610 + i * 40}" ${SANS} font-size="23" fill="#333"><tspan fill="${a}">■ </tspan>${esc(f)}</text>`).join("")}
    ${statsRow(L, 920, 840, 710, "#222")}
    <rect x="920" y="900" width="710" height="130" fill="#f3f1ec"/>
    <text x="950" y="955" ${SANS} font-size="24" font-weight="700" fill="#222">Schedule a private tour</text>
    <text x="950" y="992" ${SANS} font-size="20" fill="#555">${esc(AGENT.name)} · ${esc(AGENT.phone)}</text>
    <line x1="850" y1="0" x2="850" y2="1100" stroke="#999" stroke-dasharray="8 8"/>`;
}

function postcardFront(ctx) {
  const { L, tpl, text } = ctx;
  return `<rect width="900" height="600" fill="#fff"/>${photo(ctx.photos[0], 0, 0, 900, 470)}
    <rect y="470" width="900" height="130" fill="${tpl.accent}"/>
    <text x="40" y="520" ${SANS} font-size="20" font-weight="700" letter-spacing="5" fill="#fff">${esc((text.headline || "Just Listed").toUpperCase())}</text>
    <text x="40" y="568" ${SERIF} font-size="38" fill="#fff">${esc(L.street)}</text>
    <text x="860" y="568" ${SERIF} font-size="34" text-anchor="end" fill="#fff">${esc(text.price || L.price)}</text>`;
}

function postcardBack(ctx) {
  const { L } = ctx;
  return `<rect width="900" height="600" fill="#fff"/>
    <text x="40" y="70" ${SERIF} font-size="30" fill="#222">New on your street</text>
    ${textLines(wrap(`${L.street} just hit the market. ${L.beds} beds, ${L.baths} baths, ${L.sqft} sq ft. Curious what your home is worth? Let's talk.`, 40), 40, 116, 26, `${SANS} font-size="18" fill="#444"`)}
    ${headshot(90, 420, 46)}
    <text x="152" y="410" ${SANS} font-size="22" font-weight="700" fill="#222">${esc(AGENT.name)}</text>
    <text x="152" y="436" ${SANS} font-size="16" fill="#555">${esc(AGENT.phone)}</text>
    ${ctx.qr ? qrCode(ctx.qr, 330, 380, 80) : ""}
    <line x1="460" y1="30" x2="460" y2="570" stroke="#ddd"/>
    <rect x="740" y="30" width="130" height="80" fill="none" stroke="#999"/>
    <text x="805" y="62" ${SANS} text-anchor="middle" font-size="12" fill="#777">PRSRT STD</text><text x="805" y="80" ${SANS} text-anchor="middle" font-size="12" fill="#777">U.S. POSTAGE PAID</text>
    ${["Current Resident", "1234 Recipient Address", "Austin, TX 78704"].map((l, i) => `<text x="520" y="${330 + i * 30}" ${SANS} font-size="19" fill="#999">${l}</text>`).join("")}`;
}

const PROOF_SIZES = { flyers: [850, 1100], brochures: [1700, 1100], postcards: [900, 600] };

function proofSVG(productId, sideIdx, ctx, cls = "proof-svg") {
  const [w, h] = PROOF_SIZES[productId];
  const fn = {
    flyers: [flyerFront, flyerBack],
    brochures: [brochureOutside, brochureInside],
    postcards: [postcardFront, postcardBack],
  }[productId][sideIdx];
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${PRODUCTS[productId].name} proof"><defs>${PHOTO_DEFS}</defs>${fn(ctx)}</svg>`;
}

// ---------- radius map ----------

const MAP_W = 640;
const MAP_H = 440;
const PX_PER_MILE = 420;
const MAP_CENTER = { x: 322, y: 250 };
const H_STREETS = ["Annie St", "Mary St", "Johanna St", "Monroe St", "Gibson St", "Willow Ln", "Elizabeth St", "Milton St", "Live Oak St", "Oltorf St"];
const V_STREETS = ["S 1st St", "Eva St", "Newning Ave", "Bouldin Ave", "S 3rd St", "Kinney Ave", "Wilson St", "S 5th St", "Garden St", "Lamar Blvd", "Dawson Rd", "Evergreen Ave"];
const hY = (i) => 22 + i * 47.5;
const vX = (j) => 28 + j * 56;
const PARK = { x: 30, y: 30, w: 120, h: 80 };

let HOMES_CACHE = null;

function allHomes() {
  if (HOMES_CACHE) return HOMES_CACHE;
  const rnd = seeded(7104);
  const homes = [];
  H_STREETS.forEach((street, i) => {
    const y0 = hY(i);
    for (const side of [-1, 1]) {
      for (let x = 8; x < MAP_W - 4; x += 12) {
        if (V_STREETS.some((_, j) => Math.abs(x - vX(j)) < 9)) continue;
        const y = y0 + side * 9;
        if (x > PARK.x - 4 && x < PARK.x + PARK.w + 4 && y > PARK.y - 4 && y < PARK.y + PARK.h + 4) continue;
        const num = 128 + Math.round((x - 322) / 12) * 4 + (side > 0 ? 1 : 0);
        homes.push({ x, y, street, num, type: rnd() < 0.24 ? "multi" : "single" });
      }
    }
  });
  let target = homes[0];
  for (const h of homes) if (Math.hypot(h.x - MAP_CENTER.x, h.y - MAP_CENTER.y) < Math.hypot(target.x - MAP_CENTER.x, target.y - MAP_CENTER.y)) target = h;
  Object.assign(target, { num: 128, street: "Willow Ln", type: "single", target: true });
  for (const h of homes) {
    h.dist = Math.hypot(h.x - target.x, h.y - target.y) / PX_PER_MILE;
    h.addr = `${h.num} ${h.street}`;
  }
  HOMES_CACHE = homes;
  return homes;
}

function radiusResult(r) {
  const homes = allHomes();
  const pool = homes
    .filter((h) => r.type === "both" || h.type === r.type)
    .filter((h) => !(r.excludeTarget && h.target))
    .sort((p, q) => p.dist - q.dist);
  const qty = Math.max(0, Number(r.qty) || 0);
  const picked = pool.slice(0, qty);
  return {
    available: pool.length,
    picked,
    radius: picked.length ? picked[picked.length - 1].dist : 0,
    short: qty > pool.length,
  };
}

function mapSVG(result) {
  const homes = allHomes();
  const pickedSet = new Set(result.picked);
  const target = homes.find((h) => h.target);
  const dot = (h) => (h.type === "multi" ? `M${h.x - 2.4} ${h.y - 2.4}h4.8v4.8h-4.8z` : `M${h.x - 2.4} ${h.y}a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0z`);
  let off = "", on = "";
  for (const h of homes) {
    if (h.target) continue;
    if (pickedSet.has(h)) on += dot(h);
    else off += dot(h);
  }
  const rPx = result.radius * PX_PER_MILE + 6;
  return `<svg class="map-svg" viewBox="0 0 ${MAP_W} ${MAP_H}" role="img" aria-label="Map of selected homes">
    <rect width="${MAP_W}" height="${MAP_H}" fill="#eef0ea"/>
    <rect x="${PARK.x}" y="${PARK.y}" width="${PARK.w}" height="${PARK.h}" rx="6" fill="#cfe1c3"/>
    <text x="${PARK.x + PARK.w / 2}" y="${PARK.y + PARK.h / 2 + 4}" text-anchor="middle" class="map-label park">Bouldin Park</text>
    <path d="M0 330 C 80 300, 120 380, 200 360 S 300 420, 380 440" fill="none" stroke="#a9cbe0" stroke-width="7"/>
    ${H_STREETS.map((s, i) => `<line x1="0" y1="${hY(i)}" x2="${MAP_W}" y2="${hY(i)}" stroke="#fff" stroke-width="${i === 9 ? 9 : 5}"/>`).join("")}
    ${V_STREETS.map((s, j) => `<line x1="${vX(j)}" y1="0" x2="${vX(j)}" y2="${MAP_H}" stroke="${j === 0 || j === 9 ? "#f7e7b4" : "#fff"}" stroke-width="${j === 0 || j === 9 ? 9 : 5}"/>`).join("")}
    ${H_STREETS.map((s, i) => (i % 2 === 1 || i === 9 ? `<text x="${MAP_W - 8}" y="${hY(i) + 3.5}" text-anchor="end" class="map-label">${s}</text>` : "")).join("")}
    ${V_STREETS.map((s, j) => (j % 3 === 0 ? `<text transform="translate(${vX(j) + 3.5} ${MAP_H - 8}) rotate(-90)" class="map-label">${s}</text>` : "")).join("")}
    <path d="${off}" fill="#bcc2c9"/>
    ${result.picked.length ? `<circle cx="${target.x}" cy="${target.y}" r="${rPx}" fill="#2f7bc4" fill-opacity=".07" stroke="#2f7bc4" stroke-width="1.5" stroke-dasharray="5 4"/>` : ""}
    <path d="${on}" fill="#2f7bc4"/>
    <g transform="translate(${target.x} ${target.y})">
      <path d="M0 0 C -9 -10 -9 -22 0 -22 C 9 -22 9 -10 0 0Z" fill="#b3261e" stroke="#fff" stroke-width="1.5"/><circle cy="-15" r="3" fill="#fff"/>
    </g>
    <rect x="${target.x + 10}" y="${target.y - 34}" width="94" height="18" rx="2" fill="#fff" stroke="#c9ced4"/>
    <text x="${target.x + 57}" y="${target.y - 21.5}" text-anchor="middle" class="map-label strong">128 Willow Ln</text>
    <g transform="translate(16 ${MAP_H - 22})"><rect x="-6" y="-14" width="${PX_PER_MILE / 4 + 12}" height="24" fill="#fff" opacity=".85"/>
      <line x1="0" y1="0" x2="${PX_PER_MILE / 4}" y2="0" stroke="#333" stroke-width="2"/><line x1="0" y1="-4" x2="0" y2="4" stroke="#333" stroke-width="2"/><line x1="${PX_PER_MILE / 4}" y1="-4" x2="${PX_PER_MILE / 4}" y2="4" stroke="#333" stroke-width="2"/>
      <text x="${PX_PER_MILE / 8}" y="-4" text-anchor="middle" class="map-label">0.25 mi</text></g>
  </svg>`;
}
