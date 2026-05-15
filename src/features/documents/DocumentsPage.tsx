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
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = documents.find((d) => d.id === selectedId) ?? null;
  const editingDocument = documents.find((d) => d.id === editingId) ?? null;

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
          setEditingId(created.id);
        }}
      />

      <DocumentList
        documents={filtered}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onEdit={setEditingId}
        filters={filters}
        onFiltersChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />

      {editingDocument ? (
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span>Bearbeitung:</span>
          <span className="font-medium">{editingDocument.fileName}</span>
          <StatusBadge status={editingDocument.status} />
          <button className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted" onClick={() => setEditingId(null)}>
            Bearbeitung beenden
          </button>
        </div>
      ) : null}

      {editingDocument ? (
        <DocumentDetail
          document={editingDocument}
          isOcrRunning={isOcrRunning}
          onReplaceFile={(file) => {
            if (file.type === "application/pdf") {
              replaceDocumentFile(editingDocument.id, file.name, URL.createObjectURL(file), file.size);
            }
          }}
          onChangeData={(patch) => updateDocumentData(editingDocument.id, patch)}
          onMarkChecked={() => setDocumentStatus(editingDocument.id, "Geprueft")}
          onRunOcr={async () => {
            setOcrRunning(true);
            const res = await runMockOcr(editingDocument);
            applyOcrResult(editingDocument.id, res.data, res.confidence);
            setOcrRunning(false);
          }}
          onBook={() => bookDocument(editingDocument.id)}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
          Detailansicht ist ausgeblendet. Waehle bei einem Beleg "Bearbeiten" oder lade einen neuen Beleg hoch.
        </div>
      )}
    </div>
  );
}
