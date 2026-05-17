import { Router } from "express";
import { getCompanyId, requireRoles } from "../auth.js";
import { prisma } from "../db.js";

export const adminRouter = Router();

adminRouter.get("/roles", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const roles = await prisma.role.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } });
  res.json(roles);
});

adminRouter.post("/roles", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const body = req.body as { code?: string; label?: string; permissions?: string[] };
  const code = String(body.code ?? "").trim().toLowerCase();
  const label = String(body.label ?? "").trim();
  if (!code || !label) return res.status(400).json({ error: "code and label required" });
  const role = await prisma.role.create({
    data: {
      companyId,
      code,
      label,
      permissions: JSON.stringify(body.permissions ?? []),
      system: false,
    },
  });
  res.status(201).json(role);
});

adminRouter.get("/members", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const members = await prisma.companyMember.findMany({
    where: { companyId },
    include: { user: true, role: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(members);
});

adminRouter.patch("/members/:id", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const body = req.body as { roleId?: string | null; status?: string };
  const updated = await prisma.companyMember.updateMany({
    where: { id, companyId },
    data: {
      roleId: body.roleId ?? undefined,
      status: body.status ?? undefined,
    },
  });
  if (updated.count === 0) return res.status(404).json({ error: "member not found" });
  res.json({ ok: true });
});

adminRouter.get("/subscriptions", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const rows = await prisma.subscription.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows);
});

adminRouter.post("/subscriptions", requireRoles("owner"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const body = req.body as { planCode?: string; status?: string; seats?: number };
  const created = await prisma.subscription.create({
    data: {
      companyId,
      planCode: String(body.planCode ?? "starter"),
      status: String(body.status ?? "active"),
      seats: Number(body.seats ?? 1),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });
  res.status(201).json(created);
});

adminRouter.get("/audit-logs", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const rows = await prisma.auditLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  res.json(rows);
});
