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
        <input
          className="rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="Kategorie"
          value={filters.category === "Alle" ? "" : filters.category}
          onChange={(e) => onFiltersChange({ category: e.target.value || "Alle" })}
        />
        <input
          className="rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="Lieferant/Kunde"
          value={filters.partner}
          onChange={(e) => onFiltersChange({ partner: e.target.value })}
        />
        <select className="rounded-xl border border-border px-3 py-2 text-sm" value={filters.sortBy} onChange={(e) => onFiltersChange({ sortBy: e.target.value as DocumentFilters["sortBy"] })}>
          <option value="date_desc">Neueste zuerst</option>
          <option value="date_asc">Älteste zuerst</option>
          <option value="amount_desc">Betrag absteigend</option>
          <option value="amount_asc">Betrag aufsteigend</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="w-[33%] py-2">Beleg</th>
              <th className="w-[17%] py-2">Partner</th>
              <th className="w-[12%] py-2">Kategorie</th>
              <th className="w-[9%] py-2">Datum</th>
              <th className="w-[10%] py-2">Betrag</th>
              <th className="w-[11%] py-2">Status</th>
              <th className="w-[8%] py-2"></th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Keine Belege für die aktuelle Filterung.</td></tr>
            ) : documents.map((d) => (
              <tr
                key={d.id}
                className={`cursor-pointer border-t border-border align-top ${selectedId === d.id ? "bg-primary/5" : "hover:bg-muted/35"}`}
                onClick={() => onSelect(d.id)}
              >
                <td className="py-3 pr-4">
                  <p className="truncate font-medium">{d.fileName}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{d.id}</p>
                </td>
                <td className="truncate py-3 pr-3">{d.supplierOrCustomer || "-"}</td>
                <td className="truncate py-3 pr-3">{d.category || "-"}</td>
                <td className="py-3 pr-3">{d.date || "-"}</td>
                <td className="py-3 pr-3 font-medium">EUR {d.amount.toFixed(2)}</td>
                <td className="py-3 pr-3"><StatusBadge status={d.status} /></td>
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
