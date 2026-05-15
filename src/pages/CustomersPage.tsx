import { Card } from "@/components/ui/card";
import { customers } from "@/data/seedData";
import { PageHeader } from "@/components/shared";

export function CustomersPage() {
  return (
    <div>
      <PageHeader title="Kunden" subtitle="Kontaktdaten, Umsatz und Historie" />
      <div className="grid gap-4 lg:grid-cols-2">
        {customers.map((c) => (
          <Card key={c.id}>
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-sm text-muted-foreground">{c.email} | {c.phone}</p>
            <div className="mt-3 flex gap-6 text-sm">
              <span>Umsatz: <b>€{c.revenue}</b></span>
              <span>Rechnungen: <b>{c.invoices}</b></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
