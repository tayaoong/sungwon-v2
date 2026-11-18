/*
 * ─────────────────────────────────────────────
 *  업체 정보 — 이 파일만 고치면 모든 페이지에 반영돼요
 * ─────────────────────────────────────────────
 *  · 머리글/바닥글/전화 버튼/플로팅 버튼이 전부 여기 값을 씁니다.
 *  · 본문 안의 data-site="phone" 같은 표시가 붙은 곳도 자동으로 바뀌어요.
 *  · 빈 값('')으로 두면 그 항목은 화면에서 숨겨져요.
 */
window.SITE = {
  name: '성원창호',                       // 로고 옆 상호
  brand: 'KCC',                           // 로고 앞 작은 글자
  nameFull: 'KCC 성원창호',                // 화면에 쓰는 이름
  bizName: '성원창호',                     // 사업자등록증 상호
  dealer: 'KCC 창호 공식 대리점',
  slogan: '제작부터 시공까지, 공장에서 직접 합니다.',
  phone: '010-3636-2079',
  kakaoUrl: '',                           // 카카오톡 채널 주소가 생기면 넣으세요 (비어 있으면 '문자 문의'로 바뀌어요)
  blogUrl: '',
  area: '오산 · 화성 전 지역',
  areaWide: '경기 · 서울 어디든',
  hours: '',                              // 예: '매일 08:00 – 19:00' (비어 있으면 안 보여요)
  owner: '정대남',
  bizNo: '124-44-15365',
  address: '경기 화성시 정남면 덕절제기길 41-8',
  addressOld: '덕절리 379',
  email: '',
  // 시안(데모) 안내 표시 — 실제 오픈할 때 false 로 바꾸세요
  demoNotice: true,

  /*
   * 견적 신청을 어디에 저장할지
   *  · 'local'    : 데모용. 신청이 이 브라우저에만 저장돼요. (설치 없이 바로 확인 가능)
   *  · 'supabase' : 실제 운영용. 어느 기기에서 신청해도 관리자 페이지에 모여요.
   *                 supabase/README.md 순서대로 만든 뒤 아래 두 값을 넣고 type을 바꾸세요.
   */
  backend: {
    type: 'local',
    supabaseUrl: '',      // 예: https://abcdefgh.supabase.co
    supabaseAnonKey: '',  // Project Settings → API → anon public 키
  },
  // 데모 모드 관리자 비밀번호 (supabase 모드에선 쓰지 않아요)
  demoAdminPassword: 'sungwon1234',
};
