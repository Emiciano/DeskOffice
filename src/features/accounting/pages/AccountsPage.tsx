import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared";
import { useAccountingStore } from "../store/accountingStore";
import type { AccountFilters, AccountType, ChartAccount, SkrType } from "../types/accountingTypes";

const defaultFilters: AccountFilters = { query: "", skrType: "Alle", type: "Alle", active: "Alle" };

export function AccountsPage() {
  const { accounts, addAccount, updateAccount, toggleActive, selectedSkr, setSelectedSkr } = useAccountingStore();
  const [filters, setFilters] = useState<AccountFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<ChartAccount | null>(null);
  const [draft, setDraft] = useState<Omit<ChartAccount, "id">>({
    number: "",
    name: "",
    type: "expense",
    skrType: selectedSkr,
    taxRate: 19,
    category: "",
    active: true,
  });

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase();
    return accounts
      .filter((a) => (filters.skrType === "Alle" || a.skrType === filters.skrType))
      .filter((a) => (filters.type === "Alle" || a.type === filters.type))
      .filter((a) => (filters.active === "Alle" || (filters.active === "Aktiv" ? a.active : !a.active)))
      .filter((a) => !q || `${a.number} ${a.name} ${a.category}`.toLowerCase().includes(q))
      .sort((a, b) => a.number.localeCompare(b.number));
  }, [accounts, filters]);

  const pageSize = 14;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <PageHeader title="Kontenrahmen" subtitle="SKR03/SKR04 verwalten und für Buchungen bereitstellen" action={<Button onClick={() => { setEdit(null); setDraft({ ...draft, skrType: selectedSkr }); setOpen(true); }}>Konto hinzufügen</Button>} />
      <Card>
        <div className="grid gap-3 md:grid-cols-5">
          <Input placeholder="Suche nach Nummer oder Name" value={filters.query} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, query: e.target.value })); }} />
          <select className="rounded-xl border border-border px-3 text-sm" value={selectedSkr} onChange={(e) => setSelectedSkr(e.target.value as SkrType)}>
            <option>SKR03</option><option>SKR04</option>
          </select>
          <select className="rounded-xl border border-border px-3 text-sm" value={filters.skrType} onChange={(e) => setFilters((f) => ({ ...f, skrType: e.target.value as AccountFilters["skrType"] }))}>
            <option>Alle</option><option>SKR03</option><option>SKR04</option>
          </select>
          <select className="rounded-xl border border-border px-3 text-sm" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as AccountType | "Alle" }))}>
            <option>Alle</option><option value="asset">asset</option><option value="expense">expense</option><option value="revenue">revenue</option><option value="liability">liability</option>
          </select>
          <select className="rounded-xl border border-border px-3 text-sm" value={filters.active} onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value as AccountFilters["active"] }))}>
            <option>Alle</option><option>Aktiv</option><option>Inaktiv</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th>Konto</th><th>Name</th><th>Typ</th><th>SKR</th><th>Steuer</th><th>Kategorie</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="py-3 font-medium">{a.number}</td>
                  <td>{a.name}</td>
                  <td>{a.type}</td>
                  <td>{a.skrType}</td>
                  <td>{a.taxRate}%</td>
                  <td>{a.category}</td>
                  <td><span className={`rounded-full px-2 py-1 text-xs ${a.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{a.active ? "Aktiv" : "Inaktiv"}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => { setEdit(a); setDraft({ ...a }); setOpen(true); }}>Bearbeiten</Button>
                      <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => toggleActive(a.id)}>{a.active ? "Deaktivieren" : "Aktivieren"}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{filtered.length} Konten</span>
          <div className="flex gap-2">
            <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))}>Zurück</Button>
            <span className="px-2 pt-1 text-xs">Seite {page} / {pageCount}</span>
            <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Weiter</Button>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <h3 className="mb-3 text-lg font-semibold">{edit ? "Konto bearbeiten" : "Konto hinzufügen"}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Kontonummer" value={draft.number} onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))} />
            <Input placeholder="Kontoname" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <select className="rounded-xl border border-border px-3 text-sm" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as AccountType }))}>
              <option value="asset">asset</option><option value="expense">expense</option><option value="revenue">revenue</option><option value="liability">liability</option>
            </select>
            <select className="rounded-xl border border-border px-3 text-sm" value={draft.skrType} onChange={(e) => setDraft((d) => ({ ...d, skrType: e.target.value as SkrType }))}>
              <option>SKR03</option><option>SKR04</option>
            </select>
            <Input type="number" placeholder="Steuersatz" value={draft.taxRate} onChange={(e) => setDraft((d) => ({ ...d, taxRate: Number(e.target.value) }))} />
            <Input placeholder="Kategorie" value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={() => {
              if (edit) updateAccount(edit.id, draft);
              else addAccount(draft);
              setOpen(false);
            }}>Speichern</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
