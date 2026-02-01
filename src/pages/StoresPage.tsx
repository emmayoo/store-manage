import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth.store";
import { useStoreStore } from "@/stores/store.store";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";

export function StoresPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const status = useStoreStore((s) => s.status);
  const error = useStoreStore((s) => s.error);
  const myStores = useStoreStore((s) => s.myStores);
  const myJoinRequests = useStoreStore((s) => s.myJoinRequests);
  const publicSearchResults = useStoreStore((s) => s.publicSearchResults);

  const load = useStoreStore((s) => s.load);
  const selectStore = useStoreStore((s) => s.selectStore);
  const createStore = useStoreStore((s) => s.createStore);
  const searchPublicStores = useStoreStore((s) => s.searchPublicStores);
  const requestJoin = useStoreStore((s) => s.requestJoin);
  const requestJoinByInviteCode = useStoreStore(
    (s) => s.requestJoinByInviteCode
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeBusinessNumber, setStoreBusinessNumber] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [inviteCode, setInviteCode] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    load({ userId: user.id }).catch(() => {});
  }, [load, user]);

  const myStoreIds = useMemo(
    () => new Set(myStores.map((s) => s.store.id)),
    [myStores]
  );

  const joinStatusByStore = useMemo(() => {
    // 같은 지점에 대해 요청이 여러 번 업데이트될 수 있으니 "최신 요청" 기준으로 본다
    // (unique(store_id,user_id)라서 실사용에선 1개가 대부분)
    const map = new Map<
      string,
      { status: string; createdAt: string; via: string }
    >();
    for (const r of myJoinRequests) {
      const prev = map.get(r.store_id);
      if (!prev || prev.createdAt < r.created_at) {
        map.set(r.store_id, {
          status: r.status,
          createdAt: r.created_at,
          via: r.via,
        });
      }
    }
    return map;
  }, [myJoinRequests]);

  return (
    <div className="min-h-full px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">매장 선택</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              매장을 선택하고 들어갑니다.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }}
          >
            로그아웃
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {myStores.map(({ store, role }) => (
            <button
              key={store.id}
              type="button"
              className="text-left"
              onClick={() => {
                selectStore(store.id);
                navigate("/store", { replace: true });
              }}
            >
              <Card className="hover:bg-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{store.name}</span>
                    <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                      {role === "owner"
                        ? "owner"
                        : role === "manager"
                        ? "manager"
                        : "staff"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {store.is_public ? "검색 가능" : "비공개"}
                </CardContent>
              </Card>
            </button>
          ))}

          <button
            type="button"
            className="text-left"
            onClick={() => setCreateOpen(true)}
          >
            <Card className="border-dashed hover:bg-accent/30">
              <CardHeader>
                <CardTitle>+ 매장 추가</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                처음이라면 매장을 생성하세요.
              </CardContent>
            </Card>
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>초대코드로 입장 요청</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                placeholder="예) a1b2c3d4"
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={!user}
                onClick={async () => {
                  if (!user) return;
                  await requestJoinByInviteCode({
                    userId: user.id,
                    inviteCode,
                    message,
                  });
                }}
              >
                요청
              </Button>
            </div>
            <Input
              value={message}
              placeholder="(선택) 요청 메시지: 예) 야간 근무자입니다"
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              요청은 owner/manager 승인 후 입장됩니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>매장 검색 후 입장 요청</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={search}
                placeholder="매장 이름 검색"
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => searchPublicStores(search)}
              >
                검색
              </Button>
            </div>

            <div className="space-y-2">
              {publicSearchResults.map((s) => {
                const isMember = myStoreIds.has(s.id);
                const join = joinStatusByStore.get(s.id) ?? null;
                const isPending = join?.status === "pending";
                const disabled = !user || isMember || isPending;

                const subtitle = isMember
                  ? "이미 입장한 매장"
                  : isPending
                  ? "요청 대기중"
                  : "검색 가능";

                const buttonLabel = isMember
                  ? "입장됨"
                  : isPending
                  ? "대기"
                  : "요청";

                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border bg-background p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {subtitle}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      disabled={disabled}
                      onClick={async () => {
                        if (!user) return;
                        if (isMember || isPending) return;
                        await requestJoin({
                          userId: user.id,
                          storeId: s.id,
                          via: "search",
                          message,
                        });
                      }}
                    >
                      {buttonLabel}
                    </Button>
                  </div>
                );
              })}
              {publicSearchResults.length === 0 && search.trim() ? (
                <p className="text-sm text-muted-foreground">
                  검색 결과가 없습니다.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground">
          {status === "loading" ? "불러오는 중…" : null}
        </div>
      </div>

      {/* create modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCreateOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-2xl rounded-t-2xl border bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">매장 생성</div>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                닫기
              </Button>
            </div>

            <div className="mt-3 grid gap-3">
              <div className="grid gap-1">
                <div className="text-sm font-medium">매장 이름</div>
                <Input
                  value={storeName}
                  placeholder="예) 우리동네점"
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">주소 (선택)</div>
                <Input
                  value={storeAddress}
                  placeholder="예) 서울시 강남구 ..."
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">사업자번호 (선택)</div>
                <Input
                  value={storeBusinessNumber}
                  placeholder="예) 123-45-67890"
                  onChange={(e) => setStoreBusinessNumber(e.target.value)}
                />
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">전화번호 (선택)</div>
                <Input
                  value={storePhone}
                  placeholder="예) 02-1234-5678"
                  onChange={(e) => setStorePhone(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                검색 허용(공개)
              </label>

              <Button
                disabled={!user}
                onClick={async () => {
                  if (!user) return;
                  const created = await createStore({
                    userId: user.id,
                    name: storeName,
                    address: storeAddress,
                    businessNumber: storeBusinessNumber,
                    phone: storePhone,
                    isPublic,
                  });
                  if (!created) return;
                  selectStore(created.id);
                  setCreateOpen(false);
                  setStoreName("");
                  setStoreAddress("");
                  setStoreBusinessNumber("");
                  setStorePhone("");
                  navigate("/store", { replace: true });
                }}
              >
                생성하고 들어가기
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
