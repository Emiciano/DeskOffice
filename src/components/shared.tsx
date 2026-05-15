import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-primary">{trend}</p>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Bezahlt" || status === "Angenommen" || status === "geprüft"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Überfällig" || status === "Abgelehnt"
        ? "bg-rose-100 text-rose-700"
        : "bg-slate-100 text-slate-700";
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>;
}

export function ChartCard({ data }: { data: Array<{ month: string; einnahmen: number; ausgaben: number }> }) {
  return (
    <Card className="h-[340px]">
      <h3 className="mb-4 font-medium">Einnahmen vs. Ausgaben</h3>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="einnahmen" stroke="#4f46e5" strokeWidth={2.5} />
          <Line type="monotone" dataKey="ausgaben" stroke="#60a5fa" strokeWidth={2.5} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
