import { Router } from "express";
import { prisma } from "../db.js";

export const bookingsRouter = Router();

bookingsRouter.get("/", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.booking.findMany({ where: { companyId }, orderBy: { bookingDate: "desc" } });
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
