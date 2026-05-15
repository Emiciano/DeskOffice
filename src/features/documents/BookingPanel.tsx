import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookingRecord, DocumentItem } from "./types";

type Props = {
  document: DocumentItem;
  onBook: () => { ok: true } | { ok: false; errors: string[] };
  onMarkChecked: () => void;
  onRunOcr: () => void;
  isOcrRunning: boolean;
};

export function BookingPanel({ document, onBook, onRunOcr, onMarkChecked, isOcrRunning }: Props) {
  const booking = document.booking as BookingRecord | undefined;
  return (
    <Card>
      <h3 className="mb-3 text-sm font-medium">Buchung</h3>
      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={onRunOcr} disabled={isOcrRunning}>
          {isOcrRunning ? "OCR laeuft..." : "Daten automatisch auslesen"}
        </Button>
        <Button variant="outline" className="w-full" onClick={onMarkChecked}>
          Als geprueft markieren
        </Button>
      </div>
      <div className="mt-4 rounded-xl border border-border p-3 text-xs">
        <p className="font-medium">Buchungsstruktur</p>
        <p>Soll-Konto: {document.data.type === "Eingangsrechnung" ? document.data.account || "-" : "1200"}</p>
        <p>Haben-Konto: {document.data.type === "Eingangsrechnung" ? "1200" : document.data.account || "-"}</p>
        <p>Betrag: EUR {document.data.netAmount.toFixed(2)}</p>
        <p>Steuerbetrag: EUR {document.data.vatAmount.toFixed(2)}</p>
      </div>
      <Button
        className="mt-4 w-full"
        onClick={() => {
          const result = onBook();
          if (!result.ok) window.alert(`Validierung fehlgeschlagen:\n- ${result.errors.join("\n- ")}`);
          else window.alert("Beleg erfolgreich gebucht.");
        }}
      >
        Beleg buchen
      </Button>
      {booking ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
          <p className="font-medium">Buchung erstellt</p>
          <p>{booking.id} | {booking.bookingDate}</p>
          <p>{booking.bookingText}</p>
        </div>
      ) : null}
    </Card>
  );
}
