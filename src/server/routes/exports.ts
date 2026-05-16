import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId } from "../auth.js";

export const exportsRouter = Router();

exportsRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.dataExport.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

exportsRouter.post("/", async (req, res) => {
  const payload = req.body as {
    companyId: string;
    exportType: string;
    periodLabel: string;
    note?: string;
  };
  if (!payload.exportType || !payload.periodLabel) {
    return res.status(400).json({ error: "exportType, periodLabel required" });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const created = await prisma.dataExport.create({
    data: {
      companyId: getCompanyId(req),
      exportType: payload.exportType,
      periodLabel: payload.periodLabel,
      status: "Erstellt",
      fileName: `${payload.exportType.toLowerCase()}_${payload.periodLabel}_${stamp}.csv`,
      note: payload.note ?? null,
    },
  });
  res.status(201).json(created);
});

exportsRouter.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const updated = await prisma.dataExport.update({ where: { id }, data: { status } });
  res.json(updated);
});
