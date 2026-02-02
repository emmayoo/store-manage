import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Home, Store, User } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { useCurrentStore } from "@/features/store/useCurrentStore";

type TabItem = {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

/** 참조: Home | Calendar | Stores | Settings (4탭) */
const TABS: TabItem[] = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/calendar", label: "Calendar", Icon: CalendarDays },
  { to: "/store", label: "Stores", Icon: Store },
  { to: "/settings", label: "Settings", Icon: User },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { store } = useCurrentStore();
  const storeName = store?.name ?? "매장";
  const [notifyOpen, setNotifyOpen] = useState(false);
  const notifyRef = useRef<HTMLDivElement>(null);

  const showBack =
    location.pathname.startsWith("/settings/") &&
    location.pathname !== "/settings";

  const headerTitle = (() => {
    if (location.pathname === "/home") return "Home";
    if (location.pathname === "/calendar") return "Calendar";
    if (location.pathname.startsWith("/store")) return storeName;
    if (location.pathname.startsWith("/settings")) return "Settings";
    return storeName;
  })();

  const notifyCount = 2;

  useEffect(() => {
    if (!notifyOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (notifyRef.current && !notifyRef.current.contains(e.target as Node)) {
        setNotifyOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notifyOpen]);

  return (
    <div className="min-h-full bg-background text-foreground">
      {/* Header: 현재 매장(전환) / 알림 🔔 */}
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
            <button
              type="button"
              className="text-base font-semibold hover:underline"
              onClick={() => navigate("/store")}
              title="매장 전환"
            >
              {storeName} ▼
            </button>
          </div>
          <div className="relative" ref={notifyRef}>
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground hover:bg-accent"
              onClick={() => setNotifyOpen((o) => !o)}
              title="알림"
              aria-label="알림"
              aria-expanded={notifyOpen}
            >
              <Bell className="h-5 w-5" />
            </button>
            {notifyOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-md border bg-background p-3 shadow-md"
                role="dialog"
                aria-label="알림"
              >
                <p className="text-sm text-muted-foreground">
                  알림 기능은 준비 중입니다.
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                  onClick={() => setNotifyOpen(false)}
                >
                  확인
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="pt-[calc(56px+env(safe-area-inset-top))] pb-[calc(72px+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto grid max-w-2xl grid-cols-4 px-1 pb-[env(safe-area-inset-bottom)] pt-2">
          {TABS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-2 text-xs text-muted-foreground",
                  isActive && "text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label ? <span>{label}</span> : null}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
