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
  const fileName = String(req.body.fileName ?? "").trim();
  const status = String(req.body.status ?? "Entwurf").trim();
  const partner = req.body.partner ? String(req.body.partner).trim() : null;
  const category = req.body.category ? String(req.body.category).trim() : null;
  const accountNumber = req.body.accountNumber ? String(req.body.accountNumber).trim() : null;
  const grossAmount = Number(req.body.grossAmount ?? 0);
  const taxAmount = Number(req.body.taxAmount ?? 0);
  const netAmount = Number(req.body.netAmount ?? 0);

  if (!fileName) return res.status(400).json({ error: "fileName required" });
  if (Number.isNaN(grossAmount) || Number.isNaN(taxAmount) || Number.isNaN(netAmount)) {
    return res.status(400).json({ error: "amount fields must be numbers" });
  }

  const created = await prisma.document.create({
    data: {
      companyId,
      fileName,
      status,
      partner,
      category,
      accountNumber,
      grossAmount,
      taxAmount,
      netAmount,
      documentDate: req.body.documentDate ? new Date(String(req.body.documentDate)) : null,
      dueDate: req.body.dueDate ? new Date(String(req.body.dueDate)) : null,
    },
  });
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
