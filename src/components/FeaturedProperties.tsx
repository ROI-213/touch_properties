import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  TrendingUp,
  Bed,
  Maximize,
  ArrowRight,
} from "lucide-react";
import { properties as staticProperties, type Property } from "@/data/properties";
import { useDbProperties } from "@/hooks/useDbProperties";
import { resolveLocalImage, FALLBACK_PROPERTY_IMAGE } from "@/data/siteImages";
import { useEnquireModal } from "@/contexts/EnquireModalContext";
import { useContentSection } from "@/hooks/useContentSection";
import { PropertyCard } from "./PropertyCard";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";

const tabs = ["Latest Listings", "Premium Properties", "Trending"] as const;
type Tab = (typeof tabs)[number];

function FeaturedProjectCard({ p }: { p: Property }) {
  const enquire = useEnquireModal();

  // Price formatting
  const priceRaw = p.price || "Price on request";
  const priceDisplay =
    priceRaw.toLowerCase().includes("onwards") || priceRaw.toLowerCase().includes("request")
      ? priceRaw
      : `₹ ${priceRaw} Onwards`;

  const badgeText = p.premium ? "Premium" : p.trending ? "Trending" : "Featured";

  return (
    <article className="group relative flex flex-row items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-2.5 sm:p-3.5 shadow-xs hover:shadow-md transition-all duration-300 gap-2.5 sm:gap-4">
      {/* Left Thumbnail Image */}
      <div className="relative shrink-0 w-24 h-24 sm:w-36 sm:h-28 overflow-hidden rounded-xl bg-slate-100">
        <img
          src={resolveLocalImage(p.image, FALLBACK_PROPERTY_IMAGE)}
          alt={p.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_PROPERTY_IMAGE;
          }}
        />

        {/* Badge Top-Left */}
        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-[#B8962E] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs">
          {p.premium ? <Star size={9} className="fill-white" /> : <TrendingUp size={9} />}
          {badgeText}
        </span>
      </div>

      {/* Middle Details */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        {/* Builder Name */}
        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#B8962E] truncate">
          {p.builder || "Touchstone Properties"}
        </div>

        {/* Title */}
        <h3 className="mt-0.5 font-display text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
          {p.title}
        </h3>

        {/* Location */}
        <div className="mt-0.5 flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 min-w-0">
          <MapPin size={11} className="shrink-0 text-[#B8962E]" />
          <span className="truncate">{p.location}</span>
        </div>

        {/* Price */}
        <div className="mt-1 font-numeric text-xs sm:text-base font-bold text-slate-900 truncate">
          {priceDisplay}
        </div>

        {/* Specs Badges */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1 w-full max-w-full overflow-hidden">
          {p.bhk > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-[#F5F2EC] px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 border border-black/5">
              <Bed size={10} className="text-[#B8962E]" />
              {p.bhk} BHK
            </span>
          )}
          {p.sqft > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-[#F5F2EC] px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 border border-black/5">
              <Maximize size={10} className="text-[#B8962E]" />
              {p.sqft.toLocaleString()} sqft
            </span>
          )}
          {p.possession && (
            <span className="hidden xs:inline-flex sm:inline-flex items-center rounded-md bg-[#E8F0E9] px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-100">
              {p.possession}
            </span>
          )}
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 ml-1">
        <Link
          to="/property/$slug"
          params={{ slug: p.slug }}
          className="inline-flex items-center justify-center rounded-xl border border-[#B8962E] px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#B8962E] transition-all hover:bg-[#B8962E] hover:text-white shadow-xs whitespace-nowrap"
        >
          View
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            enquire.open({
              id: p.id,
              title: p.title,
              location: p.location,
              price: p.price,
              assignedStaffId: (p as any).assignedStaffId ?? null,
            });
          }}
          aria-label={`Enquire about ${p.title}`}
          className="grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-full border border-[#B8962E]/40 text-[#B8962E] transition-colors hover:bg-[#B8962E] hover:text-white shadow-xs"
        >
          <Phone size={13} />
        </button>
      </div>
    </article>
  );
}

function FeaturedProjectCardSkeleton() {
  return (
    <div className="flex flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-3.5 animate-pulse gap-3">
      <div className="w-24 h-24 sm:w-36 sm:h-28 shrink-0 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-2.5 w-20 rounded bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-2.5 w-1/2 rounded bg-slate-200" />
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="flex gap-1.5">
          <div className="h-4 w-12 rounded bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-200" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="h-7 w-12 rounded-xl bg-slate-200" />
        <div className="h-7 w-7 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export function FeaturedProperties() {
  const [tab, setTab] = useState<Tab>("Latest Listings");
  const { data: dbProps = [], isLoading } = useDbProperties();
  const heading = useContentSection("home.featured", {
    title: "Featured Properties",
    subtitle: "Premium & Verified Listings",
  });

  const list = useMemo(() => {
    const combined = [
      ...(Array.isArray(dbProps) ? dbProps : []),
      ...(Array.isArray(staticProperties) ? staticProperties : []),
    ];
    const seen = new Set<string>();
    const unique = combined.filter((p) => {
      const key = String(p.id ?? p.slug ?? p.title);
      const slugKey = `slug:${p.slug ?? ""}`;
      const titleKey = `title:${(p.title ?? "").trim().toLowerCase()}`;
      if (seen.has(key) || (p.slug && seen.has(slugKey)) || seen.has(titleKey)) return false;
      seen.add(key);
      if (p.slug) seen.add(slugKey);
      seen.add(titleKey);
      return true;
    });
    const sorted = [...unique].sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
    return sorted.filter((p) => {
      if (tab === "Premium Properties") return p.premium;
      if (tab === "Trending") return p.trending;
      return true;
    });
  }, [dbProps, tab]);

  const latestTwelve = useMemo(() => {
    return list.slice(0, 12);
  }, [list]);

  // Group into chunks of 4 for mobile (4 visible in row layout, scroll down for next 4, then next 4)
  const mobileBatchesOfFour = useMemo(() => {
    const batches: Property[][] = [];
    for (let i = 0; i < latestTwelve.length; i += 4) {
      batches.push(latestTwelve.slice(i, i + 4));
    }
    return batches;
  }, [latestTwelve]);

  return (
    <>
      {/* MOBILE VIEW (< md): 4 horizontal row cards visible at a time; scroll down 4 by 4 */}
      <section className="block md:hidden relative bg-[#FAF8F5] py-6 px-3 sm:px-4">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-3.5 sm:p-5 shadow-sm border border-slate-200/60">
          {/* Top Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              Featured Properties
            </h2>
            <Link
              to="/buy-properties/$type"
              params={{ type: "all" }}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#B8962E] hover:underline"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile Category Filter Pills */}
          <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  tab === t
                    ? "bg-[#B8962E] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Scrollable 4-by-4 Row List (shows 4 row cards at a time, scroll down for next 4, then 4) */}
          <div className="mt-4 h-[508px] sm:h-[580px] overflow-y-auto snap-y snap-mandatory pr-0.5 scroll-smooth flex flex-col gap-2.5">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <FeaturedProjectCardSkeleton key={i} />)
              : mobileBatchesOfFour.map((batch, batchIdx) => (
                  <div
                    key={batchIdx}
                    data-batch={batchIdx + 1}
                    className="snap-start snap-always shrink-0 flex flex-col gap-2.5 min-h-[500px] sm:min-h-[572px]"
                  >
                    {batch.map((p) => (
                      <FeaturedProjectCard key={p.id} p={p} />
                    ))}
                  </div>
                ))}
          </div>

          {/* View All Properties Button (Mobile) */}
          <div className="mt-4 text-center">
            <Link
              to="/buy-properties/$type"
              params={{ type: "all" }}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[#B8962E] bg-[#B8962E]/5 px-6 text-xs font-bold text-[#B8962E] transition-all hover:bg-[#B8962E] hover:text-white"
            >
              View All Properties <ArrowRight size={14} />
            </Link>
          </div>

          {/* RERA Footer */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3.5">
            <ShieldCheck size={15} className="text-[#B8962E]" />
            <span>RERA Registered Projects</span>
          </div>
        </div>
      </section>

      {/* DESKTOP VIEW (md: and above): 4-column grid showing latest 12 with View All button */}
      <section className="hidden md:block bg-ivory px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 h-px w-10 bg-gold" />
            <h2 className="font-display text-[40px] md:text-[50px] font-bold text-charcoal">
              {heading.title}
            </h2>
            <p className="mt-2 text-base text-charcoal/60">
              {heading.subtitle}
            </p>
          </motion.div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-charcoal/10">
            <div className="flex flex-wrap gap-8">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    tab === t ? "text-charcoal" : "text-charcoal/50 hover:text-charcoal/80"
                  }`}
                >
                  {t}
                  {tab === t && (
                    <motion.div
                      layoutId="feat-tab-desktop"
                      className="absolute inset-x-0 -bottom-px h-[2px] bg-gold"
                    />
                  )}
                </button>
              ))}
            </div>
            <Link
              to="/buy-properties/$type"
              params={{ type: "all" }}
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition-colors hover:text-charcoal"
            >
              View All Properties <ArrowRight size={15} />
            </Link>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)
                : latestTwelve.map((p, i) => <PropertyCard key={p.id} p={p} index={i} />)}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 text-center">
            <Link
              to="/buy-properties/$type"
              params={{ type: "all" }}
              className="inline-flex h-12 px-8 items-center justify-center gap-2 rounded-full border-[1.5px] border-gold text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-white"
            >
              View All Properties <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default FeaturedProperties;
