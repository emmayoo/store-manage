import { redirect } from "next/navigation";

/**
 * 루트 접속 시 대시보드로 이동 (기획서: 하단 탭 첫 메뉴 = 대시보드)
 */
export default function HomePage() {
  redirect("/dashboard");
}
