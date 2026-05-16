import { useMemo } from "react";
import { Download, FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DocumentItem } from "./types";

type Props = {
  document: DocumentItem;
  onReplace: (file: File) => void;
};

export function PdfPreview({ document, onReplace }: Props) {
  const pdfSrc = useMemo(() => `${document.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`, [document.pdfUrl]);

  return (
    <Card className="h-full min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">PDF Vorschau</h3>
      </div>

      <div className="mb-3 h-[min(62vh,620px)] overflow-auto rounded-xl border border-border bg-muted/20 p-3">
        <object data={pdfSrc} type="application/pdf" className="h-[900px] w-full rounded border border-border bg-white">
          <iframe title={document.fileName} src={pdfSrc} className="h-[900px] w-full rounded border border-border bg-white" />
        </object>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a href={document.pdfUrl} download={document.fileName}>
          <Button variant="outline" className="h-9"><Download size={14} className="mr-2" />Download</Button>
        </a>
        <label className="inline-flex">
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onReplace(file);
            }}
          />
          <span className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-border bg-white px-3 text-sm">
            <FilePenLine size={14} className="mr-2" />Datei ersetzen
          </span>
        </label>
      </div>
    </Card>
  );
}
