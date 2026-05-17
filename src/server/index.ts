import express from "express";
import cors from "cors";
import { attachAuth, requireAuth } from "./auth.js";
import { accountsRouter } from "./routes/accounts.js";
import { bookingsRouter } from "./routes/bookings.js";
import { documentsRouter } from "./routes/documents.js";
import { invoicesRouter } from "./routes/invoices.js";
import { offersRouter } from "./routes/offers.js";
import { bankingRouter } from "./routes/banking.js";
import { rulesRouter } from "./routes/rules.js";
import { taxesRouter } from "./routes/taxes.js";
import { settingsRouter } from "./routes/settings.js";
import { contactsRouter } from "./routes/contacts.js";
import { exportsRouter } from "./routes/exports.js";
import { inboxRouter } from "./routes/inbox.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { copilotRouter } from "./routes/copilot.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { eInvoicesRouter } from "./routes/einvoices.js";
import { advisorsRouter } from "./routes/advisors.js";
import { reportsRouter } from "./routes/reports.js";
import { adminRouter } from "./routes/admin.js";
import { financeConfigRouter } from "./routes/finance-config.js";
import { APP_PORT, CORS_ORIGIN, DEFAULT_COMPANY_NAME } from "./config.js";
import { prisma } from "./db.js";
import { ensureCompanySetup } from "./seed.js";
import { isWriteMethod, writeAuditLog } from "./audit.js";

async function ensureSeedData() {
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: { id: "default-company", name: DEFAULT_COMPANY_NAME },
  });

  await ensureCompanySetup(company.id, company.name);

  const contactsCount = await prisma.contact.count({ where: { companyId: company.id } });
  if (contactsCount === 0) {
    await prisma.contact.createMany({
      data: [
        {
          companyId: company.id,
          type: "customer",
          name: "Nordlicht Media GmbH",
          email: "office@nordlicht.io",
          phone: "+49 30 9011450",
          paymentTerms: 14,
          country: "Deutschland",
        },
        {
          companyId: company.id,
          type: "supplier",
          name: "CloudStack GmbH",
          email: "finance@cloudstack.de",
          phone: "+49 40 771234",
          paymentTerms: 14,
          country: "Deutschland",
        },
      ],
    });
  }
}

async function start() {
  await ensureSeedData();

  const app = express();
  app.use(cors({ origin: CORS_ORIGIN }));
  app.use(express.json());
  app.use(attachAuth);
  app.use((req, res, next) => {
    if (isWriteMethod(req.method) && req.path.startsWith("/api/")) {
      res.on("finish", () => {
        void writeAuditLog(req, res.statusCode).catch(() => undefined);
      });
    }
    next();
  });

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);
  app.get("/api/bootstrap", requireAuth, async (req, res) => {
    res.json({ companyId: req.auth?.companyId ?? null, user: req.auth ?? null });
  });
  app.use("/api", requireAuth);
  app.use("/api/accounts", accountsRouter);
  app.use("/api/documents", documentsRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/invoices", invoicesRouter);
  app.use("/api/offers", offersRouter);
  app.use("/api/banking", bankingRouter);
  app.use("/api/rules", rulesRouter);
  app.use("/api/taxes", taxesRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/contacts", contactsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/einvoices", eInvoicesRouter);
  app.use("/api/exports", exportsRouter);
  app.use("/api/inbox", inboxRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/copilot", copilotRouter);
  app.use("/api/advisors", advisorsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/finance-config", financeConfigRouter);

  app.listen(APP_PORT, () => {
    console.log(`API running on :${APP_PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
