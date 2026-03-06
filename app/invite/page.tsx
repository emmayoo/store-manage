"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type InviteStatus =
  | "idle"
  | "loading"
  | "welcome"
  | "already"
  | "invalid"
  | "unauthorized"
  | "error";

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<InviteStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [branchName, setBranchName] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      setMessage("초대링크 확인하세요");
      return;
    }

    async function accept() {
      setStatus("loading");
      setMessage("초대 링크를 확인하고 있습니다...");
      try {
        const res = await fetch("/api/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));

        const s = (data.status as InviteStatus) ?? "error";
        setStatus(s);
        setBranchName(data.branch?.name ?? null);

        switch (s) {
          case "welcome":
            setMessage("환영해요");
            break;
          case "already":
            setMessage("이미 추가되었음");
            break;
          case "invalid":
            setMessage("초대링크 확인하세요");
            break;
          case "unauthorized":
            setMessage("로그인이 필요합니다.");
            break;
          default:
            setMessage(data.message ?? "초대 처리 중 오류가 발생했습니다.");
        }
      } catch {
        setStatus("error");
        setMessage("초대 처리 중 오류가 발생했습니다.");
      }
    }

    accept();
  }, [searchParams]);

  const canGoDashboard = status === "welcome" || status === "already";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">직원 초대</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm">
          {status === "loading" ? (
            <p className="text-muted-foreground">{message}</p>
          ) : (
            <>
              <p
                className={
                  status === "welcome" || status === "already"
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }
              >
                {message}
              </p>
              {branchName && (
                <p className="text-muted-foreground">
                  지점: <span className="font-medium text-foreground">{branchName}</span>
                </p>
              )}
              {status === "unauthorized" && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push("/login")}
                >
                  로그인하러 가기
                </Button>
              )}
              {canGoDashboard && (
                <Button
                  className="w-full"
                  onClick={() => router.push("/dashboard")}
                >
                  대시보드로 이동
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

