import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId } from "../auth.js";

export const copilotRouter = Router();

copilotRouter.post("/ask", async (req, res) => {
  const { question } = req.body as { question?: string };
  const companyId = getCompanyId(req);
  if (!companyId || !question) {
    return res.status(400).json({ error: "question required" });
  }

  const q = question.toLowerCase();
  const [invoices, documents, bookings] = await Promise.all([
    prisma.invoice.findMany({ where: { companyId } }),
    prisma.document.findMany({ where: { companyId } }),
    prisma.booking.findMany({ where: { companyId } }),
  ]);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthInvoices = invoices.filter((i) => {
    const d = new Date(i.createdAt);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const monthRevenue = monthInvoices.reduce((sum, i) => sum + i.amountGross, 0);

  const overdue = invoices.filter((i) => i.status === "Ueberfaellig");
  const open = invoices.filter((i) => i.status === "Offen" || i.status === "Ueberfaellig");
  const draftDocs = documents.filter((d) => d.status === "Entwurf");
  const checkedDocs = documents.filter((d) => d.status === "Geprueft");
  const monthExpense = bookings
    .filter((b) => {
      const d = new Date(b.bookingDate);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .filter((b) => b.debitAccount.startsWith("3") || b.debitAccount.startsWith("4"))
    .reduce((sum, b) => sum + b.amount + b.taxAmount, 0);

  let answer = "Dazu habe ich aktuell noch keine passende Auswertung. Frag mich gerne zu Umsatz, Ausgaben, offenen Rechnungen oder fehlenden Belegen.";

  if (q.includes("ausgaben") || q.includes("expense")) {
    answer = `Deine Ausgaben im aktuellen Monat liegen bei EUR ${monthExpense.toFixed(2)}.`;
  } else if (q.includes("umsatz") || q.includes("einnahmen") || q.includes("revenue")) {
    answer = `Dein Umsatz im aktuellen Monat liegt bei EUR ${monthRevenue.toFixed(2)} aus ${monthInvoices.length} Rechnungen.`;
  } else if (q.includes("ueberfaellig") || q.includes("überfällig")) {
    answer = `Du hast aktuell ${overdue.length} ueberfaellige Rechnung(en).`;
  } else if (q.includes("offen")) {
    const amount = open.reduce((sum, i) => sum + i.amountGross, 0);
    answer = `Es sind ${open.length} offene Rechnung(en) mit zusammen EUR ${amount.toFixed(2)}.`;
  } else if (q.includes("beleg") || q.includes("fehlt") || q.includes("inbox")) {
    answer = `In der Belegverwaltung sind ${draftDocs.length} Entwurf und ${checkedDocs.length} gepruefte Belege, die noch nicht final verbucht sind.`;
  } else if (q.includes("gewinn")) {
    const profit = monthRevenue - monthExpense;
    answer = `Vorlaeufiger Monatsgewinn: EUR ${profit.toFixed(2)} (Umsatz EUR ${monthRevenue.toFixed(2)} minus Ausgaben EUR ${monthExpense.toFixed(2)}).`;
  }

  res.json({
    answer,
    meta: {
      monthRevenue: Number(monthRevenue.toFixed(2)),
      monthExpense: Number(monthExpense.toFixed(2)),
      overdueCount: overdue.length,
      openCount: open.length,
      draftDocuments: draftDocs.length,
    },
  });
});
