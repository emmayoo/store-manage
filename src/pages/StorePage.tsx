import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentStore } from "@/features/store/useCurrentStore";
import { StoresPage } from "@/pages/StoresPage";
import { StoreTabs } from "@/app/layouts/StoreLayout";

/**
 * Store 진입: 매장 미선택 시 리스트(매장 선택), 선택 시 Store 내부 탭 + Outlet
 * 매장 미선택인데 /store/schedule 등 하위 경로면 URL을 /store로 맞춤(혼동 방지)
 */
export function StorePage() {
  const { storeId } = useCurrentStore();
  const { pathname } = useLocation();

  if (!storeId) {
    if (pathname !== "/store") {
      return <Navigate to="/store" replace />;
    }
    return <StoresPage />;
  }

  return (
    <>
      <StoreTabs />
      <Outlet />
    </>
  );
}
