import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth.store";
import { useStoreStore } from "@/stores/store.store";
import { useCurrentStore } from "@/features/store/useCurrentStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import type { StoreRole } from "@/types/database";

export function SettingsStorePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { storeId, store, role, canAdmin, canEditStore } = useCurrentStore();

  const load = useStoreStore((s) => s.load);
  const selectStore = useStoreStore((s) => s.selectStore);
  const updateStore = useStoreStore((s) => s.updateStore);
  const rotateInviteCode = useStoreStore((s) => s.rotateInviteCode);
  const softDeleteStore = useStoreStore((s) => s.softDeleteStore);
  const loadMembers = useStoreStore((s) => s.loadMembers);
  const loadPendingRequestsForStore = useStoreStore(
    (s) => s.loadPendingRequestsForStore,
  );
  const approveJoinRequest = useStoreStore((s) => s.approveJoinRequest);
  const rejectJoinRequest = useStoreStore((s) => s.rejectJoinRequest);

  const [members, setMembers] = useState<
    Array<{
      store_id: string;
      user_id: string;
      role: StoreRole;
      created_at: string;
    }>
  >([]);

  const [requests, setRequests] = useState<
    Array<{
      id: string;
      user_id: string;
      message: string | null;
      via: string;
      created_at: string;
    }>
  >([]);

  useEffect(() => {
    if (!storeId) return;
    loadMembers({ storeId })
      .then((rows) => setMembers(rows))
      .catch(() => {});
  }, [loadMembers, storeId]);

  useEffect(() => {
    if (!canAdmin || !storeId) return;
    loadPendingRequestsForStore({ storeId })
      .then((rows) => setRequests(rows))
      .catch(() => {});
  }, [canAdmin, loadPendingRequestsForStore, storeId]);

  if (!storeId || !store) {
    return (
      <div className="min-h-full px-4 py-6">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-xl font-semibold">지점</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            선택된 지점이 없습니다.
          </p>
          <div className="mt-4">
            <Link className="text-sm underline" to="/store">
              매장으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">지점</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            지점 정보는 모두 볼 수 있고, 수정은 owner만 가능합니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>현재 지점</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">지점: </span>
              <span className="font-medium">{store.name}</span>
              <span className="ml-2 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                {role}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                selectStore(null);
                navigate("/store");
              }}
            >
              매장 선택
            </Button>
          </CardContent>
        </Card>

        <StoreInfoPanel
          key={store.id}
          storeId={store.id}
          name={store.name}
          address={store.address}
          businessNumber={store.business_number}
          phone={store.phone}
          isPublic={store.is_public}
          inviteCode={store.invite_code}
          canEditStore={canEditStore}
          updateStore={updateStore}
          rotateInviteCode={rotateInviteCode}
          onReload={async () => {
            if (!user) return;
            await load({ userId: user.id });
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>직원</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between rounded-md border bg-background p-3"
              >
                <div>
                  <div className="text-sm font-medium">{m.user_id}</div>
                  <div className="text-xs text-muted-foreground">
                    role: {m.role}
                  </div>
                </div>
              </div>
            ))}
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">멤버가 없습니다.</p>
            ) : null}

            {canEditStore ? (
              <div className="pt-2">
                <Button onClick={() => navigate("/settings/store/staff")}>
                  직원 관리로 이동
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {canAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>입장 요청</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  대기중인 요청이 없습니다.
                </p>
              ) : null}
              {requests.map((r) => (
                <div key={r.id} className="rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      요청자: {r.user_id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    via: {r.via}
                  </div>
                  {r.message ? (
                    <div className="mt-2 text-sm">{r.message}</div>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={async () => {
                        await approveJoinRequest({
                          requestId: r.id,
                          role: "staff",
                        });
                        const rows = await loadPendingRequestsForStore({
                          storeId: store.id,
                        });
                        setRequests(rows);
                      }}
                    >
                      승인
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await rejectJoinRequest({ requestId: r.id });
                        const rows = await loadPendingRequestsForStore({
                          storeId: store.id,
                        });
                        setRequests(rows);
                      }}
                    >
                      거절
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {canEditStore ? (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle>지점 삭제</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                지점은 완전 삭제되지 않고 soft delete 처리되어 이력은 남습니다.
              </p>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!user) return;
                  const ok = window.confirm(
                    "정말 지점을 삭제할까요?\n(이 작업은 되돌리기 어렵습니다)",
                  );
                  if (!ok) return;
                  await softDeleteStore({ storeId: store.id });
                  selectStore(null);
                  await load({ userId: user.id });
                  navigate("/store", { replace: true });
                }}
              >
                지점 삭제
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function StoreInfoPanel(props: {
  storeId: string;
  name: string;
  address: string | null;
  businessNumber: string | null;
  phone: string | null;
  isPublic: boolean;
  inviteCode: string;
  canEditStore: boolean;
  updateStore: (opts: {
    storeId: string;
    name: string;
    address?: string;
    businessNumber?: string;
    phone?: string;
    isPublic: boolean;
  }) => Promise<void>;
  rotateInviteCode: (opts: { storeId: string }) => Promise<string | null>;
  onReload: () => Promise<void>;
}) {
  const [name, setName] = useState(props.name);
  const [address, setAddress] = useState(props.address ?? "");
  const [businessNumber, setBusinessNumber] = useState(
    props.businessNumber ?? "",
  );
  const [phone, setPhone] = useState(props.phone ?? "");
  const [isPublic, setIsPublic] = useState(props.isPublic);
  const [inviteCode, setInviteCode] = useState(props.inviteCode);

  const inviteLink = useMemo(() => {
    const code = inviteCode.trim();
    if (!code) return null;
    return `${window.location.origin}/invite/${code}`;
  }, [inviteCode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>지점 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-1">
          <div className="text-sm font-medium">지점 이름</div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!props.canEditStore}
          />
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">주소</div>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!props.canEditStore}
            placeholder={
              props.canEditStore ? "예) 서울시 강남구 ..." : undefined
            }
          />
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">사업자번호</div>
          <Input
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value)}
            disabled={!props.canEditStore}
            placeholder={props.canEditStore ? "예) 123-45-67890" : undefined}
          />
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">전화번호</div>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!props.canEditStore}
            placeholder={props.canEditStore ? "예) 02-1234-5678" : undefined}
          />
        </div>

        <label className="flex items-center justify-between gap-4 text-sm">
          <span>검색 허용(공개)</span>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={!props.canEditStore}
          />
        </label>

        <div className="space-y-2">
          <div className="text-sm font-medium">초대 링크</div>
          {props.canEditStore ? (
            <>
              {inviteLink ? (
                <div className="rounded-md border bg-background p-3 text-sm">
                  {inviteLink}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!inviteLink) return;
                    try {
                      await navigator.clipboard.writeText(inviteLink);
                      alert("초대 링크를 복사했습니다.");
                    } catch {
                      window.prompt("아래 링크를 복사해 주세요.", inviteLink);
                    }
                  }}
                >
                  링크 복사
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const next = await props.rotateInviteCode({
                      storeId: props.storeId,
                    });
                    if (next) setInviteCode(next);
                  }}
                >
                  재발급
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              초대 링크는 owner만 확인할 수 있습니다.
            </p>
          )}
        </div>

        {props.canEditStore ? (
          <Button
            onClick={async () => {
              await props.updateStore({
                storeId: props.storeId,
                name,
                address,
                businessNumber,
                phone,
                isPublic,
              });
              await props.onReload();
            }}
          >
            저장
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
