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

export function AICopilotPage() {
  const [companyId, setCompanyId] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi, ich helfe dir mit Buchhaltungsfragen. Beispiele: Umsatz diesen Monat, offene Rechnungen, fehlende Belege.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (boot.companyId) setCompanyId(boot.companyId);
    })();
  }, []);

  async function ask(e: FormEvent) {
    e.preventDefault();
    if (!companyId || !question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="AI Copilot" subtitle="Schnelle Antworten auf Basis deiner echten Buchhaltungsdaten" />
      <Card className="mb-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === "assistant" ? "rounded-xl bg-muted px-3 py-2 text-sm" : "rounded-xl border border-border px-3 py-2 text-sm"}
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
