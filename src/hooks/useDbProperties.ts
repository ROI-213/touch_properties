import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { properties as staticProperties, type Property } from "@/data/properties";
import { FALLBACK_PROPERTY_IMAGE, resolveLocalImage } from "@/data/siteImages";


const FALLBACK_IMAGE = FALLBACK_PROPERTY_IMAGE;
const safeText = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value : fallback;
const safeNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const safeSlug = (value: unknown, fallback: string) =>
  safeText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;

// Map a DB property row to the legacy Property type used across the public site
export function dbRowToProperty(p: any): Property {
  const row = p ?? {};
  const details = (row.details && typeof row.details === "object" ? row.details : {}) as Record<string, any>;
  const images = Array.isArray(row.property_images) ? row.property_images : [];
  const builder = safeText(
    row.builder?.display_name || row.builder?.name || row.builders?.name,
    "Touchstone Properties",
  );
  const ownerName = safeText(
    row.owner?.display_name || row.owner?.name || details.owner_name,
  );
  const subtitle = safeText(details.subtitle || details.tagline);
  const zone = safeText(row.location?.zone || row.locations?.zone);
  const locality = safeText(row.location?.locality || row.locations?.locality);
  const id = safeText(row.id, `property-${safeText(row.slug, "listing")}`);
  const title = safeText(row.project_name, "Touch Stone Property");
  const heroImg =
    safeText(row.hero_image) ||
    safeText(images.find((i: any) => i?.image_type === "hero")?.url) ||
    safeText(images[0]?.url) ||
    FALLBACK_IMAGE;

  const resolvedHero = resolveLocalImage(heroImg, FALLBACK_IMAGE);
  const rawGallery = images
    .map((i: any) => safeText(i?.url))
    .filter(Boolean)
    .map((u: string) => resolveLocalImage(u, FALLBACK_IMAGE));
  const galleryImages = Array.from(new Set([resolvedHero, ...rawGallery]));

  const priceNum = safeNumber(row.starting_price);
  const priceLabel = priceNum > 0
    ? `₹ ${formatINR(priceNum)}${row.price_max ? "" : " onwards"}`
    : "Price on request";

  const rawSqftStr = String(row.carpet_area || details.super_builtup_area || row.unit_sizes || "0")
    .split("-")[0]
    .replace(/[^\d]/g, "");
  const sqft = parseInt(rawSqftStr, 10) || 0;

  const rawBhkStr = (
    (Array.isArray(row.bhk_options) && row.bhk_options[0]) ||
    details.bhk_display_label ||
    "0"
  ).toString();
  const bhk = parseInt(rawBhkStr, 10) || 0;
  const baths = parseInt(String(details.bathrooms ?? "0").replace(/[^\d]/g, ""), 10) || 0;

  return {
    id,
    slug: safeSlug(row.slug, id),
    title,
    subtitle: subtitle || undefined,
    builder,
    ownerName: ownerName || undefined,
    location: safeText(row.address, `${locality}${zone ? `, ${zone}` : ""}`) || "Bangalore",
    area: locality || zone || "Bangalore",
    city: "Bangalore",
    type: (safeText(row.property_type, "Apartment") as Property["type"]),
    listingType: row.listing_type === "Rent" ? "RENT" : "BUY",
    price: priceLabel,
    priceValue: priceNum,
    bhk,
    baths,
    sqft,
    description: safeText(row.overview || subtitle || row.highlights, "Verified property in Bangalore."),
    image: resolvedHero,
    galleryImages,
    possession: row.is_ready_to_move ? "Ready to Move" : "Under Construction",
    featured: row.is_featured || undefined,
    premium: row.is_top_featured || undefined,
    trending: row.is_trending || row.is_hot || undefined,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : safeText(row.created_at),
    isTopFeatured: !!row.is_top_featured,
    topFeaturedRank: typeof row.top_featured_rank === "number" ? row.top_featured_rank : null,
    assignedStaffId: row.assigned_staff_id ?? null,
    aboutProperty: safeText(row.overview),
    highlightsText: safeText(row.highlights || details.property_details),
    locationAdvantages: safeText(row.location_advantages || details.location_advantages),
    idealFor: safeText(details.ideal_for),
    details,
  } as Property & {
    isTopFeatured: boolean;
    topFeaturedRank: number | null;
    assignedStaffId: string | null;
    galleryImages: string[];
    aboutProperty?: string;
    highlightsText?: string;
    locationAdvantages?: string;
    idealFor?: string;
    details?: Record<string, any>;
  };
}

function formatINR(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2).replace(/\.?0+$/, "")} L`;
  return n.toLocaleString("en-IN");
}

import { getPublicPropertiesFn } from "@/lib/properties.functions";

export function useDbProperties(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: ["public-properties"],
    queryFn: async (): Promise<Property[]> => {
      try {
        return await getPublicPropertiesFn();
      } catch (err) {
        console.warn("[useDbProperties] query exception:", err);
        return staticProperties;
      }
    },
    initialData: staticProperties,
    initialDataUpdatedAt: 0,
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
  });

  const propertyData = Array.isArray(query.data) && query.data.length > 0 ? query.data : staticProperties;

  return {
    data: propertyData,
    isLoading: false,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

