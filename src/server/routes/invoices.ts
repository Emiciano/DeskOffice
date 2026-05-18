import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";
import { assertPeriodUnlocked } from "../services/period-lock.js";
import { nextSequenceNumber } from "../services/numbering.js";
import { writeEntityAuditLog } from "../audit.js";

export const invoicesRouter = Router();

invoicesRouter.get("/next-number", requirePermissions("invoices:read"), async (req, res) => {
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

invoicesRouter.get("/", requirePermissions("invoices:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.invoice.findMany({
    where: { companyId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

invoicesRouter.get("/open-items", requirePermissions("invoices:read"), async (req, res) => {
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

  const normalizedItems = items.map((item: { description: string; quantity: number; unitPrice: number; taxRate: number; taxMode?: string; taxKey?: string; reverseCharge?: boolean; euSupply?: boolean; smallBusiness?: boolean; }) => {
    const amountNet = Number((item.quantity * item.unitPrice).toFixed(2));
    const taxMode = String(item.taxMode ?? "standard");
    const rate = Number(item.taxRate ?? 0);
    const amountTax = ["taxfree", "reverseCharge", "smallBusiness"].includes(taxMode)
      ? 0
      : Number(((amountNet * rate) / 100).toFixed(2));
    const amountGross = Number((amountNet + amountTax).toFixed(2));
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: rate,
      taxMode,
      taxKey: item.taxKey ?? null,
      reverseCharge: Boolean(item.reverseCharge ?? false),
      euSupply: Boolean(item.euSupply ?? false),
      smallBusiness: Boolean(item.smallBusiness ?? false),
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

    const autoNumber = await nextSequenceNumber(companyId, "invoice");
    const finalNumber = raw.number && raw.number.trim() ? raw.number.trim() : autoNumber;
    const dueDate = new Date(raw.dueDate);
    await assertPeriodUnlocked(companyId, dueDate, "invoice:create");

    const invoice = await tx.invoice.create({
      data: {
        companyId,
        number: finalNumber,
        customer: raw.customer,
        status: raw.status,
        kind: raw.kind ?? "Rechnung",
        taxMode: String((req.body as Record<string, unknown>).taxMode ?? "standard"),
        amountNet,
        amountTax,
        amountGross,
        dueDate,
        items: {
          create: normalizedItems,
        },
      },
      include: { items: true },
    });

    return invoice;
  });
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "CREATE",
    entityType: "invoice",
    entityId: created.id,
    newValue: created,
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
  const prev = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!prev) return res.status(404).json({ error: "Invoice not found" });
  await assertPeriodUnlocked(companyId, prev.dueDate, "invoice:update-status");
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status,
      finalizedAt: status === "Versendet" || status === "Bezahlt" ? (prev.finalizedAt ?? new Date()) : prev.finalizedAt,
    },
  });
  if ((status === "Versendet" || status === "Bezahlt") && req.body.pdfData) {
    const latest = await prisma.invoiceSnapshot.findFirst({
      where: { invoiceId: id },
      orderBy: { version: "desc" },
    });
    await prisma.invoiceSnapshot.create({
      data: {
        companyId,
        invoiceId: id,
        version: (latest?.version ?? 0) + 1,
        pdfData: String(req.body.pdfData),
        hash: `${id}-${Date.now()}`,
      },
    });
  }
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "UPDATE_STATUS",
    entityType: "invoice",
    entityId: id,
    oldValue: prev,
    newValue: updated,
  });
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

  const number = await nextSequenceNumber(companyId, "invoice");

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
          taxMode: item.taxMode,
          taxKey: item.taxKey,
          reverseCharge: item.reverseCharge,
          euSupply: item.euSupply,
          smallBusiness: item.smallBusiness,
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

invoicesRouter.post("/:id/cancel", requirePermissions("invoices:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const reason = String(req.body.reason ?? "Storno");

  const prev = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!prev) return res.status(404).json({ error: "Invoice not found" });
  await assertPeriodUnlocked(companyId, prev.dueDate, "invoice:cancel");

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: "Storniert",
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "CANCEL",
    entityType: "invoice",
    entityId: id,
    oldValue: prev,
    newValue: updated,
    metadata: { reason },
  });
  res.json(updated);
});

invoicesRouter.delete("/:id", requirePermissions("invoices:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const prev = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!prev) return res.status(404).json({ error: "Invoice not found" });
  const updated = await prisma.invoice.update({
    where: { id },
    data: { deletedAt: new Date(), deletedBy: req.auth?.userId ?? null },
  });
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "SOFT_DELETE",
    entityType: "invoice",
    entityId: id,
    oldValue: prev,
    newValue: updated,
  });
  res.status(204).send();
});
