import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle, ChevronDown, ArrowRight, Heart } from "lucide-react";
import brandLogo from "@/assets/brand/logo.png";
import { resolveLocalImage } from "@/data/siteImages";
import { NavbarAuthButton } from "@/components/auth/NavbarAuthButton";
import { NotificationBell } from "@/components/NotificationBell";
import { useWishlistStore } from "@/hooks/useWishlist";
import { useBrandSettings } from "@/hooks/useSiteSettings";

function whatsappHref(num: string) {
  const digits = num.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

function WishlistNavButton() {
  const count = useWishlistStore((s) => s.ids.length);
  return (
    <Link
      to="/wishlist"
      aria-label={`Wishlist${count ? ` (${count})` : ""}`}
      className="relative grid h-11 w-11 place-items-center rounded-full bg-white text-charcoal shadow-[0_4px_18px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)]"
    >
      <Heart size={18} className={count > 0 ? "fill-gold text-gold" : ""} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-crimson px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/* ---------------- data ---------------- */

const buyTypes = ["Apartments", "Villas", "Plots", "Commercial", "Residential"];
const rentTypes = ["Apartments", "Villas", "Commercial", "Residential"];
const sellTypes = ["Apartments", "Villas", "Plots", "Commercial", "Residential"];

function typesFor(label: "BUY" | "RENT" | "SELL") {
  if (label === "BUY") return buyTypes;
  if (label === "RENT") return rentTypes;
  return sellTypes;
}

type Pill =
  | { label: "BUY"; to: "/buy-properties/$type"; match: "/buy-properties" }
  | { label: "RENT"; to: "/rent-properties/$type"; match: "/rent-properties" }
  | { label: "SELL"; to: "/sell-property"; match: "/sell-property" };

const pills: Pill[] = [
  { label: "BUY", to: "/buy-properties/$type", match: "/buy-properties" },
  { label: "RENT", to: "/rent-properties/$type", match: "/rent-properties" },
  { label: "SELL", to: "/sell-property", match: "/sell-property" },
];

const drawerLinks = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about-us" },
  { label: "Testimonials", to: "/testimonials" },
  { label: "Contact Us", to: "/contact-us" },
];

/* ---------------- subcomponents ---------------- */

function Logo() {
  const { brand } = useBrandSettings();
  const src = brandLogo;
  return (
    <Link
      to="/"
      aria-label={`${brand.name} — Home`}
      className="group flex items-center transition-transform duration-300 hover:scale-[1.03]"
    >
      <img
        src={src}
        alt={`${brand.name} logo`}
        className="h-9 w-auto object-contain sm:h-10 md:h-11"
        draggable={false}
      />
    </Link>
  );
}

function GetInTouchButton({ compact = false }: { compact?: boolean }) {
  const { brand } = useBrandSettings();
  return (
    <a
      href={whatsappHref(brand.whatsapp || brand.phone)}
      target="_blank"
      rel="noreferrer"
      className={`group inline-flex items-center gap-2 rounded-full bg-white text-charcoal shadow-[0_4px_18px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)] ${
        compact ? "px-3.5 py-2 text-[12px]" : "px-4 py-2.5 text-[13px]"
      }`}
      style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
      aria-label="Get in touch on WhatsApp"
    >
      <MessageCircle size={compact ? 14 : 16} className="text-[#25D366]" />
      {!compact && <span>Get In Touch</span>}
      {compact && <span className="hidden sm:inline">Get In Touch</span>}
    </a>
  );
}

function NavigationPills() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav className="flex items-center gap-1 rounded-full bg-black/[0.03] p-1 ring-1 ring-black/5">
      {pills.map((pill) => {
        const active = pathname.startsWith(pill.match);
        const isOpen = hovered === pill.label;

        const trigger = (
          <span
            className="relative z-10 inline-flex items-center gap-1 px-4 py-2 text-[12px] tracking-[2px]"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
          >
            {pill.label}
            <ChevronDown
              size={12}
              className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        );

        const triggerClass = `relative flex items-center rounded-full transition-colors duration-300 ${
          active ? "text-white" : "text-charcoal/75 hover:text-charcoal"
        }`;

        const bg = active && (
          <motion.span
            layoutId="pill-active"
            className="absolute inset-0 rounded-full shadow-[0_6px_18px_rgba(200,163,77,0.35)]"
            style={{ background: "linear-gradient(135deg,#C8A34D,#E4C06F)" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        );

        const TriggerLink =
          pill.label === "SELL" ? (
            <Link to={pill.to} className={triggerClass}>
              {bg}
              {trigger}
            </Link>
          ) : (
            <Link to={pill.to} params={{ type: "all" }} className={triggerClass}>
              {bg}
              {trigger}
            </Link>
          );

        return (
          <div
            key={pill.label}
            className="relative"
            onMouseEnter={() => setHovered(pill.label)}
            onMouseLeave={() => setHovered(null)}
          >
            {TriggerLink}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 top-full z-40 w-[240px] -translate-x-1/2 pt-3"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  <div
                    className="overflow-hidden rounded-[18px] border border-black/[0.05] bg-white p-3"
                    style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
                  >
                    {typesFor(pill.label).map((t) => {
                      const itemClass =
                        "group/item flex items-center justify-between rounded-[10px] px-4 py-3 text-[13.5px] font-medium text-charcoal/85 transition-all duration-200 hover:bg-[#FAF1DC] hover:text-charcoal hover:translate-x-0.5";
                      const inner = (
                        <>
                          <span>{t}</span>
                          <ArrowRight
                            size={14}
                            className="-translate-x-1 text-gold opacity-0 transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100"
                          />
                        </>
                      );
                      if (pill.label === "SELL") {
                        return (
                          <Link key={t} to="/sell-property" className={itemClass}>
                            {inner}
                          </Link>
                        );
                      }
                      return (
                        <Link
                          key={t}
                          to={pill.to}
                          params={{ type: t.toLowerCase() }}
                          className={itemClass}
                        >
                          {inner}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <Link
        to="/about-us"
        className={`relative flex items-center rounded-full transition-colors duration-300 ${
          pathname.startsWith("/about-us") ? "text-white" : "text-charcoal/75 hover:text-charcoal"
        }`}
      >
        {pathname.startsWith("/about-us") && (
          <motion.span
            layoutId="pill-active"
            className="absolute inset-0 rounded-full shadow-[0_6px_18px_rgba(200,163,77,0.35)]"
            style={{ background: "linear-gradient(135deg,#C8A34D,#E4C06F)" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <span
          className="relative z-10 inline-flex items-center gap-1 px-4 py-2 text-[12px] tracking-[2px]"
          style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
        >
          ABOUT US
        </span>
      </Link>
    </nav>
  );
}

function MenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      className="grid h-11 w-11 place-items-center rounded-full bg-white text-charcoal shadow-[0_4px_18px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={open ? "x" : "menu"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openSub, setOpenSub] = useState<string | null>(null);
  const { brand } = useBrandSettings();
  const count = useWishlistStore((s) => s.ids.length);
  const drawerLogo = brandLogo;
  const drawerWa = whatsappHref(brand.whatsapp || brand.phone);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[85] bg-charcoal/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-[90] flex h-full w-[86%] max-w-[380px] flex-col bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.18)]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
          {/* Header: logo + close */}
          <div className="flex items-center justify-between px-5 py-4">
            <Link to="/" onClick={onClose} aria-label="Home">
              <img
                src={drawerLogo}
                alt={`${brand.name} logo`}
                className="h-8 w-auto object-contain sm:h-9"
                draggable={false}
              />
            </Link>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="grid h-9 w-9 place-items-center rounded-full text-charcoal ring-1 ring-black/10 transition hover:bg-black/[0.04]"
            >
              <X size={18} />
            </button>
          </div>
          <div className="h-px bg-black/[0.06]" />

          {/* Links */}
          <nav className="flex-1 overflow-y-auto px-6 pt-2 pb-5">
            <Link
              to="/"
              onClick={onClose}
              className="block py-3.5 text-[18px] sm:text-[20px] font-semibold text-charcoal"
            >
              Home
            </Link>
            <div className="h-px bg-black/[0.05]" />

            {pills.map((pill) => {
              const label = pill.label === "BUY" ? "Buy" : pill.label === "RENT" ? "Rent" : "Sell";
              const isOpen = openSub === pill.label;
              return (
                <div key={pill.label}>
                  <button
                    onClick={() => setOpenSub(isOpen ? null : pill.label)}
                    className="flex w-full items-center justify-between py-3.5 text-left"
                  >
                    <span className="text-[18px] sm:text-[20px] font-semibold text-charcoal">{label}</span>
                    <ChevronDown
                      size={18}
                      className={`text-charcoal/60 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-2 flex flex-col gap-0.5 border-l-2 border-gold/40 pl-4 pb-2.5">
                          {typesFor(pill.label).map((t) =>
                            pill.label === "SELL" ? (
                              <Link
                                key={t}
                                to="/sell-property"
                                onClick={onClose}
                                className="py-2 text-[14px] font-medium text-charcoal/70 transition hover:text-gold"
                              >
                                {t}
                              </Link>
                            ) : (
                              <Link
                                key={t}
                                to={pill.to}
                                params={{ type: t.toLowerCase() }}
                                onClick={onClose}
                                className="py-2 text-[14px] font-medium text-charcoal/70 transition hover:text-gold"
                              >
                                {t}
                              </Link>
                            ),
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="h-px bg-black/[0.05]" />
                </div>
              );
            })}

            {[
              { label: "About Us", to: "/about-us" },
              { label: "Testimonials", to: "/testimonials" },
              { label: "FAQs", to: "/faqs" },
              { label: "Contact Us", to: "/contact-us" },
            ].map((l) => (
              <div key={l.label}>
                <Link
                  to={l.to}
                  onClick={onClose}
                  className="block py-3.5 text-[18px] sm:text-[20px] font-semibold text-charcoal transition hover:text-gold"
                >
                  {l.label}
                </Link>
                <div className="h-px bg-black/[0.05]" />
              </div>
            ))}

            <Link
              to="/wishlist"
              onClick={onClose}
              className="flex items-center justify-between py-3.5 text-[18px] sm:text-[20px] font-semibold text-charcoal transition hover:text-gold"
            >
              <span>Saved Properties</span>
              {count > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gold/15 px-2 text-xs font-bold text-gold">
                  {count}
                </span>
              )}
            </Link>
            <div className="h-px bg-black/[0.05]" />

            <div className="pt-4 md:hidden" onClick={onClose}>
              <NavbarAuthButton />
            </div>
          </nav>

          {/* Bottom CTA */}
          <div className="px-5 pb-6 pt-2">
            <a
              href={drawerWa}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_28px_rgba(200,163,77,0.35)] transition hover:scale-[1.01]"
              style={{
                fontFamily: "'Manrope', sans-serif",
                background: "linear-gradient(135deg,#C8A34D,#E4C06F)",
              }}
            >
              <MessageCircle size={16} /> Speak with an Expert
            </a>
          </div>
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Navbar ---------------- */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Track if this is the very first mount so we skip the slide-in animation
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);

      if (currentY > 120 && currentY > lastY + 5) {
        setHidden(true);
      } else if (currentY < lastY - 5 || currentY <= 50) {
        setHidden(false);
      }
      lastY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[15px] sm:px-5">
        <AnimatePresence>
          {!hidden && (
            <motion.header
              // On first mount show instantly (no entry animation).
              // After that, when hidden=true triggers exit, slide out smoothly.
              initial={false}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={mounted ? undefined : { opacity: 1, transform: "none" }}
              className={`pointer-events-auto flex w-full items-center justify-between gap-3 rounded-[18px] border transition-all duration-300 ${
                scrolled
                  ? "border-black/10 bg-white/90 backdrop-blur-md py-2 px-3 sm:px-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                  : "border-black/[0.06] bg-white px-3 py-2 sm:px-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              }`}
            >
              {/* Left: Logo */}
              <div className="flex shrink-0 items-center">
                <Logo />
              </div>

              {/* Center: Get In Touch + Pills (desktop) */}
              <div className="hidden flex-1 items-center justify-center gap-4 lg:flex">
                <GetInTouchButton />
                <NavigationPills />
              </div>

              {/* Right: Menu + (mobile) Get In Touch */}
              <div className="flex shrink-0 items-center gap-2">
                <div className="lg:hidden">
                  <GetInTouchButton compact />
                </div>
                <NotificationBell />
                <div className="hidden md:block">
                  <WishlistNavButton />
                </div>
                <div className="hidden md:block">
                  <NavbarAuthButton />
                </div>
                <MenuButton open={drawerOpen} onClick={() => setDrawerOpen((v) => !v)} />
              </div>
            </motion.header>
          )}
        </AnimatePresence>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
