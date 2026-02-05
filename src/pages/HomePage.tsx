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
import type { Database } from "@/types/database";

type RecordRow = Database["public"]["Tables"]["records"]["Row"];

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

function ShiftCard({
  shift,
  storeName,
  title,
}: {
  shift: RecordRow;
  storeName: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              {formatTime(shift.starts_at)} ~ {formatTime(shift.ends_at)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {storeName}
            </div>
          </div>
          {title === "현재 근무" && (
            <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
              진행 중
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementCard({
  announcements,
  title,
  icon: Icon,
  variant = "default",
}: {
  announcements: RecordRow[];
  title: string;
  icon: typeof AlertTriangle;
  variant?: "default" | "urgent";
}) {
  if (announcements.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {announcements.map((a) => (
          <div
            key={a.id}
            className={`flex items-start gap-2 rounded-md border p-2 ${
              variant === "urgent"
                ? "border-destructive/20 bg-destructive/5"
                : ""
            }`}
          >
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                variant === "urgent"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{a.title ?? "공지"}</div>
              {a.content && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {a.content}
                </div>
              )}
              {variant === "default" && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {dayjs(a.created_at).format("MM/DD HH:mm")}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TodoSection({
  todos,
  todoText,
  onTodoTextChange,
  onAddTodo,
  onToggleTodo,
  inputRef,
}: {
  todos: RecordRow[];
  todoText: string;
  onTodoTextChange: (text: string) => void;
  onAddTodo: () => void;
  onToggleTodo: (todo: RecordRow) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onAddTodo();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My TODO</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={todoText}
            placeholder="예) 14시 폐기 체크"
            onChange={(e) => onTodoTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type="button" onClick={onAddTodo}>
            추가
          </Button>
        </div>
        <ul className="space-y-2">
          {todos.map((t) => (
            <li key={t.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isDone(t)}
                onChange={() => onToggleTodo(t)}
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
          {todos.length === 0 && (
            <li className="text-sm text-muted-foreground">
              아직 TODO가 없습니다.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
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
  const addTodo = useHomeStore((s) => s.addTodo);
  const toggleTodoDone = useHomeStore((s) => s.toggleTodoDone);

  const [todoText, setTodoText] = useState("");

  const focusTodo = (location.state as { focusTodo?: boolean } | null)
    ?.focusTodo;
  useEffect(() => {
    if (!focusTodo || !todoInputRef.current) return;
    todoInputRef.current.focus();
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      Object.values(shiftsByStore)
        .flat()
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
        return (now.isAfter(start) || now.isSame(start)) && now.isBefore(end);
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

  const handleAddTodo = async () => {
    if (!user || !todoText.trim()) return;
    await addTodo({ userId: user.id, content: todoText });
    setTodoText("");
  };

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {currentShift && (
          <ShiftCard
            shift={currentShift}
            storeName={storeNameMap.get(currentShift.store_id ?? "") ?? "매장"}
            title="현재 근무"
          />
        )}

        {nextShift && (
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
        )}

        <AnnouncementCard
          announcements={pinnedAnnouncements}
          title="오늘의 긴급 공지"
          icon={AlertTriangle}
          variant="urgent"
        />

        <AnnouncementCard
          announcements={regularAnnouncements}
          title="정기 공지"
          icon={FileText}
        />

        <TodoSection
          todos={todos}
          todoText={todoText}
          onTodoTextChange={setTodoText}
          onAddTodo={handleAddTodo}
          onToggleTodo={(todo) => toggleTodoDone({ todo })}
          inputRef={todoInputRef}
        />

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/store")}>
            매장 보기
          </Button>
          <Button variant="outline" onClick={() => navigate("/calendar")}>
            캘린더
          </Button>
        </div>

        {loading && (
          <div className="text-xs text-muted-foreground">불러오는 중…</div>
        )}
      </div>
    </div>
  );
}
