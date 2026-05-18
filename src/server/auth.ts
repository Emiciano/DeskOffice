import { Request, Response, NextFunction } from "express";
import { prisma } from "./db.js";

type AuthContext = {
  userId: string;
  companyId: string;
  role: string;
  name: string;
  email: string;
  permissions: string[];
};

function defaultPermissionsForRole(role: string): string[] {
  const r = role.toLowerCase();
  if (r === "owner" || r === "admin") return ["*"];
  if (r === "tax_advisor" || r === "steuerberater") {
    return [
      "documents:read", "invoices:read", "offers:read", "contacts:read", "accounts:read", "bookings:read",
      "banking:read", "reports:read", "taxes:read", "settings:read",
    ];
  }
  return [
    "documents:read", "documents:write",
    "invoices:read", "invoices:write",
    "offers:read", "offers:write",
    "contacts:read", "contacts:write",
    "settings:read", "settings:write",
    "products:read", "products:write",
    "bookings:read", "bookings:write",
    "banking:read", "banking:write",
    "accounts:read",
  ];
}

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

  const member = await prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId: session.user.companyId, userId: session.user.id } },
    include: { role: true },
  });
  const permissionPayload = String(member?.role?.permissions ?? "").trim();
  let permissions: string[] = [];
  if (permissionPayload) {
    try {
      const parsed = JSON.parse(permissionPayload);
      if (Array.isArray(parsed)) permissions = parsed.map((x) => String(x));
    } catch {
      permissions = [];
    }
  }
  if (permissions.length === 0) permissions = defaultPermissionsForRole(session.user.role);

  req.auth = {
    userId: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    permissions,
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

export function requireRoles(...roles: string[]) {
  const allowed = new Set(roles.map((role) => role.toLowerCase()));
  return (req: Request, res: Response, next: NextFunction) => {
    const role = String(req.auth?.role ?? "").toLowerCase();
    if (!allowed.has(role)) return res.status(403).json({ error: "insufficient permissions" });
    next();
  };
}

export function requirePermissions(...required: string[]) {
  const needed = required.map((x) => x.toLowerCase());
  return (req: Request, res: Response, next: NextFunction) => {
    const perms = (req.auth?.permissions ?? []).map((x) => x.toLowerCase());
    if (perms.includes("*")) return next();
    const ok = needed.every((p) => perms.includes(p));
    if (!ok) return res.status(403).json({ error: "missing permission" });
    next();
  };
}
