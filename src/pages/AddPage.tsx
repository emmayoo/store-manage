import { useNavigate } from "react-router-dom";
import { FileText, ListTodo, Calendar } from "lucide-react";

import { useCurrentStore } from "@/features/store/useCurrentStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

/**
 * 플로팅 액션 (+) 화면
 * 와이어프레임: 개인 TODO 추가 / (권한자) 공지 작성 / (권한자) 이벤트 추가
 */
export function AddPage() {
  const navigate = useNavigate();
  const { canEditSchedule } = useCurrentStore();

  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">추가</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            TODO, 공지, 이벤트를 빠르게 추가합니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="h-4 w-4" />
              개인 TODO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate("/home", { state: { focusTodo: true } })}
            >
              TODO 추가
            </Button>
          </CardContent>
        </Card>

        {canEditSchedule ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  공지 작성
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/store/notices")}
                >
                  공지 작성
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  이벤트 추가
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/calendar")}
                >
                  캘린더에서 추가
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
