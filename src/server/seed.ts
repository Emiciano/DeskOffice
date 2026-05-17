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

  const productCount = await prisma.product.count({ where: { companyId } });
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          companyId,
          name: "SEO Audit",
          type: "Leistung",
          unitPrice: 590,
          taxRate: 19,
          description: "Initiale Analyse und Maßnahmenplan",
        },
        {
          companyId,
          name: "Support Retainer",
          type: "Leistung",
          unitPrice: 1200,
          taxRate: 19,
          description: "Monatliche Betreuung",
        },
        {
          companyId,
          name: "Laptop Dock",
          type: "Produkt",
          unitPrice: 189,
          taxRate: 19,
          description: "Hardware für Homeoffice",
        },
      ],
    });
  }
}
