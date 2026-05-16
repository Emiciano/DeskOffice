import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FilePenLine, ZoomIn, ZoomOut } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DocumentItem } from "./types";

GlobalWorkerOptions.workerSrc = workerSrc;

type Props = {
  document: DocumentItem;
  onReplace: (file: File) => void;
};

export function PdfPreview({ document, onReplace }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageNumber = useMemo(() => Math.max(1, Math.min(page, totalPages)), [page, totalPages]);

  useEffect(() => {
    setPage(1);
    setError("");
  }, [document.id]);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      if (!canvasRef.current) return;
      setLoading(true);
      setError("");

      try {
        const loadingTask = getDocument({ url: document.pdfUrl });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        setTotalPages(pdf.numPages);

        const currentPage = await pdf.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;

        const viewport = currentPage.getViewport({ scale: zoom / 100 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await currentPage.render({
          canvasContext: context,
          viewport,
        }).promise;
      } catch {
        if (!cancelled) setError("PDF konnte nicht geladen werden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void renderPdf();
    return () => {
      cancelled = true;
    };
  }, [document.pdfUrl, pageNumber, zoom]);

  return (
    <Card className="h-full min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">PDF Vorschau</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 px-2" onClick={() => setZoom((z) => Math.max(50, z - 10))}><ZoomOut size={16} /></Button>
          <span className="text-xs text-muted-foreground">{zoom}%</span>
          <Button variant="outline" className="h-9 px-2" onClick={() => setZoom((z) => Math.min(200, z + 10))}><ZoomIn size={16} /></Button>
        </div>
      </div>

      <div className="mb-3 flex h-[min(62vh,620px)] items-start justify-center overflow-auto rounded-xl border border-border bg-muted/20 p-3">
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {!error ? <canvas ref={canvasRef} className="max-w-full rounded border border-border bg-white shadow-sm" /> : null}
        {loading ? <span className="ml-3 text-xs text-muted-foreground">Lade...</span> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-9" onClick={() => setPage((p) => Math.max(1, p - 1))}>Seite -</Button>
        <span className="text-xs text-muted-foreground">Seite {pageNumber} / {totalPages}</span>
        <Button variant="outline" className="h-9" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Seite +</Button>
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
