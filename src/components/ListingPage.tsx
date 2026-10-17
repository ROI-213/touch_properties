import { siteImages } from "@/data/siteImages";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
  Building2,
  Home as HomeIcon,
  Trees,
  Store,
  Hotel,
  Search,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyCardSkeleton } from "@/components/PropertyCardSkeleton";
import { CompareModal } from "@/components/CompareModal";
import { SharePropertiesModal } from "@/components/SharePropertiesModal";
import { properties as staticProperties, type Property } from "@/data/properties";
import { useDbProperties } from "@/hooks/useDbProperties";

type Listing = "BUY" | "RENT";

interface Props {
  listingType: Listing;
  type: string; // route param
  initialQuery?: string;
}

const PAGE_SIZE = 12;

const TYPE_OPTIONS = [
  { key: "Apartment", label: "Apartment", icon: Building2, emoji: "🏢" },
  { key: "Villa", label: "Villa", icon: HomeIcon, emoji: "🏡" },
  { key: "Plot", label: "Plot", icon: Trees, emoji: "🌳" },
  { key: "Commercial", label: "Commercial", icon: Store, emoji: "🏪" },
  { key: "Residential", label: "Residential", icon: Hotel, emoji: "🏘️" },
] as const;

const BHK_OPTIONS = ["1", "2", "3", "4", "4+"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

interface Filters {
  city: string;
  areas: string[];
  locality: string;
  minPrice: number;
  maxPrice: number;
  types: string[];
  bhks: string[];
  minSqft: number;
  maxSqft: number;
  builder: string;
  possession: "Any" | "Ready to Move" | "Under Construction";
  furnishing: "Any" | "Furnished" | "Semi-Furnished" | "Unfurnished";
}

const fallbackMaxBudget = (listing: Listing) => (listing === "BUY" ? 100000000 : 500000);

const DEFAULT_FILTERS = (listing: Listing, maxBudget = fallbackMaxBudget(listing)): Filters => ({
  city: "Bangalore",
  areas: [],
  locality: "",
  minPrice: 0,
  maxPrice: maxBudget,
  types: [],
  bhks: [],
  minSqft: 0,
  maxSqft: 10000,
  builder: "",
  possession: "Any",
  furnishing: "Any",
});

export function ListingPage({ listingType, type, initialQuery = "" }: Props) {
  const { data: dbProps = [], isLoading } = useDbProperties();
  const [filters, setFilters] = useState<Filters>(() => {
    const base = DEFAULT_FILTERS(listingType);
    if (type !== "all") {
      const match = TYPE_OPTIONS.find((t) => t.key.toLowerCase() === type.toLowerCase());
      if (match) base.types = [match.key];
    }
    return base;
  });
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const liveProperties = useMemo(
    () => (dbProps.length > 0 ? dbProps : staticProperties),
    [dbProps],
  );

  const baseList = useMemo(
    () =>
      type === "all"
        ? liveProperties
        : liveProperties.filter((p) => p.listingType === listingType),
    [liveProperties, listingType, type],
  );

  const maxBudget = useMemo(() => {
    const highest = Math.max(
      fallbackMaxBudget(listingType),
      ...baseList.map((p) => Number(p.priceValue) || 0),
    );
    return Number.isFinite(highest) && highest > 0 ? highest : fallbackMaxBudget(listingType);
  }, [baseList, listingType]);

  useEffect(() => {
    setFilters((current) => {
      const defaultCap = fallbackMaxBudget(listingType);
      const shouldExpandDefaultCap = current.maxPrice === defaultCap && maxBudget > current.maxPrice;
      return shouldExpandDefaultCap ? { ...current, maxPrice: maxBudget } : current;
    });
  }, [listingType, maxBudget]);

  const areaOptions = useMemo(
    () => Array.from(new Set(baseList.map((p) => p.area))).sort(),
    [baseList],
  );
  const builderOptions = useMemo(
    () => Array.from(new Set(baseList.map((p) => p.builder))).sort(),
    [baseList],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = baseList.filter((p) => {
      if (q) {
        const hay = [
          p.title,
          p.builder,
          p.area,
          p.location,
          p.city,
          p.type,
          `${p.bhk}bhk`,
          `${p.bhk} bhk`,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.city && p.city !== filters.city) return false;
      if (filters.areas.length && !filters.areas.includes(p.area)) return false;
      if (
        filters.locality &&
        !p.location.toLowerCase().includes(filters.locality.toLowerCase())
      )
        return false;
      if (p.priceValue < filters.minPrice || p.priceValue > filters.maxPrice) return false;
      if (filters.types.length && !filters.types.includes(p.type)) return false;
      if (filters.bhks.length) {
        const bhkStr = p.bhk >= 4 ? (p.bhk > 4 ? "4+" : "4") : String(p.bhk);
        if (!filters.bhks.includes(bhkStr)) return false;
      }
      if (p.sqft < filters.minSqft || (filters.maxSqft < 10000 && p.sqft > filters.maxSqft)) return false;
      if (
        filters.builder &&
        !p.builder.toLowerCase().includes(filters.builder.toLowerCase())
      )
        return false;
      if (filters.possession !== "Any" && p.possession !== filters.possession) return false;
      if (filters.furnishing !== "Any" && p.furnishing !== filters.furnishing) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.priceValue - b.priceValue;
        case "price-desc":
          return b.priceValue - a.priceValue;
        case "viewed":
          return (b.views ?? 0) - (a.views ?? 0);
        case "featured":
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        case "newest":
        default:
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }
    });
    return list;
  }, [baseList, filters, sort, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS(listingType, maxBudget));
    setQuery("");
    setPage(1);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const activeChips: { label: string; clear: () => void }[] = [];
  filters.areas.forEach((a) =>
    activeChips.push({
      label: a,
      clear: () => update("areas", filters.areas.filter((x) => x !== a)),
    }),
  );
  filters.types.forEach((t) =>
    activeChips.push({
      label: t,
      clear: () => update("types", filters.types.filter((x) => x !== t)),
    }),
  );
  filters.bhks.forEach((b) =>
    activeChips.push({
      label: `${b} BHK`,
      clear: () => update("bhks", filters.bhks.filter((x) => x !== b)),
    }),
  );
  if (filters.possession !== "Any")
    activeChips.push({ label: filters.possession, clear: () => update("possession", "Any") });
  if (filters.furnishing !== "Any")
    activeChips.push({ label: filters.furnishing, clear: () => update("furnishing", "Any") });
  if (filters.builder)
    activeChips.push({ label: filters.builder, clear: () => update("builder", "") });
  if (filters.locality)
    activeChips.push({ label: filters.locality, clear: () => update("locality", "") });

  const heroTitle =
    type === "all"
      ? `Premium ${listingType === "BUY" ? "Properties for Sale" : "Properties for Rent"} in Bangalore`
      : `Premium ${cap(type)} ${listingType === "BUY" ? "for Sale" : "for Rent"} in Bangalore`;

  const filterPanel = (
    <FilterSidebar
      filters={filters}
      update={update}
      clearAll={clearAll}
      areaOptions={areaOptions}
      builderOptions={builderOptions}
      listingType={listingType}
      maxBudget={maxBudget}
    />
  );

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      {/* Header */}
      <header
        className="relative flex h-[280px] sm:h-[380px] items-end overflow-hidden pb-8 pt-24 sm:pb-12 sm:pt-32 text-ivory"
        style={{
          backgroundImage:
            `url(${siteImages.hero.buy})`,
          backgroundSize: "cover",
          backgroundPosition: "center 55%",
        }}
      >
        <div className="absolute inset-0 bg-[rgba(28,28,30,0.72)] backdrop-blur-[2px]" />
        <div className="relative z-10 mx-auto w-full px-4 md:px-8">
          <nav className="text-[11px] sm:text-[13px] tracking-[1.5px] text-gold">
            <Link to="/" className="hover:underline">HOME</Link>
            <span className="mx-2 opacity-60">{">"}</span>
            <span>{listingType === "BUY" ? "BUY" : "RENT"}</span>
            <span className="mx-2 opacity-60">{">"}</span>
            <span>{cap(type).toUpperCase()}</span>
          </nav>
          <h1 className="mt-2.5 sm:mt-3 font-display text-[28px] sm:text-4xl font-bold leading-tight md:text-[52px]">
            {heroTitle}
          </h1>
          <p className="mt-1.5 sm:mt-2 text-sm sm:text-[16px] text-white/75">
            Showing{" "}
            <span className="font-numeric text-gold">
              {filtered.length.toLocaleString("en-IN")}
            </span>{" "}
            verified properties
          </p>
        </div>
      </header>

      <div className="mx-auto grid w-full grid-cols-1 gap-6 sm:gap-8 px-4 py-6 sm:py-10 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] md:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            {filterPanel}
          </div>
        </aside>

        {/* Main */}
        <section>
          {/* Sort bar */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden sm:block text-[15px] text-charcoal">
              <span className="font-semibold">
                {filtered.length.toLocaleString("en-IN")}
              </span>{" "}
              Properties Found
            </p>
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[160px]">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full appearance-none rounded-full border border-charcoal/15 bg-card py-2 pl-3.5 pr-8 text-xs sm:text-sm text-charcoal focus:border-gold focus:outline-none"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="viewed">Most Viewed</option>
                  <option value="featured">Featured First</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/60"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-full border border-charcoal/15">
                  <button
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    className={`grid h-9 w-9 place-items-center ${
                      view === "grid" ? "bg-gold text-white" : "bg-card text-charcoal/60"
                    }`}
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    aria-label="List view"
                    className={`grid h-9 w-9 place-items-center ${
                      view === "list" ? "bg-gold text-white" : "bg-card text-charcoal/60"
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
                <button
                  onClick={() => setShareOpen(true)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-[#21396F]/20 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#21396F] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C8A34D] hover:bg-gradient-to-r hover:from-[#C8A34D] hover:to-[#b8923f] hover:text-white hover:shadow-md"
                  aria-label="Share properties"
                >
                  <Share2 size={14} className="transition-transform group-hover:rotate-12" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Active chips */}
          {activeChips.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {activeChips.map((c, i) => (
                <button
                  key={i}
                  onClick={c.clear}
                  className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-[12px] font-medium text-gold transition hover:bg-gold/25"
                >
                  {c.label}
                  <X size={12} />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="text-[12px] font-medium text-charcoal/60 underline hover:text-charcoal"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid or empty */}
          {isLoading ? (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6"
                  : "flex flex-col gap-5"
              }
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <PropertyCardSkeleton key={i} view={view} />
              ))}
            </div>
          ) : paged.length === 0 ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${safePage}-${view}-${sort}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={
                  view === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6"
                    : "flex flex-col gap-5"
                }
              >
                {paged.map((p, i) => (
                  <PropertyCard
                    key={p.id}
                    p={p}
                    index={i}
                    view={view}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={safePage}
              total={totalPages}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 200, behavior: "smooth" });
              }}
            />
          )}
        </section>
      </div>

      {/* Mobile filters bottom sheet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-[1px] lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-[90] max-h-[88vh] overflow-y-auto rounded-t-3xl bg-ivory p-5 pb-8 shadow-2xl lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold">Refine Search</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-sand"
                >
                  <X size={18} />
                </button>
              </div>
              {filterPanel}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-5 h-12 w-full rounded-full bg-gradient-to-r from-gold to-gold-light text-sm font-semibold text-white shadow-gold"
              >
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SharePropertiesModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        visibleProperties={paged}
        allFilteredProperties={filtered}
        pageTitle={heroTitle}
        filterSummary={{
          city: filters.city,
          areas: filters.areas,
          locality: filters.locality,
          types: filters.types,
          bhks: filters.bhks,
          budget:
            filters.minPrice || filters.maxPrice < (listingType === "BUY" ? 100000000 : 500000)
              ? `${formatINR(filters.minPrice)} - ${formatINR(filters.maxPrice)}`
              : undefined,
          sort,
          viewMode: view,
        }}
      />

      <Footer />
    </div>
  );
}

/* ---------------- Sidebar ---------------- */

function FilterSidebar({
  filters,
  update,
  clearAll,
  areaOptions,
  builderOptions,
  listingType,
  maxBudget,
}: {
  filters: Filters;
  update: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearAll: () => void;
  areaOptions: string[];
  builderOptions: string[];
  listingType: Listing;
  maxBudget: number;
}) {
  const budgetChips =
    listingType === "BUY"
      ? [
          { label: "Under ₹50L", min: 0, max: 5000000 },
          { label: "₹50L–1Cr", min: 5000000, max: 10000000 },
          { label: "₹1–2Cr", min: 10000000, max: 20000000 },
          { label: "₹2Cr+", min: 20000000, max: maxBudget },
        ]
      : [
          { label: "Under ₹30k", min: 0, max: 30000 },
          { label: "₹30–60k", min: 30000, max: 60000 },
          { label: "₹60k–1L", min: 60000, max: 100000 },
          { label: "₹1L+", min: 100000, max: maxBudget },
        ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-charcoal">Refine Search</h2>
        <button
          onClick={clearAll}
          className="text-[13px] font-medium text-gold hover:text-gold-light"
        >
          Clear All Filters
        </button>
      </div>

      <Group title="Location" defaultOpen>
        <select
          value={filters.city}
          onChange={(e) => update("city", e.target.value)}
          className="w-full rounded-md border border-charcoal/15 bg-card px-3 py-2 text-sm focus:border-gold focus:outline-none"
        >
          {["Bangalore", "Hyderabad", "Chennai", "Mumbai"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
          {areaOptions.map((a) => {
            const checked = filters.areas.includes(a);
            return (
              <label
                key={a}
                className="flex cursor-pointer items-center gap-2 text-[13px] text-charcoal/80"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    update(
                      "areas",
                      checked ? filters.areas.filter((x) => x !== a) : [...filters.areas, a],
                    )
                  }
                  className="h-4 w-4 accent-gold"
                />
                {a}
              </label>
            );
          })}
        </div>

        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search locality…"
            value={filters.locality}
            onChange={(e) => update("locality", e.target.value)}
            className="w-full rounded-md border border-charcoal/15 bg-card py-2 pl-8 pr-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
      </Group>

      <Group title="Budget Range" defaultOpen>
        <RangeSlider
          min={0}
          max={maxBudget}
          step={listingType === "BUY" ? 100000 : 1000}
          value={[filters.minPrice, filters.maxPrice]}
          onChange={([a, b]) => {
            update("minPrice", a);
            update("maxPrice", b);
          }}
        />
        <div className="mt-2 flex items-center justify-between text-[12px] text-charcoal/70">
          <span>{formatINR(filters.minPrice)}</span>
          <span>{formatINR(filters.maxPrice)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.minPrice || ""}
            onChange={(e) => update("minPrice", Number(e.target.value) || 0)}
            className="rounded-md border border-charcoal/15 bg-card px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.maxPrice || ""}
            onChange={(e) => update("maxPrice", Number(e.target.value) || maxBudget)}
            className="rounded-md border border-charcoal/15 bg-card px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {budgetChips.map((b) => {
            const active = filters.minPrice === b.min && filters.maxPrice === b.max;
            return (
              <button
                key={b.label}
                onClick={() => {
                  update("minPrice", b.min);
                  update("maxPrice", b.max);
                }}
                className={`rounded-full px-3 py-1 text-[12px] transition ${
                  active
                    ? "bg-gold text-white"
                    : "bg-sand text-charcoal/75 hover:bg-gold/20"
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Property Type">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_OPTIONS.map((t) => {
            const active = filters.types.includes(t.key);
            return (
              <button
                key={t.key}
                onClick={() =>
                  update(
                    "types",
                    active
                      ? filters.types.filter((x) => x !== t.key)
                      : [...filters.types, t.key],
                  )
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  active
                    ? "bg-gold text-charcoal shadow-card"
                    : "bg-sand text-charcoal/75 hover:bg-gold/20"
                }`}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Bedrooms">
        <div className="flex flex-wrap gap-1.5">
          {BHK_OPTIONS.map((b) => {
            const active = filters.bhks.includes(b);
            return (
              <button
                key={b}
                onClick={() =>
                  update(
                    "bhks",
                    active ? filters.bhks.filter((x) => x !== b) : [...filters.bhks, b],
                  )
                }
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  active ? "bg-gold text-white" : "bg-sand text-charcoal/75 hover:bg-gold/20"
                }`}
              >
                {b} BHK
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Sqft Area">
        <RangeSlider
          min={500}
          max={10000}
          step={50}
          value={[filters.minSqft, filters.maxSqft]}
          onChange={([a, b]) => {
            update("minSqft", a);
            update("maxSqft", b);
          }}
        />
        <div className="mt-2 flex items-center justify-between text-[12px] text-charcoal/70">
          <span>{filters.minSqft.toLocaleString()} sqft</span>
          <span>{filters.maxSqft.toLocaleString()} sqft</span>
        </div>
      </Group>

      <Group title="Builder Name">
        <input
          list="builders"
          type="text"
          placeholder="Search builder…"
          value={filters.builder}
          onChange={(e) => update("builder", e.target.value)}
          className="w-full rounded-md border border-charcoal/15 bg-card px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <datalist id="builders">
          {builderOptions.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </Group>

      <Group title="Possession Status">
        <RadioRow
          value={filters.possession}
          onChange={(v) => update("possession", v as Filters["possession"])}
          options={["Ready to Move", "Under Construction", "Any"]}
        />
      </Group>

      <Group title="Furnishing">
        <RadioRow
          value={filters.furnishing}
          onChange={(v) => update("furnishing", v as Filters["furnishing"])}
          options={["Furnished", "Semi-Furnished", "Unfurnished", "Any"]}
        />
      </Group>

      <button className="mt-2 h-11 w-full rounded-full bg-gradient-to-r from-gold to-gold-light text-sm font-semibold text-white shadow-gold transition hover:opacity-95">
        Apply Filters
      </button>
    </div>
  );
}

function Group({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-charcoal/10 bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-3 text-left text-[13px] font-semibold text-charcoal"
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-charcoal/60" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RadioRow({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
            value === o ? "bg-gold text-white" : "bg-sand text-charcoal/75 hover:bg-gold/20"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [a, b] = value;
  return (
    <div className="relative pt-2">
      <div className="relative h-1.5 rounded-full bg-sand">
        <div
          className="absolute h-1.5 rounded-full bg-gold"
          style={{
            left: `${((a - min) / (max - min)) * 100}%`,
            right: `${100 - ((b - min) / (max - min)) * 100}%`,
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={a}
        onChange={(e) => onChange([Math.min(Number(e.target.value), b), b])}
        className="range-thumb pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={b}
        onChange={(e) => onChange([a, Math.max(Number(e.target.value), a)])}
        className="range-thumb pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
      />
      <style>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          width: 18px; height: 18px; border-radius: 9999px;
          background: #b8962e; border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18); cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 18px; height: 18px; border-radius: 9999px;
          background: #b8962e; border: 2px solid #fff; cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/* ---------------- Pagination ---------------- */

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages: (number | "…")[] = [];
  const add = (n: number | "…") => pages.push(n);
  if (total <= 7) {
    for (let i = 1; i <= total; i++) add(i);
  } else {
    add(1);
    if (page > 3) add("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) add(i);
    if (page < total - 2) add("…");
    add(total);
  }
  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="rounded-full px-3 py-1.5 text-sm text-charcoal/70 disabled:opacity-30 hover:text-gold"
      >
        ← Previous
      </button>
      {pages.map((n, i) =>
        n === "…" ? (
          <span key={i} className="px-2 text-charcoal/40">
            …
          </span>
        ) : (
          <button
            key={i}
            onClick={() => onChange(n)}
            className={`grid h-9 w-9 place-items-center rounded-full text-sm transition ${
              n === page
                ? "bg-gold font-semibold text-white"
                : "text-charcoal/70 hover:text-gold"
            }`}
          >
            {n}
          </button>
        ),
      )}
      <button
        disabled={page === total}
        onClick={() => onChange(page + 1)}
        className="rounded-full px-3 py-1.5 text-sm text-charcoal/70 disabled:opacity-30 hover:text-gold"
      >
        Next →
      </button>
    </nav>
  );
}

/* ---------------- Empty ---------------- */

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-charcoal/15 bg-card/50 px-6 py-20 text-center">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="currentColor" className="mb-6 text-charcoal/30">
        <rect x="30" y="40" width="60" height="60" strokeWidth="2" />
        <line x1="30" y1="55" x2="90" y2="55" strokeWidth="2" />
        <line x1="45" y1="40" x2="45" y2="100" strokeWidth="2" />
        <line x1="60" y1="40" x2="60" y2="100" strokeWidth="2" />
        <line x1="75" y1="40" x2="75" y2="100" strokeWidth="2" />
        <polygon points="25,40 95,40 60,15" strokeWidth="2" />
        <circle cx="60" cy="78" r="3" fill="#b8962e" stroke="none" />
      </svg>
      <h3 className="font-display text-2xl font-semibold text-charcoal">
        No properties found matching your criteria
      </h3>
      <p className="mt-2 text-sm text-charcoal/60">
        Try adjusting or clearing your filters
      </p>
      <button
        onClick={onClear}
        className="mt-6 rounded-full bg-gradient-to-r from-gold to-gold-light px-6 py-2.5 text-sm font-semibold text-white shadow-gold"
      >
        Clear All Filters
      </button>
    </div>
  );
}

// silence unused-warning helper for Property type re-export
export type { Property };
