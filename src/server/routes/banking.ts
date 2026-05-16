import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId } from "../auth.js";

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

bankingRouter.post("/transactions", async (req, res) => {
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
      amount: payload.amount,
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

bankingRouter.patch("/transactions/:id/match", async (req, res) => {
  const { id } = req.params;
  const { matchedInvoiceId, matchedDocumentId, status } = req.body as {
    matchedInvoiceId?: string;
    matchedDocumentId?: string;
    status?: string;
  };

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.bankTransaction.update({
      where: { id },
      data: {
        matchedInvoiceId: matchedInvoiceId ?? null,
        matchedDocumentId: matchedDocumentId ?? null,
        status: status ?? "Zugeordnet",
      },
    });

    if (matchedInvoiceId) {
      await tx.invoice.update({
        where: { id: matchedInvoiceId },
        data: { status: "Bezahlt" },
      });
    }
    if (matchedDocumentId) {
      await tx.document.update({
        where: { id: matchedDocumentId },
        data: { status: "Bezahlt" },
      });
    }
    return row;
  });
  res.json(updated);
});

bankingRouter.get("/transactions/:id/suggestions", async (req, res) => {
  const { id } = req.params;
  const tx = await prisma.bankTransaction.findUnique({ where: { id } });
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
