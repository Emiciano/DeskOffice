import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const bankingRouter = Router();

bankingRouter.get("/transactions", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.bankTransaction.findMany({
    where: { companyId },
    orderBy: { bookingDate: "desc" },
  });
  res.json(items);
});

bankingRouter.post("/transactions", requirePermissions("banking:write"), async (req, res) => {
  const payload = req.body as {
    companyId: string;
    bookingDate: string;
    valueDate?: string;
    purpose: string;
    counterparty?: string;
    amount: number;
    currency?: string;
    type: string;
    status?: string;
  };

  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  if (!payload.bookingDate || !payload.purpose || !payload.type) {
    return res.status(400).json({ error: "bookingDate, purpose and type required" });
  }
  const amount = Number(payload.amount);
  if (Number.isNaN(amount)) return res.status(400).json({ error: "amount must be a number" });

  const rules = await prisma.rule.findMany({
    where: { companyId, active: true },
    orderBy: { createdAt: "desc" },
  });
  const purposeLower = payload.purpose.toLowerCase();
  const matchedRule = rules.find((r) => purposeLower.includes(r.pattern.toLowerCase()));

  const created = await prisma.bankTransaction.create({
    data: {
      companyId,
      bookingDate: new Date(payload.bookingDate),
      valueDate: payload.valueDate ? new Date(payload.valueDate) : null,
      purpose: payload.purpose,
      counterparty: payload.counterparty ?? null,
      amount,
      currency: payload.currency ?? "EUR",
      type: payload.type,
      status: matchedRule ? "Vorgeschlagen" : payload.status ?? "Offen",
      category: matchedRule?.category ?? null,
      suggestedAccount: matchedRule?.accountNumber ?? null,
      matchedRuleId: matchedRule?.id ?? null,
    },
  });
  res.status(201).json(created);
});

bankingRouter.patch("/transactions/:id/match", requirePermissions("banking:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const { matchedInvoiceId, matchedDocumentId, status } = req.body as {
    matchedInvoiceId?: string;
    matchedDocumentId?: string;
    status?: string;
  };
  if (matchedInvoiceId && matchedDocumentId) {
    return res.status(400).json({ error: "match either invoice or document, not both" });
  }

  const updated = await prisma
    .$transaction(async (tx) => {
      const existing = await tx.bankTransaction.findFirst({ where: { id, companyId } });
      if (!existing) return null;

      const row = await tx.bankTransaction.update({
        where: { id },
        data: {
          matchedInvoiceId: matchedInvoiceId ?? null,
          matchedDocumentId: matchedDocumentId ?? null,
          status: status ?? "Zugeordnet",
        },
      });

      if (matchedInvoiceId) {
        const invoiceUpdate = await tx.invoice.updateMany({
          where: { id: matchedInvoiceId, companyId },
          data: { status: "Bezahlt" },
        });
        if (invoiceUpdate.count === 0) throw new Error("invoice not found");
      }
      if (matchedDocumentId) {
        const documentUpdate = await tx.document.updateMany({
          where: { id: matchedDocumentId, companyId },
          data: { status: "Bezahlt" },
        });
        if (documentUpdate.count === 0) throw new Error("document not found");
      }
      return row;
    })
    .catch((error: Error) => {
      if (error.message === "invoice not found") return "invoice-not-found" as const;
      if (error.message === "document not found") return "document-not-found" as const;
      throw error;
    });
  if (updated === "invoice-not-found") return res.status(404).json({ error: "Invoice not found" });
  if (updated === "document-not-found") return res.status(404).json({ error: "Document not found" });
  if (!updated) return res.status(404).json({ error: "Transaction not found" });
  res.json(updated);
});

bankingRouter.get("/transactions/:id/suggestions", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const tx = await prisma.bankTransaction.findFirst({ where: { id, companyId } });
  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  const amountAbs = Math.abs(tx.amount);
  const invoices = await prisma.invoice.findMany({
    where: {
      companyId: tx.companyId,
      status: { in: ["Offen", "Ueberfaellig", "Versendet"] },
    },
    orderBy: { dueDate: "asc" },
    take: 50,
  });

  const suggestions = invoices
    .map((inv) => ({
      id: inv.id,
      number: inv.number,
      customer: inv.customer,
      amountGross: inv.amountGross,
      status: inv.status,
      score: Math.abs(inv.amountGross - amountAbs),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  res.json(suggestions);
});
