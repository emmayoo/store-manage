### 서비스 개요

가족이 운영하는 편의점 운영 앱
웹 + 반응형 + PWA 버전 우선
비회원 사용 불가, 카카오 로그인

### 사용자 흐름

1. 로그인 (카카오)
2. 지점 선택

- 목록
- - 지점 추가
- 초대 코드 입력
- 지점 검색 → 입장 요청

3. 메인 앱

### 권한 구조

- 매니저: 지점 생성, 직원 초대/승인, 매니저 권한 부여, 스케줄 CRUD, 요청 승인
- 직원: 스케줄 조회, 수정 요청, 전달사항 작성

### 메인 메뉴

- 캘린더 (일/주/월)
- 관리
  - 발주 금지 목록
  - 신상 발주
  - 유통기한 임박
- 히스토리
- 설정/지점 관리

### 주요 화면 요구사항

#### 캘린더 화면

- 상단: 날짜, 뷰 선택 (일/주/월)
- 본문: 스케줄 카드 (근무, 전달사항 등)
- 플로팅 + 버튼

#### 기록 생성 모달

- 스케줄 타입 선택
- 시간/담당자
- 메모
- 사진/영상 업로드

#### 관리 목록

- 발주 금지 목록
- 신상 발주
- 유통기한 임박

#### 히스토리

- 시간순 이벤트 로그
- 필터 (유형/사용자)

#### 설정

- 지점 정보
- 초대 코드 생성
- 직원 관리

### 공통 UI/UX 원칙

- 모바일 우선 반응형
- 버튼 최소화
- 빠른 접근성

---

## 빠른 시작 (로컬)

### 1) 설치

```bash
pnpm install
```

### 2) Supabase 환경변수

- `.env.example`을 복사해서 `.env`를 만들고 값을 채워주세요.

```bash
cp .env.example .env
```

필수 값:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3) 개발 서버 실행

```bash
pnpm dev
```

---

## Supabase: 스키마 한 번에 적용 (단일 SQL)

MVP 기준으로 **모든 데이터를 `records` 하나로 통합**합니다. (근무/전달사항/발주/유통기한 등)

### 테이블 생성

```sql
create extension if not exists pgcrypto;

-- record_type (idempotent: 기존 enum이면 값만 추가)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'record_type') then
    create type public.record_type as enum ('shift', 'note', 'order', 'expiry', 'announcement', 'todo');
  else
    begin
      alter type public.record_type add value if not exists 'announcement';
    exception when others then null;
    end;
    begin
      alter type public.record_type add value if not exists 'todo';
    exception when others then null;
    end;
  end if;
end $$;

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  store_id uuid null,
  type record_type not null,
  title text null,
  content text null,
  starts_at timestamptz null,
  ends_at timestamptz null,
  payload jsonb null,
  created_by uuid not null references auth.users(id) on delete cascade,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists records_created_by_created_at_idx
  on public.records (created_by, created_at desc);

-- ---------------------------------------------------------------------------
-- Records RLS (기존: 본인 데이터만)
-- ---------------------------------------------------------------------------
alter table public.records enable row level security;

create policy "records_select_own"
  on public.records for select
  using (
    deleted_at is null
    and (
      (store_id is null and auth.uid() = created_by)
      or (
        store_id is not null
        and exists (
          select 1
          from public.store_members m
          where m.store_id = records.store_id
            and m.user_id = auth.uid()
            and m.deleted_at is null
        )
      )
    )
  );

create policy "records_insert_own"
  on public.records for insert
  with check (
    deleted_at is null
    and auth.uid() = created_by
    and (
      (store_id is null)
      or (
        store_id is not null
        and exists (
          select 1
          from public.store_members m
          where m.store_id = records.store_id
            and m.user_id = auth.uid()
            and m.deleted_at is null
        )
        and (
          type not in ('shift','announcement')
          or public.is_store_manager_or_owner(store_id)
        )
      )
    )
  );

create policy "records_update_own"
  on public.records for update
  using (
    deleted_at is null
    and (
      (store_id is null and auth.uid() = created_by)
      or (
        store_id is not null
        and (
          auth.uid() = created_by
          or (type in ('shift','announcement') and public.is_store_manager_or_owner(store_id))
        )
      )
    )
  )
  with check (
    deleted_at is null
    and (
      (store_id is null and auth.uid() = created_by)
      or (
        store_id is not null
        and (
          auth.uid() = created_by
          or (type in ('shift','announcement') and public.is_store_manager_or_owner(store_id))
        )
      )
    )
  );

create policy "records_delete_own"
  on public.records for delete
  using (
    deleted_at is null
    and (
      (store_id is null and auth.uid() = created_by)
      or (
        store_id is not null
        and (
          auth.uid() = created_by
          or (type in ('shift','announcement') and public.is_store_manager_or_owner(store_id))
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Stores / Members / Join Requests / Staff management
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

create type store_role as enum ('owner', 'manager', 'staff');
create type join_request_status as enum ('pending', 'approved', 'rejected');
create type join_request_via as enum ('search', 'code');

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text null,
  business_number text null,
  phone text null,
  is_public boolean not null default true,
  invite_code text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_by uuid not null references auth.users(id) on delete cascade,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invite_code)
);

create table if not exists public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role store_role not null default 'staff',
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table if not exists public.store_join_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status join_request_status not null default 'pending',
  via join_request_via not null default 'search',
  message text null,
  decided_by uuid null references auth.users(id) on delete set null,
  decided_at timestamptz null,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Profiles (내 정보)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  birth_date date null,
  phone text null,
  avatar_path text null,
  color text null,
  memo text null,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles (user_id);

-- ---------------------------------------------------------------------------
-- Record pins (공지 중요표시)
-- ---------------------------------------------------------------------------
create table if not exists public.record_pins (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid not null references public.records(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, record_id)
);

create index if not exists record_pins_user_id_idx on public.record_pins (user_id);

-- 권한 체크 helper
create or replace function public.is_store_owner(p_store_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.store_members m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
      and m.deleted_at is null
  );
$$;

create or replace function public.is_store_manager_or_owner(p_store_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.store_members m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.role in ('owner','manager')
      and m.deleted_at is null
  );
$$;

-- 초대코드로 지점 최소정보 조회 (코드 유출 방지)
create or replace function public.get_store_by_invite_code(p_code text)
returns table (id uuid, name text, is_public boolean)
language sql
security definer
set search_path = public
as $$
  select s.id, s.name, s.is_public
  from public.stores s
  where s.invite_code = p_code
    and s.deleted_at is null
  limit 1;
$$;

-- 초대코드 회전 (owner만)
create or replace function public.rotate_store_invite_code(p_store_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_code text;
begin
  if not public.is_store_owner(p_store_id) then
    raise exception 'not owner';
  end if;

  next_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  update public.stores
    set invite_code = next_code, updated_at = now()
    where id = p_store_id and deleted_at is null;
  return next_code;
end;
$$;

-- 입장요청 승인/거절은 원자적으로 처리 (owner/manager)
create or replace function public.approve_store_join_request(p_request_id uuid, p_role store_role default 'staff')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_user_id uuid;
begin
  select r.store_id, r.user_id into v_store_id, v_user_id
  from public.store_join_requests r
  where r.id = p_request_id and r.status = 'pending';

  if v_store_id is null then
    raise exception 'request not found';
  end if;

  if not public.is_store_manager_or_owner(v_store_id) then
    raise exception 'not allowed';
  end if;

  insert into public.store_members (store_id, user_id, role)
    values (v_store_id, v_user_id, p_role)
    on conflict (store_id, user_id) do update
      set role = excluded.role, deleted_at = null, updated_at = now();

  update public.store_join_requests
    set status = 'approved', decided_by = auth.uid(), decided_at = now(), updated_at = now()
    where id = p_request_id;
end;
$$;

create or replace function public.reject_store_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
begin
  select r.store_id into v_store_id
  from public.store_join_requests r
  where r.id = p_request_id and r.status = 'pending';

  if v_store_id is null then
    raise exception 'request not found';
  end if;

  if not public.is_store_manager_or_owner(v_store_id) then
    raise exception 'not allowed';
  end if;

  update public.store_join_requests
    set status = 'rejected', decided_by = auth.uid(), decided_at = now(), updated_at = now()
    where id = p_request_id;
end;
$$;

-- 지점 soft delete (owner만) + 연관 데이터 soft delete
create or replace function public.soft_delete_store(p_store_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_store_owner(p_store_id) then
    raise exception 'not owner';
  end if;

  update public.stores
    set deleted_at = now(), updated_at = now()
    where id = p_store_id and deleted_at is null;

  update public.store_members
    set deleted_at = now(), updated_at = now()
    where store_id = p_store_id and deleted_at is null;

  update public.store_join_requests
    set deleted_at = now(), updated_at = now()
    where store_id = p_store_id and deleted_at is null;

  update public.records
    set deleted_at = now(), updated_at = now()
    where store_id = p_store_id and deleted_at is null;
end;
$$;

-- 직원 역할 변경 (owner만 manager 지정 가능)
create or replace function public.set_store_member_role(
  p_store_id uuid,
  p_user_id uuid,
  p_role store_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 요구사항: manager 이상이 직원 관리 가능. 다만 manager 지정은 owner만.
  if not public.is_store_manager_or_owner(p_store_id) then
    raise exception 'not allowed';
  end if;

  if p_role in ('owner','manager') and not public.is_store_owner(p_store_id) then
    raise exception 'only owner can grant owner/manager';
  end if;

  -- owner의 role을 변경하려는 시도 방지
  if exists (
    select 1 from public.store_members m
    where m.store_id = p_store_id and m.user_id = p_user_id and m.role = 'owner' and m.deleted_at is null
  ) then
    raise exception 'cannot change owner role';
  end if;

  update public.store_members
    set role = p_role, updated_at = now()
    where store_id = p_store_id
      and user_id = p_user_id
      and deleted_at is null;
end;
$$;

-- 직원 제거(soft delete) (manager 이상, owner는 제거 불가)
create or replace function public.soft_delete_store_member(
  p_store_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_store_manager_or_owner(p_store_id) then
    raise exception 'not allowed';
  end if;

  if exists (
    select 1 from public.store_members m
    where m.store_id = p_store_id and m.user_id = p_user_id and m.role = 'owner' and m.deleted_at is null
  ) then
    raise exception 'cannot remove owner';
  end if;

  update public.store_members
    set deleted_at = now(), updated_at = now()
    where store_id = p_store_id and user_id = p_user_id and deleted_at is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS (stores/members/join_requests)
-- ---------------------------------------------------------------------------
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.store_join_requests enable row level security;
alter table public.profiles enable row level security;
alter table public.record_pins enable row level security;

-- stores: 멤버는 조회 가능 + public은 최소 조회 가능
create policy "stores_select_member_or_public"
  on public.stores for select
  using (
    deleted_at is null
    and (
      is_public = true
      or exists (
      select 1 from public.store_members m
      where m.store_id = stores.id
        and m.user_id = auth.uid()
        and m.deleted_at is null
      )
    )
  );

-- stores: 생성은 로그인 유저
create policy "stores_insert_own"
  on public.stores for insert
  with check (auth.uid() = created_by);

-- stores: 수정은 owner만
create policy "stores_update_owner"
  on public.stores for update
  using (public.is_store_owner(stores.id) and deleted_at is null)
  with check (public.is_store_owner(stores.id) and deleted_at is null);

-- store_members: 본인 row 조회 가능 + 같은 지점의 owner/manager는 조회 가능
create policy "members_select"
  on public.store_members for select
  using (
    deleted_at is null
    and (
      user_id = auth.uid()
      or public.is_store_manager_or_owner(store_id)
    )
  );

-- store_members: 본인 가입(생성)만 허용 (승인은 RPC로 처리)
create policy "members_insert_self"
  on public.store_members for insert
  with check (user_id = auth.uid() and deleted_at is null);

-- store_members: role 변경/삭제는 owner만
create policy "members_update_owner"
  on public.store_members for update
  using (public.is_store_owner(store_id) and deleted_at is null)
  with check (public.is_store_owner(store_id) and deleted_at is null);

create policy "members_delete_owner"
  on public.store_members for delete
  using (public.is_store_owner(store_id));

-- join requests: 본인 요청 insert/select 가능
create policy "join_requests_insert_self"
  on public.store_join_requests for insert
  with check (user_id = auth.uid() and deleted_at is null);

create policy "join_requests_select_self_or_admin"
  on public.store_join_requests for select
  using (
    deleted_at is null
    and (
      user_id = auth.uid()
      or public.is_store_manager_or_owner(store_id)
    )
  );

-- profiles: 본인 프로필 CRUD
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_upsert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id and deleted_at is null);

create policy "profiles_upsert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id and deleted_at is null);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id and deleted_at is null);

-- record_pins: 본인만 select/insert/delete
drop policy if exists "record_pins_select_own" on public.record_pins;
drop policy if exists "record_pins_insert_own" on public.record_pins;
drop policy if exists "record_pins_delete_own" on public.record_pins;

create policy "record_pins_select_own"
  on public.record_pins for select
  using (auth.uid() = user_id);

create policy "record_pins_insert_own"
  on public.record_pins for insert
  with check (auth.uid() = user_id);

create policy "record_pins_delete_own"
  on public.record_pins for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 마이그레이션(기존 프로젝트에 적용)
-- ---------------------------------------------------------------------------
alter table public.records add column if not exists deleted_at timestamptz null;
alter table public.stores add column if not exists deleted_at timestamptz null;
alter table public.stores add column if not exists address text null;
alter table public.stores add column if not exists business_number text null;
alter table public.stores add column if not exists phone text null;
alter table public.store_members add column if not exists deleted_at timestamptz null;
alter table public.store_join_requests add column if not exists deleted_at timestamptz null;
alter table public.record_pins add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists display_name text null;
alter table public.profiles add column if not exists birth_date date null;
alter table public.profiles add column if not exists phone text null;
alter table public.profiles add column if not exists avatar_path text null;
alter table public.profiles add column if not exists color text null;
alter table public.profiles add column if not exists memo text null;
alter table public.profiles add column if not exists deleted_at timestamptz null;
```

---

## 현재 구현된 최소 흐름 (MVP)

- **`/login`**: Supabase OAuth(카카오) 로그인
- **`/calendar`**: 월/주/일/기간 캘린더 + 스케줄 등록/표시
