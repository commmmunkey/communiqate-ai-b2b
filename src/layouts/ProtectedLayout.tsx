import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/features/sidebar";
import { Outlet, Navigate } from "react-router";

interface ProtectedLayoutProps {
  isAuthenticated: boolean;
}

export default function ProtectedLayout({
  isAuthenticated,
}: ProtectedLayoutProps) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 bg-gray-50 dark:bg-slate-950">
          <div className="">
            {/* Trigger is the hamburger menu button for mobile/collapsing */}
            <SidebarTrigger className="mb-4 sm:hidden" />
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
