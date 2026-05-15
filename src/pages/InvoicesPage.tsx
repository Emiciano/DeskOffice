import { useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAppStore } from "@/store/appStore";

export function InvoicesPage() {
  const { invoices, addInvoice } = useAppStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Alle");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("2026-05-31");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      invoices.filter(
        (i) =>
          (status === "Alle" || i.status === status) &&
          `${i.id}${i.customer}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [invoices, query, status],
  );

  const handleCreate = () => {
    if (!customer.trim() || !amount) return;
    addInvoice({
      customer: customer.trim(),
      amount: Number(amount),
      dueDate,
      status: "Entwurf",
    });
    setCustomer("");
    setAmount("");
    setDueDate("2026-05-31");
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Rechnungen"
        subtitle="Rechnungsverwaltung mit Status, Suche und Filter"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Neue Rechnung</Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="mb-4 text-lg font-semibold">Rechnung erstellen</h3>
              <div className="space-y-3">
                <Input placeholder="Kunde" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                <Input
                  placeholder="Betrag in EUR"
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Button className="w-full" onClick={handleCreate}>
                  Rechnung anlegen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="mb-4 flex gap-3">
          <Input placeholder="Rechnung oder Kunde suchen..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select
            className="rounded-xl border border-border px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["Alle", "Entwurf", "Offen", "Bezahlt", "Überfällig"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>ID</th>
              <th>Kunde</th>
              <th>Betrag</th>
              <th>Fällig</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="py-3">{i.id}</td>
                <td>{i.customer}</td>
                <td>EUR {i.amount}</td>
                <td>{i.dueDate}</td>
                <td>
                  <StatusBadge status={i.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
