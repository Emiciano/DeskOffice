import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/session";

export default async function DashboardPage() {
  const session = await requireSession();

  const [documents, bookings, accounts] = await Promise.all([
    prisma.document.count({ where: { companyId: session.user.companyId } }),
    prisma.booking.count({ where: { companyId: session.user.companyId } }),
    prisma.chartAccount.count({ where: { companyId: session.user.companyId, active: true } })
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-slate-500">Belege</p><p className="text-3xl font-semibold">{documents}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Buchungen</p><p className="text-3xl font-semibold">{bookings}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Aktive Konten</p><p className="text-3xl font-semibold">{accounts}</p></div>
      </div>
      <div className="card p-5 text-sm text-slate-600">
        Phase 1-5 Basis ist aktiv: Login, Mandant, Belege, Kontenrahmen, Buchungen.
      </div>
    </section>
  );
}
