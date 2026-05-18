import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requirePermissions, requireRoles } from "../auth.js";

type SkrType = "SKR03" | "SKR04";

type ImportRow = {
  number: string;
  name: string;
  skrType: SkrType;
  year: number;
  accountClass: string;
  accountType: string;
  taxKey: string | null;
  active: boolean;
};

export const accountsRouter = Router();

function parseBool(value: string | undefined): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "ja", "yes", "aktiv", "active"].includes(v);
}

function parseCsvRows(data: string, defaultSkrType?: SkrType, defaultYear?: number): ImportRow[] {
  const lines = data
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const maybeHeader = lines[0].toLowerCase();
  const hasHeader = maybeHeader.includes("number") || maybeHeader.includes("konto") || maybeHeader.includes("name");
  const content = hasHeader ? lines.slice(1) : lines;

  return content.map((line) => {
    const cols = line.split(/[;,]/).map((part) => part.trim());
    const number = cols[0] ?? "";
    const name = cols[1] ?? "";
    const skrType = (cols[2] as SkrType) || defaultSkrType || "SKR03";
    const year = Number(cols[3] ?? defaultYear ?? new Date().getFullYear());
    const accountClass = cols[4] ?? "";
    const accountType = cols[5] ?? "";
    const taxKey = cols[6] ? cols[6] : null;
    const active = cols[7] ? parseBool(cols[7]) : true;
    return { number, name, skrType, year, accountClass, accountType, taxKey, active };
  });
}

function parseJsonRows(data: string, defaultSkrType?: SkrType, defaultYear?: number): ImportRow[] {
  const parsed = JSON.parse(data) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((entry) => {
    const row = entry as Record<string, unknown>;
    return {
      number: String(row.number ?? row.kontonummer ?? "").trim(),
      name: String(row.name ?? row.kontoname ?? "").trim(),
      skrType: String(row.skrType ?? defaultSkrType ?? "SKR03").toUpperCase() as SkrType,
      year: Number(row.year ?? defaultYear ?? new Date().getFullYear()),
      accountClass: String(row.accountClass ?? row.klasse ?? "").trim(),
      accountType: String(row.accountType ?? row.typ ?? "").trim(),
      taxKey: row.taxKey ? String(row.taxKey) : null,
      active: row.active === undefined ? true : Boolean(row.active),
    };
  });
}

function validateRows(rows: ImportRow[]): ImportRow[] {
  return rows.filter((r) => {
    if (!r.number || !r.name) return false;
    if (r.skrType !== "SKR03" && r.skrType !== "SKR04") return false;
    if (!Number.isInteger(r.year) || r.year < 2000 || r.year > 2100) return false;
    return true;
  });
}

accountsRouter.get("/", requirePermissions("accounts:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const skrType = String(req.query.skrType ?? "").trim();
  const year = req.query.year ? Number(req.query.year) : undefined;
  const where = {
    companyId,
    ...(skrType ? { skrType } : {}),
    ...(year ? { year } : {}),
  };

  const items = await prisma.account.findMany({ where, orderBy: [{ year: "desc" }, { number: "asc" }] });
  res.json(items);
});

accountsRouter.get("/versions", requirePermissions("accounts:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const grouped = await prisma.account.groupBy({
    by: ["skrType", "year"],
    where: { companyId },
    _count: { _all: true },
    orderBy: [{ year: "desc" }, { skrType: "asc" }],
  });
  res.json(grouped.map((g) => ({ skrType: g.skrType, year: g.year, count: g._count._all })));
});

accountsRouter.post("/", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const payload = {
    companyId,
    number: String(req.body.number ?? "").trim(),
    name: String(req.body.name ?? "").trim(),
    skrType: String(req.body.skrType ?? "").trim().toUpperCase() as SkrType,
    year: Number(req.body.year ?? new Date().getFullYear()),
    accountClass: String(req.body.accountClass ?? "").trim(),
    accountType: String(req.body.accountType ?? "").trim(),
    taxKey: req.body.taxKey ? String(req.body.taxKey).trim() : null,
    active: req.body.active !== false,
  };
  if (!payload.number || !payload.name || (payload.skrType !== "SKR03" && payload.skrType !== "SKR04")) {
    return res.status(400).json({ error: "number, name and valid skrType required" });
  }
  if (!Number.isInteger(payload.year) || payload.year < 2000 || payload.year > 2100) {
    return res.status(400).json({ error: "valid year required" });
  }
  const created = await prisma.account.create({ data: payload });
  res.status(201).json(created);
});

accountsRouter.post("/import", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const format = String(req.body.format ?? "").trim().toLowerCase();
  const data = String(req.body.data ?? "");
  const defaultSkrType = String(req.body.skrType ?? "").toUpperCase() as SkrType;
  const defaultYear = Number(req.body.year ?? new Date().getFullYear());
  const replace = req.body.replace === true;

  if (!["csv", "json"].includes(format)) return res.status(400).json({ error: "format must be csv or json" });
  if (!data.trim()) return res.status(400).json({ error: "data required" });
  if (!Number.isInteger(defaultYear) || defaultYear < 2000 || defaultYear > 2100) return res.status(400).json({ error: "valid year required" });
  if (defaultSkrType !== "SKR03" && defaultSkrType !== "SKR04") return res.status(400).json({ error: "valid skrType required" });

  const parsed = format === "csv" ? parseCsvRows(data, defaultSkrType, defaultYear) : parseJsonRows(data, defaultSkrType, defaultYear);
  const rows = validateRows(parsed);
  if (rows.length === 0) return res.status(400).json({ error: "no valid rows found" });

  const uniqueRows = Array.from(new Map(rows.map((r) => [`${r.skrType}-${r.year}-${r.number}`, r])).values());

  await prisma.$transaction(async (tx) => {
    if (replace) {
      await tx.account.deleteMany({ where: { companyId, skrType: defaultSkrType, year: defaultYear } });
    }
    for (const row of uniqueRows) {
      await tx.account.upsert({
        where: { companyId_number_skrType_year: { companyId, number: row.number, skrType: row.skrType, year: row.year } },
        update: {
          name: row.name,
          accountClass: row.accountClass,
          accountType: row.accountType,
          taxKey: row.taxKey,
          active: row.active,
        },
        create: { ...row, companyId },
      });
    }
  });

  res.json({ imported: uniqueRows.length, skrType: defaultSkrType, year: defaultYear, replace });
});

accountsRouter.patch("/:id", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const updated = await prisma.account.updateMany({
    where: { id: req.params.id, companyId },
    data: {
      name: req.body.name,
      accountClass: req.body.accountClass,
      accountType: req.body.accountType,
      taxKey: req.body.taxKey,
      active: req.body.active,
    },
  });
  if (updated.count === 0) return res.status(404).json({ error: "Account not found" });
  res.json({ ok: true });
});
