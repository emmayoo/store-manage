import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { dayjs } from "@/lib/day";
import { useCurrentStore } from "@/features/store/useCurrentStore";
import { useHomeStore } from "@/stores/home.store";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return dayjs(iso).format("HH:mm");
}

/**
 * Store Home (운영 요약 대시보드)
 * 와이어프레임: 오늘 운영, 오늘 근무자, 다가오는 이벤트, 중요 공지
 */
export function StoreHomePage() {
  const navigate = useNavigate();
  const { store, storeId } = useCurrentStore();
  const loadHome = useHomeStore((s) => s.loadHome);
  const shiftsByStore = useHomeStore((s) => s.shiftsByStore);
  const announcementsByStore = useHomeStore((s) => s.announcementsByStore);

  const storeIds = useMemo(() => (storeId ? [storeId] : []), [storeId]);
  const user = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!user || storeIds.length === 0) return;
    loadHome({ userId: user, storeIds }).catch(() => {});
  }, [loadHome, storeIds, user]);

  const todayKey = dayjs().format("YYYY-MM-DD");
  const shifts = storeId ? shiftsByStore[storeId] ?? [] : [];
  const todayShifts = shifts.filter(
    (s) => s.starts_at && dayjs(s.starts_at).format("YYYY-MM-DD") === todayKey
  );
  const announcements = storeId
    ? (announcementsByStore[storeId] ?? []).slice(0, 3)
    : [];

  if (!store) return null;

  return (
    <div className="min-h-full px-4 py-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">오늘 운영</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              오늘 운영 시간 / 휴무 여부 (추후 연동)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">오늘 근무자</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayShifts.length === 0 ? (
              <p className="text-sm text-muted-foreground">오늘 근무 없음</p>
            ) : (
              <ul className="space-y-2">
                {todayShifts.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <span>{s.title ?? "근무"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(s.starts_at)} ~ {formatTime(s.ends_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">다가오는 이벤트</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              회식 / 전체 청소 / 임시 휴업 등 (추후 연동)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">중요 공지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">공지 없음</p>
            ) : (
              <ul className="space-y-2">
                {announcements.map((a) => (
                  <li key={a.id} className="rounded-md border p-2 text-sm">
                    <div className="font-medium">{a.title ?? "공지"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {dayjs(a.created_at).format("MM/DD HH:mm")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate("/store/notices")}
            >
              공지 전체 보기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
