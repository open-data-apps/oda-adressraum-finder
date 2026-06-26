# Changelog

## 25.06.2026 — Version 1.0.0

- ENH: Neue ODAS-App „Adressraum-Finder" erstellt
- ENH: App-Logik in `app/app.js` mit Datenladen, Normalisierung und Schale-4-Komponenten
- ENH: Vier KPI-Kacheln (Adressen, Stadtteile, Spielräume, Stimmbezirke) mit Kontexttext
- ENH: Umschaltbare Struktur-Übersicht mit horizontalem Chart.js-Balkendiagramm
- ENH: Stadtteil-Filter mit Wirkung auf Diagramm und Tabelle
- ENH: Adress-Auskunft mit Freitextsuche und client-seitiger Pagination (25 Einträge/Seite)
- ENH: Schale-4-Methodikbox als Bootstrap-Accordion
- ENH: Schale-4-Datenfrische-Indikator aus dem Datensatz (Feld `Stand`)
- ENH: Schale-4-Weiterführende Links (konfigurierbar)
- ENH: ODAS-Proxy-Unterstützung mit Proxy-Helfern aus Template
- ENH: App-spezifisches ODAS-Icon (stilisierte Stadtgliederung)
- ENH: Frictionless-Data-Schema (`assets/schema.json`) mit allen 18 Datenfeldern
- DOC: App-spezifische README und Beschreibungsseite
- DOC: Instanz-Konfiguration mit 7 neuen Schale-4-Keys (kpiKontext1–4, datenquelleHinweis, datenStand, weiterfuehrendeLinks)

## 19.05.2026

- ENH: ODAS-Proxy-Hilfsfunktionen in `app/app.js` ergänzt
- ENH: v1-konformes Instanz-Config-Feld `proxyAktiv` zum Aktivieren des ODAS-Proxys ergänzt
- FIX: `fusszeile.format.typ` auf v1-kompatibles `string` korrigiert
- DOC: Hinweis ergänzt, dass echte Proxy-Aufrufe nur im ODAS-Live-System funktionieren

## 21.02.2025

- ENH: app-package mit Multiline Strings
- ENH: Feldtypen von HTML auf Markdown umgestellt

## 17.02.2025

- FIX: Loadpage Funktion optimiert

## 12.2.2025 (Version 1.0.0)

- ENH: Anzeige config.json
- ENH: Config-File mit Multiline-String (als Array)
- FIX: Code-Teilung in app-base und app
- FIX: Docker korrigiert, läuft wieder
