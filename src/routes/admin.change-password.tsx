import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/change-password")({
  head: () => ({ meta: [{ title: "Change Password — Admin" }] }),
  component: ChangePasswordPage,
});

const STRONG_PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!current) return toast.error("Current password is required.");
    if (!next) return toast.error("New password is required.");
    if (!confirm) return toast.error("Confirm password is required.");
    if (next !== confirm) return toast.error("New password and confirm password do not match.");
    if (next.length < 8) return toast.error("New password must be at least 8 characters.");
    if (!STRONG_PW.test(next))
      return toast.error("New password must include uppercase, lowercase, number, and special character.");
    if (next === current) return toast.error("New password must be different from current password.");
    if (!user?.email) return toast.error("No signed-in admin.");

    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (verifyError) {
        toast.error("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) {
        toast.error(updateError.message || "Failed to update password.");
        return;
      }

      toast.success("Password changed successfully. Please login again.");
      await signOut();
      navigate({ to: "/admin/login", replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9a961]/10 text-[#c9a961]">
            <KeyRound size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Change Password</h1>
            <p className="text-sm text-slate-500">Update your admin account password.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
          <PasswordField
            label="Current Password"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggle={() => setShowCurrent((s) => !s)}
            autoComplete="current-password"
          />
          <PasswordField
            label="New Password"
            value={next}
            onChange={setNext}
            show={showNext}
            onToggle={() => setShowNext((s) => !s)}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            show={showConfirm}
            onToggle={() => setShowConfirm((s) => !s)}
            autoComplete="new-password"
          />

          <p className="text-xs text-slate-500">
            Must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#c9a961] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8985a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Updating Password…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
