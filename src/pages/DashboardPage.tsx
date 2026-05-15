import { Card } from "@/components/ui/card";
import { activities, dashboardStats, revenueSeries } from "@/data/seedData";
import { Button } from "@/components/ui/button";
import { ChartCard, PageHeader, StatCard } from "@/components/shared";

export function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Überblick über Finanzen und Aktivitäten" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard data={revenueSeries} />
        </div>
        <Card>
          <h3 className="mb-3 font-medium">Schnellaktionen</h3>
          <div className="space-y-2">
            <Button className="w-full">Rechnung erstellen</Button>
            <Button variant="outline" className="w-full">Kunde hinzufügen</Button>
            <Button variant="outline" className="w-full">Beleg hochladen</Button>
          </div>
          <h3 className="mb-2 mt-6 font-medium">Letzte Aktivitäten</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {activities.map((item) => (
              <li key={item} className="rounded-xl bg-muted px-3 py-2">{item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
