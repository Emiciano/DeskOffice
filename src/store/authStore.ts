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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) throw new Error("Bitte eine gültige E-Mail eingeben.");
    if (!password || password.length < 8) throw new Error("Passwort muss mindestens 8 Zeichen haben.");
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    if (!res.ok) throw new Error(await getErrorText(res));
    const data = await res.json();
    const token = String(data.token ?? "");
    const user = toAuthUser(data.user);
    if (!token || !user) throw new Error("Ungültige Login-Antwort vom Server.");
    storeToken(token);
    set({ user });
  },
  register: async (payload) => {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (!payload.name.trim()) throw new Error("Bitte einen Namen eingeben.");
    if (!payload.companyName.trim()) throw new Error("Bitte einen Firmennamen eingeben.");
    if (!isValidEmail(normalizedEmail)) throw new Error("Bitte eine gültige E-Mail eingeben.");
    if (!payload.password || payload.password.length < 8) throw new Error("Passwort muss mindestens 8 Zeichen haben.");
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, email: normalizedEmail }),
    });
    if (!res.ok) throw new Error(await getErrorText(res));
    const data = await res.json();
    const token = String(data.token ?? "");
    const user = toAuthUser(data.user);
    if (!token || !user) throw new Error("Ungültige Registrierungs-Antwort vom Server.");
    storeToken(token);
    set({ user });
  },
  logout: async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    storeToken(null);
    set({ user: null });
  },
}));

