import { create } from 'zustand'

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type RecordRow = Database['public']['Tables']['records']['Row']
type RecordInsert = Database['public']['Tables']['records']['Insert']

export type ShiftRecord = RecordRow & { type: 'shift' }

export type CalendarState = {
  shifts: ShiftRecord[]
  loading: boolean
  error: string | null
  loadShifts: (opts: {
    storeId: string
    startIso: string
    endIso: string
  }) => Promise<void>
  addShift: (opts: {
    userId: string
    storeId: string
    assignee: string
    startsAtIso: string
    endsAtIso: string
    memo?: string
  }) => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  shifts: [],
  loading: false,
  error: null,
  loadShifts: async ({ storeId, startIso, endIso }) => {
    set({ loading: true, error: null })

    const base = supabase
      .from('records')
      .select('*')
      .eq('type', 'shift')
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .gte('starts_at', startIso)
      .lt('starts_at', endIso)
      .order('starts_at', { ascending: true })

    const { data, error } = await base

    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    set({
      shifts: ((data ?? []) as unknown as ShiftRecord[]).filter(
        (r) => r.type === 'shift',
      ),
      loading: false,
    })
  },
  addShift: async ({
    userId,
    storeId,
    assignee,
    startsAtIso,
    endsAtIso,
    memo,
  }) => {
    const payload: RecordInsert['payload'] = { assignee }
    const title = assignee.trim() || null
    const content = memo?.trim() ? memo.trim() : null

    const { data, error } = await supabase
      .from('records')
      .insert({
        type: 'shift',
        store_id: storeId,
        created_by: userId,
        title,
        content,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        payload,
      })
      .select('*')
      .single()

    if (error) {
      set({ error: error.message })
      return
    }

    const next = [data as unknown as ShiftRecord, ...get().shifts].sort((a, b) =>
      (a.starts_at ?? '').localeCompare(b.starts_at ?? ''),
    )
    set({ shifts: next })
  },
}))

