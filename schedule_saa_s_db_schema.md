# Schedule SaaS DB Schema (MVP)

## 시간 저장 전략

시간은 minute-of-day 방식 사용

09:00 = 540
18:00 = 1080

범위

0 ~ 1440

---

## 자정 넘는 근무

예

22:00 ~ 02:00

저장

3/5
1320 ~ 1440

3/6
0 ~ 120

자동으로 2개 row로 분리

---

# Timezone 전략

시간은 UTC가 아니라

지점 로컬 시간 기준

branches 테이블이 timezone 보유

예

Asia/Seoul
Asia/Tokyo
America/New_York

---

# Tables

## users

id
name
email
role
created_at
deleted_at

---

## branches

id
name
timezone
created_at
deleted_at

---

## employments

id
user_id
branch_id
hire_date
resign_date
deleted_at

---

## templates

id
branch_id
name
created_by
created_at
deleted_at

---

## template_items

id
template_id
user_id
weekday
start_minute
end_minute

---

## schedules

id
branch_id
user_id
date
start_minute
end_minute
created_by
created_at
updated_at
deleted_at

---

## day_offs

id
user_id
branch_id
date
reason
created_at

---

## schedule_histories

id
schedule_id
action_type
changed_by
as_is
 to_be
created_at

---

# Indexes

(branch_id, date, deleted_at)
(user_id, date, deleted_at)
(date)

---

# 자동 스케줄 생성 로직

BEGIN

1 기간 스케줄 soft delete

2 template 조회

3 날짜 loop

4 weekday 매칭

5 day_off 체크

6 자정 넘김 split

7 schedule insert

8 history 기록

COMMIT

실패 시 rollback

---

# 캘린더 API 전략

range 조회

GET /schedules?start=2026-03-01&end=2026-03-07

