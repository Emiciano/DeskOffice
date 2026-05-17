import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const contactsRouter = Router();

function normalizeContactPayload(payload: {
  type?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  vatId?: unknown;
  street?: unknown;
  postalCode?: unknown;
  city?: unknown;
  country?: unknown;
  paymentTerms?: unknown;
  notes?: unknown;
  active?: unknown;
}) {
  const type = String(payload.type ?? "").trim().toLowerCase();
  const name = String(payload.name ?? "").trim();
  const emailRaw = String(payload.email ?? "").trim().toLowerCase();
  const email = emailRaw.length > 0 ? emailRaw : null;
  const phone = String(payload.phone ?? "").trim() || null;
  const vatId = String(payload.vatId ?? "").trim() || null;
  const street = String(payload.street ?? "").trim() || null;
  const postalCode = String(payload.postalCode ?? "").trim() || null;
  const city = String(payload.city ?? "").trim() || null;
  const country = String(payload.country ?? "").trim() || "Deutschland";
  const notes = String(payload.notes ?? "").trim() || null;
  const paymentTermsNum = Number(payload.paymentTerms ?? 14);
  const paymentTerms = Number.isFinite(paymentTermsNum) ? Math.min(365, Math.max(0, Math.round(paymentTermsNum))) : 14;
  const active = typeof payload.active === "boolean" ? payload.active : true;

  return { type, name, email, phone, vatId, street, postalCode, city, country, paymentTerms, notes, active };
}

contactsRouter.get("/", requirePermissions("contacts:read"), async (req, res) => {
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

contactsRouter.get("/:id/detail", requirePermissions("contacts:read"), async (req, res) => {
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

contactsRouter.post("/", requirePermissions("contacts:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const payload = normalizeContactPayload(req.body ?? {});
  if (!payload.name || !payload.type) return res.status(400).json({ error: "type and name required" });
  if (!["customer", "supplier"].includes(payload.type)) return res.status(400).json({ error: "invalid type" });
  if (payload.email && !payload.email.includes("@")) return res.status(400).json({ error: "invalid email" });

  const created = await prisma.contact.create({
    data: {
      companyId,
      ...payload,
    },
  });
  res.status(201).json(created);
});

contactsRouter.patch("/:id", requirePermissions("contacts:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const payload = normalizeContactPayload(req.body ?? {});
  if (!payload.name || !payload.type) return res.status(400).json({ error: "type and name required" });
  if (!["customer", "supplier"].includes(payload.type)) return res.status(400).json({ error: "invalid type" });
  if (payload.email && !payload.email.includes("@")) return res.status(400).json({ error: "invalid email" });

  const updated = await prisma.contact.updateMany({ where: { id, companyId }, data: payload });
  if (updated.count === 0) return res.status(404).json({ error: "Contact not found" });
  res.json({ ok: true });
});
