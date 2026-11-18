/* ==========================================================
   견적 신청 저장소
   site-config.js 의 backend.type 에 따라
   · local    → 이 브라우저(localStorage)에 저장 (데모)
   · supabase → Supabase 데이터베이스에 저장 (실제 운영)
   신청 페이지와 관리자 페이지가 같은 함수를 써요.
   ========================================================== */
(function () {
  const S = window.SITE || {};
  const cfg = S.backend || { type: 'local' };
  const KEY = 'sw_requests_v1';
  const SESSION = 'sw_admin_session';

  /* ---------- 공통: 사진 줄이기 ---------- */
  function shrink(file, max = 1280, q = 0.78) {
    return new Promise((res, rej) => {
      if (!file.type.startsWith('image/')) return res(null);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => res(b), 'image/jpeg', q);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }
  const blobToDataURL = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  /* ==========================================================
     데모 모드 (localStorage)
     ========================================================== */
  const Local = {
    mode: 'local',
    _all() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } },
    _save(list) {
      try { localStorage.setItem(KEY, JSON.stringify(list)); }
      catch (e) { throw new Error('브라우저 저장 공간이 꽉 찼어요. 관리자 페이지에서 오래된 신청을 지워주세요.'); }
    },
    async createRequest(data, files = []) {
      const photos = [];
      for (const f of files.slice(0, 5)) {
        const b = await shrink(f, 720, 0.6);   // 데모는 저장 공간이 작아서 더 작게
        if (b) photos.push(await blobToDataURL(b));
      }
      const row = { id: uid(), created_at: new Date().toISOString(), status: 'new', admin_memo: '', ...data, photos };
      const list = this._all(); list.unshift(row); this._save(list);
      return row;
    },
    async listRequests() { return this._all(); },
    async updateRequest(id, patch) {
      const list = this._all(); const i = list.findIndex(r => r.id === id);
      if (i < 0) throw new Error('신청을 찾을 수 없어요');
      list[i] = { ...list[i], ...patch, updated_at: new Date().toISOString() }; this._save(list);
      return list[i];
    },
    async deleteRequest(id) { this._save(this._all().filter(r => r.id !== id)); },
    async photoUrls(row) { return row.photos || []; },
    async login(_email, pw) {
      if (pw !== S.demoAdminPassword) throw new Error('비밀번호가 맞지 않아요');
      sessionStorage.setItem(SESSION, '1'); return true;
    },
    async logout() { sessionStorage.removeItem(SESSION); },
    async session() { return sessionStorage.getItem(SESSION) === '1'; },
    async seed(rows) { const list = this._all(); this._save([...rows, ...list]); },
  };

  /* ==========================================================
     운영 모드 (Supabase)
     ========================================================== */
  let sb = null;
  async function client() {
    if (sb) return sb;
    if (!window.supabase) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
        s.onload = res; s.onerror = () => rej(new Error('Supabase를 불러오지 못했어요'));
        document.head.append(s);
      });
    }
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return sb;
  }
  const BUCKET = 'request-photos';
  const COLS = ['name', 'phone', 'work', 'home_type', 'size', 'expanded', 'rooms', 'glass', 'timing', 'region', 'apt', 'visit_pref', 'memo'];

  const Remote = {
    mode: 'supabase',
    async createRequest(data, files = []) {
      const c = await client();
      const id = uid();
      const photos = [];
      for (const [i, f] of files.slice(0, 5).entries()) {
        const b = await shrink(f);
        if (!b) continue;
        const path = `${id}/${i + 1}.jpg`;
        const { error } = await c.storage.from(BUCKET).upload(path, b, { contentType: 'image/jpeg' });
        if (!error) photos.push(path);
      }
      const row = { id, status: 'new', photos };
      COLS.forEach(k => { if (data[k] !== undefined) row[k] = data[k]; });
      const { error } = await c.from('requests').insert(row);   // 손님은 넣기만 가능 (읽기 권한 없음)
      if (error) throw new Error('신청을 저장하지 못했어요. 전화로 문의해 주세요.');
      return row;
    },
    async listRequests() {
      const c = await client();
      const { data, error } = await c.from('requests').select('*').order('created_at', { ascending: false }).limit(1000);
      if (error) throw error; return data;
    },
    async updateRequest(id, patch) {
      const c = await client();
      const { data, error } = await c.from('requests').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error; return data;
    },
    async deleteRequest(id) {
      const c = await client();
      const { data: row } = await c.from('requests').select('photos').eq('id', id).single();
      if (row?.photos?.length) await c.storage.from(BUCKET).remove(row.photos);
      const { error } = await c.from('requests').delete().eq('id', id);
      if (error) throw error;
    },
    async photoUrls(row) {
      if (!row.photos?.length) return [];
      const c = await client();
      const { data } = await c.storage.from(BUCKET).createSignedUrls(row.photos, 3600);
      return (data || []).map(d => d.signedUrl);
    },
    async login(email, pw) {
      const c = await client();
      const { error } = await c.auth.signInWithPassword({ email, password: pw });
      if (error) throw new Error('이메일이나 비밀번호가 맞지 않아요');
      return true;
    },
    async logout() { const c = await client(); await c.auth.signOut(); },
    async session() { const c = await client(); const { data } = await c.auth.getSession(); return !!data.session; },
  };

  const ready = cfg.type === 'supabase' && cfg.supabaseUrl && cfg.supabaseAnonKey;
  if (cfg.type === 'supabase' && !ready) console.warn('[store] supabase 설정값이 비어 있어서 데모 모드로 동작해요.');
  window.STORE = ready ? Remote : Local;

  /* 상태 이름 */
  window.STATUS = {
    new: { t: '신규', c: 'blue' },
    contact: { t: '상담 중', c: 'orange' },
    measure: { t: '실측 예약', c: 'violet' },
    contract: { t: '계약', c: 'green' },
    done: { t: '시공 완료', c: 'grey' },
    cancel: { t: '취소', c: 'red' },
  };
})();
