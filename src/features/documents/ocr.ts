import type { DocumentData } from "./types";

export type OcrResult = {
  patch: Partial<DocumentData>;
  confidence: Partial<Record<keyof DocumentData, number>>;
};

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseEuro(raw: string): number {
  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickGrossAmount(text: string): { value?: number; confidence?: number } {
  const preferredPatterns = [
    /(?:Rechnungsbetrag|Gesamtbetrag(?:\s+inkl\.\s+Steuer)?|Brutto(?:\s+gesamt)?|Summe Positionen)\s*:?\s*([\d\.,\s]+)\s*(?:EUR|€)?/i,
    /([\d\.,\s]+)\s*(?:EUR|€)\s*(?:Rechnungsbetrag|Gesamtbetrag|Brutto)/i,
  ];
  for (const pattern of preferredPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = parseEuro(match[1]);
      if (value > 0) return { value: Number(value.toFixed(2)), confidence: 0.93 };
    }
  }

  const allCandidates = [...text.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})\s*(?:EUR|€)/gi)]
    .map((m) => parseEuro(m[1]))
    .filter((v) => v > 0);
  if (allCandidates.length > 0) {
    const value = Math.max(...allCandidates);
    return { value: Number(value.toFixed(2)), confidence: 0.72 };
  }

  return {};
}

export async function extractOcrFromPdfDataUrl(fileDataUrl: string): Promise<OcrResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Worker loading can fail behind some reverse proxies; disable worker for stable parsing.
  const loadingTask = pdfjs.getDocument({ data: dataUrlToUint8(fileDataUrl), disableWorker: true });
  const pdf = await loadingTask.promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: unknown) => (item as { str?: string }).str ?? "").join(" ");
    text += `\n${pageText}`;
  }

  const patch: Partial<DocumentData> = {};
  const confidence: Partial<Record<keyof DocumentData, number>> = {};

  const numberMatch = text.match(/(?:Rechnungsnummer|Belegnummer|Invoice\s*No\.?)\s*:?\s*([A-Z0-9\-\/]+)/i);
  if (numberMatch?.[1]) {
    patch.invoiceNumber = numberMatch[1].trim();
    confidence.invoiceNumber = 0.9;
  }

  const dateMatch = text.match(/(?:Rechnungsdatum|Belegdatum|Datum)\s*:?\s*(\d{2}\.\d{2}\.\d{4})/i);
  if (dateMatch?.[1]) {
    const [dd, mm, yyyy] = dateMatch[1].split(".");
    patch.documentDate = `${yyyy}-${mm}-${dd}`;
    confidence.documentDate = 0.94;
  }

  const dueMatch = text.match(/(?:Fälligkeitsdatum|Faelligkeitsdatum|Zahlbar\s+bis)\s*:?\s*(\d{2}\.\d{2}\.\d{4})/i);
  if (dueMatch?.[1]) {
    const [dd, mm, yyyy] = dueMatch[1].split(".");
    patch.dueDate = `${yyyy}-${mm}-${dd}`;
    confidence.dueDate = 0.9;
  }

  const partnerMatch = text.match(/(?:Lieferant|Kunde|Auftraggeber)\s*:?\s*([A-Za-zÄÖÜäöüß0-9 .,&-]{3,})/i);
  if (partnerMatch?.[1]) {
    patch.partner = partnerMatch[1].trim();
    confidence.partner = 0.82;
  }

  const grossAmount = pickGrossAmount(text);
  if (grossAmount.value && grossAmount.value > 0) {
    const gross = grossAmount.value;
    const net = Number((gross / 1.19).toFixed(2));
    const vat = Number((gross - net).toFixed(2));
    patch.grossAmount = gross;
    patch.netAmount = net;
    patch.vatAmount = vat;
    confidence.grossAmount = grossAmount.confidence ?? 0.75;
    confidence.netAmount = 0.86;
    confidence.vatAmount = 0.86;
  }

  return { patch, confidence };
}
