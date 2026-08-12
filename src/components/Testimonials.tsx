import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import { useTestimonials } from "@/hooks/useSiteSettings";
import type { Testimonial as DbTestimonial } from "@/lib/site-cms";

/* ---------------- Data ---------------- */

type Category = "Buyer" | "Seller" | "Tenant" | "Owner" | "NRI";

type Testimonial = {
  name: string;
  role: string;
  location: string;
  text: string;
  rating: number;
  tag: Category;
  initials: string;
  accent: string;
};

const ACCENT_BY_CATEGORY: Record<Category, string> = {
  Buyer: "from-[#C8A34D] to-[#E4C06F]",
  Seller: "from-[#21396F] to-[#172B58]",
  Tenant: "from-[#4AA3DF] to-[#7BC4E8]",
  Owner: "from-[#C8A34D] to-[#A47E2A]",
  NRI: "from-[#21396F] to-[#4AA3DF]",
};

function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function mapDbTestimonial(t: DbTestimonial): Testimonial {
  const cat = (["Buyer", "Seller", "Tenant", "Owner", "NRI"] as Category[]).includes(t.category as Category)
    ? (t.category as Category)
    : "Buyer";
  return {
    name: t.name,
    role: t.role || cat,
    location: t.location || "",
    text: t.quote,
    rating: Math.max(1, Math.min(5, t.rating || 5)),
    tag: cat,
    initials: initialsOf(t.name),
    accent: ACCENT_BY_CATEGORY[cat],
  };
}

const tabs = ["All", "Buyer", "Seller", "Tenant", "Owner", "NRI"] as const;
type Tab = (typeof tabs)[number];

/* ---------------- Subcomponents ---------------- */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 * i, duration: 0.3 }}
        >
          <Star
            size={16}
            className={
              i < rating
                ? "fill-[#C8A34D] text-[#C8A34D] drop-shadow-[0_0_6px_rgba(200,163,77,0.4)]"
                : "text-black/15"
            }
          />
        </motion.span>
      ))}
    </div>
  );
}

function ClientAvatar({ initials, accent }: { initials: string; accent: string }) {
  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white font-bold text-lg shadow-[0_8px_22px_rgba(33,57,111,0.25)] ring-2 ring-white`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {initials}
    </div>
  );
}

function TestimonialTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-full bg-white p-1.5 shadow-[0_10px_30px_rgba(33,57,111,0.08)] ring-1 ring-black/5">
      {tabs.map((t) => {
        const isActive = active === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`relative rounded-full px-4 py-2 text-[12px] font-semibold tracking-[2px] uppercase transition-colors duration-300 sm:px-5 sm:text-[13px] ${
              isActive ? "text-white" : "text-[#21396F]/70 hover:text-[#21396F]"
            }`}
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {isActive && (
              <motion.span
                layoutId="testimonial-tab-active"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#21396F] to-[#172B58] shadow-[0_8px_22px_rgba(33,57,111,0.35)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{t === "All" ? "All" : `${t}s`}</span>
          </button>
        );
      })}
    </div>
  );
}

const tagStyles: Record<Category, string> = {
  Buyer: "bg-[#4AA3DF]/10 text-[#21396F] ring-[#4AA3DF]/30",
  Seller: "bg-[#F13B22]/10 text-[#B5301C] ring-[#F13B22]/30",
  Tenant: "bg-[#C8A34D]/15 text-[#8A6D22] ring-[#C8A34D]/40",
  Owner: "bg-[#21396F]/10 text-[#21396F] ring-[#21396F]/25",
  NRI: "bg-gradient-to-r from-[#C8A34D]/15 to-[#21396F]/10 text-[#21396F] ring-[#C8A34D]/30",
};

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  return (
    <motion.article
      initial={{ y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white/90 p-7 shadow-[0_20px_50px_rgba(33,57,111,0.08)] backdrop-blur-xl transition-all duration-500 hover:border-[#C8A34D]/40 hover:shadow-[0_30px_70px_rgba(200,163,77,0.18)] sm:p-8"
    >
      {/* Gold glow on hover */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#C8A34D]/0 blur-3xl transition-all duration-500 group-hover:bg-[#C8A34D]/20" />

      {/* Quote icon */}
      <div className="mb-5 flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#C8A34D] to-[#E4C06F] text-white shadow-[0_8px_20px_rgba(200,163,77,0.35)]">
          <Quote size={18} />
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[2px] ring-1 ${tagStyles[t.tag]}`}
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <BadgeCheck size={12} /> {t.tag}
        </span>
      </div>

      {/* Rating */}
      <StarRating rating={t.rating} />

      {/* Text */}
      <p
        className="relative mt-5 flex-1 text-[15px] leading-[1.75] text-[#21396F]/85 sm:text-[16px]"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        “{t.text}”
      </p>

      {/* Divider */}
      <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#C8A34D]/30 to-transparent" />

      {/* Client */}
      <div className="flex items-center gap-4">
        <ClientAvatar initials={t.initials} accent={t.accent} />
        <div className="min-w-0">
          <div
            className="truncate text-[16px] font-bold text-[#172B58]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t.name}
          </div>
          <div
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#21396F]/60"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <span>{t.role}</span>
            <span className="text-[#C8A34D]">•</span>
            <MapPin size={11} className="text-[#C8A34D]" />
            <span className="truncate">{t.location}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------------- Main ---------------- */

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Aarav Mehta",
    role: "Founder, Mehta Capital",
    location: "Whitefield, Bangalore",
    text: "Touch Stone curated three properties that matched our brief perfectly. We closed in 11 days. Refreshingly transparent and zero pressure.",
    rating: 5,
    tag: "Buyer",
    initials: "AM",
    accent: ACCENT_BY_CATEGORY["Buyer"],
  },
  {
    name: "Priya Raghavan",
    role: "NRI Investor",
    location: "Koramangala, Bangalore",
    text: "From Dubai I needed someone I could trust completely. They handled legal, registration and even interior handover. White-glove service.",
    rating: 5,
    tag: "NRI",
    initials: "PR",
    accent: ACCENT_BY_CATEGORY["NRI"],
  },
  {
    name: "Vikram Iyer",
    role: "Property Owner",
    location: "HSR Layout, Bangalore",
    text: "The market intel was extraordinary — they showed us comparables, builder track records, RERA filings. Made a complicated decision feel obvious.",
    rating: 5,
    tag: "Owner",
    initials: "VI",
    accent: ACCENT_BY_CATEGORY["Owner"],
  },
  {
    name: "Ananya Krishnan",
    role: "Doctor",
    location: "Indiranagar, Bangalore",
    text: "Our family villa search took two years with other brokers. Touch Stone narrowed it to four homes that all fit. We loved one of them.",
    rating: 5,
    tag: "Buyer",
    initials: "AK",
    accent: ACCENT_BY_CATEGORY["Buyer"],
  },
];

export function Testimonials() {
  const [active, setActive] = useState<Tab>("All");
  const { items: dbItems } = useTestimonials(true);
  const testimonials = useMemo<Testimonial[]>(
    () => (dbItems && dbItems.length > 0 ? dbItems.map(mapDbTestimonial) : DEFAULT_TESTIMONIALS),
    [dbItems],
  );

  const filtered = useMemo(
    () => (active === "All" ? testimonials : testimonials.filter((t) => t.tag === active)),
    [active, testimonials],
  );

  // Mobile carousel state
  const [slide, setSlide] = useState(0);
  useEffect(() => setSlide(0), [active]);

  // Auto-advance (mobile carousel)
  useEffect(() => {
    if (filtered.length < 2) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % filtered.length);
    }, 6000);
    return () => clearInterval(id);
  }, [filtered.length]);

  const next = () => setSlide((s) => (s + 1) % filtered.length);
  const prev = () => setSlide((s) => (s - 1 + filtered.length) % filtered.length);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#F8F5F0] via-white to-[#F8F5F0] py-8 sm:py-12"
      aria-label="Client testimonials"
    >
      {/* Decorative bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(200,163,77,0.18), transparent 45%), radial-gradient(circle at 80% 90%, rgba(33,57,111,0.12), transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#21396F 1px, transparent 1px), linear-gradient(90deg, #21396F 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative mx-auto w-full px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[3px] text-[#C8A34D] shadow-[0_6px_18px_rgba(200,163,77,0.18)] ring-1 ring-[#C8A34D]/25"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8A34D]" />
            Client Stories
          </span>
          <h2
            className="mt-6 text-[40px] font-bold leading-[1.05] text-[#172B58] sm:text-[56px] lg:text-[64px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            What Our Clients{" "}
            <span className="italic text-[#C8A34D]">Say</span>
          </h2>
          <p
            className="mx-auto mt-5 max-w-2xl text-[16px] leading-[1.7] text-[#21396F]/70 sm:text-[17px]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Real experiences from buyers, sellers, owners, and tenants who trusted Touch Stone Properties.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 sm:mt-12"
        >
          <TestimonialTabs active={active} onChange={setActive} />
        </motion.div>

        {/* Testimonials — static grid up to 4, continuous marquee beyond */}
        <div className="mt-12 sm:mt-16">
          {filtered.length <= 4 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
              {filtered.map((t, i) => (
                <TestimonialCard key={`${t.name}-${active}`} t={t} index={i} />
              ))}
            </div>
          ) : (
            <div
              className="group/marquee relative overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              }}
            >
              <div
                className="flex w-max gap-6 lg:gap-7 animate-testimonial-marquee group-hover/marquee:[animation-play-state:paused]"
                style={{ animationDuration: `${Math.max(20, filtered.length * 6)}s` }}
              >
                {[...filtered, ...filtered].map((t, i) => (
                  <div
                    key={`${t.name}-${i}`}
                    className="w-[85vw] shrink-0 sm:w-[360px] lg:w-[300px]"
                  >
                    <TestimonialCard t={t} index={0} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* CTA */}
        <motion.div
          initial={{ y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="hidden sm:block relative mx-auto mt-20 w-full overflow-hidden rounded-[32px] bg-gradient-to-br from-[#172B58] via-[#21396F] to-[#172B58] p-10 text-center shadow-[0_30px_80px_rgba(33,57,111,0.35)] sm:mt-24 sm:p-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#C8A34D]/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[#4AA3DF]/20 blur-3xl"
          />
          <div className="relative">
            <h3
              className="text-[30px] font-bold leading-tight text-white sm:text-[42px]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ready to Start Your{" "}
              <span className="italic text-[#E4C06F]">Property Journey?</span>
            </h3>
            <p
              className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-[16px]"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Speak with our team and discover homes, investments, and rentals tailored to you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/contact-us"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-bold tracking-[1px] text-[#172B58] shadow-[0_12px_30px_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#C8A34D] hover:text-white sm:w-auto"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                <Phone size={16} /> Contact Us
              </Link>
              <a
                href="https://wa.me/919902925519"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-[14px] font-bold tracking-[1px] text-white shadow-[0_12px_30px_rgba(37,211,102,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1faa53] sm:w-auto"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                <MessageCircle size={16} /> WhatsApp Now
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Testimonials;
