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
    if (!r.store_id) continue;
    map[r.store_id] ??= [];
    map[r.store_id].push(r);
  }
  return map;
}

function getDone(todo: RecordRow) {
  const payload = todo.payload;
  if (!payload || typeof payload !== "object") return false;
  return (payload as { done?: boolean }).done === true;
}

function asRecordRow<T>(data: T): RecordRow {
  return data as unknown as RecordRow;
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

    const storeIdsFilter =
      storeIds.length > 0 ? storeIds : ["00000000-0000-0000-0000-000000000000"];
    const todayStart = dayjs().startOf("day").toISOString();
    const upcomingEnd = dayjs().add(7, "day").endOf("day").toISOString();
    const annStart = dayjs().subtract(14, "day").startOf("day").toISOString();

    const [shiftsRes, annsRes, pinsRes, todosRes] = await Promise.all([
      supabase
        .from("records")
        .select("*")
        .eq("type", "shift")
        .in("store_id", storeIdsFilter)
        .is("deleted_at", null)
        .gte("starts_at", todayStart)
        .lte("starts_at", upcomingEnd)
        .order("starts_at", { ascending: true }),
      supabase
        .from("records")
        .select("*")
        .eq("type", "announcement")
        .in("store_id", storeIdsFilter)
        .is("deleted_at", null)
        .gte("created_at", annStart)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("record_pins").select("*").eq("user_id", userId),
      supabase
        .from("records")
        .select("*")
        .eq("type", "todo")
        .eq("created_by", userId)
        .is("store_id", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (shiftsRes.error || annsRes.error || pinsRes.error || todosRes.error) {
      const err =
        shiftsRes.error || annsRes.error || pinsRes.error || todosRes.error;
      set({ loading: false, error: err?.message ?? "Unknown error" });
      return;
    }

    const shifts = (shiftsRes.data ?? []).map(asRecordRow);
    const anns = (annsRes.data ?? []).map(asRecordRow);
    const pins = (pinsRes.data ?? []).map(
      (p) => (p as unknown as PinRow).record_id
    );
    const todos = (todosRes.data ?? []).map(asRecordRow);

    const pinnedIds = new Set(pins);
    const pinnedAnnouncements = anns.filter((r) => pinnedIds.has(r.id));

    set({
      loading: false,
      shiftsByStore: groupByStoreId(shifts),
      announcementsByStore: groupByStoreId(anns),
      pinnedIds,
      pinnedAnnouncements,
      todos,
    });
  },

  togglePin: async ({ userId, recordId }) => {
    const pinned = get().pinnedIds.has(recordId);
    set({ error: null });

    const { error } = pinned
      ? await supabase
          .from("record_pins")
          .delete()
          .eq("user_id", userId)
          .eq("record_id", recordId)
      : await supabase.from("record_pins").insert({
          user_id: userId,
          record_id: recordId,
        });

    if (error) {
      set({ error: error.message });
      return;
    }

    const next = new Set(get().pinnedIds);
    if (pinned) {
      next.delete(recordId);
      set({
        pinnedIds: next,
        pinnedAnnouncements: get().pinnedAnnouncements.filter(
          (a) => a.id !== recordId
        ),
      });
    } else {
      next.add(recordId);
      const allAnnouncements = Object.values(get().announcementsByStore).flat();
      const found = allAnnouncements.find((r) => r.id === recordId);
      set({
        pinnedIds: next,
        pinnedAnnouncements: found
          ? [found, ...get().pinnedAnnouncements]
          : get().pinnedAnnouncements,
      });
    }
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
    set({ todos: [asRecordRow(data), ...get().todos] });
  },

  toggleTodoDone: async ({ todo }) => {
    const done = getDone(todo);
    const payload =
      typeof todo.payload === "object" && todo.payload ? todo.payload : {};
    const nextPayload = { ...payload, done: !done };

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

    set({
      todos: get().todos.map((t) => (t.id === todo.id ? asRecordRow(data) : t)),
    });
  },
}));
