import { useCurrentStore } from "@/features/store/useCurrentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

/**
 * Store > Notices (매장 공지)
 * 와이어프레임: [전체] [중요] [발주] [금지] [기타]
 */
export function StoreNoticesPage() {
  const { store } = useCurrentStore();

  if (!store) return null;

  return (
    <div className="min-h-full px-4 py-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["전체", "중요", "발주", "금지", "기타"].map((label) => (
            <button
              key={label}
              type="button"
              className="shrink-0 rounded-md border px-3 py-1.5 text-sm"
            >
              {label}
            </button>
          ))}
        </div>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              공지 목록 (추후 연동)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
