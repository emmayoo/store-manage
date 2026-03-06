/**
 * POST /api/auth/logout → 쿠키 삭제 후 /login 리다이렉트
 */
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true, redirect: "/login" });
}
