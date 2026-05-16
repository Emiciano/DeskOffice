import { Router } from "express";
import { prisma } from "../db.js";

export const rulesRouter = Router();

rulesRouter.get("/", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.rule.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  res.json(items);
});

rulesRouter.post("/", async (req, res) => {
  const created = await prisma.rule.create({ data: req.body });
  res.status(201).json(created);
});

rulesRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.rule.update({ where: { id }, data: req.body });
  res.json(updated);
});
