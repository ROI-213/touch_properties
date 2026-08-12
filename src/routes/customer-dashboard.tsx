import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  UserCog,
  LogOut,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";

export const Route = createFileRoute("/customer-dashboard")({
  component: DashboardLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
};
const NAV: NavItem[] = [
  { to: "/customer-dashboard/profile", label: "Profile", icon: UserCog },
];



import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";

function DashboardLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { isStaff, isLoading: staffLoading } = useStaffPermissions();
  const { openModal } = useAuthModal();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !adminLoading && !staffLoading) {
      if (!user) {
        openModal("login");
        void navigate({ to: "/" });
      } else if (isAdmin || isStaff) {
        void navigate({ to: isAdmin ? "/admin/properties" : "/admin/tasks" });
      }
    }
  }, [loading, adminLoading, staffLoading, user, isAdmin, isStaff, openModal, navigate]);

  if (loading || adminLoading || staffLoading || !user || isAdmin || isStaff) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navbar />
        <div className="pt-32 text-center text-charcoal/60">Loading…</div>
      </div>
    );
  }

  const name = profile?.full_name || user.email?.split("@")[0] || "Customer";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <div className="pt-28" />
      <div className="mx-auto grid w-full grid-cols-1 gap-6 px-4 pb-12 lg:grid-cols-[260px_1fr] lg:px-6">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-hidden rounded-2xl bg-white shadow-card"
          >
            <div
              className="px-5 py-5 text-white"
              style={{ background: "linear-gradient(135deg,#172B58,#21396F)" }}
            >
              <div className="flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#C8A34D] to-[#E4C06F] text-lg font-bold text-white">
                    {initial}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate font-display text-[15px] font-bold">{name}</div>
                  <div className="truncate text-[11px] text-white/70">{user.email}</div>
                </div>
              </div>
            </div>
            <nav className="p-2">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.to
                  : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition ${
                      active
                        ? "bg-gradient-to-r from-[#C8A34D]/15 to-transparent text-[#172B58]"
                        : "text-charcoal/75 hover:bg-sand hover:text-charcoal"
                    }`}
                  >
                    <item.icon size={16} className={active ? "text-[#C8A34D]" : ""} />
                    {item.label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C8A34D]" />}
                  </Link>
                );
              })}
              <div className="my-2 h-px bg-black/[0.06]" />
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </nav>
          </motion.div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
