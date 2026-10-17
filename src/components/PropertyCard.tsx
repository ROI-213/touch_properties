import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Heart, Bed, Bath, Maximize, MapPin, Phone, Check } from "lucide-react";
import type { Property } from "@/data/properties";
import { FALLBACK_PROPERTY_IMAGE, resolveLocalImage } from "@/data/siteImages";
import { ShareButton } from "@/components/ShareButton";
import { useWishlist, useToggleWishlist } from "@/hooks/useWishlist";
import { useEnquireModal } from "@/contexts/EnquireModalContext";
import { useCompareStore } from "@/hooks/useCompareStore";

interface PropertyCardProps {
  p: Property;
  index?: number;
  view?: "grid" | "list";
}

export function PropertyCard({
  p,
  index = 0,
  view = "grid",
}: PropertyCardProps) {
  const safeProperty: Property = {
    ...(p ?? {}),
    id: p?.id || `property-${index}`,
    slug: p?.slug || p?.id || `property-${index}`,
    title: p?.title || "Touch Stone Property",
    builder: p?.builder || "Touch Stone Properties",
    location: p?.location || "Bangalore",
    area: p?.area || "Bangalore",
    city: p?.city || "Bangalore",
    type: p?.type || "Apartment",
    listingType: p?.listingType || "BUY",
    price: p?.price || "Price on request",
    priceValue: Number.isFinite(Number(p?.priceValue)) ? Number(p.priceValue) : 0,
    bhk: Number.isFinite(Number(p?.bhk)) ? Number(p.bhk) : 0,
    baths: Number.isFinite(Number(p?.baths)) ? Number(p.baths) : 0,
    sqft: Number.isFinite(Number(p?.sqft)) ? Number(p.sqft) : 0,
    description: p?.description || "Verified property in Bangalore.",
    image: resolveLocalImage(p?.image, FALLBACK_PROPERTY_IMAGE),
  };
  p = safeProperty;
  const { has } = useWishlist();
  const toggle = useToggleWishlist();
  const liked = has(p.id);
  const isList = view === "list";
  const enquire = useEnquireModal();
  
  const isComparing = useCompareStore((s) => s.ids.includes(p.id));
  const toggleCompare = useCompareStore((s) => s.toggle);

  return (
    <motion.article
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -4 }}
      className={`group flex h-full flex-col justify-between overflow-hidden rounded-[14px] bg-card shadow-card transition-shadow duration-300 hover:shadow-elevated ${
        isList ? "flex-col sm:flex-row" : ""
      }`}
    >
      {/* Image */}
      <div
        className={`relative overflow-hidden ${
          isList ? "h-[160px] sm:h-auto sm:w-[240px] sm:flex-shrink-0" : "h-[155px] sm:h-[160px] md:h-[165px]"
        }`}
      >
        <img
          src={p.image}
          alt={p.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />

        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white ${
            p.listingType === "BUY" ? "bg-gold" : "bg-sage"
          }`}
        >
          {p.listingType}
        </span>

        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          <ShareButton
            property={{
              title: p.title,
              slug: p.slug,
              location: p.location,
              price: p.price,
              image: p.image,
            }}
            className="!h-7 !w-7 sm:!h-8 sm:!w-8 !border-transparent !bg-black/30 !text-white backdrop-blur-sm hover:!bg-black/50 hover:!text-white"
          />
          <motion.button
            whileTap={{ scale: 1.4 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(p.id);
            }}
            aria-label="Save to wishlist"
            className="grid h-7 w-7 place-items-center rounded-full bg-black/30 backdrop-blur-sm transition hover:bg-black/50 sm:h-8 sm:w-8"
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-crimson text-crimson" : "text-white"}`} />
          </motion.button>
        </div>

        {p.premium && (
          <div className="absolute left-0 top-10 bg-gold px-2 py-0.5 text-[10px] font-semibold text-charcoal shadow-md">
            ⭐ Premium
          </div>
        )}

        {p.sold && (
          <div className="absolute inset-0 grid place-items-center bg-crimson/45">
            <span className="font-display text-2xl font-bold text-white sm:text-4xl">SOLD</span>
          </div>
        )}
        {p.rented && (
          <div className="absolute inset-0 grid place-items-center bg-sage/55">
            <span className="font-display text-2xl font-bold text-white sm:text-4xl">RENTED</span>
          </div>
        )}

        <div
          className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-6"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.65))" }}
        >
          <div className="font-numeric text-sm font-bold text-white sm:text-base">{p.price}</div>
        </div>
      </div>

      {/* Body */}
      <div className={`flex flex-1 flex-col justify-between p-3 sm:p-3.5 ${isList ? "flex-1" : ""}`}>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gold truncate">
            {p.builder}
          </div>
          <h3 className="mt-0.5 font-display text-sm font-semibold leading-snug text-charcoal sm:text-[15px] line-clamp-1">
            {p.title}
          </h3>
          <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-charcoal/60">
            <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{p.location}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1 w-full max-w-full overflow-hidden">
            {p.bhk > 0 && <Spec icon={<Bed className="h-3 w-3" />}>{p.bhk} BHK</Spec>}
            {p.baths > 0 && <Spec icon={<Bath className="h-3 w-3" />}>{p.baths}</Spec>}
            {p.sqft > 0 && <Spec icon={<Maximize className="h-3 w-3" />}>{p.sqft.toLocaleString()} sqft</Spec>}
            {p.possession && (
              <span className="inline-flex items-center rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-charcoal/80">
                {p.possession}
              </span>
            )}
          </div>

          <p
            className={`mt-1.5 text-[11.5px] leading-relaxed text-charcoal/65 ${
              isList ? "line-clamp-2" : "line-clamp-1"
            }`}
          >
            {p.description}
          </p>
        </div>

        {/* Card Footer Actions */}
        <div className="mt-2.5 border-t border-charcoal/5 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCompare(p.id);
                }}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-[11.5px] font-semibold text-charcoal/80 select-none hover:text-gold transition-colors active:scale-95 sm:text-[12px]"
                aria-label={`Compare ${p.title}`}
              >
                <span
                  className={`grid h-4 w-4 place-items-center rounded border transition-all duration-200 ${
                    isComparing
                      ? "bg-gold border-gold text-white shadow-xs"
                      : "border-charcoal/40 bg-white hover:border-gold"
                  }`}
                >
                  {isComparing && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span>Compare</span>
              </button>

              <Link
                to="/property/$slug"
                params={{ slug: p.slug }}
                className="shrink-0 text-[11.5px] font-bold text-gold hover:text-gold-light whitespace-nowrap sm:text-xs"
              >
                View Details →
              </Link>
            </div>

            <button
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
              className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-gold bg-gold/5 px-3 py-1.5 text-[11.5px] font-semibold text-gold transition-colors hover:bg-gold hover:text-white whitespace-nowrap sm:text-xs shadow-xs"
            >
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Enquire
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Spec({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[11px] text-charcoal/75 sm:px-2.5 sm:py-1 sm:text-[12px] whitespace-nowrap">
      {icon}
      {children}
    </span>
  );
}
