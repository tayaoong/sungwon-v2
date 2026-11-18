-- ==========================================================
--  KCC성원창호 견적 신청 데이터베이스
--  Supabase → SQL Editor 에 통째로 붙여넣고 Run 하세요.
-- ==========================================================

-- 1) 신청 표
create table if not exists public.requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  status      text not null default 'new'
              check (status in ('new','contact','measure','contract','done','cancel')),
  name        text not null check (char_length(name) between 1 and 40),
  phone       text not null check (phone ~ '^01[016789]-[0-9]{3,4}-[0-9]{4}$'),
  work        text[] default '{}',      -- 공사 종류
  home_type   text,                     -- 아파트 / 빌라 …
  size        text,                     -- 평형
  expanded    text,                     -- 확장 여부
  rooms       text[] default '{}',      -- 교체할 곳
  glass       text,                     -- 유리 희망
  timing      text,                     -- 희망 시공 시기
  region      text,
  apt         text,
  visit_pref  text,                     -- 실측 희망 시간
  memo        text check (char_length(memo) <= 2000),
  photos      text[] default '{}',      -- 저장소 경로
  admin_memo  text default '',
  measure_at  timestamptz,              -- 실측 일정
  quote       integer                   -- 견적 금액(원)
);

alter table public.requests enable row level security;

-- 손님(로그인 안 한 사람): 신청 넣기만 가능, 읽기/수정 불가
drop policy if exists "anyone can insert" on public.requests;
create policy "anyone can insert" on public.requests
  for insert to anon
  with check (status = 'new' and admin_memo = '' and quote is null and measure_at is null);

-- 관리자(로그인한 사람): 전부 가능
drop policy if exists "admin read" on public.requests;
create policy "admin read" on public.requests for select to authenticated using (true);
drop policy if exists "admin update" on public.requests;
create policy "admin update" on public.requests for update to authenticated using (true) with check (true);
drop policy if exists "admin delete" on public.requests;
create policy "admin delete" on public.requests for delete to authenticated using (true);

-- 2) 사진 저장소 (공개 안 함)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-photos', 'request-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "anyone can upload photo" on storage.objects;
create policy "anyone can upload photo" on storage.objects
  for insert to anon with check (bucket_id = 'request-photos');

drop policy if exists "admin read photo" on storage.objects;
create policy "admin read photo" on storage.objects
  for select to authenticated using (bucket_id = 'request-photos');

drop policy if exists "admin delete photo" on storage.objects;
create policy "admin delete photo" on storage.objects
  for delete to authenticated using (bucket_id = 'request-photos');
