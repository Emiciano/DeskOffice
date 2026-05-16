import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId } from "../auth.js";

export const taxesRouter = Router();

taxesRouter.get("/snapshot", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const year = Number(req.query.year ?? new Date().getFullYear());
  const month = Number(req.query.month ?? new Date().getMonth() + 1);

  const snapshot = await prisma.taxSnapshot.findUnique({
    where: { companyId_year_month: { companyId, year, month } },
  });

  if (snapshot) return res.json(snapshot);

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

  const created = await prisma.taxSnapshot.create({
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

  res.json(created);
});
