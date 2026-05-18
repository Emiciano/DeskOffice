import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";
import { nextSequenceNumber } from "../services/numbering.js";
import { writeEntityAuditLog } from "../audit.js";

export const documentsRouter = Router();

documentsRouter.get("/", requirePermissions("documents:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.document.findMany({
    where: { companyId, deletedAt: null },
    include: { files: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    items.map((item) => ({
      ...item,
      pdfUrl: item.files[0]?.id ? `/api/documents/${item.id}/files/${item.files[0].id}/access` : "",
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
  const externalNumber = req.body.externalNumber ? String(req.body.externalNumber).trim() : await nextSequenceNumber(companyId, "document");
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
        fileName: `${externalNumber}__${fileName}`,
        partner,
        category,
        accountNumber,
        grossAmount,
        taxAmount,
        netAmount,
        status,
        taxRate: req.body.taxRate == null ? null : Number(req.body.taxRate),
        taxMode: req.body.taxMode ? String(req.body.taxMode) : "standard",
        taxKey: req.body.taxKey ? String(req.body.taxKey) : null,
        reverseCharge: Boolean(req.body.reverseCharge ?? false),
        euSupply: Boolean(req.body.euSupply ?? false),
        smallBusiness: Boolean(req.body.smallBusiness ?? false),
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
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "CREATE",
    entityType: "document",
    entityId: created.id,
    newValue: created,
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
  const prev = await prisma.document.findFirst({ where: { id: req.params.id, companyId, deletedAt: null } });
  if (!prev) return res.status(404).json({ error: "Document not found" });
  const updated = await prisma.document.update({ where: { id: req.params.id }, data });
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
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "UPDATE",
    entityType: "document",
    entityId: req.params.id,
    oldValue: prev,
    newValue: updated,
  });
  res.json({ ok: true });
});

documentsRouter.delete("/:id", requirePermissions("documents:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const prev = await prisma.document.findFirst({ where: { id: req.params.id, companyId, deletedAt: null } });
  if (!prev) return res.status(404).json({ error: "Document not found" });
  const removed = await prisma.document.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), deletedBy: req.auth?.userId ?? null },
  });
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "SOFT_DELETE",
    entityType: "document",
    entityId: req.params.id,
    oldValue: prev,
    newValue: removed,
  });
  res.status(204).send();
});

documentsRouter.get("/:id/files/:fileId/access", requirePermissions("documents:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id, fileId } = req.params;
  const file = await prisma.documentFile.findFirst({
    where: {
      id: fileId,
      companyId,
      documentId: id,
      document: { deletedAt: null },
    },
  });
  if (!file) return res.status(404).json({ error: "File not found" });
  // Placeholder for signed-url flow. For now we stream stored dataUrl only after auth + company check.
  res.json({ token: `${file.id}.${Date.now()}`, mimeType: file.mimeType, dataUrl: file.storageKey });
});
