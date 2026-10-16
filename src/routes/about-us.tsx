import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { motion, useInView } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { ArrowRight, CheckCircle2, MapPin, Building2, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { siteImages } from "@/data/siteImages";
import {
  ABOUT_PAGE_DEFAULTS,
  getAboutPageContent, type AboutPageContent,
  type AboutHeroBlock, type AboutIntroBlock, type AboutMVVBlock, type AboutTrustBlock,
  type AboutStatsBlock, type AboutServicesBlock, type AboutProcessBlock, type AboutCTABlock,
} from "@/lib/site-cms";

const aboutPageQueryOptions = queryOptions({
  queryKey: ["site-about-page"],
  queryFn: getAboutPageContent,
  initialData: ABOUT_PAGE_DEFAULTS,
  staleTime: 60_000,
});

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title: "About Touch Stone Properties | Trusted Real Estate Broker" },
      {
        name: "description",
        content:
          "Learn about Touch Stone Properties, a trusted real estate partner for buying, selling, and renting verified residential and commercial properties.",
      },
      { property: "og:title", content: "About Touch Stone Properties" },
      {
        property: "og:description",
        content: "Trusted real estate partner for verified buy, sell and rent property solutions.",
      },
      { property: "og:url", content: "/about-us" },
    ],
    links: [{ rel: "canonical", href: "/about-us" }],
  }),
  component: AboutUsPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-charcoal">About Us content could not load</h1>
        <p className="mt-3 text-sm text-charcoal/65">{error.message}</p>
      </main>
      <Footer />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-charcoal">About Us content not found</h1>
      </main>
      <Footer />
    </div>
  ),
});

function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const I = (LucideIcons as any)[name] ?? LucideIcons.Sparkles;
  return <I size={size} className={className} />;
}

function AboutUsPage() {
  const { data: content = ABOUT_PAGE_DEFAULTS } = useQuery(aboutPageQueryOptions);

  const ordered = (Object.keys(content) as (keyof AboutPageContent)[])
    .filter((k) => content[k]?.active !== false)
    .sort((a, b) => (content[a]?.order ?? 0) - (content[b]?.order ?? 0));

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      {ordered.map((k) => {
        switch (k) {
          case "hero": return <Hero key={k} block={content.hero} />;
          case "intro": return <CompanyIntro key={k} block={content.intro} />;
          case "mvv": return <MissionVisionValues key={k} block={content.mvv} />;
          case "trust": return <WhyTrust key={k} block={content.trust} />;
          case "stats": return <StatsBand key={k} block={content.stats} />;
          case "services": return <Services key={k} block={content.services} />;
          case "process": return <Process key={k} block={content.process} />;
          case "cta": return <FinalCTA key={k} block={content.cta} />;
          default: return null;
        }
      })}
      <Footer />
    </div>
  );
}

/* ----------------------- HERO ----------------------- */
function Hero({ block }: { block: AboutHeroBlock }) {
  const crumbs = block.breadcrumb.split("/").map((s) => s.trim()).filter(Boolean);
  return (
    <section id="company-overview" className="relative flex h-[45vh] min-h-[360px] w-full items-center justify-center overflow-hidden md:h-[60vh]">
      <motion.div initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 2.5, ease: "easeOut" }} className="absolute inset-0">
        <img src={block.image_url || siteImages.hero.about} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/60 to-charcoal/85" />
      </motion.div>
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-4xl font-bold leading-tight text-ivory md:text-6xl">{block.title}</motion.h1>
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mt-5 max-w-2xl text-base text-ivory/85 md:text-lg">{block.subtitle}</motion.p>
        <motion.nav aria-label="Breadcrumb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-sm text-ivory/70">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i === 0 ? <Link to="/" className="hover:text-gold">{c}</Link> : <span className="text-gold">{c}</span>}
              {i < crumbs.length - 1 && <span className="mx-2 text-gold">/</span>}
            </span>
          ))}
        </motion.nav>
      </div>
    </section>
  );
}

/* ----------------------- COMPANY INTRO ----------------------- */
function CompanyIntro({ block }: { block: AboutIntroBlock }) {
  return (
    <section className="px-4 py-12 sm:py-16 lg:px-6 overflow-hidden">
      <div className="mx-auto grid w-full items-center gap-10 sm:gap-14 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }}
          className="relative order-1 h-[340px] sm:h-[460px] lg:order-none md:h-[540px]">
          <div className="absolute left-0 top-0 h-[70%] w-[75%] overflow-hidden rounded-2xl shadow-elevated">
            <img src={block.image1_url || siteImages.about.villa} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 h-[60%] w-[60%] overflow-hidden rounded-2xl border-4 border-ivory shadow-elevated">
            <img src={block.image2_url || siteImages.about.interior} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
          {(block.badge_title || block.badge_subtitle) && (
            <div className="absolute left-2 sm:-left-3 bottom-4 sm:bottom-6 rounded-xl bg-gold px-4 py-3 sm:px-5 sm:py-4 text-charcoal shadow-elevated md:bottom-12">
              <div className="font-display text-xl sm:text-2xl font-bold leading-none">{block.badge_title}</div>
              <div className="text-[11px] sm:text-xs font-semibold tracking-wide">{block.badge_subtitle}</div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }}>
          {block.label && (
            <div className="inline-block rounded-full bg-gold/15 px-3 py-1 text-[12px] font-semibold tracking-[2px] text-gold">{block.label}</div>
          )}
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-charcoal md:text-[44px]">{block.title}</h2>
          <ul className="mt-6 space-y-3 text-[15px] leading-[1.7] text-charcoal/80">
            {block.bullets.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {block.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                  <Icon name={p.icon} size={18} />
                </span>
                <span className="text-[15px] font-medium text-charcoal/85">{p.text}</span>
              </li>
            ))}
          </ul>
          {block.cta_label && (
            <a href={block.cta_href || "#"}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-gold hover:text-charcoal">
              {block.cta_label} <ArrowRight size={16} />
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ----------------------- MVV ----------------------- */
function MissionVisionValues({ block }: { block: AboutMVVBlock }) {
  return (
    <section id="mission-vision" className="bg-sand px-4 py-12 sm:py-16 lg:px-6">
      <div className="mx-auto w-full">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-charcoal md:text-[44px]">{block.heading}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-charcoal/65">{block.subheading}</p>
        </div>
        <div className="mt-10 sm:mt-12 grid gap-5 sm:gap-6 md:grid-cols-3">
          {block.cards.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 shadow-card transition hover:-translate-y-2 hover:shadow-elevated">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-gold/70 to-gold" />
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-gold/15 text-gold">
                <Icon name={c.icon} size={26} />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold text-charcoal">{c.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-charcoal/70">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- WHY TRUST ----------------------- */
function WhyTrust({ block }: { block: AboutTrustBlock }) {
  return (
    <section id="why-choose-us" className="relative overflow-hidden px-4 py-12 pb-16 sm:py-16 lg:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.08),transparent_50%)]" />
      <div className="relative mx-auto grid w-full items-center gap-10 sm:gap-14 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          {block.label && (
            <div className="inline-block rounded-full bg-gold/15 px-3 py-1 text-[12px] font-semibold tracking-[2px] text-gold">{block.label}</div>
          )}
          <h2 className="mt-4 font-display text-3xl font-bold text-charcoal md:text-[40px]">{block.title}</h2>
          <ul className="mt-6 space-y-4">
            {block.points.map((t, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={20} />
                <span className="text-[15.5px] leading-[1.65] text-charcoal/80">{t}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="relative h-[340px] sm:h-[460px] md:h-[520px]">
          <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-elevated">
            <img src={block.image_url || siteImages.about.whyChoose} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
          {block.banner_text && (
            <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 w-[92%] sm:w-[88%] -translate-x-1/2 rounded-2xl bg-charcoal px-4 py-3.5 sm:px-6 sm:py-5 text-center text-ivory shadow-elevated">
              <div className="font-display text-sm sm:text-base font-semibold md:text-lg">{block.banner_text}</div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ----------------------- STATS ----------------------- */
function StatsBand({ block }: { block: AboutStatsBlock }) {
  return (
    <section className="bg-charcoal px-4 py-12 sm:py-16 lg:px-6">
      <div className="mx-auto grid w-full grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
        {block.items.map((s, i) => (
          <Counter key={i} n={s.value} suffix={s.suffix} label={s.label} />
        ))}
      </div>
    </section>
  );
}
function Counter({ n, suffix = "", label }: { n: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now(); const dur = 1500; let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.round(n * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, n]);
  return (
    <div ref={ref} className="text-center">
      <div className="font-numeric text-3xl sm:text-4xl font-bold text-gold md:text-[52px]">{val.toLocaleString("en-IN")}{suffix}</div>
      <div className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] font-medium uppercase tracking-wide text-ivory/80 md:text-sm">{label}</div>
    </div>
  );
}

/* ----------------------- SERVICES ----------------------- */
function Services({ block }: { block: AboutServicesBlock }) {
  return (
    <section id="our-services" className="bg-sand px-4 py-16 lg:px-6">
      <div className="mx-auto w-full">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-charcoal md:text-[44px]">{block.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-charcoal/65">{block.subtitle}</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {block.items.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-charcoal/5 bg-card p-7 shadow-card transition hover:-translate-y-1 hover:border-gold/40 hover:shadow-elevated">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-ivory">
                <Icon name={s.icon} size={22} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-charcoal">{s.title}</h3>
              <p className="mt-2 text-[14.5px] leading-[1.65] text-charcoal/70">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- PROCESS ----------------------- */
function Process({ block }: { block: AboutProcessBlock }) {
  const steps = block.steps;
  return (
    <section id="our-process" className="px-4 py-16 lg:px-6">
      <div className="mx-auto w-full">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-charcoal md:text-[44px]">{block.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-charcoal/65">{block.subtitle}</p>
        </div>

        <div className="relative mt-16 hidden lg:block">
          <div className="absolute left-0 right-0 top-7 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${steps.length || 1}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }} className="group text-center">
                <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-charcoal font-display text-lg font-bold text-gold ring-4 ring-ivory transition group-hover:bg-gold group-hover:text-charcoal">
                  {i + 1}
                </div>
                <h4 className="mt-4 font-display text-base font-semibold text-charcoal">{s.title}</h4>
                <p className="mt-2 text-[13px] leading-[1.6] text-charcoal/65">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative mt-12 lg:hidden">
          <div className="absolute bottom-0 left-7 top-0 w-[2px] bg-gold/30" />
          <div className="space-y-8">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }} className="relative flex gap-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-charcoal font-display text-lg font-bold text-gold ring-4 ring-ivory">
                  {i + 1}
                </div>
                <div className="pt-2">
                  <h4 className="font-display text-lg font-semibold text-charcoal">{s.title}</h4>
                  <p className="mt-1 text-[14px] leading-[1.6] text-charcoal/70">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------- FINAL CTA ----------------------- */
function FinalCTA({ block }: { block: AboutCTABlock }) {
  return (
    <section id="contact-cta" className="relative overflow-hidden px-4 py-16 md:py-20 lg:px-6">
      <div className="absolute inset-0">
        <img src={block.image_url || siteImages.hero.skyline} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/95 via-charcoal/85 to-gold/40" />
      </div>
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="font-display text-3xl font-bold leading-tight text-ivory md:text-[44px]">
          {block.title}
        </motion.h2>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.7] text-ivory/85 md:text-base">{block.body}</p>
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          {block.cta_label && (
            <a href={block.cta_href || "#"} className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-charcoal transition hover:scale-105">
              <MapPin size={16} /> {block.cta_label}
            </a>
          )}
          {block.secondary_label && (
            <a href={block.secondary_href || "#"} className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory/30 bg-ivory/10 px-7 py-3 text-sm font-semibold text-ivory backdrop-blur transition hover:bg-ivory hover:text-charcoal">
              <Building2 size={16} /> {block.secondary_label}
            </a>
          )}
          {block.whatsapp_label && block.whatsapp_url && (
            <a href={block.whatsapp_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-7 py-3 text-sm font-semibold text-white transition hover:scale-105">
              <MessageCircle size={16} /> {block.whatsapp_label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
