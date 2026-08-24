import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { query } from "@/server/db";
import bcrypt from "bcryptjs";

/** Minimal structural type for the app's Supabase-compatible client shim. */
interface SupabaseLike {
  rpc: (
    fn: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
}

async function assertAdmin(supabase: SupabaseLike, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("Forbidden: admin role required");
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  mobile: z.string().max(40).optional().nullable(),
  designation: z.string().max(120).optional().nullable(),
  employee_code: z.string().max(40).optional().nullable(),
  username: z.string().max(40).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  branch: z.string().max(120).optional().nullable(),
  territory: z.string().max(120).optional().nullable(),
  joining_date: z.string().optional().nullable(),
  password: z.string().min(10),
  status: z.enum(["active", "inactive"]).default("active"),
  permissions: z
    .array(
      z.object({
        module_name: z.string(),
        can_view: z.boolean(),
        can_add: z.boolean(),
        can_edit: z.boolean(),
        can_delete: z.boolean(),
        can_publish: z.boolean(),
        can_export: z.boolean(),
      }),
    )
    .default([]),
});

export const createStaffUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    // Check for duplicates
    if (data.employee_code) {
      const checkCode = await query("SELECT id FROM public.staff_users WHERE employee_code = $1", [
        data.employee_code,
      ]);
      if (checkCode.rows.length > 0) throw new Error("Employee code already in use");
    }
    if (data.username) {
      const checkUser = await query("SELECT id FROM public.staff_users WHERE username = $1", [
        data.username,
      ]);
      if (checkUser.rows.length > 0) throw new Error("Username already in use");
    }
    const checkEmail = await query("SELECT id FROM auth.users WHERE email = $1", [data.email]);
    if (checkEmail.rows.length > 0) {
      throw new Error("A user with this email already exists");
    }

    // Create auth user in auth.users table directly
    const passwordHash = await bcrypt.hash(data.password, 10);
    const authRes = await query(
      `INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [
        data.email,
        passwordHash,
        JSON.stringify({ full_name: data.name, phone: data.mobile ?? "" }),
      ],
    );

    if (!authRes.rows[0]?.id) {
      throw new Error("Failed to create auth user");
    }

    const authUserId = authRes.rows[0].id;

    try {
      // Insert staff_users row. Passwords are stored ONLY as bcrypt hashes in
      // auth.users — never in plaintext on staff_users.
      const staffRes = await query(
        `INSERT INTO public.staff_users 
         (auth_user_id, name, email, mobile, designation, employee_code, username, department, branch, territory, joining_date, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          authUserId,
          data.name,
          data.email,
          data.mobile ?? null,
          data.designation ?? null,
          data.employee_code ?? null,
          data.username ?? null,
          data.department ?? null,
          data.branch ?? null,
          data.territory ?? null,
          data.joining_date ?? null,
          data.status,
          context.userId,
        ],
      );

      const staffRow = staffRes.rows[0];
      if (!staffRow) {
        throw new Error("Failed to insert staff record");
      }

      // Assign 'staff' role
      await query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'staff')", [
        authUserId,
      ]);

      // Insert permissions
      if (data.permissions.length > 0) {
        for (const p of data.permissions) {
          await query(
            `INSERT INTO public.staff_permissions 
             (staff_user_id, module_name, can_view, can_add, can_edit, can_delete, can_publish, can_export)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              staffRow.id,
              p.module_name,
              p.can_view,
              p.can_add,
              p.can_edit,
              p.can_delete,
              p.can_publish,
              p.can_export,
            ],
          );
        }
      }

      return { staffUserId: staffRow.id, authUserId };
    } catch (e) {
      // Rollback created Auth user on failure
      try {
        await query("DELETE FROM auth.users WHERE id = $1", [authUserId]);
      } catch (rollbackErr) {
        console.error("[CreateStaff Rollback Error]:", rollbackErr);
      }
      throw e;
    }
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ auth_user_id: z.string().uuid(), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const res = await query("UPDATE auth.users SET encrypted_password = $1 WHERE id = $2", [
      passwordHash,
      data.auth_user_id,
    ]);
    if (res.rowCount === 0) {
      throw new Error("Auth user not found or password update failed");
    }
    return { ok: true };
  });

export const deleteStaffUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ staffId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    // Load staff record
    const staffRes = await query("SELECT * FROM public.staff_users WHERE id = $1", [data.staffId]);
    const staff = staffRes.rows[0];

    if (!staff) throw new Error("Staff record not found in database.");

    const authUserId = staff.auth_user_id;

    if (context.userId === authUserId) {
      throw new Error("You cannot delete your own account.");
    }

    const adminRolesRes = await query("SELECT user_id FROM public.user_roles WHERE role = 'admin'");
    const adminRoles = adminRolesRes.rows;
    if (
      adminRoles.length <= 1 &&
      adminRoles.some((r: { user_id?: string }) => r.user_id === authUserId)
    ) {
      throw new Error("Cannot delete the last remaining administrator.");
    }

    // Clean up permissions, tasks, roles, staff record, and auth user
    await query("DELETE FROM public.staff_permissions WHERE staff_user_id = $1", [data.staffId]);
    await query("DELETE FROM public.staff_tasks WHERE assigned_to = $1", [data.staffId]);
    await query("DELETE FROM public.staff_users WHERE id = $1", [data.staffId]);

    if (authUserId) {
      await query("DELETE FROM public.user_roles WHERE user_id = $1", [authUserId]);
      await query("DELETE FROM auth.users WHERE id = $1", [authUserId]);
    }

    return {
      success: true,
      staffDeleted: true,
      authUserDeleted: true,
      message: "Staff member deleted successfully.",
    };
  });
