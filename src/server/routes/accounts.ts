import { Router } from "express";
import { prisma } from "../db.js";

export const accountsRouter = Router();

accountsRouter.get("/", async (req, res) => {
  const companyId = String(req.query.companyId ?? "");
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.account.findMany({ where: { companyId }, orderBy: { number: "asc" } });
  res.json(items);
});

accountsRouter.post("/", async (req, res) => {
  const payload = req.body;
  const created = await prisma.account.create({ data: payload });
  res.status(201).json(created);
});

accountsRouter.patch("/:id", async (req, res) => {
  const updated = await prisma.account.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updated);
});
