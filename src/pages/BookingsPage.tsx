import { useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BookingRow = {
  id: string;
  bookingDate: string;
  bookingText: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  taxAmount: number;
  category: string;
  status: string;
  document?: { fileName: string } | null;
};

export function BookingsPage() {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<BookingRow[]>([]);

  async function load(company: string) {
    const res = await fetch(`/api/bookings?companyId=${company}`);
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

  async function reverse(id: string) {
    await fetch(`/api/bookings/${id}/reverse`, { method: "POST" });
    if (companyId) await load(companyId);
  }

  return (
    <div>
      <PageHeader title="Buchungsjournal" subtitle="Gebuchte Vorgänge mit Storno-Option" />
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Datum</th><th>Text</th><th>Soll</th><th>Haben</th><th>Betrag</th><th>Steuer</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="py-3">{new Date(b.bookingDate).toISOString().slice(0, 10)}</td>
                <td>
                  <div>{b.bookingText}</div>
                  <div className="text-xs text-muted-foreground">{b.document?.fileName ?? "-"}</div>
                </td>
                <td>{b.debitAccount}</td>
                <td>{b.creditAccount}</td>
                <td>EUR {b.amount.toFixed(2)}</td>
                <td>EUR {b.taxAmount.toFixed(2)}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>
                  {b.status !== "Storniert" ? (
                    <Button variant="outline" onClick={() => reverse(b.id)}>Stornieren</Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
