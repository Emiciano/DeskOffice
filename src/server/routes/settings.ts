import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requireRoles } from "../auth.js";
import { writeEntityAuditLog } from "../audit.js";

export const settingsRouter = Router();

function sanitize(payload: Record<string, unknown>) {
  return {
    companyName: String(payload.companyName ?? ""),
    companySuffix: String(payload.companySuffix ?? ""),
    legalForm: String(payload.legalForm ?? ""),
    managingDirector: String(payload.managingDirector ?? ""),
    street: String(payload.street ?? ""),
    postalCode: String(payload.postalCode ?? ""),
    city: String(payload.city ?? ""),
    country: String(payload.country ?? "Deutschland"),
    phone: String(payload.phone ?? ""),
    fax: String(payload.fax ?? ""),
    email: String(payload.email ?? ""),
    website: String(payload.website ?? ""),
    vatId: String(payload.vatId ?? ""),
    taxNumber: String(payload.taxNumber ?? ""),
    districtCourt: String(payload.districtCourt ?? ""),
    commercialRegisterNo: String(payload.commercialRegisterNo ?? ""),
    vatMode: String(payload.vatMode ?? "standard"),
    profitMethod: String(payload.profitMethod ?? "euer"),
    defaultTaxRate: Number(payload.defaultTaxRate ?? 19) || 19,
    accountFrame: String(payload.accountFrame ?? "SKR04"),
    priceInputMode: String(payload.priceInputMode ?? "brutto"),
    bankName: String(payload.bankName ?? ""),
    accountNumber: String(payload.accountNumber ?? ""),
    bankCode: String(payload.bankCode ?? ""),
    iban: String(payload.iban ?? ""),
    bic: String(payload.bic ?? ""),
    logoUrl: String(payload.logoUrl ?? ""),
    invoicePrefix: String(payload.invoicePrefix ?? "RE").slice(0, 12).toUpperCase(),
    invoiceNextNumber: Math.max(1, Number(payload.invoiceNextNumber ?? 101) || 101),
    offerPrefix: String(payload.offerPrefix ?? "AN").slice(0, 12).toUpperCase(),
    offerNextNumber: Math.max(1, Number(payload.offerNextNumber ?? 31) || 31),
    invoiceTemplate: String(payload.invoiceTemplate ?? "clean"),
  };
}

settingsRouter.get("/", async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });

  const [settings, taxProfile, sequences] = await prisma.$transaction([
    prisma.companySettings.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
        companyName: "",
      },
    }),
    prisma.taxProfile.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
        taxationType: "regular",
        defaultVatRate: 19,
        allowedVatRates: JSON.stringify([19, 7, 0]),
      },
    }),
    prisma.numberSequence.findMany({ where: { companyId }, orderBy: [{ scope: "asc" }, { year: "desc" }] }),
  ]);
  res.json({ ...settings, taxProfile, numberSequences: sequences });
});

settingsRouter.put("/", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const body = req.body as Record<string, unknown>;
  const data = sanitize(body);
  const old = await prisma.companySettings.findUnique({ where: { companyId } });
  const updated = await prisma.companySettings.upsert({
    where: { companyId },
    update: data,
    create: { companyId, ...data },
  });

  const taxProfileInput = (body.taxProfile ?? {}) as Record<string, unknown>;
  const taxProfile = await prisma.taxProfile.upsert({
    where: { companyId },
    update: {
      taxationType: String(taxProfileInput.taxationType ?? "regular"),
      defaultVatRate: Number(taxProfileInput.defaultVatRate ?? 19) || 19,
      allowedVatRates: JSON.stringify(Array.isArray(taxProfileInput.allowedVatRates) ? taxProfileInput.allowedVatRates : [19, 7, 0]),
      reverseChargeEnabled: Boolean(taxProfileInput.reverseChargeEnabled ?? false),
      euVatEnabled: Boolean(taxProfileInput.euVatEnabled ?? true),
      smallBusinessNote: taxProfileInput.smallBusinessNote == null ? null : String(taxProfileInput.smallBusinessNote),
      taxNumber: taxProfileInput.taxNumber == null ? null : String(taxProfileInput.taxNumber),
      vatId: taxProfileInput.vatId == null ? null : String(taxProfileInput.vatId),
    },
    create: {
      companyId,
      taxationType: String(taxProfileInput.taxationType ?? "regular"),
      defaultVatRate: Number(taxProfileInput.defaultVatRate ?? 19) || 19,
      allowedVatRates: JSON.stringify(Array.isArray(taxProfileInput.allowedVatRates) ? taxProfileInput.allowedVatRates : [19, 7, 0]),
      reverseChargeEnabled: Boolean(taxProfileInput.reverseChargeEnabled ?? false),
      euVatEnabled: Boolean(taxProfileInput.euVatEnabled ?? true),
      smallBusinessNote: taxProfileInput.smallBusinessNote == null ? null : String(taxProfileInput.smallBusinessNote),
      taxNumber: taxProfileInput.taxNumber == null ? null : String(taxProfileInput.taxNumber),
      vatId: taxProfileInput.vatId == null ? null : String(taxProfileInput.vatId),
    },
  });

  if (Array.isArray(body.numberSequences)) {
    const entries = (body.numberSequences as Array<Record<string, unknown>>)
      .map((seq) => ({
        scope: String(seq.scope ?? "").trim(),
        year: Number(seq.year ?? new Date().getFullYear()),
        prefix: String(seq.prefix ?? "").trim().toUpperCase().slice(0, 12),
        nextNumber: Math.max(1, Number(seq.nextNumber ?? 1) || 1),
        padding: Math.max(2, Number(seq.padding ?? 4) || 4),
      }))
      .filter((seq) => seq.scope);
    for (const seq of entries) {
      await prisma.numberSequence.upsert({
        where: { companyId_scope_year: { companyId, scope: seq.scope, year: seq.year } },
        update: {
          prefix: seq.prefix || "RE",
          nextNumber: seq.nextNumber,
          padding: seq.padding,
        },
        create: {
          companyId,
          scope: seq.scope,
          year: seq.year,
          prefix: seq.prefix || "RE",
          nextNumber: seq.nextNumber,
          padding: seq.padding,
        },
      });
    }
  }

  await writeEntityAuditLog({
    companyId,
    userId: req.auth?.userId,
    action: "UPDATE",
    entityType: "settings",
    entityId: companyId,
    oldValue: old,
    newValue: { updated, taxProfile },
  });

  res.json({ ...updated, taxProfile });
});
