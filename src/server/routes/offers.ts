import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const offersRouter = Router();

offersRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.offer.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

offersRouter.post("/", requirePermissions("offers:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const created = await prisma.offer.create({
    data: {
      ...req.body,
      companyId,
      validUntil: new Date(req.body.validUntil),
    },
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
    const settings = await tx.companySettings.upsert({
      where: { companyId: offer.companyId },
      update: {},
      create: { companyId: offer.companyId, companyName: "" },
    });
    const next = settings.invoiceNextNumber || 101;
    const prefix = settings.invoicePrefix || "RE";
    const number = `${prefix}-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;

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
    await tx.companySettings.update({
      where: { companyId: offer.companyId },
      data: { invoiceNextNumber: next + 1 },
    });
    await tx.offer.update({ where: { id: offer.id }, data: { status: "Angenommen" } });
    return created;
  });

  res.status(201).json(invoice);
});

offersRouter.delete("/:id", requirePermissions("offers:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const removed = await prisma.offer.deleteMany({ where: { id: req.params.id, companyId } });
  if (removed.count === 0) return res.status(404).json({ error: "Offer not found" });
  res.status(204).send();
});
