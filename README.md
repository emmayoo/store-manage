# 매장 스케줄 관리 (Store Manager)

매장 운영을 위한 **직원 근무 스케줄 관리 SaaS** (기획: `schedule_saas_product_spec.md`, DB: `schedule_saa_s_db_schema.md`).

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui
- **Backend**: Next.js API Routes
- **DB**: Supabase PostgreSQL, Prisma 7 (Driver Adapter: `@prisma/adapter-pg` + `pg`)
- **Auth**: JWT (httpOnly Cookie) — `lib/auth.ts`
- **PWA**: `app/manifest.ts` (manifest 제공)

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

`postinstall`에서 `prisma generate`가 자동 실행됩니다.

### 2. 환경 변수

`.env.example`을 참고해 `.env`를 만들고 값을 채웁니다.

- **필수**: `DATABASE_URL` (Supabase PostgreSQL 연결 문자열), `JWT_SECRET`
- **선택**: Supabase URL/Anon Key (Storage 등 사용 시)

### 3. DB 마이그레이션

Supabase 프로젝트 생성 후 연결 정보를 `.env`에 넣고:

```bash
pnpm db:migrate
```

마이그레이션 파일: `prisma/migrations/20260305000000_init/migration.sql`  
(이미 DB가 있다면 해당 SQL을 Supabase SQL Editor에서 실행해도 됩니다.)

### 4. 개발 서버

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 접속 시 `/dashboard`로 리다이렉트됩니다.

### 5. 빌드

```bash
pnpm build
pnpm start
```

## 프로젝트 구조 요약

- **`app/(main)/`**: 하단 탭 앱 — 대시보드, 캘린더, 운영, 마이
- **`app/api/`**: 스케줄/템플릿/휴무/지점 API
- **`lib/`**: DB(Prisma 싱글톤), JWT 인증, 유틸
- **`prisma/`**: 스키마 및 마이그레이션
- **`docs/SPEC_REVIEW.md`**: 기획서·DB 스키마 검토 피드백 (수정 반영 사항, MVP 권장 사항)

## API 예시

- `GET /api/schedules?start=2026-03-01&end=2026-03-07` — 캘린더 range 조회
- `POST /api/schedules/generate` — 템플릿 기반 스케줄 자동 생성
- `GET /api/templates?branchId=xxx` — 템플릿 목록
- `GET /api/branches` — 지점 목록

## 기획서 검토

수정·권장 사항은 **`docs/SPEC_REVIEW.md`**에 정리되어 있습니다 (DB 오타 반영, MVP 범위, 인증/퇴사 처리 등).
