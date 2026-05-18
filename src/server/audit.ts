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
        body: req.body ?? {},
      }),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    },
  });
}

export async function writeEntityAuditLog(input: {
  companyId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValue: input.oldValue == null ? null : JSON.stringify(input.oldValue),
      newValue: input.newValue == null ? null : JSON.stringify(input.newValue),
      metadata: input.metadata == null ? null : JSON.stringify(input.metadata),
    },
  });
}
