import fs from "node:fs/promises";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

function sanitizeText(value) {
  const compact = String(value ?? "").replace(/\s+/g, " ").trim();
  return compact
    .replace(/Ã„/g, "Ä")
    .replace(/Ã–/g, "Ö")
    .replace(/Ãœ/g, "Ü")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã¼/g, "ü")
    .replace(/ÃŸ/g, "ß");
}

function accountTypeFromClass(accountClass) {
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

async function parsePdfFile(filePath, skrType, year) {
  const bytes = await fs.readFile(filePath);
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(bytes) });
  const pdf = await loadingTask.promise;
  const rows = new Map();
  const ignorePattern =
    /(kontenrahmen|datev|seite\s+\d+|konto\s+bezeichnung|klasse|gruppe|summe|stand\s+\d{2}\.\d{2}\.\d{4})/i;
  const accountPattern = /(?:^|\s)(\d{4})\s+(.+?)(?=(?:\s\d{4}\s)|$)/g;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = sanitizeText(content.items.map((item) => item.str ?? "").join(" "));

    for (const match of pageText.matchAll(accountPattern)) {
      const number = match[1] ?? "";
      const name = sanitizeText(match[2] ?? "");
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

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error("Usage: node scripts/skr-pdf-to-json.mjs <inputPdf> <skrType:SKR03|SKR04> <year> <outputJson>");
    process.exit(1);
  }

  const [inputPdf, skrTypeRaw, yearRaw, outputJson] = args;
  const skrType = String(skrTypeRaw).toUpperCase();
  const year = Number(yearRaw);
  if (!["SKR03", "SKR04"].includes(skrType)) {
    console.error("Invalid skrType. Use SKR03 or SKR04.");
    process.exit(1);
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    console.error("Invalid year.");
    process.exit(1);
  }

  const result = await parsePdfFile(path.resolve(inputPdf), skrType, year);
  await fs.writeFile(path.resolve(outputJson), JSON.stringify(result, null, 2), "utf8");
  console.log(`Extracted ${result.length} accounts -> ${outputJson}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
