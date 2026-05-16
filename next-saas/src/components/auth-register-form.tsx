"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function AuthRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Registrierung fehlgeschlagen");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Konto erstellen</h1>
      <input className="w-full rounded-xl border p-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="w-full rounded-xl border p-3" placeholder="Firma" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
      <input className="w-full rounded-xl border p-3" placeholder="E-Mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input
        className="w-full rounded-xl border p-3"
        type="password"
        placeholder="Passwort"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white" disabled={loading}>
        {loading ? "Lade..." : "Registrieren"}
      </button>
    </form>
  );
}
