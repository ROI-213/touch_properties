// Server-only admin Supabase client.
//
// Wraps @supabase/supabase-js with an explicit realtime.transport so the
// bundled @supabase/realtime-js does not throw
// "Node.js 20 detected without native WebSocket support" on the
// Cloudflare Worker runtime (its nodejs_compat shim reports process.versions.node
// as "20", but globalThis.WebSocket is available).
//
// Load ONLY inside server handlers:
//   const { supabaseAdmin } = await import("@/integrations/supabase/admin.server");

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSupabaseAdminClient() {
  // Use public URL (available on server) and secret admin key.
  const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://svdbmoozphbivdvdmlfu.supabase.co";

  const SUPABASE_ADMIN_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZGJtb296cGhiaXZkdmRtbGZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYyNDI0OCwiZXhwIjoyMTAwMjAwMjQ4fQ.aahpKZPO6PHPArXWbn77LTGuiuEA6SsWjPIjnEEJ-kQ";

  const nativeWebSocket =
    typeof globalThis !== "undefined" && typeof (globalThis as any).WebSocket === "function"
      ? (globalThis as any).WebSocket
      : undefined;

  return createClient<Database>(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    // Admin operations don't need realtime, but the client always constructs a
    // RealtimeClient. Provide the runtime's native WebSocket so realtime-js
    // stops complaining about missing Node ws support.
    ...(nativeWebSocket
      ? { realtime: { transport: nativeWebSocket as any } }
      : {}),
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
