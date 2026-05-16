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
    take: 100,
  });

  const tasks = docs.map((doc) => {
    const missing: string[] = [];
    if (!doc.partner) missing.push("Partner");
    if (!doc.accountNumber) missing.push("Konto");
    if (!doc.documentDate) missing.push("Belegdatum");
    if (!doc.grossAmount || doc.grossAmount <= 0) missing.push("Betrag");

    return {
      id: doc.id,
      type: "document",
      title: doc.fileName,
      status: doc.status,
      missing,
      priority: missing.length >= 3 ? "hoch" : missing.length === 2 ? "mittel" : "niedrig",
      createdAt: doc.createdAt,
    };
  });

  res.json({
    total: tasks.length,
    high: tasks.filter((t) => t.priority === "hoch").length,
    medium: tasks.filter((t) => t.priority === "mittel").length,
    low: tasks.filter((t) => t.priority === "niedrig").length,
    tasks,
  });
});
