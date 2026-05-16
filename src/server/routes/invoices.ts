import { Router } from "express";
import { prisma } from "../db.js";

export const invoicesRouter = Router();

invoicesRouter.get("/", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.invoice.findMany({
    where: { companyId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

invoicesRouter.get("/open-items", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const items = await prisma.invoice.findMany({
    where: {
      companyId,
      status: { in: ["Offen", "Ueberfaellig"] },
    },
    orderBy: { dueDate: "asc" },
  });
  const totalGross = Number(items.reduce((sum, item) => sum + item.amountGross, 0).toFixed(2));
  res.json({ count: items.length, totalGross, items });
});

invoicesRouter.post("/", async (req, res) => {
  const { items = [], ...raw } = req.body as {
    companyId: string;
    number: string;
    customer: string;
    dueDate: string;
    status: string;
    kind?: string;
    items?: Array<{ description: string; quantity: number; unitPrice: number; taxRate: number }>;
  };

  const normalizedItems = items.map((item) => {
    const amountNet = Number((item.quantity * item.unitPrice).toFixed(2));
    const amountTax = Number(((amountNet * item.taxRate) / 100).toFixed(2));
    const amountGross = Number((amountNet + amountTax).toFixed(2));
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      amountNet,
      amountTax,
      amountGross,
    };
  });

  const amountNet = Number(normalizedItems.reduce((sum, i) => sum + i.amountNet, 0).toFixed(2));
  const amountTax = Number(normalizedItems.reduce((sum, i) => sum + i.amountTax, 0).toFixed(2));
  const amountGross = Number(normalizedItems.reduce((sum, i) => sum + i.amountGross, 0).toFixed(2));

  const created = await prisma.invoice.create({
    data: {
      companyId: raw.companyId,
      number: raw.number,
      customer: raw.customer,
      status: raw.status,
      kind: raw.kind ?? "Rechnung",
      amountNet,
      amountTax,
      amountGross,
      dueDate: new Date(raw.dueDate),
      items: {
        create: normalizedItems,
      },
    },
    include: { items: true },
  });
  res.status(201).json(created);
});

invoicesRouter.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const allowed = new Set(["Entwurf", "Offen", "Bezahlt", "Ueberfaellig", "Storniert", "Versendet"]);
  if (!allowed.has(status)) {
    return res.status(400).json({ error: "invalid status" });
  }
  const updated = await prisma.invoice.update({ where: { id }, data: { status } });
  res.json(updated);
});

invoicesRouter.post("/:id/reminder", async (req, res) => {
  const { id } = req.params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  if (invoice.status === "Bezahlt" || invoice.status === "Storniert") {
    return res.status(400).json({ error: "Reminder not allowed for this status" });
  }
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "Ueberfaellig" },
  });
  res.json({
    ok: true,
    invoice: updated,
    message: `Mahnung fuer ${invoice.number} vorgemerkt`,
  });
});

invoicesRouter.post("/:id/recurring-next", async (req, res) => {
  const { id } = req.params;
  const source = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!source) return res.status(404).json({ error: "Invoice not found" });

  const nextDueDate = new Date(source.dueDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  const invoiceCount = await prisma.invoice.count({ where: { companyId: source.companyId } });
  const number = `RE-${new Date().getFullYear()}-${String(invoiceCount + 101).padStart(4, "0")}`;

  const created = await prisma.invoice.create({
    data: {
      companyId: source.companyId,
      number,
      customer: source.customer,
      status: "Entwurf",
      kind: "Wiederkehrend",
      amountNet: source.amountNet,
      amountTax: source.amountTax,
      amountGross: source.amountGross,
      dueDate: nextDueDate,
      items: {
        create: source.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          amountNet: item.amountNet,
          amountTax: item.amountTax,
          amountGross: item.amountGross,
        })),
      },
    },
    include: { items: true },
  });
  res.status(201).json(created);
});
