import { Router } from "express";
import { getCompanyId, requireRoles } from "../auth.js";
import { prisma } from "../db.js";

export const financeConfigRouter = Router();

financeConfigRouter.get("/period-locks", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const rows = await prisma.periodLock.findMany({ where: { companyId }, orderBy: [{ year: "desc" }, { month: "desc" }] });
  res.json(rows);
});

financeConfigRouter.put("/period-locks/:year/:month", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  const locked = Boolean(req.body.locked ?? true);
  const reason = req.body.reason == null ? null : String(req.body.reason);

  const row = await prisma.periodLock.upsert({
    where: { companyId_year_month: { companyId, year, month } },
    update: {
      locked,
      reason,
      lockedBy: req.auth?.userId ?? null,
      lockedAt: new Date(),
    },
    create: {
      companyId,
      year,
      month,
      locked,
      reason,
      lockedBy: req.auth?.userId ?? null,
      lockedAt: new Date(),
    },
  });
  res.json(row);
});

financeConfigRouter.get("/jobs", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const rows = await prisma.backgroundJob.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 200 });
  res.json(rows);
});

financeConfigRouter.post("/jobs", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const jobType = String(req.body.jobType ?? "").trim();
  if (!jobType) return res.status(400).json({ error: "jobType required" });
  const job = await prisma.backgroundJob.create({
    data: {
      companyId,
      jobType,
      payload: JSON.stringify(req.body.payload ?? {}),
      status: "pending",
      createdBy: req.auth?.userId ?? null,
    },
  });
  res.status(201).json(job);
});

financeConfigRouter.get("/bank-accounts", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const rows = await prisma.bankAccount.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(rows);
});

financeConfigRouter.post("/bank-accounts", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const body = req.body as { name?: string; iban?: string; bic?: string; bankName?: string };
  const created = await prisma.bankAccount.create({
    data: {
      companyId,
      name: String(body.name ?? "").trim() || "Hauptkonto",
      iban: String(body.iban ?? "").trim(),
      bic: String(body.bic ?? "").trim() || null,
      bankName: String(body.bankName ?? "").trim() || null,
      active: true,
    },
  });
  res.status(201).json(created);
});

financeConfigRouter.get("/cost-centers", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const rows = await prisma.costCenter.findMany({ where: { companyId }, orderBy: { code: "asc" } });
  res.json(rows);
});

financeConfigRouter.post("/cost-centers", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const body = req.body as { code?: string; name?: string };
  const code = String(body.code ?? "").trim().toUpperCase();
  const name = String(body.name ?? "").trim();
  if (!code || !name) return res.status(400).json({ error: "code and name required" });
  const created = await prisma.costCenter.create({
    data: { companyId, code, name, active: true },
  });
  res.status(201).json(created);
});
