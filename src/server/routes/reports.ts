import { Router } from "express";
import { getCompanyId, requirePermissions } from "../auth.js";
import { prisma } from "../db.js";

export const reportsRouter = Router();

reportsRouter.get("/advanced", requirePermissions("reports:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const [invoices, bookings, documents] = await Promise.all([
    prisma.invoice.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } }),
    prisma.booking.findMany({ where: { companyId }, orderBy: { bookingDate: "asc" } }),
    prisma.document.findMany({ where: { companyId } }),
  ]);

  const openItems = invoices
    .filter((i) => i.status === "Offen" || i.status === "Ueberfaellig")
    .map((i) => ({ id: i.id, number: i.number, customer: i.customer, amountGross: i.amountGross, dueDate: i.dueDate }));

  const monthMap = new Map<string, { label: string; income: number; expense: number }>();
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, {
      label: d.toLocaleString("de-DE", { month: "short", year: "2-digit" }),
      income: 0,
      expense: 0,
    });
  }

  for (const invoice of invoices) {
    const d = new Date(invoice.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = monthMap.get(key);
    if (row) row.income += invoice.amountGross;
  }

  for (const booking of bookings) {
    const d = new Date(booking.bookingDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = monthMap.get(key);
    if (row) row.expense += booking.amount + booking.taxAmount;
  }

  const cashflow = Array.from(monthMap.values()).map((m) => ({
    month: m.label,
    income: Number(m.income.toFixed(2)),
    expense: Number(m.expense.toFixed(2)),
    net: Number((m.income - m.expense).toFixed(2)),
  }));

  const categoryTotals = new Map<string, number>();
  for (const booking of bookings) {
    const key = booking.category || "Ohne Kategorie";
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + booking.amount + booking.taxAmount);
  }
  const topCategories = Array.from(categoryTotals.entries())
    .map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const missingDocuments = documents.filter(
    (d) => !d.partner || !d.accountNumber || !d.documentDate || !d.grossAmount || d.grossAmount <= 0,
  ).length;

  res.json({
    cashflow,
    topCategories,
    openItemsSummary: {
      count: openItems.length,
      amount: Number(openItems.reduce((sum, i) => sum + i.amountGross, 0).toFixed(2)),
      items: openItems.slice(0, 25),
    },
    documentCompleteness: {
      total: documents.length,
      missing: missingDocuments,
      complete: Math.max(0, documents.length - missingDocuments),
    },
  });
});
