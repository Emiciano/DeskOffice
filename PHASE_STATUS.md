# Umsetzungsstand Phasen 1-15

Stand: 2026-05-17

## Phase 1 - Grundsystem
- [x] React + TypeScript + Router + zentrales Layout
- [x] Login/Register gegen DB
- [x] Company-basierte Datenisolation (`companyId`)
- [x] Rollenfeld am User + geschuetzte API
- [x] Settings-Bereich DB-gestuetzt

## Phase 2 - Belegverwaltung
- [x] Upload-Flow + Belegliste + Filter
- [x] Bearbeitungs-Workflow (Erfassen/Bearbeiten)
- [x] Belegstatus und Buchungsuebergang

## Phase 3 - OCR Architektur
- [x] OCR-Trigger im Workflow vorhanden
- [x] Mock-OCR fuer provider-unabhaengigen Start
- [ ] Externer OCR-Provider (bewusst noch nicht aktiviert)

## Phase 4 - Kontenrahmen SKR03/SKR04
- [x] Kontenmodell in DB
- [x] SKR03/SKR04 Seeddaten
- [x] Kontenverwaltung + Suche/Filter

## Phase 5 - Buchungen
- [x] Beleg-zu-Buchung
- [x] Journalansicht
- [x] Validierung und Statusuebergaenge

## Phase 6 - Rechnungen & Angebote
- [x] Rechnungserstellung mit Positionslogik und Vorlagenvorschau
- [x] Angebote + Umwandlungs-/Folgeprozesse
- [x] Wiederkehrende Rechnung (naechster Zyklus)

## Phase 7 - E-Rechnung Vorbereitung
- [x] DB-Modell fuer E-Rechnungsdokument
- [x] API-Route fuer XML-Erstellung aus Rechnung
- [x] XML-Export (XRechnung-Workflow vorbereitet)

## Phase 8 - Banking
- [x] CSV-Import
- [x] Transaktionsliste in DB
- [x] Matching auf Rechnungen inkl. Statusupdate

## Phase 9 - Regelengine
- [x] Regeln CRUD
- [x] Anwendung bei Bankimport
- [x] Vorschlagssystem bei Zuordnung

## Phase 10 - Steuerbereich
- [x] Steuer-Snapshots Modell + API
- [x] Steuerrelevante Reports/Uebersichten im UI

## Phase 11 - DATEV / Steuerberater
- [x] Export-Historie und Download-Flow
- [x] Steuerberater-Einladung (Invite, Liste, Widerruf)

## Phase 12 - Smart Inbox
- [x] Aufgabenliste fuer unvollstaendige Belege
- [x] Priorisierung und Statusaktionen

## Phase 13 - AI Copilot
- [x] Copilot UI mit Quick-Fragen
- [x] Datenbasierte Antworten aus Rechnungen/Belegen/Buchungen

## Phase 14 - Kunden & Lieferanten
- [x] Kontaktanlage (Kunde/Lieferant)
- [x] Detailansicht mit Rechnungen/Belegen und Umsatzbezug

## Phase 15 - Reporting
- [x] Erweiterte Reports API (Cashflow, Top-Kategorien, offene Posten)
- [x] Reporting-Widgets im UI

## Phase 16 - Einstellungen
- [x] Erweiterte Firmen-/Steuer-/Bank-Einstellungen persistent in DB
- [x] Finanzkonfiguration API fuer Bankkonten und Kostenstellen
- [x] Admin-Frontend fuer Rollen/Mitglieder/Subscription/Finanzkonfiguration

## Phase 17 - SaaS & Sicherheit
- [x] Rollenbasierte Write-Guards auf kritischen Endpunkten
- [x] Audit-Logging fuer API-Schreiboperationen
- [x] Company-Isolation uebergreifend im API-Layer
- [x] Audit-Log UI im Admin-Bereich

## Phase 18 - Projektstruktur
- [x] Server-Routen weiter in Features aufgeteilt (`admin`, `finance-config`, `reports`, `advisors`)
- [x] Skalierbare Trennung von Domain- und Infrastrukturdateien

## Phase 19 - Prisma Models
- [x] Ergaenzt: `Role`, `CompanyMember`, `DocumentFile`, `BankAccount`, `CostCenter`, `Subscription`, `AuditLog`
- [x] Erweiterte Relationen in `Company`, `User`, `Document`, `Booking`, `BankTransaction`
