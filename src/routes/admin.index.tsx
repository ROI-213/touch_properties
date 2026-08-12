import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { ADMIN_NAV } from "@/components/admin/AdminSidebar";

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
});

function AdminIndexPage() {
  const navigate = useNavigate();
  const { isAdmin, isStaff, can, isLoading } = useStaffPermissions();

  useEffect(() => {
    if (isLoading) return;
    if (isAdmin) {
      void navigate({ to: "/admin/properties", replace: true });
      return;
    }
    if (isStaff) {
      const firstPermitted = ADMIN_NAV.find((item) => {
        if (item.to === "/admin/tasks" || item.to === "/admin/change-password") return true;
        if (!item.moduleKey) return false;
        return can(item.moduleKey, "view");
      });
      void navigate({ to: firstPermitted?.to ?? "/admin/tasks", replace: true });
      return;
    }
    void navigate({ to: "/admin/login", replace: true });
  }, [isAdmin, isStaff, isLoading, can, navigate]);

  return (
    <div className="grid min-h-[60vh] place-items-center bg-slate-50">
      <div className="text-sm font-medium text-slate-500">Redirecting to dashboard…</div>
    </div>
  );
}
