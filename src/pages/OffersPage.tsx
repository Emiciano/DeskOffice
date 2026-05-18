import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

type Offer = {
  id: string;
  number: string;
  customer: string;
  amountGross: number;
  status: string;
  validUntil: string;
};

export function OffersPage() {
  const [companyId, setCompanyId] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [validUntil, setValidUntil] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load(company: string) {
    const res = await apiFetch(`/api/offers?companyId=${company}`);
    setOffers(await res.json());
  }

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      setCompanyId(boot.companyId);
      await load(boot.companyId);
    })();
  }, []);

  async function createOffer() {
    if (!companyId || !customer.trim()) return;
    const gross = Number(amount);
    if (!Number.isFinite(gross) || gross <= 0) {
      setError("Bitte einen gueltigen Bruttobetrag eingeben.");
      return;
    }
    const net = Number((gross / 1.19).toFixed(2));
    const tax = Number((gross - net).toFixed(2));
    const number = `AN-${new Date().getFullYear()}-${String(offers.length + 31).padStart(4, "0")}`;

    try {
      setSaving(true);
      setError("");
      await apiFetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          number,
          customer: customer.trim(),
          amountNet: net,
          amountTax: tax,
          amountGross: gross,
          validUntil,
          status: "Entwurf",
        }),
      });
      setOpen(false);
      setCustomer("");
      setAmount("");
      setDescription("");
      await load(companyId);
    } finally {
      setSaving(false);
    }
  }

  async function convertOffer(id: string) {
    await apiFetch(`/api/offers/${id}/convert`, { method: "POST" });
    await load(companyId);
  }

  return (
    <div>
      <PageHeader
        title="Angebote"
        subtitle="Von Angebot zu Rechnung"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Neues Angebot</Button></DialogTrigger>
            <DialogContent className="h-[84vh] max-h-[84vh] overflow-hidden p-4">
              <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="no-scrollbar min-h-0 space-y-3 overflow-y-auto pr-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Angebot erstellen</h3>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">
                      <Eye size={14} />
                      Vorschau
                    </div>
                  </div>
                  {error ? <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
                  <Input placeholder="Kunde / Firma" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input type="number" placeholder="Betrag brutto (EUR)" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                  </div>
                  <textarea
                    className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Leistungsbeschreibung / Notiz"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <Card className="flex h-full flex-col space-y-3 p-4">
                  <h4 className="text-base font-semibold">Angebotsvorschau</h4>
                  <div className="rounded-xl border border-border p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Kunde</p>
                    <p className="font-medium">{customer || "-"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Gueltig bis</p>
                    <p>{validUntil}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Betrag brutto</p>
                    <p className="text-xl font-semibold">EUR {(Number(amount) || 0).toFixed(2)}</p>
                    {description ? <p className="mt-3 text-xs text-muted-foreground">{description}</p> : null}
                  </div>
                  <div className="mt-auto flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                    <Button onClick={createOffer} disabled={saving}>{saving ? "Speichern..." : "Angebot speichern"}</Button>
                  </div>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Nr.</th><th>Kunde</th><th>Betrag</th><th>Gueltig bis</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="py-3">{o.number}</td>
                <td>{o.customer}</td>
                <td>EUR {o.amountGross.toFixed(2)}</td>
                <td>{new Date(o.validUntil).toISOString().slice(0, 10)}</td>
                <td><StatusBadge status={o.status} /></td>
                <td><Button variant="outline" onClick={() => convertOffer(o.id)}>In Rechnung umwandeln</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
