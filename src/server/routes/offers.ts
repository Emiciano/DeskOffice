import { Router } from "express";
import { prisma } from "../db.js";

export const offersRouter = Router();

offersRouter.get("/", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.offer.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

offersRouter.post("/", async (req, res) => {
  const created = await prisma.offer.create({
    data: {
      ...req.body,
      validUntil: new Date(req.body.validUntil),
    },
  });
  res.status(201).json(created);
});

offersRouter.post("/:id/convert", async (req, res) => {
  const { id } = req.params;
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return res.status(404).json({ error: "Offer not found" });

  const invoiceCount = await prisma.invoice.count({ where: { companyId: offer.companyId } });
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        number: `RE-${new Date().getFullYear()}-${(invoiceCount + 101).toString().padStart(4, "0")}`,
        customer: offer.customer,
        amountNet: offer.amountNet,
        amountTax: offer.amountTax,
        amountGross: offer.amountGross,
        dueDate: new Date(),
        status: "Offen",
        sourceOfferId: offer.id,
        companyId: offer.companyId,
      },
    });
    await tx.offer.update({ where: { id: offer.id }, data: { status: "Angenommen" } });
    return created;
  });

  res.status(201).json(invoice);
});
