import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared";
import { products } from "@/data/seedData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ProductsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Produkte & Leistungen"
        subtitle="Preise, Steuer und Beschreibung zentral verwalten"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Hinzufügen</Button>
            </DialogTrigger>
            <DialogContent>
              <h3 className="text-lg font-semibold">Produkt oder Leistung erfassen</h3>
              <div className="mt-4 space-y-3">
                <Input placeholder="Bezeichnung" />
                <Input placeholder="Preis in EUR" type="number" min={0} />
                <Input placeholder="Steuersatz, z. B. 19%" />
                <Input placeholder="Kurzbeschreibung" />
                <Button className="w-full">Speichern</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th>Name</th>
              <th>Typ</th>
              <th>Preis</th>
              <th>Steuer</th>
              <th>Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-3">{p.name}</td>
                <td>{p.type}</td>
                <td>EUR {p.price}</td>
                <td>{p.tax}</td>
                <td>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
