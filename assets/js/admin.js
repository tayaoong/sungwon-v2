/* ==========================================================
   관리자 페이지
   ========================================================== */
(function () {
  const S = window.SITE;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 아이콘 ---------- */
  const P = {
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    inbox: '<path d="M3 13h5l1.5 3h5l1.5-3h5M5 5h14l2 8v6H3v-6z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    msg: '<path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6.2A8 8 0 1 1 21 12z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  };
  const ic = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const paintIcons = (root = document) => root.querySelectorAll('[data-i]').forEach(el => { el.innerHTML = ic(el.dataset.i); });
  paintIcons();

  const LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="#3182F6"/><rect x="10" y="12" width="17" height="24" rx="3" fill="#fff" fill-opacity=".42"/><rect x="21" y="12" width="17" height="24" rx="3" fill="#fff"/><rect x="24.5" y="21" width="2.6" height="6" rx="1.3" fill="#3182F6"/></svg>';

  /* ---------- 토스트 ---------- */
  let tt;
  const toast = msg => { const t = $('#toast'); t.innerHTML = ic('check') + esc(msg); t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2000); };

  /* ---------- 표시용 ---------- */
  const WORK = { full: '전체 교체', part: '일부 교체', screen: '방충망', unsure: '기타 · 도소매' };
  const ST = window.STATUS;
  const fmtWhen = iso => {
    const d = new Date(iso), now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '방금';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400 && d.getDate() === now.getDate()) return Math.floor(diff / 3600) + '시간 전';
    const y = new Date(now); y.setDate(now.getDate() - 1);
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (d.toDateString() === y.toDateString()) return '어제 ' + hm;
    return `${d.getMonth() + 1}.${d.getDate()} ${hm}`;
  };
  const fullDate = iso => { const d = new Date(iso); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const won = n => (n || n === 0) ? Number(n).toLocaleString('ko-KR') + '원' : '';
  const badge = s => `<span class="st st-${ST[s]?.c || 'grey'}">${ST[s]?.t || s}</span>`;

  /* ---------- 상태 ---------- */
  let rows = [], filter = 'all', query = '';

  /* ---------- 로그인 ---------- */
  async function boot() {
    $('#modeTag').textContent = STORE.mode === 'local' ? '데모 모드 · 이 브라우저에만 저장' : '운영 모드';
    $('#modeTag').classList.toggle('demo', STORE.mode === 'local');
    if (STORE.mode === 'local') {
      $('#emailField').hidden = true;
      $('#demoHint').hidden = false;
      $('#demoPw').textContent = S.demoAdminPassword;
    }
    let ok = false;
    try { ok = await STORE.session(); } catch (e) { /* 연결 실패 */ }
    ok ? showApp() : showLogin();
  }
  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; setTimeout(() => (STORE.mode === 'local' ? $('#pw') : $('#email')).focus(), 50); }
  async function showApp() { $('#login').hidden = true; $('#app').hidden = false; await load(); }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#loginBtn');
    btn.disabled = true; btn.textContent = '확인 중…'; $('#loginErr').textContent = '';
    try { await STORE.login($('#email').value.trim(), $('#pw').value); showApp(); }
    catch (err) { $('#loginErr').textContent = err.message; $('#pw').select(); }
    finally { btn.disabled = false; btn.textContent = '로그인'; }
  });
  $('#logoutBtn').addEventListener('click', async () => { await STORE.logout(); location.reload(); });

  /* ---------- 불러오기 ---------- */
  async function load(silent) {
    try {
      const before = new Set(rows.map(r => r.id));
      rows = await STORE.listRequests();
      const fresh = rows.filter(r => !before.has(r.id) && before.size);
      if (silent && fresh.length) toast(`새 신청 ${fresh.length}건이 들어왔어요`);
      $('#updated').textContent = `마지막 확인 ${fullDate(new Date().toISOString())}`;
      render();
    } catch (e) {
      $('#updated').textContent = '불러오지 못했어요. 인터넷 연결이나 설정을 확인해 주세요.';
    }
  }
  $('#refreshBtn').addEventListener('click', () => load().then(() => toast('새로고침했어요')));
  setInterval(() => !document.hidden && load(true), 30000);
  addEventListener('storage', e => { if (e.key && e.key.startsWith('sw_requests')) load(true); }); // 데모: 다른 탭 신청 바로 반영

  /* ---------- 그리기 ---------- */
  function render() {
    // 요약 숫자
    const n = s => rows.filter(r => r.status === s).length;
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    const monthRows = rows.filter(r => new Date(r.created_at) >= month);
    const today = rows.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
    $('#kpis').innerHTML = [
      ['새 신청', n('new'), today ? `오늘 ${today}건` : '오늘 0건', 'blue'],
      ['상담 · 실측 진행', n('contact') + n('measure'), `실측 예약 ${n('measure')}건`, 'orange'],
      ['이번 달 신청', monthRows.length, `계약 ${monthRows.filter(r => ['contract', 'done'].includes(r.status)).length}건`, ''],
      ['이번 달 계약 금액', null, won(monthRows.filter(r => ['contract', 'done'].includes(r.status)).reduce((a, r) => a + (+r.quote || 0), 0)) || '0원', 'green'],
    ].map(([k, v, sub, c]) => `<div class="kpi ${c}"><span>${k}</span><b>${v === null ? esc(sub) : v + '<small>건</small>'}</b>${v === null ? '<em>계약 · 완료 견적 합계</em>' : `<em>${esc(sub)}</em>`}</div>`).join('');

    // 탭
    const tabs = [['all', '전체', rows.length], ...Object.entries(ST).map(([k, v]) => [k, v.t, n(k)])];
    $('#tabs').innerHTML = tabs.map(([k, t, c]) => `<button class="tab ${filter === k ? 'on' : ''}" data-f="${k}">${t}<span>${c}</span></button>`).join('');

    // 목록
    const q = query.replace(/[\s-]/g, '').toLowerCase();
    const list = rows.filter(r => (filter === 'all' || r.status === filter) &&
      (!q || [r.name, r.phone, r.region, r.apt, r.memo, r.admin_memo].join(' ').replace(/[\s-]/g, '').toLowerCase().includes(q)));

    $('#rows').innerHTML = list.map(r => `
      <tr data-id="${esc(r.id)}" class="${r.status === 'new' ? 'is-new' : ''}">
        <td class="c-when"><span class="dot"></span>${fmtWhen(r.created_at)}</td>
        <td class="c-who"><b>${esc(r.name)}</b><span>${esc(r.phone)}</span></td>
        <td>${esc((r.work || []).map(w => WORK[w] || w).join(', '))}${r.photos?.length ? `<span class="pic">사진 ${r.photos.length}</span>` : ''}</td>
        <td>${esc([r.home_type, r.size, r.expanded].filter(Boolean).join(' · '))}</td>
        <td>${esc(r.region)}${r.apt ? `<span class="sub">${esc(r.apt)}</span>` : ''}</td>
        <td class="c-memo">${esc((r.memo || "").slice(0, 40))}${(r.memo || "").length > 40 ? "…" : ""}</td>
        <td>${badge(r.status)}${r.measure_at ? `<span class="sub">${fmtMeasure(r.measure_at)}</span>` : ''}</td>
      </tr>`).join('');

    const empty = !list.length;
    $('#tbl').hidden = empty;
    $('#empty').hidden = !empty;
    if (empty) {
      $('#emptyTitle').textContent = rows.length ? '조건에 맞는 문의가 없어요' : '아직 들어온 문의가 없어요';
      $('#emptyDesc').textContent = rows.length ? '검색어나 상태를 바꿔보세요.' : '홈페이지에서 문의가 들어오면 여기에 바로 떠요.';
      $('#seedBtn').hidden = !(STORE.mode === 'local' && !rows.length);
    }
  }
  const fmtMeasure = iso => { const d = new Date(iso); const w = '일월화수목금토'[d.getDay()]; return `실측 ${d.getMonth() + 1}/${d.getDate()}(${w}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  $('#tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; filter = b.dataset.f; render(); });
  $('#q').addEventListener('input', e => { query = e.target.value.trim(); render(); });
  $('#rows').addEventListener('click', e => { const tr = e.target.closest('tr'); if (tr) openDrawer(tr.dataset.id); });

  /* ---------- 상세 서랍 ---------- */
  const drawer = $('#drawer');
  const closeDrawer = () => { document.body.classList.remove('drawer-open'); drawer.setAttribute('aria-hidden', 'true'); };
  $('#drawerBg').addEventListener('click', closeDrawer);
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#viewer').hidden) $('#viewer').hidden = true; else closeDrawer(); } });

  async function openDrawer(id) {
    const r = rows.find(x => x.id === id); if (!r) return;
    const toLocal = iso => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
    const tel = (r.phone || '').replace(/\D/g, '');
    drawer.innerHTML = `
      <div class="dw-head">
        <div><span class="muted small">${fullDate(r.created_at)} 접수</span><h2>${esc(r.name)} <span class="muted">고객님</span></h2></div>
        <button class="dw-close" type="button" aria-label="닫기">${ic('x')}</button>
      </div>
      <div class="dw-body">
        <div class="dw-call">
          <a class="btn fill" href="tel:${tel}">${ic('phone')}${esc(r.phone)}</a>
          <a class="btn" href="sms:${tel}">${ic('msg')}문자</a>
          <button class="btn" type="button" data-copy="${esc(r.phone)}" aria-label="번호 복사">${ic('copy')}</button>
        </div>

        <div class="dw-sec">
          <p class="dw-label">진행 상태</p>
          <div class="st-pick" id="stPick">${Object.entries(ST).map(([k, v]) => `<button type="button" data-s="${k}" class="${r.status === k ? 'on ' : ''}c-${v.c}">${v.t}</button>`).join('')}</div>
        </div>

        <div class="dw-grid">
          <label class="field"><span class="label">실측 일정</span><input class="input" type="datetime-local" id="dMeasure" value="${toLocal(r.measure_at)}"></label>
          <label class="field"><span class="label">견적 금액 (원)</span><input class="input" inputmode="numeric" id="dQuote" placeholder="예: 11900000" value="${r.quote ?? ''}"></label>
        </div>
        <label class="field"><span class="label">관리자 메모 <span class="opt">(고객에게 안 보여요)</span></span><textarea class="textarea" id="dMemo" placeholder="통화 내용, 특이사항 등을 적어두세요">${esc(r.admin_memo)}</textarea></label>
        <button class="btn fill block" type="button" id="dSave">저장</button>

        <div class="dw-sec">
          <p class="dw-label">문의 내용</p>
          <dl class="dw-info">
            <div><dt>문의 종류</dt><dd>${esc((r.work || []).map(w => WORK[w] || w).join(', '))}</dd></div>
            ${[r.home_type, r.size, r.expanded].filter(Boolean).length ? `<div><dt>평형</dt><dd>${esc([r.home_type, r.size, r.expanded].filter(Boolean).join(' · '))}</dd></div>` : ''}
            ${(r.rooms || []).length ? `<div><dt>바꿀 곳</dt><dd>${esc(r.rooms.join(', '))}</dd></div>` : ''}
            ${r.glass ? `<div><dt>유리</dt><dd>${esc(r.glass)}</dd></div>` : ''}
            <div><dt>지역</dt><dd>${esc(r.region)}${r.apt ? ' · ' + esc(r.apt) : ''}</dd></div>
            ${r.timing ? `<div><dt>희망 시기</dt><dd>${esc(r.timing)}</dd></div>` : ""}
            ${r.visit_pref ? `<div><dt>실측 희망</dt><dd>${esc(r.visit_pref)}</dd></div>` : ""}
          </dl>
          ${r.memo ? `<div class="dw-memo"><p class="dw-label">고객이 남긴 말</p><p>${esc(r.memo)}</p></div>` : ''}
        </div>

        <div class="dw-sec" id="dPhotosSec" ${r.photos?.length ? '' : 'hidden'}>
          <p class="dw-label">사진 ${r.photos?.length || 0}장</p>
          <div class="dw-photos" id="dPhotos"><span class="muted small">불러오는 중…</span></div>
        </div>

        <button class="dw-del" type="button" id="dDel">${ic('trash')}이 신청 지우기</button>
      </div>`;
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.scrollTop = 0;

    drawer.querySelector('.dw-close').onclick = closeDrawer;
    drawer.querySelector('[data-copy]').onclick = e => { navigator.clipboard?.writeText(e.currentTarget.dataset.copy); toast('번호를 복사했어요'); };

    // 상태는 누르는 즉시 저장
    $('#stPick').addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b || b.classList.contains('on')) return;
      $('#stPick').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      await save(r.id, { status: b.dataset.s }, `'${ST[b.dataset.s].t}'(으)로 바꿨어요`);
    });
    $('#dQuote').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });
    $('#dSave').onclick = () => {
      const m = $('#dMeasure').value;
      save(r.id, {
        measure_at: m ? new Date(m).toISOString() : null,
        quote: $('#dQuote').value ? +$('#dQuote').value : null,
        admin_memo: $('#dMemo').value,
      }, '저장했어요');
    };
    // 실수로 지우지 않게 두 번 눌러야 지워져요
    let armed = false, armTimer;
    $('#dDel').onclick = async () => {
      const b = $('#dDel');
      if (!armed) {
        armed = true; b.classList.add('armed');
        b.innerHTML = `${ic('trash')}한 번 더 누르면 지워져요 (되돌릴 수 없어요)`;
        armTimer = setTimeout(() => { armed = false; b.classList.remove('armed'); b.innerHTML = `${ic('trash')}이 신청 지우기`; }, 4000);
        return;
      }
      clearTimeout(armTimer);
      await STORE.deleteRequest(r.id);
      closeDrawer(); toast('지웠어요'); load();
    };

    if (r.photos?.length) {
      const urls = await STORE.photoUrls(r);
      $('#dPhotos').innerHTML = urls.map(u => `<button type="button" class="ph"><img src="${esc(u)}" alt="고객이 올린 사진"></button>`).join('') || '<span class="muted small">사진을 불러오지 못했어요</span>';
      $('#dPhotos').onclick = e => { const b = e.target.closest('.ph'); if (!b) return; const v = $('#viewer'); v.querySelector('img').src = b.querySelector('img').src; v.hidden = false; };
    }
  }
  $('#viewer').addEventListener('click', () => { $('#viewer').hidden = true; });

  async function save(id, patch, msg) {
    try {
      const upd = await STORE.updateRequest(id, patch);
      const i = rows.findIndex(x => x.id === id); if (i > -1) rows[i] = { ...rows[i], ...upd };
      render(); toast(msg);
    } catch (e) { toast('저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요'); }
  }

  /* ---------- 엑셀(CSV) 내보내기 ---------- */
  $('#exportBtn').addEventListener('click', () => {
    if (!rows.length) return toast('내보낼 신청이 없어요');
    const head = ['접수일시', '상태', '이름', '연락처', '공사', '집 형태', '평형', '확장', '바꿀 곳', '유리', '지역', '아파트·건물', '희망 시기', '실측 희망', '실측 일정', '견적 금액', '고객 요청', '관리자 메모'];
    const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map(r => [fullDate(r.created_at), ST[r.status]?.t, r.name, r.phone, (r.work || []).map(w => WORK[w] || w).join(', '), r.home_type, r.size, r.expanded, (r.rooms || []).join(', '), r.glass, r.region, r.apt, r.timing, r.visit_pref, r.measure_at ? fullDate(r.measure_at) : '', r.quote, r.memo, r.admin_memo].map(cell).join(','));
    const blob = new Blob(['﻿' + [head.map(cell).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = `성원창호_문의_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  });

  /* ---------- 데모: 예시 신청 ---------- */
  $('#seedBtn').addEventListener('click', async () => {
    const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString();
    const soon = (d, h) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
    const mk = (o) => ({ id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()), admin_memo: '', photos: [], visit_pref: '빠를수록 좋아요', ...o });
    await STORE.seed([
      mk({ created_at: ago(0.3), status: 'new', name: '김민지', phone: '010-2345-6789', work: ['full'], home_type: '아파트', size: '30평대', expanded: '확장형', rooms: ['전체'], region: '경기 수원시', apt: 'OO마을 3단지', timing: '한 달 안에', memo: '겨울마다 거실 창에 결로가 심해요.' }),
      mk({ created_at: ago(2), status: 'new', name: '이준호', phone: '010-9876-5432', work: ['part', 'screen'], home_type: '아파트', size: '20평대', expanded: '비확장형', rooms: ['거실', '안방'], region: '서울 송파구', apt: '', timing: '2~3개월 안에', visit_pref: '주말' }),
      mk({ created_at: ago(26), status: 'contact', name: '박서연', phone: '010-5555-1234', work: ['full'], home_type: '아파트', size: '40평대', expanded: '확장형', rooms: ['전체'], region: '경기 용인시', apt: 'OO아파트 105동', timing: '이사 날짜에 맞춰', admin_memo: '12/20 이사. 그 전 주 공사 희망. 저녁에 통화 가능' }),
      mk({ created_at: ago(50), status: 'measure', measure_at: soon(2, 10), name: '최현우', phone: '010-3333-7777', work: ['full'], home_type: '빌라', size: '20평대', expanded: '모름', rooms: ['거실', '작은방', '주방'], region: '경기 성남시', apt: '', timing: '한 달 안에' }),
      mk({ created_at: ago(120), status: 'contract', quote: 11900000, name: '정다은', phone: '010-4444-8888', work: ['full', 'screen'], home_type: '아파트', size: '30평대', expanded: '확장형', rooms: ['전체'], glass: '로이 복층유리', region: '경기 화성시', apt: 'OO센트럴', timing: '한 달 안에', admin_memo: '12/5(금) 시공 확정. 사다리차 필요 없음' }),
      mk({ created_at: ago(300), status: 'done', quote: 2600000, name: '한지훈', phone: '010-1212-3434', work: ['part'], home_type: '아파트', size: '30평대', expanded: '비확장형', rooms: ['안방'], region: '서울 강동구', apt: '', timing: '아직 미정' }),
    ]);
    toast('예시 신청 6건을 넣었어요');
    load();
  });

  boot();
})();
