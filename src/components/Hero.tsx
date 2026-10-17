import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  Home as HomeIcon,
  Key,
  Tag,
} from "lucide-react";
import { siteImages, resolveLocalImage } from "@/data/siteImages";
import { listBanners, type Banner } from "@/lib/banners";
import { getSearchFilters, SEARCH_FILTERS_DEFAULTS } from "@/lib/site-cms";
import { supabase } from "@/integrations/supabase/client";
import { useDbProperties } from "@/hooks/useDbProperties";


/* ---------------- types & data ---------------- */

type CTA =
  | { kind: "link"; label: string; to: string; params?: Record<string, string>; variant: "gold" | "ghost" }
  | { kind: "href"; label: string; href: string; variant: "gold" | "ghost"; external?: boolean };

type Slide = {
  image: string;
  eyebrow: string;
  titleHead: string;
  titleGold: string;
  titleTail?: string;
  subtitle: string;
  ctas: CTA[];
};

const fallbackSlides: Slide[] = [
  {
    image:
      siteImages.hero.welcome,
    eyebrow: "WELCOME",
    titleHead: "Welcome to ",
    titleGold: "Touch Stone",
    titleTail: " Properties",
    subtitle:
      "Your trusted real estate partner for buying, selling, and renting verified properties across Bangalore.",
    ctas: [
      { kind: "link", label: "Explore Properties", to: "/buy-properties/$type", params: { type: "all" }, variant: "gold" },
      { kind: "link", label: "Get in Touch", to: "/contact-us", variant: "ghost" },
    ],
  },
  {
    image:
      siteImages.hero.sellPropertyConfidence,
    eyebrow: "FOR OWNERS",
    titleHead: "Sell Your Property with ",
    titleGold: "Confidence",
    subtitle:
      "List your property with Touch Stone Properties and connect with serious verified buyers.",
    ctas: [
      { kind: "link", label: "Sell Your Property", to: "/sell-property", variant: "gold" },
      { kind: "link", label: "Talk to Expert", to: "/contact-us", variant: "ghost" },
    ],
  },
  {
    image:
      siteImages.hero.buy,
    eyebrow: "FOR BUYERS",
    titleHead: "Buy Your ",
    titleGold: "Dream Home",
    subtitle:
      "Discover verified apartments, villas, plots, and premium residential projects in prime Bangalore locations.",
    ctas: [
      { kind: "link", label: "View Properties", to: "/buy-properties/$type", params: { type: "all" }, variant: "gold" },
      { kind: "link", label: "Schedule Site Visit", to: "/contact-us", variant: "ghost" },
    ],
  },
  {
    image:
      siteImages.hero.rent,
    eyebrow: "FOR TENANTS",
    titleHead: "Rent the ",
    titleGold: "Right Property",
    subtitle:
      "Find rental homes that match your lifestyle, budget, and preferred location.",
    ctas: [
      { kind: "link", label: "View Rentals", to: "/rent-properties/$type", params: { type: "all" }, variant: "gold" },
      { kind: "href", label: "WhatsApp Us", href: "https://wa.me/919902925519", variant: "ghost", external: true },
    ],
  },
];

/* ---------------- subcomponents ---------------- */

function CtaButton({ cta }: { cta: CTA }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-semibold transition-all duration-300 hover:-translate-y-0.5";
  const gold =
    "text-charcoal shadow-[0_10px_28px_rgba(200,163,77,0.45)] hover:shadow-[0_14px_34px_rgba(200,163,77,0.55)]";
  const ghost =
    "border border-white/40 bg-white/10 text-white backdrop-blur-md hover:bg-white/20";

  const className = `${base} ${cta.variant === "gold" ? gold : ghost}`;
  const style =
    cta.variant === "gold"
      ? { background: "linear-gradient(135deg,#C8A34D,#E4C06F)", fontFamily: "'Manrope', sans-serif" }
      : { fontFamily: "'Manrope', sans-serif" };

  const inner = (
    <>
      {cta.label}
      {cta.variant === "gold" ? <ArrowRight size={15} /> : null}
      {cta.variant === "ghost" && cta.kind === "href" ? <MessageCircle size={15} /> : null}
    </>
  );

  if (cta.kind === "href") {
    return (
      <a href={cta.href} target={cta.external ? "_blank" : undefined} rel="noreferrer" className={className} style={style}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={cta.to} params={cta.params as never} className={className} style={style}>
      {inner}
    </Link>
  );
}

function HeroSearchBar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const { data: allProps } = useDbProperties({ enabled: open || q.trim().length > 0 });
  const { data: filters = SEARCH_FILTERS_DEFAULTS } = useQuery({
    queryKey: ["search-filters"],
    queryFn: getSearchFilters,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const channel = supabase
      .channel("hero-search-filters-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.search_filters" },
        () => qc.invalidateQueries({ queryKey: ["search-filters"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.bottom + 8, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    return (allProps ?? [])
      .filter((p) => {
        const hay = `${p.title} ${p.builder} ${p.area} ${p.location} ${p.city} ${p.type} ${p.bhk}bhk`.toLowerCase();
        return hay.includes(term);
      })
      .slice(0, 6);
  }, [allProps, q]);

  useEffect(() => setActive(0), [q]);

  if (filters.is_visible === false) return null;

  const tabs = filters.listing_types ?? [];
  const defaultTab = tabs.includes(filters.default_tab)
    ? filters.default_tab
    : (tabs[0] ?? SEARCH_FILTERS_DEFAULTS.default_tab);
  const searchRoute = defaultTab === "Rent" ? "/rent-properties/$type" : "/buy-properties/$type";
  const buttonText = defaultTab === "Sell"
    ? (filters.enquiry_button_text ?? SEARCH_FILTERS_DEFAULTS.enquiry_button_text)
    : (filters.search_button_text ?? SEARCH_FILTERS_DEFAULTS.search_button_text);

  const goToProperty = (slug: string) => {
    setOpen(false);
    navigate({ to: "/property/$slug", params: { slug } } as never);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = q.trim();
    setOpen(false);
    if (defaultTab === "Sell") {
      navigate({ to: "/sell-property" } as never);
      return;
    }
    navigate({
      to: searchRoute,
      params: { type: "all" },
      search: trimmed ? { q: trimmed } : undefined,
    } as never);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      // If a suggestion is highlighted and user pressed ArrowDown/Up, go to it
      if (active > 0 || (active === 0 && q.trim().length >= 2 && suggestions[0])) {
        // let Enter always submit search on the whole term; suggestions require click
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showEmpty = open && q.trim().length >= 2 && suggestions.length === 0;

  return (
    <div ref={wrapRef} className="relative mt-4 md:mt-7 w-full max-w-[560px]">
      <form
        onSubmit={submit}
        className="flex w-full items-center gap-2 rounded-full bg-white p-1.5 pl-4 sm:pl-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
      >
        <Search size={16} className="shrink-0 text-charcoal/50" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={filters.keyword_placeholder ?? SEARCH_FILTERS_DEFAULTS.keyword_placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] sm:text-[14px] text-charcoal outline-none placeholder:text-charcoal/45"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        />
        <button
          type="submit"
          className="hidden shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition hover:scale-[1.03] sm:inline-flex"
          style={{ background: "#0E2A47", fontFamily: "'Manrope', sans-serif" }}
        >
          {buttonText}
        </button>
        <button
          type="submit"
          aria-label="Search"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-md sm:hidden"
          style={{ background: "#0E2A47" }}
        >
          <Search size={15} />
        </button>
      </form>

      {(open && (suggestions.length > 0 || showEmpty)) && typeof document !== "undefined" && rect && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            left: Math.max(8, rect.left),
            top: rect.top,
            width: typeof window !== "undefined" ? Math.min(rect.width, window.innerWidth - 16) : rect.width,
            zIndex: 1000,
          }}
          className="overflow-hidden rounded-2xl border border-black/5 bg-white text-charcoal shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        >
          {suggestions.length > 0 ? (
            <ul className="max-h-[320px] sm:max-h-[360px] overflow-auto py-1">
              {suggestions.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => goToProperty(p.slug)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                      i === active ? "bg-gold/10" : "hover:bg-black/5"
                    }`}
                  >
                    {p.image ? (
                      <img
                        src={p.image}
                        alt=""
                        className="h-11 w-14 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-11 w-14 shrink-0 rounded-md bg-charcoal/10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold">{p.title}</div>
                      <div className="truncate text-[11.5px] text-charcoal/60">
                        {p.builder}
                        {p.area ? ` • ${p.area}` : ""}
                        {p.type ? ` • ${p.type}` : ""}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-[13px] text-charcoal/70">
              No matching properties found. Try searching by builder, project, or location.
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

function HeroActionPills() {
  const pills = [
    { icon: HomeIcon, label: "Buy a Home", to: "/buy-properties/$type" as const, params: { type: "all" } },
    { icon: Key, label: "Rent a Home", to: "/rent-properties/$type" as const, params: { type: "all" } },
    { icon: Tag, label: "Sell Your Property", to: "/sell-property" as const, params: undefined },
  ];
  return (
    <div className="mt-0 md:mt-6 flex flex-wrap gap-1.5 sm:gap-2">
      {pills.map((p) => (
        <Link
          key={p.label}
          to={p.to}
          params={p.params as never}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11.5px] sm:px-4 sm:py-2 sm:text-[12.5px] font-medium text-white backdrop-blur-md transition hover:border-gold/70 hover:bg-white/20"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <p.icon size={13} className="shrink-0 text-gold sm:h-3.5 sm:w-3.5" />
          {p.label}
        </Link>
      ))}
    </div>
  );
}

function HeroDots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="grid place-items-center"
          >
            <motion.span
              animate={{ width: isActive ? 32 : 10, scale: isActive ? 1 : 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className={`block h-2.5 rounded-full ${isActive ? "" : "bg-white md:bg-white/45"}`}
              style={isActive ? { background: "linear-gradient(135deg,#C8A34D,#E4C06F)" } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}

function HeroNavigationArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const cls =
    "grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full border border-white/60 bg-black/25 text-white backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-all duration-300 active:scale-95";
  return (
    <div className="flex items-center gap-2.5">
      <button onClick={onPrev} aria-label="Previous slide" className={cls}>
        <ChevronLeft size={18} />
      </button>
      <button onClick={onNext} aria-label="Next slide" className={cls}>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function HeroSlide({ slide, active }: { slide: Slide; active: boolean }) {
  return (
    <div className="absolute inset-0">
      {/* zooming bg image */}
      <motion.img
        key={slide.image}
        src={slide.image}
        alt=""
        initial={{ scale: 1.08 }}
        animate={{ scale: active ? 1.16 : 1.08 }}
        transition={{ duration: 7, ease: "linear" }}
        className="h-full w-full object-cover object-[75%_center] md:object-center"
      />
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,18,36,0.75) 0%, rgba(8,18,36,0.55) 40%, rgba(8,18,36,0.25) 70%, rgba(8,18,36,0.15) 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,18,36,0.85) 0%, rgba(8,18,36,0.55) 45%, rgba(8,18,36,0.12) 75%, rgba(8,18,36,0.05) 100%)",
        }}
      />
    </div>
  );
}

/* ---------------- HeroCarousel ---------------- */

function bannerToSlide(b: Banner): Slide {
  const ctas: CTA[] = [];
  if (b.cta_text && b.cta_link) {
    if (/^https?:\/\//.test(b.cta_link) || b.cta_link.startsWith("tel:") || b.cta_link.startsWith("mailto:")) {
      ctas.push({ kind: "href", label: b.cta_text, href: b.cta_link, variant: "gold", external: b.cta_link.startsWith("http") });
    } else {
      ctas.push({ kind: "href", label: b.cta_text, href: b.cta_link, variant: "gold" });
    }
  }
  ctas.push({ kind: "href", label: "Get in Touch", href: "/contact-us", variant: "ghost" });
  return {
    image: resolveLocalImage(b.image_url ?? "", siteImages.hero.welcome),
    eyebrow: "FEATURED",
    titleHead: b.title ?? "",
    titleGold: "",
    subtitle: b.subtitle ?? "",
    ctas,
  };
}

function HeroCarousel() {
  const { data: banners } = useQuery({
    queryKey: ["public-banners"],
    queryFn: listBanners,
    staleTime: 60_000,
  });
  const slides = useMemo<Slide[]>(() => {
    const active = (banners ?? []).filter((b) => b.is_active);
    if (active.length === 0) return fallbackSlides;
    return active.map(bannerToSlide);
  }, [banners]);

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStart = useRef<number | null>(null);

  const go = (i: number) => setIdx(((i % slides.length) + slides.length) % slides.length);
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, slides.length]);

  const slide = slides[Math.min(idx, slides.length - 1)] ?? fallbackSlides[0];


  return (
    <div
      className="relative h-[480px] sm:h-[500px] md:h-[430px] lg:h-[450px] w-full overflow-hidden rounded-[24px] sm:rounded-[28px] md:rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.16)] flex flex-col justify-center [overflow-anchor:none]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
        touchStart.current = null;
      }}
    >
      {/* slides (fade + zoom) */}
      <AnimatePresence mode="sync">
        <motion.div
          key={idx}
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <HeroSlide slide={slide} active />
        </motion.div>
      </AnimatePresence>

      {/* content */}
      <div className="relative z-10 flex h-full items-center pt-7 pb-20 sm:py-10 md:py-0">
        <div className="w-full px-4 sm:px-6 md:pl-14 md:pr-10 lg:pl-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={false}
              animate="show"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
              }}
              className="max-w-[620px]"
            >
              {slide.eyebrow ? (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-white/5 px-2.5 py-1 text-[10px] md:px-3 md:py-1.5 md:text-[11px] font-semibold tracking-[2.5px] md:tracking-[3px] text-gold backdrop-blur"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  ✦ {slide.eyebrow}
                </motion.div>
              ) : null}

              <motion.h1
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
                }}
                className="mt-3 md:mt-5 text-[28px] sm:text-[36px] font-bold leading-[1.12] text-white md:text-[46px] md:leading-[1.08]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {slide.titleHead}
                <span className="italic text-gold" style={{ background: "linear-gradient(135deg,#E4C06F,#C8A34D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {slide.titleGold}
                </span>
                {slide.titleTail}
              </motion.h1>

              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
                className="mt-2.5 md:mt-4 max-w-[560px] text-[13px] sm:text-[14px] leading-relaxed text-white/85 md:text-[15px]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {slide.subtitle}
              </motion.p>

              {/* Mobile: action pills replace the CTA buttons */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
                className="mt-4 md:hidden"
              >
                <HeroActionPills />
              </motion.div>

              {/* Desktop/tablet: original CTA buttons */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
                className="mt-7 hidden flex-col gap-3 md:flex md:flex-row md:flex-wrap"
              >
                {slide.ctas.map((c: CTA) => (
                  <CtaButton key={c.label} cta={c} />
                ))}
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                <HeroSearchBar />
                <div className="hidden md:block">
                  <HeroActionPills />
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* arrows */}
      <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-y-1/2 md:block" style={{ left: "auto", right: 24 }}>
        <div className="flex flex-col gap-2">
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/12 text-white backdrop-blur-md transition hover:bg-white hover:text-charcoal"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/12 text-white backdrop-blur-md transition hover:bg-white hover:text-charcoal"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* bottom-right control row (mobile arrows + dots; desktop dots) */}
      <div className="absolute bottom-3.5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-transparent px-4 py-1.5 md:bottom-6 md:left-auto md:right-8 md:z-10 md:translate-x-0 md:bg-black/25 md:py-2.5 md:shadow-lg">
        <div className="md:hidden">
          <HeroNavigationArrows onPrev={prev} onNext={next} />
        </div>
        <div className="hidden md:block">
          <HeroDots count={slides.length} active={idx} onSelect={go} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- HomeHero ---------------- */

export function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-2 pt-[70px] sm:px-4 sm:pt-[76px]">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <HeroCarousel />
      </motion.div>
    </section>
  );
}
