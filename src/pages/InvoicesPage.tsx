import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type Invoice = {
  id: string;
  number: string;
  customer: string;
  amountGross: number;
  dueDate: string;
  status: string;
};

export function InvoicesPage() {
  const [companyId, setCompanyId] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Alle");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);

  async function load(company: string) {
    const res = await fetch(`/api/invoices?companyId=${company}`);
    const data = await res.json();
    setInvoices(data);
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

  const handleCreate = async () => {
    if (!companyId || !customer.trim() || !amount) return;
    const gross = Number(amount);
    const net = Number((gross / 1.19).toFixed(2));
    const tax = Number((gross - net).toFixed(2));
    const number = `RE-${new Date().getFullYear()}-${String(invoices.length + 101).padStart(4, "0")}`;

    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        number,
        customer: customer.trim(),
        amountNet: net,
        amountTax: tax,
        amountGross: gross,
        dueDate,
        status: "Entwurf",
      }),
    });
    setCustomer("");
    setAmount("");
    setOpen(false);
    await load(companyId);
  };

  return (
    <div>
      <PageHeader
        title="Rechnungen"
        subtitle="Rechnungsverwaltung mit echten Daten"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Neue Rechnung</Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="mb-4 text-lg font-semibold">Rechnung erstellen</h3>
              <div className="space-y-3">
                <Input placeholder="Kunde" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                <Input placeholder="Brutto in EUR" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
              <th>Nr.</th><th>Kunde</th><th>Betrag</th><th>Fällig</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="py-3">{i.number}</td>
                <td>{i.customer}</td>
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
