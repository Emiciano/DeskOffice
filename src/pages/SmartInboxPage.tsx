import { useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

type InboxTask = {
  id: string;
  type: string;
  title: string;
  status: string;
  missing: string[];
  priority: "hoch" | "mittel" | "niedrig";
  createdAt: string;
};

type InboxResponse = {
  total: number;
  high: number;
  medium: number;
  low: number;
  tasks: InboxTask[];
};

export function SmartInboxPage() {
  const [companyId, setCompanyId] = useState("");
  const [data, setData] = useState<InboxResponse>({ total: 0, high: 0, medium: 0, low: 0, tasks: [] });

  async function load(company: string) {
    const res = await apiFetch(`/api/inbox/tasks?companyId=${company}`);
    setData(await res.json());
  }

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      setCompanyId(boot.companyId);
      await load(boot.companyId);
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Smart Inbox" subtitle="Unvollstaendige Belege, Prioritaeten und Aufgabenliste" />
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Gesamt</p>
          <p className="text-2xl font-semibold">{data.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Hoch</p>
          <p className="text-2xl font-semibold">{data.high}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Mittel</p>
          <p className="text-2xl font-semibold">{data.medium}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Niedrig</p>
          <p className="text-2xl font-semibold">{data.low}</p>
        </Card>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Beleg</th>
              <th>Status</th>
              <th>Fehlt</th>
              <th>Prioritaet</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {data.tasks.map((task) => (
              <tr key={task.id} className="border-t border-border">
                <td className="py-3">{task.title}</td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td>{task.missing.length ? task.missing.join(", ") : "-"}</td>
                <td>
                  <StatusBadge status={task.priority} />
                </td>
                <td>{new Date(task.createdAt).toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {companyId ? null : <p className="mt-3 text-xs text-muted-foreground">Keine Firma geladen.</p>}
    </div>
  );
}
