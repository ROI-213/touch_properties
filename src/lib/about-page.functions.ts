import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AboutPageContent } from "./site-cms";

const aboutPageContentSchema = z.object({
  hero: z.record(z.string(), z.unknown()),
  intro: z.record(z.string(), z.unknown()),
  mvv: z.record(z.string(), z.unknown()),
  trust: z.record(z.string(), z.unknown()),
  stats: z.record(z.string(), z.unknown()),
  services: z.record(z.string(), z.unknown()),
  process: z.record(z.string(), z.unknown()),
  cta: z.record(z.string(), z.unknown()),
});

export const getAboutPageContentFn = createServerFn({ method: "GET" }).handler(async () => {
  // Direct PostgREST fetch — avoids @supabase/supabase-js so RealtimeClient
  // never initializes on runtimes without a native WebSocket (e.g. Node 20).
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://svdbmoozphbivdvdmlfu.supabase.co";
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ThrfnIRx5NNAaV-xLkVftg_McfWpTMh";
  const res = await fetch(
    `${url}/rest/v1/site_settings?key=eq.about_page&select=value`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) {
    throw new Error(`About Us content read failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as Array<{ value: unknown }>;
  return (rows[0]?.value ?? null) as Partial<AboutPageContent> | null;
});

export const updateAboutPageContentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => aboutPageContentSchema.parse(data) as AboutPageContent)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: adminErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (adminErr) throw new Error(adminErr.message);

    const { data: canEdit, error: permErr } = await context.supabase.rpc("has_staff_permission", {
      _module: "about_us",
      _action: "edit",
    });
    if (permErr) throw new Error(permErr.message);

    if (isAdmin !== true && canEdit !== true) {
      throw new Error("Forbidden: About Us edit permission required");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/admin.server");
    const { data: saved, error } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        {
          key: "about_page",
          value: JSON.parse(JSON.stringify(data)),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      )
      .select("value")
      .single();

    if (error) throw new Error(`About Us content save failed: ${error.message}`);
    return saved.value as Partial<AboutPageContent>;
  });