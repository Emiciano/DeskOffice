import { Router } from "express";
import { prisma } from "../db.js";

export const contactsRouter = Router();

contactsRouter.get("/", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
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

contactsRouter.post("/", async (req, res) => {
  const payload = req.body as {
    companyId: string;
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
  if (!payload.companyId || !payload.name || !payload.type) {
    return res.status(400).json({ error: "companyId, type and name required" });
  }

  const created = await prisma.contact.create({
    data: {
      companyId: payload.companyId,
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
  const { id } = req.params;
  const updated = await prisma.contact.update({ where: { id }, data: req.body });
  res.json(updated);
});
