import { useState } from 'react'

import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'

export function SettingsAppPage() {
  const [notifications, setNotifications] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">앱 설정</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            개인별 설정입니다. (MVP에서는 UI만 제공하고, 기능은 추후 연결합니다)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>알림</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>알림 사용</span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              예: 오늘 근무 30분 전, 전달사항 미확인, 폐기 임박 등
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>테마</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>다크 모드</span>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              MVP에서는 토글만 제공하고, 실제 테마 적용은 다음 단계에서 연결합니다.
            </p>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => alert('추후 저장 로직을 연결합니다.')}>
          임시 저장
        </Button>
      </div>
    </div>
  )
}

