export type AccountType = "asset" | "expense" | "revenue" | "liability";
export type SkrType = "SKR03" | "SKR04";

export type ChartAccount = {
  id: string;
  number: string;
  name: string;
  type: AccountType;
  skrType: SkrType;
  taxRate: number;
  category: string;
  active: boolean;
};

const baseAccounts: Omit<ChartAccount, "id" | "skrType">[] = [
  { number: "1000", name: "Kasse", type: "asset", taxRate: 0, category: "Liquide Mittel", active: true },
  { number: "1200", name: "Bank", type: "asset", taxRate: 0, category: "Liquide Mittel", active: true },
  { number: "1360", name: "Geldtransit", type: "asset", taxRate: 0, category: "Liquide Mittel", active: true },
  { number: "1571", name: "Vorsteuer 7%", type: "asset", taxRate: 7, category: "Steuer", active: true },
  { number: "1576", name: "Vorsteuer 19%", type: "asset", taxRate: 19, category: "Steuer", active: true },
  { number: "1600", name: "Verbindlichkeiten aus Lieferungen", type: "liability", taxRate: 0, category: "Verbindlichkeiten", active: true },
  { number: "1771", name: "Umsatzsteuer 7%", type: "liability", taxRate: 7, category: "Steuer", active: true },
  { number: "1776", name: "Umsatzsteuer 19%", type: "liability", taxRate: 19, category: "Steuer", active: true },
  { number: "1800", name: "Privatentnahmen", type: "liability", taxRate: 0, category: "Eigenkapital", active: true },
  { number: "2000", name: "Forderungen aus Lieferungen", type: "asset", taxRate: 0, category: "Forderungen", active: true },
  { number: "3000", name: "Rohstoffe", type: "expense", taxRate: 19, category: "Wareneinsatz", active: true },
  { number: "3125", name: "Hilfsstoffe", type: "expense", taxRate: 19, category: "Wareneinsatz", active: true },
  { number: "3200", name: "Wareneingang", type: "expense", taxRate: 19, category: "Wareneinsatz", active: true },
  { number: "3400", name: "Wareneingang 19%", type: "expense", taxRate: 19, category: "Wareneinsatz", active: true },
  { number: "3420", name: "Wareneingang 7%", type: "expense", taxRate: 7, category: "Wareneinsatz", active: true },
  { number: "4000", name: "Betriebliche Aufwendungen", type: "expense", taxRate: 19, category: "Betriebskosten", active: true },
  { number: "4200", name: "Miete", type: "expense", taxRate: 19, category: "Betriebskosten", active: true },
  { number: "4400", name: "Strom", type: "expense", taxRate: 19, category: "Betriebskosten", active: true },
  { number: "4520", name: "Kfz-Kosten", type: "expense", taxRate: 19, category: "Fahrzeug", active: true },
  { number: "4650", name: "Bewirtungskosten", type: "expense", taxRate: 19, category: "Repräsentation", active: true },
  { number: "4660", name: "Reisekosten", type: "expense", taxRate: 19, category: "Reisekosten", active: true },
  { number: "4800", name: "Reparaturen", type: "expense", taxRate: 19, category: "Instandhaltung", active: true },
  { number: "4900", name: "Allgemeine Verwaltungskosten", type: "expense", taxRate: 19, category: "Verwaltung", active: true },
  { number: "4930", name: "Bürobedarf", type: "expense", taxRate: 19, category: "Verwaltung", active: true },
  { number: "4950", name: "Porto", type: "expense", taxRate: 19, category: "Verwaltung", active: true },
  { number: "4960", name: "Telefon", type: "expense", taxRate: 19, category: "Verwaltung", active: true },
  { number: "4970", name: "Internetkosten", type: "expense", taxRate: 19, category: "Verwaltung", active: true },
  { number: "4980", name: "Softwarelizenzen", type: "expense", taxRate: 19, category: "IT", active: true },
  { number: "6000", name: "Löhne und Gehälter", type: "expense", taxRate: 0, category: "Personal", active: true },
  { number: "6020", name: "Soziale Abgaben", type: "expense", taxRate: 0, category: "Personal", active: true },
  { number: "6500", name: "Werbekosten", type: "expense", taxRate: 19, category: "Marketing", active: true },
  { number: "6510", name: "Online-Marketing", type: "expense", taxRate: 19, category: "Marketing", active: true },
  { number: "6520", name: "Druckerzeugnisse", type: "expense", taxRate: 19, category: "Marketing", active: true },
  { number: "6600", name: "Rechts- und Beratungskosten", type: "expense", taxRate: 19, category: "Beratung", active: true },
  { number: "6670", name: "Nebenkosten des Geldverkehrs", type: "expense", taxRate: 19, category: "Bank", active: true },
  { number: "6800", name: "Abschreibungen", type: "expense", taxRate: 0, category: "Abschreibung", active: true },
  { number: "7000", name: "Zinserträge", type: "revenue", taxRate: 0, category: "Finanzerträge", active: true },
  { number: "7200", name: "Erlösschmälerungen", type: "revenue", taxRate: 19, category: "Erlöse", active: true },
  { number: "8000", name: "Erlöse", type: "revenue", taxRate: 19, category: "Erlöse", active: true },
  { number: "8100", name: "Erlöse 7%", type: "revenue", taxRate: 7, category: "Erlöse", active: true },
  { number: "8300", name: "Erlöse steuerfrei", type: "revenue", taxRate: 0, category: "Erlöse", active: true },
  { number: "8400", name: "Erlöse 19%", type: "revenue", taxRate: 19, category: "Erlöse", active: true },
  { number: "8736", name: "Innergemeinschaftliche Lieferung", type: "revenue", taxRate: 0, category: "Erlöse", active: true },
];

function expand(seed: Omit<ChartAccount, "id" | "skrType">[], skrType: SkrType): ChartAccount[] {
  const out: ChartAccount[] = [];
  seed.forEach((acc, idx) => {
    out.push({ ...acc, id: `${skrType}-${acc.number}`, skrType });
    const withSuffix = {
      ...acc,
      id: `${skrType}-${acc.number}-A`,
      number: String(Number(acc.number) + 1 + idx % 3),
      name: `${acc.name} (Unterkonto)`,
      active: idx % 11 !== 0,
      category: acc.category,
      skrType,
    } satisfies ChartAccount;
    out.push(withSuffix);
  });
  return out;
}

export const chartOfAccountsSeed: ChartAccount[] = [...expand(baseAccounts, "SKR03"), ...expand(baseAccounts, "SKR04")].slice(0, 180);
