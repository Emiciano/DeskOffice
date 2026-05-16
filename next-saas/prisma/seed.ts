import { PrismaClient, Role, SkrType, AccountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin1234!", 10);

  const user = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      email: "owner@example.com",
      name: "Owner",
      passwordHash
    }
  });

  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "Demo GmbH",
      skrType: SkrType.SKR03
    }
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: {},
    create: {
      userId: user.id,
      companyId: company.id,
      role: Role.OWNER
    }
  });

  const seedAccounts = [
    { number: "1000", name: "Kasse", type: AccountType.CASH, taxRate: 0, category: "Liquide Mittel" },
    { number: "1200", name: "Bank", type: AccountType.BANK, taxRate: 0, category: "Liquide Mittel" },
    { number: "4930", name: "Buerobedarf", type: AccountType.EXPENSE, taxRate: 19, category: "Verwaltung" },
    { number: "3400", name: "Wareneingang 19%", type: AccountType.EXPENSE, taxRate: 19, category: "Wareneinsatz" },
    { number: "8400", name: "Erloese 19%", type: AccountType.REVENUE, taxRate: 19, category: "Erloese" },
    { number: "1576", name: "Vorsteuer 19%", type: AccountType.TAX, taxRate: 19, category: "Steuer" },
    { number: "1776", name: "Umsatzsteuer 19%", type: AccountType.TAX, taxRate: 19, category: "Steuer" }
  ];

  for (const acc of seedAccounts) {
    await prisma.chartAccount.upsert({
      where: { companyId_number_skrType: { companyId: company.id, number: acc.number, skrType: SkrType.SKR03 } },
      update: {},
      create: {
        companyId: company.id,
        number: acc.number,
        name: acc.name,
        type: acc.type,
        skrType: SkrType.SKR03,
        taxRate: acc.taxRate,
        category: acc.category
      }
    });
  }
}

main().finally(async () => prisma.$disconnect());
