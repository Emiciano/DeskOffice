import { useEffect, useState } from "react";
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
    if (!companyId || !customer || !amount) return;
    const gross = Number(amount);
    const net = Number((gross / 1.19).toFixed(2));
    const tax = Number((gross - net).toFixed(2));
    const number = `AN-${new Date().getFullYear()}-${String(offers.length + 31).padStart(4, "0")}`;

    await apiFetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        number,
        customer,
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
    await load(companyId);
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
            <DialogContent>
              <h3 className="mb-4 text-lg font-semibold">Angebot erstellen</h3>
              <div className="space-y-3">
                <Input placeholder="Kunde" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                <Input type="number" placeholder="Brutto in EUR" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                <Button className="w-full" onClick={createOffer}>Speichern</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Nr.</th><th>Kunde</th><th>Betrag</th><th>Gültig bis</th><th>Status</th><th></th>
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
