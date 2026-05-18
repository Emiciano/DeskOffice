import { useEffect, useMemo, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";

type ContactRow = {
  id: string;
  type: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  paymentTerms: number;
  active: boolean;
  revenue: number;
  invoiceCount: number;
  openItems: number;
};

type ContactDetail = {
  contact: {
    id: string;
    name: string;
    type: string;
    email?: string | null;
    phone?: string | null;
  };
  invoices: Array<{ id: string; number: string; amountGross: number; status: string; createdAt: string }>;
  totals: { invoiceCount: number; invoiceGross: number; openInvoices: number };
};

type ContactSectionKey =
  | "address"
  | "email"
  | "phone"
  | "social"
  | "tax"
  | "einvoice"
  | "note"
  | "tags"
  | "contactPerson"
  | "bank"
  | "terms";

const contactSections: Array<{ key: ContactSectionKey; label: string }> = [
  { key: "address", label: "Adresse" },
  { key: "email", label: "E-Mail" },
  { key: "phone", label: "Rufnummer" },
  { key: "social", label: "Social Media" },
  { key: "tax", label: "Steuerangaben" },
  { key: "einvoice", label: "E-Rechnung" },
  { key: "note", label: "Notiz" },
  { key: "tags", label: "Tags" },
  { key: "contactPerson", label: "Ansprechpartner" },
  { key: "bank", label: "Bankkonto" },
  { key: "terms", label: "Konditionen" },
];

export function CustomersPage() {
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "customer" | "supplier">("all");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ContactDetail | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"customer" | "supplier">("customer");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<ContactSectionKey>("address");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Deutschland");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [vatId, setVatId] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [supplierNumberAtCustomer, setSupplierNumberAtCustomer] = useState("");
  const [leitwegId, setLeitwegId] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("14");

  async function load(company: string, nextType: "all" | "customer" | "supplier") {
    const res = await apiFetch(`/api/contacts?companyId=${company}&type=${nextType}`);
    const data = (await res.json()) as ContactRow[];
    setRows(data);
  }

  async function loadDetail(id: string) {
    const res = await apiFetch(`/api/contacts/${id}/detail?companyId=${companyId}`);
    if (!res.ok) return;
    setDetail((await res.json()) as ContactDetail);
  }

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      setCompanyId(boot.companyId);
      await load(boot.companyId, type);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filtered = useMemo(
    () => rows.filter((r) => `${r.name} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );

  const totals = useMemo(() => {
    const revenue = filtered.reduce((sum, row) => sum + row.revenue, 0);
    const open = filtered.reduce((sum, row) => sum + row.openItems, 0);
    return { revenue, open, count: filtered.length };
  }, [filtered]);

  async function createContact() {
    if (!companyId || !newName.trim()) return;
    try {
      setSaving(true);
      await apiFetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          type: newType,
          name: newName.trim(),
          email: newEmail || null,
          phone: newPhone || null,
        }),
      });
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setStreet("");
      setPostalCode("");
      setCity("");
      setCountry("Deutschland");
      setWebsite("");
      setLinkedin("");
      setInstagram("");
      setVatId("");
      setTaxNumber("");
      setSupplierNumberAtCustomer("");
      setLeitwegId("");
      setNote("");
      setTags("");
      setContactPerson("");
      setIban("");
      setBic("");
      setPaymentTerms("14");
      setActiveSection("address");
      await load(companyId, type);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kontakte"
        subtitle="Kunden und Lieferanten mit Umsatz und offenen Posten"
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button>Kunde anlegen</Button></DialogTrigger>
            <DialogContent className="max-w-4xl">
              <h3 className="mb-4 text-lg font-semibold">Kontakt anlegen</h3>
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="rounded-xl border border-border p-2">
                  {contactSections.map((section) => (
                    <button
                      type="button"
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        activeSection === section.key
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={newType === "customer"} onChange={() => setNewType("customer")} />
                      Firma / Kunde
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={newType === "supplier"} onChange={() => setNewType("supplier")} />
                      Lieferant
                    </label>
                  </div>
                  <Input placeholder="Firmenname" value={newName} onChange={(e) => setNewName(e.target.value)} />

                  {activeSection === "address" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input placeholder="Straße" value={street} onChange={(e) => setStreet(e.target.value)} />
                      <Input placeholder="PLZ" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                      <Input placeholder="Stadt" value={city} onChange={(e) => setCity(e.target.value)} />
                      <Input placeholder="Land" value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                  ) : null}

                  {activeSection === "email" ? <Input placeholder="E-Mail" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /> : null}

                  {activeSection === "phone" ? <Input placeholder="Rufnummer" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /> : null}

                  {activeSection === "social" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input placeholder="Webseite" value={website} onChange={(e) => setWebsite(e.target.value)} />
                      <Input placeholder="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                      <Input placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                    </div>
                  ) : null}

                  {activeSection === "tax" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input placeholder="USt-IdNr." value={vatId} onChange={(e) => setVatId(e.target.value)} />
                      <Input placeholder="Steuernummer" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
                    </div>
                  ) : null}

                  {activeSection === "einvoice" ? (
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Lieferanten-Nr. beim Kunden</p>
                        <Input
                          placeholder="Ihre Lieferantennummer bei diesem Kunden"
                          value={supplierNumberAtCustomer}
                          onChange={(e) => setSupplierNumberAtCustomer(e.target.value)}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Leitweg-ID (Pflicht fuer XRechnung)</p>
                        <Input
                          placeholder="Leitweg-ID"
                          value={leitwegId}
                          onChange={(e) => setLeitwegId(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          XRechnung ist fuer Behoerden verpflichtend und benoetigt zusaetzlich eine Leitweg-ID.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {activeSection === "note" ? <Input placeholder="Interne Notiz" value={note} onChange={(e) => setNote(e.target.value)} /> : null}

                  {activeSection === "tags" ? <Input placeholder="Tags (kommagetrennt)" value={tags} onChange={(e) => setTags(e.target.value)} /> : null}

                  {activeSection === "contactPerson" ? (
                    <Input placeholder="Ansprechpartner Name" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                  ) : null}

                  {activeSection === "bank" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input placeholder="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
                      <Input placeholder="BIC" value={bic} onChange={(e) => setBic(e.target.value)} />
                    </div>
                  ) : null}

                  {activeSection === "terms" ? (
                    <Input placeholder="Zahlungsziel in Tagen" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                  ) : null}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
                    <Button onClick={createContact} disabled={saving}>{saving ? "Speichern..." : "Speichern"}</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Kontakte</p>
          <p className="text-2xl font-semibold">{totals.count}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Umsatz gesamt</p>
          <p className="text-2xl font-semibold">EUR {totals.revenue.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Offene Posten</p>
          <p className="text-2xl font-semibold">{totals.open}</p>
        </Card>
      </div>

      <Card className="mb-4">
        <div className="grid gap-2 md:grid-cols-3">
          <Input placeholder="Kontakt suchen..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="h-10 rounded-xl border border-border px-3 text-sm" value={type} onChange={(e) => setType(e.target.value as "all" | "customer" | "supplier")}>
            <option value="all">Alle</option>
            <option value="customer">Kunden</option>
            <option value="supplier">Lieferanten</option>
          </select>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th>Name</th>
                <th>Typ</th>
                <th>Kontakt</th>
                <th>Zahlungsziel</th>
                <th>Umsatz</th>
                <th>Rechnungen</th>
                <th>Offen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer border-t border-border ${selectedId === row.id ? "bg-muted/70" : ""}`}
                  onClick={() => setSelectedId(row.id)}
                >
                  <td className="py-3 font-medium">{row.name}</td>
                  <td>{row.type === "customer" ? "Kunde" : "Lieferant"}</td>
                  <td>
                    <div>{row.email || "-"}</div>
                    <div className="text-xs text-muted-foreground">{row.phone || "-"}</div>
                  </td>
                  <td>{row.paymentTerms} Tage</td>
                  <td>EUR {row.revenue.toFixed(2)}</td>
                  <td>{row.invoiceCount}</td>
                  <td>{row.openItems}</td>
                  <td><StatusBadge status={row.active ? "Aktiv" : "Inaktiv"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          {!detail ? (
            <p className="text-sm text-muted-foreground">Kontakt aus der Liste waehlen, um Details zu sehen.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Kontakt</p>
                <p className="text-lg font-semibold">{detail.contact.name}</p>
                <p className="text-muted-foreground">{detail.contact.type === "customer" ? "Kunde" : "Lieferant"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">E-Mail</p>
                  <p>{detail.contact.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefon</p>
                  <p>{detail.contact.phone || "-"}</p>
                </div>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Umsatz</p>
                <p className="text-lg font-semibold">EUR {detail.totals.invoiceGross.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {detail.totals.invoiceCount} Rechnungen • {detail.totals.openInvoices} offen
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
