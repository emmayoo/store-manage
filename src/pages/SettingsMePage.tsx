import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'
import { Textarea } from '@/ui/textarea'

export function SettingsMePage() {
  const user = useAuthStore((s) => s.user)
  const loadMyProfile = useProfileStore((s) => s.loadMyProfile)
  const profile = useProfileStore((s) => s.profile)

  useEffect(() => {
    if (!user) return
    loadMyProfile(user.id).catch(() => {})
  }, [loadMyProfile, user])

  const initialName = useMemo(() => {
    if (!user) return ''
    if (profile?.display_name) return profile.display_name
    return typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : ''
  }, [profile?.display_name, user])

  if (!user) {
    return (
      <div className="min-h-full px-4 py-6">
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-sm text-muted-foreground">로그인이 필요합니다.</p>
          <div className="mt-4">
            <Link className="text-sm underline" to="/login">
              로그인으로 이동
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">내 계정</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            스케줄/기록에 표시될 이름을 수정합니다.
          </p>
        </div>

        <ProfilePanel
          key={`${user.id}:${profile?.updated_at ?? 'none'}`}
          userId={user.id}
          initialName={initialName}
        />
      </div>
    </div>
  )
}

function ProfilePanel(props: { userId: string; initialName: string }) {
  const profile = useProfileStore((s) => s.profile)
  const avatarUrl = useProfileStore((s) => s.avatarUrl)
  const saving = useProfileStore((s) => s.saving)
  const error = useProfileStore((s) => s.error)
  const saveMyProfile = useProfileStore((s) => s.saveMyProfile)
  const uploadAvatar = useProfileStore((s) => s.uploadAvatar)

  const [name, setName] = useState(props.initialName)
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [color, setColor] = useState(profile?.color ?? '#4f46e5')
  const [memo, setMemo] = useState(profile?.memo ?? '')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>프로필</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-md border bg-background p-3 text-sm">
            {message}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-full border bg-muted">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="프로필"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">프로필 이미지</div>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setMessage(null)
                await uploadAvatar({ userId: props.userId, file })
                e.currentTarget.value = ''
              }}
            />
            <p className="text-xs text-muted-foreground">
              Supabase Storage에 `avatars` 버킷이 필요합니다.
            </p>
          </div>
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">표시 이름</div>
          <Input
            value={name}
            placeholder="예) 유현선"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">생년월일</div>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">핸드폰 번호</div>
          <Input
            inputMode="tel"
            value={phone}
            placeholder="예) 010-1234-5678"
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">스케줄 색상</div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color.startsWith('#') ? color : '#4f46e5'}
              onChange={(e) => setColor(e.target.value)}
              aria-label="색상 선택"
            />
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            주/일 스케줄표에서 본인 근무를 구분할 때 사용합니다.
          </p>
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">특이사항 메모</div>
          <Textarea
            value={memo}
            placeholder="예) 20시 이후에는 통화 어려움 / 발주 담당"
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <Button
          disabled={saving}
          onClick={async () => {
            setMessage(null)
            try {
              await saveMyProfile({
                userId: props.userId,
                form: {
                  display_name: name,
                  birth_date: birthDate,
                  phone,
                  color,
                  memo,
                  avatar_path: profile?.avatar_path ?? '',
                },
              })
              setMessage('저장했습니다.')
            } catch (e) {
              setMessage(e instanceof Error ? e.message : '저장에 실패했습니다.')
            }
          }}
        >
          저장
        </Button>
      </CardContent>
    </Card>
  )
}

