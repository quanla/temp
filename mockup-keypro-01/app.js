(() => {
  const U = 'https://keypro.vn/wp-content/uploads/';
  const $ = (sel, root = document) => root.querySelector(sel);

  // Projects shown on keypro.vn "Dự án tiêu biểu"; tags copied from the original cards.
  const PROJECTS = [
    { name: 'Vision Nest', tags: ['Animation', 'Marketing', 'Graphics'], img: U + '2025/06/fullscren-14.jpg', year: '2025' },
    { name: 'Yoko Pack', tags: ['Packaging', 'Printing'], img: U + '2025/09/yoko3.jpg', year: '2025' },
    { name: 'Lucid Vide', tags: ['Printing', 'Marketing', 'Creation'], img: U + '2025/06/fullscren-15.jpg', year: '2025' },
    { name: 'Doji Visual', tags: ['Visual Merchandising'], img: U + '2025/09/doji1.jpg', year: '2025' },
  ];

  // Service names are from keypro.vn; descriptions and bullet lists are mockup copy.
  const SERVICES = [
    {
      name: 'Thương hiệu',
      img: U + '2025/09/triptravel-768x578.jpg',
      desc: 'Xây dựng nền tảng thương hiệu từ chiến lược tới hệ thống nhận diện, đảm bảo mọi điểm chạm đều nói cùng một giọng.',
      list: ['Chiến lược & định vị', 'Logo & bộ nhận diện', 'Brand guideline', 'Visual merchandising'],
    },
    {
      name: 'Tổ chức sự kiện',
      img: U + '2025/09/marketoutlook.jpg',
      desc: 'Lên ý tưởng, thiết kế và vận hành sự kiện — hội nghị, ra mắt sản phẩm, gala — mang đậm dấu ấn thương hiệu.',
      list: ['Concept & kịch bản', 'Thiết kế sân khấu, backdrop', 'Truyền thông sự kiện', 'Vận hành trọn gói'],
    },
    {
      name: 'Ấn phẩm, quà tặng',
      img: U + '2025/09/sachrichnguyen.jpg',
      desc: 'Từ sách, catalogue tới hộp quà cao cấp — chọn chất liệu và kỹ thuật hoàn thiện để món quà trở thành kỷ niệm.',
      list: ['Sách & catalogue', 'Bao bì, packaging', 'Quà tặng doanh nghiệp', 'In ấn kỹ thuật đặc biệt'],
    },
  ];

  /* ---------- Header: shrink on scroll + mobile menu ---------- */
  const bar = $('[data-bar]');
  const menuBtn = $('[data-menu-btn]');
  const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    bar.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!bar.classList.contains('is-open')));
  $('[data-nav]').addEventListener('click', (e) => e.target.closest('a') && setMenu(false));

  /* ---------- Hero word swap ---------- */
  const words = [...document.querySelectorAll('.swap-word')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    let w = 0;
    setInterval(() => {
      words[w].classList.remove('is-on');
      w = (w + 1) % words.length;
      words[w].classList.add('is-on');
    }, 2200);
  }

  /* ---------- Work: filter chips + hover/focus preview ---------- */
  const allTags = ['Tất cả', ...new Set(PROJECTS.flatMap((p) => p.tags))];
  const chips = $('[data-chips]');
  const list = $('[data-work-list]');
  const preview = $('[data-work-preview]');
  const previewImg = $('[data-work-img]');
  let filter = 'Tất cả';
  let active = 0;

  const visible = () => PROJECTS.filter((p) => filter === 'Tất cả' || p.tags.includes(filter));

  const showProject = (p, i, total) => {
    if (previewImg.src !== p.img) {
      preview.classList.remove('is-in');
      void preview.offsetWidth; // restart the fade
      previewImg.src = p.img;
      previewImg.alt = p.name;
      preview.classList.add('is-in');
    }
    $('[data-work-count]').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    $('[data-work-tags]').textContent = p.tags.join(' · ');
  };

  const renderChips = () => {
    chips.innerHTML = allTags.map((t) => (
      `<button type="button" class="chip${t === filter ? ' is-on' : ''}" aria-pressed="${t === filter}">${t}</button>`
    )).join('');
  };

  const renderList = () => {
    const items = visible();
    active = Math.min(active, items.length - 1);
    list.innerHTML = items.map((p, i) => `
      <li class="${i === active ? 'is-active' : ''}" data-i="${i}">
        <a href="#" class="work-row">
          <span class="work-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="work-name">${p.name}</span>
          <span class="work-tags">${p.tags.join(' / ')}</span>
          <img class="work-thumb" src="${p.img}" alt="" loading="lazy">
          <span class="work-arrow" aria-hidden="true">↗</span>
        </a>
      </li>`).join('');
    showProject(items[active], active, items.length);
  };

  const activate = (li) => {
    if (!li) return;
    const items = visible();
    active = Number(li.dataset.i);
    list.querySelectorAll('li').forEach((el) => el.classList.toggle('is-active', el === li));
    showProject(items[active], active, items.length);
  };

  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    filter = b.textContent;
    active = 0;
    renderChips();
    renderList();
  });
  list.addEventListener('mouseover', (e) => activate(e.target.closest('li')));
  list.addEventListener('focusin', (e) => activate(e.target.closest('li')));
  list.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      e.preventDefault();
      toast('Trang chi tiết dự án — chưa có trong bản mockup');
    }
  });

  renderChips();
  renderList();

  /* ---------- Services tabs ---------- */
  const tabs = $('[data-svc-tabs]');
  const panel = $('[data-svc-panel]');
  let svc = 0;

  const renderSvc = () => {
    tabs.innerHTML = SERVICES.map((s, i) => `
      <button type="button" role="tab" class="svc-tab${i === svc ? ' is-on' : ''}" aria-selected="${i === svc}" tabindex="${i === svc ? 0 : -1}">
        <span>${String(i + 1).padStart(2, '0')}</span>${s.name}
      </button>`).join('');
    const s = SERVICES[svc];
    panel.classList.remove('is-in');
    void panel.offsetWidth;
    $('[data-svc-img]').src = s.img;
    $('[data-svc-img]').alt = s.name;
    $('[data-svc-title]').textContent = s.name;
    $('[data-svc-desc]').textContent = s.desc;
    $('[data-svc-list]').innerHTML = s.list.map((x) => `<li>${x}</li>`).join('');
    panel.classList.add('is-in');
  };

  const pickSvc = (i, focus) => {
    svc = (i + SERVICES.length) % SERVICES.length;
    renderSvc();
    if (focus) tabs.children[svc].focus();
  };

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.svc-tab');
    if (b) pickSvc([...tabs.children].indexOf(b));
  });
  tabs.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); pickSvc(svc + 1, true); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); pickSvc(svc - 1, true); }
  });
  renderSvc();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-seen');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.why-grid li, .post, .section-head, .svc, .contact-cols > div').forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });

  /* ---------- Toast ---------- */
  const toastBox = $('[data-toast-box]');
  let toastTimer;
  function toast(msg) {
    toastBox.textContent = msg;
    toastBox.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastBox.classList.remove('is-on'), 2600);
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toast]');
    if (t) {
      e.preventDefault();
      toast(t.dataset.toast);
    }
  });
  document.querySelectorAll('.post, .socials a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    toast('Liên kết mẫu — chưa có trong bản mockup');
  }));
})();
