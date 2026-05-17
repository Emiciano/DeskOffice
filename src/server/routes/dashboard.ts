import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", requirePermissions("reports:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const [invoices, bookings, docs] = await Promise.all([
    prisma.invoice.findMany({ where: { companyId } }),
    prisma.booking.findMany({ where: { companyId } }),
    prisma.document.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const revenue = invoices.reduce((sum, i) => sum + i.amountGross, 0);
  const open = invoices
    .filter((i) => i.status === "Offen" || i.status === "Ueberfaellig")
    .reduce((sum, i) => sum + i.amountGross, 0);
  const expense = bookings
    .filter((b) => b.debitAccount.startsWith("3") || b.debitAccount.startsWith("4"))
    .reduce((sum, b) => sum + b.amount + b.taxAmount, 0);
  const profit = revenue - expense;

  const monthMap = new Map<string, { month: string; einnahmen: number; ausgaben: number }>();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("de-DE", { month: "short" });
    monthMap.set(key, { month: label, einnahmen: 0, ausgaben: 0 });
  }

  for (const inv of invoices) {
    const d = new Date(inv.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = monthMap.get(key);
    if (row) row.einnahmen += inv.amountGross;
  }
  for (const b of bookings) {
    const d = new Date(b.bookingDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = monthMap.get(key);
    if (row && (b.debitAccount.startsWith("3") || b.debitAccount.startsWith("4"))) {
      row.ausgaben += b.amount + b.taxAmount;
    }
  }

  const series = Array.from(monthMap.values()).map((r) => ({
    month: r.month,
    einnahmen: Number(r.einnahmen.toFixed(2)),
    ausgaben: Number(r.ausgaben.toFixed(2)),
  }));

  const activities = docs.map((d) => `${d.fileName} - Status ${d.status}`);

  res.json({
    stats: [
      { label: "Umsatz", value: `EUR ${revenue.toFixed(2)}`, trend: `${invoices.length} Rechnungen` },
      {
        label: "Offene Rechnungen",
        value: `EUR ${open.toFixed(2)}`,
        trend: `${invoices.filter((i) => i.status === "Offen" || i.status === "Ueberfaellig").length} offen`,
      },
      { label: "Ausgaben", value: `EUR ${expense.toFixed(2)}`, trend: `${bookings.length} Buchungen` },
      { label: "Gewinn/Verlust", value: `EUR ${profit.toFixed(2)}`, trend: profit >= 0 ? "positiv" : "negativ" },
    ],
    series,
    activities,
  });
});
