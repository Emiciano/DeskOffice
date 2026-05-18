import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  onUploadDone: (payload: { fileName: string; pdfUrl: string; fileDataUrl: string; size: number }) => void | Promise<void>;
  disabled?: boolean;
};

export function DocumentUpload({ onUploadDone, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingName, setUploadingName] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (disabled) {
      setError("Firma wird geladen. Bitte kurz warten.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Es sind nur PDF-Dateien erlaubt.");
      return;
    }

    setError("");
    setUploadingName(file.name);
    setProgress(0);

    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const fileDataUrl = String(reader.result ?? "");
      const interval = window.setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            window.clearInterval(interval);
            void (async () => {
              try {
                await onUploadDone({ fileName: file.name, pdfUrl: url, fileDataUrl, size: file.size });
                setUploadingName("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
                setUploadingName("");
              }
            })();
            return 100;
          }
          return p + 20;
        });
      }, 120);
    };
    reader.onerror = () => {
      setError("Datei konnte nicht gelesen werden.");
      setUploadingName("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="p-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`rounded-xl border border-dashed p-3 text-center ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-3">
          <Upload size={18} />
          <p className="text-sm text-muted-foreground">PDF hier ablegen oder per Dateiauswahl hochladen</p>
        </div>

        <Button variant="outline" className="mt-2 h-9" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Beleg auswaehlen
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploadingName ? (
          <div className="mt-4 text-left">
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}

        {disabled ? <p className="mt-2 text-xs text-muted-foreground">Firma wird geladen...</p> : null}
        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      </div>
    </Card>
  );
}
