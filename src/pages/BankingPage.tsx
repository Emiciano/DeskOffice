import { Card } from "@/components/ui/card";
import { PageHeader, StatusBadge } from "@/components/shared";
import { transactions } from "@/data/seedData";

export function BankingPage() {
  return (
    <div>
      <PageHeader title="Banking" subtitle="Transaktionen markieren und zuordnen" />
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th>Datum</th><th>Text</th><th>Betrag</th><th>Typ</th><th>Zuordnung</th></tr></thead>
          <tbody>{transactions.map((t) => <tr key={t.id} className="border-t border-border"><td className="py-3">{t.date}</td><td>{t.label}</td><td className={t.amount > 0 ? "text-emerald-600" : "text-rose-600"}>€{t.amount}</td><td><StatusBadge status={t.type} /></td><td>{t.matchedInvoice}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
