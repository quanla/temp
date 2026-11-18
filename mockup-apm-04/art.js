// Illustrated "photography", agent portrait, logo and QR codes as inline SVG,
// so the prototype runs offline with no external images.
(function () {
  let uid = 0;
  const nid = () => `a${++uid}`;

  function exterior(dusk) {
    const g = nid();
    const c = dusk
      ? {
          sky: ['#34415d', '#8d7c8c', '#eeb17c'],
          far: '#3f4c47',
          wall: '#d9d3c7',
          wall2: '#cfc8bb',
          roof: '#24272b',
          win: ['#ffe2a3', '#f0a75a'],
          lawn: ['#4f6a46', '#33452f'],
          shrub: '#2f4430',
          tree: '#2c3e2c',
          path: '#b9ab98',
          garage: '#8f857a',
        }
      : {
          sky: ['#b9d1df', '#dde8ea', '#f5f0e6'],
          far: '#7f9a7a',
          wall: '#f6f4ef',
          wall2: '#ebe7df',
          roof: '#2b2f33',
          win: ['#9db8c6', '#e9f0f2'],
          lawn: ['#8fae73', '#6c8f56'],
          shrub: '#4e7343',
          tree: '#5d8150',
          path: '#ddd4c6',
          garage: '#d8d1c5',
        };
    const battens = Array.from({ length: 17 }, (_, i) => `<line x1="${146 + i * 8.5}" y1="${i < 9 ? 120 - i * 6 : 120 - (16 - i) * 6}" x2="${146 + i * 8.5}" y2="202"/>`).join('');
    const glow = dusk ? `<ellipse cx="214" cy="205" rx="90" ry="10" fill="#f6c27c" opacity=".25"/>` : '';
    return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky[0]}"/><stop offset=".6" stop-color="${c.sky[1]}"/><stop offset="1" stop-color="${c.sky[2]}"/></linearGradient>
<linearGradient id="${g}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.lawn[0]}"/><stop offset="1" stop-color="${c.lawn[1]}"/></linearGradient>
<linearGradient id="${g}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.win[0]}"/><stop offset="1" stop-color="${c.win[1]}"/></linearGradient>
</defs>
<rect width="400" height="260" fill="url(#${g}s)"/>
<g fill="${c.far}" opacity=".85"><ellipse cx="20" cy="150" rx="56" ry="44"/><ellipse cx="88" cy="138" rx="44" ry="50"/><ellipse cx="330" cy="140" rx="62" ry="48"/><ellipse cx="398" cy="150" rx="40" ry="40"/></g>
<rect y="196" width="400" height="64" fill="url(#${g}l)"/>
${glow}
<rect x="52" y="140" width="86" height="62" fill="${c.wall2}"/>
<rect x="46" y="134" width="98" height="7" fill="${c.roof}"/>
<rect x="64" y="152" width="28" height="34" fill="url(#${g}w)" stroke="#25282b" stroke-width="2.5"/>
<rect x="100" y="152" width="28" height="34" fill="url(#${g}w)" stroke="#25282b" stroke-width="2.5"/>
<polygon points="132,122 214,58 296,122" fill="${c.roof}"/>
<polygon points="142,122 214,66 286,122" fill="${c.wall}"/>
<rect x="142" y="120" width="144" height="82" fill="${c.wall}"/>
<g stroke="#000" stroke-opacity=".06" stroke-width="1">${battens}</g>
<circle cx="214" cy="98" r="9" fill="url(#${g}w)" stroke="#25282b" stroke-width="2.5"/>
<rect x="156" y="130" width="40" height="58" fill="url(#${g}w)" stroke="#25282b" stroke-width="2.5"/>
<line x1="176" y1="130" x2="176" y2="188" stroke="#25282b" stroke-width="2"/>
<rect x="232" y="130" width="40" height="58" fill="url(#${g}w)" stroke="#25282b" stroke-width="2.5"/>
<line x1="252" y1="130" x2="252" y2="188" stroke="#25282b" stroke-width="2"/>
<rect x="203" y="150" width="22" height="52" fill="#8a5a35"/>
<rect x="219" y="174" width="2" height="6" fill="#d9b36a"/>
<rect x="194" y="143" width="40" height="5" fill="${c.roof}"/>
<rect x="286" y="148" width="66" height="54" fill="${c.wall2}"/>
<rect x="280" y="142" width="78" height="7" fill="${c.roof}"/>
<rect x="296" y="160" width="46" height="42" fill="${c.garage}"/>
<g stroke="#000" stroke-opacity=".12">${[168, 176, 184, 192].map((y) => `<line x1="296" y1="${y}" x2="342" y2="${y}"/>`).join('')}</g>
<polygon points="206,202 222,202 252,260 182,260" fill="${c.path}"/>
<polygon points="296,202 342,202 372,260 300,260" fill="${c.path}" opacity=".7"/>
<g fill="${c.shrub}"><ellipse cx="160" cy="201" rx="20" ry="9"/><ellipse cx="260" cy="201" rx="22" ry="9"/><ellipse cx="80" cy="203" rx="26" ry="8"/><ellipse cx="190" cy="203" rx="10" ry="6"/></g>
<rect x="18" y="132" width="7" height="76" fill="#5a4636"/>
<g fill="${c.tree}"><ellipse cx="22" cy="112" rx="34" ry="30"/><ellipse cx="44" cy="96" rx="24" ry="22"/><ellipse cx="4" cy="96" rx="20" ry="20"/></g>
<rect x="374" y="118" width="8" height="92" fill="#5a4636"/>
<g fill="${c.tree}"><ellipse cx="378" cy="98" rx="42" ry="34"/><ellipse cx="352" cy="80" rx="26" ry="22"/><ellipse cx="398" cy="74" rx="24" ry="22"/></g>
</svg>`;
  }

  function living() {
    const g = nid();
    const planks = Array.from({ length: 9 }, (_, i) => `<line x1="${i * 50}" y1="196" x2="${i * 50 - 40}" y2="260"/>`).join('');
    return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3eee5"/><stop offset="1" stop-color="#e5dccd"/></linearGradient>
<linearGradient id="${g}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0e4"/><stop offset=".55" stop-color="#a9c49a"/><stop offset="1" stop-color="#7f9f6c"/></linearGradient>
<linearGradient id="${g}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c39467"/><stop offset="1" stop-color="#a77649"/></linearGradient>
<linearGradient id="${g}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset="1" stop-color="#fff6df" stop-opacity=".55"/></linearGradient>
</defs>
<rect width="400" height="200" fill="url(#${g}w)"/>
<rect x="228" y="22" width="150" height="160" fill="url(#${g}v)"/>
<g fill="#5f7f52" opacity=".8"><ellipse cx="260" cy="128" rx="30" ry="22"/><ellipse cx="350" cy="120" rx="34" ry="26"/></g>
<g stroke="#2b2b2b" stroke-width="4" fill="none"><rect x="228" y="22" width="150" height="160"/><line x1="303" y1="22" x2="303" y2="182"/><line x1="228" y1="100" x2="378" y2="100"/></g>
<rect x="0" y="196" width="400" height="64" fill="url(#${g}f)"/>
<g stroke="#000" stroke-opacity=".08">${planks}</g>
<rect x="196" y="0" width="204" height="260" fill="url(#${g}l)"/>
<polygon points="40,214 300,214 340,250 0,250" fill="#ebe3d4" opacity=".9"/>
<rect x="74" y="44" width="92" height="64" fill="#f8f5ee" stroke="#3a3530" stroke-width="3"/>
<circle cx="104" cy="78" r="16" fill="#d79c6b"/><rect x="118" y="62" width="36" height="34" fill="#6f8a76" opacity=".85"/>
<rect x="34" y="136" width="176" height="44" rx="10" fill="#cfc5b5"/>
<rect x="28" y="164" width="188" height="34" rx="9" fill="#d9d0c1"/>
<rect x="24" y="146" width="20" height="54" rx="8" fill="#c9bfae"/><rect x="200" y="146" width="20" height="54" rx="8" fill="#c9bfae"/>
<rect x="56" y="146" width="40" height="24" rx="6" fill="#6f8a76"/><rect x="150" y="146" width="40" height="24" rx="6" fill="#d8b98e"/>
<rect x="96" y="214" width="96" height="8" rx="3" fill="#5c4130"/><rect x="104" y="222" width="5" height="16" fill="#5c4130"/><rect x="180" y="222" width="5" height="16" fill="#5c4130"/>
<line x1="234" y1="120" x2="234" y2="214" stroke="#2b2b2b" stroke-width="2.5"/><polygon points="220,104 248,104 242,122 226,122" fill="#f1e5cc" stroke="#2b2b2b" stroke-width="1.5"/>
<rect x="338" y="200" width="26" height="26" rx="3" fill="#b9a68f"/><g fill="#55774a"><ellipse cx="342" cy="182" rx="10" ry="20"/><ellipse cx="358" cy="178" rx="9" ry="24"/><ellipse cx="350" cy="168" rx="7" ry="22"/></g>
</svg>`;
  }

  function kitchen() {
    const g = nid();
    return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5f2ec"/><stop offset="1" stop-color="#ebe6dd"/></linearGradient>
<linearGradient id="${g}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6e5ea"/><stop offset="1" stop-color="#9ebb8c"/></linearGradient>
</defs>
<rect width="400" height="260" fill="url(#${g}w)"/>
<rect x="150" y="40" width="100" height="70" fill="url(#${g}v)" stroke="#2b2b2b" stroke-width="3"/><line x1="200" y1="40" x2="200" y2="110" stroke="#2b2b2b" stroke-width="2"/>
<g fill="#fbfaf7" stroke="#d9d3c8"><rect x="16" y="30" width="58" height="76"/><rect x="74" y="30" width="58" height="76"/><rect x="268" y="30" width="58" height="76"/><rect x="326" y="30" width="58" height="76"/></g>
<g stroke="#000" stroke-opacity=".05">${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${118 + i * 6}" x2="400" y2="${118 + i * 6}"/>`).join('')}</g>
<rect x="0" y="150" width="400" height="8" fill="#f9f8f5"/>
<rect x="0" y="158" width="400" height="60" fill="#2f3e52"/>
<g stroke="#253244" stroke-width="2">${[60, 130, 200, 270, 340].map((x) => `<line x1="${x}" y1="160" x2="${x}" y2="216"/>`).join('')}</g>
<rect x="0" y="218" width="400" height="42" fill="#cfa983"/>
<rect x="80" y="182" width="240" height="10" fill="#fbfaf7"/><rect x="88" y="192" width="224" height="50" fill="#33445a"/>
<g fill="#c79a55"><rect x="118" y="208" width="4" height="40"/><rect x="198" y="208" width="4" height="40"/><rect x="278" y="208" width="4" height="40"/></g>
<g fill="#3a3530"><rect x="108" y="200" width="24" height="7" rx="3"/><rect x="188" y="200" width="24" height="7" rx="3"/><rect x="268" y="200" width="24" height="7" rx="3"/></g>
<g stroke="#2b2b2b" stroke-width="1.5"><line x1="140" y1="0" x2="140" y2="54"/><line x1="200" y1="0" x2="200" y2="20"/><line x1="260" y1="0" x2="260" y2="54"/></g>
<g fill="#c79a55"><path d="M128 66 a12 12 0 0 1 24 0z"/><path d="M248 66 a12 12 0 0 1 24 0z"/></g>
<g fill="#6a8a5b"><ellipse cx="56" cy="142" rx="10" ry="8"/><ellipse cx="62" cy="136" rx="7" ry="9"/></g><rect x="50" y="142" width="14" height="9" fill="#d8cdbd"/>
</svg>`;
  }

  function backyard() {
    const g = nid();
    return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd5e2"/><stop offset="1" stop-color="#f1eee4"/></linearGradient>
<linearGradient id="${g}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0dc"/><stop offset="1" stop-color="#3f97ad"/></linearGradient>
</defs>
<rect width="400" height="260" fill="url(#${g}s)"/>
<g fill="#6f8f62"><ellipse cx="40" cy="80" rx="60" ry="50"/><ellipse cx="370" cy="70" rx="60" ry="56"/></g>
<rect x="70" y="70" width="270" height="100" fill="#3b3f44"/>
<polygon points="60,72 205,30 350,72" fill="#25282b"/>
<g fill="#cfe0e6" stroke="#1f2225" stroke-width="3"><rect x="96" y="96" width="70" height="70"/><rect x="178" y="96" width="70" height="70"/><rect x="260" y="96" width="56" height="70"/></g>
<rect x="0" y="166" width="400" height="94" fill="#b98d62"/>
<g stroke="#000" stroke-opacity=".1">${Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="${170 + i * 9}" x2="400" y2="${170 + i * 9}"/>`).join('')}</g>
<rect x="40" y="190" width="250" height="56" rx="4" fill="url(#${g}p)" stroke="#e9e3d6" stroke-width="5"/>
<g stroke="#fff" stroke-opacity=".5" fill="none"><path d="M60 210 q20 -6 40 0 t40 0"/><path d="M150 228 q20 -6 40 0 t40 0"/></g>
<g fill="#f3efe6"><rect x="310" y="196" width="60" height="10" rx="3"/><polygon points="310,196 322,178 330,178 318,196"/></g>
<rect x="318" y="152" width="3" height="44" fill="#2b2b2b"/><path d="M290 156 q30 -22 60 0z" fill="#e7dcc8"/>
</svg>`;
  }

  const PHOTOS = {
    'exterior-day': () => exterior(false),
    'exterior-dusk': () => exterior(true),
    living,
    kitchen,
    backyard,
  };

  function portrait() {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<rect width="100" height="100" fill="#d7e0d9"/>
<path d="M10 104 C14 76 30 68 50 68 C70 68 86 76 90 104z" fill="#2f3b4a"/>
<path d="M42 68 L50 84 L58 68z" fill="#f2efe9"/>
<rect x="43" y="56" width="14" height="14" rx="5" fill="#b07a58"/>
<ellipse cx="50" cy="42" rx="16" ry="19" fill="#bf8862"/>
<path d="M33 40 C32 22 46 18 54 20 C64 20 70 28 67 42 C64 32 56 30 48 30 C40 30 36 34 33 40z" fill="#2a1f1a"/>
</svg>`;
  }

  function logo(color = 'currentColor') {
    return `<svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 1 L22 15 H16 L21 22 H3 L8 15 H2z" fill="${color}"/><rect x="10.8" y="22" width="2.4" height="5" fill="${color}"/></svg>`;
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    let s = seed || 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 10000) / 10000;
    };
  }

  // Looks like a QR code; not a scannable one.
  function qr(text, color = '#16181b') {
    const n = 25;
    const r = rng(hash(text));
    const finder = (x, y) =>
      `<rect x="${x}" y="${y}" width="7" height="7" fill="${color}"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="${color}"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    let cells = '';
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!inFinder(x, y) && r() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    }
    return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="${color}">${cells}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
  }

  window.APM_ART = {
    photo: (kind) => (PHOTOS[kind] || PHOTOS['exterior-day'])(),
    portrait,
    logo,
    qr,
    hash,
    rng,
  };
})();
