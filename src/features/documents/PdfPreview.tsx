import { useState } from "react";
import { Download, FilePenLine, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DocumentItem } from "./types";

type Props = {
  document: DocumentItem;
  onReplace: (file: File) => void;
};

export function PdfPreview({ document, onReplace }: Props) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);

  return (
    <Card className="h-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">PDF Vorschau</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 px-2" onClick={() => setZoom((z) => Math.max(60, z - 10))}><ZoomOut size={16} /></Button>
          <span className="text-xs text-muted-foreground">{zoom}%</span>
          <Button variant="outline" className="h-9 px-2" onClick={() => setZoom((z) => Math.min(200, z + 10))}><ZoomIn size={16} /></Button>
        </div>
      </div>
      <div className="mb-3 h-[520px] overflow-auto rounded-xl border border-border bg-muted/20 p-2">
        <iframe title={document.fileName} src={document.pdfUrl} className="w-full border-0" style={{ height: `${zoom * 5}px` }} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-9" onClick={() => setPage((p) => Math.max(1, p - 1))}>Seite -</Button>
        <span className="text-xs text-muted-foreground">Seite {page} / {document.pageCount}</span>
        <Button variant="outline" className="h-9" onClick={() => setPage((p) => Math.min(document.pageCount, p + 1))}>Seite +</Button>
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
