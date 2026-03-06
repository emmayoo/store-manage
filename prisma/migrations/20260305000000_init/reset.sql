-- 1) 외래키 제약조건 제거
ALTER TABLE IF EXISTS "ScheduleHistory" DROP CONSTRAINT IF EXISTS "ScheduleHistory_schedule_id_fkey";
ALTER TABLE IF EXISTS "ScheduleHistory" DROP CONSTRAINT IF EXISTS "ScheduleHistory_changed_by_fkey";

ALTER TABLE IF EXISTS "DayOff" DROP CONSTRAINT IF EXISTS "DayOff_user_id_fkey";
ALTER TABLE IF EXISTS "DayOff" DROP CONSTRAINT IF EXISTS "DayOff_branch_id_fkey";

ALTER TABLE IF EXISTS "Schedule" DROP CONSTRAINT IF EXISTS "Schedule_branch_id_fkey";
ALTER TABLE IF EXISTS "Schedule" DROP CONSTRAINT IF EXISTS "Schedule_user_id_fkey";
ALTER TABLE IF EXISTS "Schedule" DROP CONSTRAINT IF EXISTS "Schedule_created_by_fkey";

ALTER TABLE IF EXISTS "TemplateItem" DROP CONSTRAINT IF EXISTS "TemplateItem_template_id_fkey";
ALTER TABLE IF EXISTS "TemplateItem" DROP CONSTRAINT IF EXISTS "TemplateItem_user_id_fkey";

ALTER TABLE IF EXISTS "Template" DROP CONSTRAINT IF EXISTS "Template_branch_id_fkey";

ALTER TABLE IF EXISTS "Employment" DROP CONSTRAINT IF EXISTS "Employment_user_id_fkey";
ALTER TABLE IF EXISTS "Employment" DROP CONSTRAINT IF EXISTS "Employment_branch_id_fkey";

ALTER TABLE IF EXISTS "BranchInvite" DROP CONSTRAINT IF EXISTS "BranchInvite_branch_id_fkey";
ALTER TABLE IF EXISTS "BranchInvite" DROP CONSTRAINT IF EXISTS "BranchInvite_created_by_fkey";

-- 2) 테이블 삭제 (의존 관계 역순)
DROP TABLE IF EXISTS "ScheduleHistory";
DROP TABLE IF EXISTS "DayOff";
DROP TABLE IF EXISTS "Schedule";
DROP TABLE IF EXISTS "TemplateItem";
DROP TABLE IF EXISTS "Template";
DROP TABLE IF EXISTS "Employment";
DROP TABLE IF EXISTS "BranchInvite";
DROP TABLE IF EXISTS "Branch";
DROP TABLE IF EXISTS "User";

-- 3) enum 타입 삭제
DROP TYPE IF EXISTS "ScheduleHistoryActionType";
DROP TYPE IF EXISTS "BranchRole";
