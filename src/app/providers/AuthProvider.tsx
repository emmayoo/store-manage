import { type PropsWithChildren, useEffect } from 'react'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function AuthProvider({ children }: PropsWithChildren) {
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        // 세션을 못 가져오면, 일단 로그아웃 상태로 처리
        setSession(null)
        return
      }
      setSession(data.session)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [setSession])

  return children
}

