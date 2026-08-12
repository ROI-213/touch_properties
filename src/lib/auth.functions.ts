import { createServerFn } from "@tanstack/react-start";
import { query } from "@/server/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = 'custom-secret-for-jwt-touch-590-properties-mock';

export const loginUserFn = createServerFn({ method: "POST" })
  .validator((d: any) => d as { email: string; password: string })
  .handler(async ({ data }) => {
    try {
      const res = await query("SELECT * FROM auth.users WHERE email = $1", [data.email]);
      const user = res.rows[0];
      if (!user) return { error: "Invalid credentials" };

      const match = await bcrypt.compare(data.password, user.encrypted_password);
      if (!match) return { error: "Invalid credentials" };

      const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user: { id: user.id, email: user.email } };
    } catch (e: any) {
      return { error: e.message };
    }
  });

export const signupUserFn = createServerFn({ method: "POST" })
  .validator((d: any) => d as { email: string; password: string; full_name?: string })
  .handler(async ({ data }) => {
    try {
      const hash = await bcrypt.hash(data.password, 10);
      const res = await query(
        "INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data) VALUES ($1, $2, $3) RETURNING id, email",
        [data.email, hash, { full_name: data.full_name || '' }]
      );
      const user = res.rows[0];

      // Auto create profile
      await query(
        "INSERT INTO public.profiles (id, email, full_name) VALUES ($1, $2, $3)",
        [user.id, user.email, data.full_name || '']
      );

      // Assign customer role
      await query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'customer')", [user.id]);

      const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user: { id: user.id, email: user.email } };
    } catch (e: any) {
      return { error: e.message };
    }
  });
