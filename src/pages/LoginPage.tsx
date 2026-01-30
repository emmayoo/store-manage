import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { useAuthStore } from '@/stores/auth.store'
import loginBg from '@/assets/image/login_bg.png'

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
    <div className="min-h-screen bg-cover bg-center bg-no-repeat">
      <div className="min-h-screen px-4 py-10">
        <div className="mx-auto w-full max-w-md">
          <img src={loginBg} alt="login-bg" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="fixed bottom-[30px] left-0 right-0 px-4">
        <div className="mx-auto w-full max-w-md">
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
        </div>
      </div>
    </div>
  )
}

