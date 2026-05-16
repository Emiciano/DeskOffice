import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccountAutocomplete } from "@/features/accounting/components/AccountAutocomplete";
import type { DocumentData } from "./types";

type Props = {
  data: DocumentData;
  confidence?: Record<keyof DocumentData, number>;
  onChange: (patch: Partial<DocumentData>) => void;
};

const low = (v?: number) => (v ?? 1) < 0.75;
const frame = (name: keyof DocumentData, confidence?: Record<keyof DocumentData, number>) =>
  low(confidence?.[name]) ? "border-amber-400 ring-1 ring-amber-200" : "";

const supplierHints = ["CloudStack GmbH", "Nordlicht Media GmbH", "Musterlieferant AG"];
const categories = ["Software", "Werbung", "Büro", "Reisekosten", "Beratung", "Sonstiges"];

export function DocumentForm({ data, confidence, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-4 text-lg font-semibold">Belegdaten</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Lieferant</label>
            <input
              list="supplier-hints"
              className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("partner", confidence)}`}
              value={data.partner}
              placeholder="Lieferant eingeben oder wählen"
              onChange={(e) => onChange({ partner: e.target.value })}
            />
            <datalist id="supplier-hints">
              {supplierHints.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Belegtyp</label>
            <select
              className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("type", confidence)}`}
              value={data.type}
              onChange={(e) => onChange({ type: e.target.value as DocumentData["type"] })}
            >
              {["Eingangsrechnung", "Ausgangsrechnung", "Quittung", "Gutschrift", "Sonstiger Beleg"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Belegnummer</label>
            <Input className={frame("invoiceNumber", confidence)} value={data.invoiceNumber} onChange={(e) => onChange({ invoiceNumber: e.target.value })} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Belegdatum</label>
            <Input className={frame("documentDate", confidence)} type="date" value={data.documentDate} onChange={(e) => onChange({ documentDate: e.target.value })} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Fälligkeitsdatum</label>
            <Input className={frame("dueDate", confidence)} type="date" value={data.dueDate} onChange={(e) => onChange({ dueDate: e.target.value })} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Beschreibung (optional)</label>
            <textarea
              className={`min-h-20 w-full rounded-xl border border-border px-3 py-2 text-sm ${frame("notes", confidence)}`}
              maxLength={255}
              value={data.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{data.notes.length} / 255</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold">Kategorisierung</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Kategorie</label>
            <select className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("category", confidence)}`} value={data.category} onChange={(e) => onChange({ category: e.target.value })}>
              <option value="">Suchbegriff, Kategorie oder Sachkonto ...</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Buchungskonto</label>
            <div className={frame("account", confidence)}>
              <AccountAutocomplete
                value={data.account}
                onSelect={(account) => {
                  onChange({
                    account: account.number,
                    category: data.category || account.category,
                    vatAmount: data.vatAmount || Number(((data.netAmount * account.taxRate) / 100).toFixed(2)),
                  });
                }}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Kostenstelle</label>
            <Input className={frame("costCenter", confidence)} value={data.costCenter} onChange={(e) => onChange({ costCenter: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nettobetrag</label>
            <Input className={frame("netAmount", confidence)} type="number" value={data.netAmount} onChange={(e) => onChange({ netAmount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Umsatzsteuer</label>
            <Input className={frame("vatAmount", confidence)} type="number" value={data.vatAmount} onChange={(e) => onChange({ vatAmount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Gesamtbetrag inkl. Steuer</label>
            <Input className={frame("grossAmount", confidence)} type="number" value={data.grossAmount} onChange={(e) => onChange({ grossAmount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Währung</label>
            <select className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("currency", confidence)}`} value={data.currency} onChange={(e) => onChange({ currency: e.target.value })}>
              <option>EUR</option>
              <option>USD</option>
              <option>CHF</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold">Belegstatus</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Zahlungsstatus</label>
            <select className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("paymentStatus", confidence)}`} value={data.paymentStatus} onChange={(e) => onChange({ paymentStatus: e.target.value as DocumentData["paymentStatus"] })}>
              {["Offen", "Teilweise bezahlt", "Bezahlt"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Zahlungsart</label>
            <select className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("paymentMethod", confidence)}`} value={data.paymentMethod} onChange={(e) => onChange({ paymentMethod: e.target.value as DocumentData["paymentMethod"] })}>
              <option value="Ueberweisung">Überweisung</option>
              <option value="Lastschrift">Lastschrift</option>
              <option value="Kreditkarte">Kreditkarte</option>
              <option value="Bar">Bar</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
