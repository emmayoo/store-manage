/**
 * 템플릿 기반 스케줄 자동 생성
 * POST /api/schedules/generate
 * body: { branchId, templateId, startDate, endDate, createdBy }
 * 스키마 문서: 기존 기간 soft delete → template 조회 → 날짜 루프 → weekday 매칭 → day_off 체크 → 자정 넘김 split → insert → history
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, templateId, startDate, endDate, createdBy } = body as {
      branchId: number;
      templateId: number;
      startDate: string;
      endDate: string;
      createdBy: number;
    };

    if (branchId == null || templateId == null || !startDate || !endDate || createdBy == null) {
      return NextResponse.json(
        { error: "branchId, templateId, startDate, endDate, createdBy required" },
        { status: 400 }
      );
    }

    const branchIdNum = Number(branchId);
    const templateIdNum = Number(templateId);
    const createdByNum = Number(createdBy);

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    const template = await prisma.template.findFirst({
      where: { id: templateIdNum, branchId: branchIdNum, deletedAt: null },
      include: { items: true },
    });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // 퇴사자 제외: 해당 기간에 재직 중인 user만 (기획서: 퇴사 시 새 스케줄 생성 대상에서 제외)
    const employments = await prisma.employment.findMany({
      where: {
        branchId: branchIdNum,
        deletedAt: null,
        OR: [
          { resignDate: null },
          { resignDate: { gt: end } },
        ],
      },
      select: { userId: true },
    });
    const activeUserIds = new Set(employments.map((e) => e.userId));

    await prisma.$transaction(async (tx) => {
      // 1. 해당 기간 스케줄 soft delete
      await tx.schedule.updateMany({
        where: {
          branchId: branchIdNum,
          date: { gte: start, lte: end },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      const dayOffs = await tx.dayOff.findMany({
        where: { branchId: branchIdNum, date: { gte: start, lte: end } },
      });
      const dayOffSet = new Set(
        dayOffs.map((d) => `${d.userId}:${d.date.toISOString().slice(0, 10)}`)
      );

      const { ScheduleHistoryActionType } = await import("@/app/generated/prisma/client");

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);
        const weekday = d.getDay(); // 0=Sun, 1=Mon, ...

        for (const item of template.items) {
          if (!activeUserIds.has(item.userId)) continue;
          const key = `${item.userId}:${dateStr}`;
          if (dayOffSet.has(key)) continue;

          let startMinute = item.startMinute;
          let endMinute = item.endMinute;

          if (endMinute <= startMinute) {
            // 자정 넘는 근무: 두 row로 분리
            const s1 = await tx.schedule.create({
              data: {
                branchId: branchIdNum,
                userId: item.userId,
                date: new Date(dateStr),
                startMinute,
                endMinute: 1440,
                createdBy: createdByNum,
              },
            });
            await tx.scheduleHistory.create({
              data: {
                scheduleId: s1.id,
                actionType: ScheduleHistoryActionType.CREATE,
                changedBy: createdByNum,
                toBe: JSON.stringify({ startMinute, endMinute: 1440 }),
              },
            });

            const s2 = await tx.schedule.create({
              data: {
                branchId: branchIdNum,
                userId: item.userId,
                date: new Date(new Date(dateStr).getTime() + 86400000),
                startMinute: 0,
                endMinute,
                createdBy: createdByNum,
              },
            });
            await tx.scheduleHistory.create({
              data: {
                scheduleId: s2.id,
                actionType: ScheduleHistoryActionType.CREATE,
                changedBy: createdByNum,
                toBe: JSON.stringify({ startMinute: 0, endMinute }),
              },
            });
          } else {
            const s = await tx.schedule.create({
              data: {
                branchId: branchIdNum,
                userId: item.userId,
                date: new Date(dateStr),
                startMinute,
                endMinute,
                createdBy: createdByNum,
              },
            });
            await tx.scheduleHistory.create({
              data: {
                scheduleId: s.id,
                actionType: ScheduleHistoryActionType.CREATE,
                changedBy: createdByNum,
                toBe: JSON.stringify({ startMinute, endMinute }),
              },
            });
          }
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/schedules/generate]", e);
    return NextResponse.json(
      { error: "Failed to generate schedules" },
      { status: 500 }
    );
  }
}
