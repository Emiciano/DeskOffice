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
  const created = await prisma.bankTransaction.create({
    data: {
      ...req.body,
      bookingDate: new Date(req.body.bookingDate),
      valueDate: req.body.valueDate ? new Date(req.body.valueDate) : null,
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
