import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";

/**
 * 직원(Employment) 설정 수정
 * PATCH /api/employees/[id]
 * body: { role?: "OWNER" | "MANAGER" | "STAFF", color?: string | null }
 *
 * - 현재 로그인 사용자가 해당 지점 OWNER일 때만 수정 가능
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth?.sub) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const userId = parseInt(auth.sub, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "사용자 정보가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const employmentId = Number(id);
    if (Number.isNaN(employmentId)) {
      return NextResponse.json(
        { error: "잘못된 직원 ID 입니다." },
        { status: 400 },
      );
    }

    const target = await prisma.employment.findUnique({
      where: { id: employmentId },
    });

    if (!target || target.deletedAt) {
      return NextResponse.json(
        { error: "직원을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 이 지점의 OWNER 인지 확인
    const myEmployment = await prisma.employment.findFirst({
      where: {
        userId,
        branchId: target.branchId,
        deletedAt: null,
        OR: [{ resignDate: null }, { resignDate: { gt: new Date() } }],
        role: "OWNER",
      },
    });

    if (!myEmployment) {
      return NextResponse.json(
        { error: "직원 설정을 수정할 권한이 없습니다." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { role, color } = body as {
      role?: "OWNER" | "MANAGER" | "STAFF";
      color?: string | null;
    };

    const data: { role?: "OWNER" | "MANAGER" | "STAFF"; color?: string | null } =
      {};

    if (role && ["OWNER", "MANAGER", "STAFF"].includes(role)) {
      data.role = role;
    }

    if (typeof color === "string" || color === null) {
      data.color = color;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "수정할 항목이 없습니다." },
        { status: 400 },
      );
    }

    const updated = await prisma.employment.update({
      where: { id: employmentId },
      data,
      include: {
        user: {
          select: { id: true, name: true, username: true, phone: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/employees/[id]]", e);
    return NextResponse.json(
      { error: "직원 정보를 수정하지 못했습니다." },
      { status: 500 },
    );
  }
}

