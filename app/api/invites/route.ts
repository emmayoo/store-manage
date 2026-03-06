/**
 * 초대 링크 생성
 * POST /api/invites
 * body: { branchId, expiresInHours? }
 *
 * - 현재 로그인 사용자가 해당 지점 OWNER일 때만 초대 생성 허용
 * - 반환: { token, url, expiresAt }
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth?.sub) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = parseInt(auth.sub, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "사용자 정보가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { branchId, expiresInHours } = body as {
      branchId?: number;
      expiresInHours?: number;
    };

    if (branchId == null) {
      return NextResponse.json(
        { error: "branchId가 필요합니다." },
        { status: 400 }
      );
    }

    const branchIdNum = Number(branchId);
    if (Number.isNaN(branchIdNum)) {
      return NextResponse.json(
        { error: "branchId가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 이 유저가 해당 지점의 OWNER인지 확인
    const employment = await prisma.employment.findFirst({
      where: {
        userId,
        branchId: branchIdNum,
        deletedAt: null,
        OR: [{ resignDate: null }, { resignDate: { gt: new Date() } }],
        role: "OWNER",
      },
    });

    if (!employment) {
      return NextResponse.json(
        { error: "해당 지점에 대한 초대 권한이 없습니다." },
        { status: 403 }
      );
    }

    const hours = typeof expiresInHours === "number" && expiresInHours > 0
      ? expiresInHours
      : 72; // 기본 72시간

    const now = new Date();
    const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const token = randomUUID();

    const invite = await prisma.branchInvite.create({
      data: {
        branchId: branchIdNum,
        token,
        expiresAt,
        createdBy: userId,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    const origin = request.headers.get("origin") ?? "";
    const url = `${origin}/invite?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      token: invite.token,
      url,
      expiresAt: invite.expiresAt,
      branch: invite.branch,
    });
  } catch (e) {
    console.error("[POST /api/invites]", e);
    return NextResponse.json(
      { error: "초대 링크 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

