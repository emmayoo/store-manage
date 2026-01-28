import { type PropsWithChildren, useEffect } from 'react'

import { useAuthStore } from '@/stores/auth.store'
import { useStoreStore } from '@/stores/store.store'

export function StoreProvider({ children }: PropsWithChildren) {
  const user = useAuthStore((s) => s.user)
  const ensureSelectedStoreValid = useStoreStore((s) => s.ensureSelectedStoreValid)
  const selectStore = useStoreStore((s) => s.selectStore)

  useEffect(() => {
    if (!user) {
      // 로그아웃되면 선택 지점은 유지하지 않음(다음 로그인에서 재확인)
      selectStore(null)
      return
    }
    ensureSelectedStoreValid({ userId: user.id }).catch(() => {})
  }, [ensureSelectedStoreValid, selectStore, user])

  return children
}

