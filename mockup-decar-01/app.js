(() => {
    const D = window.DECAR;
    const $ = (sel, root = document) => root.querySelector(sel);
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
    const byId = Object.fromEntries(D.relics.map((r) => [r.id, r]));
    const TRAIL_KEY = "decar-trail-v1";
    const MIN_PER_STOP = 40;
    const MIN_PER_LEG = 12;

    // ---------- pure helpers ----------
    const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
    const matchesFilter = (r, f) => (f.kind === "all" || r.kind === f.kind) && (f.rank === "all" || r.rank === f.rank);
    const search = (q) => {
        const k = fold(q.trim());
        if (!k) return D.relics;
        return D.relics.filter((r) => fold(`${r.name} ${r.village} ${r.short} ${D.kinds[r.kind]}`).includes(k));
    };
    const trailMinutes = (ids) => ids.length ? ids.length * MIN_PER_STOP + (ids.length - 1) * MIN_PER_LEG : 0;
    const fmtDuration = (m) => (m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60 ? `${m % 60} phút` : ""}` : `${m} phút`).trim();
    const toggleIn = (ids, id) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    const move = (ids, i, d) => {
        const j = i + d;
        if (j < 0 || j >= ids.length) return ids;
        const next = [...ids];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
    };
    const fmtDate = (iso) => new Date(iso).toLocaleDateString("vi-VN", {day: "2-digit", month: "2-digit", year: "numeric"});

    const loadTrail = () => {
        try {
            const v = JSON.parse(localStorage.getItem(TRAIL_KEY) || "[]");
            return Array.isArray(v) ? v.filter((id) => byId[id]) : [];
        } catch {
            return [];
        }
    };

    // ---------- state ----------
    const state = {
        filter: {kind: "all", rank: "all"},
        showMap: true,
        hot: null,
        trail: loadTrail(),
        open: null,
    };

    const setState = (patch) => {
        Object.assign(state, patch);
        if ("trail" in patch) {
            try { localStorage.setItem(TRAIL_KEY, JSON.stringify(state.trail)); } catch { /* storage unavailable */ }
        }
        renderAtlas();
        renderTrail();
        renderDrawer();
    };

    // ---------- hero ----------
    const heroMedia = $("[data-hero]");
    const heroDots = $("[data-hero-dots]");
    const heroCap = $("[data-hero-caption]");
    let heroIdx = 0;
    heroMedia.innerHTML = D.heroImages.map((h, i) => `<img src="${h.src}" alt="${esc(h.name)}" ${i ? 'loading="lazy"' : ""}>`).join("");
    heroDots.innerHTML = D.heroImages.map((h, i) => `<li><button type="button" aria-label="${esc(h.name)}" data-i="${i}"></button></li>`).join("");
    const showHero = (i) => {
        heroIdx = i;
        [...heroMedia.children].forEach((el, k) => el.classList.toggle("is-on", k === i));
        [...heroDots.querySelectorAll("button")].forEach((el, k) => el.classList.toggle("is-on", k === i));
        heroCap.textContent = D.heroImages[i].name;
    };
    showHero(0);
    let heroTimer = setInterval(() => showHero((heroIdx + 1) % D.heroImages.length), 6000);
    heroDots.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        clearInterval(heroTimer);
        showHero(+b.dataset.i);
        heroTimer = setInterval(() => showHero((heroIdx + 1) % D.heroImages.length), 6000);
    });

    // ---------- top bar ----------
    const bar = $(".bar");
    const navLinks = [...document.querySelectorAll(".nav > a")];
    const onScroll = () => {
        bar.classList.toggle("is-solid", scrollY > innerHeight * .6);
        let current = null;
        for (const a of navLinks) {
            const sec = $(a.getAttribute("href"));
            if (sec && sec.getBoundingClientRect().top < innerHeight * .4) current = a;
        }
        navLinks.forEach((a) => a.classList.toggle("is-active", a === current));
    };
    addEventListener("scroll", onScroll, {passive: true});
    onScroll();

    // ---------- atlas ----------
    const chipKind = $('[data-filter="kind"]');
    const chipRank = $('[data-filter="rank"]');
    const atlas = $("[data-atlas]");
    const pins = $("[data-pins]");
    const list = $("[data-list]");

    const chips = (key, labels) => {
        const opts = [["all", "Tất cả"], ...Object.entries(labels)];
        return opts.map(([v, label]) => {
            const n = D.relics.filter((r) => matchesFilter(r, {...state.filter, [key]: v})).length;
            return `<button type="button" data-v="${v}" class="${state.filter[key] === v ? "is-on" : ""}">${esc(label)}<i>${n}</i></button>`;
        }).join("");
    };

    const relicIndex = (id) => D.relics.findIndex((r) => r.id === id) + 1;

    function renderAtlas() {
        chipKind.innerHTML = chips("kind", D.kinds);
        chipRank.innerHTML = chips("rank", D.ranks);
        atlas.classList.toggle("no-map", !state.showMap);

        pins.innerHTML = D.relics.map((r) => {
            const cls = [
                r.rank === "qg" && "is-qg",
                !matchesFilter(r, state.filter) && "is-dim",
                state.hot === r.id && "is-hot",
            ].filter(Boolean).join(" ");
            return `<button type="button" class="${cls}" style="left:${r.x}%;top:${r.y}%" data-id="${r.id}" title="${esc(r.name)}"><span>${relicIndex(r.id)}</span></button>`;
        }).join("");

        const visible = D.relics.filter((r) => matchesFilter(r, state.filter));
        list.innerHTML = visible.length ? visible.map((r) => {
            const inTrail = state.trail.includes(r.id);
            return `<li class="relic ${state.hot === r.id ? "is-hot" : ""}" data-id="${r.id}">
                <button type="button" class="relic-open" data-open="${r.id}">
                    <img src="${r.img}" alt="" loading="lazy">
                    <div>
                        <span class="badge ${r.rank === "qg" ? "is-qg" : ""}">${relicIndex(r.id)} · ${r.rank === "qg" ? "Quốc gia" : "Cấp TP"}</span>${r.vr ? '<span class="badge is-vr">360°</span>' : ""}
                        <h3>${esc(r.name)}</h3>
                        <p>${esc(r.short)}</p>
                    </div>
                </button>
                <button type="button" class="add ${inTrail ? "is-in" : ""}" data-add="${r.id}" aria-label="${inTrail ? "Bỏ khỏi" : "Thêm vào"} hành trình">${inTrail ? "✓" : "＋"}</button>
            </li>`;
        }).join("") : '<li class="empty">Không có di tích phù hợp bộ lọc.</li>';
    }

    chipKind.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) setState({filter: {...state.filter, kind: b.dataset.v}});
    });
    chipRank.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) setState({filter: {...state.filter, rank: b.dataset.v}});
    });
    $("[data-map-toggle]").addEventListener("change", (e) => setState({showMap: e.target.checked}));

    const setHot = (id) => {
        if (state.hot === id) return;
        state.hot = id;
        pins.querySelectorAll("button").forEach((b) => b.classList.toggle("is-hot", b.dataset.id === id));
        list.querySelectorAll(".relic").forEach((li) => li.classList.toggle("is-hot", li.dataset.id === id));
    };
    list.addEventListener("pointerover", (e) => setHot(e.target.closest(".relic")?.dataset.id ?? null));
    list.addEventListener("pointerleave", () => setHot(null));
    pins.addEventListener("pointerover", (e) => {
        const id = e.target.closest("button")?.dataset.id;
        if (!id) return;
        setHot(id);
        list.querySelector(`[data-id="${id}"]`)?.scrollIntoView({block: "nearest", behavior: "smooth"});
    });
    pins.addEventListener("click", (e) => {
        const id = e.target.closest("button")?.dataset.id;
        if (id) openDrawer(id);
    });
    list.addEventListener("click", (e) => {
        const add = e.target.closest("[data-add]");
        if (add) return setState({trail: toggleIn(state.trail, add.dataset.add)});
        const open = e.target.closest("[data-open]");
        if (open) openDrawer(open.dataset.open);
    });

    // ---------- trail ----------
    const trailEl = $("[data-trail]");
    function renderTrail() {
        const ids = state.trail;
        const mins = trailMinutes(ids);
        trailEl.innerHTML = `
            <div class="trail-top">
                <h3>Lộ trình trong ngày</h3>
                <span>${ids.length} điểm · ~${fmtDuration(mins) || "0 phút"}</span>
            </div>
            ${ids.length ? `<ol>${ids.map((id, i) => {
                const r = byId[id];
                return `<li>
                    <img src="${r.img}" alt="">
                    <div><b>${esc(r.name)}</b><small>${esc(r.village)} · ${r.rank === "qg" ? "Quốc gia" : "Cấp TP"}</small></div>
                    <div class="stop-tools">
                        <button type="button" data-move="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Lên">↑</button>
                        <button type="button" data-move="${i}" data-d="1" ${i === ids.length - 1 ? "disabled" : ""} aria-label="Xuống">↓</button>
                        <button type="button" data-remove="${id}" aria-label="Bỏ">✕</button>
                    </div>
                </li>`;
            }).join("")}</ol>
            <div class="trail-actions">
                <a class="btn btn-primary" href="https://www.google.com/maps/dir/${ids.map((id) => encodeURIComponent(`${byId[id].name}, Xuân Đỉnh, Hà Nội`)).join("/")}" target="_blank" rel="noopener">Mở chỉ đường</a>
                <button type="button" class="btn btn-clear" data-clear>Xoá lộ trình</button>
            </div>` : `<div class="trail-empty"><b>Chưa có điểm dừng nào</b>Chọn ＋ ở Atlas hoặc một gợi ý bên cạnh.</div>`}
        `;
    }
    trailEl.addEventListener("click", (e) => {
        const m = e.target.closest("[data-move]");
        if (m) return setState({trail: move(state.trail, +m.dataset.move, +m.dataset.d)});
        const rm = e.target.closest("[data-remove]");
        if (rm) return setState({trail: state.trail.filter((x) => x !== rm.dataset.remove)});
        if (e.target.closest("[data-clear]")) setState({trail: []});
    });
    document.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
        setState({trail: b.dataset.preset.split(",")});
    }));

    // ---------- drawer ----------
    const drawer = $("[data-drawer]");
    const drawerBody = $("[data-drawer-body]");
    const scrim = $("[data-scrim]");
    let lastFocus = null;

    function openDrawer(id) {
        lastFocus = document.activeElement;
        setState({open: id});
        drawer.scrollTop = 0;
        $("[data-close]").focus();
    }
    function closeDrawer() {
        if (!state.open) return;
        setState({open: null});
        lastFocus?.focus?.();
    }
    function renderDrawer() {
        const r = state.open && byId[state.open];
        drawer.classList.toggle("is-open", !!r);
        drawer.setAttribute("aria-hidden", String(!r));
        scrim.hidden = !r;
        if (!r) return;
        const inTrail = state.trail.includes(r.id);
        drawerBody.innerHTML = `
            <div class="d-hero"><img src="${r.img.replace("/conversions/", "/").replace("-thumb", "")}" onerror="this.onerror=null;this.src='${r.img}'" alt="${esc(r.name)}"></div>
            <div class="d-body">
                <span class="badge ${r.rank === "qg" ? "is-qg" : ""}">${esc(D.ranks[r.rank])}</span>
                <span class="badge">${esc(D.kinds[r.kind])}</span>
                <h2 id="drawer-h">${esc(r.name)}</h2>
                <p class="d-loc">📍 ${esc(r.village)}, phường Xuân Đỉnh, Hà Nội</p>
                <div class="d-actions">
                    <button type="button" data-d-add class="${inTrail ? "is-in" : ""}"><b>${inTrail ? "✓" : "＋"}</b>${inTrail ? "Đã thêm" : "Hành trình"}</button>
                    <button type="button" data-d-vr ${r.vr ? "" : "disabled"}><b>360°</b>${r.vr ? "Tham quan" : "Sắp có"}</button>
                    <button type="button" data-d-map><b>➚</b>Chỉ đường</button>
                </div>
                <h4>Tổng quan</h4>
                <p>${esc(r.short)}</p>
                ${r.history ? `<h4>Giá trị lịch sử – văn hoá</h4><p>${esc(r.history)}</p><h4>Di sản phi vật thể</h4><p>${esc(r.culture)}</p>`
                    : '<h4>Giá trị lịch sử – văn hoá</h4><p class="d-pending">Nội dung chi tiết, kiến trúc và lễ hội đang được cập nhật.</p>'}
            </div>`;
    }
    drawer.addEventListener("click", (e) => {
        if (e.target.closest("[data-close]")) return closeDrawer();
        const r = byId[state.open];
        if (e.target.closest("[data-d-add]")) return setState({trail: toggleIn(state.trail, r.id)});
        if (e.target.closest("[data-d-vr]")) {
            closeDrawer();
            selectVr(r.id);
            $("#vr").scrollIntoView({behavior: "smooth"});
            return;
        }
        if (e.target.closest("[data-d-map]")) {
            open(`https://www.google.com/maps/search/${encodeURIComponent(`${r.name}, Xuân Đỉnh, Hà Nội`)}`, "_blank", "noopener");
        }
    });
    scrim.addEventListener("click", closeDrawer);

    // ---------- VR (simulated drag-to-pan) ----------
    const vrTabs = $("[data-vr-tabs]");
    const vrStage = $("[data-vr-stage]");
    const vrPano = $("[data-vr-pano]");
    const vrName = $("[data-vr-name]");
    const vrRelics = D.relics.filter((r) => r.vr);
    const vrBg = {"den-soc": D.heroImages[1].src, "dinh-gian": D.heroImages[0].src, "dinh-xuan-tao": D.heroImages[2].src};
    let vrX = 0;
    let vrCurrent = vrRelics[0].id;
    vrTabs.innerHTML = vrRelics.map((r) => `<button type="button" role="tab" data-vr="${r.id}">${esc(r.name)}</button>`).join("");
    function selectVr(id) {
        vrCurrent = id;
        vrPano.style.backgroundImage = `url("${vrBg[id] || byId[id].img}")`;
        vrName.textContent = byId[id].name;
        vrTabs.querySelectorAll("button").forEach((b) => {
            b.classList.toggle("is-on", b.dataset.vr === id);
            b.setAttribute("aria-selected", String(b.dataset.vr === id));
        });
    }
    selectVr(vrCurrent);
    vrTabs.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) selectVr(b.dataset.vr);
    });
    let drag = null;
    vrStage.addEventListener("pointerdown", (e) => {
        drag = {x: e.clientX, start: vrX};
        vrStage.classList.add("is-drag");
        vrStage.setPointerCapture(e.pointerId);
    });
    vrStage.addEventListener("pointermove", (e) => {
        if (!drag) return;
        vrX = drag.start + (e.clientX - drag.x);
        vrPano.style.backgroundPositionX = `${vrX}px`;
    });
    const endDrag = () => { drag = null; vrStage.classList.remove("is-drag"); };
    vrStage.addEventListener("pointerup", endDrag);
    vrStage.addEventListener("pointercancel", endDrag);

    // ---------- gallery + lightbox ----------
    const gallery = $("[data-gallery]");
    const lb = $("[data-lightbox]");
    const lbImg = $("[data-lb-img]");
    const lbCap = $("[data-lb-cap]");
    let lbIdx = 0;
    gallery.innerHTML = D.gallery.map((g, i) => `<button type="button" data-i="${i}"><img src="${g.src}" alt="${esc(g.name)}" loading="lazy"><span>${esc(g.name)}</span></button>`).join("");
    const showLb = (i) => {
        lbIdx = (i + D.gallery.length) % D.gallery.length;
        lbImg.src = D.gallery[lbIdx].src;
        lbImg.alt = D.gallery[lbIdx].name;
        lbCap.textContent = `${D.gallery[lbIdx].name} · ${lbIdx + 1}/${D.gallery.length}`;
    };
    gallery.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        showLb(+b.dataset.i);
        lb.hidden = false;
    });
    $("[data-lb-prev]").addEventListener("click", () => showLb(lbIdx - 1));
    $("[data-lb-next]").addEventListener("click", () => showLb(lbIdx + 1));
    $("[data-lb-close]").addEventListener("click", () => { lb.hidden = true; });
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.hidden = true; });

    // ---------- news ----------
    $("[data-news]").innerHTML = D.news.map((n) => `
        <article>
            <img src="${n.img}" alt="" loading="lazy">
            <div>
                <span class="meta"><b>${esc(n.tag)}</b>${fmtDate(n.date)}</span>
                <h3>${esc(n.title)}</h3>
                <p>${esc(n.body)}</p>
            </div>
        </article>`).join("");

    // ---------- search palette ----------
    const palette = $("[data-palette]");
    const pInput = $("[data-palette-input]");
    const pResults = $("[data-palette-results]");
    let pSel = 0;
    let pItems = [];
    const renderPalette = () => {
        pItems = search(pInput.value);
        pSel = Math.min(pSel, Math.max(pItems.length - 1, 0));
        pResults.innerHTML = pItems.length ? pItems.map((r, i) => `<li><button type="button" class="${i === pSel ? "is-on" : ""}" data-id="${r.id}">
            <img src="${r.img}" alt=""><span>${esc(r.name)}<small>${esc(r.village)} · ${esc(D.kinds[r.kind])}</small></span></button></li>`).join("")
            : '<li class="none">Không tìm thấy di tích.</li>';
    };
    const openPalette = () => {
        palette.hidden = false;
        pInput.value = "";
        pSel = 0;
        renderPalette();
        pInput.focus();
    };
    const closePalette = () => { palette.hidden = true; };
    document.querySelectorAll("[data-open-search]").forEach((b) => b.addEventListener("click", openPalette));
    pInput.addEventListener("input", () => { pSel = 0; renderPalette(); });
    pInput.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            pSel = (pSel + (e.key === "ArrowDown" ? 1 : -1) + pItems.length) % Math.max(pItems.length, 1);
            renderPalette();
        } else if (e.key === "Enter" && pItems[pSel]) {
            closePalette();
            openDrawer(pItems[pSel].id);
        }
    });
    pResults.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        closePalette();
        openDrawer(b.dataset.id);
    });
    palette.addEventListener("click", (e) => { if (e.target === palette) closePalette(); });

    // ---------- global keys ----------
    addEventListener("keydown", (e) => {
        if (e.key === "/" && palette.hidden && !/input|textarea/i.test(document.activeElement.tagName)) {
            e.preventDefault();
            openPalette();
        } else if (e.key === "Escape") {
            if (!palette.hidden) closePalette();
            else if (!lb.hidden) lb.hidden = true;
            else closeDrawer();
        } else if (!lb.hidden && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            showLb(lbIdx + (e.key === "ArrowRight" ? 1 : -1));
        }
    });

    renderAtlas();
    renderTrail();
})();
