import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

type Invoice = {
  id: string;
  number: string;
  customer: string;
  amountNet: number;
  amountTax: number;
  amountGross: number;
  dueDate: string;
  status: string;
  items: InvoiceItem[];
};

type TemplateMode = "clean" | "modern" | "compact";

function InvoicePreview({
  number,
  customer,
  dueDate,
  serviceDate,
  paymentTermDays,
  discountPercent,
  items,
  totals,
  template,
  note,
}: {
  number: string;
  customer: string;
  dueDate: string;
  serviceDate: string;
  paymentTermDays: number;
  discountPercent: number;
  items: InvoiceItem[];
  totals: { net: number; tax: number; gross: number };
  template: TemplateMode;
  note: string;
}) {
  const frameClass =
    template === "modern"
      ? "bg-gradient-to-br from-indigo-50 to-white border-indigo-200"
      : template === "compact"
        ? "bg-white border-slate-300"
        : "bg-white border-slate-200";

  return (
    <div className={`h-full rounded-xl border p-4 text-slate-900 ${frameClass}`}>
      <div className={`mb-4 flex items-start justify-between border-b pb-3 ${template === "modern" ? "border-indigo-200" : ""}`}>
        <div>
          <p className="text-lg font-semibold">DeskOffice GmbH</p>
          <p className="text-xs text-slate-500">Musterstraße 12, 55116 Mainz</p>
          <p className="text-xs text-slate-500">USt-ID: DE123456789</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Rechnung</p>
          <p className="font-semibold">{number || "RE-YYYY-0000"}</p>
          <p className="text-xs text-slate-500">Fällig: {dueDate || "-"}</p>
          <p className="text-xs text-slate-500">Leistungsdatum: {serviceDate || "-"}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-500">Rechnung an</p>
        <p className="font-medium">{customer || "Kunde / Firma"}</p>
      </div>

      <table className="mb-4 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-slate-500">
            <th className="py-2">Position</th>
            <th className="py-2 text-right">Menge</th>
            <th className="py-2 text-right">Preis</th>
            <th className="py-2 text-right">USt.</th>
            <th className="py-2 text-right">Summe</th>
          </tr>
        </thead>
        <tbody>
          {items.filter((x) => x.description.trim()).map((item, idx) => {
            const amountNet = item.quantity * item.unitPrice;
            const amountTax = (amountNet * item.taxRate) / 100;
            const gross = amountNet + amountTax;
            return (
              <tr key={`${item.description}-${idx}`} className="border-b last:border-b-0">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity.toFixed(2)}</td>
                <td className="py-2 text-right">{item.unitPrice.toFixed(2)} EUR</td>
                <td className="py-2 text-right">{item.taxRate.toFixed(0)}%</td>
                <td className="py-2 text-right font-medium">{gross.toFixed(2)} EUR</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={`ml-auto w-full max-w-xs space-y-1 rounded-lg border p-3 text-sm ${template === "modern" ? "border-indigo-200 bg-indigo-50/60" : "border-slate-200"}`}>
        <div className="flex justify-between"><span>Netto</span><b>{totals.net.toFixed(2)} EUR</b></div>
        <div className="flex justify-between"><span>Umsatzsteuer</span><b>{totals.tax.toFixed(2)} EUR</b></div>
        <div className="flex justify-between border-t pt-1 text-base"><span>Brutto</span><b>{totals.gross.toFixed(2)} EUR</b></div>
      </div>

      <div className="mt-4 border-t pt-3 text-xs text-slate-500">
        <p>Zahlungsziel: {paymentTermDays} Tage (fällig bis {dueDate || "-"})</p>
        {discountPercent > 0 ? <p>Skonto: {discountPercent.toFixed(1)}% bei Sofortzahlung</p> : null}
        {note ? <p className="mt-1">{note}</p> : null}
        <div className="mt-3 border-t pt-2">
          <p>Bank: Musterbank AG • IBAN: DE12 5001 0517 1234 5678 90 • BIC: INGDDEFFXXX</p>
        </div>
      </div>
    </div>
  );
}

export function InvoicesPage() {
  const [companyId, setCompanyId] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Alle");
  const [customer, setCustomer] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentTermDays, setPaymentTermDays] = useState(14);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [template, setTemplate] = useState<TemplateMode>("clean");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0, taxRate: 19 }]);

  async function load(company: string) {
    const res = await fetch(`/api/invoices?companyId=${company}`);
    setInvoices(await res.json());
  }

  useEffect(() => {
    void (async () => {
      const boot = await fetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      setCompanyId(boot.companyId);
      await load(boot.companyId);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      invoices.filter(
        (i) =>
          (status === "Alle" || i.status === status) &&
          `${i.number}${i.customer}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [invoices, query, status],
  );

  const totals = useMemo(() => {
    const net = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100, 0);
    return { net, tax, gross: net + tax };
  }, [items]);

  const draftNumber = useMemo(
    () => `RE-${new Date().getFullYear()}-${String(invoices.length + 101).padStart(4, "0")}`,
    [invoices.length],
  );

  const printableHtml = useMemo(() => {
    const rows = items
      .filter((x) => x.description.trim())
      .map((item) => {
        const amountNet = item.quantity * item.unitPrice;
        const amountTax = (amountNet * item.taxRate) / 100;
        const gross = amountNet + amountTax;
        return `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${item.description}</td>
          <td style="padding:8px 0;text-align:right;border-bottom:1px solid #e2e8f0;">${item.quantity.toFixed(2)}</td>
          <td style="padding:8px 0;text-align:right;border-bottom:1px solid #e2e8f0;">${item.unitPrice.toFixed(2)} EUR</td>
          <td style="padding:8px 0;text-align:right;border-bottom:1px solid #e2e8f0;">${item.taxRate.toFixed(0)}%</td>
          <td style="padding:8px 0;text-align:right;border-bottom:1px solid #e2e8f0;">${gross.toFixed(2)} EUR</td>
        </tr>`;
      })
      .join("");

    return `<!doctype html>
      <html><head><meta charset="utf-8"/><title>${draftNumber}</title>
      <style>
      body{font-family:Inter,Arial,sans-serif;color:#0f172a;padding:24px}
      .head{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:16px}
      .small{font-size:12px;color:#64748b} table{width:100%;border-collapse:collapse;font-size:14px}
      .totals{max-width:360px;margin-left:auto;margin-top:12px}
      .totals div{display:flex;justify-content:space-between;padding:4px 0}
      </style></head><body>
      <div class="head"><div><div style="font-size:20px;font-weight:700;">DeskOffice GmbH</div><div class="small">Musterstraße 12, 55116 Mainz</div><div class="small">USt-ID: DE123456789</div></div>
      <div style="text-align:right"><div class="small">Rechnung</div><div style="font-size:18px;font-weight:700">${draftNumber}</div><div class="small">Fällig: ${dueDate || "-"}</div><div class="small">Leistungsdatum: ${serviceDate || "-"}</div></div></div>
      <div style="margin-bottom:16px"><div class="small">Rechnung an</div><div style="font-weight:600">${customer || "Kunde / Firma"}</div></div>
      <table><thead><tr style="text-align:left;font-size:12px;color:#64748b;border-bottom:1px solid #e2e8f0"><th style="padding-bottom:8px">Position</th><th style="padding-bottom:8px;text-align:right">Menge</th><th style="padding-bottom:8px;text-align:right">Preis</th><th style="padding-bottom:8px;text-align:right">USt.</th><th style="padding-bottom:8px;text-align:right">Summe</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="totals"><div><span>Netto</span><b>${totals.net.toFixed(2)} EUR</b></div><div><span>Umsatzsteuer</span><b>${totals.tax.toFixed(2)} EUR</b></div><div style="border-top:1px solid #e2e8f0;padding-top:8px"><span>Brutto</span><b>${totals.gross.toFixed(2)} EUR</b></div></div>
      <div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:10px" class="small">
      <div>Zahlungsziel: ${paymentTermDays} Tage (fällig bis ${dueDate || "-"})</div>
      ${discountPercent > 0 ? `<div>Skonto: ${discountPercent.toFixed(1)}% bei Sofortzahlung</div>` : ""}
      ${note ? `<div>${note}</div>` : ""}
      <div style="margin-top:8px">Bank: Musterbank AG • IBAN: DE12 5001 0517 1234 5678 90 • BIC: INGDDEFFXXX</div></div>
      </body></html>`;
  }, [customer, discountPercent, draftNumber, dueDate, items, note, paymentTermDays, serviceDate, totals.gross, totals.net, totals.tax]);

  const handlePdfExport = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleCreate = async () => {
    if (!companyId || !customer.trim() || !items.some((i) => i.description.trim())) return;
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        number: draftNumber,
        customer: customer.trim(),
        dueDate,
        status: "Entwurf",
        kind: "Rechnung",
        items: items.filter((i) => i.description.trim()),
      }),
    });
    setCustomer("");
    setDueDate(new Date().toISOString().slice(0, 10));
    setServiceDate(new Date().toISOString().slice(0, 10));
    setPaymentTermDays(14);
    setDiscountPercent(0);
    setItems([{ description: "", quantity: 1, unitPrice: 0, taxRate: 19 }]);
    setNote("");
    setTemplate("clean");
    setOpen(false);
    await load(companyId);
  };

  return (
    <div>
      <PageHeader
        title="Rechnungen"
        subtitle="Rechnungserstellung mit Vorlage und Live-Ansicht"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Neue Rechnung</Button></DialogTrigger>
            <DialogContent className="h-[94vh] max-h-[94vh] overflow-hidden p-3">
              <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Card className="no-scrollbar min-h-0 overflow-y-auto p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Rechnung erstellen</h3>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">
                      <Eye size={14} />
                      Live Vorschau
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rechnungsnummer</span>
                        <b>{draftNumber}</b>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Kunde / Firma</p>
                      <Input placeholder="Kunde / Firma" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Leistungsdatum</p>
                        <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Fälligkeitsdatum</p>
                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Zahlungsziel (Tage)</p>
                        <Input
                          type="number"
                          min={1}
                          step="1"
                          placeholder="Zahlungsziel (Tage)"
                          value={paymentTermDays}
                          onChange={(e) => setPaymentTermDays(Number(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Skonto in %</p>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          placeholder="Skonto %"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <textarea
                      className="min-h-16 w-full rounded-xl border border-border px-3 py-2 text-sm"
                      placeholder="Interne Notiz oder Zahlungsinfo"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Rechnungsvorlage</p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {[
                          { id: "clean", label: "Clean", style: "bg-white border-slate-300" },
                          { id: "modern", label: "Modern", style: "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-300" },
                          { id: "compact", label: "Compact", style: "bg-slate-50 border-slate-400" },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setTemplate(option.id as TemplateMode)}
                            className={`rounded-xl border px-3 py-3 text-left text-sm transition ${option.style} ${template === option.id ? "ring-2 ring-primary" : "hover:border-primary/50"}`}
                          >
                            <div className="font-medium">{option.label}</div>
                            <div className="mt-1 text-xs text-muted-foreground">Vorschau-Layout</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium">Positionen</p>
                        <Button
                          variant="outline"
                          className="h-8 px-2 text-xs"
                          onClick={() => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxRate: 19 }])}
                        >
                          <Plus size={14} className="mr-1" />
                          Position
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="grid gap-2 md:grid-cols-12">
                            <Input
                              className="md:col-span-5"
                              placeholder="Beschreibung"
                              value={item.description}
                              onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))}
                            />
                            <Input
                              className="md:col-span-2"
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="Menge"
                              value={item.quantity}
                              onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) || 0 } : x)))}
                            />
                            <Input
                              className="md:col-span-2"
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="Preis"
                              value={item.unitPrice}
                              onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) || 0 } : x)))}
                            />
                            <Input
                              className="md:col-span-2"
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="USt."
                              value={item.taxRate}
                              onChange={(e) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, taxRate: Number(e.target.value) || 0 } : x)))}
                            />
                            <Button
                              variant="outline"
                              className="md:col-span-1"
                              onClick={() =>
                                setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))
                              }
                            >
                              ×
                            </Button>
                            <div className="md:col-span-12 text-right text-xs text-muted-foreground">
                              Positionssumme: {((item.quantity * item.unitPrice) * (1 + item.taxRate / 100)).toFixed(2)} EUR
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3 text-sm">
                    <div className="flex justify-between"><span>Netto</span><b>{totals.net.toFixed(2)} EUR</b></div>
                    <div className="flex justify-between"><span>USt.</span><b>{totals.tax.toFixed(2)} EUR</b></div>
                    <div className="mt-1 flex justify-between border-t border-border pt-2 text-base"><span>Brutto gesamt</span><b>{totals.gross.toFixed(2)} EUR</b></div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" onClick={handlePdfExport}>PDF exportieren</Button>
                    <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                    <Button onClick={handleCreate}>Rechnung speichern</Button>
                  </div>
                </Card>

                <Card className="min-h-0 overflow-hidden p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <FileText size={16} />
                    Vorlagenansicht
                  </div>
                  <div className="no-scrollbar h-[calc(94vh-120px)] overflow-y-auto">
                    <InvoicePreview
                      number={draftNumber}
                      customer={customer}
                      dueDate={dueDate}
                      serviceDate={serviceDate}
                      paymentTermDays={paymentTermDays}
                      discountPercent={discountPercent}
                      items={items}
                      totals={totals}
                      template={template}
                      note={note}
                    />
                  </div>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <div className="mb-4 flex gap-3">
          <Input placeholder="Rechnung oder Kunde suchen..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="rounded-xl border border-border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {["Alle", "Entwurf", "Offen", "Bezahlt", "Ueberfaellig", "Storniert"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Nr.</th><th>Kunde</th><th>Netto</th><th>Steuer</th><th>Brutto</th><th>Faellig</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="py-3">{i.number}</td>
                <td>{i.customer}</td>
                <td>EUR {i.amountNet.toFixed(2)}</td>
                <td>EUR {i.amountTax.toFixed(2)}</td>
                <td>EUR {i.amountGross.toFixed(2)}</td>
                <td>{new Date(i.dueDate).toISOString().slice(0, 10)}</td>
                <td><StatusBadge status={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
