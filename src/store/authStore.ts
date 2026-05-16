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
      set({ user: data.user ?? null, loading: false });
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
    if (!res.ok) throw new Error("Login fehlgeschlagen");
    const data = await res.json();
    storeToken(String(data.token ?? ""));
    set({ user: data.user ?? null });
  },
  register: async (payload) => {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Registrierung fehlgeschlagen");
    const data = await res.json();
    storeToken(String(data.token ?? ""));
    set({ user: data.user ?? null });
  },
  logout: async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    storeToken(null);
    set({ user: null });
  },
}));
