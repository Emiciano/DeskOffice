import { Router } from "express";
import { prisma } from "../db.js";
import { createSessionToken, hashPassword, verifyPassword } from "../security.js";
import { ensureCompanySetup } from "../seed.js";
import { requireAuth } from "../auth.js";

export const authRouter = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

authRouter.post("/register", async (req, res) => {
  const body = req.body as { name?: string; email?: string; password?: string; companyName?: string };
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const companyName = String(body.companyName ?? "").trim();

  if (!name || !email || !password || !companyName) {
    return res.status(400).json({ error: "Bitte Name, E-Mail, Passwort und Firmenname ausfüllen." });
  }
  if (!isValidEmail(email)) return res.status(400).json({ error: "Bitte eine gültige E-Mail eingeben." });
  if (password.length < 8) return res.status(400).json({ error: "Passwort muss mindestens 8 Zeichen haben." });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "E-Mail ist bereits registriert." });

  const company = await prisma.company.create({ data: { name: companyName } });
  await ensureCompanySetup(company.id, companyName);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: "owner",
      companyId: company.id,
    },
  });

  const ownerRole = await prisma.role.findFirst({
    where: { companyId: company.id, code: "owner" },
    select: { id: true },
  });
  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: user.id } },
    update: { roleId: ownerRole?.id ?? null, status: "active" },
    create: {
      companyId: company.id,
      userId: user.id,
      roleId: ownerRole?.id ?? null,
      status: "active",
      invitedBy: user.name,
      invitedAt: new Date(),
    },
  });

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.authSession.create({
    data: { token, userId: user.id, expiresAt },
  });
  await prisma.authSession.deleteMany({
    where: {
      userId: user.id,
      expiresAt: { lt: new Date() },
    },
  });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
  });
});

authRouter.post("/login", async (req, res) => {
  const body = req.body as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return res.status(400).json({ error: "Bitte E-Mail und Passwort eingeben." });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Bitte eine gültige E-Mail eingeben." });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Ungültige Zugangsdaten." });
  if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: "Ungültige Zugangsdaten." });

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.authSession.create({
    data: { token, userId: user.id, expiresAt },
  });
  await prisma.authSession.deleteMany({
    where: {
      userId: user.id,
      expiresAt: { lt: new Date() },
    },
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.auth });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  const raw = req.headers.authorization ?? "";
  const token = raw.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : "";
  if (token) {
    await prisma.authSession.deleteMany({ where: { token, userId: req.auth!.userId } });
  }
  res.json({ ok: true });
});

