# DeskOffice Phase Status (1-20)

Stand: 2026-05-17

## Abgeschlossen (funktional umgesetzt)
- Phase 1: Grundsystem (Layout, Auth-Basis, Rollen, Settings-Basis, Prisma/API-Struktur)
- Phase 2: Belegverwaltung (Upload, Liste, Detail, Bearbeitung, Statusfluss)
- Phase 3: OCR-Architektur (provider-ready Workflow, aktuell ohne externen Anbieter)
- Phase 4: SKR03/SKR04 Kontenrahmen (Datenmodell, Suche, Zuordnung)
- Phase 5: Buchungen (Soll/Haben, Journal, Buchungsfluss aus Belegen)
- Phase 6: Rechnungen/Angebote (Erstellung, Status, Vorlagen, PDF/Print, Umwandlungen)
- Phase 7: E-Rechnung Basis (XRechnung/XML Exportstruktur)
- Phase 8: Banking (CSV-Import, Transaktionen, Matching, Vorschläge)
- Phase 9: Regelengine (Pattern-Regeln, automatische Konto/Kategorie-Vorschläge)
- Phase 10: Steuerbereich (Snapshot, Overview, Forecast, Hinweise ohne Steuerberatung)
- Phase 11: DATEV/Export (Export-Historie, Download, Advisor-Flow)
- Phase 12: Smart Inbox (offene Punkte, Priorisierung, Statusupdates)
- Phase 13: AI Copilot UI+API (Kennzahlen/Fragen aus echten DB-Daten)
- Phase 14: Kunden/Lieferanten (CRUD-Basis, Detailansicht, Umsatz-/Rechnungsbezug)
- Phase 15: Reporting (Cashflow, Top-Kategorien, offene Posten, Dokument-Qualität)

## In diesem Schritt zusätzlich gehärtet
- Multi-Tenant-Isolation auf kritischen Endpoints verbessert:
  - `rules` update/delete jetzt company-scoped
  - `banking` match/suggestions jetzt company-scoped
  - `exports` status-update jetzt company-scoped
- Copilot-Texte/Umlaute serverseitig bereinigt.

## Offen / Feinschliff (Phase 16-20)
- Phase 16: Einstellungen erweitern
  - DONE: Nummernkreise (Rechnung/Angebot) als persistente Settings
  - OFFEN: Rechnungsdesign-Profile je Mandant, Banking-Multi-Account UI-Feinschliff
- Phase 17: Security-Härtung (Rate-Limit, strengere RBAC-Middleware je Endpoint, Delete-/Retention-Konzept)
- Phase 18: Struktur-Feinschliff (weitere Feature-Slices, interne API-Service-Layer vereinheitlichen)
- Phase 19: Prisma-Feinschliff (Index-Tuning, Soft-Delete-Strategie, optionale Relationserweiterungen)
- Phase 20: End-to-End Kernflows mit finaler QA/Doku (Login → Firma → Beleg → Buchung → Rechnung → Dashboard)
