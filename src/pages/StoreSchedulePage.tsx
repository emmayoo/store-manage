import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { dayjs } from "@/lib/day";
import { useCurrentStore } from "@/features/store/useCurrentStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

/**
 * Store > Schedule (매장 스케줄 관리)
 * 참조: 기간 설정, 주간 스케줄 그리드, 하단 "근무 추가" 버튼
 */
export function StoreSchedulePage() {
  const navigate = useNavigate();
  const { store, canEditSchedule } = useCurrentStore();

  if (!store) return null;

  const weekStart = dayjs().startOf("week");
  const weekEnd = weekStart.add(6, "day");
  const dateRange = `${weekStart.format("M월 D일")} ~ ${weekEnd.format(
    "M월 D일"
  )}`;

  return (
    <div className="min-h-full px-4 py-4 pb-24">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">근무 스케줄</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              기간: {dateRange}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-6">
            <p className="text-center text-sm text-muted-foreground">
              주간 스케줄 (추후 연동)
            </p>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => navigate("/calendar")}
            >
              캘린더에서 보기
            </Button>
          </CardContent>
        </Card>

        {canEditSchedule ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => navigate("/history")}
          >
            변경 이력 보기
          </Button>
        ) : null}
      </div>

      {canEditSchedule ? (
        <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-0 right-0 mx-auto max-w-2xl px-4">
          <Button
            className="w-full"
            onClick={() =>
              navigate(
                `/calendar?view=day&date=${dayjs().format("YYYY-MM-DD")}`
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            근무 추가
          </Button>
        </div>
      ) : null}
    </div>
  );
}
