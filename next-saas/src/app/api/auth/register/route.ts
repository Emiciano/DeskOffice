import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { Role, SkrType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/server/api/response";
import { logAudit } from "@/server/services/audit";
import { registerSchema } from "@/server/validations/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Validierung fehlgeschlagen", 422);
    }

    const exists = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });
    if (exists) return fail("E-Mail ist bereits registriert", 409);

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          passwordHash
        }
      });

      const company = await tx.company.create({
        data: {
          name: parsed.data.companyName,
          skrType: SkrType.SKR03
        }
      });

      await tx.companyMember.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: Role.OWNER
        }
      });

      return { user, company };
    });

    await logAudit({
      userId: created.user.id,
      companyId: created.company.id,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: created.user.id
    });

    return ok({ userId: created.user.id, companyId: created.company.id }, 201);
  } catch {
    return fail("Interner Serverfehler", 500);
  }
}
