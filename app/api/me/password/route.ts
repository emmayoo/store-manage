/**
 * 비밀번호 변경 (별도 영역)
 * PATCH /api/me/password - 현재 비밀번호 확인 후 새 비밀번호로 변경
 */
import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { getAuthFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest) {
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
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || typeof newPassword !== "string" || newPassword.length < 1) {
      return NextResponse.json(
        { error: "현재 비밀번호와 새 비밀번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "현재 비밀번호가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(newPassword, 10) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/me/password]", e);
    return NextResponse.json(
      { error: "비밀번호 변경에 실패했습니다." },
      { status: 500 }
    );
  }
}
