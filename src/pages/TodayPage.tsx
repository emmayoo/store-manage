import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { dayjs } from '@/lib/day'
import { useAuthStore } from '@/stores/auth.store'
import { useRecordsStore } from '@/stores/records.store'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'

export function TodayPage() {
  const navigate = useNavigate()

  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  const items = useRecordsStore((s) => s.items)
  const loading = useRecordsStore((s) => s.loading)
  const error = useRecordsStore((s) => s.error)
  const loadToday = useRecordsStore((s) => s.loadToday)
  const addNote = useRecordsStore((s) => s.addNote)

  const [note, setNote] = useState('')

  const storeId = null // MVP: 지점 선택은 다음 단계(우선 "오늘 기록 안 새기기")
  const todayLabel = useMemo(() => dayjs().format('YYYY.MM.DD (ddd)'), [])

  useEffect(() => {
    if (status === 'signed_out') navigate('/login', { replace: true })
  }, [navigate, status])

  useEffect(() => {
    if (!user) return
    loadToday({ userId: user.id, storeId }).catch(() => {
      // 에러는 store에서 관리
    })
  }, [loadToday, user, storeId])

  if (status === 'loading') {
    return (
      <div className="min-h-full px-4 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>로딩 중…</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">오늘</h1>
            <p className="text-sm text-muted-foreground">{todayLabel}</p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
          >
            로그아웃
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>빠른 전달사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={note}
                placeholder="예) 15시 도시락 2개 입고"
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key !== 'Enter') return
                  if (!user) return
                  await addNote({ userId: user.id, storeId, content: note })
                  setNote('')
                }}
              />
              <Button
                type="button"
                onClick={async () => {
                  if (!user) return
                  await addNote({ userId: user.id, storeId, content: note })
                  setNote('')
                }}
              >
                저장
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>오늘 기록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">불러오는 중…</p>
            ) : null}
            {!loading && items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                아직 기록이 없습니다. 위에서 바로 추가해보세요.
              </p>
            ) : null}
            <ul className="space-y-2">
              {items.map((r) => (
                <li key={r.id}>
                  <div className="rounded-md border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {r.type === 'note' ? '전달사항' : r.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dayjs(r.created_at).format('HH:mm')}
                      </p>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {r.content ?? r.title ?? '(내용 없음)'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

