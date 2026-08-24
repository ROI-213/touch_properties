import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { query } from "@/server/db";
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
  const { rows } = await query(
    "SELECT value FROM public.site_settings WHERE key = $1",
    ["about_page"],
  );
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