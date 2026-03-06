/**
 * 지점 목록/생성
 * GET /api/branches   - 현재 로그인 사용자가 속한 지점 목록
 * POST /api/branches  - 지점 생성 + 생성자를 OWNER로 Employment 생성
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth?.sub) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = parseInt(auth.sub, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const branches = await prisma.branch.findMany({
      where: {
        deletedAt: null,
        employments: {
          some: {
            userId,
            deletedAt: null,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(branches);
  } catch (e) {
    console.error("[GET /api/branches]", e);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth?.sub) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = parseInt(auth.sub, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const body = await request.json();
    const { name, location, phone, thumbnail, timezone } = body as {
      name?: string;
      location?: string;
      phone?: string;
      thumbnail?: string;
      timezone?: string;
    };

    if (!name) {
      return NextResponse.json(
        { error: "지점명을 입력해 주세요." },
        { status: 400 }
      );
    }

    const tz = timezone && timezone.trim() ? timezone.trim() : "Asia/Seoul";

    const branch = await prisma.$transaction(async (tx) => {
      const b = await tx.branch.create({
        data: {
          name: name.trim(),
          location: location?.trim() ?? null,
          phone: phone?.trim() ?? null,
          thumbnail: thumbnail?.trim() ?? null,
          timezone: tz,
        },
      });

      await tx.employment.create({
        data: {
          userId,
          branchId: b.id,
          role: "OWNER",
          hireDate: new Date(),
        },
      });

      return b;
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (e) {
    console.error("[POST /api/branches]", e);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}
