import { Router } from "express";
import { getCompanyId, requirePermissions } from "../auth.js";
import { prisma } from "../db.js";

export const copilotRouter = Router();

const HINTS = [
  "Wie hoch waren meine Ausgaben diesen Monat?",
  "Welche Rechnungen sind überfällig?",
  "Wie viel ist aktuell offen?",
  "Welche Belege sind noch unvollständig?",
];

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

copilotRouter.get("/hints", requirePermissions("copilot:read"), (_req, res) => {
  res.json(HINTS);
});

copilotRouter.post("/ask", requirePermissions("copilot:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const question = String((req.body as { question?: unknown })?.question ?? "").trim();
  if (!question) return res.status(400).json({ error: "question required" });
  if (question.length > 500) return res.status(400).json({ error: "question too long" });

  const { start, end } = monthRange();
  const [monthInvoices, monthBookings, allOpenInvoices, overdueInvoices, docs] = await Promise.all([
    prisma.invoice.findMany({ where: { companyId, createdAt: { gte: start, lt: end } } }),
    prisma.booking.findMany({ where: { companyId, bookingDate: { gte: start, lt: end } } }),
    prisma.invoice.findMany({ where: { companyId, status: { in: ["Offen", "Ueberfaellig"] } } }),
    prisma.invoice.findMany({ where: { companyId, status: "Ueberfaellig" }, orderBy: { dueDate: "asc" }, take: 10 }),
    prisma.document.findMany({ where: { companyId, status: { in: ["Entwurf", "Geprueft"] } } }),
  ]);

  const monthRevenue = Number(monthInvoices.reduce((sum, i) => sum + i.amountGross, 0).toFixed(2));
  const monthExpense = Number(monthBookings.reduce((sum, b) => sum + b.amount + b.taxAmount, 0).toFixed(2));
  const monthProfit = Number((monthRevenue - monthExpense).toFixed(2));
  const openAmount = Number(allOpenInvoices.reduce((sum, i) => sum + i.amountGross, 0).toFixed(2));

  const draftDocuments = docs.filter((d) => d.status === "Entwurf").length;
  const checkedDocuments = docs.filter((d) => d.status === "Geprueft").length;

  const q = question.toLowerCase();
  let answer = "Ich habe deine Daten geprüft. Sag mir gern genauer, welche Kennzahl du sehen möchtest.";

  if (q.includes("ausgaben")) {
    answer = `Deine Ausgaben in diesem Monat liegen bei EUR ${monthExpense.toFixed(2)}.`;
  } else if (q.includes("umsatz") || q.includes("einnahmen")) {
    answer = `Dein Umsatz in diesem Monat liegt bei EUR ${monthRevenue.toFixed(2)}.`;
  } else if (q.includes("offen")) {
    answer = `Aktuell sind ${allOpenInvoices.length} Rechnungen offen oder überfällig mit insgesamt EUR ${openAmount.toFixed(2)}.`;
  } else if (q.includes("überfällig") || q.includes("ueberfaellig")) {
    if (overdueInvoices.length === 0) {
      answer = "Aktuell gibt es keine überfälligen Rechnungen.";
    } else {
      const preview = overdueInvoices
        .slice(0, 3)
        .map((i) => `${i.number} (${i.customer})`)
        .join(", ");
      answer = `Du hast ${overdueInvoices.length} überfällige Rechnungen. Beispiele: ${preview}.`;
    }
  } else if (q.includes("beleg") || q.includes("dokument")) {
    answer = `Es gibt ${docs.length} unvollständige Belege (${draftDocuments} Entwurf, ${checkedDocuments} geprüft).`;
  } else if (q.includes("gewinn") || q.includes("profit")) {
    answer = `Dein vorläufiger Monatsgewinn liegt bei EUR ${monthProfit.toFixed(2)}.`;
  }

  res.json({
    answer,
    meta: {
      monthRevenue,
      monthExpense,
      monthProfit,
      overdueCount: overdueInvoices.length,
      openCount: allOpenInvoices.length,
      openAmount,
      draftDocuments,
      checkedDocuments,
    },
  });
});

