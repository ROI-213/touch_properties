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
  const images = Array.isArray(row.property_images) ? row.property_images : [];
  const builder = safeText(row.builder?.name || row.builders?.name, "Touchstone Properties");
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

  const priceLabel = row.starting_price
    ? `₹ ${formatINR(safeNumber(row.starting_price))}${row.price_max ? "" : " onwards"}`
    : "Price on request";

  return {
    id,
    slug: safeSlug(row.slug, id),
    title,
    builder,
    location: safeText(row.address, `${locality}${zone ? `, ${zone} Bangalore` : ""}`) || "Bangalore",
    area: locality || zone || "Bangalore",
    city: "Bangalore",
    type: (safeText(row.property_type, "Apartment") as Property["type"]),
    listingType: row.listing_type === "Rent" ? "RENT" : "BUY",
    price: priceLabel,
    priceValue: safeNumber(row.starting_price),
    bhk: parseInt((Array.isArray(row.bhk_options) ? row.bhk_options[0] : "0")?.toString() ?? "0", 10) || 0,
    baths: 0,
    sqft: parseInt((row.carpet_area ?? "0").toString(), 10) || 0,
    description: safeText(row.overview || row.highlights, "Verified property in Bangalore."),
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
  } as Property & { isTopFeatured: boolean; topFeaturedRank: number | null; assignedStaffId: string | null; galleryImages: string[] };
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

