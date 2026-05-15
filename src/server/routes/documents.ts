import { Router } from "express";
import { prisma } from "../db.js";

export const documentsRouter = Router();

documentsRouter.get("/", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.document.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

documentsRouter.post("/", async (req, res) => {
  const created = await prisma.document.create({ data: req.body });
  res.status(201).json(created);
});

documentsRouter.patch("/:id", async (req, res) => {
  const updated = await prisma.document.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});
