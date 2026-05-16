import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export function ReportsPage() {
  const [companyId, setCompanyId] = useState("");
  const [snapshot, setSnapshot] = useState<TaxSnapshot | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleName, setRuleName] = useState("");
  const [rulePattern, setRulePattern] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");
  const [ruleAccount, setRuleAccount] = useState("");

  async function load(company: string) {
    const now = new Date();
    const [taxRes, ruleRes] = await Promise.all([
      fetch(`/api/taxes/snapshot?companyId=${company}&year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
      fetch(`/api/rules?companyId=${company}`),
    ]);
    setSnapshot(await taxRes.json());
    setRules(await ruleRes.json());
  }

  useEffect(() => {
    void (async () => {
      const boot = await fetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      setCompanyId(boot.companyId);
      await load(boot.companyId);
    })();
  }, []);

  async function createRule() {
    if (!companyId || !ruleName || !rulePattern) return;
    await fetch("/api/rules", {
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
    await load(companyId);
  }

  return (
    <div>
      <PageHeader title="Berichte & Steuer" subtitle="Steuer-Snapshot, EÜR-Basis und Buchungsregeln" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <h3 className="font-medium">Steuerübersicht ({snapshot?.periodLabel ?? "-"})</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>USt. 19%</span><b>EUR {snapshot?.vatOutput19.toFixed(2) ?? "0.00"}</b></div>
            <div className="flex justify-between"><span>Vorsteuer</span><b>EUR {snapshot?.vatInput.toFixed(2) ?? "0.00"}</b></div>
            <div className="flex justify-between"><span>Zahllast</span><b>EUR {snapshot?.vatLiability.toFixed(2) ?? "0.00"}</b></div>
          </div>
        </Card>
        <Card className="xl:col-span-1">
          <h3 className="font-medium">EÜR-Vorbereitung</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Einnahmen</span><b>EUR {snapshot?.euerRevenue.toFixed(2) ?? "0.00"}</b></div>
            <div className="flex justify-between"><span>Ausgaben</span><b>EUR {snapshot?.euerExpense.toFixed(2) ?? "0.00"}</b></div>
            <div className="flex justify-between"><span>Gewinn</span><b>EUR {((snapshot?.euerRevenue ?? 0) - (snapshot?.euerExpense ?? 0)).toFixed(2)}</b></div>
          </div>
        </Card>
        <Card className="xl:col-span-1">
          <h3 className="font-medium">Hinweis</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Diese Werte sind technische Auswertungen aus Buchungen und ersetzen keine rechtlich verbindliche Steuerberatung.
          </p>
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="mb-3 font-medium">Automatische Buchungsvorschläge (Regeln)</h3>
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
              <th>Name</th><th>Pattern</th><th>Kategorie</th><th>Konto</th><th>Confidence</th><th>Aktiv</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
