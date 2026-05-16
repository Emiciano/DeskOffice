import { useEffect, useState } from "react";
import { ChevronRight, Info } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompanySettings, defaultCompanySettings } from "@/types/companySettings";
import { apiFetch } from "@/lib/api";

type SettingsSection = "general" | "tax" | "bank" | "logo";

const sections: Array<{ id: SettingsSection; label: string }> = [
  { id: "general", label: "Allgemein" },
  { id: "tax", label: "Buchhaltung & Steuer" },
  { id: "bank", label: "Bankverbindung" },
  { id: "logo", label: "Logo" },
];

export function SettingsPage() {
  const [companyId, setCompanyId] = useState("");
  const [active, setActive] = useState<SettingsSection>("general");
  const [settings, setSettings] = useState<CompanySettings>(defaultCompanySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load(company: string) {
    const data = await apiFetch(`/api/settings?companyId=${company}`).then((r) => r.json());
    setSettings({ ...defaultCompanySettings, ...data, companyId: company });
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) {
        setLoading(false);
        return;
      }
      const id = String(boot.companyId);
      setCompanyId(id);
      await load(id);
      setLoading(false);
    })();
  }, []);

  async function save() {
    if (!companyId) return;
    setSaving(true);
    setMessage("");
    const response = await apiFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, companyId }),
    });
    if (!response.ok) {
      setMessage("Speichern fehlgeschlagen.");
      setSaving(false);
      return;
    }
    const updated = await response.json();
    setSettings({ ...defaultCompanySettings, ...updated, companyId });
    setMessage("Einstellungen gespeichert. Rechnungen nutzen die Daten sofort.");
    setSaving(false);
  }

  function setField<K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function onLogoFile(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("upload_failed"));
      reader.readAsDataURL(file);
    });
    setField("logoUrl", dataUrl);
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Einstellungen werden geladen...</div>;
  }

  return (
    <div>
      <PageHeader title="Einstellungen" subtitle="Stammdaten für rechtssichere Rechnungen und Buchhaltung" />

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="h-fit p-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition ${active === section.id ? "bg-muted font-medium" : "hover:bg-muted/60"}`}
            >
              <span>{section.label}</span>
              <ChevronRight size={16} className={active === section.id ? "text-primary" : "text-muted-foreground"} />
            </button>
          ))}
        </Card>

        <div className="space-y-4">
          {message ? (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">{message}</div>
          ) : null}

          {active === "general" ? (
            <>
              <Card className="space-y-4 p-5">
                <h3 className="text-2xl font-semibold">Allgemein</h3>
                <div className="rounded-lg bg-indigo-100 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100">
                  Vollständige Stammdaten werden automatisch in Rechnungskopf und Fußzeile übernommen.
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">Firma</p>
                    <Input value={settings.companyName} onChange={(e) => setField("companyName", e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Firmenzusatz</p>
                    <Input value={settings.companySuffix} onChange={(e) => setField("companySuffix", e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Geschäftsführer/-in</p>
                    <Input value={settings.managingDirector} onChange={(e) => setField("managingDirector", e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Rechtsform</p>
                    <Input value={settings.legalForm} onChange={(e) => setField("legalForm", e.target.value)} placeholder="z. B. GmbH" />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium">Adresse</p>
                  <Input className="mb-2" value={settings.street} onChange={(e) => setField("street", e.target.value)} placeholder="Straße" />
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={settings.postalCode} onChange={(e) => setField("postalCode", e.target.value)} placeholder="PLZ" />
                    <Input value={settings.city} onChange={(e) => setField("city", e.target.value)} placeholder="Stadt" />
                  </div>
                  <Input className="mt-2" value={settings.country} onChange={(e) => setField("country", e.target.value)} placeholder="Land" />
                </div>
              </Card>

              <Card className="space-y-3 p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">Telefon</p>
                    <Input value={settings.phone} onChange={(e) => setField("phone", e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Fax</p>
                    <Input value={settings.fax} onChange={(e) => setField("fax", e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">E-Mail-Adresse</p>
                    <Input value={settings.email} onChange={(e) => setField("email", e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Webseite</p>
                    <Input value={settings.website} onChange={(e) => setField("website", e.target.value)} />
                  </div>
                </div>
              </Card>
            </>
          ) : null}

          {active === "tax" ? (
            <>
              <Card className="space-y-4 p-5">
                <h3 className="text-2xl font-semibold">Buchhaltung & Steuer</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-sm font-medium">Umsatzsteuer-ID <Info size={14} /></p>
                    <Input value={settings.vatId} onChange={(e) => setField("vatId", e.target.value)} placeholder="z. B. DE123456789" />
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-sm font-medium">Steuernummer <Info size={14} /></p>
                    <Input value={settings.taxNumber} onChange={(e) => setField("taxNumber", e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Amtsgericht</p>
                    <Input value={settings.districtCourt} onChange={(e) => setField("districtCourt", e.target.value)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Handelsregister-Nr.</p>
                    <Input value={settings.commercialRegisterNo} onChange={(e) => setField("commercialRegisterNo", e.target.value)} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Umsatzsteuer</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button type="button" onClick={() => setField("vatMode", "standard")} className={`rounded-xl border p-3 text-left ${settings.vatMode === "standard" ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                      <p className="font-medium">Standard</p>
                      <p className="text-sm text-muted-foreground">{settings.defaultTaxRate}%</p>
                    </button>
                    <button type="button" onClick={() => setField("vatMode", "small-business")} className={`rounded-xl border p-3 text-left ${settings.vatMode === "small-business" ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                      <p className="font-medium">Kleinunternehmer</p>
                      <p className="text-sm text-muted-foreground">Keine Umsatzsteuer</p>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Kontenrahmen</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button type="button" onClick={() => setField("accountFrame", "SKR04")} className={`rounded-xl border p-3 text-left ${settings.accountFrame === "SKR04" ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                      <p className="font-medium">SKR04</p>
                      <p className="text-sm text-muted-foreground">angelehnt an Jahresabschluss</p>
                    </button>
                    <button type="button" onClick={() => setField("accountFrame", "SKR03")} className={`rounded-xl border p-3 text-left ${settings.accountFrame === "SKR03" ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                      <p className="font-medium">SKR03</p>
                      <p className="text-sm text-muted-foreground">angelehnt an Unternehmensabläufe</p>
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">Standard-USt.-Satz</p>
                    <Input type="number" value={settings.defaultTaxRate} onChange={(e) => setField("defaultTaxRate", Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Preisangabe</p>
                    <select
                      className="h-10 w-full rounded-xl border border-border px-3 text-sm"
                      value={settings.priceInputMode}
                      onChange={(e) => setField("priceInputMode", e.target.value as "netto" | "brutto")}
                    >
                      <option value="brutto">Brutto inkl. USt</option>
                      <option value="netto">Netto zzgl. USt</option>
                    </select>
                  </div>
                </div>
              </Card>
            </>
          ) : null}

          {active === "bank" ? (
            <Card className="space-y-3 p-5">
              <h3 className="text-2xl font-semibold">Bankverbindung</h3>
              <div>
                <p className="mb-1 text-sm font-medium">Bankname</p>
                <Input value={settings.bankName} onChange={(e) => setField("bankName", e.target.value)} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm font-medium">Kontonummer</p>
                  <Input value={settings.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} />
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium">BLZ</p>
                  <Input value={settings.bankCode} onChange={(e) => setField("bankCode", e.target.value)} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">IBAN</p>
                <Input value={settings.iban} onChange={(e) => setField("iban", e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">BIC</p>
                <Input value={settings.bic} onChange={(e) => setField("bic", e.target.value)} />
              </div>
            </Card>
          ) : null}

          {active === "logo" ? (
            <Card className="space-y-4 p-5">
              <h3 className="text-2xl font-semibold">Logo</h3>
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Firmenlogo" className="mx-auto mb-4 max-h-20 object-contain" />
                ) : (
                  <p className="mb-4 text-sm text-muted-foreground">Noch kein Logo hinterlegt</p>
                )}
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-border px-4 py-2 text-sm">
                  Logo hochladen
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onLogoFile(file);
                    }}
                  />
                </label>
                <p className="mt-2 text-xs text-muted-foreground">PNG/JPG/WEBP • wird automatisch auf Rechnungen angezeigt</p>
              </div>
            </Card>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving || !companyId}>{saving ? "Speichern..." : "Speichern"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
