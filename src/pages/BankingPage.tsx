import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";

type Tx = {
  id: string;
  bookingDate: string;
  purpose: string;
  amount: number;
  type: string;
  status: string;
  matchedInvoiceId?: string | null;
};

export function BankingPage() {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<Tx[]>([]);

  async function load(company: string) {
    const res = await fetch(`/api/banking/transactions?companyId=${company}`);
    setRows(await res.json());
  }

  useEffect(() => {
    void (async () => {
      const boot = await fetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      setCompanyId(boot.companyId);
      await load(boot.companyId);
    })();
  }, []);

  async function handleCsv(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2 || !companyId) return;

    const dataLines = lines.slice(1);
    for (const line of dataLines) {
      const [bookingDate, purpose, amountRaw] = line.split(";");
      const amount = Number((amountRaw ?? "0").replace(",", "."));
      await fetch("/api/banking/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          bookingDate,
          purpose,
          amount,
          type: amount >= 0 ? "Einnahme" : "Ausgabe",
          status: "Offen",
        }),
      });
    }
    await load(companyId);
  }

  const totals = useMemo(() => {
    const income = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const expense = rows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
    return { income, expense };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Banking"
        subtitle="Transaktionen, CSV-Import und Zuordnung"
        action={
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleCsv(file);
              }}
            />
            <span className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
              CSV importieren
            </span>
          </label>
        }
      />
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <Card><p className="text-sm text-muted-foreground">Einnahmen</p><p className="text-2xl font-semibold">EUR {totals.income.toFixed(2)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Ausgaben</p><p className="text-2xl font-semibold">EUR {totals.expense.toFixed(2)}</p></Card>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Datum</th><th>Text</th><th>Betrag</th><th>Typ</th><th>Status</th><th>Zuordnung</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="py-3">{new Date(t.bookingDate).toISOString().slice(0, 10)}</td>
                <td>{t.purpose}</td>
                <td className={t.amount > 0 ? "text-emerald-600" : "text-rose-600"}>EUR {t.amount.toFixed(2)}</td>
                <td><StatusBadge status={t.type} /></td>
                <td><StatusBadge status={t.status} /></td>
                <td>{t.matchedInvoiceId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        CSV-Format: <code>bookingDate;purpose;amount</code> (Beispiel: <code>2026-05-01;Telekom;-49.90</code>)
      </p>
    </div>
  );
}
