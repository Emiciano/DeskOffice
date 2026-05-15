import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  onUploadDone: (payload: { fileName: string; pdfUrl: string; size: number }) => void;
};

export function DocumentUpload({ onUploadDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingName, setUploadingName] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Es sind nur PDF-Dateien erlaubt.");
      return;
    }
    setError("");
    setUploadingName(file.name);
    setProgress(0);
    const url = URL.createObjectURL(file);
    const interval = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(interval);
          onUploadDone({ fileName: file.name, pdfUrl: url, size: file.size });
          setUploadingName("");
          return 100;
        }
        return p + 20;
      });
    }, 120);
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
        <Button variant="outline" className="mt-2 h-9" onClick={() => inputRef.current?.click()}>
          Beleg auswählen
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploadingName ? (
          <div className="mt-4 text-left">
            <p className="mb-1 text-xs text-muted-foreground">Upload: {uploadingName}</p>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      </div>
    </Card>
  );
}
