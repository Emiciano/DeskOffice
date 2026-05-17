import { Request } from "express";
import { prisma } from "./db.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isWriteMethod(method: string) {
  return WRITE_METHODS.has(method.toUpperCase());
}

export async function writeAuditLog(req: Request, statusCode: number) {
  const companyId = req.auth?.companyId;
  if (!companyId) return;
  if (!isWriteMethod(req.method)) return;
  if (statusCode >= 500) return;

  const path = req.path;
  const parts = path.split("/").filter(Boolean);
  const entityType = parts[1] ?? "unknown";
  const entityId = parts[2] ?? null;

  await prisma.auditLog.create({
    data: {
      companyId,
      userId: req.auth?.userId ?? null,
      action: req.method.toUpperCase(),
      entityType,
      entityId,
      metadata: JSON.stringify({
        query: req.query ?? {},
      }),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    },
  });
}
