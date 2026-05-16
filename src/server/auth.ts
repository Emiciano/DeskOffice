import { Request, Response, NextFunction } from "express";
import { prisma } from "./db.js";

type AuthContext = {
  userId: string;
  companyId: string;
  role: string;
  name: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export async function attachAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return next();

  const session = await prisma.authSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return next();
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return next();
  }

  req.auth = {
    userId: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
  };
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
  next();
}

export function getCompanyId(req: Request): string {
  return req.auth?.companyId ?? String(req.query.companyId ?? req.body?.companyId ?? "");
}
