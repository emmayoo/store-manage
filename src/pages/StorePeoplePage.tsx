import { useNavigate } from "react-router-dom";
import { useCurrentStore } from "@/features/store/useCurrentStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

/**
 * Store > People (구성원)
 * 와이어프레임: Owner / Manager / Staff, 역할 표시. Owner만 Store 설정 진입
 */
export function StorePeoplePage() {
  const navigate = useNavigate();
  const { store, role, canEditStore } = useCurrentStore();

  if (!store) return null;

  return (
    <div className="min-h-full px-4 py-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">구성원</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Owner / Manager / Staff 목록 (추후 연동). 현재 역할: {role}
            </p>
            {canEditStore ? (
              <Button onClick={() => navigate("/settings/store")}>
                매장 설정 (Owner)
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => navigate("/settings/store/staff")}
            >
              직원 관리 보기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
