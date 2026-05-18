import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const documentsRouter = Router();

documentsRouter.get("/", requirePermissions("documents:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.document.findMany({
    where: { companyId },
    include: { files: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    items.map((item) => ({
      ...item,
      pdfUrl: item.files[0]?.storageKey ?? "",
      fileSize: item.files[0]?.sizeBytes ?? 0,
    })),
  );
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

  const fileDataUrl = req.body.fileDataUrl ? String(req.body.fileDataUrl) : "";
  const created = await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
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
    if (fileDataUrl) {
      await tx.documentFile.create({
        data: {
          companyId,
          documentId: document.id,
          storageKey: fileDataUrl,
          fileName,
          mimeType: "application/pdf",
          sizeBytes: Number(req.body.fileSize ?? 0) || 0,
          source: "upload",
        },
      });
    }
    return document;
  });
  res.status(201).json(created);
});

documentsRouter.patch("/:id", requirePermissions("documents:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const payload = req.body as Record<string, unknown>;
  const fileDataUrl = payload.fileDataUrl ? String(payload.fileDataUrl) : "";
  const fileName = payload.fileName ? String(payload.fileName) : "";
  const fileSize = Number(payload.fileSize ?? 0) || 0;
  const { fileDataUrl: _f, ...data } = payload;
  const updated = await prisma.document.updateMany({ where: { id: req.params.id, companyId }, data });
  if (updated.count === 0) return res.status(404).json({ error: "Document not found" });
  if (fileDataUrl) {
    await prisma.documentFile.create({
      data: {
        companyId,
        documentId: req.params.id,
        storageKey: fileDataUrl,
        fileName: fileName || "beleg.pdf",
        mimeType: "application/pdf",
        sizeBytes: fileSize,
        source: "upload",
      },
    });
  }
  res.json({ ok: true });
});

documentsRouter.delete("/:id", requirePermissions("documents:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const removed = await prisma.document.deleteMany({ where: { id: req.params.id, companyId } });
  if (removed.count === 0) return res.status(404).json({ error: "Document not found" });
  res.status(204).send();
});
