import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared";
import { apiFetch } from "@/lib/api";
import { useAccountingStore } from "../store/accountingStore";
import type { AccountFilters, ChartAccount, SkrType } from "../types/accountingTypes";

const defaultFilters: AccountFilters = { query: "", skrType: "Alle", year: "Alle", active: "Alle" };

export function AccountsPage() {
  const {
    accounts,
    updateAccount,
    selectedSkr,
    setSelectedSkr,
    selectedYear,
    setSelectedYear,
    hydrateFromApi,
    importAccounts,
    versions,
  } = useAccountingStore();

  const [filters, setFilters] = useState<AccountFilters>(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState<AccountFilters>(defaultFilters);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<ChartAccount | null>(null);
  const [draft, setDraft] = useState<Partial<ChartAccount>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [replaceCurrent, setReplaceCurrent] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase();
    return accounts
      .filter((a) => (filters.skrType === "Alle" || a.skrType === filters.skrType))
      .filter((a) => (filters.year === "Alle" || a.year === filters.year))
      .filter((a) => (filters.active === "Alle" || (filters.active === "Aktiv" ? a.active : !a.active)))
      .filter(
        (a) =>
          !q ||
          `${a.number} ${a.name} ${a.accountClass} ${a.accountType} ${a.taxKey ?? ""}`.toLowerCase().includes(q),
      )
      .sort((a, b) => a.number.localeCompare(b.number));
  }, [accounts, filters]);

  useEffect(() => {
    void hydrateFromApi();
  }, [hydrateFromApi]);

  async function handleImport() {
    setError("");
    setImporting(true);
    try {
      if (importFormat === "pdf") {
        if (!importFile) throw new Error("Bitte zuerst eine PDF auswählen.");
        const fileDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(new Error("PDF konnte nicht gelesen werden."));
          reader.readAsDataURL(importFile);
        });
        const res = await apiFetch("/api/accounts/import-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          timeoutMs: 180_000,
          body: JSON.stringify({
            companyId: "default-company",
            skrType: selectedSkr,
            year: selectedYear,
            replace: replaceCurrent,
            dataUrl: fileDataUrl,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "PDF-Import fehlgeschlagen");
        }
        await hydrateFromApi();
        setImportOpen(false);
        setImportText("");
        setImportFile(null);
        return;
      }

      await importAccounts({
        data: importText,
        format: importFormat,
        replace: replaceCurrent,
        skrType: selectedSkr,
        year: selectedYear,
      });
      setImportOpen(false);
      setImportText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import fehlgeschlagen");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kontenrahmen"
        subtitle="Offizielle SKR03/SKR04 Konten je Jahr importieren und verwalten"
        action={<Button onClick={() => setImportOpen(true)}>SKR Import (CSV/JSON/PDF)</Button>}
      />

      <Card>
        <div className="grid gap-3 md:grid-cols-6">
          <Input
            placeholder="Suche nach Nummer oder Name"
            value={pendingFilters.query}
            onChange={(e) => setPendingFilters((f) => ({ ...f, query: e.target.value }))}
          />
          <select
            className="rounded-xl border border-border px-3 text-sm"
            value={selectedSkr}
            onChange={(e) => setSelectedSkr(e.target.value as SkrType)}
          >
            <option>SKR03</option>
            <option>SKR04</option>
          </select>
          <Input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value) || new Date().getFullYear())}
          />
          <select
            className="rounded-xl border border-border px-3 text-sm"
            value={pendingFilters.skrType}
            onChange={(e) =>
              setPendingFilters((f) => ({ ...f, skrType: e.target.value as AccountFilters["skrType"] }))
            }
          >
            <option>Alle</option>
            <option>SKR03</option>
            <option>SKR04</option>
          </select>
          <select
            className="rounded-xl border border-border px-3 text-sm"
            value={pendingFilters.active}
            onChange={(e) =>
              setPendingFilters((f) => ({ ...f, active: e.target.value as AccountFilters["active"] }))
            }
          >
            <option>Alle</option>
            <option>Aktiv</option>
            <option>Inaktiv</option>
          </select>
          <div className="flex gap-2">
            <Button type="button" className="h-10" onClick={() => setFilters(pendingFilters)}>
              Übernehmen
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => {
                setPendingFilters(defaultFilters);
                setFilters(defaultFilters);
              }}
            >
              Zurücksetzen
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Gefundene Versionen:{" "}
          {versions.length > 0
            ? versions.map((v) => `${v.skrType}-${v.year} (${v.count})`).join(", ")
            : "Keine Konten importiert. Bitte offiziellen SKR importieren."}
        </p>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th>Konto</th>
                <th>Name</th>
                <th>SKR</th>
                <th>Jahr</th>
                <th>Klasse</th>
                <th>Typ</th>
                <th>Steuerschlüssel</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="py-3 font-medium">{a.number}</td>
                  <td>{a.name}</td>
                  <td>{a.skrType}</td>
                  <td>{a.year}</td>
                  <td>{a.accountClass || "-"}</td>
                  <td>{a.accountType || "-"}</td>
                  <td>{a.taxKey || "-"}</td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${a.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}
                    >
                      {a.active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setEdit(a);
                        setDraft(a);
                        setOpen(true);
                      }}
                    >
                      Bearbeiten
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Keine Konten vorhanden. Bitte offiziellen SKR03/SKR04-Kontenrahmen importieren.
          </p>
        ) : null}
      </Card>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <h3 className="mb-3 text-lg font-semibold">Kontenrahmen importieren</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="h-10 rounded-xl border border-border px-3 text-sm"
              value={importFormat}
              onChange={(e) => setImportFormat(e.target.value as "csv" | "json" | "pdf")}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={replaceCurrent} onChange={(e) => setReplaceCurrent(e.target.checked)} />
              Version ersetzen ({selectedSkr}-{selectedYear})
            </label>
          </div>
          <textarea
            className="mt-3 min-h-64 w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={
              importFormat === "pdf"
                ? "PDF-Import: Datei wählen, Kontozeilen werden automatisch extrahiert."
                : "Offizielle SKR CSV/JSON Daten hier einfügen oder per Upload erweitern."
            }
            readOnly={importFormat === "pdf"}
          />
          <input
            type="file"
            accept={
              importFormat === "csv"
                ? ".csv,text/csv,text/plain"
                : importFormat === "json"
                  ? ".json,application/json,text/plain"
                  : ".pdf,application/pdf"
            }
            className="mt-2 block w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              if (importFormat === "pdf") {
                setImportFile(file);
                setImportText(`Ausgewählt: ${file.name}`);
                return;
              }

              const reader = new FileReader();
              reader.onload = () => setImportText(String(reader.result ?? ""));
              reader.readAsText(file, "utf-8");
            }}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => void handleImport()} disabled={!importText.trim() || importing}>
              {importing ? "Import läuft..." : "Importieren"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <h3 className="mb-3 text-lg font-semibold">Konto bearbeiten</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <Input
              value={draft.accountClass ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, accountClass: e.target.value }))}
            />
            <Input
              value={draft.accountType ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, accountType: e.target.value }))}
            />
            <Input value={draft.taxKey ?? ""} onChange={(e) => setDraft((d) => ({ ...d, taxKey: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(draft.active)}
                onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              />
              Aktiv
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (!edit) return;
                void updateAccount(edit.id, draft);
                setOpen(false);
              }}
            >
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
