"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Branch = {
  id: number;
  name: string;
};

type EmployeeItem = {
  id: number;
  role: string;
  hireDate: string;
  resignDate: string | null;
  color: string | null;
  user: { id: number; name: string; username: string; phone: string };
};

type EmployeeListResponse = {
  items: EmployeeItem[];
  canInvite: boolean;
  canEdit: boolean;
  canSeePhone: boolean;
};

export default function EmployeesPage() {
  const searchParams = useSearchParams();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [canInvite, setCanInvite] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canSeePhone, setCanSeePhone] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // URL 쿼리로 넘어온 branchId를 우선 사용
  useEffect(() => {
    const id = searchParams.get("branchId");
    if (!id) return;
    const num = Number(id);
    if (!Number.isNaN(num)) {
      setSelectedBranchId(num);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadBranches() {
      setError(null);
      try {
        const res = await fetch("/api/branches");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "지점 목록을 불러오지 못했습니다.");
          setBranches([]);
          setSelectedBranchId(null);
          return;
        }
        const data: Branch[] = await res.json();
        setBranches(data);
        // URL에서 받은 지점이 없고, 지점이 하나만 있으면 기본 선택
        setSelectedBranchId((prev) => {
          if (prev != null) return prev;
          if (data.length > 0) return data[0].id;
          return null;
        });
      } catch {
        setError("지점 목록을 불러오지 못했습니다.");
        setBranches([]);
        setSelectedBranchId(null);
      } finally {
      }
    }

    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId == null) {
      setEmployees([]);
      return;
    }
    let cancelled = false;
    setLoadingEmployees(true);
    fetch(`/api/employees?branchId=${selectedBranchId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: EmployeeListResponse) => {
        if (!cancelled) {
          setEmployees(data.items);
          setCanInvite(data.canInvite);
          setCanEdit(data.canEdit);
          setCanSeePhone(data.canSeePhone);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEmployees([]);
          setCanInvite(false);
          setCanEdit(false);
          setCanSeePhone(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployees(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBranchId]);

  async function handleCreateInvite() {
    if (selectedBranchId == null) {
      setError("먼저 지점을 선택해 주세요.");
      return;
    }
    setCreatingInvite(true);
    setError(null);
    setInviteUrl(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: selectedBranchId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "초대 링크를 생성하지 못했습니다.");
        return;
      }
      setInviteUrl(data.url ?? null);
    } catch {
      setError("초대 링크를 생성하지 못했습니다.");
    } finally {
      setCreatingInvite(false);
    }
  }

  const hasBranches = branches.length > 0;

  const roleLabel: Record<string, string> = {
    OWNER: "점주",
    MANAGER: "매니저",
    STAFF: "직원",
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">직원 관리</h1>

      {hasBranches && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">직원 목록</CardTitle>

            {canInvite && selectedBranchId != null && (
              <Button
                size="sm"
                onClick={handleCreateInvite}
                disabled={creatingInvite}
              >
                {creatingInvite
                  ? "초대 링크 생성 중..."
                  : "직원 초대 링크 생성"}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {inviteUrl && (
              <div className="space-y-1">
                <p className="font-medium text-xs text-muted-foreground">
                  아래 초대 링크를 직원에게 전달하세요.
                </p>
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="border-input w-full rounded-md border px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>
            )}
            {loadingEmployees ? (
              <p className="text-muted-foreground">
                직원 목록을 불러오는 중...
              </p>
            ) : employees.length === 0 ? (
              <p className="text-muted-foreground">
                이 지점에 등록된 직원이 없습니다. 직원 초대 링크로 추가할 수
                있습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium whitespace-nowrap min-w-[120px]">
                        이름
                      </th>
                      <th className="pb-2 pr-4 font-medium whitespace-nowrap min-w-[120px]">
                        역할
                      </th>
                      <th className="pb-2 pr-4 font-medium whitespace-nowrap min-w-[120px]">
                        색상
                      </th>
                      <th className="pb-2 pr-4 font-medium whitespace-nowrap min-w-[120px]">
                        입사일
                      </th>
                      <th className="pb-2 pr-4 font-medium whitespace-nowrap min-w-[120px]">
                        퇴사일
                      </th>
                      <th className="pb-2 pr-4 font-medium whitespace-nowrap min-w-[120px]">
                        연락처
                      </th>
                      <th className="pb-2 pr-4 font-medium whitespace-nowrap min-w-[100px]">
                        저장
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className={`border-b last:border-0 ${emp.resignDate ? "text-muted-foreground" : ""}`}
                      >
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {emp.user.name}
                        </td>
                        <td className="py-2 pr-4">
                          {canEdit ? (
                            <select
                              className="border-input bg-background focus-visible:ring-ring rounded-md border px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2"
                              value={emp.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                setEmployees((prev) =>
                                  prev.map((item) =>
                                    item.id === emp.id
                                      ? { ...item, role: newRole }
                                      : item,
                                  ),
                                );
                              }}
                            >
                              <option value="OWNER">점주</option>
                              <option value="MANAGER">매니저</option>
                              <option value="STAFF">직원</option>
                            </select>
                          ) : (
                            (roleLabel[emp.role] ?? emp.role)
                          )}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {canEdit ? (
                            <input
                              type="color"
                              value={emp.color ?? "#4b5563"}
                              onChange={(e) => {
                                const newColor = e.target.value;
                                setEmployees((prev) =>
                                  prev.map((item) =>
                                    item.id === emp.id
                                      ? { ...item, color: newColor }
                                      : item,
                                  ),
                                );
                              }}
                              className="h-6 w-10 cursor-pointer rounded border border-input bg-background p-0"
                            />
                          ) : (
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-border"
                              style={{
                                backgroundColor: emp.color ?? "#4b5563",
                              }}
                            />
                          )}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {emp.hireDate
                            ? new Date(emp.hireDate).toLocaleDateString("ko-KR")
                            : "-"}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {emp.resignDate
                            ? new Date(emp.resignDate).toLocaleDateString(
                                "ko-KR",
                              )
                            : "-"}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {canSeePhone ? (emp.user.phone ?? "-") : "-"}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {canEdit && (
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={savingId === emp.id}
                              onClick={async () => {
                                try {
                                  setSavingId(emp.id);
                                  setError(null);
                                  const res = await fetch(
                                    `/api/employees/${emp.id}`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        role: emp.role,
                                        color: emp.color,
                                      }),
                                    },
                                  );
                                  if (!res.ok) {
                                    const data = await res
                                      .json()
                                      .catch(() => ({}));
                                    setError(
                                      data.error ??
                                        "직원 정보를 저장하지 못했습니다.",
                                    );
                                  }
                                } catch {
                                  setError("직원 정보를 저장하지 못했습니다.");
                                } finally {
                                  setSavingId((current) =>
                                    current === emp.id ? null : current,
                                  );
                                }
                              }}
                            >
                              {savingId === emp.id ? "저장 중..." : "저장"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
