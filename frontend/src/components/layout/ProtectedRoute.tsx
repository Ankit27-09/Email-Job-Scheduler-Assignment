import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useCurrentUser } from "@/hooks/useAuth";

export function ProtectedRoute() {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
