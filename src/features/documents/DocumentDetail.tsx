import { BookingPanel } from "./BookingPanel";
import { DocumentForm } from "./DocumentForm";
import { PdfPreview } from "./PdfPreview";
import type { DocumentData, DocumentItem } from "./types";

type Props = {
  document: DocumentItem | null;
  onReplaceFile: (file: File) => void;
  onChangeData: (patch: Partial<DocumentData>) => void;
  onMarkChecked: () => void;
  onBook: () => { ok: true } | { ok: false; errors: string[] };
};

export function DocumentDetail({ document, onReplaceFile, onChangeData, onMarkChecked, onBook }: Props) {
  if (!document) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm text-muted-foreground">
        Kein Beleg ausgewaehlt. Lade einen Beleg hoch oder waehle einen Eintrag aus der Liste.
      </div>
    );
  }

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
      <div className="min-w-0">
        <PdfPreview document={document} onReplace={onReplaceFile} />
      </div>
      <div className="min-w-0 space-y-4">
        <DocumentForm data={document.data} confidence={document.ocrConfidence} onChange={onChangeData} />
        <BookingPanel document={document} onBook={onBook} onMarkChecked={onMarkChecked} />
      </div>
    </div>
  );
}
