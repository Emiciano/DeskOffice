import { Router } from "express";
import { getCompanyId, requireRoles } from "../auth.js";
import { prisma } from "../db.js";

export const financeConfigRouter = Router();

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
