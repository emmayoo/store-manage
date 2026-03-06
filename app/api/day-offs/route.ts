/**
 * 휴무 목록/등록
 * GET /api/day-offs?branchId=xxx&start=xxx&end=xxx
 * POST /api/day-offs (body: userId, branchId, date, reason?)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get("branchId");
    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");

    const where: { branchId?: number; date?: { gte: Date; lte: Date } } = {};
    const branchIdNum = branchId ? parseInt(branchId, 10) : NaN;
    if (!Number.isNaN(branchIdNum)) where.branchId = branchIdNum;
    if (start && end) {
      where.date = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const dayOffs = await prisma.dayOff.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(dayOffs);
  } catch (e) {
    console.error("[GET /api/day-offs]", e);
    return NextResponse.json(
      { error: "Failed to fetch day-offs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, branchId, date, reason } = body as {
      userId: number;
      branchId: number;
      date: string;
      reason?: string;
    };

    if (userId == null || branchId == null || !date) {
      return NextResponse.json(
        { error: "userId, branchId, date required" },
        { status: 400 }
      );
    }

    const dayOff = await prisma.dayOff.create({
      data: {
        userId: Number(userId),
        branchId: Number(branchId),
        date: new Date(date),
        reason: reason ?? null,
      },
    });

    return NextResponse.json(dayOff);
  } catch (e) {
    console.error("[POST /api/day-offs]", e);
    return NextResponse.json(
      { error: "Failed to create day-off" },
      { status: 500 }
    );
  }
}
