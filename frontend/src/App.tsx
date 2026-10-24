import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { EmailDetailPage } from "@/pages/EmailDetailPage";
import { LoginPage } from "@/pages/LoginPage";
import { MailboxPage } from "@/pages/MailboxPage";

// The rich text editor is the heaviest dependency; only load it when composing.
const ComposePage = lazy(() => import("@/pages/ComposePage").then((m) => ({ default: m.ComposePage })));

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/scheduled" element={<MailboxPage key="scheduled" kind="scheduled" />} />
          <Route path="/sent" element={<MailboxPage key="sent" kind="sent" />} />
        </Route>
        <Route
          path="/compose"
          element={
            <Suspense fallback={<FullPageSpinner />}>
              <ComposePage />
            </Suspense>
          }
        />
        <Route path="/emails/:id" element={<EmailDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/scheduled" replace />} />
    </Routes>
  );
}
