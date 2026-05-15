import { ChartCard, PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { revenueSeries } from "@/data/seedData";

export function ReportsPage() {
  return (
    <div>
      <PageHeader title="Berichte" subtitle="Umsatz, GuV, Steuer und Monatsvergleich" />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2"><ChartCard data={revenueSeries} /></div>
        <Card>
          <h3 className="font-medium">Steuerübersicht</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>USt. 19%</span><b>€12.840</b></div>
            <div className="flex justify-between"><span>Vorsteuer</span><b>€4.290</b></div>
            <div className="flex justify-between"><span>Zahllast</span><b>€8.550</b></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
