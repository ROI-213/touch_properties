import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Touchstone Properties" }] }),
  component: AdminRoot,
});

function AdminRoot() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname === "/admin/login") {
    return <Outlet />;
  }

  return (
    <AdminGate>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminGate>
  );
}
