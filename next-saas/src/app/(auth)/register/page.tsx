import Link from "next/link";
import { AuthRegisterForm } from "@/components/auth-register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="space-y-4">
        <AuthRegisterForm />
        <p className="text-center text-sm text-slate-600">
          Bereits registriert? <Link href="/login" className="font-medium text-slate-900">Anmelden</Link>
        </p>
      </div>
    </main>
  );
}
