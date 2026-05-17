import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

type TaxSnapshot = {
  periodLabel: string;
  vatOutput19: number;
  vatInput: number;
  vatLiability: number;
  euerRevenue: number;
  euerExpense: number;
};

type Rule = {
  id: string;
  name: string;
  pattern: string;
  accountNumber?: string | null;
  category?: string | null;
  confidence: number;
  active: boolean;
};

type ExportItem = {
  id: string;
  exportType: string;
  status: string;
  fileName: string;
  periodLabel: string;
  createdAt: string;
};

type TaxOverview = {
  year: number;
  totals: {
    vatLiability: number;
    euerRevenue: number;
    euerExpense: number;
    euerProfit: number;
  };
  months: Array<{
    month: number;
    periodLabel: string;
    vatLiability: number;
    euerRevenue: number;
    euerExpense: number;
  }>;
};

type TaxForecast = {
  year: number;
  basedOnMonths: number;
  forecast: {
    vatLiability: number;
    euerRevenue: number;
    euerExpense: number;
    euerProfit: number;
  };
};

export function ReportsPage() {
  const [companyId, setCompanyId] = useState("");
  const [snapshot, setSnapshot] = useState<TaxSnapshot | null>(null);
  const [overview, setOverview] = useState<TaxOverview | null>(null);
  const [forecast, setForecast] = useState<TaxForecast | null>(null);
  const [mode, setMode] = useState<"monat" | "quartal">("monat");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleName, setRuleName] = useState("");
  const [rulePattern, setRulePattern] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");
  const [ruleAccount, setRuleAccount] = useState("");
  const [ruleActionLoading, setRuleActionLoading] = useState("");
  const [exportsHistory, setExportsHistory] = useState<ExportItem[]>([]);

  const quarterMonths = useMemo(() => {
    const quarter = Math.floor((month - 1) / 3);
    const start = quarter * 3 + 1;
    return [start, start + 1, start + 2];
  }, [month]);

  async function loadRules(company: string) {
    const res = await apiFetch(`/api/rules?companyId=${company}`);
    setRules(await res.json());
  }

  async function loadExports(company: string) {
    const res = await apiFetch(`/api/exports?companyId=${company}`);
    setExportsHistory(await res.json());
  }

  async function loadTax(company: string, y: number, m: number) {
    const res = await apiFetch(`/api/taxes/snapshot?companyId=${company}&year=${y}&month=${m}`);
    return (await res.json()) as TaxSnapshot;
  }

  async function loadTaxSummary(company: string, y: number) {
    const [overviewRes, forecastRes] = await Promise.all([
      apiFetch(`/api/taxes/overview?companyId=${company}&year=${y}`),
      apiFetch(`/api/taxes/forecast?companyId=${company}&year=${y}`),
    ]);
    setOverview((await overviewRes.json()) as TaxOverview);
    setForecast((await forecastRes.json()) as TaxForecast);
  }

  async function refresh(company: string, y: number, m: number, currentMode: "monat" | "quartal") {
    if (currentMode === "monat") {
      setSnapshot(await loadTax(company, y, m));
      return;
    }

    const all = await Promise.all(quarterMonths.map((mm) => loadTax(company, y, mm)));
    const aggregated: TaxSnapshot = {
      periodLabel: `Q${Math.floor((m - 1) / 3) + 1} ${y}`,
      vatOutput19: Number(all.reduce((s, x) => s + x.vatOutput19, 0).toFixed(2)),
      vatInput: Number(all.reduce((s, x) => s + x.vatInput, 0).toFixed(2)),
      vatLiability: Number(all.reduce((s, x) => s + x.vatLiability, 0).toFixed(2)),
      euerRevenue: Number(all.reduce((s, x) => s + x.euerRevenue, 0).toFixed(2)),
      euerExpense: Number(all.reduce((s, x) => s + x.euerExpense, 0).toFixed(2)),
    };
    setSnapshot(aggregated);
  }

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      setCompanyId(boot.companyId);
      await Promise.all([
        refresh(boot.companyId, year, month, mode),
        loadTaxSummary(boot.companyId, year),
        loadRules(boot.companyId),
        loadExports(boot.companyId),
      ]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!companyId) return;
    void Promise.all([refresh(companyId, year, month, mode), loadTaxSummary(companyId, year)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, year, month, mode]);

  async function createRule() {
    if (!companyId || !ruleName || !rulePattern) return;
    await apiFetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        name: ruleName,
        pattern: rulePattern,
        accountNumber: ruleAccount || null,
        category: ruleCategory || null,
        confidence: 0.9,
        active: true,
      }),
    });
    setRuleName("");
    setRulePattern("");
    setRuleCategory("");
    setRuleAccount("");
    await loadRules(companyId);
  }

  async function toggleRule(ruleId: string, active: boolean) {
    if (!companyId) return;
    setRuleActionLoading(ruleId);
    try {
      await apiFetch(`/api/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      await loadRules(companyId);
    } finally {
      setRuleActionLoading("");
    }
  }

  async function deleteRule(ruleId: string) {
    if (!companyId) return;
    setRuleActionLoading(ruleId);
    try {
      await apiFetch(`/api/rules/${ruleId}`, { method: "DELETE" });
      await loadRules(companyId);
    } finally {
      setRuleActionLoading("");
    }
  }

  async function createExport(exportType: "DATEV" | "CSV") {
    if (!companyId) return;
    const periodLabel =
      mode === "monat" ? `${year}-${String(month).padStart(2, "0")}` : `Q${Math.floor((month - 1) / 3) + 1}-${year}`;
    await apiFetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        exportType,
        periodLabel,
      }),
    });
    await loadExports(companyId);
  }

  async function downloadExport(id: string, fileName: string) {
    const res = await apiFetch(`/api/exports/${id}/download?companyId=${companyId}`);
    if (!res.ok) return;
    const text = await res.text();
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "export.csv";
    a.click();
    URL.revokeObjectURL(url);
    await loadExports(companyId);
  }

  return (
    <div>
      <PageHeader title="Berichte & Steuer" subtitle="Monat/Quartal, Steueruebersicht, DATEV-Export und Regelengine" />

      <Card className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Zeitraum</label>
          <div className="flex gap-2">
            <Button variant={mode === "monat" ? "default" : "outline"} onClick={() => setMode("monat")}>
              Monat
            </Button>
            <Button variant={mode === "quartal" ? "default" : "outline"} onClick={() => setMode("quartal")}>
              Quartal
            </Button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Jahr</label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || year)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Monat</label>
          <select
            className="h-10 rounded-xl border border-border px-3 text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <h3 className="font-medium">Steuer ({snapshot?.periodLabel ?? "-"})</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>USt. 19%</span>
              <b>EUR {snapshot?.vatOutput19.toFixed(2) ?? "0.00"}</b>
            </div>
            <div className="flex justify-between">
              <span>Vorsteuer</span>
              <b>EUR {snapshot?.vatInput.toFixed(2) ?? "0.00"}</b>
            </div>
            <div className="flex justify-between">
              <span>Zahllast</span>
              <b>EUR {snapshot?.vatLiability.toFixed(2) ?? "0.00"}</b>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="font-medium">EUER ({overview?.year ?? year})</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Einnahmen</span>
              <b>EUR {overview?.totals.euerRevenue.toFixed(2) ?? "0.00"}</b>
            </div>
            <div className="flex justify-between">
              <span>Ausgaben</span>
              <b>EUR {overview?.totals.euerExpense.toFixed(2) ?? "0.00"}</b>
            </div>
            <div className="flex justify-between">
              <span>Gewinn</span>
              <b>EUR {overview?.totals.euerProfit.toFixed(2) ?? "0.00"}</b>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="font-medium">Steuerprognose</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Basis Monate</span>
              <b>{forecast?.basedOnMonths ?? 0}</b>
            </div>
            <div className="flex justify-between">
              <span>Jahr Zahllast</span>
              <b>EUR {forecast?.forecast.vatLiability.toFixed(2) ?? "0.00"}</b>
            </div>
            <div className="flex justify-between">
              <span>Jahr Gewinn</span>
              <b>EUR {forecast?.forecast.euerProfit.toFixed(2) ?? "0.00"}</b>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="font-medium">Hinweis</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Technische Auswertung aus Buchungen, keine rechtlich verbindliche Steuerberatung.
          </p>
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="mb-3 font-medium">Automatische Buchungsvorschlaege (Regeln)</h3>
        <div className="mb-4 grid gap-2 md:grid-cols-5">
          <Input placeholder="Regelname" value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
          <Input placeholder="Pattern (z. B. Telekom)" value={rulePattern} onChange={(e) => setRulePattern(e.target.value)} />
          <Input placeholder="Kategorie" value={ruleCategory} onChange={(e) => setRuleCategory(e.target.value)} />
          <Input placeholder="Konto (z. B. 4930)" value={ruleAccount} onChange={(e) => setRuleAccount(e.target.value)} />
          <Button onClick={createRule}>Regel speichern</Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Name</th>
              <th>Pattern</th>
              <th>Kategorie</th>
              <th>Konto</th>
              <th>Confidence</th>
              <th>Aktiv</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-3">{r.name}</td>
                <td>{r.pattern}</td>
                <td>{r.category || "-"}</td>
                <td>{r.accountNumber || "-"}</td>
                <td>{Math.round(r.confidence * 100)}%</td>
                <td>{r.active ? "Ja" : "Nein"}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      disabled={ruleActionLoading === r.id}
                      onClick={() => void toggleRule(r.id, r.active)}
                    >
                      {r.active ? "Deaktivieren" : "Aktivieren"}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      disabled={ruleActionLoading === r.id}
                      onClick={() => void deleteRule(r.id)}
                    >
                      Loeschen
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">DATEV / Export-Historie</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void createExport("CSV")}>
              CSV Export
            </Button>
            <Button onClick={() => void createExport("DATEV")}>DATEV Export</Button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Typ</th>
              <th>Zeitraum</th>
              <th>Datei</th>
              <th>Status</th>
              <th>Erstellt</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {exportsHistory.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="py-3">{item.exportType}</td>
                <td>{item.periodLabel}</td>
                <td>{item.fileName}</td>
                <td>{item.status}</td>
                <td>{new Date(item.createdAt).toISOString().slice(0, 10)}</td>
                <td>
                  <Button
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={() => void downloadExport(item.id, item.fileName)}
                  >
                    Download
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
