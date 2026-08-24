import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
}

export interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  session: { access_token: string } | null;
  profile: Profile | null;
  loading: boolean;
  isReady: boolean;
  setSessionData: (token: string, userData: User) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (error) {
        console.warn("[Auth] profile read failed:", error.message);
        setProfile(null);
        return;
      }
      setProfile((data as Profile) ?? null);
    } catch (error) {
      console.warn("[Auth] profile read failed:", error);
      setProfile(null);
    }
  };

  const resetAuthState = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem("ts-auth-token");
    document.cookie = "ts-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
  };

  useEffect(() => {
    const token = localStorage.getItem("ts-auth-token");
    const userStr = localStorage.getItem("ts-auth-user");
    if (token && userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setSession({ access_token: token });
        setUser(parsedUser);
        fetchProfile(parsedUser.id).finally(() => setLoading(false));
      } catch (e) {
        resetAuthState();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const setSessionData = (token: string, userData: User) => {
    localStorage.setItem("ts-auth-token", token);
    localStorage.setItem("ts-auth-user", JSON.stringify(userData));
    // also set cookie for SSR
    document.cookie = `ts-auth-token=${token}; path=/; SameSite=Lax;`;
    setSession({ access_token: token });
    setUser(userData);
    fetchProfile(userData.id);
  };

  const signOut = async () => {
    try {
      await qc.cancelQueries();
      qc.clear();
    } catch (error) {
      console.warn("[Auth] sign out failed:", error);
    } finally {
      resetAuthState();
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isReady: !loading, setSessionData, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
