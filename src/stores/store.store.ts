import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { supabase } from '@/lib/supabase'
import type { Database, JoinRequestStatus, StoreRole } from '@/types/database'

export type StoreRow = Database['public']['Tables']['stores']['Row']
export type StoreMemberRow = Database['public']['Tables']['store_members']['Row']
export type JoinRequestRow =
  Database['public']['Tables']['store_join_requests']['Row']

export type MyStore = {
  store: StoreRow
  role: StoreRole
}

type StoreStatus = 'idle' | 'loading' | 'ready'

type StoreState = {
  status: StoreStatus
  error: string | null

  selectedStoreId: string | null

  myStores: MyStore[]
  myJoinRequests: JoinRequestRow[]

  publicSearchResults: Array<Pick<StoreRow, 'id' | 'name' | 'is_public'>>

  load: (opts: { userId: string }) => Promise<void>
  selectStore: (storeId: string | null) => void
  ensureSelectedStoreValid: (opts: { userId: string }) => Promise<void>

  createStore: (opts: {
    userId: string
    name: string
    address?: string
    businessNumber?: string
    phone?: string
    isPublic: boolean
  }) => Promise<StoreRow | null>

  searchPublicStores: (query: string) => Promise<void>
  requestJoin: (opts: {
    userId: string
    storeId: string
    via: 'search' | 'code'
    message?: string
  }) => Promise<void>

  requestJoinByInviteCode: (opts: {
    userId: string
    inviteCode: string
    message?: string
  }) => Promise<void>

  loadPendingRequestsForStore: (opts: {
    storeId: string
  }) => Promise<JoinRequestRow[]>

  approveJoinRequest: (opts: {
    requestId: string
    role?: StoreRole
  }) => Promise<void>
  rejectJoinRequest: (opts: { requestId: string }) => Promise<void>

  updateStore: (opts: {
    storeId: string
    name: string
    address?: string
    businessNumber?: string
    phone?: string
    isPublic: boolean
  }) => Promise<void>

  rotateInviteCode: (opts: { storeId: string }) => Promise<string | null>
  softDeleteStore: (opts: { storeId: string }) => Promise<void>

  loadMembers: (opts: { storeId: string }) => Promise<StoreMemberRow[]>
  setMemberRole: (opts: {
    storeId: string
    userId: string
    role: StoreRole
  }) => Promise<void>
  removeMember: (opts: { storeId: string; userId: string }) => Promise<void>
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set, get) => {
      async function refreshMyJoinRequests(userId: string) {
        const { data: reqs, error } = await supabase
          .from('store_join_requests')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (error) {
          set({ error: error.message })
          return
        }
        set({ myJoinRequests: (reqs ?? []) as unknown as JoinRequestRow[] })
      }

      return {
      status: 'idle',
      error: null,
      selectedStoreId: null,

      myStores: [],
      myJoinRequests: [],
      publicSearchResults: [],

      load: async ({ userId }) => {
        set({ status: 'loading', error: null })

        const { data: membersRaw, error: mErr } = await supabase
          .from('store_members')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)

        if (mErr) {
          set({ status: 'ready', error: mErr.message, myStores: [] })
          return
        }

        const members = (membersRaw ?? []) as unknown as StoreMemberRow[]
        const storeIds = members.map((m) => m.store_id)
        let stores: StoreRow[] = []
        if (storeIds.length > 0) {
          const { data: storeRows, error: sErr } = await supabase
            .from('stores')
            .select('*')
            .in('id', storeIds)
            .is('deleted_at', null)

          if (sErr) {
            set({ status: 'ready', error: sErr.message, myStores: [] })
            return
          }
          stores = (storeRows ?? []) as unknown as StoreRow[]
        }

        const storeById = new Map(stores.map((s) => [s.id, s]))
        const myStores: MyStore[] = members
          .map((m) => {
            const store = storeById.get(m.store_id)
            if (!store) return null
            return { store, role: (m.role as StoreRole) ?? 'staff' } satisfies MyStore
          })
          .filter((v): v is MyStore => v !== null)
          .sort((a, b) => a.store.name.localeCompare(b.store.name))

        const { data: reqs } = await supabase
          .from('store_join_requests')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        set({
          status: 'ready',
          myStores,
          myJoinRequests: (reqs ?? []) as unknown as JoinRequestRow[],
        })
      },

      selectStore: (storeId) => set({ selectedStoreId: storeId }),

      ensureSelectedStoreValid: async ({ userId }) => {
        // 내 지점 목록을 갱신하고, 선택된 지점이 유효한지 확인
        await get().load({ userId })
        const selected = get().selectedStoreId
        if (!selected) return
        const ok = get().myStores.some((s) => s.store.id === selected)
        if (!ok) set({ selectedStoreId: null })
      },

      createStore: async ({ userId, name, address, businessNumber, phone, isPublic }) => {
        const trimmed = name.trim()
        if (!trimmed) return null

        const addr = address?.trim() ? address.trim() : null
        const bn = businessNumber?.trim() ? businessNumber.trim() : null
        const ph = phone?.trim() ? phone.trim() : null

        const { data: store, error } = await supabase
          .from('stores')
          .insert({
            name: trimmed,
            is_public: isPublic,
            address: addr,
            business_number: bn,
            phone: ph,
            created_by: userId,
          })
          .select('*')
          .single()

        if (error) {
          set({ error: error.message })
          return null
        }

        // owner 멤버십(본인 row만 insert 허용)
        await supabase.from('store_members').insert({
          store_id: (store as unknown as StoreRow).id,
          user_id: userId,
          role: 'owner',
        })

        await get().load({ userId })
        return store as unknown as StoreRow
      },

      searchPublicStores: async (query) => {
        const q = query.trim()
        if (!q) {
          set({ publicSearchResults: [] })
          return
        }

        const { data, error } = await supabase
          .from('stores')
          .select('id,name,is_public')
          .eq('is_public', true)
          .is('deleted_at', null)
          .ilike('name', `%${q}%`)
          .order('name', { ascending: true })
          .limit(20)

        if (error) {
          set({ error: error.message })
          return
        }

        set({
          publicSearchResults:
            (data ?? []) as unknown as Array<
              Pick<StoreRow, 'id' | 'name' | 'is_public'>
            >,
        })
      },

      requestJoin: async ({ userId, storeId, via, message }) => {
        const payload = {
          store_id: storeId,
          user_id: userId,
          via,
          status: 'pending' as JoinRequestStatus,
          message: message?.trim() ? message.trim() : null,
          deleted_at: null,
        }

        const { error } = await supabase
          .from('store_join_requests')
          .upsert(payload, { onConflict: 'store_id,user_id' })

        if (error) {
          set({ error: error.message })
          return
        }

        await refreshMyJoinRequests(userId)
      },

      requestJoinByInviteCode: async ({ userId, inviteCode, message }) => {
        const code = inviteCode.trim()
        if (!code) return

        const { data, error } = await supabase.rpc('get_store_by_invite_code', {
          p_code: code,
        })

        if (error) {
          set({ error: error.message })
          return
        }

        const row = Array.isArray(data) ? data[0] : null
        if (!row?.id) {
          set({ error: '초대코드를 찾을 수 없습니다.' })
          return
        }

        await get().requestJoin({
          userId,
          storeId: row.id as string,
          via: 'code',
          message,
        })
      },

      loadPendingRequestsForStore: async ({ storeId }) => {
        const { data, error } = await supabase
          .from('store_join_requests')
          .select('*')
          .eq('store_id', storeId)
          .eq('status', 'pending')
          .is('deleted_at', null)
          .order('created_at', { ascending: true })

        if (error) {
          set({ error: error.message })
          return []
        }

        return (data ?? []) as unknown as JoinRequestRow[]
      },

      approveJoinRequest: async ({ requestId, role = 'staff' }) => {
        const { error } = await supabase.rpc('approve_store_join_request', {
          p_request_id: requestId,
          p_role: role,
        })
        if (error) set({ error: error.message })
      },

      rejectJoinRequest: async ({ requestId }) => {
        const { error } = await supabase.rpc('reject_store_join_request', {
          p_request_id: requestId,
        })
        if (error) set({ error: error.message })
      },

      updateStore: async ({ storeId, name, address, businessNumber, phone, isPublic }) => {
        const trimmed = name.trim()
        if (!trimmed) return
        const addr = address?.trim() ? address.trim() : null
        const bn = businessNumber?.trim() ? businessNumber.trim() : null
        const ph = phone?.trim() ? phone.trim() : null

        const { error } = await supabase
          .from('stores')
          .update({
            name: trimmed,
            address: addr,
            business_number: bn,
            phone: ph,
            is_public: isPublic,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storeId)
          .is('deleted_at', null)

        if (error) set({ error: error.message })
      },

      rotateInviteCode: async ({ storeId }) => {
        const { data, error } = await supabase.rpc('rotate_store_invite_code', {
          p_store_id: storeId,
        })
        if (error) {
          set({ error: error.message })
          return null
        }
        return typeof data === 'string' ? data : null
      },

      softDeleteStore: async ({ storeId }) => {
        const { error } = await supabase.rpc('soft_delete_store', {
          p_store_id: storeId,
        })
        if (error) {
          set({ error: error.message })
          return
        }
      },

      loadMembers: async ({ storeId }) => {
        const { data, error } = await supabase
          .from('store_members')
          .select('*')
          .eq('store_id', storeId)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })

        if (error) {
          set({ error: error.message })
          return []
        }
        return (data ?? []) as unknown as StoreMemberRow[]
      },

      setMemberRole: async ({ storeId, userId, role }) => {
        const { error } = await supabase.rpc('set_store_member_role', {
          p_store_id: storeId,
          p_user_id: userId,
          p_role: role,
        })
        if (error) set({ error: error.message })
      },

      removeMember: async ({ storeId, userId }) => {
        const { error } = await supabase.rpc('soft_delete_store_member', {
          p_store_id: storeId,
          p_user_id: userId,
        })
        if (error) set({ error: error.message })
      },
      }
    },
    {
      name: 'my-cu.store',
      partialize: (s) => ({
        selectedStoreId: s.selectedStoreId,
      }),
    },
  ),
)

