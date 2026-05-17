import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type CopilotMeta = {
  monthRevenue: number;
  monthExpense: number;
  monthProfit: number;
  overdueCount: number;
  openCount: number;
  openAmount: number;
  draftDocuments: number;
  checkedDocuments: number;
};

export function AICopilotPage() {
  const [companyId, setCompanyId] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi, ich helfe dir mit Buchhaltungsfragen. Nutze die Quick-Fragen oder schreibe frei.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [meta, setMeta] = useState<CopilotMeta | null>(null);

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (boot.companyId) setCompanyId(boot.companyId);
      const hintsRes = await apiFetch("/api/copilot/hints");
      if (hintsRes.ok) setHints((await hintsRes.json()) as string[]);
    })();
  }, []);

  async function askByText(q: string) {
    if (!companyId || !q.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await apiFetch("/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: String(data.answer ?? "Keine Antwort verfuegbar.") }]);
      setMeta((data.meta ?? null) as CopilotMeta | null);
    } finally {
      setLoading(false);
    }
  }

  async function ask(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    await askByText(q);
  }

  return (
    <div>
      <PageHeader title="AI Copilot" subtitle="Fragen zu Umsatz, Ausgaben, offenen Posten und fehlenden Belegen" />

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Monatsumsatz</p>
          <p className="text-2xl font-semibold">EUR {meta?.monthRevenue.toFixed(2) ?? "0.00"}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Monatsausgaben</p>
          <p className="text-2xl font-semibold">EUR {meta?.monthExpense.toFixed(2) ?? "0.00"}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Offene Posten</p>
          <p className="text-2xl font-semibold">{meta?.openCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Fehlende Belege</p>
          <p className="text-2xl font-semibold">{(meta?.draftDocuments ?? 0) + (meta?.checkedDocuments ?? 0)}</p>
        </Card>
      </div>

      <Card className="mb-4">
        <p className="mb-2 text-sm text-muted-foreground">Quick-Fragen</p>
        <div className="flex flex-wrap gap-2">
          {hints.map((hint) => (
            <Button key={hint} variant="outline" className="h-8 px-2 text-xs" onClick={() => void askByText(hint)}>
              {hint}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="mb-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "assistant"
                ? "rounded-xl bg-muted px-3 py-2 text-sm"
                : "rounded-xl border border-border px-3 py-2 text-sm"
            }
          >
            <p className="mb-1 text-xs text-muted-foreground">{message.role === "assistant" ? "Copilot" : "Du"}</p>
            <p>{message.text}</p>
          </div>
        ))}
      </Card>

      <Card>
        <form className="flex gap-2" onSubmit={ask}>
          <Input
            placeholder="Frage z. B. Welche Rechnungen sind ueberfaellig?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button type="submit" disabled={!companyId || loading}>
            {loading ? "Laedt..." : "Fragen"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
