import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared";
import type { DocumentItem } from "./types";

type Props = {
  document: DocumentItem;
  onStartCapture: () => void;
};

export function DocumentInspector({ document, onStartCapture }: Props) {
  return (
    <Card className="h-fit">
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
    </Card>
  );
}
