/**
 * 수동 일정 생성 (기획서: 버튼 → 생성 모달)
 * POST /api/schedules/create
 * body: branchId, userId, date, startMinute, endMinute, createdBy
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ScheduleHistoryActionType } from "@/app/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, userId, date, startMinute, endMinute, createdBy } = body as {
      branchId: number;
      userId: number;
      date: string;
      startMinute: number;
      endMinute: number;
      createdBy: number;
    };

    if (branchId == null || userId == null || !date || startMinute == null || endMinute == null || createdBy == null) {
      return NextResponse.json(
        { error: "branchId, userId, date, startMinute, endMinute, createdBy required" },
        { status: 400 }
      );
    }

    const schedule = await prisma.$transaction(async (tx) => {
      const s = await tx.schedule.create({
        data: {
          branchId: Number(branchId),
          userId: Number(userId),
          date: new Date(date),
          startMinute,
          endMinute,
          createdBy: Number(createdBy),
        },
      });
      await tx.scheduleHistory.create({
        data: {
          scheduleId: s.id,
          actionType: ScheduleHistoryActionType.CREATE,
          changedBy: Number(createdBy),
          toBe: JSON.stringify({ startMinute, endMinute }),
        },
      });
      return s;
    });

    return NextResponse.json(schedule);
  } catch (e) {
    console.error("[POST /api/schedules/create]", e);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
