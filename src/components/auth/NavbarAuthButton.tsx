import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  User as UserIcon,
  UserCog,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";

import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";

export function NavbarAuthButton() {
  const { user, profile, signOut, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isStaff } = useStaffPermissions();
  const { openModal } = useAuthModal();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isAdminOrStaff = isAdmin || isStaff;

  // If no user is logged in, OR if the active account is an Admin/Staff account
  // (which logged in via Admin panel), display the Login button on the public site!
  if (!user || isAdminOrStaff) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openModal("login")}
          className="group inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-charcoal shadow-[0_4px_18px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C8A34D] hover:text-[#C8A34D] hover:shadow-[0_10px_28px_rgba(200,163,77,0.25)]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
          aria-label="Login"
        >
          <UserIcon size={14} className="transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Login</span>
        </button>
        {isAdminOrStaff && (
          <Link
            to="/admin"
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#172B58] px-3.5 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#21396F]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
            title="Go to Admin CMS Panel"
          >
            <span>CMS Panel</span>
          </Link>
        )}
      </div>
    );
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const items: Array<{ icon: React.ComponentType<{ size?: number }>; label: string; to: string }> = [
    { icon: UserIcon, label: "My Dashboard", to: "/customer-dashboard" },
    { icon: UserCog, label: "Profile", to: "/customer-dashboard/profile" },
  ];


  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2 rounded-full border border-black/10 bg-white py-1.5 pl-1.5 pr-3 shadow-[0_4px_18px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)]"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#172B58] to-[#21396F] text-[12px] font-bold text-white">
            {initial}
          </span>
        )}
        <span
          className="hidden text-[12px] font-semibold text-charcoal sm:inline"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {displayName.split(" ")[0]}
        </span>
        <ChevronDown
          size={13}
          className={`hidden text-charcoal/60 transition-transform duration-200 sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-[260px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <div
              className="px-4 py-3"
              style={{ background: "linear-gradient(135deg,#172B58,#21396F)" }}
            >
              <div className="text-[11px] uppercase tracking-wider text-[#C8A34D]">
                Signed in as
              </div>
              <div className="truncate text-[14px] font-bold text-white">{displayName}</div>
              <div className="truncate text-[11px] text-white/70">{user.email}</div>
            </div>
            <div className="max-h-[380px] overflow-y-auto py-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as never}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-charcoal/85 transition hover:bg-[#FAF1DC] hover:text-[#172B58]"
                >
                  <item.icon size={15} />
                  {item.label}
                </Link>
              ))}
              <div className="my-1 h-px bg-black/[0.06]" />
              <button
                onClick={async () => {
                  setOpen(false);
                  await signOut();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
