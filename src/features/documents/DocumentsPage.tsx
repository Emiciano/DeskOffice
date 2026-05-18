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
import type { DocumentData, DocumentFilters, DocumentItem } from "./types";
import { apiFetch } from "@/lib/api";

export function DocumentsPage() {
  const {
    documents,
    setDocuments,
    selectedId,
    setSelectedId,
    addDocumentFromUpload,
    updateDocumentData,
    setDocumentStatus,
    replaceDocumentFile,
    runMockOcr,
    bookDocument,
  } = useDocumentsStore();
  const [companyId, setCompanyId] = useState("");
  const [companyLoading, setCompanyLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

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
    void (async () => {
      try {
        const bootRes = await apiFetch("/api/bootstrap");
        if (!bootRes.ok) return;
        const boot = await bootRes.json();
        if (!boot.companyId) return;
        const id = String(boot.companyId);
        setCompanyId(id);
        const res = await apiFetch(`/api/documents?companyId=${id}`);
        if (!res.ok) return;
        const rows = (await res.json()) as Array<{
        id: string;
        fileName: string;
        status: string;
        category: string | null;
        grossAmount: number;
        partner: string | null;
        documentDate: string | null;
        dueDate: string | null;
        createdAt: string;
        accountNumber: string | null;
        taxAmount: number;
        netAmount: number;
        pdfUrl?: string;
      }>;
        const mapped: DocumentItem[] = rows.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        supplierOrCustomer: d.partner ?? "",
        status: (d.status as DocumentItem["status"]) ?? "Entwurf",
        category: d.category ?? "",
        amount: Number(d.grossAmount ?? 0),
        date: d.documentDate ? String(d.documentDate).slice(0, 10) : "",
        dueDate: d.dueDate ? String(d.dueDate).slice(0, 10) : "",
        uploadedAt: String(d.createdAt).slice(0, 10),
        pdfUrl: d.pdfUrl || "",
        pageCount: 1,
        data: {
          type: "Sonstiger Beleg",
          invoiceNumber: "",
          documentDate: d.documentDate ? String(d.documentDate).slice(0, 10) : "",
          dueDate: d.dueDate ? String(d.dueDate).slice(0, 10) : "",
          partner: d.partner ?? "",
          netAmount: Number(d.netAmount ?? 0),
          vatAmount: Number(d.taxAmount ?? 0),
          grossAmount: Number(d.grossAmount ?? 0),
          currency: "EUR",
          paymentStatus: "Offen",
          paymentMethod: "Ueberweisung",
          category: d.category ?? "",
          account: d.accountNumber ?? "",
          costCenter: "",
          notes: "",
        },
      }));
        setDocuments(mapped);
      } finally {
        setCompanyLoading(false);
      }
    })();
  }, [setDocuments]);

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
            disabled={companyLoading}
            onUploadDone={async (payload) => {
              setSaveError("");
              let createdId = "";
              let createdAt = "";
              let activeCompanyId = companyId;
              if (!activeCompanyId) {
                const bootRes = await apiFetch("/api/bootstrap");
                if (bootRes.ok) {
                  const boot = await bootRes.json();
                  if (boot.companyId) {
                    activeCompanyId = String(boot.companyId);
                    setCompanyId(activeCompanyId);
                  }
                }
              }
              if (activeCompanyId) {
                const res = await apiFetch("/api/documents", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    companyId: activeCompanyId,
                    fileName: payload.fileName,
                    status: "Entwurf",
                    grossAmount: Number((payload.size / 100).toFixed(2)),
                    fileDataUrl: payload.fileDataUrl,
                    fileSize: payload.size,
                  }),
                });
                if (!res.ok) {
                  let reason = "Beleg konnte nicht gespeichert werden.";
                  try {
                    const body = await res.json();
                    if (body?.error) reason = String(body.error);
                  } catch {
                    try {
                      const text = await res.text();
                      if (text) reason = text.slice(0, 180);
                    } catch {
                      // ignore parsing fallback
                    }
                  }
                  setSaveError(reason);
                  return;
                }
                const createdApi = await res.json();
                createdId = String(createdApi.id ?? "");
                createdAt = String(createdApi.createdAt ?? "").slice(0, 10);
              } else {
                setSaveError("Upload aktuell nicht moeglich: Firmenkontext fehlt. Bitte neu einloggen.");
                return;
              }
              const created = addDocumentFromUpload({
                ...payload,
                id: createdId || undefined,
                uploadedAt: createdAt || undefined,
              });
              setSelectedId(created.id);
              setEditingId(null);
            }}
          />
          {saveError ? <div className="text-sm text-rose-600">{saveError}</div> : null}
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
        <DialogContent className="h-[96vh] max-h-[96vh] overflow-hidden p-3">
          {editingDocument ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <span className="font-medium">{editingDocument.fileName}</span>
                <StatusBadge status={editingDocument.status} />
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <DocumentDetail
                  document={editingDocument}
                  onReplaceFile={(file) => {
                    if (file.type === "application/pdf") {
                      replaceDocumentFile(editingDocument.id, file.name, URL.createObjectURL(file), file.size);
                      void (async () => {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          await apiFetch(`/api/documents/${editingDocument.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              companyId,
                              fileName: file.name,
                              fileDataUrl: String(reader.result ?? ""),
                              fileSize: file.size,
                            }),
                          });
                        };
                        reader.readAsDataURL(file);
                      })();
                    }
                  }}
                  onChangeData={(patch) => updateDocumentData(editingDocument.id, patch)}
                  onMarkChecked={() => {
                    setDocumentStatus(editingDocument.id, "Geprueft");
                    void apiFetch(`/api/documents/${editingDocument.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ companyId, status: "Geprueft" }),
                    });
                  }}
                  onRunOcr={() => runMockOcr(editingDocument.id)}
                  onBook={() => {
                    const result = bookDocument(editingDocument.id);
                    if ("ok" in result && result.ok) {
                      void apiFetch(`/api/documents/${editingDocument.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ companyId, status: "Gebucht" }),
                      });
                    }
                    return result;
                  }}
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="text-rose-600"
                  onClick={async () => {
                    const res = await apiFetch(`/api/documents/${editingDocument.id}?companyId=${companyId}`, {
                      method: "DELETE",
                    });
                    if (!res.ok) {
                      setSaveError("Beleg konnte nicht geloescht werden.");
                      return;
                    }
                    setDocuments(documents.filter((d) => d.id !== editingDocument.id));
                    setSelectedId(null);
                    setEditingId(null);
                    setCaptureOpen(false);
                    setSaveError("");
                  }}
                >
                  Loeschen
                </Button>
                <Button variant="outline" onClick={() => setCaptureOpen(false)}>Abbrechen</Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const patch: Partial<DocumentData> = editingDocument.data;
                    const res = await apiFetch(`/api/documents/${editingDocument.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        companyId,
                        status: "Entwurf",
                        partner: patch.partner,
                        category: patch.category,
                        accountNumber: patch.account,
                        grossAmount: patch.grossAmount,
                        taxAmount: patch.vatAmount,
                        netAmount: patch.netAmount,
                        documentDate: patch.documentDate,
                        dueDate: patch.dueDate,
                      }),
                    });
                    if (!res.ok) {
                      setSaveError("Entwurf konnte nicht gespeichert werden.");
                      return;
                    }
                    setDocumentStatus(editingDocument.id, "Entwurf");
                    setCaptureOpen(false);
                    setSaveError("");
                  }}
                >
                  Als Entwurf speichern
                </Button>
                <Button
                  onClick={async () => {
                    setDocumentStatus(editingDocument.id, "Geprueft");
                    const patch: Partial<DocumentData> = editingDocument.data;
                    const res = await apiFetch(`/api/documents/${editingDocument.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        companyId,
                        status: "Geprueft",
                        partner: patch.partner,
                        category: patch.category,
                        accountNumber: patch.account,
                        grossAmount: patch.grossAmount,
                        taxAmount: patch.vatAmount,
                        netAmount: patch.netAmount,
                        documentDate: patch.documentDate,
                        dueDate: patch.dueDate,
                      }),
                    });
                    if (!res.ok) {
                      setSaveError("Belegdaten konnten nicht gespeichert werden.");
                      return;
                    }
                    setCaptureOpen(false);
                    setSaveError("");
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
