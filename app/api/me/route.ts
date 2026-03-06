/**
 * 내 정보 조회/수정 (이름, 연락처만. 비밀번호는 /api/me/password)
 * GET /api/me - 로그인 유저 정보
 * PATCH /api/me - 이름, 연락처 수정
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, name: true, username: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    console.error("[GET /api/me]", e);
    return NextResponse.json(
      { error: "내 정보를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

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
    const { name, phone } = body as { name?: string; phone?: string };

    const data: { name?: string; phone?: string } = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof phone === "string" && phone.trim()) data.phone = phone.trim();

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "수정할 항목을 입력해 주세요." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, username: true, phone: true },
    });

    return NextResponse.json(user);
  } catch (e) {
    console.error("[PATCH /api/me]", e);
    return NextResponse.json(
      { error: "수정에 실패했습니다." },
      { status: 500 }
    );
  }
}
