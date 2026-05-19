import { useEffect, useMemo, useState } from "react";
import { Download, FilePenLine, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { DocumentItem } from "./types";

type Props = {
  document: DocumentItem;
  onReplace: (file: File) => void;
};

export function PdfPreview({ document, onReplace }: Props) {
  const [zoom, setZoom] = useState(100);
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState(document.pdfUrl);
  const [downloadUrl, setDownloadUrl] = useState(document.pdfUrl);
  const [pdfError, setPdfError] = useState("");
  const pdfSrc = useMemo(() => resolvedPdfUrl, [resolvedPdfUrl]);
  const pageScale = zoom / 100;

  useEffect(() => {
    let cancelled = false;
    setPdfError("");
    setResolvedPdfUrl(document.pdfUrl);
    setDownloadUrl(document.pdfUrl);

    if (!document.pdfUrl || !document.pdfUrl.startsWith("/api/documents/")) {
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const res = await apiFetch(document.pdfUrl);
        if (!res.ok) throw new Error("Datei konnte nicht geladen werden");
        const body = (await res.json()) as { dataUrl?: string };
        if (!cancelled && body.dataUrl) {
          setResolvedPdfUrl(body.dataUrl);
          setDownloadUrl(body.dataUrl);
        }
      } catch {
        if (!cancelled) setPdfError("PDF konnte nicht geladen werden.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [document.pdfUrl]);

  return (
    <Card className="flex h-full min-w-0 flex-col p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">PDF Vorschau</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 px-2" onClick={() => setZoom((z) => Math.max(70, z - 10))}>
            <ZoomOut size={16} />
          </Button>
          <span className="w-12 text-center text-xs text-muted-foreground">{zoom}%</span>
          <Button variant="outline" className="h-9 px-2" onClick={() => setZoom((z) => Math.min(180, z + 10))}>
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>

      <div className="no-scrollbar mb-2 h-[calc(96vh-250px)] overflow-auto rounded-xl border border-border bg-muted/20 p-2">
        <div
          className="origin-top-left"
          style={{
            transform: `scale(${pageScale})`,
            width: `${100 / pageScale}%`,
          }}
        >
          {pdfSrc ? (
            <iframe title={document.fileName} src={pdfSrc} className="h-[1120px] w-full rounded border border-border bg-white" />
          ) : (
            <div className="flex h-[1120px] items-center justify-center rounded border border-border bg-white text-sm text-muted-foreground">
              Keine PDF-Vorschau verfügbar.
            </div>
          )}
        </div>
      </div>
      {pdfError ? <p className="mb-2 text-xs text-rose-600">{pdfError}</p> : null}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <a href={downloadUrl || resolvedPdfUrl || document.pdfUrl} download={document.fileName} target="_blank" rel="noreferrer">
          <Button variant="outline" className="h-9">
            <Download size={14} className="mr-2" />
            Download
          </Button>
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
            <FilePenLine size={14} className="mr-2" />
            Datei ersetzen
          </span>
        </label>
      </div>
    </Card>
  );
}
