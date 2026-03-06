"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Users,
  Store,
  Package,
  Megaphone,
  LayoutTemplate,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

/**
 * 운영: 지점 선택 후 관리 (기획서 9.3)
 * - 직원 관리, 매장 관리, 상품 관리, 공지 관리, 템플릿 관리
 */
const menus = [
  { href: "/operations/employees", label: "직원 관리", icon: Users },
  { href: "/operations/branches", label: "매장 관리", icon: Store },
  { href: "/operations/products", label: "상품 관리", icon: Package },
  { href: "/operations/notices", label: "공지 관리", icon: Megaphone },
  { href: "/operations/templates", label: "템플릿 관리", icon: LayoutTemplate },
] as const;

type Branch = {
  id: number;
  name: string;
  location: string | null;
  phone: string | null;
  thumbnail: string | null;
  timezone: string;
};

export default function OperationsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadBranches() {
    setLoading(true);
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
      if (data.length === 1) {
        setSelectedBranchId(data[0].id);
      } else if (data.length > 1 && selectedBranchId == null) {
        setSelectedBranchId(data[0].id);
      }
    } catch {
      setError("지점 목록을 불러오지 못했습니다.");
      setBranches([]);
      setSelectedBranchId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  const isEmpty = !loading && branches.length === 0;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("지점명을 입력해 주세요.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || undefined,
          phone: phone.trim() || undefined,
          thumbnail: thumbnail.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "지점 생성에 실패했습니다.");
        return;
      }
      setName("");
      setLocation("");
      setPhone("");
      setThumbnail("");
      setCreateOpen(false);
      await loadBranches();
      setSelectedBranchId(data.id ?? null);
    } catch {
      setError("지점 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">운영</h1>

      {/* 지점 상태 + 생성 버튼 */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {loading ? (
              <p className="text-muted-foreground">
                지점 목록을 불러오는 중...
              </p>
            ) : isEmpty ? (
              <p className="text-muted-foreground">
                아직 등록된 지점이 없습니다. 새로 만들어서 시작하세요.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">현재 지점</span>
                <select
                  className="border-input bg-background focus-visible:ring-ring rounded-md border px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2"
                  value={selectedBranchId ?? ""}
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label="지점 추가"
            >
              <SheetTrigger>
                <Plus className="size-4" />
              </SheetTrigger>
            </Button>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>지점 추가</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleCreate} className="flex flex-1 flex-col gap-3 px-4 pb-4">
                <div>
                  <label
                    htmlFor="branch-name"
                    className="text-muted-foreground mb-1 block text-xs font-medium"
                  >
                    지점명
                  </label>
                  <input
                    id="branch-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-input w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="branch-location"
                    className="text-muted-foreground mb-1 block text-xs font-medium"
                  >
                    위치 (주소/설명)
                  </label>
                  <input
                    id="branch-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-input w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="서울 강남구 ..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="branch-phone"
                    className="text-muted-foreground mb-1 block text-xs font-medium"
                  >
                    지점 번호
                  </label>
                  <input
                    id="branch-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-input w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="02-123-4567"
                  />
                </div>
                <div>
                  <label
                    htmlFor="branch-thumbnail"
                    className="text-muted-foreground mb-1 block text-xs font-medium"
                  >
                    썸네일 URL
                  </label>
                  <input
                    id="branch-thumbnail"
                    type="text"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    className="border-input w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="https://..."
                  />
                </div>
                {error && (
                  <p className="text-destructive text-xs">{error}</p>
                )}
                <SheetFooter>
                  <Button type="submit" size="sm" disabled={creating}>
                    {creating ? "생성 중..." : "지점 생성"}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        {!createOpen && error && (
          <p className="text-destructive text-xs">{error}</p>
        )}
      </div>

      {/* 지점이 있을 때만 운영 메뉴 표시 */}
      {!isEmpty && !loading && (
        <nav className="grid gap-2">
          {menus.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={
                selectedBranchId != null
                  ? `${href}?branchId=${selectedBranchId}`
                  : href
              }
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className="size-5 text-muted-foreground" />
                  <span>{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
