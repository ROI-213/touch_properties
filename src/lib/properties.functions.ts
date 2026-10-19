import { createServerFn } from "@tanstack/react-start";
import { query as dbQuery } from "@/server/db";
import { dbRowToProperty } from "@/hooks/useDbProperties";
import { properties as staticProperties, type Property } from "@/data/properties";

export const getPublicPropertiesFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<Property[]> => {
    try {
      const sql = `
        SELECT p.*,
               (SELECT row_to_json(b) FROM (SELECT id, name, display_name, contact_type, logo_url, primary_phone, whatsapp_number, email, website, show_on_website FROM builders WHERE id = p.builder_id) b) as builder,
               (SELECT row_to_json(o) FROM (SELECT id, name, display_name, contact_type, logo_url, primary_phone, whatsapp_number, email, website, show_on_website FROM builders WHERE id = p.owner_id) o) as owner,
               (SELECT row_to_json(l) FROM (SELECT zone, locality FROM locations WHERE id = p.location_id) l) as location,
               (SELECT coalesce(json_agg(row_to_json(img)), '[]') FROM (SELECT url, image_type, display_order FROM property_images WHERE property_id = p.id ORDER BY display_order ASC) img) as property_images
        FROM properties p
        WHERE is_active = true
        ORDER BY created_at DESC, display_order ASC
      `;
      const dbPromise = dbQuery(sql, []);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 10000)
      );
      const res = await Promise.race([dbPromise, timeoutPromise]);
      const rows = res.rows || [];
      const dbList = rows
        .map((row) => {
          try {
            return dbRowToProperty(row);
          } catch {
            return null;
          }
        })
        .filter((p): p is Property => Boolean(p));

      if (dbList.length === 0) return staticProperties;

      const seen = new Set<string>();
      const combined: Property[] = [];
      for (const p of [...dbList, ...staticProperties]) {
        const key = String(p.id ?? p.slug ?? p.title);
        const slugKey = `slug:${p.slug ?? ""}`;
        if (seen.has(key) || (p.slug && seen.has(slugKey))) continue;
        seen.add(key);
        if (p.slug) seen.add(slugKey);
        combined.push(p);
      }
      return combined;
    } catch (err) {
      console.warn("[getPublicPropertiesFn] error:", err);
      return staticProperties;
    }
  });
