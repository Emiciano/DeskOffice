import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookingRecord, DocumentData, DocumentItem, DocumentStatus } from "./types";

const seedDocuments: DocumentItem[] = [
  {
    id: "DOC-1001",
    fileName: "eingang_rechenzentrum_april.pdf",
    supplierOrCustomer: "CloudStack GmbH",
    status: "Geprueft",
    category: "Software",
    amount: 1290,
    date: "2026-05-03",
    dueDate: "2026-05-18",
    uploadedAt: "2026-05-03",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    pageCount: 2,
    data: {
      type: "Eingangsrechnung",
      invoiceNumber: "CS-2026-447",
      documentDate: "2026-05-03",
      dueDate: "2026-05-18",
      partner: "CloudStack GmbH",
      netAmount: 1084.03,
      vatAmount: 205.97,
      grossAmount: 1290,
      currency: "EUR",
      paymentStatus: "Offen",
      paymentMethod: "Ueberweisung",
      category: "Software",
      account: "3400",
      costCenter: "IT-01",
      notes: "",
    },
  },
  {
    id: "DOC-1002",
    fileName: "ausgang_rechnung_nordlicht.pdf",
    supplierOrCustomer: "Nordlicht Media GmbH",
    status: "Bezahlt",
    category: "Beratung",
    amount: 3570,
    date: "2026-04-28",
    dueDate: "2026-05-12",
    uploadedAt: "2026-04-28",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    pageCount: 1,
    data: {
      type: "Ausgangsrechnung",
      invoiceNumber: "RE-2026-218",
      documentDate: "2026-04-28",
      dueDate: "2026-05-12",
      partner: "Nordlicht Media GmbH",
      netAmount: 3000,
      vatAmount: 570,
      grossAmount: 3570,
      currency: "EUR",
      paymentStatus: "Bezahlt",
      paymentMethod: "Ueberweisung",
      category: "Beratung",
      account: "8400",
      costCenter: "SALES-01",
      notes: "Zahlung am 2026-05-10 erhalten.",
    },
  },
];

type DocumentsState = {
  documents: DocumentItem[];
  selectedId: string | null;
  isOcrRunning: boolean;
  setSelectedId: (id: string | null) => void;
  addDocumentFromUpload: (payload: { fileName: string; pdfUrl: string; size: number }) => DocumentItem;
  updateDocumentData: (id: string, patch: Partial<DocumentData>) => void;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;
  applyOcrResult: (id: string, data: Partial<DocumentData>, confidence: Record<keyof DocumentData, number>) => void;
  setOcrRunning: (value: boolean) => void;
  replaceDocumentFile: (id: string, fileName: string, pdfUrl: string, size: number) => void;
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

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: seedDocuments,
      selectedId: seedDocuments[0]?.id ?? null,
      isOcrRunning: false,
      setSelectedId: (id) => set({ selectedId: id }),
      setOcrRunning: (value) => set({ isOcrRunning: value }),
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
      applyOcrResult: (id, data, confidence) =>
        set((state) => ({
          documents: state.documents.map((d) => {
            if (d.id !== id) return d;
            const merged = { ...d.data, ...data };
            return {
              ...d,
              data: merged,
              status: "Geprueft",
              supplierOrCustomer: merged.partner,
              category: merged.category,
              amount: merged.grossAmount,
              date: merged.documentDate,
              dueDate: merged.dueDate,
              ocrConfidence: confidence,
            };
          }),
        })),
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
    { name: "documents-store-v1" },
  ),
);
