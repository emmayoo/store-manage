import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 대시보드: 전체 지점 기준
 * - 오늘 근무자, 내 일정, 휴무자 (기획서 9.1)
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">대시보드</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 근무자</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          API 연동 후 오늘 날짜 기준 스케줄에서 직원 목록 표시
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">내 일정</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          로그인 사용자 기준 오늘 일정 표시
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">휴무자</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          오늘 휴무 등록된 직원 목록
        </CardContent>
      </Card>
    </div>
  );
}
