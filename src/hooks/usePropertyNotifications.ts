import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NotificationItem = {
  id: string;
  property_id: string;
  title: string;
  message: string;
  project_name: string;
  slug: string;
  image_url: string | null;
  location_text: string | null;
  price_text: string | null;
  property_type: string | null;
  created_at: string;
  isRead: boolean;
};

const READ_IDS_KEY = "ts_read_notification_ids";
const CLEARED_IDS_KEY = "ts_cleared_notification_ids";

// Cache the (heavy) properties fetch so it only runs once per session. The
// notifications dropdown derives most of its items from the properties table;
// fetching it on every page load (and every 2.5s) was hammering the DB and
// making the site feel like it was constantly reloading.
let cachedProperties: any[] | null = null;

function getStoredIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

function formatPrice(row: any): string | null {
  if (row.price_text) return row.price_text;
  if (row.price) return `₹ ${row.price}`;
  const n = Number(row.starting_price ?? row.priceValue);
  if (!n || isNaN(n)) return null;
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2).replace(/\.?0+$/, "")} Cr onwards`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2).replace(/\.?0+$/, "")} L onwards`;
  return `₹ ${n.toLocaleString("en-IN")} onwards`;
}

function resolveImage(row: any): string | null {
  if (row.image_url) return row.image_url;
  if (row.hero_image) return row.hero_image;
  if (row.image) return row.image;
  if (Array.isArray(row.property_images) && row.property_images.length > 0) {
    const hero = row.property_images.find((i: any) => i?.image_type === "hero");
    return hero?.url || row.property_images[0]?.url || null;
  }
  return null;
}

// Accepts both raw DB rows (from supabase) and mapped Property rows (from the
// shared public-properties cache), so the dropdown can reuse cached data.
function normalizeProp(row: any): any {
  if (!row) return null;
  if (row.is_active === false) return null;
  const loc = row.location;
  const locText =
    row.location_text || loc?.locality || loc?.zone || row.area || row.city || row.address || "";
  return {
    id: row.id,
    project_name: row.project_name || row.title || "New Property",
    slug: row.slug || row.id,
    image_url: resolveImage(row),
    location_text: locText,
    price_text: formatPrice(row),
    property_type: row.property_type || row.type || null,
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export function usePropertyNotifications(options?: { deep?: boolean }) {
  const [readIds, setReadIds] = useState<string[]>(() => getStoredIds(READ_IDS_KEY));
  const [clearedIds, setClearedIds] = useState<string[]>(() => getStoredIds(CLEARED_IDS_KEY));
  const [rawNotifications, setRawNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const deepRef = useRef(false);

  const fetchNotifications = useCallback(async (deep = false) => {
    if (deep) deepRef.current = true;
    const includeProperties = deep || !!cachedProperties;

    try {
      if (deep) setIsLoading(true);

      // 1. Query notifications table (light, always safe)
      let notifData: any[] | null = null;
      try {
        const { data, error } = await supabase
          .from("notifications" as any)
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(30);
        if (!error && data) {
          notifData = data;
        }
      } catch {}

      // 2. Query properties table only when needed (bell opened, or cached)
      let propData: any[] | null = null;
      if (includeProperties) {
        if (cachedProperties) {
          propData = cachedProperties;
        } else {
          try {
            const { data, error } = await supabase
              .from("properties")
              .select(
                "*, location:locations!properties_location_id_fkey(zone, locality), property_images(url, image_type)",
              )
              .order("created_at", { ascending: false })
              .limit(30);
            if (!error && data) {
              propData = data;
              cachedProperties = data;
            }
          } catch {}

          if (!propData) {
            try {
              const { data } = await supabase
                .from("properties")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(30);
              if (data) {
                propData = data;
                cachedProperties = data;
              }
            } catch {}
          }
        }
      }

      // 3. Read locally stored added properties (instant cross-tab fallback)
      let localAddedProps: any[] = [];
      try {
        const raw = localStorage.getItem("ts_recent_added_properties");
        if (raw) {
          localAddedProps = JSON.parse(raw);
        }
      } catch {}

      const itemsMap = new Map<string, any>();

      // First load DB properties
      if (propData) {
        for (const p of propData) {
          const norm = normalizeProp(p);
          if (!norm) continue;
          itemsMap.set(p.id, {
            id: `notif_${p.id}`,
            property_id: p.id,
            title: "New Property Added",
            message: `New property added: ${norm.project_name}${norm.location_text ? ` in ${norm.location_text}` : ""}.`,
            ...norm,
          });
        }
      }

      // Layer local properties (if newly added via admin panel locally)
      if (Array.isArray(localAddedProps)) {
        for (const p of localAddedProps) {
          if (!p || !p.id) continue;
          const norm = normalizeProp(p);
          if (!norm) continue;
          itemsMap.set(p.id, {
            ...itemsMap.get(p.id),
            id: `notif_${p.id}`,
            property_id: p.id,
            title: "New Property Added",
            message: `New property added: ${norm.project_name}${norm.location_text ? ` in ${norm.location_text}` : ""}.`,
            ...norm,
          });
        }
      }

      // Layer explicit notifications rows over them
      if (notifData) {
        for (const n of notifData) {
          const propId = n.property_id || n.id;
          itemsMap.set(propId, {
            ...itemsMap.get(propId),
            ...n,
            id: n.id || `notif_${propId}`,
            property_id: propId,
          });
        }
      }

      const combined = Array.from(itemsMap.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );

      setRawNotifications(combined);
    } catch (err) {
      console.warn("[usePropertyNotifications] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial light fetch on mount (notifications table only — no heavy query)
  useEffect(() => {
    void fetchNotifications(false).finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  // Poll: light fetch every 60s (was 2.5s — the constant churn made the page
  // feel like it was reloading and hammered the database on every visitor).
  useEffect(() => {
    const interval = setInterval(() => void fetchNotifications(false), 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Deep fetch (notifications + properties) when the dropdown is opened.
  const deep = options?.deep;
  useEffect(() => {
    if (deep) void fetchNotifications(true);
  }, [deep, fetchNotifications]);

  // Realtime + storage + BroadcastChannel sync
  useEffect(() => {
    const channel = supabase
      .channel("realtime-notifications-v7")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void fetchNotifications(false),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        cachedProperties = null;
        void fetchNotifications(deepRef.current);
      })
      .subscribe();

    const handleCustomAdd = () => void fetchNotifications(deepRef.current);
    window.addEventListener("ts_property_added", handleCustomAdd);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("ts_notifications_channel");
        bc.onmessage = (e) => {
          if (e.data?.type === "PROPERTY_ADDED") {
            cachedProperties = null;
            void fetchNotifications(deepRef.current);
          }
        };
      } catch {}
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === READ_IDS_KEY) {
        setReadIds(getStoredIds(READ_IDS_KEY));
      } else if (e.key === CLEARED_IDS_KEY) {
        setClearedIds(getStoredIds(CLEARED_IDS_KEY));
      } else if (e.key === "ts_property_added_time") {
        void fetchNotifications(false);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("ts_property_added", handleCustomAdd);
      window.removeEventListener("storage", handleStorageChange);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [fetchNotifications]);

  // Filter out cleared notifications and add isRead flag
  const notifications: NotificationItem[] = useMemo(() => {
    return rawNotifications
      .filter((n) => !clearedIds.includes(n.id) && !clearedIds.includes(n.property_id))
      .map((n) => {
        const prop = n.property || {};
        const loc = prop.location || n.location || {};
        const locText = n.location_text || loc.locality || loc.zone || "";
        const slug = prop.slug || n.slug || n.property_id || n.id;
        const projName = n.project_name || prop.project_name || n.title || "New Property";
        const isRead = readIds.includes(n.id) || readIds.includes(n.property_id);

        return {
          id: n.id,
          property_id: n.property_id || n.id,
          title: n.title || "New Property Added",
          message: n.message || `New property added: ${projName}.`,
          project_name: projName,
          slug,
          image_url: resolveImage(n) || resolveImage(prop),
          location_text: locText,
          price_text: formatPrice(n) || formatPrice(prop),
          property_type: n.property_type || prop.property_type || null,
          created_at: n.created_at || new Date().toISOString(),
          isRead,
        };
      });
  }, [rawNotifications, readIds, clearedIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveStoredIds(READ_IDS_KEY, next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const allIds = notifications.map((n) => n.id);
      const merged = Array.from(new Set([...prev, ...allIds]));
      saveStoredIds(READ_IDS_KEY, merged);
      return merged;
    });
  }, [notifications]);

  const clearNotification = useCallback((id: string) => {
    setClearedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveStoredIds(CLEARED_IDS_KEY, next);
      return next;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setClearedIds((prev) => {
      const allIds = notifications.map((n) => n.id);
      const merged = Array.from(new Set([...prev, ...allIds]));
      saveStoredIds(CLEARED_IDS_KEY, merged);
      return merged;
    });
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refetch: fetchNotifications,
  };
}
