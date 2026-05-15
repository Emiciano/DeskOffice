export type InvoiceStatus = "Entwurf" | "Offen" | "Bezahlt" | "Überfällig";
export type OfferStatus = "Entwurf" | "Gesendet" | "Angenommen" | "Abgelehnt";

export const dashboardStats = [
  { label: "Umsatz", value: "€128.450", trend: "+8,3%" },
  { label: "Offene Rechnungen", value: "€21.300", trend: "12 Stück" },
  { label: "Ausgaben", value: "€42.180", trend: "+2,1%" },
  { label: "Gewinn/Verlust", value: "€86.270", trend: "+5,4%" },
];

export const revenueSeries = [
  { month: "Jan", einnahmen: 16500, ausgaben: 8100 },
  { month: "Feb", einnahmen: 18900, ausgaben: 7800 },
  { month: "Mrz", einnahmen: 21500, ausgaben: 9300 },
  { month: "Apr", einnahmen: 24800, ausgaben: 8600 },
  { month: "Mai", einnahmen: 26700, ausgaben: 9200 },
  { month: "Jun", einnahmen: 29200, ausgaben: 9800 },
];

export const activities = [
  "Rechnung RE-2026-104 wurde bezahlt.",
  "Neuer Kunde 'Nordlicht Media GmbH' hinzugefügt.",
  "Beleg für Softwarelizenz hochgeladen.",
  "Angebot AN-2026-031 in Rechnung umgewandelt.",
];

export const invoices = [
  { id: "RE-2026-101", customer: "Münster Labs", amount: 1800, dueDate: "2026-05-05", status: "Bezahlt" as InvoiceStatus },
  { id: "RE-2026-102", customer: "Klarblick Digital", amount: 3200, dueDate: "2026-05-12", status: "Offen" as InvoiceStatus },
  { id: "RE-2026-103", customer: "Nordlicht Media", amount: 950, dueDate: "2026-04-29", status: "Überfällig" as InvoiceStatus },
  { id: "RE-2026-104", customer: "Sonnberg Tech", amount: 2450, dueDate: "2026-05-18", status: "Entwurf" as InvoiceStatus },
];

export const offers = [
  { id: "AN-2026-031", customer: "Münster Labs", amount: 2200, status: "Angenommen" as OfferStatus },
  { id: "AN-2026-032", customer: "Alpin Consulting", amount: 4100, status: "Gesendet" as OfferStatus },
  { id: "AN-2026-033", customer: "Klarblick Digital", amount: 1300, status: "Entwurf" as OfferStatus },
  { id: "AN-2026-034", customer: "Futura Health", amount: 5600, status: "Abgelehnt" as OfferStatus },
];

export const customers = [
  { id: "KU-001", name: "Münster Labs GmbH", email: "hello@muensterlabs.de", phone: "+49 251 77 44 901", revenue: 17600, invoices: 7 },
  { id: "KU-002", name: "Klarblick Digital AG", email: "finance@klarblick.de", phone: "+49 40 73 12 980", revenue: 12400, invoices: 5 },
  { id: "KU-003", name: "Nordlicht Media GmbH", email: "office@nordlicht.io", phone: "+49 30 90 11 450", revenue: 9900, invoices: 4 },
];

export const expenses = [
  { id: "EX-1", vendor: "Adobe", category: "Software", amount: 69, status: "geprüft" },
  { id: "EX-2", vendor: "Google Ads", category: "Werbung", amount: 420, status: "offen" },
  { id: "EX-3", vendor: "Miete Office", category: "Büro", amount: 1250, status: "geprüft" },
  { id: "EX-4", vendor: "DB Bahn", category: "Reisekosten", amount: 118, status: "offen" },
];

export const transactions = [
  { id: "TX-1001", date: "2026-05-11", label: "SEPA Eingang", amount: 1800, type: "Einnahme", matchedInvoice: "RE-2026-101" },
  { id: "TX-1002", date: "2026-05-12", label: "Mietzahlung", amount: -1250, type: "Ausgabe", matchedInvoice: "-" },
  { id: "TX-1003", date: "2026-05-13", label: "Kundenzahlung", amount: 3200, type: "Einnahme", matchedInvoice: "RE-2026-102" },
];

export const products = [
  { id: "PR-1", name: "SEO Audit", type: "Leistung", price: 590, tax: "19%", description: "Initiale Analyse und Maßnahmenplan" },
  { id: "PR-2", name: "Support Retainer", type: "Leistung", price: 1200, tax: "19%", description: "Monatliche Betreuung" },
  { id: "PR-3", name: "Laptop Dock", type: "Produkt", price: 189, tax: "19%", description: "Hardware für Homeoffice" },
];
