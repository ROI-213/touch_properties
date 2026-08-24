import { supabase } from "@/integrations/supabase/client";

export type StaffUser = {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  mobile: string | null;
  designation: string | null;
  employee_code: string | null;
  username: string | null;
  department: string | null;
  branch: string | null;
  territory: string | null;
  joining_date: string | null;
  deactivated_at: string | null;
  status: "active" | "inactive";
  plain_password?: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffPermission = {
  id: string;
  staff_user_id: string;
  module_name: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_publish: boolean;
  can_export: boolean;
};

export type StaffTask = {
  id: string;
  title: string;
  description: string | null;
  related_module: string | null;
  assigned_to: string | null;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  status: "pending" | "in_progress" | "completed" | "rejected";
  admin_remarks: string | null;
  staff_notes: string | null;
  attachment_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function listStaff(): Promise<StaffUser[]> {
  const { data, error } = await supabase
    .from("staff_users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StaffUser[];
}

export async function listStaffPermissions(staffUserId: string): Promise<StaffPermission[]> {
  const { data, error } = await supabase
    .from("staff_permissions")
    .select("*")
    .eq("staff_user_id", staffUserId);
  if (error) throw error;
  return (data ?? []) as StaffPermission[];
}

export async function upsertStaffPermissions(
  staffUserId: string,
  perms: Omit<StaffPermission, "id" | "staff_user_id">[],
) {
  // Replace strategy: delete + insert
  const { error: delErr } = await supabase
    .from("staff_permissions")
    .delete()
    .eq("staff_user_id", staffUserId);
  if (delErr) throw delErr;
  if (perms.length === 0) return;
  const rows = perms.map((p) => ({ staff_user_id: staffUserId, ...p }));
  const { error } = await supabase.from("staff_permissions").insert(rows);
  if (error) throw error;
}

/** Typed shim for staff_users updates — the generated client types don't cover this table. */
async function updateStaffUsersRow(id: string, patch: Record<string, unknown>) {
  const table = supabase.from("staff_users") as unknown as {
    update: (p: Record<string, unknown>) => {
      eq: (
        col: string,
        val: string,
      ) => PromiseLike<{ error: { message: string; details?: string; hint?: string } | null }>;
    };
  };
  const { error } = await table.update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateStaffStatus(id: string, status: "active" | "inactive") {
  const patch = {
    status,
    deactivated_at: status === "inactive" ? new Date().toISOString() : null,
  };
  await updateStaffUsersRow(id, patch);
}

export async function updateStaffProfile(
  id: string,
  patch: {
    name?: string;
    mobile?: string | null;
    designation?: string | null;
    employee_code?: string | null;
    username?: string | null;
    department?: string | null;
    branch?: string | null;
    territory?: string | null;
    joining_date?: string | null;
  },
) {
  await updateStaffUsersRow(id, patch);
}

// Tasks
export async function listTasks(opts?: { assignedTo?: string }): Promise<StaffTask[]> {
  let q = supabase.from("staff_tasks").select("*").order("created_at", { ascending: false });
  if (opts?.assignedTo) q = q.eq("assigned_to", opts.assignedTo);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as StaffTask[];
}

export async function createTask(
  input: Omit<StaffTask, "id" | "created_at" | "updated_at" | "created_by">,
) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("staff_tasks")
    .insert({ ...input, created_by: u.user?.id ?? null });
  if (error) throw error;
}

export async function updateTask(id: string, patch: Partial<StaffTask>) {
  const { error } = await supabase.from("staff_tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("staff_tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function getMyStaffRecord(): Promise<StaffUser | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("staff_users")
    .select("*")
    .eq("auth_user_id", u.user.id)
    .maybeSingle();
  return (data as StaffUser | null) ?? null;
}
