import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const documentsRouter = Router();

documentsRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.document.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

documentsRouter.post("/", requirePermissions("documents:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const created = await prisma.document.create({ data: { ...req.body, companyId } });
  res.status(201).json(created);
});

documentsRouter.patch("/:id", requirePermissions("documents:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const updated = await prisma.document.updateMany({ where: { id: req.params.id, companyId }, data: req.body });
  if (updated.count === 0) return res.status(404).json({ error: "Document not found" });
  res.json({ ok: true });
});

documentsRouter.delete("/:id", requirePermissions("documents:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const removed = await prisma.document.deleteMany({ where: { id: req.params.id, companyId } });
  if (removed.count === 0) return res.status(404).json({ error: "Document not found" });
  res.status(204).send();
});
