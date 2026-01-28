import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

import { dayjs } from '@/lib/day'
import { useAuthStore } from '@/stores/auth.store'
import { useCalendarStore, type ShiftRecord } from '@/stores/calendar.store'
import { useCurrentStore } from '@/features/store/useCurrentStore'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'

type ViewMode = 'month' | 'week' | 'day' | 'range'

function parseDate(value: string | null) {
  if (!value) return dayjs()
  const d = dayjs(value)
  return d.isValid() ? d : dayjs()
}

function toYmd(d: dayjs.Dayjs) {
  return d.format('YYYY-MM-DD')
}

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(':').map((v) => Number(v))
  return hh * 60 + (Number.isFinite(mm) ? mm : 0)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function groupOverlaps(items: Array<{ id: string; startMin: number; endMin: number }>) {
  // 단순하지만 실용적인 overlap lane 할당
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
  const lanes: Array<Array<typeof sorted[number]>> = []
  const placed: Array<{ id: string; lane: number; lanesCount: number }> = []

  type Active = { item: typeof sorted[number]; lane: number }
  let active: Active[] = []

  function finalizeGroup(group: Active[]) {
    const lanesCount = lanes.length
    for (const a of group) placed.push({ id: a.item.id, lane: a.lane, lanesCount })
  }

  // 그룹 단위로 처리(활성 겹침이 끊길 때마다)
  lanes.length = 0
  active = []
  let groupActive: Active[] = []

  for (const item of sorted) {
    active = active.filter((a) => a.item.endMin > item.startMin)
    if (active.length === 0 && groupActive.length > 0) {
      finalizeGroup(groupActive)
      groupActive = []
      lanes.length = 0
    }

    // 가장 먼저 비는 lane에 배치
    const used = new Set(active.map((a) => a.lane))
    let lane = 0
    while (used.has(lane)) lane += 1

    if (!lanes[lane]) lanes[lane] = []
    lanes[lane].push(item)

    const entry = { item, lane }
    active.push(entry)
    groupActive.push(entry)
  }

  if (groupActive.length > 0) finalizeGroup(groupActive)
  return new Map(placed.map((p) => [p.id, p]))
}

function getAssignee(r: ShiftRecord) {
  const payload = r.payload
  if (payload && typeof payload === 'object' && 'assignee' in payload) {
    const v = (payload as { assignee?: unknown }).assignee
    return typeof v === 'string' ? v : r.title ?? '근무'
  }
  return r.title ?? '근무'
}

export function CalendarPage() {
  const user = useAuthStore((s) => s.user)
  const { storeId, canEditSchedule } = useCurrentStore()
  const [params, setParams] = useSearchParams()

  const view = (params.get('view') as ViewMode | null) ?? 'month'
  const date = useMemo(() => parseDate(params.get('date')), [params])

  const shifts = useCalendarStore((s) => s.shifts)
  const loading = useCalendarStore((s) => s.loading)
  const error = useCalendarStore((s) => s.error)
  const loadShifts = useCalendarStore((s) => s.loadShifts)
  const addShift = useCalendarStore((s) => s.addShift)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [assignee, setAssignee] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('15:00')
  const [memo, setMemo] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // storeId/canEditSchedule은 공통 훅으로 관리

  const range = useMemo(() => {
    if (view === 'month') {
      const start = date.startOf('month').startOf('week')
      const end = date.endOf('month').endOf('week').add(1, 'day').startOf('day')
      return { start, end }
    }
    if (view === 'week' || view === 'range') {
      const start = date.startOf('week').startOf('day')
      const end = start.add(7, 'day')
      return { start, end }
    }
    // day
    const start = date.startOf('day')
    const end = start.add(1, 'day')
    return { start, end }
  }, [date, view])

  useEffect(() => {
    if (!user || !storeId) return
    loadShifts({
      storeId,
      startIso: range.start.toISOString(),
      endIso: range.end.toISOString(),
    }).catch(() => {})
  }, [loadShifts, range.end, range.start, storeId, user])

  function setView(next: ViewMode) {
    const nextParams = new URLSearchParams(params)
    nextParams.set('view', next)
    nextParams.set('date', toYmd(date))
    setParams(nextParams, { replace: true })
  }

  function move(delta: number) {
    const next =
      view === 'month' ? date.add(delta, 'month') : view === 'day' ? date.add(delta, 'day') : date.add(delta, 'week')
    const nextParams = new URLSearchParams(params)
    nextParams.set('date', toYmd(next))
    setParams(nextParams, { replace: true })
  }

  const headerLabel = useMemo(() => {
    if (view === 'month') return date.format('YYYY년 M월')
    if (view === 'day') return date.format('YYYY년 M월 D일 (ddd)')
    const start = date.startOf('week')
    const end = start.add(6, 'day')
    return `${start.format('M/D')} ~ ${end.format('M/D')}`
  }, [date, view])

  const monthDays = useMemo(() => {
    const start = date.startOf('month').startOf('week')
    const end = date.endOf('month').endOf('week')
    const days: dayjs.Dayjs[] = []
    let d = start
    while (d.isBefore(end) || d.isSame(end, 'day')) {
      days.push(d)
      d = d.add(1, 'day')
    }
    return days
  }, [date])

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, ShiftRecord[]>()
    for (const s of shifts) {
      if (!s.starts_at) continue
      const key = dayjs(s.starts_at).format('YYYY-MM-DD')
      const list = map.get(key) ?? []
      list.push(s)
      map.set(key, list)
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (a.starts_at ?? '').localeCompare(b.starts_at ?? ''))
      map.set(k, list)
    }
    return map
  }, [shifts])

  const dayShifts = useMemo(() => {
    const key = date.format('YYYY-MM-DD')
    return shiftsByDay.get(key) ?? []
  }, [date, shiftsByDay])

  const timelineLayout = useMemo(() => {
    const items = dayShifts
      .filter((s) => s.starts_at && s.ends_at)
      .map((s) => {
        const startMin = dayjs(s.starts_at!).diff(dayjs(s.starts_at!).startOf('day'), 'minute')
        const endMin = dayjs(s.ends_at!).diff(dayjs(s.ends_at!).startOf('day'), 'minute')
        return { id: s.id, startMin, endMin: Math.max(endMin, startMin + 15) }
      })
    return groupOverlaps(items)
  }, [dayShifts])

  async function submitShift() {
    if (!user) return
    if (!storeId) return
    if (!canEditSchedule) {
      setFormError('manager/owner만 스케줄을 등록할 수 있습니다.')
      return
    }
    setFormError(null)

    const startMin = timeToMinutes(startTime)
    const endMin = timeToMinutes(endTime)
    if (endMin <= startMin) {
      setFormError('종료 시간이 시작 시간보다 늦어야 합니다.')
      return
    }

    const startsAt = date.startOf('day').add(startMin, 'minute')
    const endsAt = date.startOf('day').add(endMin, 'minute')

    await addShift({
      userId: user.id,
      storeId,
      assignee,
      startsAtIso: startsAt.toISOString(),
      endsAtIso: endsAt.toISOString(),
      memo,
    })

    setIsModalOpen(false)
    setAssignee('')
    setMemo('')
  }

  return (
    <div className="min-h-full px-4 py-4">
      <div className="mx-auto w-full max-w-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => move(-1)} aria-label="이전">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-[160px] text-center text-base font-semibold">{headerLabel}</div>
            <Button variant="ghost" size="icon" onClick={() => move(1)} aria-label="다음">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const nextParams = new URLSearchParams(params)
              nextParams.set('date', toYmd(dayjs()))
              setParams(nextParams, { replace: true })
            }}
          >
            오늘
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex rounded-md border bg-background p-1">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm',
                  view === v ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
                )}
              >
                {v === 'day' ? '일' : v === 'week' ? '주' : '월'}
              </button>
            ))}
          </div>

          <Button
            variant={view === 'range' ? 'default' : 'outline'}
            onClick={() => setView(view === 'range' ? 'week' : 'range')}
          >
            기간
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {view === 'month' ? (
          <div className="rounded-lg border bg-card">
            <div className="grid grid-cols-7 border-b text-center text-xs text-muted-foreground">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => (
                <div key={d} className={cn('py-2', idx === 0 && 'text-destructive')}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((d) => {
                const key = d.format('YYYY-MM-DD')
                const inMonth = d.month() === date.month()
                const isToday = d.isSame(dayjs(), 'day')
                const count = (shiftsByDay.get(key) ?? []).length
                return (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      'h-16 border-b border-r p-2 text-left text-sm',
                      !inMonth && 'text-muted-foreground',
                    )}
                    onClick={() => {
                      const nextParams = new URLSearchParams(params)
                      nextParams.set('date', key)
                      nextParams.set('view', 'day')
                      setParams(nextParams)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex h-6 min-w-6 items-center justify-center rounded-md px-2',
                          isToday && 'bg-secondary font-semibold',
                        )}
                      >
                        {d.date()}
                      </span>
                      {count > 0 ? (
                        <span className="text-xs text-muted-foreground">{count}</span>
                      ) : null}
                    </div>
                    {count > 0 ? (
                      <div className="mt-2 flex gap-1">
                        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                        ))}
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {view === 'week' || view === 'range' ? (
          <div className="rounded-lg border bg-card">
            <div className="flex overflow-x-auto">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = date.startOf('week').add(i, 'day')
                const key = d.format('YYYY-MM-DD')
                const list = shiftsByDay.get(key) ?? []
                return (
                  <div key={key} className="min-w-[220px] border-r p-3">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        const nextParams = new URLSearchParams(params)
                        nextParams.set('date', key)
                        nextParams.set('view', 'day')
                        setParams(nextParams)
                      }}
                    >
                      <div className="text-sm font-semibold">{d.format('M/D (ddd)')}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {list.length ? `${list.length}개 스케줄` : '스케줄 없음'}
                      </div>
                    </button>
                    <div className="mt-3 space-y-2">
                      {list.map((s) => (
                        <div key={s.id} className="rounded-md border bg-background p-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{getAssignee(s)}</div>
                            <div className="text-xs text-muted-foreground">
                              {s.starts_at ? dayjs(s.starts_at).format('HH:mm') : '--:--'}~
                              {s.ends_at ? dayjs(s.ends_at).format('HH:mm') : '--:--'}
                            </div>
                          </div>
                          {s.content ? (
                            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {s.content}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {view === 'day' ? (
          <div className="rounded-lg border bg-card">
            <div className="border-b p-3">
              <div className="text-sm font-semibold">0시 ~ 24시</div>
              <div className="text-xs text-muted-foreground">
                간트처럼 시간대에 근무가 표시됩니다. (겹치면 가로로 나뉩니다)
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-[52px_1fr]">
                <div className="border-r">
                  {Array.from({ length: 25 }).map((_, h) => (
                    <div key={h} className="h-16 border-b px-2 py-1 text-right text-xs text-muted-foreground">
                      {h.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
                <div className="relative">
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="h-16 border-b" />
                  ))}

                  {/* blocks */}
                  <div className="absolute inset-0">
                    {dayShifts
                      .filter((s) => s.starts_at && s.ends_at)
                      .map((s) => {
                        const startMin = dayjs(s.starts_at!).diff(dayjs(s.starts_at!).startOf('day'), 'minute')
                        const endMin = dayjs(s.ends_at!).diff(dayjs(s.ends_at!).startOf('day'), 'minute')
                        const safeEnd = Math.max(endMin, startMin + 15)

                        const top = (clamp(startMin, 0, 24 * 60) / (24 * 60)) * (24 * 64)
                        const height = ((clamp(safeEnd, 0, 24 * 60) - clamp(startMin, 0, 24 * 60)) / (24 * 60)) * (24 * 64)

                        const layout = timelineLayout.get(s.id)
                        const lane = layout?.lane ?? 0
                        const lanesCount = layout?.lanesCount ?? 1
                        const widthPct = 100 / lanesCount
                        const leftPct = lane * widthPct

                        return (
                          <div
                            key={s.id}
                            className="absolute rounded-md border bg-primary/10 p-2 text-xs"
                            style={{
                              top,
                              height: Math.max(height, 24),
                              left: `calc(${leftPct}% + 6px)`,
                              width: `calc(${widthPct}% - 12px)`,
                            }}
                          >
                            <div className="font-semibold">{getAssignee(s)}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {dayjs(s.starts_at!).format('HH:mm')}~{dayjs(s.ends_at!).format('HH:mm')}
                            </div>
                            {s.content ? (
                              <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                                {s.content}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="p-3 text-xs text-muted-foreground">불러오는 중…</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Floating action button */}
      {canEditSchedule ? (
        <button
          type="button"
          className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          onClick={() => {
            setFormError(null)
            setIsModalOpen(true)
          }}
          aria-label="스케줄 추가"
        >
          <Plus className="h-6 w-6" />
        </button>
      ) : null}

      {/* Modal (간단한 MVP용) */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-2xl rounded-t-2xl border bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">스케줄 등록</div>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                닫기
              </Button>
            </div>

            <div className="mt-3 grid gap-3">
              {formError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}

              <div className="grid gap-1">
                <div className="text-sm font-medium">담당자</div>
                <Input
                  value={assignee}
                  placeholder="예) 유현선"
                  onChange={(e) => setAssignee(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <div className="text-sm font-medium">시작</div>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <div className="text-sm font-medium">종료</div>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-1">
                <div className="text-sm font-medium">메모 (선택)</div>
                <Input
                  value={memo}
                  placeholder="예) 발주 책임"
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>

              <Button
                onClick={async () => {
                  try {
                    await submitShift()
                  } catch (e) {
                    setFormError(e instanceof Error ? e.message : '저장에 실패했습니다.')
                  }
                }}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

