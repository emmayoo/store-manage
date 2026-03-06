# 샘플 회원 및 DB 적용 순서

## 수동 마이그레이션 순서 (내부망 등)

1. **리셋** (필요 시): `prisma/migrations/20260305000000_init/reset.sql` 실행
2. **초기 스키마**: `prisma/migrations/20260305000000_init/migration.sql` 실행
3. **샘플 데이터**: `prisma/migrations/20260305000000_init/seed_sample_users.sql` 실행

## ID 규칙

- 모든 테이블 **id**: 숫자 시퀀스(SERIAL).
- **userId** = `User.id` (불변). **로그인 아이디** = `User.username`. 전화번호(phone)는 변경 가능한 연락처.

## 역할 구조

- **User** 테이블에는 role 없음.
- **지점(매장)별 역할**은 **Employment** 테이블의 `role` 컬럼 (매장 생성자 = OWNER, 매장별로 유저마다 OWNER/MANAGER/STAFF).

## 샘플 계정 (로그인용)

로그인: **아이디(username)** + 비밀번호.

| 아이디 | 비밀번호 | 본점 기준 역할 |
|--------|----------|----------------|
| admin | admin123 | OWNER |
| manager | manager1 | MANAGER |
| staff1 | staff1 | STAFF |
| staff2 | staff2 | STAFF |

샘플은 매장 1개(본점) + 위 4명이 해당 지점에 소속된 상태로 들어갑니다. 비밀번호는 pgcrypto로 해시 저장됩니다.
