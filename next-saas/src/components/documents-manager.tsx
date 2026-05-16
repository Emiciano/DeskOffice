"use client";

import { useEffect, useMemo, useState } from "react";

type Doc = {
  id: string;
  fileName: string;
  partnerName?: string | null;
  grossAmount: number;
  status: string;
  createdAt: string;
};

type Account = { number: string; name: string };
type ApiEnvelope<T> = { ok: boolean; data: T };

export function DocumentsManager() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const [d, a] = await Promise.all([fetch("/api/documents"), fetch("/api/accounts")]);
    const dJson: ApiEnvelope<Doc[]> = await d.json();
    const aJson: ApiEnvelope<Array<{ number: string; name: string }>> = await a.json();
    setDocs(dJson.data ?? []);
    setAccounts((aJson.data ?? []).map((row) => ({ number: row.number, name: row.name })));
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const selected = useMemo(() => docs.find((d) => d.id === selectedId), [docs, selectedId]);

  async function createDocument() {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: `beleg_${Date.now()}.pdf`,
        mimeType: "application/pdf",
        fileUrl: "https://storage.example.com/beleg.pdf",
        grossAmount: 119,
        netAmount: 100,
        vatAmount: 19
      })
    });
    if (res.ok) {
      setMsg("Beleg angelegt");
      await load();
    }
  }

  async function book() {
    if (!selected || accounts.length < 2) return;
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: selected.id,
        debitAccount: accounts[0].number,
        creditAccount: accounts[1].number,
        amount: selected.grossAmount,
        taxAmount: Number((selected.grossAmount * 0.19).toFixed(2)),
        bookingText: `Buchung ${selected.fileName}`,
        bookingDate: new Date().toISOString()
      })
    });
    if (res.ok) {
      setMsg("Beleg wurde gebucht");
      await load();
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Belege</h1>
        <button onClick={createDocument} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Beleg anlegen</button>
      </div>
      {msg ? <div className="card p-3 text-sm">{msg}</div> : null}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Datei</th>
              <th className="p-3">Partner</th>
              <th className="p-3">Betrag</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={4}>Lade...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td className="p-3" colSpan={4}>Keine Belege</td></tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className={`cursor-pointer border-t ${selectedId === doc.id ? "bg-slate-50" : ""}`} onClick={() => setSelectedId(doc.id)}>
                  <td className="p-3">{doc.fileName}</td>
                  <td className="p-3">{doc.partnerName || "-"}</td>
                  <td className="p-3">EUR {doc.grossAmount.toFixed(2)}</td>
                  <td className="p-3">{doc.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card p-4">
        <p className="mb-3 text-sm text-slate-600">Ausgewaehlt: {selected?.fileName ?? "Kein Beleg ausgewaehlt"}</p>
        <button onClick={book} disabled={!selected} className="rounded-xl border px-4 py-2 disabled:opacity-40">
          In Buchung umwandeln
        </button>
      </div>
    </section>
  );
}
