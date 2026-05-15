import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { DocumentData } from "./types";

type Props = {
  data: DocumentData;
  confidence?: Record<keyof DocumentData, number>;
  onChange: (patch: Partial<DocumentData>) => void;
};

const low = (v?: number) => (v ?? 1) < 0.75;

export function DocumentForm({ data, onChange, confidence }: Props) {
  const fieldCls = (name: keyof DocumentData) => (low(confidence?.[name]) ? "border-amber-400 ring-1 ring-amber-200" : "");

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium">Belegdaten</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <select className={`h-10 rounded-xl border border-border px-3 text-sm ${fieldCls("type")}`} value={data.type} onChange={(e) => onChange({ type: e.target.value as DocumentData["type"] })}>
          {["Eingangsrechnung", "Ausgangsrechnung", "Quittung", "Gutschrift", "Sonstiger Beleg"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <Input className={fieldCls("invoiceNumber")} placeholder="Rechnungsnummer" value={data.invoiceNumber} onChange={(e) => onChange({ invoiceNumber: e.target.value })} />
        <Input className={fieldCls("documentDate")} type="date" value={data.documentDate} onChange={(e) => onChange({ documentDate: e.target.value })} />
        <Input className={fieldCls("dueDate")} type="date" value={data.dueDate} onChange={(e) => onChange({ dueDate: e.target.value })} />
        <Input className={fieldCls("partner")} placeholder="Lieferant/Kunde" value={data.partner} onChange={(e) => onChange({ partner: e.target.value })} />
        <Input className={fieldCls("category")} placeholder="Kategorie" value={data.category} onChange={(e) => onChange({ category: e.target.value })} />
        <Input className={fieldCls("netAmount")} type="number" placeholder="Betrag netto" value={data.netAmount} onChange={(e) => onChange({ netAmount: Number(e.target.value) })} />
        <Input className={fieldCls("vatAmount")} type="number" placeholder="Umsatzsteuer" value={data.vatAmount} onChange={(e) => onChange({ vatAmount: Number(e.target.value) })} />
        <Input className={fieldCls("grossAmount")} type="number" placeholder="Betrag brutto" value={data.grossAmount} onChange={(e) => onChange({ grossAmount: Number(e.target.value) })} />
        <Input className={fieldCls("currency")} placeholder="Waehrung" value={data.currency} onChange={(e) => onChange({ currency: e.target.value })} />
        <select className={`h-10 rounded-xl border border-border px-3 text-sm ${fieldCls("paymentStatus")}`} value={data.paymentStatus} onChange={(e) => onChange({ paymentStatus: e.target.value as DocumentData["paymentStatus"] })}>
          {["Offen", "Teilweise bezahlt", "Bezahlt"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={`h-10 rounded-xl border border-border px-3 text-sm ${fieldCls("paymentMethod")}`} value={data.paymentMethod} onChange={(e) => onChange({ paymentMethod: e.target.value as DocumentData["paymentMethod"] })}>
          {["Ueberweisung", "Lastschrift", "Kreditkarte", "Bar", "Sonstiges"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <Input className={fieldCls("account")} placeholder="Buchungskonto" value={data.account} onChange={(e) => onChange({ account: e.target.value })} />
        <Input className={fieldCls("costCenter")} placeholder="Kostenstelle" value={data.costCenter} onChange={(e) => onChange({ costCenter: e.target.value })} />
        <textarea
          className={`min-h-24 rounded-xl border border-border px-3 py-2 text-sm md:col-span-2 ${fieldCls("notes")}`}
          placeholder="Notizen"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
      {confidence ? (
        <p className="mt-3 text-xs text-amber-700">Gelb markierte Felder haben niedrige OCR-Sicherheit und sollten geprueft werden.</p>
      ) : null}
    </Card>
  );
}
