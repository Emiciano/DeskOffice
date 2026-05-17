import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId } from "../auth.js";

export const taxesRouter = Router();

async function loadOrCreateSnapshot(companyId: string, year: number, month: number) {
  const existing = await prisma.taxSnapshot.findUnique({
    where: { companyId_year_month: { companyId, year, month } },
  });
  if (existing) return existing;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const bookings = await prisma.booking.findMany({
    where: {
      companyId,
      bookingDate: { gte: monthStart, lt: monthEnd },
    },
  });

  const vatOutput19 = bookings
    .filter((b) => b.creditAccount.startsWith("84"))
    .reduce((sum, b) => sum + b.taxAmount, 0);
  const vatInput = bookings
    .filter((b) => b.debitAccount.startsWith("3") || b.debitAccount.startsWith("4"))
    .reduce((sum, b) => sum + b.taxAmount, 0);
  const euerRevenue = bookings
    .filter((b) => b.creditAccount.startsWith("8"))
    .reduce((sum, b) => sum + b.amount, 0);
  const euerExpense = bookings
    .filter((b) => b.debitAccount.startsWith("3") || b.debitAccount.startsWith("4"))
    .reduce((sum, b) => sum + b.amount, 0);

  return prisma.taxSnapshot.create({
    data: {
      companyId,
      year,
      month,
      periodLabel: `${year}-${String(month).padStart(2, "0")}`,
      vatOutput19,
      vatInput,
      vatLiability: vatOutput19 - vatInput,
      euerRevenue,
      euerExpense,
    },
  });
}

taxesRouter.get("/snapshot", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const year = Number(req.query.year ?? new Date().getFullYear());
  const month = Number(req.query.month ?? new Date().getMonth() + 1);
  const snapshot = await loadOrCreateSnapshot(companyId, year, month);
  res.json(snapshot);
});

taxesRouter.get("/overview", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const year = Number(req.query.year ?? new Date().getFullYear());
  const snapshots = await Promise.all(
    Array.from({ length: 12 }, (_, i) => i + 1).map((month) => loadOrCreateSnapshot(companyId, year, month)),
  );

  const months = snapshots.map((s) => ({
    month: s.month,
    periodLabel: s.periodLabel,
    vatLiability: Number(s.vatLiability.toFixed(2)),
    euerRevenue: Number(s.euerRevenue.toFixed(2)),
    euerExpense: Number(s.euerExpense.toFixed(2)),
  }));

  const totals = months.reduce(
    (acc, m) => {
      acc.vatLiability += m.vatLiability;
      acc.euerRevenue += m.euerRevenue;
      acc.euerExpense += m.euerExpense;
      return acc;
    },
    { vatLiability: 0, euerRevenue: 0, euerExpense: 0 },
  );

  res.json({
    year,
    totals: {
      vatLiability: Number(totals.vatLiability.toFixed(2)),
      euerRevenue: Number(totals.euerRevenue.toFixed(2)),
      euerExpense: Number(totals.euerExpense.toFixed(2)),
      euerProfit: Number((totals.euerRevenue - totals.euerExpense).toFixed(2)),
    },
    months,
  });
});

taxesRouter.get("/forecast", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const year = Number(req.query.year ?? new Date().getFullYear());
  const currentMonth = new Date().getMonth() + 1;
  const doneMonths = Math.max(1, Math.min(12, currentMonth));

  const snapshots = await Promise.all(
    Array.from({ length: doneMonths }, (_, i) => i + 1).map((month) => loadOrCreateSnapshot(companyId, year, month)),
  );

  const sumVat = snapshots.reduce((s, x) => s + x.vatLiability, 0);
  const sumRevenue = snapshots.reduce((s, x) => s + x.euerRevenue, 0);
  const sumExpense = snapshots.reduce((s, x) => s + x.euerExpense, 0);
  const factor = 12 / doneMonths;

  res.json({
    year,
    basedOnMonths: doneMonths,
    forecast: {
      vatLiability: Number((sumVat * factor).toFixed(2)),
      euerRevenue: Number((sumRevenue * factor).toFixed(2)),
      euerExpense: Number((sumExpense * factor).toFixed(2)),
      euerProfit: Number(((sumRevenue - sumExpense) * factor).toFixed(2)),
    },
  });
});
