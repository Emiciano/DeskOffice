# Umsetzungsstand Phasen 1-10

Stand: 2026-05-17

## Phase 1 – Grundsystem
- [x] React + TypeScript + Router + zentrales Layout
- [x] Login/Register gegen DB
- [x] Company-basierte Datenisolation (`companyId`)
- [x] Rollenfeld am User + geschützte API
- [x] Settings-Bereich DB-gestützt

## Phase 2 – Belegverwaltung
- [x] Upload-Flow + Belegliste + Filter
- [x] Bearbeitungs-Workflow (Erfassen/Bearbeiten)
- [x] Belegstatus und Buchungsübergang

## Phase 3 – OCR Architektur
- [x] OCR-Trigger im Workflow vorhanden
- [x] Aktuell Mock-OCR (provider-unabhängig vorbereitet)
- [ ] Externer OCR-Provider (bewusst noch nicht aktiviert)

## Phase 4 – Kontenrahmen SKR03/SKR04
- [x] Kontenmodell in DB
- [x] SKR03/SKR04 Seeddaten
- [x] Kontenverwaltung + Suche/Filter

## Phase 5 – Buchungen
- [x] Beleg-zu-Buchung
- [x] Journalansicht
- [x] Validierung und Statusübergänge

## Phase 6 – Rechnungen & Angebote
- [x] Rechnungserstellung mit Positionslogik und Vorlagenvorschau
- [x] Angebote + Umwandlungs-/Folgeprozesse
- [x] Wiederkehrende Rechnung (nächster Zyklus)

## Phase 7 – E-Rechnung Vorbereitung
- [x] DB-Modell für E-Rechnungsdokument
- [x] API-Route für XML-Erstellung aus Rechnung
- [x] XML-Export (XRechnung-Workflow vorbereitet)

## Phase 8 – Banking
- [x] CSV-Import
- [x] Transaktionsliste in DB
- [x] Matching auf Rechnungen inkl. Statusupdate

## Phase 9 – Regelengine
- [x] Regeln CRUD
- [x] Anwendung bei Bankimport
- [x] Vorschlagssystem bei Zuordnung

## Phase 10 – Steuerbereich
- [x] Steuer-Snapshots Modell + API
- [x] Steuerrelevante Reports/Übersichten im UI

## Heute neu abgeschlossen
1. Produkte & Leistungen vollständig DB-basiert (CRUD, Suche, Aktiv/Inaktiv).
2. E-Rechnungsstruktur (Model + API + XML-Export aus Rechnungen).
3. Rollenrechte für kritische Write-Endpoints (Owner/Admin).
