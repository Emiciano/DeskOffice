import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/server/api/response";
import { requireSession } from "@/server/auth/session";

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await prisma.chartAccount.findMany({
      where: { companyId: session.user.companyId, active: true },
      orderBy: [{ number: "asc" }],
      take: 200
    });
    return ok(rows);
  } catch {
    return fail("Nicht autorisiert", 401);
  }
}
