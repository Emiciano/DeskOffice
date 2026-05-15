import express from "express";
import cors from "cors";
import { accountsRouter } from "./routes/accounts.js";
import { bookingsRouter } from "./routes/bookings.js";
import { documentsRouter } from "./routes/documents.js";
import { APP_PORT, CORS_ORIGIN, DEFAULT_COMPANY_NAME } from "./config.js";
import { prisma } from "./db.js";
import { chartOfAccountsSeed } from "../data/chartOfAccounts.js";

async function ensureSeedData() {
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: { id: "default-company", name: DEFAULT_COMPANY_NAME },
  });

  const existingCount = await prisma.account.count({ where: { companyId: company.id } });
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
        companyId: company.id,
      })),
    });
  }
}

async function start() {
  await ensureSeedData();

  const app = express();
  app.use(cors({ origin: CORS_ORIGIN }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/bootstrap", async (_req, res) => {
    const company = await prisma.company.findFirst({ where: { id: "default-company" } });
    res.json({ companyId: company?.id ?? null });
  });
  app.use("/api/accounts", accountsRouter);
  app.use("/api/documents", documentsRouter);
  app.use("/api/bookings", bookingsRouter);

  app.listen(APP_PORT, () => {
    console.log(`API running on :${APP_PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
