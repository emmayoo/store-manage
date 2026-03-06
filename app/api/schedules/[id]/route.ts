/**
 * 스케줄 단건 수정/삭제
 * PATCH /api/schedules/[id] - 수정 (시간, 직원)
 * DELETE /api/schedules/[id] - soft delete
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ScheduleHistoryActionType } from "@/app/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Invalid schedule id" }, { status: 400 });
    }
    const body = await request.json();
    const { userId, startMinute, endMinute, updatedBy } = body as {
      userId?: number;
      startMinute?: number;
      endMinute?: number;
      updatedBy: number; // userId
    };

    const schedule = await prisma.schedule.findFirst({
      where: { id: idNum, deletedAt: null },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const asIs = JSON.stringify({
      userId: schedule.userId,
      startMinute: schedule.startMinute,
      endMinute: schedule.endMinute,
    });

    const changedByNum = typeof updatedBy === "number" ? updatedBy : parseInt(String(updatedBy), 10);

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.schedule.update({
        where: { id: idNum },
        data: {
          ...(userId != null && { userId: typeof userId === "number" ? userId : parseInt(String(userId), 10) }),
          ...(startMinute != null && { startMinute }),
          ...(endMinute != null && { endMinute }),
        },
      });
      await tx.scheduleHistory.create({
        data: {
          scheduleId: idNum,
          actionType: ScheduleHistoryActionType.UPDATE,
          changedBy: Number.isNaN(changedByNum) ? schedule.userId : changedByNum,
          asIs,
          toBe: JSON.stringify({
            userId: s.userId,
            startMinute: s.startMinute,
            endMinute: s.endMinute,
          }),
        },
      });
      return s;
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/schedules/id]", e);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Invalid schedule id" }, { status: 400 });
    }

    const schedule = await prisma.schedule.findFirst({
      where: { id: idNum, deletedAt: null },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.schedule.update({
        where: { id: idNum },
        data: { deletedAt: new Date() },
      });
      await tx.scheduleHistory.create({
        data: {
          scheduleId: idNum,
          actionType: ScheduleHistoryActionType.DELETE,
          changedBy: schedule.userId, // 또는 JWT에서
          asIs: JSON.stringify({
            userId: schedule.userId,
            startMinute: schedule.startMinute,
            endMinute: schedule.endMinute,
          }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/schedules/id]", e);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
