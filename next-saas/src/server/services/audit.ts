import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function logAudit(params: {
  userId?: string;
  companyId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      companyId: params.companyId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata
    }
  });
}
