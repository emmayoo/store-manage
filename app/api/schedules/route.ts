/**
 * 캘린더 API: range 조회
 * GET /api/schedules?start=2026-03-01&end=2026-03-07
 * 기획서: range 조회
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const branchId = searchParams.get("branchId");
    const userId = searchParams.get("userId"); // "내 일정만" 필터

    if (!start || !end) {
      return NextResponse.json(
        { error: "start, end query required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const where: {
      date: { gte: Date; lte: Date };
      deletedAt: null;
      branchId?: number;
      userId?: number;
    } = {
      date: { gte: startDate, lte: endDate },
      deletedAt: null,
    };
    const branchIdNum = branchId ? parseInt(branchId, 10) : NaN;
    const userIdNum = userId ? parseInt(userId, 10) : NaN;
    if (!Number.isNaN(branchIdNum)) where.branchId = branchIdNum;
    if (!Number.isNaN(userIdNum)) where.userId = userIdNum;

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        branch: { select: { id: true, name: true, timezone: true } },
      },
      orderBy: [{ date: "asc" }, { startMinute: "asc" }],
    });

    return NextResponse.json(schedules);
  } catch (e) {
    console.error("[GET /api/schedules]", e);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}
