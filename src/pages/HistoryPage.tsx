import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

/**
 * 스케줄·공지 등 변경 이력 (기획: Store > Schedule 내 "변경 이력"과 연계 예정)
 */
export function HistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">변경 이력</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            스케줄·공지 변경 로그를 records 기반으로 확장할 예정입니다.
          </p>
        </div>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              매장 스케줄 화면에서 변경 이력을 확인할 수 있습니다.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => navigate("/store/schedule")}
            >
              매장 스케줄로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
