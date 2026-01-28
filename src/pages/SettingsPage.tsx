import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth.store'
import { useCurrentStore } from '@/features/store/useCurrentStore'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'

export function SettingsPage() {
  const navigate = useNavigate()
  const signOut = useAuthStore((s) => s.signOut)
  const { store, role, canEditStore } = useCurrentStore()

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">설정</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            개인 설정과 지점 설정을 관리합니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>내 계정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              스케줄/기록에 표시될 이름을 관리합니다.
            </p>
            <Button onClick={() => navigate('/settings/me')}>내 정보 수정</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지점</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">현재 지점: </span>
              <span className="font-medium">{store?.name ?? '지점'}</span>
              <span className="ml-2 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                {role}
              </span>
            </div>
            <Button onClick={() => navigate('/settings/store')}>
              지점 정보 / 직원 / 승인
            </Button>
            {canEditStore ? (
              <p className="text-xs text-muted-foreground">
                owner 권한으로 지점 수정/초대/직원관리가 가능합니다.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                지점 정보는 볼 수 있고, 수정은 owner만 가능합니다.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>앱 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              개인별 알림/테마 같은 설정입니다.
            </p>
            <Button variant="outline" onClick={() => navigate('/settings/app')}>
              앱 설정
            </Button>
          </CardContent>
        </Card>

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
    </div>
  )
}
