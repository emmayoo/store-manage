# YOOPS

> 개인 중심 근무·매장 관리 서비스  
> 기획: [yoops\_기획안\_v_1.md](./yoops_기획안_v_1.md) · UI: [yoops\_모바일\_ui_wireframe_v_1.md](./yoops_모바일_ui_wireframe_v_1.md)

---

## 1. 서비스 개요

**YOOPS는 여러 매장에 소속된 개인 사용자가 자신의 근무, 일정, 매장 공지, 업무를 한 번에 관리할 수 있는 통합 스케줄·운영 도구다.**

- 기존 엑셀/카톡/종이 스케줄의 단절을 해결하고, **"내 기준"**으로 매장과 근무를 바라보게 만드는 것이 핵심 가치
- 웹 + 반응형 + PWA 우선
- 비회원 사용 불가, 카카오(Supabase OAuth) 로그인

---

## 2. 전체 정보 구조 (IA)

```
[Login]
  └─ [Home]
        ├─ Calendar
        ├─ Store (매장 그룹)
        │     ├─ Store Home
        │     ├─ Schedule
        │     ├─ Notices
        │     ├─ 폐기 임박 목록
        │     └─ People
        └─ My Page
```

- **모바일**: 하단 탭 **Home | Cal | + | Store | My**
- **웹**: 좌측 사이드바

---

## 3. 글로벌 UI (와이어프레임 기준)

- **Header**: 현재 매장(전환) / 알림 🔔 (드롭다운)
- **Content**: 스크롤 영역
- **Tab Bar**: Home | Cal | + | Store | My

---

## 4. 주요 화면 요구사항

### Home (개인 통합 대시보드)

- 지금 근무 상태 카드 (근무 중 / 예정 / 휴무), 매장명 + 매장 색상 태그
- 다음 근무 1건
- My TODO (매장 무관, 빠른 체크)
- 오늘의 Notices 요약 (매장별 중요 공지)

### Calendar

- 상단: [일] [주] [월] 뷰 전환, 필터, 이미지 저장
- 필터: 기간, 매장(멀티), 사람
- 색상 = 사람, 이름은 블록 시작점만

### Store

- **진입**: 매장 리스트 → 매장 선택 시 Store 내부
- **Store 내부 탭**: Store Home | Schedule | Notices | 폐기 임박 | People
- Store Settings는 탭에 노출하지 않음 (Owner만 People → 설정 진입)

### Store Home

- 오늘 운영 시간, 휴무 여부
- 오늘 근무자 요약 (시간순, 색상=사람)
- 다가오는 이벤트, 중요 공지 Top 3

### Schedule

- 생성은 Store > Schedule, 조회는 Calendar
- Staff: 조회 + 수정 요청 / Manager·Owner: 생성·수정

### Notices

- [전체] [중요] [발주] [금지] [기타] 타입 필터
- 댓글 없음, 수정 시 이력

### 폐기 임박 목록

- Notices와 완전 분리
- 품목명, 폐기 D-day, 상태 체크

### People

- Owner / Manager / Staff 역할 표시
- Manager 권한 부여·회수 (Owner만), 초대 상태 관리
- Owner만 Store 설정 진입

### My Page

- 내 정보 (이름 / 로그인 정보)
- 설정: 알림, 로그아웃

### 플로팅 액션 (+)

- 개인 TODO 추가
- (권한자) 공지 작성
- (권한자) 이벤트 추가

---

## 5. 권한 구조

| 권한    | 기능        |
| ------- | ----------- |
| Owner   | 모든 기능   |
| Manager | 스케줄/공지 |
| Staff   | 조회 중심   |

---

## 6. 빠른 시작 (로컬)

### 1) 설치

```bash
pnpm install
```

### 2) Supabase 환경변수

`.env.example`을 복사해 `.env`를 만들고 값을 채우세요.

```bash
cp .env.example .env
```

필수 값: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 3) 개발 서버 실행

```bash
pnpm dev
```

---

## 7. Supabase 스키마

MVP 기준 **records 단일 테이블**로 근무/공지/발주/폐기 임박 등을 통합합니다.

- **파일**: [`supabase/schema.sql`](./supabase/schema.sql)
- **적용**: Supabase 대시보드 → SQL Editor에서 파일 내용 붙여넣기 후 실행

---

## 8. 현재 구현된 최소 흐름 (MVP)

- **`/login`**: Supabase OAuth(카카오) 로그인
- **`/home`**: 개인 통합 홈 (오늘 근무, 다음 근무, My TODO, 공지 요약)
- **`/calendar`**: 월/주/일 캘린더 + 스케줄 표시
- **`/store`**: 매장 선택 또는 매장 내부 (Store Home / Schedule / Notices / 폐기 임박 / People)
- **`/settings`** (My): 내 정보, 매장/직원, 앱 설정, 로그아웃
- **`/add`**: 플로팅 (+) — TODO / 공지 / 이벤트 추가 진입
- **`/manage`**: 기획상 Store 탭으로 흡수 → **`/store`로 리다이렉트**
- **`/history`**: 변경 이력 (Store > Schedule과 연계 예정)

---

## 9. 적용한 개선 및 기획 권장 사항

### 코드·UX 개선

- **매장 미선택 시 URL 정리**: `/store/schedule` 등 하위 경로 접근 시 매장이 없으면 `/store`로 리다이렉트해 “매장 선택” 화면과 URL이 일치하도록 함.
- **Store 탭 한글화**: Store 내부 탭을 Home/People → **홈/구성원**으로 통일.
- **Add → 홈 TODO 포커스**: “TODO 추가” 클릭 시 홈으로 이동하면서 **TODO 입력란에 포커스**되도록 함.
- **알림 버튼**: 클릭 시 “알림 기능은 준비 중입니다” 드롭다운 표시 (빈 동작 방지).
- **/manage 제거**: 기획상 “관리”가 Store(공지/폐기)로 흡수되어, `/manage` 접근 시 **`/store`로 리다이렉트**.
- **History 페이지**: “변경 이력”으로 문구 통일, Store > Schedule과 연계한다는 안내 및 “매장 스케줄로 이동” 버튼 추가.

### 기획 측 권장

- **변경 이력 위치**: 기획상 “스케줄 변경 이력”은 Store > Schedule 내에 두고, `/history`는 “전체/통합 이력” 또는 Schedule 화면 내 탭/섹션으로 정리하는 방안 검토.
- **알림 (v1)**: 기획은 “앱 내 알림만”이므로, 알림 버튼 클릭 시 **알림 목록/설정** 화면으로 연결하는 플로우를 한 번 정의해 두면 구현 시 일관되게 적용하기 좋음.

---

## 10. 디자인 가이드 (와이어프레임 초안)

- Primary Color: 매장별 색상
- Neutral UI + Color Accent
- 카드 기반, 아이콘 위주·텍스트 최소화
