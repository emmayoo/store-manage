import { create } from 'zustand'

import { dayjs } from '@/lib/day'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type RecordRow = Database['public']['Tables']['records']['Row']

type RecordsState = {
  items: RecordRow[]
  loading: boolean
  error: string | null
  loadToday: (opts: { userId: string; storeId?: string | null }) => Promise<void>
  addNote: (opts: {
    userId: string
    storeId?: string | null
    content: string
  }) => Promise<void>
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  loadToday: async ({ userId, storeId = null }) => {
    set({ loading: true, error: null })
    const start = dayjs().startOf('day').toISOString()
    const end = dayjs().add(1, 'day').startOf('day').toISOString()

    const query = supabase
      .from('records')
      .select('*')
      .eq('created_by', userId)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })

    const { data, error } =
      storeId === null
        ? await query.is('store_id', null)
        : await query.eq('store_id', storeId)

    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    set({ items: ((data ?? []) as unknown as RecordRow[]), loading: false })
  },
  addNote: async ({ userId, storeId = null, content }) => {
    const trimmed = content.trim()
    if (!trimmed) return

    const { data, error } = await supabase
      .from('records')
      .insert({
        type: 'note',
        content: trimmed,
        created_by: userId,
        store_id: storeId,
      })
      .select('*')
      .single()

    if (error) {
      set({ error: error.message })
      return
    }

    const current = get().items
    set({ items: [data as unknown as RecordRow, ...current] })
  },
}))

