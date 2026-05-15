import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { expenses } from "@/data/seedData";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";

export function ExpensesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<string[]>([]);

  return (
    <div>
      <PageHeader title="Ausgaben & Belege" subtitle="Belege erfassen, kategorisieren und pruefen" />
      <Card className="mb-4 border-dashed">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-muted p-6 text-center">
          <p className="text-sm text-muted-foreground">Dateien per Drag-and-Drop oder Dateiauswahl hochladen</p>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Datei waehlen
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files ?? []).map((f) => f.name);
              setFiles(selected);
            }}
          />
          {files.length > 0 && <p className="text-xs text-muted-foreground">{files.join(", ")}</p>}
        </div>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Beleg</th>
              <th>Kategorie</th>
              <th>Betrag</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="py-3">{e.vendor}</td>
                <td>{e.category}</td>
                <td>EUR {e.amount}</td>
                <td>
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
