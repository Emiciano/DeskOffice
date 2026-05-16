"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);
    if (result?.error) {
      setError("Login fehlgeschlagen");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Anmelden</h1>
      <input className="w-full rounded-xl border p-3" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        className="w-full rounded-xl border p-3"
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white" disabled={loading}>
        {loading ? "Lade..." : "Einloggen"}
      </button>
    </form>
  );
}
