import { create } from "zustand";
import { apiFetch } from "@/lib/api";

type AuthUser = {
  userId: string;
  companyId: string;
  role: string;
  name: string;
  email: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  companyName: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

function storeToken(token: string | null) {
  if (token) localStorage.setItem("auth-token", token);
  else localStorage.removeItem("auth-token");
}

function toAuthUser(input: unknown): AuthUser | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  const userId = String(obj.userId ?? obj.id ?? "");
  const companyId = String(obj.companyId ?? "");
  const role = String(obj.role ?? "owner");
  const name = String(obj.name ?? "");
  const email = String(obj.email ?? "");
  if (!userId || !companyId) return null;
  return { userId, companyId, role, name, email };
}

async function getErrorText(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return String(data?.error ?? "Unbekannter Fehler");
  } catch {
    return `HTTP ${res.status}`;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  init: async () => {
    const token = localStorage.getItem("auth-token");
    if (!token) return set({ user: null, loading: false });
    try {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) {
        storeToken(null);
        return set({ user: null, loading: false });
      }
      const data = await res.json();
      set({ user: toAuthUser(data.user), loading: false });
    } catch {
      storeToken(null);
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await getErrorText(res));
    const data = await res.json();
    storeToken(String(data.token ?? ""));
    set({ user: toAuthUser(data.user) });
  },
  register: async (payload) => {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await getErrorText(res));
    const data = await res.json();
    storeToken(String(data.token ?? ""));
    set({ user: toAuthUser(data.user) });
  },
  logout: async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    storeToken(null);
    set({ user: null });
  },
}));
