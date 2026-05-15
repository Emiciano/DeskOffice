import type { DocumentData, DocumentItem } from "./types";

function randomConfidence(low = 0.72, high = 0.99) {
  return Number((Math.random() * (high - low) + low).toFixed(2));
}

export async function runMockOcr(document: DocumentItem): Promise<{
  data: Partial<DocumentData>;
  confidence: Record<keyof DocumentData, number>;
}> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const extracted: Partial<DocumentData> = {
    type: "Eingangsrechnung",
    invoiceNumber: `RE-${new Date().getFullYear()}-${document.id.slice(-3)}`,
    documentDate: document.date,
    dueDate: document.dueDate,
    partner: document.supplierOrCustomer || "Muster Lieferant GmbH",
    netAmount: Math.round(document.amount / 1.19),
    vatAmount: Number((document.amount - Math.round(document.amount / 1.19)).toFixed(2)),
    grossAmount: document.amount,
    currency: "EUR",
    paymentStatus: "Offen",
    paymentMethod: "Ueberweisung",
    category: document.category || "Betriebskosten",
    account: "3400",
    costCenter: "HQ-01",
    notes: "OCR Vorschlag: Daten bitte pruefen.",
  };

  const confidence = {
    type: randomConfidence(),
    invoiceNumber: randomConfidence(0.6, 0.97),
    documentDate: randomConfidence(0.7, 0.99),
    dueDate: randomConfidence(0.64, 0.95),
    partner: randomConfidence(0.58, 0.95),
    netAmount: randomConfidence(0.8, 0.99),
    vatAmount: randomConfidence(0.8, 0.99),
    grossAmount: randomConfidence(0.87, 0.99),
    currency: randomConfidence(0.9, 1),
    paymentStatus: randomConfidence(0.7, 0.94),
    paymentMethod: randomConfidence(0.65, 0.93),
    category: randomConfidence(0.55, 0.9),
    account: randomConfidence(0.52, 0.86),
    costCenter: randomConfidence(0.5, 0.88),
    notes: randomConfidence(0.45, 0.8),
  } satisfies Record<keyof DocumentData, number>;

  return { data: extracted, confidence };
}
