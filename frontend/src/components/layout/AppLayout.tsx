import { Outlet } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  return (
    <div className="flex h-full gap-6 px-1 py-2">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1 pr-4">
        <Outlet />
      </main>
    </div>
  );
}
