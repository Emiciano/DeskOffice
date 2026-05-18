import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";
import { assertPeriodUnlocked } from "../services/period-lock.js";
import { writeEntityAuditLog } from "../audit.js";

export const bookingsRouter = Router();

bookingsRouter.get("/", requirePermissions("bookings:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.booking.findMany({
    where: { companyId },
    include: { document: true },
    orderBy: { bookingDate: "desc" },
  });
  res.json(items);
});

bookingsRouter.post("/", requirePermissions("bookings:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const payload = req.body as {
    documentId: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    taxAmount: number;
    bookingText: string;
    bookingDate: string;
    category: string;
    status?: string;
    costCenterId?: string | null;
  };

  const document = await prisma.document.findFirst({ where: { id: payload.documentId, companyId } });
  if (!document) return res.status(404).json({ error: "Document not found" });
  await assertPeriodUnlocked(companyId, new Date(payload.bookingDate), "booking:create");

  const created = await prisma.booking.create({
    data: {
      companyId,
      documentId: payload.documentId,
      debitAccount: payload.debitAccount,
      creditAccount: payload.creditAccount,
      amount: payload.amount,
      taxAmount: payload.taxAmount,
      bookingText: payload.bookingText,
      bookingDate: new Date(payload.bookingDate),
      category: payload.category,
      status: payload.status ?? "Gebucht",
      costCenterId: payload.costCenterId ?? null,
    },
  });
  await prisma.document.updateMany({
    where: { id: created.documentId, companyId },
    data: { status: "Gebucht", finalizedAt: new Date() },
  });
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "CREATE",
    entityType: "booking",
    entityId: created.id,
    newValue: created,
  });
  res.status(201).json(created);
});

bookingsRouter.post("/:id/reverse", requirePermissions("bookings:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const original = await prisma.booking.findFirst({ where: { id, companyId } });
  if (!original) return res.status(404).json({ error: "Booking not found" });
  if (original.status === "Storniert") return res.status(400).json({ error: "Already reversed" });
  await assertPeriodUnlocked(companyId, original.bookingDate, "booking:reverse");
  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "Storniert", deletedAt: new Date(), deletedBy: req.auth?.userId ?? null },
  });
  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "CANCEL",
    entityType: "booking",
    entityId: id,
    oldValue: original,
    newValue: updated,
  });
  res.json({ ok: true });
});
