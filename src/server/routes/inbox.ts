import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId } from "../auth.js";

export const inboxRouter = Router();

inboxRouter.get("/tasks", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const docs = await prisma.document.findMany({
    where: { companyId, status: { in: ["Entwurf", "Geprueft"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const priorityRank: Record<"hoch" | "mittel" | "niedrig", number> = { hoch: 3, mittel: 2, niedrig: 1 };

  const tasks = docs
    .map((doc) => {
      const missing: string[] = [];
      if (!doc.partner) missing.push("Partner");
      if (!doc.accountNumber) missing.push("Konto");
      if (!doc.documentDate) missing.push("Belegdatum");
      if (!doc.grossAmount || doc.grossAmount <= 0) missing.push("Betrag");
      const priority: "hoch" | "mittel" | "niedrig" = missing.length >= 3 ? "hoch" : missing.length === 2 ? "mittel" : "niedrig";
      return {
        id: doc.id,
        type: "document",
        title: doc.fileName,
        status: doc.status,
        missing,
        priority,
        createdAt: doc.createdAt,
      };
    })
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || b.createdAt.getTime() - a.createdAt.getTime());

  res.json({
    total: tasks.length,
    high: tasks.filter((t) => t.priority === "hoch").length,
    medium: tasks.filter((t) => t.priority === "mittel").length,
    low: tasks.filter((t) => t.priority === "niedrig").length,
    tasks,
  });
});

inboxRouter.patch("/tasks/:id/status", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { id } = req.params;
  const nextStatus = String(req.body?.status ?? "");
  const allowed = new Set(["Entwurf", "Geprueft", "Gebucht", "Bezahlt"]);
  if (!allowed.has(nextStatus)) {
    return res.status(400).json({ error: "invalid status" });
  }
  const updated = await prisma.document.updateMany({
    where: { id, companyId },
    data: { status: nextStatus },
  });
  if (updated.count === 0) return res.status(404).json({ error: "Task not found" });
  res.json({ ok: true });
});
