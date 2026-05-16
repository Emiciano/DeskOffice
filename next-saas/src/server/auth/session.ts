import { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.companyId) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  if (!allowed.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
