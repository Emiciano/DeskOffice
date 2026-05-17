export function apiUrl(path: string): string {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
  if (/^https?:\/\//.test(path)) return path;
  if (!base) return path;
  return `${base}${path}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("auth-token");
  const headers = new Headers(init?.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  return fetch(apiUrl(path), { ...init, headers, signal: init?.signal ?? controller.signal }).finally(() => {
    window.clearTimeout(timeout);
  });
}
