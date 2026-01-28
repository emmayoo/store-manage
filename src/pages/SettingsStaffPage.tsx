import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useCurrentStore } from '@/features/store/useCurrentStore'
import { useStoreStore } from '@/stores/store.store'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import type { StoreRole } from '@/types/database'

export function SettingsStaffPage() {
  const { storeId, store, canEditStore } = useCurrentStore()

  const rotateInviteCode = useStoreStore((s) => s.rotateInviteCode)
  const loadMembers = useStoreStore((s) => s.loadMembers)
  const setMemberRole = useStoreStore((s) => s.setMemberRole)
  const removeMember = useStoreStore((s) => s.removeMember)

  const [members, setMembers] = useState<
    Array<{
      store_id: string
      user_id: string
      role: StoreRole
      created_at: string
    }>
  >([])

  useEffect(() => {
    if (!storeId || !canEditStore) return
    loadMembers({ storeId })
      .then((rows) => setMembers(rows))
      .catch(() => {})
  }, [canEditStore, loadMembers, storeId])

  async function refreshMembers() {
    if (!storeId) return
    const rows = await loadMembers({ storeId })
    setMembers(rows)
  }

  if (!canEditStore) {
    return (
      <div className="min-h-full px-4 py-6">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-xl font-semibold">직원 관리</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            owner만 접근할 수 있습니다.
          </p>
          <div className="mt-4">
            <Link className="text-sm underline" to="/settings/store">
              지점 설정으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">직원 관리</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            초대 링크로 입장 요청을 받고, 승인 후 멤버가 됩니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>초대 링크</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {store ? (
              <InviteLinkPanel
                storeId={storeId!}
                inviteCode={store.invite_code}
                rotateInviteCode={rotateInviteCode}
              />
            ) : null}
            <p className="text-xs text-muted-foreground">
              입장 요청 승인/거절은 설정 메인에서 처리합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>멤버</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((m) => {
              const isOwner = m.role === 'owner'
              return (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between rounded-md border bg-background p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{m.user_id}</div>
                    <div className="text-xs text-muted-foreground">role: {m.role}</div>
                  </div>
                  <div className="flex gap-2">
                    {!isOwner ? (
                      <select
                        className="rounded-md border bg-background px-2 py-2 text-sm"
                        value={m.role}
                        onChange={async (e) => {
                          if (!storeId) return
                          const nextRole = e.target.value as StoreRole
                          await setMemberRole({ storeId, userId: m.user_id, role: nextRole })
                          await refreshMembers()
                        }}
                      >
                        <option value="staff">staff</option>
                        <option value="manager">manager</option>
                      </select>
                    ) : (
                      <span className="rounded-md border px-2 py-2 text-sm text-muted-foreground">
                        owner
                      </span>
                    )}

                    {!isOwner ? (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!storeId) return
                          const ok = window.confirm('이 직원을 지점에서 제거할까요?')
                          if (!ok) return
                          await removeMember({ storeId, userId: m.user_id })
                          await refreshMembers()
                        }}
                      >
                        제거
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">멤버가 없습니다.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InviteLinkPanel(props: {
  storeId: string
  inviteCode: string
  rotateInviteCode: (opts: { storeId: string }) => Promise<string | null>
}) {
  const [inviteCode, setInviteCode] = useState(props.inviteCode)

  const inviteLink = useMemo(() => {
    const code = inviteCode.trim()
    if (!code) return null
    return `${window.location.origin}/invite/${code}`
  }, [inviteCode])

  return (
    <>
      {inviteLink ? (
        <div className="rounded-md border bg-background p-3 text-sm">
          {inviteLink}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">초대코드가 없습니다.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={!inviteLink}
          onClick={async () => {
            if (!inviteLink) return
            try {
              await navigator.clipboard.writeText(inviteLink)
              alert('초대 링크를 복사했습니다.')
            } catch {
              window.prompt('아래 링크를 복사해 주세요.', inviteLink)
            }
          }}
        >
          링크 복사
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const next = await props.rotateInviteCode({ storeId: props.storeId })
            if (next) setInviteCode(next)
          }}
        >
          링크 재발급
        </Button>
      </div>
    </>
  )
}

