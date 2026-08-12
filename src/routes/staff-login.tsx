import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserCheck, Mail, Lock, Eye, EyeOff, Building2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { loginUserFn } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/staff-login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Staff Login — Touchstone Properties" }] }),
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const navigate = useNavigate();
  const { user, signOut, setSessionData } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleStaffLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Authenticate with backend
      const result = await loginUserFn({ data: { email: trimmedEmail, password: trimmedPassword } });

      if ("error" in result) throw new Error(result.error);
      if (!result.user || !result.token) throw new Error("Sign-in failed. Please check credentials.");

      const uid = result.user.id;
      setSessionData(result.token, result.user as any);

      // 2. Check if user is staff or admin
      const [{ data: adminFlag }, { data: staffRow }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
        supabase.from("staff_users").select("id, status").eq("auth_user_id", uid).maybeSingle(),
      ]);

      const isAdminAcct = adminFlag === true;
      const isStaffAcct = !!staffRow && staffRow.status === "active";

      if (!isAdminAcct && !isStaffAcct) {
        await supabase.auth.signOut();
        throw new Error("This account does not have Staff or Admin access permissions.");
      }

      toast.success(isStaffAcct ? "Logged in to Staff Portal!" : "Logged in as Administrator!");

      // 3. Navigate to Staff Tasks or Admin Panel
      await navigate({ to: isStaffAcct ? "/admin/tasks" : "/admin/properties", replace: true });
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err.message || "Invalid staff email or password.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOutCurrent() {
    await signOut();
    setEmail("");
    setPassword("");
    toast.success("Signed out. Enter your staff credentials below.");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a1f44] text-[#c9a961] shadow-lg mb-3">
          <UserCheck size={32} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-[#0a1f44] font-display">
          Staff Portal Sign In
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Touchstone Properties • Employee & Staff Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {user && (
            <div className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs">
              <div className="font-semibold text-amber-900 mb-1">Active Session Detected</div>
              <div className="text-amber-800 mb-3">
                You are currently logged in as <strong className="font-mono">{user.email}</strong>.
              </div>
              <button
                type="button"
                onClick={handleSignOutCurrent}
                className="w-full rounded-lg bg-amber-100 py-1.5 font-bold text-amber-900 hover:bg-amber-200 transition"
              >
                Sign Out to Switch Staff Account
              </button>
            </div>
          )}

          <form onSubmit={handleStaffLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Staff Email Address
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c9a961] focus:border-[#c9a961] text-sm text-slate-900"
                  placeholder="staff@touchstone.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c9a961] focus:border-[#c9a961] text-sm text-slate-900"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-700 font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#c9a961] hover:bg-[#b89651] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c9a961] transition disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In to Staff Portal"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 flex items-center justify-between text-xs">
            <Link to="/" className="text-slate-500 hover:text-slate-800 font-medium">
              ← Back to Main Site
            </Link>
            <Link to="/admin/login" className="text-[#0a1f44] hover:underline font-bold">
              Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
