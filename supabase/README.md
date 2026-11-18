# 견적 신청을 실제로 받는 방법 (Supabase 연결)

지금 사이트는 **데모 모드**예요. 신청하면 그 신청을 한 브라우저에만 저장돼요.
손님이 휴대폰으로 신청한 걸 사장님 컴퓨터의 관리자 페이지에서 보려면,
아래 순서대로 무료 데이터베이스(Supabase)를 한 번만 연결하면 돼요. 20분 정도 걸려요.

## 1. Supabase 계정과 프로젝트 만들기
1. https://supabase.com 에 들어가서 오른쪽 위 **Start your project**를 누르고 가입해요.
2. **New project**를 눌러요.
   - Name: `sungwon-window` (아무 이름이나 괜찮아요)
   - Database Password: 아무거나 길게 (따로 적어두세요)
   - Region: **Northeast Asia (Seoul)**
3. **Create new project**를 누르고 1~2분 기다려요.

## 2. 표 만들기
1. 왼쪽 메뉴에서 **SQL Editor**를 눌러요.
2. 이 폴더의 `setup.sql` 파일을 메모장으로 열어서 내용을 전부 복사해요.
3. SQL Editor 빈칸에 붙여넣고 오른쪽 아래 **Run**을 눌러요.
4. 아래에 `Success`가 뜨면 끝이에요.

## 3. 관리자 계정 만들기
1. 왼쪽 메뉴 **Authentication** → **Users** → **Add user** → **Create new user**를 눌러요.
2. 사장님 이메일과 비밀번호를 넣고, **Auto Confirm User**에 체크하고 만들어요.
   → 이 이메일과 비밀번호로 관리자 페이지에 로그인해요.
3. 다른 사람이 마음대로 가입하지 못하게
   **Authentication** → **Sign In / Providers** 에서 **Allow new users to sign up**을 꺼주세요.

## 4. 사이트에 연결하기
1. 왼쪽 아래 **Project Settings** → **API** (또는 **Data API**)를 눌러요.
2. `Project URL`과 `anon public` 키를 복사해요.
3. 사이트 폴더의 `assets/js/site-config.js` 파일을 메모장으로 열고 아래처럼 바꿔요.

```js
backend: {
  type: 'supabase',
  supabaseUrl: 'https://여기에-복사한-주소.supabase.co',
  supabaseAnonKey: '여기에 anon public 키',
},
```

4. 저장하고 사이트를 새로고침하면 끝이에요.
   - anon 키는 사이트에 공개돼도 괜찮은 키예요. `setup.sql`의 보안 규칙 때문에
     손님은 **신청 넣기만** 할 수 있고, 남의 신청을 볼 수는 없어요.
   - `service_role` 키는 절대 넣지 마세요.

## 5. 새 신청 알림을 받고 싶다면 (선택)
Supabase **Database → Webhooks**에서 `requests` 표에 새 줄이 생길 때
카카오 알림톡이나 문자 서비스로 보내도록 연결할 수 있어요. 문자 서비스 가입이 필요해서 기본으로는 꺼져 있어요.
