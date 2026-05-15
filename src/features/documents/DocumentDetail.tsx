import { BookingPanel } from "./BookingPanel";
import { DocumentForm } from "./DocumentForm";
import { PdfPreview } from "./PdfPreview";
import type { DocumentData, DocumentItem } from "./types";

type Props = {
  document: DocumentItem | null;
  isOcrRunning: boolean;
  onReplaceFile: (file: File) => void;
  onChangeData: (patch: Partial<DocumentData>) => void;
  onRunOcr: () => void;
  onMarkChecked: () => void;
  onBook: () => { ok: true } | { ok: false; errors: string[] };
};

export function DocumentDetail({ document, isOcrRunning, onReplaceFile, onChangeData, onRunOcr, onMarkChecked, onBook }: Props) {
  if (!document) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm text-muted-foreground">
        Kein Beleg ausgewaehlt. Lade einen Beleg hoch oder waehle einen Eintrag aus der Liste.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="xl:col-span-3">
        <PdfPreview document={document} onReplace={onReplaceFile} />
      </div>
      <div className="space-y-4 xl:col-span-2">
        <DocumentForm data={document.data} confidence={document.ocrConfidence} onChange={onChangeData} />
        <BookingPanel document={document} onBook={onBook} onRunOcr={onRunOcr} onMarkChecked={onMarkChecked} isOcrRunning={isOcrRunning} />
      </div>
    </div>
  );
}
