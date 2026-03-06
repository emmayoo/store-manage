"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Me = {
  id: number;
  name: string;
  username: string;
  phone: string;
};

export function MyInfoForm() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setMe(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
      })
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "수정에 실패했습니다." });
        setSaving(false);
        return;
      }

      setMe(data);
      setMessage({ type: "ok", text: "저장되었습니다." });
    } catch {
      setMessage({ type: "error", text: "수정에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          로딩 중...
        </CardContent>
      </Card>
    );
  }

  if (!me) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          내 정보를 불러올 수 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">내 정보 수정</CardTitle>
        <p className="text-muted-foreground text-sm">
          아이디(로그인용): <span className="font-medium text-foreground">{me.username}</span>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="text-muted-foreground mb-1 block text-sm font-medium"
            >
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-input focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
              required
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="text-muted-foreground mb-1 block text-sm font-medium"
            >
              핸드폰 번호
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-input focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
              placeholder="010-0000-0000"
            />
          </div>
          {message && (
            <p
              className={
                message.type === "ok"
                  ? "text-green-600 dark:text-green-400 text-sm"
                  : "text-destructive text-sm"
              }
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
