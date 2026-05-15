import { StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import type { DocumentFilters, DocumentItem } from "./types";

type Props = {
  documents: DocumentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: DocumentFilters;
  onFiltersChange: (patch: Partial<DocumentFilters>) => void;
};

export function DocumentList({ documents, selectedId, onSelect, filters, onFiltersChange }: Props) {
  return (
    <Card>
      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <input
          className="rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="Suche nach Beleg, Partner, Nummer"
          value={filters.query}
          onChange={(e) => onFiltersChange({ query: e.target.value })}
        />
        <select className="rounded-xl border border-border px-3 py-2 text-sm" value={filters.status} onChange={(e) => onFiltersChange({ status: e.target.value as DocumentFilters["status"] })}>
          {["Alle", "Entwurf", "Geprueft", "Gebucht", "Bezahlt", "Ueberfaellig"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="rounded-xl border border-border px-3 py-2 text-sm" placeholder="Kategorie" value={filters.category === "Alle" ? "" : filters.category} onChange={(e) => onFiltersChange({ category: e.target.value || "Alle" })} />
        <input className="rounded-xl border border-border px-3 py-2 text-sm" placeholder="Lieferant/Kunde" value={filters.partner} onChange={(e) => onFiltersChange({ partner: e.target.value })} />
        <select className="rounded-xl border border-border px-3 py-2 text-sm" value={filters.sortBy} onChange={(e) => onFiltersChange({ sortBy: e.target.value as DocumentFilters["sortBy"] })}>
          <option value="date_desc">Neueste zuerst</option>
          <option value="date_asc">Aelteste zuerst</option>
          <option value="amount_desc">Betrag absteigend</option>
          <option value="amount_asc">Betrag aufsteigend</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Beleg</th><th>Partner</th><th>Kategorie</th><th>Datum</th><th>Betrag</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Keine Belege fuer die aktuelle Filterung.</td></tr>
            ) : documents.map((d) => (
              <tr key={d.id} className={`cursor-pointer border-t border-border ${selectedId === d.id ? "bg-muted/60" : ""}`} onClick={() => onSelect(d.id)}>
                <td className="py-3">
                  <p className="font-medium">{d.fileName}</p>
                  <p className="text-xs text-muted-foreground">{d.id}</p>
                </td>
                <td>{d.supplierOrCustomer || "-"}</td>
                <td>{d.category || "-"}</td>
                <td>{d.date || "-"}</td>
                <td>EUR {d.amount.toFixed(2)}</td>
                <td><StatusBadge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
