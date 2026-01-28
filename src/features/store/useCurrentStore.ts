import { useMemo } from 'react'

import { useStoreStore } from '@/stores/store.store'
import type { StoreRole } from '@/types/database'

export function useCurrentStore() {
  const selectedStoreId = useStoreStore((s) => s.selectedStoreId)
  const myStores = useStoreStore((s) => s.myStores)

  return useMemo(() => {
    const current = selectedStoreId
      ? (myStores.find((s) => s.store.id === selectedStoreId) ?? null)
      : null

    const role: StoreRole = current?.role ?? 'staff'
    return {
      storeId: selectedStoreId,
      store: current?.store ?? null,
      role,
      canAdmin: role === 'owner' || role === 'manager',
      canEditStore: role === 'owner',
      canEditSchedule: role === 'owner' || role === 'manager',
    }
  }, [myStores, selectedStoreId])
}

