import { create } from "zustand";
import type { BookingRecord, DocumentData, DocumentItem, DocumentStatus } from "./types";

type DocumentsState = {
  documents: DocumentItem[];
  setDocuments: (documents: DocumentItem[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addDocumentFromUpload: (payload: { id?: string; fileName: string; pdfUrl: string; size: number; uploadedAt?: string }) => DocumentItem;
  updateDocumentData: (id: string, patch: Partial<DocumentData>) => void;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;
  replaceDocumentFile: (id: string, fileName: string, pdfUrl: string, size: number) => void;
  applyOcrResult: (
    id: string,
    patch: Partial<DocumentData>,
    confidence: Partial<Record<keyof DocumentData, number>>,
  ) => void;
  bookDocument: (id: string) => { ok: true } | { ok: false; errors: string[] };
};

function newDraftData(): DocumentData {
  return {
    type: "Ausgabe",
    invoiceNumber: "",
    documentDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    partner: "",
    netAmount: 0,
    vatAmount: 0,
    grossAmount: 0,
    currency: "EUR",
    paymentStatus: "Offen",
    paymentMethod: "Ueberweisung",
    category: "",
    account: "",
    costCenter: "",
    notes: "",
  };
}

export const useDocumentsStore = create<DocumentsState>()((set, get) => ({
      documents: [],
      setDocuments: (documents) => set({ documents }),
      selectedId: null,
      setSelectedId: (id) => set({ selectedId: id }),
      addDocumentFromUpload: ({ id, fileName, pdfUrl, size, uploadedAt }) => {
        const next: DocumentItem = {
          id: id ?? `DOC-${Date.now()}`,
          fileName,
          supplierOrCustomer: "",
          status: "Entwurf",
          category: "",
          amount: 0,
          date: new Date().toISOString().slice(0, 10),
          dueDate: "",
          uploadedAt: uploadedAt ?? new Date().toISOString().slice(0, 10),
          pdfUrl,
          pageCount: 1,
          data: newDraftData(),
        };
        set((state) => ({ documents: [next, ...state.documents], selectedId: next.id }));
        return next;
      },
      replaceDocumentFile: (id, fileName, pdfUrl, size) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, fileName, pdfUrl } : d,
          ),
        })),
      applyOcrResult: (id, patch, confidence) =>
        set((state) => ({
          documents: state.documents.map((d) => {
            if (d.id !== id) return d;
            const nextData = { ...d.data, ...patch };
            return {
              ...d,
              data: nextData,
              supplierOrCustomer: nextData.partner,
              category: nextData.category,
              amount: nextData.grossAmount,
              date: nextData.documentDate,
              dueDate: nextData.dueDate,
              ocrConfidence: { ...(d.ocrConfidence ?? {}), ...(confidence as Record<keyof DocumentData, number>) },
            };
          }),
        })),
      updateDocumentData: (id, patch) =>
        set((state) => ({
          documents: state.documents.map((d) => {
            if (d.id !== id) return d;
            const data = { ...d.data, ...patch };
            return {
              ...d,
              data,
              supplierOrCustomer: data.partner,
              category: data.category,
              amount: data.grossAmount,
              date: data.documentDate,
              dueDate: data.dueDate,
            };
          }),
        })),
      setDocumentStatus: (id, status) =>
        set((state) => ({ documents: state.documents.map((d) => (d.id === id ? { ...d, status } : d)) })),
      bookDocument: (id) => {
        const target = get().documents.find((d) => d.id === id);
        if (!target) return { ok: false, errors: ["Beleg nicht gefunden."] };
        const errors: string[] = [];
        if (!target.data.invoiceNumber) errors.push("Rechnungsnummer fehlt.");
        if (!target.data.documentDate) errors.push("Belegdatum fehlt.");
        if (!target.data.partner) errors.push("Lieferant/Kunde fehlt.");
        if (!target.data.account) errors.push("Buchungskonto fehlt.");
        if (target.data.grossAmount <= 0) errors.push("Bruttobetrag muss groesser als 0 sein.");
        if (errors.length) return { ok: false, errors };

        const booking: BookingRecord = {
          id: `BK-${Date.now()}`,
          debitAccount:
            target.data.type === "Ausgabe" || target.data.type === "Ausgabenminderung"
              ? target.data.account
              : "1200",
          creditAccount:
            target.data.type === "Ausgabe" || target.data.type === "Ausgabenminderung"
              ? "1200"
              : target.data.account,
          amount: target.data.netAmount,
          taxAmount: target.data.vatAmount,
          bookingText: `${target.data.type} ${target.data.invoiceNumber}`,
          documentRef: target.id,
          bookingDate: new Date().toISOString().slice(0, 10),
          category: target.data.category,
          status: "Verbucht",
        };
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, status: "Gebucht", booking } : d)),
        }));
        return { ok: true };
      },
    }),
);
