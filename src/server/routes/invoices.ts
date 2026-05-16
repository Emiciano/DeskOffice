import { Router } from "express";
import { prisma } from "../db.js";

export const invoicesRouter = Router();

invoicesRouter.get("/", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.invoice.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

invoicesRouter.post("/", async (req, res) => {
  const created = await prisma.invoice.create({
    data: {
      ...req.body,
      dueDate: new Date(req.body.dueDate),
    },
  });
  res.status(201).json(created);
});

invoicesRouter.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const updated = await prisma.invoice.update({ where: { id }, data: { status } });
  res.json(updated);
});
