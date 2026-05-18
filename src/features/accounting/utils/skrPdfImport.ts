import type { SkrType } from "../types/accountingTypes";

type ParsedAccount = {
  number: string;
  name: string;
  skrType: SkrType;
  year: number;
  accountClass: string;
  accountType: string;
  taxKey: string | null;
  active: boolean;
};

function accountTypeFromClass(accountClass: string): string {
  switch (accountClass) {
    case "0":
    case "1":
      return "asset";
    case "2":
      return "liability";
    case "3":
    case "4":
    case "6":
    case "7":
      return "expense";
    case "8":
      return "revenue";
    case "9":
      return "statistic";
    default:
      return "";
  }
}

function sanitizeName(raw: string): string {
  const compact = raw.replace(/\s+/g, " ").trim();
  return compact
    .replace(/Ã„/g, "Ä")
    .replace(/Ã–/g, "Ö")
    .replace(/Ãœ/g, "Ü")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã¼/g, "ü")
    .replace(/ÃŸ/g, "ß");
}

export async function parseSkrPdfFile(file: File, skrType: SkrType, year: number): Promise<ParsedAccount[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const buffer = await file.arrayBuffer();
  // Worker loading can fail behind some reverse proxies; disable worker for stable parsing.
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true });
  const pdf = await loadingTask.promise;

  const rows = new Map<string, ParsedAccount>();
  const ignorePattern =
    /(kontenrahmen|datev|seite\s+\d+|konto\s+bezeichnung|klasse|gruppe|summe|stand\s+\d{2}\.\d{2}\.\d{4})/i;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: unknown) => (item as { str?: string }).str ?? "")
      .join(" ");

    const normalizedText = sanitizeName(text);
    const accountPattern = /(?:^|\s)(\d{4})\s+(.+?)(?=(?:\s\d{4}\s)|$)/g;
    for (const match of normalizedText.matchAll(accountPattern)) {
      const number = match[1] ?? "";
      const name = sanitizeName(match[2] ?? "");
      if (!number || !name) continue;
      if (ignorePattern.test(name)) continue;
      if (/^[\d.,\-/ ]+$/.test(name)) continue;
      if (name.length < 3 || name.length > 120) continue;

      const accountClass = number.charAt(0);
      const key = `${skrType}-${year}-${number}`;
      rows.set(key, {
        number,
        name,
        skrType,
        year,
        accountClass,
        accountType: accountTypeFromClass(accountClass),
        taxKey: null,
        active: true,
      });
    }
  }

  return Array.from(rows.values()).sort((a, b) => a.number.localeCompare(b.number));
}
