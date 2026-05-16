import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/server/api/response";
import { requireSession } from "@/server/auth/session";
import { updateDocumentSchema } from "@/server/validations/accounting";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const existing = await prisma.document.findFirst({ where: { id, companyId: session.user.companyId } });
    if (!existing) return fail("Dokument nicht gefunden", 404);
    const body = await req.json();
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) return fail("Validierung fehlgeschlagen", 422);

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...parsed.data,
        documentDate: parsed.data.documentDate ? new Date(parsed.data.documentDate) : undefined,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined
      }
    });
    return ok(updated);
  } catch {
    return fail("Dokument nicht gefunden", 404);
  }
}

export async function DELETE(_: NextRequest, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const existing = await prisma.document.findFirst({ where: { id, companyId: session.user.companyId } });
    if (!existing) return fail("Dokument nicht gefunden", 404);
    await prisma.document.delete({
      where: { id }
    });
    return ok({ deleted: true });
  } catch {
    return fail("Dokument nicht gefunden", 404);
  }
}
