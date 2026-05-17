import { Router } from "express";
import { getCompanyId, requirePermissions, requireRoles } from "../auth.js";
import { prisma } from "../db.js";

export const productsRouter = Router();

productsRouter.get("/", requirePermissions("products:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.product.findMany({
    where: { companyId },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
  res.json(items);
});

productsRouter.post("/", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const body = req.body as {
    name?: string;
    type?: string;
    unitPrice?: number;
    taxRate?: number;
    description?: string;
  };
  const name = String(body.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "name required" });

  const created = await prisma.product.create({
    data: {
      companyId,
      name,
      type: String(body.type ?? "Leistung"),
      unitPrice: Number(body.unitPrice ?? 0),
      taxRate: Number(body.taxRate ?? 19),
      description: String(body.description ?? "").trim() || null,
    },
  });
  res.status(201).json(created);
});

productsRouter.patch("/:id", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const body = req.body as {
    name?: string;
    type?: string;
    unitPrice?: number;
    taxRate?: number;
    description?: string;
    active?: boolean;
  };
  const updated = await prisma.product.updateMany({
    where: { id, companyId },
    data: {
      name: body.name === undefined ? undefined : String(body.name).trim(),
      type: body.type === undefined ? undefined : String(body.type),
      unitPrice: body.unitPrice === undefined ? undefined : Number(body.unitPrice),
      taxRate: body.taxRate === undefined ? undefined : Number(body.taxRate),
      description: body.description === undefined ? undefined : String(body.description).trim(),
      active: body.active,
    },
  });
  if (updated.count === 0) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true });
});

productsRouter.delete("/:id", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const updated = await prisma.product.updateMany({
    where: { id, companyId },
    data: { active: false },
  });
  if (updated.count === 0) return res.status(404).json({ error: "Product not found" });
  res.status(204).send();
});
