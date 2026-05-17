import { Router } from "express";
import { getCompanyId, requireRoles } from "../auth.js";
import { prisma } from "../db.js";

export const advisorsRouter = Router();

advisorsRouter.get("/invites", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const items = await prisma.advisorInvite.findMany({
    where: { companyId },
    orderBy: { invitedAt: "desc" },
  });
  res.json(items);
});

advisorsRouter.post("/invites", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const email = String((req.body as { email?: string }).email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return res.status(400).json({ error: "valid email required" });

  const created = await prisma.advisorInvite.create({
    data: {
      companyId,
      email,
      role: "tax_advisor",
      status: "pending",
      invitedBy: req.auth?.name ?? "owner",
    },
  });
  res.status(201).json(created);
});

advisorsRouter.patch("/invites/:id/revoke", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const updated = await prisma.advisorInvite.updateMany({
    where: { id, companyId, status: "pending" },
    data: { status: "revoked", revokedAt: new Date() },
  });
  if (updated.count === 0) return res.status(404).json({ error: "Invite not found" });
  res.json({ ok: true });
});
