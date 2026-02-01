import { useNavigate } from "react-router-dom";
import { useCurrentStore } from "@/features/store/useCurrentStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

/**
 * Store > Schedule (매장 스케줄 관리)
 * 와이어프레임: 기간 설정, 자동 생성, 주간 스케줄. Staff: 수정 요청 / Manager·Owner: 바로 수정
 */
export function StoreSchedulePage() {
  const navigate = useNavigate();
  const { store, canEditSchedule } = useCurrentStore();

  if (!store) return null;

  return (
    <div className="min-h-full px-4 py-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">스케줄</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              생성은 여기서, 조회는 캘린더에서 합니다.
            </p>
            <Button variant="outline" onClick={() => navigate("/calendar")}>
              캘린더에서 보기
            </Button>
            {canEditSchedule ? (
              <p className="text-xs text-muted-foreground">
                Manager/Owner: 기간 설정·자동 생성·수정 (추후 구현)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Staff: 조회 + 수정 요청 (추후 구현)
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-muted-foreground"
              onClick={() => navigate("/history")}
            >
              변경 이력 보기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
