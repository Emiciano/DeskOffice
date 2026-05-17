import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const invoicesRouter = Router();

invoicesRouter.get("/next-number", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const settings = await prisma.companySettings.upsert({
    where: { companyId },
    update: {},
    create: { companyId, companyName: "" },
  });
  const year = new Date().getFullYear();
  const prefix = settings.invoicePrefix || "RE";
  const next = settings.invoiceNextNumber || 101;
  const number = `${prefix}-${year}-${String(next).padStart(4, "0")}`;
  res.json({ number, prefix, next });
});

invoicesRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.invoice.findMany({
    where: { companyId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

invoicesRouter.get("/open-items", async (req, res) => {
  const companyId = getCompanyId(req);
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

invoicesRouter.post("/", requirePermissions("invoices:write"), async (req, res) => {
  const { items = [], ...raw } = req.body as {
    companyId: string;
    number?: string;
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

  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const created = await prisma.$transaction(async (tx) => {
    const settings = await tx.companySettings.upsert({
      where: { companyId },
      update: {},
      create: { companyId, companyName: "" },
    });

    const next = settings.invoiceNextNumber || 101;
    const prefix = settings.invoicePrefix || "RE";
    const autoNumber = `${prefix}-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
    const finalNumber = raw.number && raw.number.trim() ? raw.number.trim() : autoNumber;

    const invoice = await tx.invoice.create({
      data: {
        companyId,
        number: finalNumber,
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

    await tx.companySettings.update({
      where: { companyId },
      data: { invoiceNextNumber: next + 1 },
    });

    return invoice;
  });
  res.status(201).json(created);
});

invoicesRouter.patch("/:id/status", requirePermissions("invoices:write"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const allowed = new Set(["Entwurf", "Offen", "Bezahlt", "Ueberfaellig", "Storniert", "Versendet"]);
  if (!allowed.has(status)) {
    return res.status(400).json({ error: "invalid status" });
  }
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const updated = await prisma.invoice.updateMany({ where: { id, companyId }, data: { status } });
  if (updated.count === 0) return res.status(404).json({ error: "Invoice not found" });
  res.json({ ok: true });
});

invoicesRouter.post("/:id/reminder", requirePermissions("invoices:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  if (invoice.status === "Bezahlt" || invoice.status === "Storniert") {
    return res.status(400).json({ error: "Reminder not allowed for this status" });
  }
  await prisma.invoice.updateMany({
    where: { id, companyId },
    data: { status: "Ueberfaellig" },
  });
  res.json({
    ok: true,
    message: `Mahnung fuer ${invoice.number} vorgemerkt`,
  });
});

invoicesRouter.post("/:id/recurring-next", requirePermissions("invoices:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const source = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!source || source.companyId !== companyId) return res.status(404).json({ error: "Invoice not found" });

  const nextDueDate = new Date(source.dueDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  const settings = await prisma.companySettings.upsert({
    where: { companyId },
    update: {},
    create: { companyId, companyName: "" },
  });
  const next = settings.invoiceNextNumber || 101;
  const prefix = settings.invoicePrefix || "RE";
  const number = `${prefix}-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;

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
  await prisma.companySettings.update({
    where: { companyId },
    data: { invoiceNextNumber: next + 1 },
  });
  res.status(201).json(created);
});
