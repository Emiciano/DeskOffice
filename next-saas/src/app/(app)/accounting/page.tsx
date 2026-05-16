import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/session";

export default async function AccountingPage() {
  const session = await requireSession();
  const accounts = await prisma.chartAccount.findMany({
    where: { companyId: session.user.companyId },
    orderBy: [{ skrType: "asc" }, { number: "asc" }],
    take: 200
  });

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Kontenrahmen</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Nummer</th>
              <th className="p-3">Konto</th>
              <th className="p-3">Typ</th>
              <th className="p-3">SKR</th>
              <th className="p-3">Steuer</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} className="border-t">
                <td className="p-3 font-medium">{acc.number}</td>
                <td className="p-3">{acc.name}</td>
                <td className="p-3">{acc.type}</td>
                <td className="p-3">{acc.skrType}</td>
                <td className="p-3">{acc.taxRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
