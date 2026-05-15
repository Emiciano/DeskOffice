import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared";
import type { DocumentItem } from "./types";

type Props = {
  document: DocumentItem | null;
  onStartCapture: () => void;
  group: "Alle" | "Ausgangsbelege" | "Eingangsbelege";
  subType: string;
  onTypeChange: (group: "Alle" | "Ausgangsbelege" | "Eingangsbelege", subType: string) => void;
};

const outgoing = ["Angebote", "Auftragsbestätigungen", "Rechnungen", "Lieferscheine", "Rechnungskorrekturen"];
const incoming = ["Ausgaben", "Ausgabenminderung", "Einnahmen", "Einnahmenminderung"];

export function DocumentInspector({ document, onStartCapture, group, subType, onTypeChange }: Props) {
  return (
    <Card className="h-fit">
      <div className="mb-4 space-y-1 text-sm">
        <button className="block font-medium" onClick={() => onTypeChange("Ausgangsbelege", "")}>Ausgangsbelege</button>
        {group === "Ausgangsbelege" ? (
          <div className="ml-5 space-y-1">
            {outgoing.map((item) => (
              <button key={item} className={`block text-left ${subType === item ? "font-medium text-foreground" : "text-muted-foreground"}`} onClick={() => onTypeChange("Ausgangsbelege", item)}>
                {item}
              </button>
            ))}
          </div>
        ) : null}
        <button className="mt-2 block font-medium" onClick={() => onTypeChange("Eingangsbelege", "")}>Eingangsbelege</button>
        {group === "Eingangsbelege" ? (
          <div className="ml-5 space-y-1">
            {incoming.map((item) => (
              <button key={item} className={`block text-left ${subType === item ? "font-medium text-foreground" : "text-muted-foreground"}`} onClick={() => onTypeChange("Eingangsbelege", item)}>
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {document ? (
        <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Belegdetails</h3>
        <StatusBadge status={document.status} />
      </div>
      <Button className="mb-4 w-full" onClick={onStartCapture}>
        Beleg erfassen
      </Button>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Dokument</span><span className="font-medium">{document.fileName}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Erstellt am</span><span className="font-medium">{document.uploadedAt}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Typ</span><span className="font-medium">{document.data.type}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Partner</span><span className="font-medium">{document.supplierOrCustomer || "-"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Belegdatum</span><span className="font-medium">{document.date || "-"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Faelligkeit</span><span className="font-medium">{document.dueDate || "-"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Betrag</span><span className="font-medium">EUR {document.amount.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Kategorie</span><span className="font-medium">{document.category || "-"}</span></div>
      </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Wähle einen Beleg aus der Liste.</p>
      )}
    </Card>
  );
}
