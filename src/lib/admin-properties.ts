import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
export type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];
export type BuilderRow = Database["public"]["Tables"]["builders"]["Row"];
export type LocationRow = Database["public"]["Tables"]["locations"]["Row"];
export type AmenityRow = Database["public"]["Tables"]["amenities"]["Row"];
export type PropertyImageRow = Database["public"]["Tables"]["property_images"]["Row"];

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function listProperties() {
  const { data, error } = await supabase
    .from("properties")
    .select("*, builder:builders!properties_builder_id_fkey(name), location:locations!properties_location_id_fkey(zone, locality)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProperty(id: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPropertyImages(propertyId: string) {
  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export function notifyPropertyAdded(data?: any) {
  if (typeof window === "undefined") return;
  try {
    if (data && data.id) {
      try {
        const raw = localStorage.getItem("ts_recent_added_properties");
        const list = raw ? JSON.parse(raw) : [];
        const filtered = Array.isArray(list) ? list.filter((p: any) => p.id !== data.id) : [];
        filtered.unshift(data);
        localStorage.setItem("ts_recent_added_properties", JSON.stringify(filtered.slice(0, 30)));
      } catch {}
    }
    window.dispatchEvent(new CustomEvent("ts_property_added", { detail: data }));
    localStorage.setItem("ts_property_added_time", Date.now().toString());
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("ts_notifications_channel");
      bc.postMessage({ type: "PROPERTY_ADDED", data });
      bc.close();
    }
  } catch {}
}

export async function createNotificationForProperty(property: any) {
  if (!property || !property.id) return;
  if (property.is_active === false) return; // Do not notify draft/unpublished

  try {
    // Check if notification record already exists for this property
    const { data: existing } = await supabase
      .from("notifications" as any)
      .select("id")
      .eq("property_id", property.id)
      .maybeSingle();

    if (existing) return;

    const loc = property.location;
    const locationText = loc?.locality || loc?.zone || property.city || property.address || "";
    const titleText = property.project_name || "New Property";
    const message = `New property added: ${titleText}${locationText ? ` in ${locationText}` : ""}.`;

    const notificationPayload = {
      property_id: property.id,
      type: "new_property",
      title: "New Property Added",
      message: message,
      image_url: property.hero_image || property.image_url || null,
      is_read: false,
      is_active: true,
      created_at: property.created_at || new Date().toISOString(),
    };

    await supabase.from("notifications" as any).insert(notificationPayload);
  } catch (err) {
    console.warn("[admin-properties] createNotificationForProperty warning:", err);
  }
}

export async function createProperty(input: PropertyInsert) {
  const clean = sanitizePropertyPayload(input) as PropertyInsert;
  let assigned_staff_id = (clean as any).assigned_staff_id ?? null;
  if (!assigned_staff_id) {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const authId = auth?.user?.id;
      if (authId) {
        const { data: me } = await supabase
          .from("staff_users" as any)
          .select("id")
          .eq("auth_user_id", authId)
          .maybeSingle();
        const meId = (me as any)?.id as string | undefined;
        if (meId) assigned_staff_id = meId;
      }
    } catch { /* ignore */ }
  }
  const payload: PropertyInsert = {
    ...clean,
    slug: clean.slug || slugify(clean.project_name),
    is_active: true,
    created_at: new Date().toISOString(),
    ...(assigned_staff_id ? { assigned_staff_id } as any : {}),
  };
  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("*, location:locations(zone, locality)")
    .single();
  if (error) throw error;

  if (data) {
    await createNotificationForProperty(data);
  }

  notifyPropertyAdded(data);
  return data;
}

export async function updateProperty(id: string, patch: PropertyUpdate) {
  const clean = sanitizePropertyPayload(patch) as PropertyUpdate;
  const { data, error } = await supabase
    .from("properties")
    .update(clean)
    .eq("id", id)
    .select("*, location:locations(zone, locality)")
    .single();
  if (error) throw error;

  if (data && data.is_active) {
    await createNotificationForProperty(data);
    notifyPropertyAdded(data);
  }
  return data;
}

function sanitizePropertyPayload<T extends Record<string, any>>(payload: T) {
  // Forms can carry DB-generated fields or joined relation objects back from reads.
  // Sending those to PostgREST breaks create/update, so keep only real editable columns.
  const {
    id: _id,
    created_at,
    updated_at,
    builder,
    builders,
    location,
    locations,
    property_images,
    property_prices,
    property_configurations,
    property_amenities,
    amenities,
    ...clean
  } = payload as any;
  if (typeof clean.slug === "string" && !clean.slug.trim()) delete clean.slug;
  return clean;
}

export async function deleteProperty(id: string) {
  try {
    await supabase.from("notifications" as any).update({ is_active: false }).eq("property_id", id);
    await supabase.from("notifications" as any).delete().eq("property_id", id);
  } catch {}
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateProperty(id: string) {
  const original = await getProperty(id);
  if (!original) throw new Error("Property not found");
  const { id: _id, created_at, updated_at, slug, ...rest } = original;
  const copy: PropertyInsert = {
    ...rest,
    project_name: `${original.project_name} (Copy)`,
    slug: `${slug}-copy-${Date.now().toString(36)}`,
    is_active: false,
  };
  return createProperty(copy);
}

export async function addPropertyImage(propertyId: string, url: string, type: "gallery" | "floor_plan" | "hero" = "gallery", caption = "") {
  const { error } = await supabase.from("property_images").insert({
    property_id: propertyId,
    url,
    image_type: type,
    caption,
  });
  if (error) throw error;
}

export async function deletePropertyImage(id: string) {
  const { error } = await supabase.from("property_images").delete().eq("id", id);
  if (error) throw error;
}

// Property <-> Amenities (many-to-many)
export async function listPropertyAmenityIds(propertyId: string) {
  const { data, error } = await supabase
    .from("property_amenities")
    .select("amenity_id")
    .eq("property_id", propertyId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.amenity_id);
}

export async function setPropertyAmenities(propertyId: string, amenityIds: string[]) {
  const { error: delErr } = await supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", propertyId);
  if (delErr) throw delErr;
  if (amenityIds.length === 0) return;
  const rows = amenityIds.map((amenity_id) => ({ property_id: propertyId, amenity_id }));
  const { error } = await supabase.from("property_amenities").insert(rows);
  if (error) throw error;
}

// Builders
export async function listBuilders() {
  const { data, error } = await supabase.from("builders").select("*").order("display_order");
  if (error) throw error;
  return data ?? [];
}
export async function upsertBuilder(input: Partial<BuilderRow> & { name: string }) {
  const slug = input.slug || slugify(input.name);
  const payload = { ...input, slug } as any;
  const { data, error } = input.id
    ? await supabase.from("builders").update(payload).eq("id", input.id).select().single()
    : await supabase.from("builders").insert(payload).select().single();
  if (error) throw error;
  return data;
}
export async function deleteBuilder(id: string) {
  const { error } = await supabase.from("builders").delete().eq("id", id);
  if (error) throw error;
}

// Locations
export async function listLocations() {
  const { data, error } = await supabase.from("locations").select("*").order("zone").order("locality");
  if (error) throw error;
  return data ?? [];
}
export async function upsertLocation(input: Partial<LocationRow> & { locality: string; zone: string }) {
  const slug = input.slug || slugify(`${input.zone}-${input.locality}`);
  const payload = { city: "Bangalore", ...input, slug } as any;
  const { data, error } = input.id
    ? await supabase.from("locations").update(payload).eq("id", input.id).select().single()
    : await supabase.from("locations").insert(payload).select().single();
  if (error) throw error;
  return data;
}
export async function deleteLocation(id: string) {
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw error;
}

// Amenities
export async function listAmenities() {
  const { data, error } = await supabase.from("amenities").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}
export async function upsertAmenity(input: Partial<AmenityRow> & { name: string }) {
  const { data, error } = input.id
    ? await supabase.from("amenities").update(input as any).eq("id", input.id).select().single()
    : await supabase.from("amenities").insert(input as any).select().single();
  if (error) throw error;
  return data;
}
export async function deleteAmenity(id: string) {
  const { error } = await supabase.from("amenities").delete().eq("id", id);
  if (error) throw error;
}

// Dashboard counts
export async function getDashboardCounts() {
  const head = { count: "exact" as const, head: true };
  const [
    total, featured, topFeatured, hot,
    plot, villa, apt,
    customers, wishlist, activeProj,
  ] = await Promise.all([
    supabase.from("properties").select("*", head),
    supabase.from("properties").select("*", head).eq("is_featured", true),
    supabase.from("properties").select("*", head).eq("is_top_featured", true),
    supabase.from("properties").select("*", head).eq("is_hot", true),
    supabase.from("properties").select("*", head).eq("property_type", "Plot"),
    supabase.from("properties").select("*", head).eq("property_type", "Villa"),
    supabase.from("properties").select("*", head).eq("property_type", "Apartment"),
    supabase.from("profiles").select("*", head),
    supabase.from("wishlists").select("*", head),
    supabase.from("properties").select("*", head).eq("is_active", true),
  ]);
  return {
    totalProperties: total.count ?? 0,
    featured: featured.count ?? 0,
    topFeatured: topFeatured.count ?? 0,
    hot: hot.count ?? 0,
    plot: plot.count ?? 0,
    villa: villa.count ?? 0,
    apartment: apt.count ?? 0,
    customers: customers.count ?? 0,
    wishlist: wishlist.count ?? 0,
    activeProjects: activeProj.count ?? 0,
  };
}
