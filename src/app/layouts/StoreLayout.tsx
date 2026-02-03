import { NavLink, Outlet } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  FileText,
  Home,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

type StoreTabItem = {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

/** 참조: Home | Schedule | 근무가능일 | Notices | 폐기 | People */
const STORE_TABS: StoreTabItem[] = [
  { to: "/store", label: "Home", Icon: Home },
  { to: "/store/schedule", label: "Schedule", Icon: Calendar },
  { to: "/store/availability", label: "근무가능일", Icon: CalendarCheck },
  { to: "/store/notices", label: "Notices", Icon: FileText },
  { to: "/store/expiry", label: "폐기", Icon: AlertTriangle },
  { to: "/store/people", label: "People", Icon: Users },
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
