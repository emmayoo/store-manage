import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, FileText } from "lucide-react";

import { dayjs } from "@/lib/day";
import { useAuthStore } from "@/stores/auth.store";
import { useStoreStore } from "@/stores/store.store";
import { useHomeStore } from "@/stores/home.store";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return dayjs(iso).format("HH:mm");
}

function isDone(todo: { payload: unknown }) {
  const p = todo.payload;
  return !!(
    p &&
    typeof p === "object" &&
    (p as { done?: unknown }).done === true
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const myStores = useStoreStore((s) => s.myStores);
  const todoInputRef = useRef<HTMLInputElement>(null);

  const loading = useHomeStore((s) => s.loading);
  const error = useHomeStore((s) => s.error);
  const shiftsByStore = useHomeStore((s) => s.shiftsByStore);
  const announcementsByStore = useHomeStore((s) => s.announcementsByStore);
  const pinnedAnnouncements = useHomeStore((s) => s.pinnedAnnouncements);
  const pinnedIds = useHomeStore((s) => s.pinnedIds);
  const todos = useHomeStore((s) => s.todos);

  const loadHome = useHomeStore((s) => s.loadHome);
  const togglePin = useHomeStore((s) => s.togglePin);
  const addTodo = useHomeStore((s) => s.addTodo);
  const toggleTodoDone = useHomeStore((s) => s.toggleTodoDone);

  const [todoText, setTodoText] = useState("");

  // Add 페이지에서 "TODO 추가"로 왔을 때 입력란 포커스(한 번만)
  const focusTodo = (location.state as { focusTodo?: boolean } | null)
    ?.focusTodo;
  useEffect(() => {
    if (!focusTodo || !todoInputRef.current) return;
    todoInputRef.current.focus();
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focusTodo 시 한 번만 실행
  }, [focusTodo]);

  const storeIds = useMemo(() => myStores.map((s) => s.store.id), [myStores]);

  useEffect(() => {
    if (!user) return;
    loadHome({ userId: user.id, storeIds }).catch(() => {});
  }, [loadHome, storeIds, user]);

  const storeNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const { store } of myStores) m.set(store.id, store.name);
    return m;
  }, [myStores]);

  const allShifts = useMemo(
    () =>
      Object.entries(shiftsByStore)
        .flatMap(([, shifts]) => shifts)
        .filter((s) => s.starts_at && s.ends_at)
        .sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? "")),
    [shiftsByStore]
  );

  const now = dayjs();
  const currentShift = useMemo(
    () =>
      allShifts.find((s) => {
        const start = dayjs(s.starts_at);
        const end = dayjs(s.ends_at);
        return now.isSameOrAfter(start) && now.isBefore(end);
      }),
    [allShifts, now]
  );

  const nextShift = useMemo(
    () => allShifts.find((s) => dayjs(s.starts_at).isAfter(now)),
    [allShifts, now]
  );

  const regularAnnouncements = useMemo(() => {
    const pinned = new Set(pinnedIds);
    return Object.values(announcementsByStore)
      .flat()
      .filter((a) => !pinned.has(a.id))
      .slice(0, 5);
  }, [announcementsByStore, pinnedIds]);

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {currentShift ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">현재 근무</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {formatTime(currentShift.starts_at)} ~{" "}
                    {formatTime(currentShift.ends_at)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {storeNameMap.get(currentShift.store_id ?? "") ?? "매장"}
                  </div>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
                  진행 중
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {nextShift ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">다음 근무</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <div className="font-medium">
                  {dayjs(nextShift.starts_at).format("MM/DD (ddd) HH:mm")} ~{" "}
                  {formatTime(nextShift.ends_at)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {storeNameMap.get(nextShift.store_id ?? "") ?? "매장"}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {pinnedAnnouncements.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                오늘의 긴급 공지
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pinnedAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-2"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.title ?? "공지"}</div>
                    {a.content ? (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {a.content}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {regularAnnouncements.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">정기 공지</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {regularAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2 rounded-md border p-2"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.title ?? "공지"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {dayjs(a.created_at).format("MM/DD HH:mm")}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">My TODO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                ref={todoInputRef}
                value={todoText}
                placeholder="예) 14시 폐기 체크"
                onChange={(e) => setTodoText(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;
                  if (!user) return;
                  await addTodo({ userId: user.id, content: todoText });
                  setTodoText("");
                }}
              />
              <Button
                type="button"
                onClick={async () => {
                  if (!user) return;
                  await addTodo({ userId: user.id, content: todoText });
                  setTodoText("");
                }}
              >
                추가
              </Button>
            </div>

            <ul className="space-y-2">
              {todos.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isDone(t)}
                    onChange={async () => {
                      await toggleTodoDone({ todo: t });
                    }}
                  />
                  <div className="flex-1">
                    <div
                      className={
                        isDone(t)
                          ? "text-sm text-muted-foreground line-through"
                          : "text-sm"
                      }
                    >
                      {t.content ?? "(내용 없음)"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {dayjs(t.created_at).format("MM/DD HH:mm")}
                    </div>
                  </div>
                </li>
              ))}
              {todos.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  아직 TODO가 없습니다.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/store")}>
            매장 보기
          </Button>
          <Button variant="outline" onClick={() => navigate("/calendar")}>
            캘린더
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {loading ? "불러오는 중…" : null}
        </div>
      </div>
    </div>
  );
}
