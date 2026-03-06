/**
 * 템플릿 목록/생성
 * GET /api/templates?branchId=xxx
 * POST /api/templates (body: branchId, name, createdBy, items[])
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get("branchId");
    const branchIdNum = branchId ? parseInt(branchId, 10) : NaN;
    if (!branchId || Number.isNaN(branchIdNum)) {
      return NextResponse.json(
        { error: "branchId query required" },
        { status: 400 }
      );
    }

    const templates = await prisma.template.findMany({
      where: { branchId: branchIdNum, deletedAt: null },
      include: {
        items: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (e) {
    console.error("[GET /api/templates]", e);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, name, createdBy, items } = body as {
      branchId: number;
      name: string;
      createdBy: number;
      items: { userId: number; weekday: number; startMinute: number; endMinute: number }[];
    };

    if (branchId == null || !name || createdBy == null || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "branchId, name, createdBy, items required" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        branchId: Number(branchId),
        name,
        createdBy: Number(createdBy),
        items: {
          create: items.map((i) => ({
            userId: Number(i.userId),
            weekday: i.weekday,
            startMinute: i.startMinute,
            endMinute: i.endMinute,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(template);
  } catch (e) {
    console.error("[POST /api/templates]", e);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
