import { BookingPanel } from "./BookingPanel";
import { DocumentForm } from "./DocumentForm";
import { PdfPreview } from "./PdfPreview";
import type { DocumentData, DocumentItem } from "./types";

type Props = {
  document: DocumentItem | null;
  onReplaceFile: (file: File) => void;
  onChangeData: (patch: Partial<DocumentData>) => void;
  onMarkChecked: () => void;
  onRunOcr: () => void;
  onBook: () => { ok: true } | { ok: false; errors: string[] };
};

export function DocumentDetail({ document, onReplaceFile, onChangeData, onMarkChecked, onRunOcr, onBook }: Props) {
  if (!document) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm text-muted-foreground">
        Kein Beleg ausgewählt. Lade einen Beleg hoch oder wähle einen Eintrag aus der Liste.
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.95fr)]">
      <div className="min-h-0 min-w-0">
        <PdfPreview document={document} onReplace={onReplaceFile} />
      </div>
      <div className="no-scrollbar min-h-0 min-w-0 space-y-3 overflow-y-auto pr-1">
        <DocumentForm data={document.data} confidence={document.ocrConfidence} onChange={onChangeData} />
        <BookingPanel document={document} onBook={onBook} onMarkChecked={onMarkChecked} onRunOcr={onRunOcr} />
      </div>
    </div>
  );
}
