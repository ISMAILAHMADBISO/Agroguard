import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserType = "staff" | "farmer";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  /** super_admin | admin | agronomist | staff | farmer */
  role: string;
  userType: UserType;
  mustChangePassword: boolean;
}

export interface FarmerSignupInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  farmName?: string;
  farmSizeHectares?: number;
  cropTypes?: string;
  whatsappNumber?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (input: FarmerSignupInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalize(data: Partial<AuthUser> | null): AuthUser | null {
  if (!data || data.id == null) return null;
  return {
    id: data.id,
    name: data.name ?? "",
    email: data.email ?? "",
    role: data.role ?? "staff",
    userType: (data.userType as UserType) ?? "staff",
    mustChangePassword: data.mustChangePassword ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Partial<AuthUser> | null) => {
        setUser(normalize(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const e = (await r.json()) as { error: string };
      throw new Error(e.error || "Login failed");
    }
    const data = normalize((await r.json()) as Partial<AuthUser>);
    if (!data) throw new Error("Login failed");
    setUser(data);
    return data;
  };

  const signup = async (input: FarmerSignupInput): Promise<AuthUser> => {
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    if (!r.ok) {
      const e = (await r.json()) as { error: string };
      throw new Error(e.error || "Sign up failed");
    }
    const data = normalize((await r.json()) as Partial<AuthUser>);
    if (!data) throw new Error("Sign up failed");
    setUser(data);
    return data;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const r = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!r.ok) {
      const e = (await r.json()) as { error: string };
      throw new Error(e.error || "Could not change password");
    }
    setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** The landing route for a user after login, based on their role. */
export function homePathForUser(user: AuthUser): string {
  return user.userType === "farmer" ? "/my-farm" : "/dashboard";
}
