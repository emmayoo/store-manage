/**
 * 지점별 직원 목록
 * GET /api/employees?branchId=xxx
 * - 로그인 사용자가 해당 지점에 소속되어 있을 때만 조회 가능
 * - 응답: { items: EmploymentWithUser[], canInvite: boolean, canEdit: boolean, canSeePhone: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    const branchId = request.nextUrl.searchParams.get("branchId");
    const branchIdNum = branchId ? parseInt(branchId, 10) : NaN;
    if (!branchId || Number.isNaN(branchIdNum)) {
      return NextResponse.json(
        { error: "branchId가 필요합니다." },
        { status: 400 }
      );
    }

    // 해당 지점에 내가 소속되어 있는지 확인 (조회 권한)
    const myEmployment = await prisma.employment.findFirst({
      where: {
        userId,
        branchId: branchIdNum,
        deletedAt: null,
        OR: [{ resignDate: null }, { resignDate: { gt: new Date() } }],
      },
    });

    if (!myEmployment) {
      return NextResponse.json(
        { error: "해당 지점에 대한 접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    const employments = await prisma.employment.findMany({
      where: {
        branchId: branchIdNum,
        deletedAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, phone: true },
        },
      },
      orderBy: [{ role: "asc" }, { hireDate: "asc" }],
    });

    const canInvite = myEmployment.role === "OWNER";
    const canEdit = myEmployment.role === "OWNER";
    const canSeePhone =
      myEmployment.role === "OWNER" || myEmployment.role === "MANAGER";

    const sanitized = canSeePhone
      ? employments
      : employments.map((e) => ({
          ...e,
          user: { ...e.user, phone: null },
        }));

    return NextResponse.json({
      items: sanitized,
      canInvite,
      canEdit,
      canSeePhone,
    });
  } catch (e) {
    console.error("[GET /api/employees]", e);
    return NextResponse.json(
      { error: "직원 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
