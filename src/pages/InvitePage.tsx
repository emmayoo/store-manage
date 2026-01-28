import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth.store'
import { useStoreStore } from '@/stores/store.store'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'

export function InvitePage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()

  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)

  const myStores = useStoreStore((s) => s.myStores)
  const selectStore = useStoreStore((s) => s.selectStore)
  const requestJoinByInviteCode = useStoreStore((s) => s.requestJoinByInviteCode)

  const [message, setMessage] = useState<string | null>(null)
  const inviteCode = useMemo(() => (code ?? '').trim(), [code])

  useEffect(() => {
    if (status === 'signed_out') {
      navigate('/login', { replace: true, state: { from: `/invite/${inviteCode}` } })
    }
  }, [inviteCode, navigate, status])

  useEffect(() => {
    if (!user) return
    if (!inviteCode) return

    // 이미 멤버이면 바로 입장
    // (현재는 코드로 storeId를 알기 어려워서 요청 후 /stores에서 선택하게 함)
    // 다음 단계에서 stores에 short link를 넣으면 여기서 자동 선택 가능.
    requestJoinByInviteCode({ userId: user.id, inviteCode })
      .then(() => setMessage('입장 요청을 보냈습니다. 승인되면 지점 목록에서 선택할 수 있어요.'))
      .catch(() => setMessage('입장 요청에 실패했습니다.'))
  }, [inviteCode, requestJoinByInviteCode, user])

  const already = myStores.length > 0

  return (
    <div className="min-h-full px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>초대 링크</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              링크로 들어오면 자동으로 지점 입장 요청을 보냅니다.
            </p>
            {message ? (
              <div className="rounded-md border bg-background p-3 text-sm">
                {message}
              </div>
            ) : null}
            <Button
              className="w-full"
              onClick={() => {
                // 요청이 승인되었거나 이미 멤버일 수 있으니 지점 선택으로 유도
                if (already) {
                  selectStore(null)
                }
                navigate('/stores', { replace: true })
              }}
            >
              지점 선택으로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

