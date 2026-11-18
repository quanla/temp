// Illustrated "photography", icons, QR and map art. All inline SVG so the mockup works offline.

let artUid = 0;
const aid = (p) => `${p}${++artUid}`;

const ART = {
    exterior() {
        const sky = aid("sky"), lawn = aid("lawn"), win = aid("win"), sun = aid("sun");
        return `<svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Exterior of a renovated craftsman home">
<defs>
<linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fbfe0"/><stop offset=".6" stop-color="#e3edf0"/><stop offset="1" stop-color="#f6e4c8"/></linearGradient>
<linearGradient id="${lawn}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86ad5f"/><stop offset="1" stop-color="#4b7637"/></linearGradient>
<linearGradient id="${win}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeec4"/><stop offset="1" stop-color="#f0b663"/></linearGradient>
<radialGradient id="${sun}" cx=".85" cy=".15" r=".5"><stop offset="0" stop-color="#fff6dc" stop-opacity=".9"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient>
</defs>
<rect width="800" height="520" fill="url(#${sky})"/>
<rect width="800" height="520" fill="url(#${sun})"/>
<ellipse cx="170" cy="78" rx="80" ry="15" fill="#fff" opacity=".75"/><ellipse cx="230" cy="92" rx="60" ry="11" fill="#fff" opacity=".6"/>
<ellipse cx="560" cy="60" rx="70" ry="12" fill="#fff" opacity=".6"/>
<g fill="#5d7f4c" opacity=".75"><circle cx="40" cy="300" r="60"/><circle cx="110" cy="285" r="55"/><circle cx="690" cy="290" r="62"/><circle cx="770" cy="300" r="58"/><circle cx="620" cy="305" r="45"/></g>
<rect y="330" width="800" height="190" fill="url(#${lawn})"/>
<polygon points="300,520 340,390 372,390 420,520" fill="#d9cdb8"/>
<rect x="232" y="262" width="176" height="128" fill="#ece5d8"/>
<g stroke="#ddd4c3" stroke-width="2">${Array.from({ length: 11 }, (_, i) => `<line x1="${240 + i * 16}" y1="266" x2="${240 + i * 16}" y2="388"/>`).join("")}</g>
<polygon points="214,268 320,196 426,268" fill="#30353c"/>
<rect x="396" y="196" width="214" height="194" fill="#f5f2eb"/>
<g stroke="#e5dfd2" stroke-width="2">${Array.from({ length: 13 }, (_, i) => `<line x1="${404 + i * 16}" y1="204" x2="${404 + i * 16}" y2="388"/>`).join("")}</g>
<polygon points="378,204 503,124 628,204" fill="#262a30"/>
<rect x="540" y="138" width="22" height="46" fill="#5a4a3f"/>
<rect x="452" y="150" width="102" height="40" fill="#30353c"/>
<rect x="470" y="158" width="66" height="26" fill="url(#${win})" stroke="#2b2f35" stroke-width="4"/>
<g stroke="#2b2f35" stroke-width="5"><rect x="424" y="226" width="64" height="70" fill="url(#${win})"/><rect x="520" y="226" width="64" height="70" fill="url(#${win})"/><rect x="424" y="316" width="160" height="56" fill="url(#${win})"/></g>
<g stroke="#2b2f35" stroke-width="3"><line x1="456" y1="226" x2="456" y2="296"/><line x1="552" y1="226" x2="552" y2="296"/><line x1="477" y1="316" x2="477" y2="372"/><line x1="531" y1="316" x2="531" y2="372"/></g>
<rect x="262" y="296" width="120" height="12" fill="#262a30"/>
<rect x="266" y="306" width="8" height="84" fill="#e6dfd0"/><rect x="370" y="306" width="8" height="84" fill="#e6dfd0"/>
<rect x="300" y="318" width="42" height="72" rx="2" fill="#8a5a35"/><circle cx="334" cy="356" r="3" fill="#e5c07b"/>
<rect x="252" y="316" width="36" height="40" fill="url(#${win})" stroke="#2b2f35" stroke-width="4"/>
<rect x="282" y="386" width="84" height="8" fill="#b9ad98"/>
<g fill="#3d6531"><circle cx="246" cy="392" r="20"/><circle cx="276" cy="398" r="16"/><circle cx="398" cy="396" r="22"/><circle cx="430" cy="396" r="18"/><circle cx="470" cy="394" r="20"/><circle cx="512" cy="397" r="17"/><circle cx="560" cy="394" r="21"/><circle cx="600" cy="398" r="16"/></g>
<g fill="#c95b72" opacity=".85"><circle cx="404" cy="388" r="4"/><circle cx="472" cy="384" r="4"/><circle cx="560" cy="386" r="4"/></g>
<rect x="104" y="250" width="18" height="150" fill="#5b4332"/>
<g fill="#4c7a3b"><circle cx="112" cy="210" r="70"/><circle cx="60" cy="240" r="50"/><circle cx="166" cy="236" r="52"/><circle cx="112" cy="160" r="48"/></g>
<g fill="#5f8f49" opacity=".8"><circle cx="90" cy="190" r="34"/><circle cx="140" cy="200" r="30"/></g>
<rect x="640" y="372" width="70" height="16" rx="3" fill="#d6cbb8"/><rect x="646" y="340" width="8" height="40" fill="#30353c"/>
</svg>`;
    },

    kitchen() {
        const wall = aid("kw"), light = aid("kl"), floor = aid("kf");
        return `<svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bright kitchen with island">
<defs>
<linearGradient id="${wall}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ece6dc"/><stop offset="1" stop-color="#f7f3ec"/></linearGradient>
<linearGradient id="${light}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7ecf5"/><stop offset="1" stop-color="#fdf6e3"/></linearGradient>
<linearGradient id="${floor}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c99f72"/><stop offset="1" stop-color="#a77a50"/></linearGradient>
</defs>
<rect width="800" height="520" fill="url(#${wall})"/>
<rect y="400" width="800" height="120" fill="url(#${floor})"/>
<g stroke="#9c714a" stroke-width="2" opacity=".5">${Array.from({ length: 10 }, (_, i) => `<line x1="${i * 90 - 40}" y1="520" x2="${i * 70 + 60}" y2="400"/>`).join("")}</g>
<rect x="300" y="70" width="200" height="150" fill="url(#${light})" stroke="#2f3a36" stroke-width="6"/>
<line x1="400" y1="70" x2="400" y2="220" stroke="#2f3a36" stroke-width="4"/>
<g fill="#7aa36a" opacity=".7"><circle cx="340" cy="190" r="22"/><circle cx="460" cy="185" r="26"/></g>
<rect x="40" y="60" width="240" height="120" fill="#3d5a50"/><rect x="520" y="60" width="240" height="120" fill="#3d5a50"/>
<g stroke="#2f4740" stroke-width="3"><line x1="160" y1="60" x2="160" y2="180"/><line x1="640" y1="60" x2="640" y2="180"/></g>
<rect x="40" y="250" width="720" height="16" fill="#f4f2ee"/>
<rect x="40" y="266" width="720" height="134" fill="#3d5a50"/>
<g stroke="#2f4740" stroke-width="3">${[160, 280, 400, 520, 640].map((x) => `<line x1="${x}" y1="266" x2="${x}" y2="400"/>`).join("")}</g>
<g fill="#c9a96a">${[100, 220, 340, 460, 580, 700].map((x) => `<rect x="${x - 14}" y="290" width="28" height="4" rx="2"/>`).join("")}</g>
<rect x="160" y="330" width="480" height="22" fill="#fbfaf7"/>
<rect x="176" y="352" width="448" height="120" fill="#e9e3d8"/>
<g stroke="#d8d0c2" stroke-width="2">${Array.from({ length: 13 }, (_, i) => `<line x1="${190 + i * 34}" y1="356" x2="${190 + i * 34}" y2="470"/>`).join("")}</g>
<g stroke="#2a2d31" stroke-width="2">${[260, 400, 540].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="250"/>`).join("")}</g>
<g fill="#2a2d31">${[260, 400, 540].map((x) => `<path d="M${x - 26} 280 Q${x} 240 ${x + 26} 280Z"/>`).join("")}</g>
<g fill="#ffe7a8" opacity=".9">${[260, 400, 540].map((x) => `<ellipse cx="${x}" cy="281" rx="18" ry="4"/>`).join("")}</g>
<g fill="#3a3f45">${[250, 400, 550].map((x) => `<rect x="${x - 18}" y="400" width="36" height="8" rx="3"/><rect x="${x - 2}" y="408" width="4" height="70"/>`).join("")}</g>
<circle cx="610" cy="318" r="12" fill="#e9d6a6"/><rect x="330" y="314" width="60" height="16" rx="8" fill="#b9c9b0"/>
</svg>`;
    },

    backyard() {
        const sky = aid("bs"), pool = aid("bp");
        return `<svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Backyard patio and pool at dusk">
<defs>
<linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b5d8a"/><stop offset=".55" stop-color="#d98f6b"/><stop offset="1" stop-color="#f3c78f"/></linearGradient>
<linearGradient id="${pool}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fd1db"/><stop offset="1" stop-color="#2c8ea3"/></linearGradient>
</defs>
<rect width="800" height="520" fill="url(#${sky})"/>
<g fill="#2e3b2d"><circle cx="60" cy="230" r="90"/><circle cx="170" cy="210" r="70"/><circle cx="700" cy="220" r="95"/><circle cx="790" cy="250" r="70"/></g>
<rect y="280" width="800" height="240" fill="#3f5a33"/>
<polygon points="0,330 800,330 800,520 0,520" fill="#c9b08e"/>
<g stroke="#b39874" stroke-width="2">${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${345 + i * 20}" x2="800" y2="${345 + i * 20}"/>`).join("")}</g>
<path d="M200 380 L600 380 L660 470 L140 470Z" fill="url(#${pool})" stroke="#f2ede4" stroke-width="10"/>
<g stroke="#bff0f4" stroke-width="3" fill="none" opacity=".7"><path d="M220 420 q30 -10 60 0 t60 0"/><path d="M420 440 q30 -10 60 0 t60 0"/></g>
<polyline points="0,120 160,160 320,140 480,170 640,135 800,165" fill="none" stroke="#2b2b2b" stroke-width="2"/>
<g fill="#ffe1a0">${[[40, 131], [100, 146], [160, 160], [220, 152], [280, 144], [340, 144], [400, 155], [460, 167], [520, 157], [580, 146], [640, 135], [700, 146], [760, 157]].map(([x, y]) => `<circle cx="${x}" cy="${y + 8}" r="5"/>`).join("")}</g>
<g fill="#ece4d6"><rect x="40" y="380" width="80" height="14" rx="6" transform="rotate(-10 80 387)"/><rect x="680" y="380" width="80" height="14" rx="6" transform="rotate(10 720 387)"/></g>
<rect x="300" y="250" width="200" height="80" fill="#3b3a38"/><rect x="320" y="262" width="70" height="60" fill="#f6c97a"/><rect x="410" y="262" width="70" height="60" fill="#f6c97a"/>
</svg>`;
    },

    living() {
        return `<svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Living room with large windows">
<rect width="800" height="520" fill="#efe9e0"/>
<rect y="410" width="800" height="110" fill="#b88d63"/>
<rect x="420" y="60" width="320" height="300" fill="#cfe5ee" stroke="#2c3036" stroke-width="8"/>
<g stroke="#2c3036" stroke-width="5"><line x1="580" y1="60" x2="580" y2="360"/><line x1="420" y1="210" x2="740" y2="210"/></g>
<g fill="#7fa86b" opacity=".8"><circle cx="480" cy="330" r="40"/><circle cx="680" cy="320" r="46"/></g>
<rect x="70" y="300" width="330" height="90" rx="20" fill="#7d8f9c"/><rect x="70" y="260" width="330" height="60" rx="22" fill="#8fa1ad"/>
<rect x="60" y="300" width="40" height="100" rx="14" fill="#73858f"/><rect x="370" y="300" width="40" height="100" rx="14" fill="#73858f"/>
<rect x="140" y="430" width="200" height="16" rx="8" fill="#3b3330"/>
<rect x="110" y="100" width="150" height="110" fill="#e0b48a" stroke="#3a3330" stroke-width="6"/>
<rect x="590" y="400" width="140" height="70" rx="35" fill="#d8cbb6" opacity=".7"/>
<circle cx="330" cy="240" r="6" fill="#d6a85b"/>
</svg>`;
    },
};

const PHOTO_LABEL = { exterior: "Front exterior", kitchen: "Kitchen", backyard: "Backyard at dusk", living: "Living room" };

function headshot() {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jordan Ellis headshot">
<rect width="100" height="100" fill="#d7e5dc"/>
<path d="M14 104 C16 76 32 66 50 66 C68 66 84 76 86 104Z" fill="#2c3a4f"/>
<path d="M40 66 L50 82 L60 66Z" fill="#f4f1ea"/>
<rect x="44" y="52" width="12" height="16" fill="#b97d5c"/>
<ellipse cx="50" cy="40" rx="17" ry="20" fill="#c88d68"/>
<path d="M32 38 C30 20 44 14 52 16 C64 16 72 26 68 40 C66 30 58 26 50 27 C42 28 36 30 32 38Z" fill="#3a2a22"/>
</svg>`;
}

function cedarLogo(color = "currentColor") {
    return `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="${color}" aria-hidden="true"><path d="M12 2 6 10h3l-4 6h5v6h4v-6h5l-4-6h3z"/></svg>`;
}

function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
}

function rng(seed) {
    let a = seed || 1;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Looks like a QR code; not scannable. Deterministic per URL so a changed URL visibly changes the code.
function qrSvg(text) {
    const n = 25, r = rng(hashStr(text || "x"));
    const finder = (x, y) => (x >= 0 && x < 7 && y >= 0 && y < 7);
    const inFinder = (x, y) => finder(x, y) || finder(x - (n - 7), y) || finder(x, y - (n - 7));
    let d = "";
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            if (inFinder(x, y) || (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
            if (r() > 0.52) d += `M${x} ${y}h1v1h-1z`;
        }
    }
    const fp = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
    return `<svg viewBox="-1 -1 27 27" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><path fill="#111" fill-rule="evenodd" d="${fp(0, 0)}${fp(n - 7, 0)}${fp(0, n - 7)}${d}"/></svg>`;
}

const ICON_PATHS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    radius: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    street: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    tag: '<path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8.59-8.59a1 1 0 0 0 0-1.41z"/><circle cx="7" cy="7" r="1.5"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    arrowR: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    arrowL: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    note: '<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
};

function icon(name, size = 16, cls = "") {
    return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;
}

// Catalog illustrations: little stylized product renders.
const PRODUCT_ART = {
    postcards: () => `<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="38" y="22" width="92" height="62" rx="4" fill="#fff" stroke="#d6dbe0" transform="rotate(8 84 53)"/><g transform="rotate(-6 70 55)"><rect x="22" y="26" width="96" height="64" rx="4" fill="#fff" stroke="#c9d0d6"/><rect x="26" y="30" width="54" height="56" rx="2" fill="#9cc3dc"/><path d="M26 74 L44 56 L58 68 L68 60 L80 72 V86 H26Z" fill="#5f8f49"/><rect x="86" y="34" width="26" height="5" rx="2" fill="#1f8a5b"/><rect x="86" y="44" width="22" height="3" rx="1.5" fill="#c9d0d6"/><rect x="86" y="50" width="18" height="3" rx="1.5" fill="#c9d0d6"/><rect x="98" y="70" width="14" height="14" fill="#e9edf0"/></g></svg>`,
    brochures: () => `<svg viewBox="0 0 160 110" aria-hidden="true"><path d="M24 24 L60 18 L60 92 L24 98Z" fill="#f4f6f7" stroke="#c9d0d6"/><path d="M60 18 L100 24 L100 98 L60 92Z" fill="#fff" stroke="#c9d0d6"/><path d="M100 24 L136 18 L136 92 L100 98Z" fill="#fff" stroke="#c9d0d6"/><path d="M104 28 L132 23 L132 56 L104 60Z" fill="#9cc3dc"/><path d="M104 52 L114 44 L122 50 L132 42 V56 L104 60Z" fill="#5f8f49"/><rect x="106" y="66" width="22" height="4" rx="2" fill="#1f8a5b"/><rect x="106" y="74" width="18" height="3" rx="1.5" fill="#c9d0d6"/><rect x="66" y="32" width="28" height="3" rx="1.5" fill="#c9d0d6"/><rect x="66" y="40" width="24" height="3" rx="1.5" fill="#c9d0d6"/><rect x="66" y="48" width="26" height="3" rx="1.5" fill="#c9d0d6"/><rect x="30" y="36" width="24" height="20" fill="#e8d7bd"/></svg>`,
    flyers: () => `<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="58" y="12" width="66" height="88" rx="3" fill="#fff" stroke="#d6dbe0" transform="rotate(7 91 56)"/><rect x="44" y="10" width="68" height="90" rx="3" fill="#fff" stroke="#c9d0d6"/><rect x="48" y="14" width="60" height="38" fill="#9cc3dc"/><path d="M48 44 L62 32 L74 40 L84 30 L108 46 V52 H48Z" fill="#5f8f49"/><rect x="48" y="48" width="26" height="6" fill="#1f8a5b"/><rect x="52" y="60" width="34" height="5" rx="2" fill="#1f2328"/><rect x="52" y="70" width="48" height="3" rx="1.5" fill="#c9d0d6"/><rect x="52" y="76" width="40" height="3" rx="1.5" fill="#c9d0d6"/><rect x="48" y="86" width="60" height="10" fill="#1f2328"/></svg>`,
    social: () => `<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="54" y="6" width="52" height="98" rx="9" fill="#1f2328"/><rect x="58" y="14" width="44" height="82" rx="3" fill="#fff"/><circle cx="64" cy="20" r="3" fill="#e2a23b"/><rect x="70" y="18" width="20" height="3" rx="1.5" fill="#c9d0d6"/><rect x="58" y="26" width="44" height="44" fill="#9cc3dc"/><path d="M58 62 L72 50 L82 58 L92 48 L102 56 V70 H58Z" fill="#5f8f49"/><path d="M62 78 q3 -4 6 0 q3 -4 6 0 l-6 6z" fill="#d6455d"/><rect x="62" y="88" width="30" height="3" rx="1.5" fill="#c9d0d6"/></svg>`,
    images: () => `<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="30" y="16" width="100" height="70" rx="5" fill="#fff" stroke="#c9d0d6"/><rect x="36" y="22" width="88" height="58" rx="2" fill="#9cc3dc"/><path d="M36 70 L60 48 L78 62 L94 50 L124 72 V80 H36Z" fill="#5f8f49"/><circle cx="104" cy="36" r="7" fill="#f6d27a"/><circle cx="118" cy="86" r="14" fill="#1f8a5b"/><path d="M118 79 V92 M112 87 L118 93 L124 87" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    fbad: () => `<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="28" y="12" width="104" height="88" rx="6" fill="#fff" stroke="#c9d0d6"/><circle cx="40" cy="24" r="5" fill="#2f5ea8"/><rect x="50" y="20" width="30" height="3" rx="1.5" fill="#1f2328"/><rect x="50" y="26" width="18" height="2.5" rx="1.25" fill="#c9d0d6"/><rect x="112" y="19" width="14" height="8" rx="2" fill="#e9edf0"/><text x="119" y="25.5" font-size="6" text-anchor="middle" fill="#59636e" font-family="sans-serif">Ad</text><rect x="34" y="34" width="92" height="44" fill="#9cc3dc"/><path d="M34 70 L56 52 L72 64 L88 50 L126 72 V78 H34Z" fill="#5f8f49"/><rect x="34" y="84" width="54" height="4" rx="2" fill="#1f2328"/><rect x="98" y="82" width="28" height="10" rx="3" fill="#2f5ea8"/></svg>`,
};

// Simple neighborhood map around the listing for radius targeting.
function radiusMap({ qty, type, exclude, ready }) {
    const cx = 300, cy = 210;
    const R = Math.min(185, 58 + Math.sqrt(qty) * 13);
    const rand = rng(hashStr(`${type}`) + 7);
    const pts = [];
    let guard = 0;
    while (pts.length < (ready ? qty : 0) && guard++ < 4000) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * (R - 8);
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (Math.hypot(x - cx, y - cy) < 12) continue;
        if (pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 9)) continue;
        pts.push([x, y]);
    }
    const marker = (x, y, i) => {
        const multi = type === "multi" || (type === "both" && i % 4 === 0);
        return multi
            ? `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" rx="1.5" fill="#2f5ea8" stroke="#fff" stroke-width="1.5"/>`
            : `<circle cx="${x}" cy="${y}" r="4.2" fill="#1f8a5b" stroke="#fff" stroke-width="1.5"/>`;
    };
    const streets = [
        "M0 120 L600 96", "M0 214 L600 206", "M0 310 L600 322", "M0 395 L600 410",
        "M92 0 L110 420", "M206 0 L214 420", "M392 0 L384 420", "M498 0 L512 420",
    ];
    return `<svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of ${qty} addresses within the radius">
<rect width="600" height="420" fill="#eef1ec"/>
<path d="M440 0 C470 80 430 150 520 210 C600 260 560 340 600 420 L600 0Z" fill="#d5e6cd"/>
<path d="M0 30 C120 60 160 10 260 40 C340 64 360 0 420 0" fill="none" stroke="#a9cfe2" stroke-width="10" stroke-linecap="round"/>
<g stroke="#dde1e4" stroke-width="16" fill="none">${streets.map((d) => `<path d="${d}"/>`).join("")}</g>
<g stroke="#fff" stroke-width="11" fill="none">${streets.map((d) => `<path d="${d}"/>`).join("")}</g>
<g font-family="Inter, system-ui, sans-serif" font-size="10" fill="#7a848e" font-weight="600">
<text x="14" y="200">WILLOW LN</text><text x="14" y="108" transform="rotate(-2 14 108)">W MARY ST</text><text x="14" y="300">BOULDIN AVE</text><text x="218" y="410" transform="rotate(-90 218 410)">S 1ST ST</text><text x="535" y="140">Gillis Park</text>
</g>
<circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(31,138,91,.08)" stroke="#1f8a5b" stroke-width="2" stroke-dasharray="6 5"/>
${pts.map(([x, y], i) => marker(x, y, i)).join("")}
<g transform="translate(${cx} ${cy})">
${exclude
        ? `<circle r="11" fill="#fff" stroke="#c2372f" stroke-width="2.5"/><path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#c2372f" stroke-width="2.5" stroke-linecap="round"/>`
        : `<path d="M0 6 C-10 -6 -12 -14 0 -22 C12 -14 10 -6 0 6Z" transform="translate(0 4)" fill="#1f2328"/><circle cy="-12" r="4" fill="#fff"/>`}
</g>
<g transform="translate(${cx + 16} ${cy - 30})"><rect width="116" height="22" rx="11" fill="#1f2328"/><text x="58" y="15" fill="#fff" font-size="11" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="600">128 Willow Lane</text></g>
</svg>`;
}
