import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, Settings, Wrench } from 'lucide-react'
import type { ComponentType } from 'react'

import { cn } from '@/lib/utils'
import { useCurrentStore } from '@/features/store/useCurrentStore'

type TabItem = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

const TABS: TabItem[] = [
  { to: '/calendar', label: '캘린더', Icon: CalendarDays },
  { to: '/manage', label: '게시판', Icon: Wrench },
  { to: '/history', label: '히스토리', Icon: Clock },
  { to: '/settings', label: '설정', Icon: Settings },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { store } = useCurrentStore()
  const storeName = store?.name ?? '지점'
  const showBack =
    location.pathname.startsWith('/settings/') && location.pathname !== '/settings'

  return (
    <div className="min-h-full bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-2 pt-[calc(12px+env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                onClick={() => navigate(-1)}
              >
                뒤로
              </button>
            ) : null}
            <div className="text-base font-semibold">{storeName}</div>
          </div>
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
            onClick={() => navigate('/stores')}
          >
            지점 변경
          </button>
        </div>
      </header>

      <div className="pt-[calc(56px+env(safe-area-inset-top))] pb-[calc(72px+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto grid max-w-2xl grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {TABS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs text-muted-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

