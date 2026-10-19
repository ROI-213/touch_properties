import { useEffect, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Touchstone Properties" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isAdmin, isLoading } = useIsAdmin();
  const { isStaff, isLoading: staffLoading } = useStaffPermissions();
  const { openModal, closeModal } = useAuthModal();

  const rolesLoading = isLoading || staffLoading;
  const hasAccess = isAdmin || isStaff;

  // If no user at all, open the login modal automatically
  useEffect(() => {
    if (!loading && !user) {
      openModal("login", { loginOnly: true });
    }
  }, [loading, user, openModal]);

  // Cleanup modal on unmount
  useEffect(() => {
    return () => closeModal();
  }, [closeModal]);

  // If user IS an admin/staff, redirect them into the admin panel
  useEffect(() => {
    if (!loading && user && !rolesLoading && hasAccess) {
      void navigate({ to: isAdmin ? "/admin/properties" : "/admin/tasks", replace: true });
    }
  }, [hasAccess, isAdmin, rolesLoading, loading, navigate, user]);

  // Handler: sign out the current (customer) session, then open login modal for admin credentials
  const handleSignInAsAdmin = useCallback(async () => {
    if (user) {
      await signOut();
    }
    openModal("login", { loginOnly: true });
  }, [user, signOut, openModal]);

  if (loading || (user && (rolesLoading || hasAccess))) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading admin…</div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#0a1f44]/5 text-[#0a1f44]">
          <Lock size={20} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-[#0a1f44]">
          Admin Sign In Required
        </h1>
        {user ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              You are currently signed in as{" "}
              <span className="font-medium text-slate-800">{user.email}</span>.
              <br />
              To access the admin panel, please sign in with an administrator account.
            </p>
            <button
              onClick={handleSignInAsAdmin}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#c9a961] px-6 text-sm font-medium text-white hover:bg-[#b89651]"
            >
              Sign In as Admin
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Please sign in with an administrator account to access the CMS.
            </p>
            <button
              onClick={() => openModal("login", { loginOnly: true })}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#c9a961] px-6 text-sm font-medium text-white hover:bg-[#b89651]"
            >
              Sign In
            </button>
          </>
        )}
        <div className="mt-4 text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-600">← Back to site</Link>
        </div>
      </div>
    </div>
  );
}