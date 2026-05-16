import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

type Invoice = {
  id: string;
  number: string;
  customer: string;
  amountNet: number;
  amountTax: number;
  amountGross: number;
  dueDate: string;
  status: string;
  items: InvoiceItem[];
};

export function InvoicesPage() {
  const [companyId, setCompanyId] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Alle");
  const [customer, setCustomer] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0, taxRate: 19 }]);

  async function load(company: string) {
    const res = await fetch(`/api/invoices?companyId=${company}`);
    setInvoices(await res.json());
  }

  useEffect(() => {
    void (async () => {
      const boot = await fetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      setCompanyId(boot.companyId);
      await load(boot.companyId);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      invoices.filter(
        (i) =>
          (status === "Alle" || i.status === status) &&
          `${i.number}${i.customer}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [invoices, query, status],
  );

  const totals = useMemo(() => {
    const net = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100, 0);
    return { net, tax, gross: net + tax };
  }, [items]);

  const handleCreate = async () => {
    if (!companyId || !customer.trim() || !items.some((i) => i.description.trim())) return;
    const number = `RE-${new Date().getFullYear()}-${String(invoices.length + 101).padStart(4, "0")}`;
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        number,
        customer: customer.trim(),
        dueDate,
        status: "Entwurf",
        kind: "Rechnung",
        items: items.filter((i) => i.description.trim()),
      }),
    });
    setCustomer("");
    setDueDate(new Date().toISOString().slice(0, 10));
    setItems([{ description: "", quantity: 1, unitPrice: 0, taxRate: 19 }]);
    setOpen(false);
    await load(companyId);
  };

  return (
    <div>
      <PageHeader
        title="Rechnungen"
        subtitle="Rechnungsverwaltung mit Positionen und Statusworkflow"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Neue Rechnung</Button></DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto">
              <h3 className="mb-4 text-lg font-semibold">Rechnung erstellen</h3>
              <div className="space-y-3">
                <Input placeholder="Kunde" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

                <div className="rounded-xl border border-border p-3">
                  <p className="mb-2 text-sm font-medium">Positionen</p>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid gap-2 md:grid-cols-4">
                        <Input
                          placeholder="Beschreibung"
                          value={item.description}
                          onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))}
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Menge"
                          value={item.quantity}
                          onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) || 0 } : x)))}
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Einzelpreis"
                          value={item.unitPrice}
                          onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) || 0 } : x)))}
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Steuer %"
                          value={item.taxRate}
                          onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, taxRate: Number(e.target.value) || 0 } : x)))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Button variant="outline" onClick={() => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxRate: 19 }])}>
                      Position hinzufügen
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Netto: {totals.net.toFixed(2)} | Steuer: {totals.tax.toFixed(2)} | Brutto: {totals.gross.toFixed(2)} EUR
                    </div>
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreate}>Rechnung anlegen</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="mb-4 flex gap-3">
          <Input placeholder="Rechnung oder Kunde suchen..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="rounded-xl border border-border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {["Alle", "Entwurf", "Offen", "Bezahlt", "Überfällig", "Storniert"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Nr.</th><th>Kunde</th><th>Netto</th><th>Steuer</th><th>Brutto</th><th>Fällig</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="py-3">{i.number}</td>
                <td>{i.customer}</td>
                <td>EUR {i.amountNet.toFixed(2)}</td>
                <td>EUR {i.amountTax.toFixed(2)}</td>
                <td>EUR {i.amountGross.toFixed(2)}</td>
                <td>{new Date(i.dueDate).toISOString().slice(0, 10)}</td>
                <td><StatusBadge status={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
