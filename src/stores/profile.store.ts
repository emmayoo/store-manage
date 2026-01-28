import { create } from 'zustand'

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

type ProfileForm = {
  display_name: string
  birth_date: string // YYYY-MM-DD
  phone: string
  color: string // hex or any string
  memo: string
  avatar_path: string
}

type ProfileState = {
  loading: boolean
  saving: boolean
  error: string | null
  profile: ProfileRow | null
  avatarUrl: string | null

  loadMyProfile: (userId: string) => Promise<void>
  saveMyProfile: (opts: { userId: string; form: ProfileForm }) => Promise<void>
  uploadAvatar: (opts: { userId: string; file: File }) => Promise<void>
}

function emptyFormFromProfile(p: ProfileRow | null): ProfileForm {
  return {
    display_name: p?.display_name ?? '',
    birth_date: p?.birth_date ?? '',
    phone: p?.phone ?? '',
    color: p?.color ?? '#4f46e5',
    memo: p?.memo ?? '',
    avatar_path: p?.avatar_path ?? '',
  }
}

async function resolveAvatarUrl(path: string) {
  if (!path) return null

  // public bucket인 경우
  const pub = supabase.storage.from('avatars').getPublicUrl(path)
  if (pub.data.publicUrl) return pub.data.publicUrl

  // private bucket인 경우(있을 수 있으니 fallback)
  const signed = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60)
  if (signed.error) return null
  return signed.data.signedUrl
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  loading: false,
  saving: false,
  error: null,
  profile: null,
  avatarUrl: null,

  loadMyProfile: async (userId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    const profile = (data ?? null) as unknown as ProfileRow | null
    const avatarUrl = profile?.avatar_path ? await resolveAvatarUrl(profile.avatar_path) : null
    set({ loading: false, profile, avatarUrl })
  },

  saveMyProfile: async ({ userId, form }) => {
    set({ saving: true, error: null })
    const trimmedName = form.display_name.trim() || null
    const birth = form.birth_date.trim() || null
    const phone = form.phone.trim() || null
    const memo = form.memo.trim() || null
    const color = form.color.trim() || null
    const avatar_path = form.avatar_path.trim() || null

    const payload: Database['public']['Tables']['profiles']['Insert'] = {
      user_id: userId,
      display_name: trimmedName,
      birth_date: birth,
      phone,
      memo,
      color,
      avatar_path,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) {
      set({ saving: false, error: error.message })
      return
    }

    // auth metadata도 같이 맞춰두면 (다른 곳에서) 편해짐
    const { error: uErr } = await supabase.auth.updateUser({
      data: { name: trimmedName ?? '' },
    })
    if (uErr) {
      // 저장 자체는 성공했으니 error만 표시
      set({ error: uErr.message })
    }

    const profile = data as unknown as ProfileRow
    const avatarUrl = profile.avatar_path ? await resolveAvatarUrl(profile.avatar_path) : null
    set({ saving: false, profile, avatarUrl })
  },

  uploadAvatar: async ({ userId, file }) => {
    set({ saving: true, error: null })
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'png'
    const path = `${userId}/avatar.${safeExt}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' })

    if (error) {
      set({ saving: false, error: error.message })
      return
    }

    const current = get().profile
    const nextForm = emptyFormFromProfile(current)
    nextForm.avatar_path = path
    await get().saveMyProfile({ userId, form: nextForm })
  },
}))

