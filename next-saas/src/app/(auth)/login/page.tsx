import Link from "next/link";
import { AuthLoginForm } from "@/components/auth-login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="space-y-4">
        <AuthLoginForm />
        <p className="text-center text-sm text-slate-600">
          Noch kein Konto? <Link href="/register" className="font-medium text-slate-900">Registrieren</Link>
        </p>
      </div>
    </main>
  );
}
