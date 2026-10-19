import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { findModuleForPath } from "@/lib/staff-modules";
import { ADMIN_NAV } from "@/components/admin/AdminSidebar";

export function AdminGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isAdmin, isLoading } = useIsAdmin();
  const { isStaff, can, isLoading: permsLoading } = useStaffPermissions();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const allLoading = loading || isLoading || permsLoading;
  const hasAnyAdminAccess = isAdmin || isStaff;

  useEffect(() => {
    if (allLoading) return;
    if (!user || !hasAnyAdminAccess) {
      void navigate({ to: "/admin/login", replace: true });
      return;
    }

    if (!isAdmin) {
      const isBase = pathname === "/admin" || pathname === "/admin/";
      const isTasks = pathname.startsWith("/admin/tasks");
      const isChangePassword = pathname.startsWith("/admin/change-password");

      if (!isBase && !isTasks && !isChangePassword) {
        const mod = findModuleForPath(pathname);
        if (!mod || !can(mod.key, "view")) {
          const firstPermitted = ADMIN_NAV.find((item) => {
            if (item.to === "/admin/tasks" || item.to === "/admin/change-password") return false;
            if (!item.moduleKey) return false;
            return can(item.moduleKey, "view");
          });
          void navigate({ to: firstPermitted?.to ?? "/admin/tasks", replace: true });
        }
      }
    }
  }, [allLoading, user, hasAnyAdminAccess, isAdmin, pathname, can, navigate]);

  if (allLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading admin…</div>
      </div>
    );
  }
  if (!user || !hasAnyAdminAccess) return null;

  if (!isAdmin) {
    const isBase = pathname === "/admin" || pathname === "/admin/";
    const isTasks = pathname.startsWith("/admin/tasks");
    const isChangePassword = pathname.startsWith("/admin/change-password");

    if (!isBase && !isTasks && !isChangePassword) {
      const mod = findModuleForPath(pathname);
      if (!mod || !can(mod.key, "view")) {
        return null;
      }
    }
  }

  return <>{children}</>;
}

