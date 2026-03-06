-- userId = User.id(불변). 로그인 = username(아이디), phone은 변경 가능한 연락처.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "BranchRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');
CREATE TYPE "ScheduleHistoryActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3)
);

CREATE TABLE "Branch" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "phone" TEXT,
    "thumbnail" TEXT,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3)
);

CREATE TABLE "Employment" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "branch_id" INTEGER NOT NULL REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "role" "BranchRole" NOT NULL,
    "color" TEXT,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "resign_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3)
);

CREATE TABLE "Template" (
    "id" SERIAL PRIMARY KEY,
    "branch_id" INTEGER NOT NULL REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "name" TEXT NOT NULL,
    "created_by" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3)
);

CREATE TABLE "TemplateItem" (
    "id" SERIAL PRIMARY KEY,
    "template_id" INTEGER NOT NULL REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "user_id" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "weekday" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL
);

CREATE TABLE "Schedule" (
    "id" SERIAL PRIMARY KEY,
    "branch_id" INTEGER NOT NULL REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "user_id" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "date" DATE NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3)
);

CREATE TABLE "DayOff" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "branch_id" INTEGER NOT NULL REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ScheduleHistory" (
    "id" SERIAL PRIMARY KEY,
    "schedule_id" INTEGER NOT NULL REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "action_type" "ScheduleHistoryActionType" NOT NULL,
    "changed_by" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "as_is" TEXT,
    "to_be" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "BranchInvite" (
    "id" SERIAL PRIMARY KEY,
    "branch_id" INTEGER NOT NULL REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Employment_user_id_branch_id_key" ON "Employment"("user_id", "branch_id");
CREATE INDEX "Employment_branch_id_idx" ON "Employment"("branch_id");
CREATE INDEX "Employment_user_id_idx" ON "Employment"("user_id");
CREATE INDEX "TemplateItem_template_id_idx" ON "TemplateItem"("template_id");
CREATE UNIQUE INDEX "TemplateItem_template_id_user_id_weekday_key" ON "TemplateItem"("template_id", "user_id", "weekday");
CREATE INDEX "Schedule_branch_id_date_deleted_at_idx" ON "Schedule"("branch_id", "date", "deleted_at");
CREATE INDEX "Schedule_user_id_date_deleted_at_idx" ON "Schedule"("user_id", "date", "deleted_at");
CREATE INDEX "Schedule_date_idx" ON "Schedule"("date");
CREATE INDEX "DayOff_user_id_date_idx" ON "DayOff"("user_id", "date");
CREATE INDEX "DayOff_branch_id_date_idx" ON "DayOff"("branch_id", "date");
CREATE INDEX "ScheduleHistory_schedule_id_idx" ON "ScheduleHistory"("schedule_id");
CREATE INDEX "ScheduleHistory_created_at_idx" ON "ScheduleHistory"("created_at");

CREATE INDEX "BranchInvite_branch_id_idx" ON "BranchInvite"("branch_id");
CREATE INDEX "BranchInvite_token_idx" ON "BranchInvite"("token");
