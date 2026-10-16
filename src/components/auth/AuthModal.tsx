import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { X, Mail, Lock, User as UserIcon, Phone, MapPin, Eye, EyeOff, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/integrations/supabase/client";

import { useAuthModal } from "@/contexts/AuthModalContext";
import { getLoginErrorMessage, isAdminUser, withAuthTimeout } from "@/lib/admin-auth";
import { loginUserFn, signupUserFn } from "@/lib/auth.functions";
import { useAuth } from "@/contexts/AuthContext";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={18} height={18} viewBox="0 0 48 48" {...props}>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.2 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.2 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29 35.3 26.6 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.5 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C40.9 35.7 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z" />
  </svg>
);

export function AuthModal() {
  const { open, mode, setMode, closeModal, loginOnly } = useAuthModal();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeModal]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex justify-center overflow-y-auto bg-black/55 backdrop-blur-md p-3 sm:p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto flex max-h-[calc(100dvh-24px)] sm:max-h-[90dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl sm:rounded-[28px] bg-white/95 backdrop-blur-xl shadow-[0_30px_80px_rgba(15,23,42,0.4)] ring-1 ring-white/60"
          >
            {/* Decorative header */}
            <div
              className="relative h-14 sm:h-24 shrink-0 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #172B58 0%, #21396F 50%, #2d4d8f 100%)",
              }}
            >
              <div className="absolute inset-0 opacity-20">
                <svg className="h-full w-full" viewBox="0 0 400 130" preserveAspectRatio="none">
                  <path d="M0,80 L60,80 L60,40 L120,40 L120,60 L180,60 L180,20 L240,20 L240,50 L300,50 L300,30 L400,30 L400,130 L0,130 Z" fill="rgba(200,163,77,0.4)" />
                  <path d="M0,90 L80,90 L80,55 L150,55 L150,75 L220,75 L220,40 L290,40 L290,65 L400,65 L400,130 L0,130 Z" fill="rgba(255,255,255,0.15)" />
                </svg>
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-9 w-9 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#C8A34D] to-[#E4C06F] shadow-lg">
                  <Building2 size={18} className="text-white sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>

            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-2.5 top-2.5 sm:right-4 sm:top-4 z-20 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow transition hover:bg-white"
            >
              <X size={16} />
            </button>

            <div className="overflow-y-auto px-4 pb-4 pt-3.5 sm:px-7 sm:pb-6 sm:pt-5">
              {/* Tabs */}
              {mode !== "forgot" && !loginOnly && (
                <div className="mb-3 sm:mb-4 flex rounded-full bg-slate-100 p-1">
                  {(["login", "register"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 rounded-full py-1.5 sm:py-2 text-[12.5px] sm:text-[13px] font-bold transition ${
                        mode === m
                          ? "bg-gradient-to-r from-[#172B58] to-[#21396F] text-white shadow"
                          : "text-slate-600 hover:text-[#172B58]"
                      }`}
                    >
                      {m === "login" ? "Login" : "Register"}
                    </button>
                  ))}
                </div>
              )}

              {mode === "login" && <LoginForm />}
              {mode === "register" && <RegisterForm />}
              {mode === "forgot" && <ForgotForm />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3 sm:mb-4 text-center">
      <h2
        className="text-xl sm:text-2xl font-bold text-[#172B58]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
      <p className="mt-0.5 text-[12px] sm:text-[13px] text-slate-500">{subtitle}</p>
    </div>
  );
}

function GoogleButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: "select_account" },
        }
      });
      
      if (error) {
        toast.error("Google sign-in failed: " + error.message);
        setLoading(false);
        return;
      }
      // Supabase OAuth redirects the page automatically
    } catch {
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 text-[13.5px] font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#C8A34D] hover:shadow-md disabled:opacity-60"
    >
      <GoogleIcon /> {label}
    </button>
  );
}

function Field({
  icon,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <input
        {...rest}
        className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2.5 text-[14px] text-[#172B58] outline-none transition focus:border-[#C8A34D] focus:ring-2 focus:ring-[#C8A34D]/15"
      />
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
  id,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  id?: string;
  name?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Lock size={15} />
      </span>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        id={id}
        name={name}
        className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2.5 text-[14px] text-[#172B58] outline-none transition focus:border-[#C8A34D] focus:ring-2 focus:ring-[#C8A34D]/15"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setMode, closeModal, loginOnly } = useAuthModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const { setSessionData } = useAuth();

  const isAdminLogin = loginOnly && (pathname.startsWith("/admin") || pathname.includes("staff"));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      const message = "Please enter both email and password.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const result = await loginUserFn({ data: { email: trimmedEmail, password: trimmedPassword } });

      if ("error" in result) throw new Error(result.error);
      if (!result.user || !result.token) throw new Error("Sign-in failed.");

      const uid = result.user.id;
      setSessionData(result.token, result.user as any);

      // Check admin/staff roles — wrap in try/catch so RLS errors don't log the user out
      let isAdminAcct = false;
      let isStaffAcct = false;
      try {
        const [{ data: adminFlag }, { data: staffRow }] = await Promise.all([
          supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
          supabase.from("staff_users").select("id,status").eq("auth_user_id", uid).maybeSingle(),
        ]);
        isAdminAcct = adminFlag === true;
        isStaffAcct = !!staffRow && staffRow.status === "active";
      } catch {
        // If role check fails (e.g. network/RLS), treat as regular customer — do not log out
      }

      if (isAdminLogin) {
        if (!isAdminAcct && !isStaffAcct) {
          await supabase.auth.signOut();
          throw new Error("You do not have permission to access the admin panel.");
        }
        toast.success("Welcome back!");
        closeModal();
        await navigate({ to: isAdminAcct ? "/admin/properties" : "/admin/tasks", replace: true });
        return;
      }

      // Customer login: block admin/staff accounts from using the website modal
      if (isAdminAcct || isStaffAcct) {
        await supabase.auth.signOut();
        throw new Error("This is a staff/admin account. Please sign in at /staff-login or /admin/login.");
      }

      // ✅ Successful customer login — close modal and show logged-in state
      toast.success("Logged in successfully! Welcome back.");
      closeModal();

      // Redirect to customer dashboard only from home/login pages.
      // On other pages (property listings, etc.) just stay on the current page
      // but now logged in — the navbar will update to show the user avatar.
      if (pathname === "/" || pathname === "/login" || pathname === "/admin/login") {
        await navigate({ to: "/customer-dashboard", replace: true });
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      let message = getLoginErrorMessage(error);
      if (/invalid email or password|invalid login credentials/i.test(raw + message)) {
        message = "Account not found or incorrect password. Please register first.";
      }
      if (message.includes("not confirmed yet")) {
        setUnconfirmedEmail(trimmedEmail);
      } else {
        setUnconfirmedEmail("");
      }
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <Heading
        title="Welcome Back"
        subtitle="Access your saved properties, wishlist and enquiries."
      />
      <form onSubmit={submit} className="space-y-3">
        <Field
          icon={<Mail size={15} />}
          type="email"
          name="email"
          id="login-email"
          autoComplete="off"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField 
          value={password} 
          onChange={setPassword} 
          placeholder="Password" 
          name="password"
          id="login-password"
          autoComplete="new-password"
        />
        {errorMessage && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 flex flex-col gap-1">
            <p>{errorMessage}</p>
            {unconfirmedEmail && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.resend({ 
                      type: "signup", 
                      email: unconfirmedEmail, 
                      options: { emailRedirectTo: window.location.origin } 
                    });
                    if (error) throw error;
                    toast.success("Confirmation email resent!");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to resend confirmation email.");
                  }
                }}
                className="mt-1 font-bold underline hover:text-red-900 w-fit"
              >
                Resend confirmation email
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-[12px]">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#C8A34D]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="font-semibold text-[#C8A34D] hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-[#C8A34D] to-[#E4C06F] py-2.5 text-[14px] font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
      <Divider />
      <GoogleButton label="Continue with Google" />
    </>
  );
}

function RegisterForm() {
  const { closeModal } = useAuthModal();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "Bangalore",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const { setSessionData } = useAuth();
  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords don't match");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const result = await signupUserFn({
      data: {
        email: form.email,
        password: form.password,
        full_name: form.full_name
      }
    });
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setSessionData(result.token, result.user as any);
    toast.success("Account created successfully!");
    closeModal();
  };

  return (
    <>
      <Heading
        title="Create Account"
        subtitle="Join Touchstone to save properties and track enquiries."
      />
      <form onSubmit={submit} className="space-y-3">
        <Field
          icon={<UserIcon size={15} />}
          name="full_name"
          id="register-full-name"
          autoComplete="name"
          required
          placeholder="Full name"
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
        />
        <Field
          icon={<Mail size={15} />}
          type="email"
          name="email"
          id="register-email"
          autoComplete="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            icon={<Phone size={15} />}
            name="phone"
            id="register-phone"
            autoComplete="tel"
            required
            placeholder="Mobile"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <Field
            icon={<MapPin size={15} />}
            name="city"
            id="register-city"
            autoComplete="address-level2"
            required
            placeholder="City"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
        <PasswordField
          value={form.password}
          onChange={(v) => update("password", v)}
          placeholder="Password (min 6 chars)"
          name="password"
          id="register-password"
          autoComplete="new-password"
        />
        <PasswordField
          value={form.confirm}
          onChange={(v) => update("confirm", v)}
          placeholder="Confirm password"
          name="confirm-password"
          id="register-confirm-password"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-[#C8A34D] to-[#E4C06F] py-2.5 text-[14px] font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
      <Divider />
      <GoogleButton label="Sign up with Google" />
    </>
  );
}

function ForgotForm() {
  const { setMode } = useAuthModal();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent to your email");
  };

  return (
    <>
      <Heading
        title="Reset Password"
        subtitle="Enter your email and we'll send a reset link."
      />
      {sent ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-center text-[13px] text-emerald-700">
          Check your inbox at <b>{email}</b> for the reset link.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Field
            icon={<Mail size={15} />}
            type="email"
            name="email"
            id="forgot-email"
            autoComplete="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#C8A34D] to-[#E4C06F] py-2.5 text-[14px] font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
      <button
        onClick={() => setMode("login")}
        className="mt-4 w-full text-center text-[12px] font-semibold text-[#172B58] hover:underline"
      >
        ← Back to login
      </button>
    </>
  );
}

function Divider() {
  return (
    <div className="my-2.5 sm:my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
