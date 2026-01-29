import { create } from "zustand";

import { dayjs } from "@/lib/day";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type RecordRow = Database["public"]["Tables"]["records"]["Row"];
type PinRow = Database["public"]["Tables"]["record_pins"]["Row"];

export type StoreId = string;

type HomeState = {
  loading: boolean;
  error: string | null;

  shiftsByStore: Record<StoreId, RecordRow[]>;
  announcementsByStore: Record<StoreId, RecordRow[]>;
  pinnedAnnouncements: RecordRow[];
  pinnedIds: Set<string>;

  todos: RecordRow[];

  loadHome: (opts: { userId: string; storeIds: string[] }) => Promise<void>;
  togglePin: (opts: { userId: string; recordId: string }) => Promise<void>;

  addTodo: (opts: { userId: string; content: string }) => Promise<void>;
  toggleTodoDone: (opts: { todo: RecordRow }) => Promise<void>;
};

function groupByStoreId(rows: RecordRow[]) {
  const map: Record<string, RecordRow[]> = {};
  for (const r of rows) {
    const sid = r.store_id;
    if (!sid) continue;
    map[sid] ??= [];
    map[sid].push(r);
  }
  return map;
}

function getDone(todo: RecordRow) {
  const payload = todo.payload;
  if (!payload || typeof payload !== "object") return false;
  const v = (payload as { done?: unknown }).done;
  return v === true;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  loading: false,
  error: null,

  shiftsByStore: {},
  announcementsByStore: {},
  pinnedAnnouncements: [],
  pinnedIds: new Set(),
  todos: [],

  loadHome: async ({ userId, storeIds }) => {
    set({ loading: true, error: null });

    const todayStart = dayjs().startOf("day").toISOString();
    const upcomingEnd = dayjs().add(7, "day").endOf("day").toISOString();

    // 1) shifts (today + upcoming 7 days) by store
    const { data: shifts, error: sErr } = await supabase
      .from("records")
      .select("*")
      .eq("type", "shift")
      .in(
        "store_id",
        storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"],
      )
      .is("deleted_at", null)
      .gte("starts_at", todayStart)
      .lte("starts_at", upcomingEnd)
      .order("starts_at", { ascending: true });

    if (sErr) {
      set({ loading: false, error: sErr.message });
      return;
    }

    // 2) announcements (recent 14 days)
    const annStart = dayjs().subtract(14, "day").startOf("day").toISOString();
    const { data: anns, error: aErr } = await supabase
      .from("records")
      .select("*")
      .eq("type", "announcement")
      .in(
        "store_id",
        storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"],
      )
      .is("deleted_at", null)
      .gte("created_at", annStart)
      .order("created_at", { ascending: false })
      .limit(100);

    if (aErr) {
      set({ loading: false, error: aErr.message });
      return;
    }

    // 3) pins
    const { data: pins, error: pErr } = await supabase
      .from("record_pins")
      .select("*")
      .eq("user_id", userId);

    if (pErr) {
      set({ loading: false, error: pErr.message });
      return;
    }

    const pinnedIds = new Set(
      (pins ?? []).map((p) => (p as unknown as PinRow).record_id),
    );
    const pinnedAnnouncements = (anns ?? []).filter((r) => pinnedIds.has(r.id));

    // 4) personal todos (store_id null)
    const { data: todos, error: tErr } = await supabase
      .from("records")
      .select("*")
      .eq("type", "todo")
      .eq("created_by", userId)
      .is("store_id", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (tErr) {
      set({ loading: false, error: tErr.message });
      return;
    }

    set({
      loading: false,
      shiftsByStore: groupByStoreId((shifts ?? []) as unknown as RecordRow[]),
      announcementsByStore: groupByStoreId(
        (anns ?? []) as unknown as RecordRow[],
      ),
      pinnedIds,
      pinnedAnnouncements: pinnedAnnouncements as unknown as RecordRow[],
      todos: (todos ?? []) as unknown as RecordRow[],
    });
  },

  togglePin: async ({ userId, recordId }) => {
    const pinned = get().pinnedIds.has(recordId);
    set({ error: null });

    if (pinned) {
      const { error } = await supabase
        .from("record_pins")
        .delete()
        .eq("user_id", userId)
        .eq("record_id", recordId);
      if (error) {
        set({ error: error.message });
        return;
      }
      const next = new Set(get().pinnedIds);
      next.delete(recordId);
      set({
        pinnedIds: next,
        pinnedAnnouncements: get().pinnedAnnouncements.filter(
          (a) => a.id !== recordId,
        ),
      });
      return;
    }

    const { error } = await supabase.from("record_pins").insert({
      user_id: userId,
      record_id: recordId,
    });
    if (error) {
      set({ error: error.message });
      return;
    }
    const next = new Set(get().pinnedIds);
    next.add(recordId);

    // 현재 로드된 공지 중에서 매칭되면 pinnedAnnouncements에 추가
    const allAnnouncements = Object.values(get().announcementsByStore).flat();
    const found = allAnnouncements.find((r) => r.id === recordId);
    set({
      pinnedIds: next,
      pinnedAnnouncements: found
        ? [found, ...get().pinnedAnnouncements]
        : get().pinnedAnnouncements,
    });
  },

  addTodo: async ({ userId, content }) => {
    const text = content.trim();
    if (!text) return;
    set({ error: null });

    const { data, error } = await supabase
      .from("records")
      .insert({
        type: "todo",
        content: text,
        created_by: userId,
        store_id: null,
        payload: { done: false },
      })
      .select("*")
      .single();

    if (error) {
      set({ error: error.message });
      return;
    }
    set({ todos: [data as unknown as RecordRow, ...get().todos] });
  },

  toggleTodoDone: async ({ todo }) => {
    const done = getDone(todo);
    const nextPayload = {
      ...(typeof todo.payload === "object" && todo.payload ? todo.payload : {}),
      done: !done,
    };

    const { data, error } = await supabase
      .from("records")
      .update({ payload: nextPayload, updated_at: new Date().toISOString() })
      .eq("id", todo.id)
      .select("*")
      .single();

    if (error) {
      set({ error: error.message });
      return;
    }

    const next = get().todos.map((t) =>
      t.id === todo.id ? (data as unknown as RecordRow) : t,
    );
    set({ todos: next });
  },
}));
