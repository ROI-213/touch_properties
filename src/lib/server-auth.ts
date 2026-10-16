import jwt from "jsonwebtoken";
import { getRequest } from "@tanstack/react-start/server";
import { query as dbQuery } from "@/server/db";

/**
 * Resolve the JWT signing secret.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length > 0) return secret;
  return "touch-stone-properties-prod-jwt-2024-secure-random-string";
}

export interface RequestAuth {
  userId: string | null;
  email: string | null;
}

/** Verify the Bearer token on the incoming server-function request (if any). */
export function getRequestAuth(): RequestAuth {
  try {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { userId: null, email: null };
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return { userId: null, email: null };

    const decoded = jwt.verify(token, getJwtSecret()) as {
      sub?: string;
      email?: string;
    };
    if (!decoded?.sub) return { userId: null, email: null };
    return { userId: decoded.sub, email: decoded.email ?? null };
  } catch {
    // Invalid/expired token → treat as anonymous
    return { userId: null, email: null };
  }
}

export async function userHasRole(userId: string, role: string): Promise<boolean> {
  try {
    const res = await dbQuery(
      "SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role::text = $2 LIMIT 1",
      [userId, role],
    );
    return res.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * True when the requester holds an operator role (admin or staff).
 * Staff members are additionally checked for an active staff_users row.
 */
export async function isOperator(userId: string): Promise<boolean> {
  if (!userId) return false;
  if (await userHasRole(userId, "admin")) return true;
  if (!(await userHasRole(userId, "staff"))) return false;
  try {
    const res = await dbQuery(
      "SELECT 1 FROM public.staff_users WHERE auth_user_id = $1 AND status = 'active' LIMIT 1",
      [userId],
    );
    return res.rows.length > 0;
  } catch {
    return false;
  }
}

/** Resolve auth state once per request to keep the hot path cheap. */
export async function resolveRequestAccess(): Promise<{
  userId: string | null;
  isOperatorUser: boolean;
}> {
  const { userId } = getRequestAuth();
  const isOperatorUser = userId ? await isOperator(userId) : false;
  return { userId, isOperatorUser };
}
