import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requireRoles } from "../auth.js";

export const rulesRouter = Router();

rulesRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.rule.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

rulesRouter.post("/", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const created = await prisma.rule.create({ data: { ...req.body, companyId } });
  res.status(201).json(created);
});

rulesRouter.patch("/:id", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const updated = await prisma.rule.updateMany({ where: { id, companyId }, data: req.body });
  if (updated.count === 0) return res.status(404).json({ error: "Rule not found" });
  res.json({ ok: true });
});

rulesRouter.delete("/:id", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const removed = await prisma.rule.deleteMany({ where: { id, companyId } });
  if (removed.count === 0) return res.status(404).json({ error: "Rule not found" });
  res.status(204).send();
});
