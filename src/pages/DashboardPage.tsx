import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartCard, PageHeader, StatCard } from "@/components/shared";
import { apiFetch } from "@/lib/api";

type Stat = { label: string; value: string; trend: string };
type SeriesRow = { month: string; einnahmen: number; ausgaben: number };
type DashboardResponse = {
  stats: Stat[];
  series: SeriesRow[];
  activities: string[];
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse>({ stats: [], series: [], activities: [] });

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      const res = await apiFetch(`/api/dashboard/summary?companyId=${boot.companyId}`);
      setData(await res.json());
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Ueberblick ueber Finanzen und Aktivitaeten" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard data={data.series} />
        </div>
        <Card>
          <h3 className="mb-3 font-medium">Schnellaktionen</h3>
          <div className="space-y-2">
            <Button className="w-full">Rechnung erstellen</Button>
            <Button variant="outline" className="w-full">
              Kunde hinzufuegen
            </Button>
            <Button variant="outline" className="w-full">
              Beleg hochladen
            </Button>
          </div>
          <h3 className="mb-2 mt-6 font-medium">Letzte Aktivitaeten</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {data.activities.map((item) => (
              <li key={item} className="rounded-xl bg-muted px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
