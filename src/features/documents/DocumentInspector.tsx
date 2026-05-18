import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared";
import type { DocumentItem } from "./types";

type Props = {
  document: DocumentItem | null;
  onStartCapture: () => void;
};

const formatDateDe = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("de-DE").format(date);
};

const formatMoneyDe = (value: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value || 0);

export function DocumentInspector({ document, onStartCapture }: Props) {
  if (!document) return null;

  return (
    <Card className="h-fit">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Belegdetails</h3>
        <StatusBadge status={document.status} />
      </div>
      <Button className="mb-4 w-full" onClick={onStartCapture}>
        Beleg erfassen
      </Button>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-3 border-b border-border pb-2">
          <span className="text-muted-foreground">Dokument</span>
          <span className="max-w-[180px] truncate font-medium">{document.fileName}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Erstellt am</span>
          <span className="font-semibold">{formatDateDe(document.uploadedAt)}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Belegtyp</span>
          <span className="font-semibold">{document.data.type}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Kontakt</span>
          <span className="font-semibold">{document.supplierOrCustomer || "-"}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Belegdatum</span>
          <span className="font-semibold">{formatDateDe(document.date)}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Fälligkeit</span>
          <span className="font-semibold">{formatDateDe(document.dueDate)}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Betrag</span>
          <span className="font-semibold">{formatMoneyDe(document.data.grossAmount || document.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Art der Ausgabe</span>
          <span className="font-semibold">{document.category || "-"}</span>
        </div>
      </div>
    </Card>
  );
}
