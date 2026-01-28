import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { useAuthStore } from '@/stores/auth.store'

export function LoginPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const status = useAuthStore((s) => s.status)
  const signInWithKakao = useAuthStore((s) => s.signInWithKakao)

  const [error, setError] = useState<string | null>(null)

  const redirectTo = useMemo(() => window.location.origin, [])
  const from =
    typeof state === 'object' && state !== null && 'from' in state
      ? (state as { from?: unknown }).from
      : null
  const nextPath = typeof from === 'string' ? from : '/'

  useEffect(() => {
    if (status === 'signed_in') navigate(nextPath, { replace: true })
  }, [navigate, nextPath, status])

  return (
    <div className="min-h-full px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              오늘 근무와 전달사항이 절대 새지 않도록, 로그인부터 시작합니다.
            </p>
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              onClick={async () => {
                setError(null)
                try {
                  await signInWithKakao(redirectTo)
                } catch (e) {
                  setError(e instanceof Error ? e.message : '로그인에 실패했습니다.')
                }
              }}
            >
              카카오로 로그인
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

