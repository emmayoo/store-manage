import { StoresPage } from "@/pages/StoresPage";
import { SettingsStorePage } from "@/pages/SettingsStorePage";
import { useCurrentStore } from "@/features/store/useCurrentStore";

export function StorePage() {
  const { storeId } = useCurrentStore();

  // 지점이 선택되지 않았으면 넷플릭스형 지점 선택을 그대로 사용
  if (!storeId) return <StoresPage />;

  // 선택된 지점이 있으면 지점 정보/멤버/승인 화면을 보여줌
  return <SettingsStorePage />;
}
