export type DocumentStatus = "Entwurf" | "Geprueft" | "Gebucht" | "Bezahlt" | "Ueberfaellig";
export type DocumentType = "Einnahme" | "Einnahmenminderung" | "Ausgabe" | "Ausgabenminderung";

export type PaymentStatus = "Offen" | "Teilweise bezahlt" | "Bezahlt";
export type PaymentMethod = "Ueberweisung" | "Lastschrift" | "Kreditkarte" | "Bar" | "Sonstiges";

export type ExtractedFieldConfidence = {
  value: string;
  confidence: number;
};

export type DocumentData = {
  type: DocumentType;
  invoiceNumber: string;
  documentDate: string;
  dueDate: string;
  partner: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  category: string;
  account: string;
  costCenter: string;
  notes: string;
};

export type BookingRecord = {
  id: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  taxAmount: number;
  bookingText: string;
  documentRef: string;
  bookingDate: string;
  category: string;
  status: "Offen" | "Verbucht";
};

export type DocumentItem = {
  id: string;
  fileName: string;
  supplierOrCustomer: string;
  status: DocumentStatus;
  category: string;
  amount: number;
  date: string;
  dueDate: string;
  uploadedAt: string;
  pdfUrl: string;
  pageCount: number;
  ocrConfidence?: Record<keyof DocumentData, number>;
  data: DocumentData;
  booking?: BookingRecord;
};

export type DocumentFilters = {
  query: string;
  status: "Alle" | DocumentStatus;
  category: "Alle" | string;
  partner: string;
  dateFrom: string;
  dateTo: string;
  sortBy: "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "status";
};
