import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSearchFilters, SEARCH_FILTERS_DEFAULTS } from "@/lib/site-cms";
import { useFormOptions } from "@/lib/form-options";

const WHATSAPP_NUMBER = "9902925519"; // configured target

const normalizeArray = (values?: string[]) => values ?? [];

export function SearchPanel() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: filters = SEARCH_FILTERS_DEFAULTS } = useQuery({
    queryKey: ["search-filters"],
    queryFn: getSearchFilters,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Realtime: any change to site_settings (admin save) refetches instantly.
  useEffect(() => {
    const ch = supabase
      .channel("search-filters-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.search_filters" },
        () => qc.invalidateQueries({ queryKey: ["search-filters"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const tabs = normalizeArray(filters.listing_types);
  
  const propTypeOptions = useFormOptions("search", "property_type", normalizeArray(filters.property_types));
  const propTypes = useMemo(() => propTypeOptions.map((o) => o.value), [propTypeOptions]);

  const bhkOptionsRaw = useFormOptions("search", "bhk", normalizeArray(filters.bhk_options));
  const bhks = useMemo(() => bhkOptionsRaw.map((o) => (/bhk/i.test(o.value) ? o.value : `${o.value}BHK`)), [bhkOptionsRaw]);

  const defaultTab = tabs.includes(filters.default_tab) ? filters.default_tab : (tabs[0] ?? "Buy");
  const [tab, setTab] = useState<string>(defaultTab);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBhks, setSelectedBhks] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fmtPrice = (n: number) =>
    n >= 10000000 ? `₹ ${(n / 10000000).toFixed(n % 10000000 ? 1 : 0)} Cr`
      : n >= 100000 ? `₹ ${Math.round(n / 100000)} L`
      : n >= 1000 ? `₹ ${Math.round(n / 1000)} K`
      : `₹ ${n}`;
  const pricePresets = tab === "Rent" ? (filters.price_presets_rent ?? []) : (filters.price_presets_buy ?? []);
  const minBudgetOptionsCms = pricePresets.map((p) => ({ value: fmtPrice(p.min), label: fmtPrice(p.min) }));
  const maxBudgetOptionsCms = pricePresets.map((p) => ({ value: fmtPrice(p.max), label: fmtPrice(p.max) }));

  const cityOptions = useFormOptions("search", "city", normalizeArray(filters.cities));
  const localityOptions = useFormOptions("search", "locality", normalizeArray(filters.areas));
  
  const minBudgetOptions = minBudgetOptionsCms.length ? minBudgetOptionsCms : [];
  const maxBudgetOptions = maxBudgetOptionsCms.length ? maxBudgetOptionsCms : [];

  // controlled inputs we need at submit time
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [locality, setLocality] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [minSqft, setMinSqft] = useState("");
  const [maxSqft, setMaxSqft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const cityValues = useMemo(() => cityOptions.map((option) => option.value), [cityOptions]);
  const localityValues = useMemo(() => localityOptions.map((option) => option.value), [localityOptions]);

  useEffect(() => {
    if (tabs.length && !tabs.includes(tab)) {
      setTab(defaultTab);
    }
  }, [defaultTab, tab, tabs]);

  useEffect(() => {
    if (cityValues.length && (!city || !cityValues.includes(city))) {
      setCity(cityValues[0]);
    }
    if (!cityValues.length && city) setCity("");
  }, [city, cityValues]);

  useEffect(() => {
    if (localityValues.length && (!zone || !localityValues.includes(zone))) {
      setZone(localityValues[0]);
    }
    if (!localityValues.length && zone) setZone("");
  }, [zone, localityValues]);

  // Hide form when admin disabled it (placed AFTER all hooks to respect Rules of Hooks).
  if (filters.is_visible === false) return null;


  const toggle = (arr: string[], set: (a: string[]) => void, v: string) => {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const buildSummary = () => {
    const lines = [
      `*New ${tab} Enquiry — Touch Stone Properties*`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `City: ${city}`,
      `Area / Zone: ${zone}`,
      locality && `Locality: ${locality}`,
      (minBudget || maxBudget) && `Budget: ${minBudget || "Any"} – ${maxBudget || "Any"}`,
      selectedTypes.length && `Property Type: ${selectedTypes.join(", ")}`,
      selectedBhks.length && `BHK: ${selectedBhks.join(", ")}`,
      (minSqft || maxSqft) && `Sqft: ${minSqft || "Any"} – ${maxSqft || "Any"}`,
      keyword && `Builder / Project: ${keyword}`,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Buy / Rent → navigate to the properties listing page with filters as query,
    // no contact details required, no WhatsApp handoff.
    if (tab !== "Sell") {
      const q = [keyword, locality, zone, city, ...selectedTypes, ...selectedBhks]
        .map((v) => (v ?? "").toString().trim())
        .filter(Boolean)
        .join(" ")
        .slice(0, 200);
      const route = tab === "Rent" ? "/rent-properties/$type" : "/buy-properties/$type";
      navigate({
        to: route,
        params: { type: "all" },
        search: q ? { q } : undefined,
      } as never);
      return;
    }

    // Sell tab → keep enquiry insert + WhatsApp handoff.
    if (filters.show_contact_details !== false) {
      if (!name.trim() || !phone.trim() || !email.trim()) {
        toast.error("Please fill in your name, phone and email.");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        toast.error("Please enter a valid email address.");
        return;
      }
      if (!/^[+\d][\d\s\-()]{6,}$/.test(phone.trim())) {
        toast.error("Please enter a valid phone number.");
        return;
      }
    }

    setSubmitting(true);
    const message = buildSummary();

    try {
      const { error } = await supabase.from("enquiries").insert({
        name: name.trim().slice(0, 100),
        phone: phone.trim().slice(0, 30),
        email: email.trim().slice(0, 255),
        requirement_type: `${tab} Enquiry`,
        location: [locality, zone, city].filter(Boolean).join(", ").slice(0, 200),
        budget: [minBudget, maxBudget].filter(Boolean).join(" – ").slice(0, 100),
        message: message.slice(0, 2000),
        source: "Home Search Panel",
        page_url: typeof window !== "undefined" ? window.location.href : "",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "",
      });
      if (error) throw error;

      toast.success("Enquiry submitted! Opening WhatsApp…");

      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");

      setName("");
      setPhone("");
      setEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit enquiry";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6 }}
      className="relative z-20 mx-auto mt-3 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] rounded-2xl border-t-4 border-gold p-3.5 sm:p-5 md:p-6 shadow-elevated md:-mt-[40px]"
      style={{
        background: "rgba(248,245,240,0.97)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Tabs */}
      <div className="flex justify-center gap-6 sm:gap-8 border-b border-charcoal/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-2 pb-1.5 text-xs sm:text-sm font-medium transition-colors ${
              tab === t ? "text-charcoal font-semibold" : "text-charcoal/50"
            }`}
          >
            {t}
            {tab === t && (
              <motion.div
                layoutId="tab-underline"
                className="absolute -bottom-[9px] left-0 right-0 h-[2px] bg-gold"
              />
            )}
          </button>
        ))}
      </div>

      {/* Compact 4-Section Filter Grid */}
      <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {/* 1. City */}
          <div className="min-w-0">
            <Select label="City" value={city} onChange={(e) => setCity(e.target.value)}>
              {!cityOptions.length && <option value="">No cities configured</option>}
              {cityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>

          {/* 2. Area / Zone */}
          <div className="min-w-0">
            <Select label="Area / Zone" value={zone} onChange={(e) => setZone(e.target.value)}>
              {!localityOptions.length && <option value="">No areas configured</option>}
              {localityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>

          {/* 3. Property Type */}
          <div className="min-w-0">
            <Select
              label="Property Type"
              value={selectedTypes[0] ?? ""}
              onChange={(e) => setSelectedTypes(e.target.value ? [e.target.value] : [])}
            >
              <option value="">All Types</option>
              {propTypes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>

          {/* 4. Budget */}
          <div className="min-w-0">
            <Select
              label={tab === "Rent" ? "Budget / Rent" : "Budget"}
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
            >
              <option value="">Any Budget</option>
              {maxBudgetOptions.map((o) => (
                <option key={o.value} value={o.value}>Up to {o.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* BHK Single-Row Pills */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
            BHK:
          </span>
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {bhks.map((b) => (
              <Chip key={b} active={selectedBhks.includes(b)} onClick={() => toggle(selectedBhks, setSelectedBhks, b)}>
                {b}
              </Chip>
            ))}
          </div>
        </div>

        {/* Contact row — required only for Sell enquiry */}
        {tab === "Sell" && filters.show_contact_details !== false && (
          <div className="border-t border-charcoal/10 pt-2.5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Input label="Name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
              <Input label="Phone" placeholder="+91 99999 99999" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} type="tel" />
              <Input label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} type="email" />
            </div>
          </div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: submitting ? 1 : 1.01 }}
        type="submit"
        disabled={submitting}
        className="mt-3.5 sm:mt-4 flex h-10 sm:h-11 w-full items-center justify-center gap-2 rounded-full text-xs sm:text-sm font-semibold text-white shadow-gold transition-shadow hover:shadow-elevated disabled:opacity-70"
        style={{
          background: "linear-gradient(135deg, #B8962E, #D4AF6A)",
        }}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : tab === "Sell" ? <Send size={16} /> : <Search size={16} />}
        {submitting
          ? "Submitting…"
          : tab === "Sell"
            ? (filters.enquiry_button_text ?? SEARCH_FILTERS_DEFAULTS.enquiry_button_text)
            : (filters.search_button_text ?? SEARCH_FILTERS_DEFAULTS.search_button_text)}
      </motion.button>
    </motion.form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:text-[11px]">
      {children}
    </label>
  );
}

function Select({
  label,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <select
        {...rest}
        className="h-9.5 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 pr-6 text-xs text-charcoal outline-none focus:border-gold sm:h-11 sm:px-3 sm:text-sm truncate"
      >
        {children}
      </select>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <input
        {...rest}
        className="h-9.5 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-charcoal placeholder:text-charcoal/35 outline-none focus:border-gold sm:h-11 sm:px-3 sm:text-sm"
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-none whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all sm:px-3 sm:py-1.5 sm:text-xs ${
        active
          ? "border-gold bg-gold text-charcoal font-semibold"
          : "border-charcoal/15 bg-white text-charcoal/70 hover:border-gold/50"
      }`}
    >
      {children}
    </button>
  );
}
