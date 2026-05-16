import { Router } from "express";
import { prisma } from "../db.js";

export const bankingRouter = Router();

bankingRouter.get("/transactions", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
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

  const rules = await prisma.rule.findMany({
    where: { companyId: payload.companyId, active: true },
    orderBy: { createdAt: "desc" },
  });
  const purposeLower = payload.purpose.toLowerCase();
  const matchedRule = rules.find((r) => purposeLower.includes(r.pattern.toLowerCase()));

  const created = await prisma.bankTransaction.create({
    data: {
      companyId: payload.companyId,
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

  const updated = await prisma.bankTransaction.update({
    where: { id },
    data: {
      matchedInvoiceId: matchedInvoiceId ?? null,
      matchedDocumentId: matchedDocumentId ?? null,
      status: status ?? "Zugeordnet",
    },
  });
  res.json(updated);
});
