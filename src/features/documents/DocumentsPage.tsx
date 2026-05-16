import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";
import { DocumentDetail } from "./DocumentDetail";
import { DocumentInspector } from "./DocumentInspector";
import { useDocumentsStore } from "./documentStore";
import type { DocumentFilters } from "./types";

export function DocumentsPage() {
  const {
    documents,
    selectedId,
    setSelectedId,
    addDocumentFromUpload,
    updateDocumentData,
    setDocumentStatus,
    replaceDocumentFile,
    bookDocument,
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
  const [captureOpen, setCaptureOpen] = useState(false);
  const [docGroup, setDocGroup] = useState<"Alle" | "Ausgangsbelege" | "Eingangsbelege">("Alle");
  const [docSubType, setDocSubType] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setSelectedId(null);
    setEditingId(null);
  }, [setSelectedId]);

  useEffect(() => {
    const group = searchParams.get("group");
    const subType = searchParams.get("subType");
    const validGroup = group === "Ausgangsbelege" || group === "Eingangsbelege" ? group : "Alle";
    setDocGroup(validGroup);
    setDocSubType(subType ?? "");
    setSelectedId(null);
    setEditingId(null);
  }, [searchParams, setSelectedId]);

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
      const groupHit =
        docGroup === "Alle" ||
        (docGroup === "Ausgangsbelege" && (d.data.type === "Ausgangsrechnung" || d.data.type === "Gutschrift")) ||
        (docGroup === "Eingangsbelege" && (d.data.type === "Eingangsrechnung" || d.data.type === "Quittung"));

      const subTypeHit =
        !docSubType ||
        (docSubType === "Rechnungen" && d.data.type === "Ausgangsrechnung") ||
        (docSubType === "Rechnungskorrekturen" && d.data.type === "Gutschrift") ||
        (docSubType === "Ausgaben" && d.data.type === "Eingangsrechnung") ||
        (docSubType === "Einnahmen" && d.data.type === "Ausgangsrechnung") ||
        (docSubType === "Einnahmenminderung" && d.data.type === "Gutschrift");

      return queryHit && statusHit && categoryHit && partnerHit && fromHit && toHit && groupHit && subTypeHit;
    });

    rows.sort((a, b) => {
      if (filters.sortBy === "date_desc") return b.date.localeCompare(a.date);
      if (filters.sortBy === "date_asc") return a.date.localeCompare(b.date);
      if (filters.sortBy === "amount_desc") return b.amount - a.amount;
      if (filters.sortBy === "amount_asc") return a.amount - b.amount;
      return a.status.localeCompare(b.status);
    });

    return rows;
  }, [documents, filters, docGroup, docSubType]);

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
        subtitle="Upload, Prüfung und Buchung in einem durchgängigen Workflow"
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

      <div className="grid gap-4 xl:grid-cols-5">
        <div className={`${selected ? "xl:col-span-4" : "xl:col-span-5"} space-y-3`}>
          <DocumentUpload
            onUploadDone={(payload) => {
              const created = addDocumentFromUpload(payload);
              setSelectedId(created.id);
              setEditingId(null);
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
        </div>
        {selected ? (
          <div className="xl:col-span-1">
            <div className="sticky top-24">
              <DocumentInspector
                document={selected}
                onStartCapture={() => {
                  if (!selected) return;
                  setEditingId(selected.id);
                  setCaptureOpen(true);
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={captureOpen} onOpenChange={setCaptureOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-4">
          {editingDocument ? (
            <div className="flex max-h-[calc(92vh-2rem)] min-h-0 flex-col">
              <div className="mb-3 flex items-center gap-2 text-sm">
                <span className="font-medium">{editingDocument.fileName}</span>
                <StatusBadge status={editingDocument.status} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <DocumentDetail
                  document={editingDocument}
                  onReplaceFile={(file) => {
                    if (file.type === "application/pdf") {
                      replaceDocumentFile(editingDocument.id, file.name, URL.createObjectURL(file), file.size);
                    }
                  }}
                  onChangeData={(patch) => updateDocumentData(editingDocument.id, patch)}
                  onMarkChecked={() => setDocumentStatus(editingDocument.id, "Geprueft")}
                  onBook={() => bookDocument(editingDocument.id)}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCaptureOpen(false)}>Abbrechen</Button>
                <Button
                  onClick={() => {
                    setDocumentStatus(editingDocument.id, "Geprueft");
                    setCaptureOpen(false);
                    window.alert("Beleg gespeichert.");
                  }}
                >
                  Speichern
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Kein Beleg für die Erfassung ausgewählt.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
