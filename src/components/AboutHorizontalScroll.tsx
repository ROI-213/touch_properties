import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, useMotionValue, animate } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  Home,
  Tag,
  Key,
  MessageSquare,
  Building2,
  Castle,
  MapPin,
  Briefcase,
  Flame,
  ArrowRight,
  Phone,
  MessageCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAboutContent } from "@/hooks/useSiteSettings";
import { Link } from "@tanstack/react-router";

function journeyLink(title: string): { to: string; params?: any } {
  const t = title.toLowerCase();
  if (t.includes("sell")) return { to: "/sell-property" };
  if (t.includes("rent")) return { to: "/rent-properties/$type", params: { type: "all" } };
  return { to: "/buy-properties/$type", params: { type: "all" } };
}

function resolveLucide(name: string) {
  const I = (LucideIcons as any)[name];
  return (I ?? Home) as React.ComponentType<any>;
}

const JOURNEY_COLORS = [
  "from-[#0a1f44] to-[#1e40af]",
  "from-[#7c2d12] to-[#c9a961]",
  "from-[#064e3b] to-[#10b981]",
];

/* ---------------- Animated Counter ---------------- */
function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const mv = useMotionValue(0);
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.floor(v)),
    });
    return controls.stop;
  }, [inView, to, mv]);

  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}

/* ---------------- Service Card ---------------- */
const services = [
  { icon: Home, title: "Buy Properties", desc: "Find verified apartments, villas, plots, and premium residential projects." },
  { icon: Tag, title: "Sell Properties", desc: "List your property and connect with serious verified buyers." },
  { icon: Key, title: "Rent Properties", desc: "Discover rental homes based on budget, location, and lifestyle." },
  { icon: MessageSquare, title: "Property Consultation", desc: "Get expert support for site visits, documentation, pricing, and negotiation." },
];

function ServiceCard({ icon: Icon, title, desc, i }: { icon: any; title: string; desc: string; i: number }) {
  return (
    <motion.div
      initial={{ y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: i * 0.1 }}
      whileHover={{ y: -8 }}
      className="group relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-7 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] hover:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] transition-shadow"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a3a7e] flex items-center justify-center mb-5 shadow-lg">
        <Icon className="w-7 h-7 text-[#c9a961]" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-serif font-bold text-[#0a1f44] mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
      <div className="absolute top-5 right-5 text-[#c9a961]/30 text-3xl font-serif italic">0{i + 1}</div>
    </motion.div>
  );
}

/* ---------------- Project Card ---------------- */
const projects = [
  { icon: Building2, title: "Premium Apartments", location: "Across Bangalore", grad: "from-[#0a1f44] to-[#1e40af]" },
  { icon: Castle, title: "Luxury Villas", location: "Whitefield, Sarjapur", grad: "from-[#7c2d12] to-[#c9a961]" },
  { icon: MapPin, title: "Residential Plots", location: "Devanahalli, North BLR", grad: "from-[#064e3b] to-[#10b981]" },
  { icon: Briefcase, title: "Commercial Spaces", location: "ORR, MG Road", grad: "from-[#1e1b4b] to-[#6366f1]" },
  { icon: Flame, title: "Hot Properties", location: "Trending Now", grad: "from-[#7f1d1d] to-[#dc2626]" },
];

function ProjectCard({ p, i }: { p: typeof projects[number]; i: number }) {
  const Icon = p.icon;
  return (
    <motion.div
      initial={{ x: 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: i * 0.08 }}
      whileHover={{ y: -10 }}
      className="rounded-3xl overflow-hidden bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)] hover:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.5)] transition-shadow border border-slate-100"
    >
      <div className={`h-36 bg-gradient-to-br ${p.grad} relative overflow-hidden flex items-center justify-center`}>
        <Icon className="w-16 h-16 text-white/90" strokeWidth={1.2} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
      </div>
      <div className="p-5">
        <h4 className="text-lg font-serif font-bold text-[#0a1f44] mb-1">{p.title}</h4>
        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3" /> {p.location}
        </p>
        <button className="text-sm font-medium text-[#c9a961] inline-flex items-center gap-1 group">
          View Details
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}

/* ---------------- Panels ---------------- */
function WhyChoosePanel() {
  return (
    <div className="w-full flex items-center justify-center px-8 lg:px-24">
      <div className="max-w-3xl text-center">
        <motion.div
          initial={{ y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 mb-6"
        >
          <span className="h-px w-10 bg-[#c9a961]" />
          <span className="text-xs tracking-[0.4em] text-[#c9a961] font-medium">WHY CHOOSE US</span>
          <span className="h-px w-10 bg-[#c9a961]" />
        </motion.div>
        <motion.h2
          initial={{ y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-serif text-5xl md:text-7xl font-bold text-[#0a1f44] leading-[1.05] mb-6"
        >
          Why Choose <span className="italic text-[#c9a961]">Touch Stone</span> Properties?
        </motion.h2>
        <motion.p
          initial={{ y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base md:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto"
        >
          We provide verified properties, transparent pricing, expert guidance, and end-to-end support for buying, selling, and renting properties.
        </motion.p>
        <motion.a
          href="#contact"
          initial={{ y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0a1f44] text-white font-medium hover:bg-[#0a1f44]/90 transition-all shadow-lg hover:shadow-xl"
        >
          Contact Us <ArrowRight className="w-4 h-4" />
        </motion.a>
      </div>
    </div>
  );
}

function ServicesPanel() {
  const { content } = useAboutContent();
  const items = content.services?.length ? content.services : services.map((s) => ({ icon: (s.icon as any).displayName ?? "Home", title: s.title, desc: s.desc }));
  return (
    <div className="w-full flex items-center px-8 lg:px-24">
      <div className="w-full mx-auto w-full">
        <div className="mb-10">
          <span className="text-xs tracking-[0.4em] text-[#c9a961] font-medium">— OUR SERVICES</span>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#0a1f44] mt-3">
            Complete Real Estate <span className="italic text-[#c9a961]">Solutions</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((s, i) => (
            <ServiceCard key={`${s.title}-${i}`} icon={resolveLucide(s.icon as any)} title={s.title} desc={s.desc} i={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsPanel() {
  return (
    <div className="w-full flex items-center px-8 lg:px-24">
      <div className="w-full mx-auto w-full">
        <div className="mb-10">
          <span className="text-xs tracking-[0.4em] text-[#c9a961] font-medium">— OUR PROJECTS</span>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#0a1f44] mt-3">
            Curated <span className="italic text-[#c9a961]">Property</span> Categories
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
          {projects.map((p, i) => (
            <ProjectCard key={p.title} p={p} i={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsPanel() {
  const { content } = useAboutContent();
  const stats = content.stats;
  return (
    <div className="w-full flex items-center px-2 sm:px-4">
      <div className="w-full mx-auto">
        <div className="text-center mb-8 sm:mb-14">
          <span className="text-xs tracking-[0.4em] text-[#c9a961] font-medium">— BY THE NUMBERS</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-[#0a1f44] mt-2 sm:mt-3">
            A Decade of <span className="italic text-[#c9a961]">Trust</span>
          </h2>
        </div>
        {/* Mobile: continuous marquee */}
        <div className="md:hidden relative overflow-hidden -mx-4 sm:-mx-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-10 bg-gradient-to-r from-[#faf6ee] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-10 bg-gradient-to-l from-[#faf6ee] to-transparent" />
          <div className="flex w-max py-2" style={{ animation: "stats-marquee 30s linear infinite" }}>
            {[...stats, ...stats].map((s, i) => (
              <div
                key={`${s.label}-${i}`}
                className="mx-2.5 w-[150px] sm:w-[160px] shrink-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white to-[#faf6ee] border border-[#c9a961]/20 p-5 sm:p-6 text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]"
              >
                <div className="font-serif text-3xl sm:text-4xl font-bold bg-gradient-to-br from-[#0a1f44] to-[#c9a961] bg-clip-text text-transparent mb-1.5">
                  {s.value}{s.suffix}
                </div>
                <div className="text-xs text-slate-600 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
          <style>{`@keyframes stats-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
        </div>

        {/* Desktop/tablet: grid */}
        <div className="hidden md:grid grid-cols-2 md:grid-cols-5 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-3xl bg-gradient-to-br from-white to-[#faf6ee] border border-[#c9a961]/20 p-7 text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]"
            >
              <div className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#0a1f44] to-[#c9a961] bg-clip-text text-transparent mb-2">
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs md:text-sm text-slate-600 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneyPanel() {
  const { content } = useAboutContent();
  const journeys = content.journeys;
  const [activeTab, setActiveTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return;
    const nextIndex = (index + journeys.length) % journeys.length;
    const cardWidth = scrollRef.current.clientWidth * 0.85;
    scrollRef.current.scrollTo({
      left: nextIndex * cardWidth,
      behavior: "smooth",
    });
    setActiveTab(nextIndex);
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const index = Math.round(el.scrollLeft / (el.clientWidth * 0.85));
    setActiveTab(Math.min(Math.max(index, 0), journeys.length - 1));
  };

  // Continuous auto-sliding every 3.5 seconds
  useEffect(() => {
    if (paused || journeys.length < 2) return;
    const id = setInterval(() => {
      setActiveTab((prev) => {
        const next = (prev + 1) % journeys.length;
        if (scrollRef.current) {
          const cardWidth = scrollRef.current.clientWidth * 0.85;
          scrollRef.current.scrollTo({
            left: next * cardWidth,
            behavior: "smooth",
          });
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [paused, journeys.length]);

  return (
    <div className="w-full flex items-center px-2 sm:px-4">
      <div className="w-full mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <span className="text-xs tracking-[0.4em] text-[#c9a961] font-medium">— YOUR JOURNEY</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-[#0a1f44] mt-2">
            Buy. Sell. <span className="italic text-[#c9a961]">Rent.</span>
          </h2>
        </div>

        <div
          className="relative [overflow-anchor:none]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {/* Mobile Horizontal Snap Scroll / Desktop Grid */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 px-2 md:px-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible"
          >
            {journeys.map((j, i) => {
              const Icon = resolveLucide(j.icon);
              const color = JOURNEY_COLORS[i % JOURNEY_COLORS.length];
              return (
                <motion.div
                  key={j.title}
                  initial={{ y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  whileHover={{ y: -10 }}
                  className="w-[82vw] sm:w-[70vw] md:w-auto shrink-0 snap-center rounded-3xl overflow-hidden bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] border border-slate-100 flex flex-col justify-between"
                >
                  <div className={`h-36 sm:h-40 bg-gradient-to-br ${color} flex items-center justify-center relative`}>
                    <Icon className="w-14 h-14 sm:w-16 sm:h-16 text-white/95" strokeWidth={1.2} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
                  </div>
                  <div className="p-5 sm:p-7 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-serif text-xl sm:text-3xl font-bold text-[#0a1f44] mb-2 sm:mb-3 tracking-wide">{j.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 sm:mb-5">{j.desc}</p>
                    </div>
                    <Link {...(journeyLink(j.title) as any)} className="text-sm font-semibold text-[#c9a961] inline-flex items-center gap-1 group">
                      Get Started <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile Arrows */}
          <div className="flex md:hidden">
            <button
              onClick={() => scrollToSlide(activeTab - 1)}
              aria-label="Previous card"
              className="absolute left-1 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#0a1f44] shadow-md border border-slate-200"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollToSlide(activeTab + 1)}
              aria-label="Next card"
              className="absolute right-1 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#0a1f44] shadow-md border border-slate-200"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Dot Indicators */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-4">
          {journeys.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === activeTab ? "w-8 bg-[#c9a961]" : "w-2.5 bg-[#c9a961]/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactPanel() {
  return (
    <div className="hidden md:flex w-full items-center justify-center px-8 lg:px-24">
      <div className="relative w-full max-w-5xl rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#0a1f44] via-[#0a1f44] to-[#1a3a7e] p-12 md:p-16 shadow-[0_40px_100px_-40px_rgba(10,31,68,0.6)]">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#c9a961]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#c9a961]/10 blur-3xl" />
        <div className="relative text-center">
          <span className="text-xs tracking-[0.4em] text-[#c9a961] font-medium">— GET IN TOUCH</span>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-white mt-4 mb-5 leading-tight">
            Ready to Find Your <span className="italic text-[#c9a961]">Perfect Property?</span>
          </h2>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto mb-9">
            Whether you want to buy, sell, or rent, Touch Stone Properties is here to guide you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/919902925519" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#25D366] text-white font-semibold hover:bg-[#1eb955] transition-all shadow-lg">
              <MessageCircle className="w-4 h-4" /> WhatsApp Now
            </a>
            <a href="#properties" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 backdrop-blur transition-all">
              <Search className="w-4 h-4" /> Explore Properties
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

const panels = [StatsPanel, JourneyPanel];

function ProgressDot({ index, progress, total }: { index: number; progress: any; total: number }) {
  const width = useTransform(progress, [index / total, (index + 1) / total], [24, 48]);
  const bg = useTransform(
    progress,
    [index / total, (index + 0.5) / total],
    ["rgba(10,31,68,0.2)", "rgba(201,169,97,1)"]
  );
  return <motion.span className="h-1 rounded-full" style={{ width, backgroundColor: bg }} />;
}

/* ---------------- Main Section ---------------- */
export function AboutHorizontalScroll() {
  return (
    <section className="relative bg-gradient-to-b from-[#faf6ee] via-white to-[#faf6ee] py-8 md:py-12 overflow-hidden">
      <BackgroundOrbs />
      <div className="relative space-y-16 md:space-y-24">
        {panels.map((Panel, i) => (
          <div key={i} className="flex items-center">
            <Panel />
          </div>
        ))}
      </div>
    </section>
  );
}

function BackgroundOrbs() {
  return (
    <>
      <motion.div
        animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-10 w-[28rem] h-[28rem] rounded-full bg-[#c9a961]/15 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -60, 0], y: [0, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-20 w-[32rem] h-[32rem] rounded-full bg-[#0a1f44]/10 blur-[140px] pointer-events-none"
      />
    </>
  );
}
