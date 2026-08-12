import { supabase } from "@/integrations/supabase/client";


// ---------- types ----------
export type FooterContactItem = { label: string; value: string; is_active: boolean; display_order: number };
export type FooterLinkItem = { label: string; href: string; is_active: boolean; display_order: number };

export type BrandSettings = {
  name: string;
  logo_url: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  social: { instagram: string; facebook: string; linkedin: string; youtube: string; twitter: string };
  hero: { headline: string; subheadline: string; cta_label: string; cta_href: string };
  footer: {
    tagline: string;
    copyright: string;
    description?: string;
    privacy_url?: string;
    terms_url?: string;
    is_active?: boolean;
    phones?: FooterContactItem[];
    emails?: FooterContactItem[];
    quick_links?: FooterLinkItem[];
    property_links?: FooterLinkItem[];
  };
};

export const BRAND_DEFAULTS: BrandSettings = {
  name: "Touch Stone Properties",
  logo_url: "",
  phone: "+91 99029 25519",
  whatsapp: "+91 99029 25519",
  email: "info@touchstoneproperties.in",
  address: "Bengaluru, Karnataka, India",
  social: { instagram: "", facebook: "", linkedin: "", youtube: "", twitter: "" },
  hero: {
    headline: "Touch Stone Properties",
    subheadline: "Verified apartments, villas, plots and commercial spaces across Bangalore.",
    cta_label: "Explore Properties",
    cta_href: "/buy-properties/all",
  },
  footer: {
    tagline: "Curating premium real estate across Bengaluru.",
    copyright: "© Touch Stone Properties. All rights reserved.",
    description: "",
    privacy_url: "/",
    terms_url: "/",
    is_active: true,
    phones: [],
    emails: [],
    quick_links: [],
    property_links: [],
  },
};


export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  parent_id: string | null;
  location: "header" | "footer";
  display_order: number;
  is_active: boolean;
};

export type TestimonialCategory = "Buyer" | "Seller" | "Tenant" | "Owner" | "NRI";
export type Testimonial = {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  quote: string;
  rating: number;
  category: TestimonialCategory;
  location: string;
  display_order: number;
  is_active: boolean;
};

export type Partner = {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  display_order: number;
  is_active: boolean;
};

export type SuccessStoryType = "Buy" | "Sell" | "Rent" | "Property Management" | "Custom";
export type SuccessService = { name: string; icon?: string; active?: boolean };
export type SuccessStoryRow = {
  id: string;
  title: string;
  slug: string | null;
  client: string | null;
  client_label: string | null;
  image_url: string | null;
  images: string[];
  summary: string | null;
  body: string | null;
  category: string | null;
  badge_text: string | null;
  story_type: SuccessStoryType;
  location: string | null;
  cta_text: string | null;
  button_text: string | null;
  contact_button_link: string | null;
  whatsapp_number: string | null;
  whatsapp_link: string | null;
  services_provided: SuccessService[];
  display_order: number;
  is_active: boolean;
};

// ---------- brand ----------
// The remote Postgres server is slow (~200ms+ per query, ~1s cold connect), so
// cache the tiny brand blob server-side. Admin saves clear the cache so edits
// show up immediately.
const BRAND_CACHE_TTL_MS = 15_000;
let brandCache: { value: BrandSettings; at: number } | undefined;
function isServer() {
  return typeof window === "undefined";
}

export async function getBrandSettings(): Promise<BrandSettings> {
  if (isServer() && brandCache && Date.now() - brandCache.at < BRAND_CACHE_TTL_MS) {
    return brandCache.value;
  }
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "brand")
    .maybeSingle();
  let result: BrandSettings;
  if (error) {
    console.warn("[site-cms] brand read failed:", error.message);
    result = BRAND_DEFAULTS;
  } else {
    result = { ...BRAND_DEFAULTS, ...(data?.value as Partial<BrandSettings> | null ?? {}) } as BrandSettings;
  }
  if (isServer()) brandCache = { value: result, at: Date.now() };
  return result;
}

export async function updateBrandSettings(value: BrandSettings) {
  brandCache = undefined;
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "brand", value: JSON.parse(JSON.stringify(value)) }, { onConflict: "key" });
  if (error) throw error;
}

// ---------- search filters config ----------
export type SearchFiltersConfig = {
  property_types: string[];
  listing_types: string[];
  bhk_options: string[];
  price_presets_buy: { label: string; min: number; max: number }[];
  price_presets_rent: { label: string; min: number; max: number }[];
  popular_localities: string[];
  show_builder_filter: boolean;
  show_possession_filter: boolean;
  show_furnishing_filter: boolean;
  // Hero Search Form Management
  is_visible: boolean;
  default_tab: string;
  cities: string[];
  areas: string[];
  min_sqft_placeholder: string;
  max_sqft_placeholder: string;
  keyword_placeholder: string;
  show_contact_details: boolean;
  search_button_text: string;
  enquiry_button_text: string;
  helper_text: string;
};

export const SEARCH_FILTERS_DEFAULTS: SearchFiltersConfig = {
  property_types: ["Apartment", "Villa", "Plot", "Commercial", "Residential"],
  listing_types: ["Buy", "Rent", "Sell"],
  bhk_options: ["1", "2", "3", "4", "4+"],
  price_presets_buy: [
    { label: "Under ₹50 L", min: 1000000, max: 5000000 },
    { label: "₹50 L – ₹1 Cr", min: 5000000, max: 10000000 },
    { label: "₹1 – 2 Cr", min: 10000000, max: 20000000 },
    { label: "₹2 – 5 Cr", min: 20000000, max: 50000000 },
    { label: "₹5 Cr+", min: 50000000, max: 1000000000 },
  ],
  price_presets_rent: [
    { label: "Under ₹25 K", min: 0, max: 25000 },
    { label: "₹25 K – 50 K", min: 25000, max: 50000 },
    { label: "₹50 K – 1 L", min: 50000, max: 100000 },
    { label: "₹1 L+", min: 100000, max: 1000000 },
  ],
  popular_localities: ["Whitefield", "Sarjapur Road", "HSR Layout", "Indiranagar", "Koramangala"],
  show_builder_filter: true,
  show_possession_filter: true,
  show_furnishing_filter: true,
  is_visible: true,
  default_tab: "Buy",
  cities: ["Bangalore", "Hyderabad", "Chennai", "Mumbai", "Delhi"],
  areas: ["Whitefield", "Sarjapur Road", "HSR Layout", "Indiranagar", "Koramangala"],
  min_sqft_placeholder: "800",
  max_sqft_placeholder: "3000",
  keyword_placeholder: "Builder / Project",
  show_contact_details: true,
  search_button_text: "Search Property",
  enquiry_button_text: "Submit Enquiry",
  helper_text: "We'll save your enquiry and open WhatsApp to chat with our team.",
};

export async function getSearchFilters(): Promise<SearchFiltersConfig> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "search_filters")
    .maybeSingle();
  if (error) {
    console.warn("[site-cms] search_filters read failed:", error.message);
    return SEARCH_FILTERS_DEFAULTS;
  }
  return { ...SEARCH_FILTERS_DEFAULTS, ...(data?.value as Partial<SearchFiltersConfig> | null ?? {}) } as SearchFiltersConfig;
}

export async function updateSearchFilters(value: SearchFiltersConfig) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "search_filters", value: JSON.parse(JSON.stringify(value)) }, { onConflict: "key" });
  if (error) throw error;
}

// ---------- navigation ----------
export async function listNavigationItems(location?: "header" | "footer"): Promise<NavigationItem[]> {
  let q = supabase.from("navigation_items").select("*").order("display_order", { ascending: true });
  if (location) q = q.eq("location", location);
  const { data, error } = await q;
  if (error) { console.warn("[site-cms] nav read failed:", error.message); return []; }
  return (data ?? []) as NavigationItem[];
}
export async function createNavItem(input: Omit<NavigationItem, "id">) {
  const { data, error } = await supabase.from("navigation_items").insert(input).select().single();
  if (error) throw error;
  return data as NavigationItem;
}
export async function updateNavItem(id: string, patch: Partial<NavigationItem>) {
  const { error } = await supabase.from("navigation_items").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteNavItem(id: string) {
  const { error } = await supabase.from("navigation_items").delete().eq("id", id);
  if (error) throw error;
}
export async function reorderNavItems(ids: string[]) {
  await Promise.all(ids.map((id, idx) => supabase.from("navigation_items").update({ display_order: idx }).eq("id", id)));
}

// ---------- testimonials ----------
export async function listTestimonials(activeOnly = false): Promise<Testimonial[]> {
  let q = supabase.from("testimonials").select("*").order("display_order", { ascending: true });
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) { console.warn("[site-cms] testimonials read failed:", error.message); return []; }
  return (data ?? []) as Testimonial[];
}
export async function createTestimonial(input: Omit<Testimonial, "id">) {
  const { data, error } = await supabase.from("testimonials").insert(input).select().single();
  if (error) throw error;
  return data as Testimonial;
}
export async function updateTestimonial(id: string, patch: Partial<Testimonial>) {
  const { error } = await supabase.from("testimonials").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteTestimonial(id: string) {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw error;
}

// ---------- partners ----------
export async function listPartners(activeOnly = false): Promise<Partner[]> {
  let q = supabase.from("partners").select("*").order("display_order", { ascending: true });
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) { console.warn("[site-cms] partners read failed:", error.message); return []; }
  return (data ?? []) as Partner[];
}
export async function createPartner(input: Omit<Partner, "id">) {
  const { data, error } = await supabase.from("partners").insert(input).select().single();
  if (error) throw error;
  return data as Partner;
}
export async function updatePartner(id: string, patch: Partial<Partner>) {
  const { error } = await supabase.from("partners").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deletePartner(id: string) {
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) throw error;
}

// ---------- partners section content ----------
export type PartnersSection = {
  small_label: string;
  heading: string;
  subtitle: string;
  bottom_quote: string;
  is_section_active: boolean;
};
export const PARTNERS_SECTION_DEFAULTS: PartnersSection = {
  small_label: "Associated Partners",
  heading: "Associated Partners",
  subtitle: "We work with leading developers and builder brands to help clients explore trusted residential and investment opportunities.",
  bottom_quote: "If anyone wants to invest in properties from top builders, we help make that process easier and more reliable.",
  is_section_active: true,
};
export async function getPartnersSection(): Promise<PartnersSection> {
  const { data, error } = await supabase
    .from("site_settings").select("value").eq("key", "partners_section").maybeSingle();
  if (error) { console.warn("[site-cms] partners_section read failed:", error.message); return PARTNERS_SECTION_DEFAULTS; }
  return { ...PARTNERS_SECTION_DEFAULTS, ...(data?.value as Partial<PartnersSection> | null ?? {}) };
}
export async function updatePartnersSection(value: PartnersSection) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "partners_section", value: JSON.parse(JSON.stringify(value)) }, { onConflict: "key" });
  if (error) throw error;
}

// ---------- success stories ----------
function normalizeStory(row: any): SuccessStoryRow {
  return {
    ...row,
    images: Array.isArray(row.images) ? row.images.filter((x: any) => typeof x === "string") : [],
    services_provided: Array.isArray(row.services_provided)
      ? row.services_provided.filter((s: any) => s && typeof s.name === "string")
      : [],
  };
}
export function slugifyStory(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
export async function listSuccessStories(activeOnly = false): Promise<SuccessStoryRow[]> {
  let q = supabase.from("success_stories").select("*").order("display_order", { ascending: true });
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) { console.warn("[site-cms] stories read failed:", error.message); return []; }
  return (data ?? []).map(normalizeStory);
}
export async function getSuccessStoryBySlug(slug: string): Promise<SuccessStoryRow | null> {
  const { data, error } = await supabase.from("success_stories").select("*").eq("slug", slug).maybeSingle();
  if (error) { console.warn("[site-cms] story by slug failed:", error.message); return null; }
  return data ? normalizeStory(data) : null;
}
function storyPayload(input: Partial<SuccessStoryRow>) {
  const p: any = { ...input };
  if (input.images) p.images = JSON.parse(JSON.stringify(input.images));
  if (input.services_provided) p.services_provided = JSON.parse(JSON.stringify(input.services_provided));
  if (typeof p.slug === "string") p.slug = slugifyStory(p.slug);
  if ((!p.slug || p.slug === "") && typeof p.title === "string") p.slug = slugifyStory(p.title);
  return p;
}
export async function createSuccessStory(input: Omit<SuccessStoryRow, "id">) {
  const { data, error } = await supabase.from("success_stories").insert(storyPayload(input)).select().single();
  if (error) throw error;
  return normalizeStory(data);
}
export async function updateSuccessStory(id: string, patch: Partial<SuccessStoryRow>) {
  const { error } = await supabase.from("success_stories").update(storyPayload(patch)).eq("id", id);
  if (error) throw error;
}
export async function deleteSuccessStory(id: string) {
  const { error } = await supabase.from("success_stories").delete().eq("id", id);
  if (error) throw error;
}

// ---------- FAQs ----------
export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
};
export async function listFaqs(activeOnly = false): Promise<FaqRow[]> {
  let q = supabase.from("faqs").select("*").order("display_order", { ascending: true });
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) { console.warn("[site-cms] faqs read failed:", error.message); return []; }
  return (data ?? []) as FaqRow[];
}
export async function createFaq(input: Omit<FaqRow, "id">) {
  const { data, error } = await supabase.from("faqs").insert(input).select().single();
  if (error) throw error;
  return data as FaqRow;
}
export async function updateFaq(id: string, patch: Partial<FaqRow>) {
  const { error } = await supabase.from("faqs").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteFaq(id: string) {
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw error;
}

// ---------- About / Why-Us / Stats / Services content blocks ----------
export type WhyUsFeature = { icon: string; title: string; desc: string };
export type AboutService = { icon: string; title: string; desc: string };
export type AboutStat = { value: number; suffix: string; label: string };
export type AboutJourney = { title: string; desc: string; icon: string };

export type AboutContent = {
  heading: string;
  intro: string;
  photo_url: string;
  why_us_heading: string;
  why_us_features: WhyUsFeature[];
  services: AboutService[];
  stats: AboutStat[];
  journeys: AboutJourney[];
};

export const ABOUT_DEFAULTS: AboutContent = {
  heading: "Why Choose Touch Stone?",
  intro:
    "We don't list properties. We curate homes. For 15 years our clients have trusted us to deliver real estate the way it should be — transparent, intelligent, and deeply personal.",
  photo_url: "",
  why_us_heading: "Why Choose Touch Stone Properties?",
  why_us_features: [
    { icon: "Shield", title: "15+ Years Trusted", desc: "Bangalore's most-referred broker, built on quiet word-of-mouth." },
    { icon: "CheckCircle2", title: "100% Verified", desc: "Every property RERA-verified with title chain review pre-listed." },
    { icon: "Scale", title: "Legal Assistance", desc: "In-house legal team handles registration, stamp duty and documentation." },
    { icon: "Landmark", title: "Loan Help", desc: "Pre-approved partnerships with 14 leading banks for fastest disbursal." },
  ],
  services: [
    { icon: "Home", title: "Buy Properties", desc: "Find verified apartments, villas, plots, and premium residential projects." },
    { icon: "Tag", title: "Sell Properties", desc: "List your property and connect with serious verified buyers." },
    { icon: "Key", title: "Rent Properties", desc: "Discover rental homes based on budget, location, and lifestyle." },
    { icon: "MessageSquare", title: "Property Consultation", desc: "Get expert support for site visits, documentation, pricing, and negotiation." },
  ],
  stats: [
    { value: 17, suffix: "+", label: "Years of Experience" },
    { value: 500, suffix: "+", label: "Verified Properties" },
    { value: 1000, suffix: "+", label: "Happy Clients" },
    { value: 50, suffix: "+", label: "Premium Projects" },
    { value: 100, suffix: "%", label: "Verified Listings" },
  ],
  journeys: [
    { title: "BUY", desc: "Search verified properties, compare options, schedule visits, and close confidently.", icon: "Home" },
    { title: "SELL", desc: "Promote your property, get verified leads, and complete faster transactions.", icon: "Tag" },
    { title: "RENT", desc: "Find rental homes in Bangalore with trusted owners and transparent details.", icon: "Key" },
  ],
};

export async function getAboutContent(): Promise<AboutContent> {
  const { data, error } = await supabase
    .from("site_settings").select("value").eq("key", "about").maybeSingle();
  if (error) { console.warn("[site-cms] about read failed:", error.message); return ABOUT_DEFAULTS; }
  return { ...ABOUT_DEFAULTS, ...((data?.value as Partial<AboutContent> | null) ?? {}) } as AboutContent;
}
export async function updateAboutContent(value: AboutContent) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "about", value: JSON.parse(JSON.stringify(value)) }, { onConflict: "key" });
  if (error) throw error;
}

// ============= About Us PAGE content (dynamic /about-us) =============
export type AboutHeroBlock = { active: boolean; order: number; title: string; subtitle: string; image_url: string; breadcrumb: string };
export type AboutIntroBlock = {
  active: boolean; order: number; label: string; title: string;
  bullets: string[]; points: { icon: string; text: string }[];
  cta_label: string; cta_href: string;
  image1_url: string; image2_url: string;
  badge_title: string; badge_subtitle: string;
};
export type AboutMVVBlock = { active: boolean; order: number; heading: string; subheading: string; cards: { icon: string; title: string; body: string }[] };
export type AboutTrustBlock = { active: boolean; order: number; label: string; title: string; points: string[]; image_url: string; banner_text: string };
export type AboutStatsBlock = { active: boolean; order: number; items: { value: number; suffix: string; label: string }[] };
export type AboutServicesBlock = { active: boolean; order: number; title: string; subtitle: string; items: { icon: string; title: string; body: string }[] };
export type AboutProcessBlock = { active: boolean; order: number; title: string; subtitle: string; steps: { title: string; desc: string }[] };
export type AboutCTABlock = {
  active: boolean; order: number; title: string; body: string; image_url: string;
  cta_label: string; cta_href: string;
  secondary_label: string; secondary_href: string;
  whatsapp_label: string; whatsapp_url: string;
};

export type AboutPageContent = {
  hero: AboutHeroBlock;
  intro: AboutIntroBlock;
  mvv: AboutMVVBlock;
  trust: AboutTrustBlock;
  stats: AboutStatsBlock;
  services: AboutServicesBlock;
  process: AboutProcessBlock;
  cta: AboutCTABlock;
};

export const ABOUT_PAGE_DEFAULTS: AboutPageContent = {
  hero: {
    active: true, order: 1,
    title: "About Touch Stone Properties",
    subtitle: "Your trusted real estate partner for buying, selling, and renting verified properties.",
    image_url: "",
    breadcrumb: "Home / About Us",
  },
  intro: {
    active: true, order: 2,
    label: "ABOUT TOUCH STONE",
    title: "Helping You Find the Right Property With Confidence",
    bullets: [
      "Touchstone Properties is a Partnership firm founded by two working partners.",
      "At Touchstone Properties, we understand that buying, selling, or renting a property can be a daunting task.",
      "That's why we offer you a wide variety of real estate services to make the process easier for our clients.",
      "We believe in providing personalized care and attention to our clients and prioritize integrity, commitment to excellence, and a professional attitude.",
    ],
    points: [
      { icon: "ShieldCheck", text: "Verified property listings" },
      { icon: "Sparkles", text: "Expert real estate consultation" },
      { icon: "Scale", text: "Legal and loan assistance" },
      { icon: "Handshake", text: "Smooth buying, selling & renting" },
    ],
    cta_label: "Explore Properties",
    cta_href: "/buy-properties/all",
    image1_url: "", image2_url: "",
    badge_title: "17+ Years", badge_subtitle: "REAL ESTATE EXPERTISE",
  },
  mvv: {
    active: true, order: 3,
    heading: "Our Purpose, Promise & Principles",
    subheading: "We are committed to building trust through transparent property solutions and personalized real estate support.",
    cards: [
      { icon: "Target", title: "Our Mission", body: "To simplify the property journey by connecting buyers, sellers, tenants, and owners with verified real estate opportunities and professional guidance." },
      { icon: "Eye", title: "Our Vision", body: "To become a trusted real estate partner known for transparency, quality service, verified listings, and long-term client relationships." },
      { icon: "Heart", title: "Our Values", body: "Transparency, trust, professionalism, commitment, client satisfaction, and ethical real estate practices guide everything we do." },
    ],
  },
  trust: {
    active: true, order: 4,
    label: "WHY CHOOSE US",
    title: "Why Clients Trust Touch Stone Properties",
    points: [
      "Touchstone Properties is a real estate company that specializes in providing a wide variety of services to customers.",
      "Our team of experienced professionals is dedicated to ensuring that our clients receive the best possible real estate solutions.",
      "We understand the market and analyze the market and situation, and are committed to helping our clients find their dream homes or properties that fulfill their requirements.",
    ],
    image_url: "",
    banner_text: "Trusted Broker · Verified Properties · End-to-End Support",
  },
  stats: {
    active: true, order: 5,
    items: [
      { value: 17, suffix: "+", label: "Years Experience" },
      { value: 500, suffix: "+", label: "Properties" },
      { value: 1000, suffix: "+", label: "Happy Clients" },
      { value: 100, suffix: "%", label: "Verified Listings" },
    ],
  },
  services: {
    active: true, order: 6,
    title: "Our Real Estate Services",
    subtitle: "Complete property support for buyers, sellers, tenants, and owners.",
    items: [
      { icon: "Building2", title: "Buy Property Assistance", body: "We help buyers discover verified properties based on preferred location, budget, lifestyle, property type, and future value." },
      { icon: "Home", title: "Sell Property Support", body: "We support property owners with listing, promotion, buyer enquiries, site visits, negotiation, and closure assistance." },
      { icon: "Handshake", title: "Rental Property Support", body: "We help tenants and owners connect through verified rental property listings and guided rental support." },
      { icon: "FileText", title: "Legal Assistance", body: "We assist clients with property documentation, verification, agreement guidance, and legal process coordination." },
      { icon: "Banknote", title: "Loan Assistance", body: "We guide buyers with home loan support, bank coordination, eligibility guidance, and document assistance." },
      { icon: "Calculator", title: "Property Valuation", body: "We help clients understand market pricing, property value, location demand, and investment potential." },
      { icon: "CalendarCheck", title: "Site Visit Coordination", body: "We schedule and coordinate property visits so clients can inspect shortlisted properties conveniently." },
    ],
  },
  process: {
    active: true, order: 7,
    title: "Our Simple Property Process",
    subtitle: "From requirement understanding to final closure, we make your property journey smooth and transparent.",
    steps: [
      { title: "Understand Client Requirement", desc: "We first understand your property need, preferred location, budget, purpose, and timeline." },
      { title: "Shortlist Verified Properties", desc: "We filter and shortlist only suitable verified properties that match your expectations." },
      { title: "Schedule Property Visits", desc: "We coordinate property visits and help you evaluate each option clearly." },
      { title: "Assist With Negotiation", desc: "We support you during price discussion and help you make informed decisions." },
      { title: "Legal & Documentation Support", desc: "We assist with documentation, property verification, agreements, and required formalities." },
      { title: "Final Closure & Handover", desc: "We guide you until the final deal closure, payment process, and property handover." },
    ],
  },
  cta: {
    active: true, order: 8,
    title: "Start Your Property Journey With Touch Stone Properties Today.",
    body: "Whether you want to buy, sell, or rent, our team is ready to guide you with verified properties and expert support.",
    image_url: "",
    cta_label: "Contact Us", cta_href: "/contact-us",
    secondary_label: "Explore Properties", secondary_href: "/buy-properties/apartments",
    whatsapp_label: "WhatsApp Now", whatsapp_url: "https://wa.me/919902925519",
  },
};

function normalizeAboutPageContent(saved: Partial<AboutPageContent> | null | undefined): AboutPageContent {
  // Deep-merge per-section so missing keys fall back to defaults
  const out = { ...ABOUT_PAGE_DEFAULTS } as AboutPageContent;
  (Object.keys(ABOUT_PAGE_DEFAULTS) as (keyof AboutPageContent)[]).forEach((k) => {
    (out as any)[k] = { ...(ABOUT_PAGE_DEFAULTS as any)[k], ...((saved as any)[k] ?? {}) };
  });
  return out;
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  // Read directly via the browser Supabase client so the About Us page never
  // depends on a server function at request time (which was failing in the
  // production runtime with the Node 20 / WebSocket transport error).
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "about_page")
    .maybeSingle();
  if (error) {
    console.warn("[site-cms] about_page read failed:", error.message);
    return normalizeAboutPageContent(null);
  }
  return normalizeAboutPageContent((data?.value ?? null) as Partial<AboutPageContent> | null);
}

export async function updateAboutPageContent(value: AboutPageContent): Promise<AboutPageContent> {
  const normalized = normalizeAboutPageContent(value);
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      { key: "about_page", value: JSON.parse(JSON.stringify(normalized)) },
      { onConflict: "key" },
    )
    .select("value")
    .single();
  if (error) throw new Error(`About Us save failed: ${error.message}`);
  return normalizeAboutPageContent((data?.value ?? null) as Partial<AboutPageContent> | null);
}

// ---------- activity logs ----------
export type ActivityLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
};
export async function logActivity(input: {
  action: string;
  entity?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("activity_logs").insert({
      actor_id: userData.user?.id ?? null,
      action: input.action,
      entity: input.entity ?? null,
      entity_id: input.entity_id ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (e) {
    console.warn("[site-cms] activity log failed:", e);
  }
}
export async function listActivityLogs(limit = 200): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs").select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.warn("[site-cms] logs read failed:", error.message); return []; }
  return (data ?? []) as ActivityLog[];
}

// ---------- media upload helper ----------
const TEN_YEARS_S = 60 * 60 * 24 * 365 * 10;
export async function uploadStorageMedia(bucket: "site-media" | "property-media" | "banners" | "success-stories", file: File, folder = "uploads"): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS_S);
  if (signErr) throw signErr;
  return data.signedUrl;
}

export async function uploadSiteMedia(file: File, folder = "uploads"): Promise<string> {
  return uploadStorageMedia("site-media", file, folder);
}
