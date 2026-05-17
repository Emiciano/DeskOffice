import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requireRoles } from "../auth.js";

export const accountsRouter = Router();

accountsRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.account.findMany({ where: { companyId }, orderBy: { number: "asc" } });
  res.json(items);
});

accountsRouter.post("/", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const payload = {
    ...req.body,
    companyId,
    number: String(req.body.number ?? "").trim(),
    name: String(req.body.name ?? "").trim(),
    type: String(req.body.type ?? "").trim(),
    skrType: String(req.body.skrType ?? "").trim(),
    category: String(req.body.category ?? "").trim(),
    taxRate: Number(req.body.taxRate ?? 0),
    active: req.body.active !== false,
  };
  if (!payload.number || !payload.name || !payload.type || !payload.skrType) {
    return res.status(400).json({ error: "number, name, type and skrType required" });
  }
  const created = await prisma.account.create({ data: payload });
  res.status(201).json(created);
});

accountsRouter.patch("/:id", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const updated = await prisma.account.updateMany({
    where: { id: req.params.id, companyId },
    data: req.body,
  });
  if (updated.count === 0) return res.status(404).json({ error: "Account not found" });
  res.json({ ok: true });
});
