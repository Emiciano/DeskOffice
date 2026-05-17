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

  const existingRoles = await prisma.role.count({ where: { companyId } });
  if (existingRoles === 0) {
    await prisma.role.createMany({
      data: [
        {
          companyId,
          code: "owner",
          label: "Owner",
          permissions: JSON.stringify(["*"]),
          system: true,
        },
        {
          companyId,
          code: "admin",
          label: "Admin",
          permissions: JSON.stringify([
            "accounts:read",
            "accounts:write",
            "banking:read",
            "banking:write",
            "bookings:read",
            "bookings:write",
            "contacts:read",
            "contacts:write",
            "documents:read",
            "documents:write",
            "invoices:read",
            "invoices:write",
            "offers:read",
            "offers:write",
            "products:read",
            "products:write",
            "exports:read",
            "exports:write",
            "reports:read",
            "settings:write",
            "copilot:read",
          ]),
          system: true,
        },
        {
          companyId,
          code: "employee",
          label: "Mitarbeiter",
          permissions: JSON.stringify([
            "accounts:read",
            "banking:read",
            "bookings:read",
            "contacts:read",
            "documents:read",
            "documents:write",
            "invoices:read",
            "offers:read",
            "products:read",
            "reports:read",
            "copilot:read",
          ]),
          system: true,
        },
        {
          companyId,
          code: "tax_advisor",
          label: "Steuerberater",
          permissions: JSON.stringify([
            "accounts:read",
            "bookings:read",
            "contacts:read",
            "documents:read",
            "exports:read",
            "invoices:read",
            "reports:read",
          ]),
          system: true,
        },
      ],
    });
  }

  const subCount = await prisma.subscription.count({ where: { companyId } });
  if (subCount === 0) {
    await prisma.subscription.create({
      data: {
        companyId,
        planCode: "starter",
        status: "active",
        seats: 3,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });
  }
}

