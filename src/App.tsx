import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { useAuth } from "./hooks/useAuth";
import { AddBookPage } from "./pages/AddBookPage";
import { HomePage } from "./pages/HomePage";
import { LandingPage } from "./pages/LandingPage";
import { SharingRequestsPage } from "./pages/SharingRequestsPage";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <div className="splash-screen">Loading Wormie...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

export function App() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <div className="splash-screen">Loading Wormie...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <ProtectedLayout><HomePage /></ProtectedLayout> : <LandingPage />} />
      <Route
        path="/add-book"
        element={
          <ProtectedLayout>
            <AddBookPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/sharing-requests"
        element={
          <ProtectedLayout>
            <SharingRequestsPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/" : "/"} replace />} />
    </Routes>
  );
}
