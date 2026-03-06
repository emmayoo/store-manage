"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { minuteToTime } from "@/lib/utils";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatHeaderDate(d: Date) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`;
}

type ScheduleItem = {
  id: number;
  date: string;
  startMinute: number;
  endMinute: number;
  user: { id: number; name: string };
  branch: { name: string };
};

/**
 * 캘린더: Day View, 좌우 스와이프 (기획서 7)
 * GET /api/schedules?start=&end= range 조회
 */
export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    try {
      const res = await fetch(`/api/schedules?start=${s}&end=${e}`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const start = new Date(viewDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    fetchSchedules(start, end);
  }, [viewDate, fetchSchedules]);

  const prevDay = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() - 1);
    setViewDate(d);
  };

  const nextDay = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + 1);
    setViewDate(d);
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const daySchedules = schedules.filter(
    (s) => s.date.slice(0, 10) === viewDate.toISOString().slice(0, 10)
  );

  return (
    <div className="flex min-h-[80vh] flex-col p-4">
      {/* 헤더: < 3월 5일 (목) > [Today] [Filter] [+] */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={prevDay} aria-label="이전 날">
          <ChevronLeft className="size-5" />
        </Button>
        <span className="min-w-[180px] text-center font-medium">
          {formatHeaderDate(viewDate)}
        </span>
        <Button variant="ghost" size="icon" onClick={nextDay} aria-label="다음 날">
          <ChevronRight className="size-5" />
        </Button>
      </div>
      <div className="mb-2 flex gap-2">
        <Button
          variant={isToday(viewDate) ? "secondary" : "outline"}
          size="sm"
          onClick={() => setViewDate(new Date())}
        >
          Today
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="mr-1 size-4" />
          Filter
        </Button>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          일정
        </Button>
      </div>

      {/* Day View: 해당 날짜 스케줄 목록 */}
      <div className="flex-1">
        {loading ? (
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        ) : daySchedules.length === 0 ? (
          <p className="text-muted-foreground text-sm">이 날짜에 일정이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {daySchedules
              .sort((a, b) => a.startMinute - b.startMinute)
              .map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm"
                >
                  <div className="font-medium">{s.user.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {minuteToTime(s.startMinute)} ~ {minuteToTime(s.endMinute)}
                  </div>
                  <div className="text-muted-foreground text-xs">{s.branch.name}</div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
