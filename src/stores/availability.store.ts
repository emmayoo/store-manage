import { create } from "zustand";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type StaffAvailabilityRow =
  Database["public"]["Tables"]["staff_availability"]["Row"];

export type AvailabilityDays = {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
};

type AvailabilityState = {
  load: (opts: {
    storeId: string;
    userId: string;
  }) => Promise<AvailabilityDays | null>;
  upsert: (opts: {
    storeId: string;
    userId: string;
    days: AvailabilityDays;
  }) => Promise<void>;
};

const DEFAULT_DAYS: AvailabilityDays = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
};

export const useAvailabilityStore = create<AvailabilityState>()(() => ({
  load: async ({ storeId, userId }) => {
    const { data, error } = await supabase
      .from("staff_availability")
      .select("*")
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return null;
    const row = data as StaffAvailabilityRow | null;
    if (!row) return DEFAULT_AVAILABILITY_DAYS;

    return {
      monday: row.monday,
      tuesday: row.tuesday,
      wednesday: row.wednesday,
      thursday: row.thursday,
      friday: row.friday,
      saturday: row.saturday,
      sunday: row.sunday,
    };
  },

  upsert: async ({ storeId, userId, days }) => {
    const { error } = await supabase.from("staff_availability").upsert(
      {
        store_id: storeId,
        user_id: userId,
        monday: days.monday,
        tuesday: days.tuesday,
        wednesday: days.wednesday,
        thursday: days.thursday,
        friday: days.friday,
        saturday: days.saturday,
        sunday: days.sunday,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id,user_id" }
    );

    if (error) throw error;
  },
}));
