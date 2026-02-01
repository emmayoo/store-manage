import { NavLink, Outlet } from "react-router-dom";
import { AlertTriangle, Calendar, FileText, Home, Users } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

type StoreTabItem = {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

/** 와이어프레임: 홈 | 스케줄 | 공지 | 폐기 | 구성원 (한글 일관) */
const STORE_TABS: StoreTabItem[] = [
  { to: "/store", label: "홈", Icon: Home },
  { to: "/store/schedule", label: "스케줄", Icon: Calendar },
  { to: "/store/notices", label: "공지", Icon: FileText },
  { to: "/store/expiry", label: "폐기", Icon: AlertTriangle },
  { to: "/store/people", label: "구성원", Icon: Users },
];

export function StoreTabs() {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex max-w-2xl gap-1 overflow-x-auto px-2 py-2">
        {STORE_TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/store"}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground",
                isActive && "bg-accent text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
