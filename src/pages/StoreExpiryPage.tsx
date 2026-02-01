import { useCurrentStore } from "@/features/store/useCurrentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

/**
 * Store > 폐기 임박 목록
 * 와이어프레임: 품목명, 폐기 D-day, 상태 체크. Notices와 완전 분리
 */
export function StoreExpiryPage() {
  const { store } = useCurrentStore();

  if (!store) return null;

  return (
    <div className="min-h-full px-4 py-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              ⚠ 폐기 임박
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              품목명, 폐기 D-day, 상태 체크 (추후 연동)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
