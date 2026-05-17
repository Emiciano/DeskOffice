import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions } from "../auth.js";

export const exportsRouter = Router();

exportsRouter.get("/", requirePermissions("exports:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.dataExport.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

exportsRouter.post("/", requirePermissions("exports:write"), async (req, res) => {
  const payload = req.body as {
    exportType: string;
    periodLabel: string;
    note?: string;
  };
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  if (!payload.exportType || !payload.periodLabel) {
    return res.status(400).json({ error: "exportType, periodLabel required" });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const created = await prisma.dataExport.create({
    data: {
      companyId,
      exportType: payload.exportType,
      periodLabel: payload.periodLabel,
      status: "Erstellt",
      fileName: `${payload.exportType.toLowerCase()}_${payload.periodLabel}_${stamp}.csv`,
      note: payload.note ?? null,
    },
  });
  res.status(201).json(created);
});

exportsRouter.patch("/:id/status", requirePermissions("exports:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const updated = await prisma.dataExport.updateMany({ where: { id, companyId }, data: { status } });
  if (updated.count === 0) return res.status(404).json({ error: "Export not found" });
  res.json({ ok: true });
});

exportsRouter.get("/:id/download", requirePermissions("exports:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const exp = await prisma.dataExport.findFirst({ where: { id, companyId } });
  if (!exp) return res.status(404).json({ error: "Export not found" });

  const bookings = await prisma.booking.findMany({
    where: { companyId },
    orderBy: { bookingDate: "asc" },
    take: 300,
  });
  const lines = [
    "bookingDate;debitAccount;creditAccount;amount;taxAmount;bookingText;category;status",
    ...bookings.map(
      (b) =>
        `${b.bookingDate.toISOString().slice(0, 10)};${b.debitAccount};${b.creditAccount};${b.amount.toFixed(2)};${b.taxAmount.toFixed(2)};${(b.bookingText || "").replace(/;/g, ",")};${(b.category || "").replace(/;/g, ",")};${b.status}`,
    ),
  ];
  const csv = lines.join("\n");

  await prisma.dataExport.update({
    where: { id: exp.id },
    data: { status: "Heruntergeladen" },
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${exp.fileName}"`);
  res.send(csv);
});
