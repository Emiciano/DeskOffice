import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId } from "../auth.js";

export const contactsRouter = Router();

contactsRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  const type = String(req.query.type ?? "all");
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const contacts = await prisma.contact.findMany({
    where: {
      companyId,
      ...(type === "all" ? {} : { type }),
    },
    orderBy: { name: "asc" },
  });

  const invoices = await prisma.invoice.findMany({
    where: { companyId },
    select: { customer: true, amountGross: true, status: true },
  });

  const rows = contacts.map((contact) => {
    const related = invoices.filter((inv) => inv.customer.toLowerCase() === contact.name.toLowerCase());
    const revenue = related.reduce((sum, inv) => sum + inv.amountGross, 0);
    const openItems = related.filter((inv) => inv.status === "Offen" || inv.status === "Ueberfaellig").length;
    return {
      ...contact,
      revenue: Number(revenue.toFixed(2)),
      invoiceCount: related.length,
      openItems,
    };
  });

  res.json(rows);
});

contactsRouter.get("/:id/detail", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const { id } = req.params;
  const contact = await prisma.contact.findFirst({ where: { id, companyId } });
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  const invoices = await prisma.invoice.findMany({
    where: { companyId, customer: contact.name },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const documents = await prisma.document.findMany({
    where: { companyId, partner: contact.name },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  res.json({
    contact,
    invoices,
    documents,
    totals: {
      invoiceCount: invoices.length,
      invoiceGross: Number(invoices.reduce((sum, i) => sum + i.amountGross, 0).toFixed(2)),
      openInvoices: invoices.filter((i) => i.status === "Offen" || i.status === "Ueberfaellig").length,
      documentCount: documents.length,
    },
  });
});

contactsRouter.post("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const payload = req.body as {
    type: string;
    name: string;
    email?: string;
    phone?: string;
    vatId?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    paymentTerms?: number;
    notes?: string;
  };
  if (!payload.name || !payload.type) return res.status(400).json({ error: "type and name required" });

  const created = await prisma.contact.create({
    data: {
      companyId,
      type: payload.type,
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      vatId: payload.vatId ?? null,
      street: payload.street ?? null,
      postalCode: payload.postalCode ?? null,
      city: payload.city ?? null,
      country: payload.country ?? "Deutschland",
      paymentTerms: payload.paymentTerms ?? 14,
      notes: payload.notes ?? null,
      active: true,
    },
  });
  res.status(201).json(created);
});

contactsRouter.patch("/:id", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const updated = await prisma.contact.updateMany({ where: { id, companyId }, data: req.body });
  if (updated.count === 0) return res.status(404).json({ error: "Contact not found" });
  res.json({ ok: true });
});
