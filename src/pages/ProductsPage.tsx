import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  type: string;
  unitPrice: number;
  taxRate: number;
  description: string | null;
  active: boolean;
};

export function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({
    id: "",
    name: "",
    type: "Leistung",
    unitPrice: 0,
    taxRate: 19,
    description: "",
  });

  async function load(company: string) {
    const res = await apiFetch(`/api/products?companyId=${company}`);
    setRows((await res.json()) as Product[]);
  }

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      const id = String(boot.companyId);
      setCompanyId(id);
      await load(id);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => `${row.name} ${row.type} ${row.description ?? ""}`.toLowerCase().includes(q));
  }, [rows, query]);

  async function saveProduct() {
    if (!companyId || !draft.name.trim()) return;
    const payload = {
      name: draft.name.trim(),
      type: draft.type,
      unitPrice: Number(draft.unitPrice),
      taxRate: Number(draft.taxRate),
      description: draft.description.trim(),
    };

    if (draft.id) {
      await apiFetch(`/api/products/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, companyId }),
      });
    }

    setDraft({ id: "", name: "", type: "Leistung", unitPrice: 0, taxRate: 19, description: "" });
    setOpen(false);
    await load(companyId);
  }

  async function toggleActive(row: Product) {
    await apiFetch(`/api/products/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    if (companyId) await load(companyId);
  }

  return (
    <div>
      <PageHeader
        title="Produkte & Leistungen"
        subtitle="Preise, Steuer und Beschreibung zentral verwalten"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() =>
                  setDraft({ id: "", name: "", type: "Leistung", unitPrice: 0, taxRate: 19, description: "" })
                }
              >
                Hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="text-lg font-semibold">
                {draft.id ? "Produkt oder Leistung bearbeiten" : "Produkt oder Leistung erfassen"}
              </h3>
              <div className="mt-4 space-y-3">
                <Input
                  placeholder="Bezeichnung"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
                <select
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  value={draft.type}
                  onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                >
                  <option value="Leistung">Leistung</option>
                  <option value="Produkt">Produkt</option>
                </select>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Preis in EUR"
                    type="number"
                    min={0}
                    value={draft.unitPrice}
                    onChange={(e) => setDraft((d) => ({ ...d, unitPrice: Number(e.target.value) || 0 }))}
                  />
                  <Input
                    placeholder="Steuersatz in %"
                    type="number"
                    min={0}
                    value={draft.taxRate}
                    onChange={(e) => setDraft((d) => ({ ...d, taxRate: Number(e.target.value) || 0 }))}
                  />
                </div>
                <Input
                  placeholder="Kurzbeschreibung"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
                <Button className="w-full" onClick={() => void saveProduct()}>
                  Speichern
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <div className="mb-4">
          <Input placeholder="Produkt oder Leistung suchen..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Name</th>
              <th>Typ</th>
              <th>Preis</th>
              <th>Steuer</th>
              <th>Beschreibung</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-3">{p.name}</td>
                <td>{p.type}</td>
                <td>EUR {p.unitPrice.toFixed(2)}</td>
                <td>{p.taxRate.toFixed(0)}%</td>
                <td>{p.description || "-"}</td>
                <td>{p.active ? "Aktiv" : "Inaktiv"}</td>
                <td className="space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      setDraft({
                        id: p.id,
                        name: p.name,
                        type: p.type,
                        unitPrice: p.unitPrice,
                        taxRate: p.taxRate,
                        description: p.description ?? "",
                      });
                      setOpen(true);
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => void toggleActive(p)}>
                    {p.active ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
