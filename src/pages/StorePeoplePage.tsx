import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";

import { useCurrentStore } from "@/features/store/useCurrentStore";
import { useStoreStore } from "@/stores/store.store";
import { Button } from "@/ui/button";
import type { StoreRole } from "@/types/database";

const ROLE_LABEL: Record<StoreRole, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

/**
 * Store > People (구성원)
 * 참조: 매니저 섹션, 직원 섹션, 아바타 + 역할 표시
 */
export function StorePeoplePage() {
  const navigate = useNavigate();
  const { store, storeId, role, canEditStore } = useCurrentStore();
  const loadMembers = useStoreStore((s) => s.loadMembers);

  const [members, setMembers] = useState<
    Array<{ user_id: string; role: StoreRole }>
  >([]);

  useEffect(() => {
    if (!storeId) return;
    loadMembers({ storeId })
      .then((rows) =>
        setMembers(rows.map((m) => ({ user_id: m.user_id, role: m.role })))
      )
      .catch(() => {});
  }, [loadMembers, storeId]);

  if (!store) return null;

  const managers = members.filter(
    (m) => m.role === "owner" || m.role === "manager"
  );
  const staffs = members.filter((m) => m.role === "staff");

  return (
    <div className="min-h-full px-4 py-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-base font-semibold">{store.name} 팀</h2>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border p-3 text-left hover:bg-accent"
            onClick={() => navigate("/settings/store/staff")}
          >
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">인원 설정</span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {managers.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              매니저
            </h3>
            <ul className="space-y-2">
              {managers.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center gap-3 rounded-md border bg-background p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {m.user_id.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ROLE_LABEL[m.role]}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {staffs.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">직원</h3>
            <ul className="space-y-2">
              {staffs.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center gap-3 rounded-md border bg-background p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {m.user_id.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ROLE_LABEL[m.role]}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {members.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            구성원 정보를 불러오는 중…
          </p>
        ) : null}

        {canEditStore ? (
          <Button
            className="w-full"
            onClick={() => navigate("/settings/store")}
          >
            매장 설정 (Owner)
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/settings/store/staff")}
          >
            직원 관리 보기
          </Button>
        )}
      </div>
    </div>
  );
}
