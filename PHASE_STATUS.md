# DeskOffice Phase Status (1-20)

Stand: 2026-05-17

## Abgeschlossen
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
- Phase 13: AI Copilot UI + API (Kennzahlen/Fragen aus DB-Daten)
- Phase 14: Kunden/Lieferanten (CRUD, Detailansicht, Umsatz-/Rechnungsbezug)
- Phase 15: Reporting (Cashflow, Top-Kategorien, offene Posten, Dokumentqualität)
- Phase 16: Einstellungen erweitert (Nummernkreise, Firmen-/Steuer-/Bankdaten, Logo, Persistenz)
- Phase 17: Security-Härtung (Auth-Guard, RBAC, Permission-Checks, Rate-Limits, Audit-Logs)
- Phase 18: Struktur-Feinschliff (Features/Server-Routen klar getrennt, gemeinsame Utility-Layer)
- Phase 19: Prisma-Modellstand finalisiert (SaaS-relevante Models inkl. Settings, Roles, Exports, Audit)
- Phase 20: Kernflow finalisiert (Login -> Firma -> Beleg -> Buchung -> Rechnung -> Dashboard)

## Abschluss-Härtungen in diesem Lauf
- Schreibende Endpoints zusätzlich mit `requirePermissions(...)` abgesichert:
  - `invoices`, `offers`, `bookings`, `contacts`, `banking`, `exports`
- Booking-Erstellung jetzt tenant-sicher:
  - Dokument wird vor Buchung auf `companyId` geprüft
  - Dokumentstatus-Update erfolgt company-scoped
- Globaler Write-Rate-Limiter auf `/api` ergänzt.
- Security-Header ergänzt:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`
  - `x-powered-by` deaktiviert

## Hinweis
- OCR ist bewusst ohne externen Anbieter aktiv vorbereitet (provider-ready Architektur).
- Für produktive OCR kann später ein Provider (z. B. Google Vision, Azure, Mindee) direkt angeschlossen werden.
