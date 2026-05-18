import { prisma } from "../db.js";

export async function assertPeriodUnlocked(companyId: string, dateValue: Date, entityLabel: string) {
  const year = dateValue.getFullYear();
  const month = dateValue.getMonth() + 1;
  const lock = await prisma.periodLock.findUnique({
    where: { companyId_year_month: { companyId, year, month } },
  });
  if (lock?.locked) {
    throw new Error(`PERIOD_LOCKED:${entityLabel}:${year}-${String(month).padStart(2, "0")}`);
  }
}

