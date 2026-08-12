import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Heart,
  Phone,
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Building2,
  Flame,
  Send,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDbProperties } from "@/hooks/useDbProperties";

import { properties as staticProperties, type Property } from "@/data/properties";
import { FALLBACK_PROPERTY_IMAGE, resolveLocalImage, siteImages } from "@/data/siteImages";
import { ShareButton } from "@/components/ShareButton";
import { useWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { getHotPropertySettings, HOT_DEFAULTS, type HotPropertySettings } from "@/lib/hot-property";
import { useEnquireModal } from "@/contexts/EnquireModalContext";

const WHATSAPP_NUMBER = "9902925519";

export function HotProperty() {
  const settingsQ = useQuery({
    queryKey: ["hot-property-settings"],
    queryFn: getHotPropertySettings,
    initialData: HOT_DEFAULTS,
    staleTime: 60_000,
  });
  const { data } = useDbProperties();

  const settings = settingsQ.data ?? HOT_DEFAULTS;
  if (settings.enabled === false || settings.status === "inactive") return null;

  const list = (data && data.length > 0 ? data : staticProperties) as Property[];
  const selected =
    (settings.property_id ? list.find((p) => p.id === settings.property_id) : null) ||
    list[0] ||
    staticProperties[0];

  if (!selected) return null;

  return <HotPropertyCard p={selected} settings={settings} />;
}

function HotPropertyCard({ p, settings }: { p: Property; settings?: HotPropertySettings }) {
  const { has } = useWishlist();
  const toggle = useToggleWishlist();
  const liked = has(p.id);
  const enquireModal = useEnquireModal();

  const defaultImage = settings?.override_image || resolveLocalImage(p.image, FALLBACK_PROPERTY_IMAGE);
  
  // Extract gallery images or fallback array for image switcher
  const galleryImages = [
    defaultImage,
    resolveLocalImage(siteImages.properties.sumadhuraEpitome, defaultImage),
    resolveLocalImage(siteImages.properties.whitefieldVilla, defaultImage),
  ].filter((img, idx, self) => self.indexOf(img) === idx);

  const [activeImg, setActiveImg] = useState(defaultImage);

  const title = settings?.override_title || p.title;
  const location = settings?.override_location || p.location;
  const price = settings?.override_price || p.price;
  const propertyType = settings?.override_property_type || p.type;
  const bedrooms = settings?.override_bedrooms ?? p.bhk;
  const bathrooms = settings?.override_bathrooms ?? p.baths;
  const area = settings?.override_area || (p.sqft ? `${p.sqft.toLocaleString()} sq.ft` : "—");
  const description = settings?.override_description || p.description;
  const badge = settings?.badge_text || "Hot Deal";

  const highlights =
    settings?.highlights && settings.highlights.length > 0
      ? settings.highlights
      : [
          p.possession || "Ready to Move",
          p.furnishing || "Premium Finishes",
          p.area ? `Prime ${p.area}` : "Prime Location",
          "RERA Approved",
        ];

  const waHref =
    settings?.cta_contact_url ||
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `Hi, I'm interested in the Hot Property: ${title} (${location}). Please share brochure and price list.`,
    )}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FBF9F5] via-white to-[#FBF9F5] py-8 sm:py-12 px-2 sm:px-4 md:px-6 w-full">
      {/* Background Orbs & Accents */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full bg-charcoal/5 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1600px]">
        {/* Section Header */}
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[2.5px] text-[#B8962E] shadow-xs">
            <Sparkles size={13} className="text-[#B8962E]" /> Exclusive Spotlight
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-slate-900 md:text-5xl lg:text-[54px] leading-tight">
            Hot Property <span className="italic text-[#B8962E]">of the Week</span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-slate-600">
            Hand-curated luxury listing featuring prime location, verified paperwork, and high appreciation potential.
          </p>
        </motion.div>

        {/* Featured Showcase Card */}
        <motion.article
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="group relative mt-10 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-500 hover:shadow-[0_30px_70px_rgba(184,150,46,0.15)] hover:border-gold/30"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column — Interactive Image Gallery */}
            <div className="relative overflow-hidden lg:col-span-6 lg:min-h-[580px] bg-slate-900">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={activeImg}
                  alt={title}
                  initial={{ scale: 1.05, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0.7 }}
                  transition={{ duration: 0.5 }}
                  className="h-80 w-full object-cover sm:h-[420px] lg:h-full transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </AnimatePresence>

              {/* Gradient Overlays for Badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

              {/* Top Left — Animated Flame Badge */}
              <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff3d00] to-[#ff8a00] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg animate-pulse">
                  <Flame size={15} className="fill-white" /> {badge}
                </span>
              </div>

              {/* Top Right — RERA & Wishlist */}
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-slate-800 shadow-md">
                  <ShieldCheck size={14} className="text-emerald-600" /> RERA Verified
                </span>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-800 shadow-md backdrop-blur-md transition hover:scale-110 hover:bg-white"
                >
                  <Heart className={`h-5 w-5 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-700"}`} />
                </button>
              </div>

              {/* Bottom Image Thumbnails & Info Bar */}
              <div className="absolute bottom-4 inset-x-4 z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-950/70 p-1.5 backdrop-blur-md border border-white/10">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImg(imgUrl)}
                      aria-label={`View photo ${idx + 1}`}
                      className={`relative h-11 w-14 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImg === imgUrl ? "border-gold scale-105" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>

                <span className="rounded-full bg-slate-950/80 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
                  {propertyType} • {p.listingType === "RENT" ? "For Rent" : "For Sale"}
                </span>
              </div>
            </div>

            {/* Right Column — Details & Actions */}
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-6 lg:p-10">
              {/* Header Info */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#B8962E]">
                    <Building2 size={14} /> {p.builder || "Touchstone Properties"}
                  </span>
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                    {p.possession || "Ready to Move"}
                  </span>
                </div>

                <h3 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug">
                  {title}
                </h3>

                <div className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                  <MapPin size={16} className="shrink-0 text-[#B8962E]" />
                  <span className="font-medium truncate">{location}</span>
                </div>

                {/* Price Display Banner */}
                <div className="mt-5 flex flex-wrap items-baseline gap-3 rounded-2xl bg-gradient-to-r from-[#FAF6ED] to-[#F5EFE0] p-4 border border-[#EBE1C7]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Starting Price</span>
                    <div className="font-numeric text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {price}
                    </div>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-[#B8962E] bg-white/80 px-3 py-1 rounded-full border border-[#EBE1C7] shadow-2xs">
                    ✦ Zero Floor Rise Fee
                  </span>
                </div>

                {/* Property Specs Pill Grid */}
                <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-[#B8962E]">
                      <Bed size={18} />
                    </div>
                    <div className="mt-1 font-numeric text-sm sm:text-base font-bold text-slate-900">
                      {bedrooms ? `${bedrooms} BHK` : "—"}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bedrooms</div>
                  </div>

                  <div className="text-center border-x border-slate-200">
                    <div className="flex items-center justify-center text-[#B8962E]">
                      <Bath size={18} />
                    </div>
                    <div className="mt-1 font-numeric text-sm sm:text-base font-bold text-slate-900">
                      {bathrooms ? `${bathrooms}` : "—"}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bathrooms</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center text-[#B8962E]">
                      <Maximize size={18} />
                    </div>
                    <div className="mt-1 font-numeric text-sm sm:text-base font-bold text-slate-900">
                      {area}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Carpet Area</div>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-600 line-clamp-3">
                  {description}
                </p>

                {/* Highlights Grid */}
                <div className="mt-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Project Highlights
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#B8962E]/15 text-[#B8962E]">
                          <Check size={11} strokeWidth={3} />
                        </span>
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-8 flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100">
                <Link
                  to="/property/$slug"
                  params={{ slug: p.slug }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 py-3 text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#B8962E] shadow-sm hover:shadow-md"
                >
                  View Details <ArrowRight size={15} />
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    enquireModal.open({
                      id: p.id,
                      title: p.title,
                      location: p.location,
                      price: p.price,
                      assignedStaffId: (p as any).assignedStaffId ?? null,
                    })
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#B8962E] px-5 py-3 text-xs sm:text-sm font-bold text-white transition-all hover:bg-amber-600 shadow-xs"
                >
                  <Send size={15} /> Enquire Now
                </button>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact on WhatsApp"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                >
                  <Phone size={16} />
                </a>

                <ShareButton
                  property={{ title, slug: p.slug, location, price, image: activeImg }}
                  className="h-11 w-11"
                />
              </div>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
