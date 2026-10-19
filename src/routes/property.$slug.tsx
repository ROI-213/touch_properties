import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Building2,
  Car,
  Compass,
  Share2,
  Heart,
  Phone,
  Calculator,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Globe,
} from "lucide-react";

function BuilderContactIcons({ contact }: { contact: any }) {
  if (!contact) return null;
  const phone = (contact.primary_phone || "").toString().trim();
  let wa = (contact.whatsapp_number || "").toString().replace(/\D/g, "");
  if (wa && wa.length === 10) wa = `91${wa}`;
  const website = (contact.website || "").toString().trim();
  const msg = encodeURIComponent(
    `Hi, I am interested in your properties listed on Touch Stone Properties. Please share more details.`,
  );
  const cls =
    "inline-grid h-9 w-9 place-items-center rounded-full border border-charcoal/10 text-charcoal/70 transition hover:bg-gold hover:text-white";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {phone && (
        <a title="Call builder" aria-label="Call builder" href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={cls}>
          <Phone size={15} />
        </a>
      )}
      {wa && (
        <a title="WhatsApp builder" aria-label="WhatsApp builder" target="_blank" rel="noopener noreferrer"
          href={`https://wa.me/${wa}?text=${msg}`} className={cls}>
          <MessageCircle size={15} />
        </a>
      )}
      {website && (
        <a title="Visit website" aria-label="Visit builder website" target="_blank" rel="noopener noreferrer"
          href={website.startsWith("http") ? website : `https://${website}`} className={cls}>
          <Globe size={15} />
        </a>
      )}
    </div>
  );
}

import toast from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyGallery } from "@/components/PropertyGallery";

import { EnquiryForm } from "@/components/EnquiryForm";
import { ShareButton } from "@/components/ShareButton";
import { properties } from "@/data/properties";
import { supabase } from "@/integrations/supabase/client";
import { dbRowToProperty, useDbProperties } from "@/hooks/useDbProperties";
import { pickPrimaryContact, type PropertyAssignment } from "@/lib/property-assignments";
import { AssignedExpert } from "@/components/AssignedExpert";

export const Route = createFileRoute("/property/$slug")({
  loader: async ({ params }) => {
    // Single optimized query: property + images + nested public assignments
    let property: any = null;
    let assignedStaff: PropertyAssignment[] = [];
    let formAssignedStaff: { id: string; name: string; designation: string | null; mobile: string | null; email: string | null } | null = null;
    try {
      const { data } = await supabase
        .from("properties")
        .select(
          "*, builder:builders!properties_builder_id_fkey(id, name, display_name, logo_url, primary_phone, whatsapp_number, email, website), location:locations!properties_location_id_fkey(zone, locality), property_images(url, image_type, display_order), property_assignments(*), property_amenities(amenity:amenities(id, name, icon))",
        )
        .ilike("slug", params.slug)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        property = dbRowToProperty(data);
        const rowDetails = ((data as any).details ?? {}) as Record<string, any>;
        (property as any).aboutProperty = ((data as any).overview ?? "").toString();
        (property as any).highlightsText = ((data as any).highlights ?? rowDetails.property_details ?? "").toString();
        (property as any).details = rowDetails;
        (property as any).builderContact = (data as any).builder ?? null;
        (property as any).ownerContact = (data as any).owner ?? null;
        (property as any).ownerName = (
          (data as any).owner?.display_name ||
          (data as any).owner?.name ||
          rowDetails.owner_name ||
          ""
        ).toString();
        (property as any).subtitle = (rowDetails.subtitle || rowDetails.tagline || "").toString();
        (property as any).mapLink = ((data as any).map_link ?? "").toString();
        (property as any).directionsLink = ((data as any).directions_link ?? "").toString();
        (property as any).fullAddress = ((data as any).address ?? "").toString();
        (property as any).locationAdvantages = (
          (data as any).location_advantages ??
          rowDetails.location_advantages ??
          ""
        ).toString();
        (property as any).idealFor = (rowDetails.ideal_for ?? "").toString();
        (property as any).zoneLocality = (data as any).location
          ? `${(data as any).location.zone ?? ""}${(data as any).location.locality ? ` · ${(data as any).location.locality}` : ""}`.trim()
          : "";
        const imgs = (((data as any).property_images ?? []) as any[])
          .slice()
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        const hero = (data as any).hero_image || imgs.find((i) => i.image_type === "hero")?.url || imgs[0]?.url;
        const gallery = imgs
          .map((i) => i.url)
          .filter((u): u is string => !!u);
        (property as any).galleryImages = Array.from(
          new Set(hero ? [hero, ...gallery] : gallery),
        );
        const links = ((data as any).property_amenities ?? []) as any[];
        (property as any).amenities = links
          .map((l) => l.amenity)
          .filter(Boolean)
          .map((a: any) => ({ label: a.name, icon: a.icon || "✔️" }));
        const all = ((data as any).property_assignments ?? []) as any[];
        assignedStaff = all
          .filter((a) => a.is_active && a.show_publicly)
          .map((a) => ({ ...a, languages: Array.isArray(a.languages) ? a.languages : [] }))
          .sort((a, b) =>
            a.is_primary === b.is_primary
              ? (a.display_order ?? 0) - (b.display_order ?? 0)
              : a.is_primary
                ? -1
                : 1,
          );
        const assignedId = (data as any).assigned_staff_id as string | null | undefined;
        if (assignedId) {
          const { data: staffRow } = await supabase
            .from("staff_users" as any)
            .select("id, name, designation, mobile, email, status")
            .eq("id", assignedId)
            .eq("status", "active")
            .maybeSingle();
          if (staffRow) {
            const s = staffRow as any;
            formAssignedStaff = {
              id: s.id,
              name: s.name,
              designation: s.designation ?? null,
              mobile: s.mobile ?? null,
              email: s.email ?? null,
            };
          }
        }
      }
    } catch (e) {
      console.warn("[property loader] db lookup failed", e);
    }
    if (!property) {
      const p = properties.find((x) => x.slug.toLowerCase() === params.slug.toLowerCase());
      if (!p) throw notFound();
      property = p;
    }
    return { property, assignedStaff, formAssignedStaff };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.property.title} — Touch Stone Properties` },
          { name: "description", content: loaderData.property.description },
          { property: "og:title", content: loaderData.property.title },
          { property: "og:description", content: loaderData.property.description },
          { property: "og:image", content: loaderData.property.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-ivory">
      <div className="text-center">
        <h1 className="font-display text-4xl">Property not found</h1>
        <Link to="/" className="mt-4 inline-block text-gold">
          ← Back home
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center bg-ivory">
      <p>Couldn't load property.</p>
    </div>
  ),
  component: PropertyPage,
});

const ALL_AMENITIES: { icon: string; label: string }[] = [
  { icon: "🏋️", label: "Gym" },
  { icon: "🏊", label: "Swimming Pool" },
  { icon: "🛗", label: "Lift" },
  { icon: "🔒", label: "Security" },
  { icon: "🌿", label: "Garden" },
  { icon: "🏛", label: "Club House" },
  { icon: "⚡", label: "Power Backup" },
  { icon: "🅿️", label: "Parking" },
  { icon: "📹", label: "CCTV" },
  { icon: "🎮", label: "Play Area" },
];


import { useEffect } from "react";
import { useRecentStore } from "@/hooks/useRecentStore";

function cleanLines(raw: string, headerPattern?: RegExp): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s*\-•✔️✅]+/, "").trim())
    .filter((line) => {
      if (!line) return false;
      if (headerPattern && headerPattern.test(line)) return false;
      return true;
    });
}

function PropertyPage() {
  const { property: initialProperty, assignedStaff = [], formAssignedStaff = null } = Route.useLoaderData();
  const assignmentPrimary = pickPrimaryContact(assignedStaff);
  // Prefer the staff selected in the admin property form's "Assigned Staff" dropdown.
  const primaryStaff: any = formAssignedStaff
    ? {
        id: formAssignedStaff.id,
        staff_name: formAssignedStaff.name,
        role: formAssignedStaff.designation ?? "Property Consultant",
        phone: formAssignedStaff.mobile ?? "",
        whatsapp: formAssignedStaff.mobile ?? "",
        email: formAssignedStaff.email ?? "",
      }
    : assignmentPrimary;
  const { data: liveProperties = [] } = useDbProperties();
  const allProperties = liveProperties.length > 0 ? liveProperties : properties;
  const liveMatch = allProperties.find((x) => x.slug === initialProperty.slug || x.id === initialProperty.id);
  const p: any = liveMatch
    ? {
        ...initialProperty,
        ...liveMatch,
        details: {
          ...((initialProperty as any).details ?? {}),
          ...((liveMatch as any).details ?? {}),
        },
      }
    : initialProperty;
  
  const addRecent = useRecentStore((s) => s.add);
  useEffect(() => {
    if (p.id) addRecent(p.id);
  }, [p.id, addRecent]);

  const [expanded, setExpanded] = useState(false);
  const [emiOpen, setEmiOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const galleryImages = ((initialProperty as any).galleryImages ?? (p as any).galleryImages ?? []) as string[];
  const gallery = Array.from(new Set(galleryImages.length > 0 ? galleryImages : [p.image])).slice(0, 12);

  // Amenities from admin (DB). Fall back to default set if none configured.
  const dbAmenities = ((initialProperty as any).amenities ?? []) as { label: string; icon: string }[];
  const amenities =
    dbAmenities.length > 0
      ? ALL_AMENITIES.map((a) => ({ ...a, available: dbAmenities.some((d) => d.label.toLowerCase() === a.label.toLowerCase()) }))
          .concat(
            dbAmenities
              .filter((d) => !ALL_AMENITIES.some((a) => a.label.toLowerCase() === d.label.toLowerCase()))
              .map((d) => ({ icon: d.icon || "✔️", label: d.label, available: true })),
          )
      : ALL_AMENITIES.map((a, i) => ({ ...a, available: (i + (p.id.charCodeAt(p.id.length - 1) % 3)) % 4 !== 0 }));

  const perSqft = Math.round(p.priceValue / Math.max(1, p.sqft));
  const details: Record<string, any> = p.details ?? (initialProperty as any).details ?? {};
  const detailList = (k: string): { title?: string; subtitle?: string; icon?: string }[] =>
    Array.isArray(details[k]) ? details[k].filter((x: any) => x?.title) : [];
  const bulletHighlights = detailList("bullet_highlights");

  const subtitleText = (
    details.subtitle ||
    details.tagline ||
    p.subtitle ||
    (initialProperty as any).subtitle ||
    ""
  ).toString().trim();

  const ownerNameText = (
    p.ownerName ||
    (initialProperty as any).ownerName ||
    details.owner_name ||
    ""
  ).toString().trim();

  const rawHighlightsText = (
    p.highlightsText ||
    (initialProperty as any).highlightsText ||
    details.property_details ||
    ""
  ).toString();
  const highlightLines = cleanLines(
    rawHighlightsText,
    /^(?:🏠\s*)?(?:property\s+(?:highlights|details)|key\s+highlights)\s*:?$/i,
  );

  const rawLocationAdvantages = (
    p.locationAdvantages ||
    (initialProperty as any).locationAdvantages ||
    details.location_advantages ||
    ""
  ).toString();
  const locationAdvantageLines = cleanLines(
    rawLocationAdvantages,
    /^(?:📍\s*)?location\s+(?:advantages|benefits)\s*:?$/i,
  );

  // Also check if connectivity has an IDEAL FOR block (legacy entry) or real connectivity items
  const rawIdealForFromConnectivity = detailList("connectivity")
    .filter((it) => /ideal\s+for/i.test(it.title || ""))
    .map((it) =>
      (it.title || "")
        .replace(/^(?:👨‍👩‍👧‍👦\s*)?ideal\s+for\s*:?/i, "")
        .split(/\s*\*\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  const rawIdealFor = (
    details.ideal_for ||
    p.idealFor ||
    (initialProperty as any).idealFor ||
    rawIdealForFromConnectivity ||
    ""
  ).toString();
  const idealForLines = cleanLines(rawIdealFor, /^(?:👨‍👩‍👧‍👦\s*)?ideal\s+for\s*:?$/i);

  // Structured specification key-value pairs for the Property Details card
  const structuredSpecs: { label: string; value: string }[] = [
    details.bhk_display_label || (p.bhk ? `${p.bhk} BHK` : "")
      ? { label: "Configuration", value: String(details.bhk_display_label || `${p.bhk} BHK`) }
      : null,
    details.super_builtup_area || (p.sqft ? `${p.sqft.toLocaleString()} Sq. Ft.` : "")
      ? {
          label: "Super Built-up Area",
          value: String(
            details.super_builtup_area
              ? /sq/i.test(String(details.super_builtup_area))
                ? details.super_builtup_area
                : `${details.super_builtup_area} Sq. Ft.`
              : `${p.sqft.toLocaleString()} Sq. Ft.`,
          ),
        }
      : null,
    details.bathrooms ? { label: "Bathrooms", value: String(details.bathrooms) } : null,
    details.balconies ? { label: "Balcony / Utility", value: String(details.balconies) } : null,
    details.floor_details
      ? {
          label: "Floor",
          value:
            details.total_floors && !/floor|of/i.test(String(details.floor_details))
              ? `${details.floor_details} of ${details.total_floors} Floors`
              : String(details.floor_details),
        }
      : null,
    details.facing_direction ? { label: "Main Door Facing", value: String(details.facing_direction) } : null,
    details.interior_status ? { label: "Furnishing", value: String(details.interior_status) } : null,
    details.covered_parking
      ? {
          label: "Car Parking",
          value: /^\d+$/.test(String(details.covered_parking).trim())
            ? `${details.covered_parking} Covered Car Park${Number(details.covered_parking) > 1 ? "s" : ""}`
            : String(details.covered_parking),
        }
      : null,
    details.khata_type ? { label: "Khata", value: String(details.khata_type) } : null,
    details.maintenance_charges
      ? {
          label: "Maintenance",
          value: /^\d+$/.test(String(details.maintenance_charges).trim())
            ? `₹${Number(details.maintenance_charges).toLocaleString("en-IN")} / month`
            : String(details.maintenance_charges),
        }
      : null,
    details.registration_status ? { label: "Registration", value: String(details.registration_status) } : null,
    details.home_loan_status ? { label: "Home Loan", value: String(details.home_loan_status) } : null,
    ownerNameText ? { label: "Owner / Seller", value: ownerNameText } : null,
  ].filter((x): x is { label: string; value: string } => Boolean(x && x.value));

  const aboutProperty = (p.aboutProperty ?? (initialProperty as any).aboutProperty ?? p.description ?? "").trim();
  const aboutParagraphs = aboutProperty
    ? aboutProperty.split(/\n\s*\n/).map((s: string) => s.trim()).filter(Boolean)
    : [];
  const aboutText = aboutParagraphs.join("\n\n");
  const words = aboutText.split(/\s+/);
  const isLong = words.length > 250;
  const visibleParagraphs = expanded || !isLong
    ? aboutParagraphs
    : (() => {
        const cut = words.slice(0, 200).join(" ") + "…";
        return [cut];
      })();

  const similar = allProperties
    .filter((x) => x.id !== p.id && x.listingType === p.listingType)
    .slice(0, 8);

  const shareData = {
    title: p.title,
    slug: p.slug,
    location: p.location,
    price: p.price,
    image: p.image,
  };

  // Format price display text cleanly (avoid showing raw unformatted numbers like "22000000")
  const formattedPriceDisplay =
    details.price_display_text && !/^\d+$/.test(String(details.price_display_text).trim())
      ? details.price_display_text
      : p.price;

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      {/* Sticky overview bar removed per request */}

      <div className="pt-20" />

      {/* Gallery */}
      <section className="mx-auto w-full px-4 lg:px-6">
        <PropertyGallery images={gallery} title={p.title} />
      </section>

      {/* Main 70/30 */}
      <div className="mx-auto mt-10 grid w-full grid-cols-1 gap-8 px-4 lg:grid-cols-[1fr_360px] lg:px-6">
        {/* LEFT */}
        <div>
          {/* Heading block */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-sand text-charcoal">{p.type.toUpperCase()}</Badge>
            <Badge className="bg-gold text-white">
              {details.sale_label || (p.listingType === "BUY" ? "FOR SALE" : "FOR RENT")}
            </Badge>
            {details.badge_text && <Badge className="bg-charcoal text-gold">{details.badge_text}</Badge>}
            {!details.badge_text && p.premium && <Badge className="bg-charcoal text-gold">⭐ PREMIUM</Badge>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-charcoal md:text-[44px]">
            {details.display_title || p.title}
          </h1>
          {subtitleText && (
            <p className="mt-2 text-base sm:text-[18px] font-medium text-gold leading-snug">
              {subtitleText}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-charcoal/70">
            <span className="inline-flex items-center gap-1">
              <MapPin size={15} className="text-gold shrink-0" /> {details.short_location_text || p.location}
            </span>
            {ownerNameText && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-0.5 text-xs font-semibold text-charcoal">
                👤 Owner / Seller: <span className="text-gold">{ownerNameText}</span>
              </span>
            )}
          </div>
          <div className="mt-2 inline-block rounded-full bg-sand px-3 py-1" style={{ fontFamily: "Space Mono, monospace" }}>
            <span className="text-[13px] text-charcoal/70">#{p.id}</span>
          </div>

          {/* Price */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-end justify-between gap-3 sm:gap-4">
            <div>
              <div className="font-numeric text-3xl sm:text-4xl font-bold text-gold md:text-[48px]">
                {formattedPriceDisplay}
              </div>
              <div className="mt-1 text-sm sm:text-[15px] text-charcoal/70">
                {details.price_suffix || (p.sqft > 0 ? `₹ ${perSqft.toLocaleString("en-IN")} / sqft` : "Verified Listing")}
              </div>
              {details.price_note && !/^\d+$/.test(String(details.price_note).trim()) && (
                <div className="mt-1 text-[12px] text-charcoal/60">{details.price_note}</div>
              )}
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <Badge className="bg-sage/15 text-sage">{details.price_suffix || "Negotiable ✓"}</Badge>
              <button
                onClick={() => setEmiOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-light"
              >
                <Calculator size={14} /> Get Loan EMI Estimate →
              </button>
            </div>
          </div>

          <Divider />

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3">
            <Spec
              icon={<Bed size={20} />}
              label="Bedrooms"
              value={details.bhk_display_label || (p.bhk ? `${p.bhk} BHK` : "—")}
            />
            <Spec
              icon={<Building2 size={20} />}
              label="Floor"
              value={
                details.floor_details
                  ? details.total_floors && !/floor|of/i.test(String(details.floor_details))
                    ? `${details.floor_details} of ${details.total_floors} Floors`
                    : String(details.floor_details)
                  : "—"
              }
            />
            <Spec
              icon={<Maximize size={20} />}
              label="Super Built-up"
              value={
                details.super_builtup_area
                  ? /sq/i.test(String(details.super_builtup_area))
                    ? String(details.super_builtup_area)
                    : `${details.super_builtup_area} Sq. Ft.`
                  : p.sqft
                    ? `${p.sqft.toLocaleString()} Sq. Ft.`
                    : "—"
              }
            />
            <Spec
              icon={<Car size={20} />}
              label="Parking"
              value={
                details.covered_parking
                  ? /^\d+$/.test(String(details.covered_parking).trim())
                    ? `${details.covered_parking} Covered`
                    : String(details.covered_parking)
                  : "—"
              }
            />
            <Spec icon={<Compass size={20} />} label="Facing" value={details.facing_direction || "—"} />
            <Spec icon={<Bath size={20} />} label="Occupancy" value={details.occupancy_status || (p.possession || "—")} />
          </div>

          {/* Property Details & Highlights */}
          {(highlightLines.length > 0 || bulletHighlights.length > 0 || structuredSpecs.length > 0) && (
            <section className="mt-6 rounded-2xl bg-card p-5 sm:p-6 shadow-card border border-charcoal/5">
              <h2 className="text-[19px] sm:text-[20px] font-bold text-charcoal flex items-center gap-2">
                <span>🏠</span> Property Details &amp; Highlights
              </h2>

              {highlightLines.length > 0 ? (
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {highlightLines.map((line, i) => {
                    const colonIdx = line.indexOf(":");
                    const hasKeyVal = colonIdx > 0 && colonIdx < 32;
                    return (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl bg-sand/60 px-3.5 py-2.5 text-[14px] text-charcoal/85"
                      >
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
                        <span>
                          {hasKeyVal ? (
                            <>
                              <strong className="font-semibold text-charcoal">
                                {line.slice(0, colonIdx + 1)}
                              </strong>{" "}
                              {line.slice(colonIdx + 1).trim()}
                            </>
                          ) : (
                            line
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                structuredSpecs.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {structuredSpecs.map((sp, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 rounded-xl bg-sand/60 px-3.5 py-2.5 text-[13.5px]"
                      >
                        <span className="font-medium text-charcoal/65">{sp.label}</span>
                        <span className="font-semibold text-charcoal text-right">{sp.value}</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {bulletHighlights.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {bulletHighlights.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px] text-charcoal/80">
                      <span>{it.icon || "✔️"}</span>
                      <span>
                        {it.title}
                        {it.subtitle ? ` — ${it.subtitle}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <Divider />

          {details.poster_enabled && (
            <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#0a1f44]/90 p-5 sm:p-6 text-white shadow-elevated">
              {details.poster_heading && (
                <div className="text-xs font-bold uppercase tracking-widest text-gold">{details.poster_heading}</div>
              )}
              {details.poster_subheading && (
                <div className="mt-2 font-display text-xl sm:text-2xl font-bold">{details.poster_subheading}</div>
              )}
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                {details.poster_price_badge && (
                  <div>
                    <div className="font-numeric text-2xl sm:text-3xl font-bold text-gold">{details.poster_price_badge}</div>
                    {details.poster_price_note && <div className="text-xs opacity-80">{details.poster_price_note}</div>}
                  </div>
                )}
                {details.quality_badge_text && (
                  <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-gold">{details.quality_badge_text}</span>
                )}
              </div>
              {details.poster_location_text && (
                <div className="mt-3 flex items-center gap-1 text-sm opacity-90"><MapPin size={14} /> {details.poster_location_text}</div>
              )}
              {(details.poster_footer_agent || details.poster_footer_phone || details.poster_footer_company) && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/20 pt-3 text-xs opacity-90">
                  <div>
                    {details.poster_footer_agent && <span className="font-semibold">{details.poster_footer_agent}</span>}
                    {details.poster_footer_company && <span> · {details.poster_footer_company}</span>}
                  </div>
                  {details.poster_footer_phone && <span>{details.poster_footer_phone}</span>}
                </div>
              )}
            </section>
          )}

          {/* About */}
          <section>
            <h2 className="text-[20px] font-bold text-charcoal">About This Property</h2>
            <div className="mt-3 space-y-4 text-[14.5px] sm:text-[15px] leading-relaxed text-charcoal/75">
              {visibleParagraphs.length > 0 ? (
                visibleParagraphs.map((para: string, i: number) => (
                  <p key={i} className="whitespace-pre-line">
                    {para}
                  </p>
                ))
              ) : (
                <p className="italic text-charcoal/50">Property details will be updated soon.</p>
              )}
            </div>
            {isLong && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-3 text-sm font-medium text-gold hover:text-gold-light"
              >
                {expanded ? "Read Less ↑" : "Read More ↓"}
              </button>
            )}
          </section>

          {/* Ideal For Section */}
          {idealForLines.length > 0 && (
            <>
              <Divider />
              <section className="rounded-2xl bg-card p-5 sm:p-6 shadow-card border border-charcoal/5">
                <h2 className="text-[19px] sm:text-[20px] font-bold text-charcoal flex items-center gap-2">
                  <span>👨‍👩‍👧‍👦</span> Ideal For
                </h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {idealForLines.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl bg-sand/60 px-3.5 py-2.5 text-[14px] text-charcoal/85"
                    >
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sage" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <Divider />

          {/* Amenities */}
          <section>
            <h2 className="text-[20px] font-bold text-charcoal">Amenities &amp; Features</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {amenities.map((a) => (
                <div
                  key={a.label}
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-lg border-l-[3px] bg-sand px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-[13px] min-w-0 ${
                    a.available
                      ? "border-sage text-charcoal"
                      : "border-charcoal/20 text-charcoal/40 line-through"
                  }`}
                >
                  {a.available ? (
                    <CheckCircle2 size={14} className="shrink-0 text-sage" />
                  ) : (
                    <XCircle size={14} className="shrink-0 text-charcoal/30" />
                  )}
                  <span className="shrink-0 mr-0.5">{a.icon}</span>
                  <span className="truncate">{a.label}</span>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* Location & Location Advantages */}
          <section>
            <h2 className="text-[20px] font-bold text-charcoal">
              📍 Location &amp; Location Advantages
            </h2>
            {(() => {
              const mapLink = ((initialProperty as any).mapLink || "").trim();
              const directionsLink = ((initialProperty as any).directionsLink || "").trim();
              const fullAddress = ((initialProperty as any).fullAddress || p.location || "").trim();
              const zoneLocality = ((initialProperty as any).zoneLocality || "").trim();
              const connectivityItems = detailList("connectivity").filter(
                (it) => !/ideal\s+for/i.test(it.title || ""),
              );
              const schoolItems = detailList("nearby_schools");
              const hospitalItems = detailList("nearby_hospitals");

              if (
                !mapLink &&
                !directionsLink &&
                !fullAddress &&
                !zoneLocality &&
                locationAdvantageLines.length === 0 &&
                connectivityItems.length === 0 &&
                schoolItems.length === 0 &&
                hospitalItems.length === 0
              ) {
                return null;
              }
              return (
                <div className="mt-4 rounded-2xl bg-card p-5 sm:p-6 shadow-card space-y-4">
                  {fullAddress && (
                    <div className="flex items-start gap-2 text-[14.5px] text-charcoal">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-gold" />
                      <div>
                        <span className="font-semibold">Address:</span> {fullAddress}
                      </div>
                    </div>
                  )}
                  {zoneLocality && (
                    <div className="text-[13.5px] text-charcoal/70">
                      <span className="font-semibold text-charcoal">Zone / Locality:</span> {zoneLocality}
                    </div>
                  )}
                  {locationAdvantageLines.length > 0 && (
                    <div>
                      <div className="text-[15px] font-bold text-charcoal mb-2.5">
                        Location Advantages
                      </div>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {locationAdvantageLines.map((a: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 rounded-xl bg-sand/60 px-3.5 py-2.5 text-[13.5px] text-charcoal/85"
                          >
                            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-gold" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(connectivityItems.length > 0 || schoolItems.length > 0 || hospitalItems.length > 0) && (
                    <div className="grid gap-3 sm:grid-cols-3 pt-2">
                      {connectivityItems.length > 0 && (
                        <div className="rounded-xl bg-sand/50 p-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-charcoal/70 mb-1.5">
                            Connectivity
                          </div>
                          <ul className="space-y-1 text-xs text-charcoal/80">
                            {connectivityItems.map((c, idx) => (
                              <li key={idx}>
                                • {c.title}
                                {c.subtitle ? ` (${c.subtitle})` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {schoolItems.length > 0 && (
                        <div className="rounded-xl bg-sand/50 p-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-charcoal/70 mb-1.5">
                            Nearby Schools
                          </div>
                          <ul className="space-y-1 text-xs text-charcoal/80">
                            {schoolItems.map((c, idx) => (
                              <li key={idx}>
                                • {c.title}
                                {c.subtitle ? ` (${c.subtitle})` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hospitalItems.length > 0 && (
                        <div className="rounded-xl bg-sand/50 p-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-charcoal/70 mb-1.5">
                            Nearby Hospitals
                          </div>
                          <ul className="space-y-1 text-xs text-charcoal/80">
                            {hospitalItems.map((c, idx) => (
                              <li key={idx}>
                                • {c.title}
                                {c.subtitle ? ` (${c.subtitle})` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {(mapLink || directionsLink) && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {mapLink && (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-[13px] font-semibold text-white shadow-card transition hover:bg-gold-light"
                        >
                          <MapPin size={14} /> View on Google Maps
                        </a>
                      )}
                      {directionsLink && (
                        <a
                          href={directionsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-white px-4 py-2 text-[13px] font-semibold text-charcoal transition hover:bg-sand"
                        >
                          <Compass size={14} /> Get Directions
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          <Divider />

          {/* Builder & Owner Info */}
          <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-5 shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gold text-lg font-bold text-white">
              {(p.builder || ownerNameText || "T").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-[160px]">
              <div className="text-[18px] font-bold text-charcoal">{p.builder}</div>
              <div className="text-[13px] text-charcoal/60">
                {ownerNameText ? `Owner / Seller: ${ownerNameText} · Verified Listing` : "Verified developer"}
              </div>
            </div>
            <BuilderContactIcons contact={(p as any).builderContact} />
          </section>
        </div>

        {/* RIGHT */}
        <aside id="enquire" className="lg:sticky lg:top-[90px] lg:self-start">
          <div className="overflow-hidden rounded-[20px] bg-white shadow-elevated">
            <div className="bg-gradient-to-r from-gold to-gold-light px-5 py-4 text-white">
              <div className="text-[15px] font-semibold">🏠 Interested in this property?</div>
              <div className="text-[12px] opacity-90">
                Our expert will call you within 2 hours.
              </div>
            </div>
            <EnquiryForm
              propertyTitle={p.title}
              propertyId={typeof p.id === "string" && p.id.includes("-") ? p.id : undefined}
              propertySlug={p.slug}
              assignedStaff={
                primaryStaff
                  ? {
                      id: primaryStaff.id,
                      staff_name: primaryStaff.staff_name,
                      phone: primaryStaff.phone ?? null,
                      whatsapp: primaryStaff.whatsapp ?? primaryStaff.phone ?? null,
                      email: primaryStaff.email ?? null,
                      role: primaryStaff.role ?? null,
                    }
                  : null
              }
            />
            {primaryStaff && (
              <div className="border-t border-charcoal/10 bg-sand/40 px-5 py-3 text-center text-[12px] text-charcoal/70">
                Routed to <span className="font-semibold text-charcoal">{primaryStaff.staff_name}</span>
                {primaryStaff.role ? ` · ${primaryStaff.role}` : ""}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Contact Our Property Expert */}
      {(() => {
        const expertStaff: PropertyAssignment[] =
          assignedStaff.length > 0
            ? assignedStaff
            : formAssignedStaff
              ? [
                  {
                    id: formAssignedStaff.id,
                    property_id: (initialProperty as any).id ?? "",
                    staff_name: formAssignedStaff.name,
                    role: formAssignedStaff.designation ?? "Property Consultant",
                    phone: formAssignedStaff.mobile ?? "",
                    whatsapp: formAssignedStaff.mobile ?? null,
                    email: formAssignedStaff.email ?? null,
                    assigned_area: null,
                    notes: null,
                    is_primary: true,
                    is_active: true,
                    show_publicly: true,
                    display_order: 0,
                    photo_url: null,
                    signature_url: null,
                    id_url: null,
                    qr_code_url: null,
                    experience_years: null,
                    languages: [],
                  },
                ]
              : [];
        if (expertStaff.length === 0) return null;
        return (
          <section className="mx-auto mt-16 w-full px-4 lg:px-6">
            <div className="rounded-2xl bg-gradient-to-br from-white to-sand/30 p-6 shadow-card md:p-8">
              <div className="mb-6 text-center">
                <h2 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
                  Contact Our Property Expert
                </h2>
                <p className="mt-1 text-sm text-charcoal/60">
                  Get in touch with the dedicated expert for {p.title}
                </p>
              </div>
              <AssignedExpert staff={expertStaff} propertyTitle={p.title} />
            </div>
          </section>
        );
      })()}

      {/* Similar */}
      <section className="mx-auto mt-20 w-full px-4 lg:px-6">
        <h2 className="font-display text-3xl font-bold text-charcoal md:text-[40px]">
          You Might Also Like
        </h2>
        <div className="relative mt-6">
          <Swiper
            modules={[Navigation]}
            navigation={{ prevEl: ".sim-prev", nextEl: ".sim-next" }}
            slidesPerView={1}
            spaceBetween={20}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
          >
            {similar.map((s, i) => (
              <SwiperSlide key={s.id}>
                <PropertyCard p={s} index={i} />
              </SwiperSlide>
            ))}
          </Swiper>
          <button
            aria-label="Previous"
            className="sim-prev absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-charcoal shadow-card md:grid"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Next"
            className="sim-next absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-charcoal shadow-card md:grid"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      <div className="h-20" />
      <Footer />

      {/* EMI Modal */}
      <EmiModal open={emiOpen} onClose={() => setEmiOpen(false)} price={p.priceValue} />
    </div>
  );
}

/* ---------- helpers ---------- */

function Divider() {
  return (
    <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
  );
}

function Badge({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function Spec({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] bg-sand p-4 text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center text-gold">{icon}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-charcoal/55">{label}</div>
      <div className="mt-1 text-[17px] font-bold text-charcoal">{value}</div>
    </div>
  );
}

function buildLongDescription(p: {
  title: string;
  builder: string;
  location: string;
  description: string;
  type: string;
}) {
  return [
    p.description,
    `${p.title} is a thoughtfully designed ${p.type.toLowerCase()} crafted by ${p.builder}, one of South India's most respected developers with a four-decade track record of delivering on time and to specification. Every interior surface — from the imported marble flooring to the German-engineered modular kitchen and Italian wardrobe shutters — has been specified by an in-house design studio that briefs on light, proportion and acoustic comfort.`,
    `Located in ${p.location}, the residence sits within a five-minute drive of the city's leading international schools, Grade-A hospitals and curated F&B destinations. The neighbourhood is already home to senior leadership of Bangalore's largest technology employers, ensuring strong long-term capital appreciation and a healthy rental yield should you choose to invest rather than occupy.`,
    `The development is RERA-registered, comes with clear title, an OC in hand, and a 99-year freehold. Touch Stone Properties has personally inspected the unit, validated the builder's track record across nine prior projects, and pre-negotiated favourable terms for serious enquirers. A site visit can be arranged at your convenience — including weekday evenings and a curated weekend brunch tour for NRI buyers visiting Bangalore.`,
  ].join(" ");
}

/* ---------- EMI Modal ---------- */

function EmiModal({
  open,
  onClose,
  price,
}: {
  open: boolean;
  onClose: () => void;
  price: number;
}) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const principal = price * (1 - down / 100);
  const r = rate / 100 / 12;
  const n = years * 12;
  const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] grid place-items-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold">EMI Estimate</h3>
              <button onClick={onClose} className="text-charcoal/50 hover:text-charcoal">
                ✕
              </button>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <Slider label={`Down Payment: ${down}%`} min={10} max={50} value={down} onChange={setDown} />
              <Slider label={`Interest Rate: ${rate}%`} min={6} max={12} step={0.1} value={rate} onChange={setRate} />
              <Slider label={`Tenure: ${years} yrs`} min={5} max={30} value={years} onChange={setYears} />
            </div>
            <div className="mt-6 rounded-xl bg-sand p-5 text-center">
              <div className="text-xs uppercase tracking-wider text-charcoal/60">Monthly EMI</div>
              <div className="mt-1 font-numeric text-3xl font-bold text-gold">
                ₹ {Math.round(emi).toLocaleString("en-IN")}
              </div>
              <div className="mt-2 text-[12px] text-charcoal/60">
                Loan amount ₹ {Math.round(principal).toLocaleString("en-IN")}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px] text-charcoal/70">
        <span>{label}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold"
      />
    </div>
  );
}
