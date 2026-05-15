import { Card } from "@/components/ui/card";

type Group = "Alle" | "Ausgangsbelege" | "Eingangsbelege";

type Props = {
  group: Group;
  subType: string;
  onChange: (group: Group, subType: string) => void;
};

const outgoing = ["Angebote", "Auftragsbestätigungen", "Rechnungen", "Lieferscheine", "Rechnungskorrekturen"];
const incoming = ["Ausgaben", "Ausgabenminderung", "Einnahmen", "Einnahmenminderung"];

export function DocumentTypeNav({ group, subType, onChange }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className={`${group === "Ausgangsbelege" ? "ring-2 ring-primary/30" : ""}`}>
        <button className="mb-2 text-left text-lg font-medium" onClick={() => onChange("Ausgangsbelege", "")}>
          Ausgangsbelege
        </button>
        <div className="space-y-1">
          {outgoing.map((item) => (
            <button
              key={item}
              className={`block text-left text-sm ${group === "Ausgangsbelege" && subType === item ? "font-medium text-foreground" : "text-muted-foreground"}`}
              onClick={() => onChange("Ausgangsbelege", item)}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>
      <Card className={`${group === "Eingangsbelege" ? "ring-2 ring-primary/30" : ""}`}>
        <button className="mb-2 text-left text-lg font-medium" onClick={() => onChange("Eingangsbelege", "")}>
          Eingangsbelege
        </button>
        <div className="space-y-1">
          {incoming.map((item) => (
            <button
              key={item}
              className={`block text-left text-sm ${group === "Eingangsbelege" && subType === item ? "font-medium text-foreground" : "text-muted-foreground"}`}
              onClick={() => onChange("Eingangsbelege", item)}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
