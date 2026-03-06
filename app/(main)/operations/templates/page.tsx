import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 템플릿 관리: 1주일 템플릿 CRUD, 기반 자동 생성 트리거 (기획서 2.2)
 */
export default function TemplatesPage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">템플릿 관리</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">템플릿 목록</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          GET /api/templates?branchId=xxx 연동 후 목록 표시. 자동 생성은 POST /api/schedules/generate
        </CardContent>
      </Card>
    </div>
  );
}
