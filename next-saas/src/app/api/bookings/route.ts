import { DocumentStatus } from "@prisma/client";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/server/api/response";
import { requireSession } from "@/server/auth/session";
import { logAudit } from "@/server/services/audit";
import { createBookingSchema } from "@/server/validations/accounting";

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await prisma.booking.findMany({
      where: { companyId: session.user.companyId },
      include: { document: true },
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
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Validierung fehlgeschlagen", 422);
    }

    const document = await prisma.document.findFirst({
      where: { id: parsed.data.documentId, companyId: session.user.companyId }
    });
    if (!document) return fail("Beleg nicht gefunden", 404);

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          ...parsed.data,
          companyId: session.user.companyId,
          bookingDate: new Date(parsed.data.bookingDate)
        }
      });

      await tx.document.update({
        where: { id: document.id },
        data: { status: DocumentStatus.GEBUCHT }
      });
      return created;
    });

    await logAudit({
      userId: session.user.id,
      companyId: session.user.companyId,
      action: "BOOKING_CREATED",
      entity: "Booking",
      entityId: booking.id
    });

    return ok(booking, 201);
  } catch {
    return fail("Interner Serverfehler", 500);
  }
}
