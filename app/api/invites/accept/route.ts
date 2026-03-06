/**
 * 초대 수락
 * POST /api/invites/accept
 * body: { token }
 *
 * - 토큰 유효 + 이미 해당 지점 직원이면: { status: "already", message: "이미 추가되었음" }
 * - 토큰 유효 + 아직 직원 아님 → Employment 생성: { status: "welcome", message: "환영해요" }
 * - 토큰이 없거나 만료/삭제/브랜치 없음: { status: "invalid", message: "초대링크 확인하세요" }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth?.sub) {
      return NextResponse.json(
        { status: "unauthorized", message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = parseInt(auth.sub, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { status: "invalid_user", message: "사용자 정보가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { status: "invalid", message: "초대링크 확인하세요" },
        { status: 400 }
      );
    }

    const invite = await prisma.branchInvite.findFirst({
      where: {
        token,
        deletedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invite || !invite.branch) {
      return NextResponse.json(
        { status: "invalid", message: "초대링크 확인하세요" },
        { status: 400 }
      );
    }

    // 이미 해당 지점 직원인지 확인
    const existingEmployment = await prisma.employment.findFirst({
      where: {
        userId,
        branchId: invite.branchId,
        deletedAt: null,
        OR: [{ resignDate: null }, { resignDate: { gt: new Date() } }],
      },
    });

    if (existingEmployment) {
      return NextResponse.json({
        status: "already",
        message: "이미 추가되었음",
        branch: invite.branch,
      });
    }

    // Employment 생성 + 초대 수락 시간 기록
    await prisma.$transaction(async (tx) => {
      await tx.employment.create({
        data: {
          userId,
          branchId: invite.branchId,
          role: "STAFF",
          hireDate: new Date(),
        },
      });

      await tx.branchInvite.update({
        where: { id: invite.id },
        data: {
          acceptedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      status: "welcome",
      message: "환영해요",
      branch: invite.branch,
    });
  } catch (e) {
    console.error("[POST /api/invites/accept]", e);
    return NextResponse.json(
      { status: "error", message: "초대 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

