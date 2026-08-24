import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { getRequest } from "@tanstack/react-start/server";
import { query as dbQuery } from "@/server/db";

// Dev-only fallback: random per process boot. Never a stable, guessable
// value — tokens simply expire when the dev server restarts.
const DEV_JWT_FALLBACK = randomBytes(32).toString("hex");

/**
 * Resolve the JWT signing secret.
 * - Production (NODE_ENV=production) REQUIRES JWT_SECRET to be set and fails
 *   loudly with a descriptive error if it is missing, instead of silently
 *   signing tokens with a publicly-known fallback.
 * - Development keeps a stable local default so localhost keeps working.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] JWT_SECRET is not configured on this server. " +
        "Set the JWT_SECRET environment variable in your production environment " +
        "(min 32 random chars) and redeploy."
    );
  }
  return DEV_JWT_FALLBACK;
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

export async function userHasRole(
  userId: string,
  role: string
): Promise<boolean> {
  try {
    const res = await dbQuery(
      "SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role::text = $2 LIMIT 1",
      [userId, role]
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
      [userId]
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
