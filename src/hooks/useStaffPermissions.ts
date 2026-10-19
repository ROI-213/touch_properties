import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import type { StaffActionKey } from "@/lib/staff-modules";

export type PermissionMap = Record<string, {
  view: boolean; add: boolean; edit: boolean; delete: boolean; publish: boolean; export: boolean;
}>;

export function useStaffPermissions() {
  const { user, isReady } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const q = useQuery({
    queryKey: ["staff-permissions-self", user?.id],
    enabled: isReady && !!user && !isAdmin && !adminLoading,
    queryFn: async (): Promise<{ staffId: string | null; perms: PermissionMap }> => {
      if (!user) return { staffId: null, perms: {} };
      const { data: staff } = await supabase
        .from("staff_users")
        .select("id, status")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!staff || staff.status !== "active") return { staffId: null, perms: {} };
      const { data: rows } = await supabase
        .from("staff_permissions")
        .select("*")
        .eq("staff_user_id", staff.id);
      const perms: PermissionMap = {};
      for (const r of rows ?? []) {
        perms[r.module_name] = {
          view: !!r.can_view, add: !!r.can_add, edit: !!r.can_edit,
          delete: !!r.can_delete, publish: !!r.can_publish, export: !!r.can_export,
        };
      }
      return { staffId: staff.id, perms };
    },
  });

  const perms = q.data?.perms;
  const can = useCallback((moduleKey: string, action: StaffActionKey = "view"): boolean => {
    if (isAdmin) return true;
    const entry = perms?.[moduleKey];
    return !!entry?.[action];
  }, [isAdmin, perms]);

  return {
    isAdmin,
    staffId: q.data?.staffId ?? null,
    perms: perms ?? {},
    isLoading: adminLoading || (q.isLoading && !isAdmin),
    can,
    isStaff: !isAdmin && !!q.data?.staffId,
  };
}
