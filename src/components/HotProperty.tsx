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

  const propGallery = Array.isArray((p as any).galleryImages)
    ? ((p as any).galleryImages as string[])
        .filter(Boolean)
        .map((img) => resolveLocalImage(img, defaultImage))
    : [];
  const galleryImages = settings?.override_image
    ? [defaultImage]
    : Array.from(new Set(propGallery.length > 0 ? [defaultImage, ...propGallery] : [defaultImage])).slice(0, 4);

  const [activeImg, setActiveImg] = useState(defaultImage);

  const title = settings?.override_title || p.title;
  const location = settings?.override_location || p.location;
  const price = settings?.override_price || p.price;
  const propertyType = settings?.override_property_type || p.type;
  const bedrooms = settings?.override_bedrooms ?? p.bhk;
  const bathrooms = settings?.override_bathrooms ?? p.baths;
  const area = settings?.override_area || (p.sqft ? `${p.sqft.toLocaleString()} sq.ft` : "—");
  const badge = settings?.badge_text || "Hot Deal";

  const waHref =
    settings?.cta_contact_url ||
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `Hi, I'm interested in the Hot Property: ${title} (${location}). Please share brochure and price list.`,
    )}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FBF9F5] via-white to-[#FBF9F5] py-4 sm:py-6 px-2 sm:px-4 w-full">
      {/* Background Orbs & Accents */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto w-full">
        {/* Compact Section Header */}
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-[#B8962E]">
            <Sparkles size={11} className="text-[#B8962E]" /> Exclusive Spotlight
          </span>
          <h2 className="mt-1 font-display text-xl sm:text-2xl md:text-[26px] font-bold text-slate-900 leading-tight">
            Hot Property <span className="italic text-[#B8962E]">of the Week</span>
          </h2>
        </motion.div>

        {/* Compact Featured Showcase Card */}
        <motion.article
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="group relative mt-3 sm:mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-500 hover:shadow-[0_16px_36px_rgba(184,150,46,0.12)] hover:border-gold/30"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            {/* Left Column — Compact Image */}
            <div className="relative overflow-hidden md:col-span-5 bg-slate-900 h-44 sm:h-48 md:h-[200px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={activeImg}
                  alt={title}
                  initial={{ scale: 1.03, opacity: 0.85 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0.7 }}
                  transition={{ duration: 0.4 }}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/30 pointer-events-none" />

              {/* Top Left — Hot Deal Badge */}
              <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff3d00] to-[#ff8a00] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
                  <Flame size={11} className="fill-white" /> {badge}
                </span>
                <span className="rounded-full bg-slate-950/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md border border-white/10">
                  {propertyType}
                </span>
              </div>

              {/* Top Right — Wishlist */}
              <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                  className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-white/95 text-slate-800 shadow-md backdrop-blur-md transition hover:scale-110"
                >
                  <Heart className={`h-3.5 w-3.5 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-700"}`} />
                </button>
              </div>

              {/* Bottom Thumbnails & Status */}
              <div className="absolute bottom-2 inset-x-2.5 z-10 flex items-center justify-between gap-2">
                {galleryImages.length > 1 ? (
                  <div className="flex items-center gap-1 rounded-lg bg-slate-950/65 p-1 backdrop-blur-md border border-white/10">
                    {galleryImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImg(imgUrl)}
                        aria-label={`View photo ${idx + 1}`}
                        className={`relative h-6 w-8 overflow-hidden rounded border transition-all ${
                          activeImg === imgUrl ? "border-gold scale-105" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div />
                )}

                <span className="shrink-0 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-md shadow-xs">
                  {p.possession || "Ready to Move"}
                </span>
              </div>
            </div>

            {/* Right Column — Compact Name & Small Details */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4 md:col-span-7 md:px-5 md:py-3.5">
              <div>
                {/* Builder & Verified Tag */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-[#B8962E] truncate">
                    <Building2 size={12} className="shrink-0" />
                    <span className="truncate">{p.builder || "Touchstone Properties"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 shrink-0">
                    <ShieldCheck size={12} className="text-emerald-600" /> RERA
                  </span>
                </div>

                {/* Property Name */}
                <h3 className="mt-1 font-display text-lg sm:text-2xl font-bold text-slate-900 leading-snug line-clamp-1">
                  {title}
                </h3>

                {/* Location */}
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={13} className="shrink-0 text-[#B8962E]" />
                  <span className="truncate">{location}</span>
                </div>

                {/* Price + Small Key Details Row */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FAF6ED] px-3 py-2.5 border border-[#EBE1C7]">
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                      Starting Price
                    </span>
                    <span className="font-numeric text-base sm:text-xl font-extrabold text-slate-900">
                      {price}
                    </span>
                  </div>

                  {/* Compact Spec Pills */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-700">
                    {bedrooms ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 border border-slate-200/80 shadow-2xs">
                        <Bed size={13} className="text-[#B8962E]" /> {bedrooms} BHK
                      </span>
                    ) : null}
                    {bathrooms ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 border border-slate-200/80 shadow-2xs">
                        <Bath size={13} className="text-[#B8962E]" /> {bathrooms}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 border border-slate-200/80 shadow-2xs">
                      <Maximize size={12} className="text-[#B8962E]" /> {area}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Single-Row Action Bar */}
              <div className="mt-3.5 sm:mt-4 flex items-center gap-1.5 sm:gap-2 pt-3 border-t border-slate-100">
                <Link
                  to="/property/$slug"
                  params={{ slug: p.slug }}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-slate-900 px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-white transition-all hover:bg-[#B8962E]"
                >
                  View Details <ArrowRight size={13} />
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
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[#B8962E] px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-white transition-all hover:bg-amber-600"
                >
                  <Send size={12} /> Enquire
                </button>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact on WhatsApp"
                  className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                >
                  <Phone size={14} />
                </a>

                <ShareButton
                  property={{ title, slug: p.slug, location, price, image: activeImg }}
                  className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                />
              </div>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
