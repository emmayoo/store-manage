import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { useCurrentStore } from "@/features/store/useCurrentStore";
import { useAuthStore } from "@/stores/auth.store";
import {
  DEFAULT_AVAILABILITY_DAYS,
  type AvailabilityDays,
  useAvailabilityStore,
} from "@/stores/availability.store";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { cn } from "@/lib/utils";

const DAY_LABELS: Array<{ key: keyof AvailabilityDays; label: string }> = [
  { key: "monday", label: "월" },
  { key: "tuesday", label: "화" },
  { key: "wednesday", label: "수" },
  { key: "thursday", label: "목" },
  { key: "friday", label: "금" },
  { key: "saturday", label: "토" },
  { key: "sunday", label: "일" },
];

/**
 * Store > 근무 가능일
 * 직원이 해당 매장에서 근무 가능한 요일을 체크하는 화면
 */
export function StoreAvailabilityPage() {
  const { store, storeId } = useCurrentStore();
  const user = useAuthStore((s) => s.user);
  const load = useAvailabilityStore((s) => s.load);
  const upsert = useAvailabilityStore((s) => s.upsert);

  const [days, setDays] = useState<AvailabilityDays | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!storeId || !user?.id) return;
    load({ storeId, userId: user.id })
      .then((d) => setDays(d ?? DEFAULT_AVAILABILITY_DAYS))
      .finally(() => setLoading(false));
  }, [storeId, user?.id, load]);

  const toggleDay = (key: keyof AvailabilityDays) => {
    if (!days) return;
    setDays((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  const handleSave = async () => {
    if (!storeId || !user?.id || !days) return;
    setSaving(true);
    try {
      await upsert({ storeId, userId: user.id, days });
    } finally {
      setSaving(false);
    }
  };

  if (!store) return null;

  return (
    <div className="min-h-full px-4 py-4 pb-24">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h2 className="text-base font-semibold">근무 가능 요일</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {store.name}에서 근무 가능한 요일을 선택하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">이번 주 기준</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                불러오는 중…
              </p>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {DAY_LABELS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border py-3 transition-colors",
                      days?.[key]
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="text-xs font-medium">{label}</span>
                    {days?.[key] && (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full"
          disabled={loading || saving || !days}
          onClick={handleSave}
        >
          {saving ? "저장 중…" : "저장"}
        </Button>
      </div>
    </div>
  );
}
