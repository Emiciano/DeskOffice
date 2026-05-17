import { Router } from "express";
import { getCompanyId, requirePermissions } from "../auth.js";
import { prisma } from "../db.js";

export const eInvoicesRouter = Router();

function buildSimpleXRechnungXml(payload: {
  invoiceNumber: string;
  customer: string;
  dueDate: string;
  amountNet: number;
  amountTax: number;
  amountGross: number;
  currency: string;
  supplierName: string;
}) {
  const escapeXml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:ferd:CrossIndustryDocument:invoice:1p0" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(payload.invoiceNumber)}</ram:ID>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>${escapeXml(payload.supplierName)}</ram:Name></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>${escapeXml(payload.customer)}</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${payload.currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${payload.amountNet.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxTotalAmount>${payload.amountTax.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${payload.amountGross.toFixed(2)}</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime><udt:DateTimeString format="102">${payload.dueDate.split("-").join("")}</udt:DateTimeString></ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

eInvoicesRouter.post("/from-invoice/:invoiceId", requirePermissions("einvoices:write"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { invoiceId } = req.params;
  const format = String((req.body as { format?: string }).format ?? "XRECHNUNG").toUpperCase();
  if (!["XRECHNUNG", "ZUGFERD"].includes(format)) {
    return res.status(400).json({ error: "unsupported format" });
  }

  const [invoice, settings] = await Promise.all([
    prisma.invoice.findFirst({ where: { id: invoiceId, companyId } }),
    prisma.companySettings.findUnique({ where: { companyId } }),
  ]);

  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const xmlPayload = buildSimpleXRechnungXml({
    invoiceNumber: invoice.number,
    customer: invoice.customer,
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    amountNet: invoice.amountNet,
    amountTax: invoice.amountTax,
    amountGross: invoice.amountGross,
    currency: "EUR",
    supplierName: settings?.companyName || "Unbekannt",
  });

  const created = await prisma.eInvoiceDocument.upsert({
    where: { invoiceId: invoice.id },
    update: { xmlPayload, format, status: "VALIDATED", validatedAt: new Date() },
    create: {
      companyId,
      invoiceId: invoice.id,
      format,
      status: "VALIDATED",
      xmlPayload,
      validatedAt: new Date(),
    },
  });

  res.status(201).json(created);
});

eInvoicesRouter.get("/:invoiceId", requirePermissions("einvoices:read"), async (req, res) => {
  const companyId = getCompanyId(req);
  if (!companyId) return res.status(400).json({ error: "companyId required" });
  const { invoiceId } = req.params;
  const item = await prisma.eInvoiceDocument.findFirst({
    where: { invoiceId, companyId },
  });
  if (!item) return res.status(404).json({ error: "E-Invoice not found" });
  res.json(item);
});
