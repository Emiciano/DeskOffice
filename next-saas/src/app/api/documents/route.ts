import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/server/api/response";
import { requireSession } from "@/server/auth/session";
import { logAudit } from "@/server/services/audit";
import { createDocumentSchema } from "@/server/validations/accounting";

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await prisma.document.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return ok(rows);
  } catch {
    return fail("Nicht autorisiert", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Validierung fehlgeschlagen", 422);
    }

    const created = await prisma.document.create({
      data: {
        ...parsed.data,
        companyId: session.user.companyId
      }
    });

    await logAudit({
      userId: session.user.id,
      companyId: session.user.companyId,
      action: "DOCUMENT_CREATED",
      entity: "Document",
      entityId: created.id
    });

    return ok(created, 201);
  } catch {
    return fail("Interner Serverfehler", 500);
  }
}
