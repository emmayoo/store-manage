# .env 설정 방법

## 1. DATABASE_URL (Supabase PostgreSQL)

이 프로젝트는 **Supabase**의 PostgreSQL을 쓰므로, Supabase에서 연결 정보를 복사해 넣습니다.

### 1) Supabase 대시보드 접속

- https://supabase.com/dashboard 로그인
- 사용할 **프로젝트** 선택

### 2) Database 연결 문자열 복사

- 왼쪽 메뉴 **Project Settings** (톱니바퀴) 클릭
- **Database** 탭 선택
- 아래로 내려서 **Connection string** 섹션 찾기
- **URI** 탭 선택 후 연결 문자열 복사  
  (예: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`)

Supabase가 **두 가지** 연결 방식을 제공할 수 있습니다.

| 용도 | 포트 | 설명 |
|------|------|------|
| **직접 연결 (Direct)** | 5432 | 마이그레이션, Prisma 등에 사용 |
| **Connection pooler (Transaction)** | 6543 | 서버리스/앱에서 연결 풀 사용 시 |

**Prisma + 서버리스** 조합이면 보통 **Transaction pooler(6543)** URL을 쓰는 것이 좋습니다.  
대시보드에서 **Transaction** 또는 **Session** 모드 연결 문자열을 복사하세요.

### 3) 비밀번호만 넣기

연결 문자열에 `[YOUR-PASSWORD]` 부분이 있으면, **DB 비밀번호**로 바꿉니다.

- 비밀번호를 모르면: **Database** 설정 화면에서 **Reset database password**로 새 비밀번호 설정 후 사용

### 4) .env에 넣기

복사한 문자열을 그대로 `DATABASE_URL`에 넣습니다. 한 줄, 따옴표 안에:

```env
DATABASE_URL="postgresql://postgres.[프로젝트ref]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**현재 프로젝트 기준** Supabase URL이 `https://mfoxykbbjhhdobfipcfq.supabase.co` 이라면:

- 호스트는 대시보드에 표시된 그대로 사용 (예: `db.mfoxykbbjhhdobfipcfq.supabase.co:5432` 또는 pooler 주소 `...pooler.supabase.com:6543`)
- `[YOUR-PASSWORD]`만 실제 DB 비밀번호로 교체하면 됩니다.

---

## 2. JWT_SECRET

로그인 세션용 JWT에 쓰는 비밀키입니다.

- **개발**: 아무 긴 문자열(32자 이상 권장)로 설정해도 됩니다.  
  예: `JWT_SECRET="cloudy-blue-today-wish-sunny-weather"`
- **운영**: 반드시 예측 불가능한 랜덤 문자열로 바꾸고, 노출되지 않게 관리하세요.

---

## 3. Supabase URL / Anon Key (선택)

Storage나 Supabase Auth를 쓸 때만 필요합니다.  
이미 `.env`에 다음처럼 들어가 있다면 그대로 두면 됩니다.

```env
NEXT_PUBLIC_SUPABASE_URL="https://mfoxykbbjhhdobfipcfq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="(대시보드 API 설정에서 복사한 anon key)"
```

**anon key** 위치: Project Settings → **API** → Project API keys → `anon` `public` 키 복사.

---

## 4. prisma.config.ts에서 .env 로드

Prisma가 `.env`를 읽으려면 `prisma.config.ts`에 다음이 있어야 합니다.

```ts
import "dotenv/config";
```

이미 있으면 수정할 필요 없습니다. 없으면 파일 상단에 추가하세요.

---

## 5. 확인

터미널에서:

```bash
pnpm db:migrate
```

에러 없이 마이그레이션이 끝나면 `DATABASE_URL` 설정이 정상입니다.
