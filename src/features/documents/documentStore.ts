import { create } from "zustand";
import type { BookingRecord, DocumentData, DocumentItem, DocumentStatus } from "./types";

type DocumentsState = {
  documents: DocumentItem[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addDocumentFromUpload: (payload: { fileName: string; pdfUrl: string; size: number }) => DocumentItem;
  updateDocumentData: (id: string, patch: Partial<DocumentData>) => void;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;
  replaceDocumentFile: (id: string, fileName: string, pdfUrl: string, size: number) => void;
  runMockOcr: (id: string) => void;
  bookDocument: (id: string) => { ok: true } | { ok: false; errors: string[] };
};

function newDraftData(): DocumentData {
  return {
    type: "Sonstiger Beleg",
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
      selectedId: null,
      setSelectedId: (id) => set({ selectedId: id }),
      addDocumentFromUpload: ({ fileName, pdfUrl, size }) => {
        const next: DocumentItem = {
          id: `DOC-${Date.now()}`,
          fileName,
          supplierOrCustomer: "",
          status: "Entwurf",
          category: "",
          amount: Number((size / 100).toFixed(2)),
          date: new Date().toISOString().slice(0, 10),
          dueDate: "",
          uploadedAt: new Date().toISOString().slice(0, 10),
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
            d.id === id ? { ...d, fileName, pdfUrl, amount: Number((size / 100).toFixed(2)) } : d,
          ),
        })),
      runMockOcr: (id) =>
        set((state) => ({
          documents: state.documents.map((d) => {
            if (d.id !== id) return d;
            const guessedType = d.fileName.toLowerCase().includes("ausgang")
              ? "Ausgangsrechnung"
              : "Eingangsrechnung";
            const net = d.data.netAmount > 0 ? d.data.netAmount : Number((d.amount / 1.19).toFixed(2));
            const vat = Number((net * 0.19).toFixed(2));
            const gross = Number((net + vat).toFixed(2));
            return {
              ...d,
              data: {
                ...d.data,
                type: guessedType,
                partner: d.data.partner || "CloudStack GmbH",
                invoiceNumber: d.data.invoiceNumber || `OCR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                documentDate: d.data.documentDate || new Date().toISOString().slice(0, 10),
                dueDate:
                  d.data.dueDate ||
                  new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
                netAmount: net,
                vatAmount: vat,
                grossAmount: gross,
                category: d.data.category || "Software",
                account: d.data.account || "4930",
                paymentMethod: d.data.paymentMethod || "Ueberweisung",
                paymentStatus: d.data.paymentStatus || "Offen",
              },
              ocrConfidence: {
                type: 0.88,
                invoiceNumber: 0.72,
                documentDate: 0.95,
                dueDate: 0.78,
                partner: 0.81,
                netAmount: 0.86,
                vatAmount: 0.79,
                grossAmount: 0.87,
                currency: 0.99,
                paymentStatus: 0.76,
                paymentMethod: 0.74,
                category: 0.69,
                account: 0.67,
                costCenter: 0.62,
                notes: 0.58,
              },
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
          debitAccount: target.data.type === "Eingangsrechnung" ? target.data.account : "1200",
          creditAccount: target.data.type === "Eingangsrechnung" ? "1200" : target.data.account,
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
