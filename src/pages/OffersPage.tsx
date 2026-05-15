import { PageHeader, StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";

export function OffersPage() {
  const { offers, convertOffer } = useAppStore();
  return (
    <div>
      <PageHeader title="Angebote" subtitle="Von Angebot bis Rechnung" />
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th>ID</th><th>Kunde</th><th>Betrag</th><th>Status</th><th></th></tr></thead>
          <tbody>{offers.map((o) => <tr key={o.id} className="border-t border-border"><td className="py-3">{o.id}</td><td>{o.customer}</td><td>€{o.amount}</td><td><StatusBadge status={o.status} /></td><td><Button variant="outline" onClick={() => convertOffer(o.id)}>In Rechnung umwandeln</Button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
