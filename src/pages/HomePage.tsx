import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Pin } from "lucide-react";

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

  const todayKey = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">홈</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            오늘 근무/다가올 근무, 공지, TODO를 한 번에 봅니다.
          </p>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>내 TODO</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>중요 표시한 공지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pinnedAnnouncements.map((a) => (
              <div key={a.id} className="rounded-md border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">
                      {a.title ?? "공지"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {dayjs(a.created_at).format("MM/DD HH:mm")}
                    </div>
                  </div>
                  {user ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        togglePin({ userId: user.id, recordId: a.id })
                      }
                    >
                      해제
                    </Button>
                  ) : null}
                </div>
                {a.content ? (
                  <div className="mt-2 whitespace-pre-wrap text-sm">
                    {a.content}
                  </div>
                ) : null}
              </div>
            ))}
            {pinnedAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                중요 표시한 공지가 없습니다.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {myStores.map(({ store, role }) => {
            const shifts = shiftsByStore[store.id] ?? [];
            const anns = announcementsByStore[store.id] ?? [];

            const todayShifts = shifts.filter((s) =>
              s.starts_at
                ? dayjs(s.starts_at).format("YYYY-MM-DD") === todayKey
                : false
            );

            const upcoming = shifts.filter((s) =>
              s.starts_at
                ? dayjs(s.starts_at).isAfter(dayjs(), "minute")
                : false
            );
            const nextTwo = upcoming.slice(0, 2);

            const recentAnns = anns.slice(0, 2);

            return (
              <Card key={store.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{store.name}</span>
                    <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                      {role}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">오늘 근무</div>
                    {todayShifts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        오늘 근무 없음
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {todayShifts.map((s) => (
                          <li
                            key={s.id}
                            className="rounded-md border p-2 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span>{s.title ?? "근무"}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(s.starts_at)}~
                                {formatTime(s.ends_at)}
                              </span>
                            </div>
                            {s.content ? (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {s.content}
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">다가올 근무</div>
                    {nextTwo.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        예정된 근무 없음
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {nextTwo.map((s) => (
                          <li
                            key={s.id}
                            className="rounded-md border p-2 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span>{s.title ?? "근무"}</span>
                              <span className="text-xs text-muted-foreground">
                                {dayjs(s.starts_at).format("MM/DD (ddd) HH:mm")}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">최근 공지</div>
                    {recentAnns.length === 0 ? (
                      <p className="text-sm text-muted-foreground">공지 없음</p>
                    ) : (
                      <ul className="space-y-2">
                        {recentAnns.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-md border p-2 text-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium">
                                  {a.title ?? "공지"}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {dayjs(a.created_at).format("MM/DD HH:mm")}
                                </div>
                              </div>
                              {user ? (
                                <button
                                  type="button"
                                  className="rounded-md border p-2 text-muted-foreground hover:bg-accent"
                                  onClick={() =>
                                    togglePin({
                                      userId: user.id,
                                      recordId: a.id,
                                    })
                                  }
                                  aria-label="중요 표시"
                                >
                                  <Pin
                                    className={
                                      pinnedIds.has(a.id)
                                        ? "h-4 w-4 text-foreground"
                                        : "h-4 w-4"
                                    }
                                  />
                                </button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/store")}
                    >
                      매장 보기
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/calendar")}
                    >
                      캘린더
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground">
          {loading ? "불러오는 중…" : null}
        </div>
      </div>
    </div>
  );
}
