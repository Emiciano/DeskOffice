import { StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import type { DocumentFilters, DocumentItem } from "./types";

type Props = {
  documents: DocumentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  filters: DocumentFilters;
  onFiltersChange: (patch: Partial<DocumentFilters>) => void;
};

export function DocumentList({ documents, selectedId, onSelect, onEdit, filters, onFiltersChange }: Props) {
  return (
    <Card>
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          className="rounded-xl border border-border px-3 py-2 text-sm md:col-span-2 xl:col-span-1"
          placeholder="Suche nach Beleg, Partner, Nummer"
          value={filters.query}
          onChange={(e) => onFiltersChange({ query: e.target.value })}
        />
        <select className="rounded-xl border border-border px-3 py-2 text-sm" value={filters.status} onChange={(e) => onFiltersChange({ status: e.target.value as DocumentFilters["status"] })}>
          <option value="Alle">Alle</option>
          <option value="Entwurf">Entwurf</option>
          <option value="Geprueft">Geprüft</option>
          <option value="Gebucht">Gebucht</option>
          <option value="Bezahlt">Bezahlt</option>
          <option value="Ueberfaellig">Überfällig</option>
        </select>
        <input className="rounded-xl border border-border px-3 py-2 text-sm" placeholder="Kategorie" value={filters.category === "Alle" ? "" : filters.category} onChange={(e) => onFiltersChange({ category: e.target.value || "Alle" })} />
        <input className="rounded-xl border border-border px-3 py-2 text-sm" placeholder="Lieferant/Kunde" value={filters.partner} onChange={(e) => onFiltersChange({ partner: e.target.value })} />
        <select className="rounded-xl border border-border px-3 py-2 text-sm" value={filters.sortBy} onChange={(e) => onFiltersChange({ sortBy: e.target.value as DocumentFilters["sortBy"] })}>
          <option value="date_desc">Neueste zuerst</option>
          <option value="date_asc">Älteste zuerst</option>
          <option value="amount_desc">Betrag absteigend</option>
          <option value="amount_asc">Betrag aufsteigend</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-2">Beleg</th>
              <th className="py-2">Partner</th>
              <th className="py-2">Kategorie</th>
              <th className="py-2">Datum</th>
              <th className="py-2">Betrag</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Keine Belege für die aktuelle Filterung.</td></tr>
            ) : documents.map((d) => (
              <tr
                key={d.id}
                className={`cursor-pointer border-t border-border align-top transition ${selectedId === d.id ? "bg-primary/5" : "hover:bg-muted/40"}`}
                onClick={() => onSelect(d.id)}
              >
                <td className="py-3 pr-4">
                  <p className="max-w-[320px] truncate font-medium">{d.fileName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{d.id}</span>
                    <span>•</span>
                    <span>hochgeladen: {d.uploadedAt}</span>
                  </div>
                </td>
                <td className="py-3">{d.supplierOrCustomer || "-"}</td>
                <td className="py-3">{d.category || "-"}</td>
                <td className="py-3">{d.date || "-"}</td>
                <td className="py-3 font-medium">EUR {d.amount.toFixed(2)}</td>
                <td className="py-3"><StatusBadge status={d.status} /></td>
                <td className="py-3">
                  <button
                    className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(d.id);
                    }}
                  >
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
