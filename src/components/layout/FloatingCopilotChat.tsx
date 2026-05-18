import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const QUICK_PROMPTS = [
  "Wie hoch waren meine Ausgaben diesen Monat?",
  "Welche Rechnungen sind überfällig?",
  "Welche Belege fehlen noch?",
];

export function FloatingCopilotChat() {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi, ich bin dein LunaOffice Assistent. Frag mich zu Belegen, Rechnungen und Auswertungen." },
  ]);

  useEffect(() => {
    void (async () => {
      const res = await apiFetch("/api/bootstrap");
      if (!res.ok) return;
      const data = (await res.json()) as { companyId?: string };
      if (data.companyId) setCompanyId(data.companyId);
    })();
  }, []);

  const canAsk = useMemo(() => Boolean(companyId && question.trim() && !loading), [companyId, question, loading]);

  async function askByText(value: string) {
    const q = value.trim();
    if (!companyId || !q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await apiFetch("/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, question: q }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer?.trim() || data.error || "Dazu habe ich gerade keine Antwort." },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Verbindung zur Assistenz gerade nicht verfügbar." }]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    await askByText(q);
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft hover:brightness-95"
          aria-label="Chat öffnen"
        >
          <Bot size={22} />
        </button>
      ) : null}

      {open ? (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot size={16} />
              </span>
              <p className="text-sm font-semibold">LunaOffice Assistent</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted/70">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "assistant" ? "rounded-xl bg-muted p-2.5 text-sm" : "rounded-xl border border-border p-2.5 text-sm"}>
                <p className="mb-1 text-xs text-muted-foreground">{message.role === "assistant" ? "Assistent" : "Du"}</p>
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {QUICK_PROMPTS.map((prompt) => (
              <Button key={prompt} variant="outline" className="h-7 rounded-lg px-2 text-xs" onClick={() => void askByText(prompt)}>
                {prompt}
              </Button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Frage stellen..." />
            <Button type="submit" disabled={!canAsk} className="h-10 w-10 rounded-xl p-0">
              <Send size={16} />
            </Button>
          </form>
        </div>
      ) : null}
    </>
  );
}
