-- 샘플: 유저 4명 + 매장 1개 + 지점별 역할(Employment)
-- 로그인 = username(아이디) + 비밀번호. phone은 연락처(변경 가능).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "User" (name, username, phone, password_hash)
VALUES
  ('유저1', 'user1', '010-0000-0001', crypt('test123', gen_salt('bf'))),
  ('유저2', 'user2', '010-0000-0002', crypt('test123', gen_salt('bf'))),
  ('유저3', 'user3', '010-0000-0003', crypt('test123', gen_salt('bf'))),
  ('유저4', 'user4', '010-0000-0004', crypt('test123', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

INSERT INTO "Branch" (name, timezone) VALUES ('본점', 'Asia/Seoul');

INSERT INTO "Employment" (user_id, branch_id, role, hire_date)
SELECT u.id, (SELECT id FROM "Branch" WHERE name = '본점' LIMIT 1), 'OWNER', NOW() FROM "User" u WHERE u.username = 'admin'
ON CONFLICT (user_id, branch_id) DO NOTHING;
INSERT INTO "Employment" (user_id, branch_id, role, hire_date)
SELECT u.id, (SELECT id FROM "Branch" WHERE name = '본점' LIMIT 1), 'MANAGER', NOW() FROM "User" u WHERE u.username = 'manager'
ON CONFLICT (user_id, branch_id) DO NOTHING;
INSERT INTO "Employment" (user_id, branch_id, role, hire_date)
SELECT u.id, (SELECT id FROM "Branch" WHERE name = '본점' LIMIT 1), 'STAFF', NOW() FROM "User" u WHERE u.username = 'staff1'
ON CONFLICT (user_id, branch_id) DO NOTHING;
INSERT INTO "Employment" (user_id, branch_id, role, hire_date)
SELECT u.id, (SELECT id FROM "Branch" WHERE name = '본점' LIMIT 1), 'STAFF', NOW() FROM "User" u WHERE u.username = 'staff2'
ON CONFLICT (user_id, branch_id) DO NOTHING;
