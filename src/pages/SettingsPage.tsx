import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared";

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Einstellungen" subtitle="Unternehmensdaten und Rechnungslogik verwalten" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="font-medium">Unternehmensdaten</h3>
          <Input defaultValue="Berg & Partner GmbH" />
          <Input defaultValue="finance@berg-partner.de" />
          <Input defaultValue="DE123456789" />
        </Card>
        <Card className="space-y-3">
          <h3 className="font-medium">Rechnungseinstellungen</h3>
          <Input defaultValue="Steuersatz: 19%" />
          <Input defaultValue="Nummernkreis: RE-2026-###" />
          <Input defaultValue="Vorlage: Modern Classic" />
        </Card>
      </div>
    </div>
  );
}
