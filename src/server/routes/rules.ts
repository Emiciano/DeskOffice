import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const rulesRouter = Router();

rulesRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.rule.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

rulesRouter.post("/", requirePermissions("rules:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const name = String(req.body.name ?? "").trim();
  const pattern = String(req.body.pattern ?? "").trim();
  const accountNumber = req.body.accountNumber ? String(req.body.accountNumber).trim() : null;
  const category = req.body.category ? String(req.body.category).trim() : null;
  const confidence = Number(req.body.confidence ?? 0.9);
  const active = req.body.active !== false;
  if (!name || !pattern) return res.status(400).json({ error: "name and pattern required" });
  if (Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
    return res.status(400).json({ error: "confidence must be between 0 and 1" });
  }
  const created = await prisma.rule.create({
    data: { companyId, name, pattern, accountNumber, category, confidence, active },
  });
  res.status(201).json(created);
});

rulesRouter.patch("/:id", requirePermissions("rules:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const patch: Record<string, unknown> = {};
  if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
  if (req.body.pattern !== undefined) patch.pattern = String(req.body.pattern).trim();
  if (req.body.accountNumber !== undefined) patch.accountNumber = req.body.accountNumber ? String(req.body.accountNumber).trim() : null;
  if (req.body.category !== undefined) patch.category = req.body.category ? String(req.body.category).trim() : null;
  if (req.body.active !== undefined) patch.active = Boolean(req.body.active);
  if (req.body.confidence !== undefined) {
    const confidence = Number(req.body.confidence);
    if (Number.isNaN(confidence) || confidence < 0 || confidence > 1) {
      return res.status(400).json({ error: "confidence must be between 0 and 1" });
    }
    patch.confidence = confidence;
  }
  const updated = await prisma.rule.updateMany({ where: { id, companyId }, data: patch });
  if (updated.count === 0) return res.status(404).json({ error: "Rule not found" });
  res.json({ ok: true });
});

rulesRouter.delete("/:id", requirePermissions("rules:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const removed = await prisma.rule.deleteMany({ where: { id, companyId } });
  if (removed.count === 0) return res.status(404).json({ error: "Rule not found" });
  res.status(204).send();
});
