import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Star,
  History,
  Grid3X3,
  Building2,
  BriefcaseBusiness,
  Car,
  MonitorCog,
  PenBox,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccountAutocomplete } from "@/features/accounting/components/AccountAutocomplete";
import { apiFetch } from "@/lib/api";
import type { DocumentData } from "./types";

type Props = {
  data: DocumentData;
  confidence?: Record<keyof DocumentData, number>;
  onChange: (patch: Partial<DocumentData>) => void;
  onCreateCustomer: (name: string) => Promise<void>;
  creatingContact: boolean;
  onCategoryPanelOpenChange?: (open: boolean) => void;
};

type CategoryCard = {
  name: string;
  number: string;
  group: string;
  desc: string;
};

const low = (v?: number) => (v ?? 1) < 0.75;
const frame = (name: keyof DocumentData, confidence?: Record<keyof DocumentData, number>) =>
  low(confidence?.[name]) ? "border-amber-400 ring-1 ring-amber-200" : "";

const supplierHints = ["CloudStack GmbH", "Nordlicht Media GmbH", "Musterlieferant AG"];

const fallbackCategoryCards: CategoryCard[] = [
  {
    name: "Dienstleister, Agenturen & Freelancer",
    number: "5900",
    group: "Dienstleistung / Beratung",
    desc: "Externe Dienstleistungen für Projekte, Agenturarbeit und freie Mitarbeit.",
  },
  {
    name: "Marketing & Werbung",
    number: "6600",
    group: "Betriebsbedarf",
    desc: "Anzeigen, Sponsoring, Flyer, Online-Marketing und Kampagnenkosten.",
  },
  {
    name: "Bürobedarf",
    number: "6815",
    group: "Büro",
    desc: "Verbrauchsmaterial wie Papier, Stifte, Etiketten und Bürokleinteile.",
  },
  {
    name: "Software Abos & Lizenzen",
    number: "6837",
    group: "Dienstleistung / Beratung",
    desc: "SaaS-Abos, Programme, Lizenzen und Cloud-Tools.",
  },
  {
    name: "Reisekosten",
    number: "6670",
    group: "Betriebsbedarf",
    desc: "Bahn, Hotel, Taxi, Flüge und Reisekosten im Geschäftskontext.",
  },
  {
    name: "Fahrzeugkosten",
    number: "4530",
    group: "Fahrzeug",
    desc: "Tanken, Wartung, Versicherung und betriebliche Fahrzeugkosten.",
  },
];

const navItems = [
  { key: "favoriten", label: "Favoriten", icon: Star },
  { key: "zuletzt", label: "Zuletzt verwendet", icon: History },
  { key: "alle", label: "Alle Kategorien", icon: Grid3X3 },
] as const;

const expenseGroups = [
  { icon: Building2, label: "Banken / Finanzen" },
  { icon: BriefcaseBusiness, label: "Betriebsbedarf" },
  { icon: PenBox, label: "Büro" },
  { icon: MonitorCog, label: "Dienstleistung / Beratung" },
  { icon: Car, label: "Fahrzeug" },
] as const;

const favoriteAccounts = new Set(["5900", "6600", "6815", "6837", "6670", "4530"]);
const recentAccounts = new Set(["6670", "6815", "6837", "6600"]);

export function DocumentForm({
  data,
  confidence,
  onChange,
  onCreateCustomer,
  creatingContact,
  onCategoryPanelOpenChange,
}: Props) {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMounted, setCategoryModalMounted] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryNav, setCategoryNav] = useState<(typeof navItems)[number]["key"]>("favoriten");
  const [activeGroup, setActiveGroup] = useState("Alle Kategorien");
  const [draftCategory, setDraftCategory] = useState(data.category ?? "");
  const [draftAccount, setDraftAccount] = useState(data.account ?? "");
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>(fallbackCategoryCards);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onCategoryPanelOpenChange?.(categoryModalOpen);
  }, [categoryModalOpen, onCategoryPanelOpenChange]);

  useEffect(() => {
    if (!categoryModalOpen) return;
    let cancelled = false;

    const mapGroup = (accountClass: string, accountType: string): string => {
      if (accountType === "liability" || accountType === "tax" || accountType === "bank" || accountType === "cash") {
        return "Banken / Finanzen";
      }
      if (accountClass === "4" || accountClass === "5") return "Betriebsbedarf";
      if (accountClass === "6") return "Büro";
      if (accountClass === "7") return "Dienstleistung / Beratung";
      if (accountClass === "3") return "Fahrzeug";
      return "Betriebsbedarf";
    };

    void (async () => {
      try {
        const boot = await apiFetch("/api/bootstrap").then((r) => (r.ok ? r.json() : null));
        const companyId = String(boot?.companyId ?? "");
        if (!companyId) return;
        const versions = await apiFetch(`/api/accounts/versions?companyId=${companyId}`).then((r) => (r.ok ? r.json() : []));
        const versionRows = (Array.isArray(versions) ? versions : []) as Array<{ skrType: string; year: number }>;
        const version = versionRows[0];
        if (!version?.skrType || !version?.year) return;

        const rows = await apiFetch(`/api/accounts?companyId=${companyId}&skrType=${version.skrType}&year=${version.year}`).then((r) => (r.ok ? r.json() : []));
        const mapped = (Array.isArray(rows) ? rows : [])
          .slice(0, 240)
          .map((row: { name: string; number: string; accountClass?: string; accountType?: string }) => ({
            name: String(row.name ?? "").trim(),
            number: String(row.number ?? "").trim(),
            group: mapGroup(String(row.accountClass ?? ""), String(row.accountType ?? "")),
            desc: `${String(version.skrType)}-${String(version.year)}`,
          }))
          .filter((row: CategoryCard) => row.name.length > 0 && row.number.length > 0);

        if (!cancelled && mapped.length > 0) setCategoryCards(mapped);
      } catch {
        if (!cancelled) setCategoryCards(fallbackCategoryCards);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryModalOpen]);

  useEffect(() => {
    if (categoryModalOpen) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setCategoryNav("favoriten");
      setActiveGroup("Alle Kategorien");
      setCategoryModalMounted(true);
      requestAnimationFrame(() => setCategoryModalVisible(true));
      return;
    }

    setCategoryModalVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setCategoryModalMounted(false);
      closeTimerRef.current = null;
    }, 220);
  }, [categoryModalOpen]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  const filteredCards = useMemo(() => {
    let rows = categoryCards;
    if (categoryNav === "favoriten") rows = rows.filter((r) => favoriteAccounts.has(r.number));
    if (categoryNav === "zuletzt") rows = rows.filter((r) => recentAccounts.has(r.number));
    if (activeGroup !== "Alle Kategorien") rows = rows.filter((r) => r.group === activeGroup);

    const q = categorySearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.number} ${r.group} ${r.desc}`.toLowerCase().includes(q));
  }, [categoryCards, categoryNav, activeGroup, categorySearch]);

  const applyCategory = () => {
    onChange({
      category: draftCategory,
      account: draftAccount || data.account,
    });
    setCategoryModalOpen(false);
  };

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
                {supplierHints.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Belegtyp</label>
              <select
                className={`h-10 w-full rounded-xl border border-border px-3 text-sm ${frame("type", confidence)}`}
                value={data.type}
                onChange={(e) => onChange({ type: e.target.value as DocumentData["type"] })}
              >
                {["Einnahme", "Einnahmenminderung", "Ausgabe", "Ausgabenminderung"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
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
                  setDraftAccount(data.account ?? "");
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
      </div>

      {categoryModalMounted
        ? createPortal(
            <div className={`fixed right-4 top-4 z-[180] transition-all duration-300 ease-out ${categoryModalVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}>
              <div className="h-[92vh] w-[min(900px,56vw)] rounded-3xl border border-border bg-background shadow-2xl">
                <div className="flex h-full flex-col p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">Kategorie auswählen</h3>
                    <button type="button" className="rounded-full p-2 hover:bg-muted" onClick={() => setCategoryModalOpen(false)} aria-label="Schließen">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input className="h-11 pl-9" placeholder="Suche nach Stichwort, Kategorie oder Buchhaltungskonto" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-[180px_minmax(0,1fr)] gap-3">
                    <aside className="rounded-2xl border border-border bg-background p-2.5">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Übersicht</p>
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = categoryNav === item.key;
                        return (
                          <button key={item.key} type="button" onClick={() => setCategoryNav(item.key)} className={`mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs ${active ? "bg-muted font-medium" : "hover:bg-muted/70"}`}>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {item.label}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setActiveGroup("Alle Kategorien")}
                        className={`mt-3 mb-2 block w-full rounded-xl px-2.5 py-2 text-left text-xs ${
                          activeGroup === "Alle Kategorien" ? "bg-muted font-medium" : "hover:bg-muted/70"
                        }`}
                      >
                        Alle Gruppen
                      </button>

                      <p className="mb-2 mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ausgaben</p>
                      {expenseGroups.map((item) => {
                        const Icon = item.icon;
                        const active = activeGroup === item.label;
                        return (
                          <button key={item.label} type="button" onClick={() => setActiveGroup(item.label)} className={`mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs ${active ? "bg-muted font-medium" : "hover:bg-muted/70"}`}>
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
                            key={`${card.number}-${card.name}`}
                            type="button"
                            onClick={() => {
                              setDraftCategory(card.name);
                              setDraftAccount(card.number);
                            }}
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
                        {filteredCards.length === 0 ? (
                          <div className="col-span-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                            Keine Kategorien für die aktuelle Auswahl gefunden.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button type="button" className="h-11 rounded-xl border border-border px-5 text-sm hover:bg-muted" onClick={() => setCategoryModalOpen(false)}>
                      Abbrechen
                    </button>
                    <button type="button" className="h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-95 disabled:opacity-60" onClick={applyCategory} disabled={!draftCategory}>
                      Übernehmen
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
