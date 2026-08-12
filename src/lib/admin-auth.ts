import { supabase } from "@/integrations/supabase/client";

export const AUTH_REQUEST_TIMEOUT_MS = 15000;

export async function withAuthTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), AUTH_REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await withAuthTimeout<{ data: any; error: any }>(
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    "Admin permission check timed out. Please try again.",
  );

  if (error) throw new Error(error.message);
  return data === true;
}

export function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Login failed. Please try again.";
  if (/invalid login credentials/i.test(message)) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (/email not confirmed/i.test(message)) {
    return "This account email is not confirmed yet.";
  }
  if (/failed to fetch|network|timeout|timed out/i.test(message)) {
    return message;
  }
  return message || "Login failed. Please try again.";
}