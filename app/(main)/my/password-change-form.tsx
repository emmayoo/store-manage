"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * 비밀번호 변경 전용 영역 (다른 서비스처럼 별도 카드)
 */
export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== newPasswordConfirm) {
      setMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      return;
    }

    if (newPassword.length < 1) {
      setMessage({ type: "error", text: "새 비밀번호를 입력해 주세요." });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "비밀번호 변경에 실패했습니다." });
        setSaving(false);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setMessage({ type: "ok", text: "비밀번호가 변경되었습니다." });
    } catch {
      setMessage({ type: "error", text: "비밀번호 변경에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">비밀번호 변경</CardTitle>
        <p className="text-muted-foreground text-sm">
          현재 비밀번호를 입력한 뒤 새 비밀번호를 설정해 주세요.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="text-muted-foreground mb-1 block text-sm font-medium"
            >
              현재 비밀번호
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="border-input focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="text-muted-foreground mb-1 block text-sm font-medium"
            >
              새 비밀번호
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border-input focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label
              htmlFor="newPasswordConfirm"
              className="text-muted-foreground mb-1 block text-sm font-medium"
            >
              새 비밀번호 확인
            </label>
            <input
              id="newPasswordConfirm"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              className="border-input focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
              placeholder="••••••••"
              autoComplete="new-password"
              required
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
            {saving ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
