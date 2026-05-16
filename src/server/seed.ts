import { prisma } from "./db.js";
import { chartOfAccountsSeed } from "../data/chartOfAccounts.js";

export async function ensureCompanySetup(companyId: string, companyName: string) {
  await prisma.company.upsert({
    where: { id: companyId },
    update: { name: companyName },
    create: { id: companyId, name: companyName },
  });

  const existingCount = await prisma.account.count({ where: { companyId } });
  if (existingCount === 0) {
    await prisma.account.createMany({
      data: chartOfAccountsSeed.map((a) => ({
        number: a.number,
        name: a.name,
        type: a.type,
        skrType: a.skrType,
        taxRate: a.taxRate,
        category: a.category,
        active: a.active,
        companyId,
      })),
    });
  }

  await prisma.companySettings.upsert({
    where: { companyId },
    update: {},
    create: {
      companyId,
      companyName,
      defaultTaxRate: 19,
      accountFrame: "SKR04",
      priceInputMode: "brutto",
      vatMode: "standard",
      profitMethod: "euer",
      country: "Deutschland",
    },
  });
}
