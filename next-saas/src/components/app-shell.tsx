import Link from "next/link";
import { ReactNode } from "react";
import type { Route } from "next";

import { signOut } from "@/auth";

const nav = [
  { href: "/dashboard" as Route, label: "Dashboard" },
  { href: "/documents" as Route, label: "Belege" },
  { href: "/accounting" as Route, label: "Kontenrahmen" }
];

export function AppShell({ children, userName }: { children: ReactNode; userName: string }) {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-6">
        <aside className="card col-span-12 h-fit p-4 lg:col-span-2">
          <h2 className="mb-4 px-2 text-lg font-semibold">DeskOffice</h2>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-100">
                {item.label}
              </Link>
            ))}
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-4"
          >
            <button className="w-full rounded-xl border px-3 py-2 text-sm">Abmelden</button>
          </form>
        </aside>

        <div className="col-span-12 space-y-6 lg:col-span-10">
          <header className="card flex items-center justify-between p-4">
            <input placeholder="Suche..." className="w-full max-w-xl rounded-xl border px-3 py-2 text-sm" />
            <div className="ml-4 rounded-xl border px-3 py-2 text-sm">{userName}</div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
