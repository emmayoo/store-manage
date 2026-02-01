import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/button";

export function ManagePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        <div>
          <h1 className="text-xl font-semibold">관리</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            공지(전체/중요/발주/금지/기타)와 폐기 임박은 매장 탭에서 확인하세요.
          </p>
          <Button variant="outline" onClick={() => navigate("/store/notices")}>
            매장 공지 보기
          </Button>
          <Button
            variant="outline"
            className="ml-2"
            onClick={() => navigate("/store/expiry")}
          >
            폐기 임박 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
