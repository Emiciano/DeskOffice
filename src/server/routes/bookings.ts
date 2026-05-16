import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId } from "../auth.js";

export const bookingsRouter = Router();

bookingsRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.booking.findMany({
    where: { companyId },
    include: { document: true },
    orderBy: { bookingDate: "desc" },
  });
  res.json(items);
});

bookingsRouter.post("/", async (req, res) => {
  const created = await prisma.booking.create({ data: req.body });
  await prisma.document.update({
    where: { id: created.documentId },
    data: { status: "Gebucht" },
  });
  res.status(201).json(created);
});

bookingsRouter.post("/:id/reverse", async (req, res) => {
  const { id } = req.params;
  const original = await prisma.booking.findUnique({ where: { id } });
  if (!original) return res.status(404).json({ error: "Booking not found" });
  if (original.status === "Storniert") return res.status(400).json({ error: "Already reversed" });
  const updated = await prisma.booking.update({ where: { id }, data: { status: "Storniert" } });
  res.json(updated);
});
