import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/shared";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";
import { DocumentDetail } from "./DocumentDetail";
import { runMockOcr } from "./mockOcr";
import { useDocumentsStore } from "./documentStore";
import type { DocumentFilters } from "./types";

export function DocumentsPage() {
  const {
    documents,
    selectedId,
    setSelectedId,
    addDocumentFromUpload,
    updateDocumentData,
    applyOcrResult,
    setDocumentStatus,
    replaceDocumentFile,
    bookDocument,
    isOcrRunning,
    setOcrRunning,
  } = useDocumentsStore();

  const [filters, setFilters] = useState<DocumentFilters>({
    query: "",
    status: "Alle",
    category: "Alle",
    partner: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "date_desc",
  });

  const selected = documents.find((d) => d.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const rows = documents.filter((d) => {
      const q = filters.query.toLowerCase();
      const queryHit = !q || `${d.fileName} ${d.supplierOrCustomer} ${d.data.invoiceNumber}`.toLowerCase().includes(q);
      const statusHit = filters.status === "Alle" || d.status === filters.status;
      const categoryHit = filters.category === "Alle" || d.category.toLowerCase().includes(filters.category.toLowerCase());
      const partnerHit = !filters.partner || d.supplierOrCustomer.toLowerCase().includes(filters.partner.toLowerCase());
      const fromHit = !filters.dateFrom || d.date >= filters.dateFrom;
      const toHit = !filters.dateTo || d.date <= filters.dateTo;
      return queryHit && statusHit && categoryHit && partnerHit && fromHit && toHit;
    });
    rows.sort((a, b) => {
      if (filters.sortBy === "date_desc") return b.date.localeCompare(a.date);
      if (filters.sortBy === "date_asc") return a.date.localeCompare(b.date);
      if (filters.sortBy === "amount_desc") return b.amount - a.amount;
      if (filters.sortBy === "amount_asc") return a.amount - b.amount;
      return a.status.localeCompare(b.status);
    });
    return rows;
  }, [documents, filters]);

  const stats = useMemo(
    () => ({
      total: documents.length,
      open: documents.filter((d) => d.status === "Entwurf" || d.status === "Geprueft").length,
      booked: documents.filter((d) => d.status === "Gebucht").length,
    }),
    [documents],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Belege"
        subtitle="Upload, OCR, Pruefung und Buchung in einem durchgaengigen Workflow"
        action={<Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Beleg hochladen</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Gesamtbelege</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">In Bearbeitung</p>
          <p className="text-2xl font-semibold">{stats.open}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Gebucht</p>
          <p className="text-2xl font-semibold">{stats.booked}</p>
        </div>
      </div>

      <DocumentUpload
        onUploadDone={(payload) => {
          const created = addDocumentFromUpload(payload);
          setSelectedId(created.id);
        }}
      />

      <DocumentList
        documents={filtered}
        selectedId={selectedId}
        onSelect={setSelectedId}
        filters={filters}
        onFiltersChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />

      {selected ? (
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span>Ausgewaehlt:</span>
          <span className="font-medium">{selected.fileName}</span>
          <StatusBadge status={selected.status} />
        </div>
      ) : null}

      <DocumentDetail
        document={selected}
        isOcrRunning={isOcrRunning}
        onReplaceFile={(file) => {
          if (selected && file.type === "application/pdf") {
            replaceDocumentFile(selected.id, file.name, URL.createObjectURL(file), file.size);
          }
        }}
        onChangeData={(patch) => selected && updateDocumentData(selected.id, patch)}
        onMarkChecked={() => selected && setDocumentStatus(selected.id, "Geprueft")}
        onRunOcr={async () => {
          if (!selected) return;
          setOcrRunning(true);
          const res = await runMockOcr(selected);
          applyOcrResult(selected.id, res.data, res.confidence);
          setOcrRunning(false);
        }}
        onBook={() => (selected ? bookDocument(selected.id) : { ok: false, errors: ["Kein Beleg ausgewaehlt."] })}
      />
    </div>
  );
}
