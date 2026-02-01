import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { AuthProvider } from "@/app/providers/AuthProvider";
import { StoreProvider } from "@/app/providers/StoreProvider";
import { AppShell } from "@/app/layouts/AppShell";
import { useAuthStore } from "@/stores/auth.store";
import { LoginPage } from "@/pages/LoginPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StoresPage } from "@/pages/StoresPage";
import { InvitePage } from "@/pages/InvitePage";
import { SettingsStaffPage } from "@/pages/SettingsStaffPage";
import { SettingsMePage } from "@/pages/SettingsMePage";
import { SettingsStorePage } from "@/pages/SettingsStorePage";
import { SettingsAppPage } from "@/pages/SettingsAppPage";
import { HomePage } from "@/pages/HomePage";
import { StorePage } from "@/pages/StorePage";
import { AddPage } from "@/pages/AddPage";
import { StoreHomePage } from "@/pages/StoreHomePage";
import { StoreSchedulePage } from "@/pages/StoreSchedulePage";
import { StoreNoticesPage } from "@/pages/StoreNoticesPage";
import { StoreExpiryPage } from "@/pages/StoreExpiryPage";
import { StorePeoplePage } from "@/pages/StorePeoplePage";

function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") return null;
  if (status === "signed_out")
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:code" element={<InvitePage />} />

          <Route
            path="/stores"
            element={
              <RequireAuth>
                <StoresPage />
              </RequireAuth>
            }
          />

          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/add" element={<AddPage />} />
            <Route path="/store" element={<StorePage />}>
              <Route index element={<StoreHomePage />} />
              <Route path="schedule" element={<StoreSchedulePage />} />
              <Route path="notices" element={<StoreNoticesPage />} />
              <Route path="expiry" element={<StoreExpiryPage />} />
              <Route path="people" element={<StorePeoplePage />} />
            </Route>
            <Route path="/manage" element={<Navigate to="/store" replace />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/me" element={<SettingsMePage />} />
            <Route path="/settings/store" element={<SettingsStorePage />} />
            <Route
              path="/settings/store/staff"
              element={<SettingsStaffPage />}
            />
            <Route
              path="/settings/staff"
              element={<Navigate to="/settings/store/staff" replace />}
            />
            <Route path="/settings/app" element={<SettingsAppPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </StoreProvider>
    </AuthProvider>
  );
}
