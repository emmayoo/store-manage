/**
 * POST /api/auth/login
 * body: { username, password } → 검증 후 JWT 쿠키 설정, /dashboard 로 리다이렉트
 */
import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username?: string; password?: string };

    if (!username || typeof password !== "string") {
      return NextResponse.json(
        { error: "아이디, 비밀번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { username: username.trim(), deletedAt: null },
      include: {
        employments: {
          where: { deletedAt: null, resignDate: null },
          take: 1,
          orderBy: { hireDate: "asc" },
        },
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const ok = await compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 지점별 role은 Employment. role; JWT에는 대표 하나만 (첫 소속 지점 역할)
    const role = user.employments[0]?.role ?? "STAFF";

    const token = await createToken({
      sub: String(user.id),
      username: user.username,
      role,
    });
    await setAuthCookie(token);

    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (e) {
    console.error("[POST /api/auth/login]", e);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
