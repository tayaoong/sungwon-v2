/* ==========================================================
   성원창호 v2 — 공통 스크립트 (머리글 · 메뉴 · 바닥글 · 모션 · 문의 폼)
   업체 정보는 site-config.js 에서 가져와요.
   ========================================================== */
(function () {
  const S = window.SITE || {};
  const tel = (S.phone || '').replace(/\D/g, '');
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ic = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6.2A8 8 0 1 1 21 12z"/></svg>',
  };
  window.IC = ic;

  const menu = [
    { h: 'about.html', en: 'About', ko: '회사소개' },
    { h: 'window.html', en: 'Window', ko: '샷시 시공' },
    { h: 'window.html#kcc', en: 'KCC Product', ko: 'KCC 창호' },
    { h: 'works.html', en: 'Works', ko: '시공사례' },
    { h: 'contact.html', en: 'Contact', ko: '문의' },
  ];

  /* ---------- 머리글 ---------- */
  const hd = document.createElement('header');
  hd.className = 'hd';
  hd.innerHTML = `<div class="wrap">
    <a class="hd-logo" href="index.html" aria-label="${S.nameFull} 홈"><img src="assets/brand/logo.png" alt="KCC 성원창호"></a>
    <nav class="hd-nav">${menu.filter(m => !m.h.includes('#')).map(m => `<a href="${m.h}"${here === m.h ? ' class="on"' : ''}>${m.ko}</a>`).join('')}</nav>
    <a class="hd-tel" href="tel:${tel}">${S.phone}</a>
    <button class="dots-btn" type="button" aria-label="전체 메뉴">${'<i></i>'.repeat(9)}</button>
  </div>`;
  document.body.prepend(hd);

  const ov = document.createElement('div');
  ov.className = 'menu-ov';
  ov.innerHTML = `<div class="m-img"></div><div class="m-body">
    <button class="m-close" type="button">CLOSE</button>
    <nav>${[{ h: 'index.html', en: 'Home', ko: '홈' }, ...menu].map((m, i) => `<a href="${m.h}" style="transition-delay:${0.08 + i * 0.05}s">${m.en}<span>${m.ko}</span></a>`).join('')}</nav>
    <div class="m-info"><b>${S.phone}</b>${S.address}<br>${S.dealer}</div>
  </div>`;
  document.body.append(ov);
  const toggleMenu = v => document.documentElement.classList.toggle('menu-open', v);
  hd.querySelector('.dots-btn').onclick = () => toggleMenu(true);
  ov.querySelector('.m-close').onclick = () => toggleMenu(false);
  ov.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  /* ---------- 바닥글 ---------- */
  const ft = document.createElement('footer');
  ft.className = 'ft';
  ft.innerHTML = `
    <a class="ft-logo" href="index.html"><img src="assets/brand/logo.png" alt="KCC 성원창호"></a>
    <p class="ft-info">
      <span>상호 ${S.bizName}</span><span>대표 ${S.owner}</span><span>사업자등록번호 ${S.bizNo}</span><br>
      <span>주소 ${S.address}${S.addressOld ? ` (${S.addressOld})` : ''}</span><span>전화 ${S.phone}</span>
    </p>
    <div class="ft-bottom">
      <div class="l"><a href="privacy.html">Privacy policy</a><a href="contact.html">Contact us</a><a href="admin/index.html">Admin</a></div>
      <span class="en">COPYRIGHT © ${new Date().getFullYear()} SEONGWON WINDOW. ALL RIGHTS RESERVED.</span>
      <button class="top" type="button">Back Top</button>
    </div>`;
  document.body.append(ft);
  ft.querySelector('.top').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

  const mc = document.createElement('div');
  mc.className = 'm-call';
  mc.innerHTML = `<a href="tel:${tel}">${ic.phone}전화 상담</a><a href="contact.html">${ic.mail}견적 문의</a>`;
  if (here !== 'contact.html') document.body.append(mc);

  /* ---------- 업체 정보 채우기 ---------- */
  document.querySelectorAll('[data-site]').forEach(el => { const v = S[el.dataset.site]; if (v) el.textContent = v; });
  document.querySelectorAll('[data-tel]').forEach(el => el.setAttribute('href', 'tel:' + tel));
  const mapUrl = 'https://map.naver.com/p/search/' + encodeURIComponent(S.address || '');
  document.querySelectorAll('[data-map]').forEach(el => { el.href = mapUrl; el.target = '_blank'; el.rel = 'noopener'; });

  /* ---------- 스크롤 ---------- */
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    hd.classList.toggle('scrolled', y > 10);
    if (y > lastY + 4 && y > 500) hd.classList.add('hide');
    else if (y < lastY - 4 || y < 200) hd.classList.remove('hide');
    mc.classList.toggle('show', y > 400);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 글자 한 단어씩 올라오기 ---------- */
  document.querySelectorAll('.split-t').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    if (!el.hasAttribute('data-rv')) el.setAttribute('data-rv-t', '');
  });

  /* ---------- 등장 모션 ---------- */
  document.querySelectorAll('[data-stagger]').forEach(p => {
    const st = parseFloat(p.dataset.stagger) || .08;
    [...p.children].forEach((c, i) => { if (!c.hasAttribute('data-rv')) c.setAttribute('data-rv', ''); c.style.setProperty('--d', (i * st).toFixed(2) + 's'); });
  });
  const targets = document.querySelectorAll('[data-rv], .split-t, .sub-img, [data-draw]');
  if (reduce) targets.forEach(t => t.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(t => io.observe(t));
  }

  /* ---------- 토스트 ---------- */
  let tEl, tT;
  window.toast = m => {
    if (!tEl) { tEl = document.createElement('div'); tEl.className = 'toast'; document.body.append(tEl); }
    tEl.textContent = m; requestAnimationFrame(() => tEl.classList.add('show'));
    clearTimeout(tT); tT = setTimeout(() => tEl.classList.remove('show'), 2400);
  };

  /* ---------- 문의 폼 (메인 · 문의 페이지 공용) ---------- */
  document.querySelectorAll('form[data-inquiry]').forEach(form => {
    const phone = form.querySelector('[name=phone]');
    phone?.addEventListener('input', () => {
      const d = phone.value.replace(/\D/g, '').slice(0, 11);
      phone.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, d.length === 10 ? 6 : 7)}-${d.slice(d.length === 10 ? 6 : 7)}`;
    });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const err = form.querySelector('.f-err');
      const say = m => { err.textContent = m; err.hidden = !m; };
      if (!f.name?.trim()) return say('성함을 적어주세요.');
      if (!/^01[016789]-\d{3,4}-\d{4}$/.test(f.phone || '')) return say('연락처를 010-0000-0000 형식으로 적어주세요.');
      if (!form.querySelector('[name=agree]').checked) return say('개인정보 수집 · 이용에 동의해 주세요.');
      say('');
      const btn = form.querySelector('[type=submit]');
      const label = btn.innerHTML; btn.disabled = true; btn.textContent = '보내는 중…';
      const work = form.querySelectorAll('[name=work]:checked');
      try {
        await STORE.createRequest({
          name: f.name.trim(), phone: f.phone, region: (f.region || '').trim(),
          work: work.length ? [...work].map(x => x.value) : ['unsure'],
          home_type: f.home_type || '', size: f.size || '', rooms: [], timing: f.timing || '',
          memo: (f.memo || '').trim(), visit_pref: '',
        }, [...(form.querySelector('[type=file]')?.files || [])]);
        form.reset();
        form.classList.add('sent');
        toast('문의가 접수됐어요. 확인하고 곧 연락드릴게요.');
      } catch (ex) {
        say(ex.message || '보내지 못했어요. 전화로 문의해 주세요.');
      } finally { btn.disabled = false; btn.innerHTML = label; }
    });
  });
})();
