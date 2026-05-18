import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";
import { nextSequenceNumber } from "../services/numbering.js";
import { writeEntityAuditLog } from "../audit.js";

export const offersRouter = Router();

offersRouter.get("/", requirePermissions("offers:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.offer.findMany({ where: { companyId, deletedAt: null }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

offersRouter.post("/", requirePermissions("offers:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const body = req.body as Record<string, unknown>;
  const created = await prisma.offer.create({
    data: {
      companyId,
      customer: String(body.customer ?? "").trim(),
      amountNet: Number(body.amountNet ?? 0) || 0,
      amountTax: Number(body.amountTax ?? 0) || 0,
      amountGross: Number(body.amountGross ?? 0) || 0,
      status: String(body.status ?? "Entwurf"),
      number: String(body.number ?? "") || await nextSequenceNumber(companyId, "offer"),
      validUntil: new Date(String(body.validUntil)),
    },
  });
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "CREATE",
    entityType: "offer",
    entityId: created.id,
    newValue: created,
  });
  res.status(201).json(created);
});

offersRouter.post("/:id/convert", requirePermissions("offers:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const offer = await prisma.offer.findFirst({ where: { id, companyId } });
  if (!offer) return res.status(404).json({ error: "Offer not found" });

  const invoice = await prisma.$transaction(async (tx) => {
    const number = await nextSequenceNumber(offer.companyId, "invoice");

    const created = await tx.invoice.create({
      data: {
        number,
        customer: offer.customer,
        amountNet: offer.amountNet,
        amountTax: offer.amountTax,
        amountGross: offer.amountGross,
        dueDate: new Date(),
        status: "Offen",
        kind: "Rechnung",
        sourceOfferId: offer.id,
        companyId: offer.companyId,
      },
    });
    await tx.offer.update({ where: { id: offer.id }, data: { status: "Angenommen" } });
    return created;
  });

  res.status(201).json(invoice);
});

offersRouter.delete("/:id", requirePermissions("offers:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const prev = await prisma.offer.findFirst({ where: { id: req.params.id, companyId, deletedAt: null } });
  if (!prev) return res.status(404).json({ error: "Offer not found" });
  const removed = await prisma.offer.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), deletedBy: req.auth?.userId ?? null },
  });
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "SOFT_DELETE",
    entityType: "offer",
    entityId: req.params.id,
    oldValue: prev,
    newValue: removed,
  });
  res.status(204).send();
});
