import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { supabase } from '@/lib/supabase'

type AuthStatus = 'loading' | 'signed_out' | 'signed_in'

type AuthState = {
  status: AuthStatus
  session: Session | null
  user: User | null
  setSession: (session: Session | null) => void
  signInWithKakao: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: 'loading',
      session: null,
      user: null,
      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
          status: session ? 'signed_in' : 'signed_out',
        }),
      signInWithKakao: async (redirectTo) => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'kakao',
          options: {
            redirectTo,
          },
        })
        if (error) throw error
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
      updateDisplayName: async (name) => {
        const trimmed = name.trim()
        const { data, error } = await supabase.auth.updateUser({
          data: { name: trimmed },
        })
        if (error) throw error
        set((prev) => ({
          ...prev,
          user: data.user ?? prev.user,
        }))
      },
    }),
    {
      name: 'my-cu.auth',
      partialize: (state) => ({
        session: state.session,
        user: state.user,
      }),
    },
  ),
)

