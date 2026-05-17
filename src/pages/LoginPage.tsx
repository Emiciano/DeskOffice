import { type FormEvent, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function LoginPage() {
  const { login, register } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canSubmit =
    !loading &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    (mode === "login" || (name.trim().length > 0 && companyName.trim().length > 0));

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ name, companyName, email, password });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(message || (mode === "login" ? "Login fehlgeschlagen." : "Registrierung fehlgeschlagen."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Buchhaltung CMS</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Einloggen" : "Neues Konto und Firma erstellen"}
          </p>
        </div>
        <form className="space-y-3" onSubmit={submit}>
          {mode === "register" ? (
            <>
              <Input placeholder="Dein Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Firmenname" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </>
          ) : null}
          <Input placeholder="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Passwort (mind. 8 Zeichen)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={!canSubmit}>
            {loading ? "Bitte warten..." : mode === "login" ? "Einloggen" : "Registrieren"}
          </Button>
        </form>
        <button
          className="text-sm text-muted-foreground underline"
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          type="button"
        >
          {mode === "login" ? "Noch kein Konto? Registrieren" : "Schon registriert? Einloggen"}
        </button>
      </Card>
    </div>
  );
}
