import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Star, History, Grid3X3, Building2, BriefcaseBusiness, Car, MonitorCog, PenBox, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccountAutocomplete } from "@/features/accounting/components/AccountAutocomplete";
import type { DocumentData } from "./types";

type Props = {
  data: DocumentData;
  confidence?: Record<keyof DocumentData, number>;
  onChange: (patch: Partial<DocumentData>) => void;
  onCreateCustomer: (name: string) => Promise<void>;
  creatingContact: boolean;
};

const low = (v?: number) => (v ?? 1) < 0.75;
const frame = (name: keyof DocumentData, confidence?: Record<keyof DocumentData, number>) =>
  low(confidence?.[name]) ? "border-amber-400 ring-1 ring-amber-200" : "";

const supplierHints = ["CloudStack GmbH", "Nordlicht Media GmbH", "Musterlieferant AG"];
const categories = ["Software", "Werbung", "Büro", "Reisekosten", "Beratung", "Sonstiges"];

const categoryCards = [
  { name: "Dienstleister, Agenturen & Freelancer", number: "5900", group: "Dienstleistung / Beratung", desc: "Externe Dienstleistungen für Projekte, Agenturarbeit und freie Mitarbeit." },
  { name: "Marketing & Werbung", number: "6600", group: "Werbung", desc: "Anzeigen, Sponsoring, Flyer, Online-Marketing und Kampagnenkosten." },
  { name: "Bürobedarf", number: "6815", group: "Büro", desc: "Verbrauchsmaterial wie Papier, Stifte, Etiketten und Bürokleinteile." },
  { name: "Software Abos & Lizenzen", number: "6837", group: "Software", desc: "SaaS-Abos, Programme, Lizenzen und Cloud-Tools." },
  { name: "Reisekosten", number: "6670", group: "Reisekosten", desc: "Bahn, Hotel, Taxi, Flüge und Reisekosten im Geschäftskontext." },
  { name: "Fahrzeugkosten", number: "4530", group: "Fahrzeug", desc: "Tanken, Wartung, Versicherung und betriebliche Fahrzeugkosten." },
];

export function DocumentForm({ data, confidence, onChange, onCreateCustomer, creatingContact }: Props) {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMounted, setCategoryModalMounted] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryNav, setCategoryNav] = useState("favoriten");
  const [draftCategory, setDraftCategory] = useState(data.category ?? "");
  const closeTimerRef = useRef<number | null>(null);
  const [categoryPanelStyle, setCategoryPanelStyle] = useState<{ top: number; left: number; height: number; width: number } | null>(null);

  const filteredCards = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categoryCards;
    return categoryCards.filter((c) => `${c.name} ${c.number} ${c.group} ${c.desc}`.toLowerCase().includes(q));
  }, [categorySearch]);

  const applyCategory = () => {
    onChange({ category: draftCategory });
    setCategoryModalOpen(false);
  };

  useEffect(() => {
    const modal =
      document.querySelector<HTMLElement>("[data-doc-capture-modal='true']") ??
      document.querySelector<HTMLElement>("[role='dialog']");
    if (!modal) return;
    modal.style.transition = "transform 300ms ease-out";
    if (categoryModalOpen) {
      modal.style.transform = "translateX(-260px)";
    } else {
      modal.style.transform = "";
    }
    return () => {
      modal.style.transform = "";
      modal.style.transition = "";
    };
  }, [categoryModalOpen]);

  useEffect(() => {
    const recalcPanelPosition = () => {
      const modal =
        document.querySelector<HTMLElement>("[data-doc-capture-modal='true']") ??
        document.querySelector<HTMLElement>("[role='dialog']");
      if (!modal) {
        const viewportPadding = 16;
        const width = Math.min(520, Math.max(380, window.innerWidth - viewportPadding * 2));
        setCategoryPanelStyle({
          top: viewportPadding,
          left: Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
          height: Math.max(520, window.innerHeight - viewportPadding * 2),
          width,
        });
        return;
      }
      const rect = modal.getBoundingClientRect();
      const viewportPadding = 16;
      const gap = 12;
      const preferredWidth = 500;
      const maxWidth = Math.max(360, window.innerWidth - (rect.right + gap + viewportPadding));
      const width = Math.min(preferredWidth, maxWidth);
      const left = Math.min(rect.right + gap, Math.max(viewportPadding, window.innerWidth - width - viewportPadding));
      const top = Math.max(viewportPadding, rect.top + 6);
      const height = Math.max(520, Math.min(window.innerHeight - top - viewportPadding, rect.height - 12));
      setCategoryPanelStyle({ top, left, height, width });
    };

    if (!categoryModalOpen) return;
    recalcPanelPosition();
    window.addEventListener("resize", recalcPanelPosition);
    window.addEventListener("scroll", recalcPanelPosition, true);
    return () => {
      window.removeEventListener("resize", recalcPanelPosition);
      window.removeEventListener("scroll", recalcPanelPosition, true);
    };
  }, [categoryModalOpen]);

  useEffect(() => {
    if (categoryModalOpen) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setCategoryModalMounted(true);
      requestAnimationFrame(() => setCategoryModalVisible(true));
      return;
    }

    setCategoryModalVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setCategoryModalMounted(false);
      closeTimerRef.current = null;
    }, 240);
  }, [categoryModalOpen]);

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <>
      <div className="space-y-3">
        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Belegdaten</h3>
          <div className="grid gap-2.5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Lieferant</label>
              <div className="flex gap-2">
                <input
                  list="supplier-hints"
                  className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("partner", confidence)}`}
                  value={data.partner}
                  placeholder="Lieferant eingeben oder wählen"
                  onChange={(e) => onChange({ partner: e.target.value })}
                />
                <button
                  type="button"
                  className="h-10 shrink-0 rounded-xl border border-border px-3 text-sm hover:bg-muted disabled:opacity-60"
                  onClick={() => void onCreateCustomer(data.partner)}
                  disabled={!data.partner.trim() || creatingContact}
                >
                  {creatingContact ? "Anlegen..." : "Kunde neu"}
                </button>
              </div>
              <datalist id="supplier-hints">
                {supplierHints.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Belegtyp</label>
              <select
                className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("type", confidence)}`}
                value={data.type}
                onChange={(e) => onChange({ type: e.target.value as DocumentData["type"] })}
              >
                {["Einnahme", "Einnahmenminderung", "Ausgabe", "Ausgabenminderung"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Belegnummer</label>
              <Input className={frame("invoiceNumber", confidence)} value={data.invoiceNumber} onChange={(e) => onChange({ invoiceNumber: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Belegdatum</label>
              <Input className={frame("documentDate", confidence)} type="date" value={data.documentDate} onChange={(e) => onChange({ documentDate: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Fälligkeitsdatum</label>
              <Input className={frame("dueDate", confidence)} type="date" value={data.dueDate} onChange={(e) => onChange({ dueDate: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Beschreibung (optional)</label>
              <textarea
                className={`min-h-16 w-full rounded-xl border border-border px-3 py-2 text-sm ${frame("notes", confidence)}`}
                maxLength={255}
                value={data.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{data.notes.length} / 255</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Kategorisierung</h3>
          <div className="grid gap-2.5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Kategorie</label>
              <button
                type="button"
                className={`h-10 w-full rounded-xl border border-border px-3 text-left text-sm hover:bg-muted ${frame("category", confidence)}`}
                onClick={() => {
                  setDraftCategory(data.category ?? "");
                  setCategoryModalOpen(true);
                }}
              >
                {data.category || "Suchbegriff, Kategorie oder Sachkonto ..."}
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Buchungskonto</label>
              <div className={frame("account", confidence)}>
                <AccountAutocomplete
                  value={data.account}
                  onSelect={(account) => {
                    onChange({
                      account: account.number,
                      category: data.category || account.accountClass || account.accountType,
                    });
                  }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Kostenstelle</label>
              <Input className={frame("costCenter", confidence)} value={data.costCenter} onChange={(e) => onChange({ costCenter: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nettobetrag</label>
              <Input className={frame("netAmount", confidence)} type="number" value={data.netAmount} onChange={(e) => onChange({ netAmount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Umsatzsteuer</label>
              <Input className={frame("vatAmount", confidence)} type="number" value={data.vatAmount} onChange={(e) => onChange({ vatAmount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Gesamtbetrag inkl. Steuer</label>
              <Input className={frame("grossAmount", confidence)} type="number" value={data.grossAmount} onChange={(e) => onChange({ grossAmount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Währung</label>
              <select className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("currency", confidence)}`} value={data.currency} onChange={(e) => onChange({ currency: e.target.value })}>
                <option>EUR</option>
                <option>USD</option>
                <option>CHF</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold">Belegstatus</h3>
          <div className="grid gap-2.5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Zahlungsstatus</label>
              <select className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("paymentStatus", confidence)}`} value={data.paymentStatus} onChange={(e) => onChange({ paymentStatus: e.target.value as DocumentData["paymentStatus"] })}>
                {["Offen", "Teilweise bezahlt", "Bezahlt"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Zahlungsart</label>
              <select className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("paymentMethod", confidence)}`} value={data.paymentMethod} onChange={(e) => onChange({ paymentMethod: e.target.value as DocumentData["paymentMethod"] })}>
                <option value="Ueberweisung">Überweisung</option>
                <option value="Lastschrift">Lastschrift</option>
                <option value="Kreditkarte">Kreditkarte</option>
                <option value="Bar">Bar</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {categoryModalMounted && categoryPanelStyle ? createPortal(
        <div
          className={`fixed z-[180] transition-all duration-300 ease-out ${categoryModalVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
          style={{
            top: categoryPanelStyle.top,
            left: categoryPanelStyle.left,
            width: categoryPanelStyle.width,
          }}
          aria-hidden={!categoryModalVisible}
        >
          <div className="rounded-3xl border border-border bg-background shadow-2xl" style={{ height: categoryPanelStyle.height }}>
            <div className="flex h-full flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-2xl font-semibold">Kategorie auswählen</h3>
                <button
                  type="button"
                  className="rounded-full p-2 hover:bg-muted"
                  onClick={() => setCategoryModalOpen(false)}
                  aria-label="Schließen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-11 pl-9"
                  placeholder="Suche nach Stichwort, Kategorie oder Buchhaltungskonto"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-[180px_minmax(0,1fr)] gap-3">
                <aside className="rounded-2xl border border-border bg-background p-2.5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Übersicht</p>
                  {[
                    { key: "favoriten", label: "Favoriten", icon: Star },
                    { key: "zuletzt", label: "Zuletzt verwendet", icon: History },
                    { key: "alle", label: "Alle Kategorien", icon: Grid3X3 },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = categoryNav === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCategoryNav(item.key)}
                        className={`mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs ${active ? "bg-muted font-medium" : "hover:bg-muted/70"}`}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </button>
                    );
                  })}

                  <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ausgaben</p>
                  {[
                    { icon: Building2, label: "Banken / Finanzen" },
                    { icon: BriefcaseBusiness, label: "Betriebsbedarf" },
                    { icon: PenBox, label: "Büro" },
                    { icon: MonitorCog, label: "Dienstleistung / Beratung" },
                    { icon: Car, label: "Fahrzeug" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                    <button key={item.label} type="button" className="mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs hover:bg-muted/70">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </button>
                    );
                  })}
                </aside>

                <div className="no-scrollbar min-h-0 overflow-y-auto pr-1">
                  <div className="mb-3 rounded-2xl border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                    Wir haben beliebte Kategorien aus deiner Branche für dich ausgewählt.
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredCards.map((card) => (
                      <button
                        key={card.name}
                        type="button"
                        onClick={() => setDraftCategory(card.name)}
                        className={`rounded-2xl border p-2.5 text-left transition-colors hover:bg-muted/60 ${draftCategory === card.name ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-base font-semibold leading-tight">{card.name}</p>
                          <Star className={`mt-1 h-4 w-4 ${draftCategory === card.name ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{card.number}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{card.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="h-11 rounded-xl border border-border px-5 text-sm hover:bg-muted"
                  onClick={() => setCategoryModalOpen(false)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-95 disabled:opacity-60"
                  onClick={applyCategory}
                  disabled={!draftCategory}
                >
                  Übernehmen
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body) : null}
    </>
  );
}
