import { Router } from "express";
import { prisma } from "../db.js";
import { getCompanyId, requireRoles } from "../auth.js";

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

  const settings = await prisma.companySettings.upsert({
    where: { companyId },
    update: {},
    create: {
      companyId,
      companyName: "",
    },
  });
  res.json(settings);
});

settingsRouter.put("/", requireRoles("owner", "admin"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const data = sanitize(req.body as Record<string, unknown>);
  const updated = await prisma.companySettings.upsert({
    where: { companyId },
    update: data,
    create: { companyId, ...data },
  });
  res.json(updated);
});
