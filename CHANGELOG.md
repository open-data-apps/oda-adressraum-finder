# Changelog

## 1.4.0 - 2026-07-31
- CHG: brandingCSS und brandingCSSFile als Base-Abhängigkeiten deklariert und lokal gespiegelt (F-17)
- CHG: dropdown-Default auf Feldebene verschoben statt in format (F-18)
- CHG: doppelt gesetzten proxyAktiv-Default in format aufgelöst (F-18)
- CHG: Template-Platzhalter in den Tags durch reale Tags ersetzt (F-21)

## 1.3.0 - 2026-07-30

- **FIX:** Laufzeitfehler nach dem Laden der Konfiguration werden jetzt sichtbar gemeldet; `handleRouting()` wird `await`et und besitzt einen Fehlerpfad. Bisher blieb die Seite bei einem Fehler im Seitenaufbau stumm leer
- **FIX:** `getConfigUrl()` schneidet bei einer URL ohne abschliessenden Schraegstrich nicht mehr das letzte Verzeichnis ab; die Konfiguration wird auch unter `.../app` gefunden
- **FIX:** Klick auf einen Hash-Link, der bereits die aktive Seite bezeichnet, rendert die Seite neu (`setupSamePageLinks()`) - das Logo fuehrt damit aus Unteransichten zurueck zur Startseite
- **ENH:** `app/app-base.js` ist wieder byte-identisch zum Template `oda-generic` 1.4.0; app-spezifisches Aufraeumen laeuft ueber den neuen Hook `onPageLeave(page)` in `app/app.js`
- **FIX:** Der Pfad zur Branding-CSS wird jetzt relativ zum App-Verzeichnis aufgeloest (`../assets/branding.css`); bisher wurde die Datei beim lokalen Test unterhalb von `app/` gesucht und deshalb nicht gefunden

## 1.2.0 - 2026-07-24

- **FIX:** Laufzeit-Fehlermeldung wird vor der Anzeige HTML-maskiert (`escapeHtmlForBase`); ein Fehlertext kann kein Markup mehr in die Seite einschleusen (XSS)
- **FIX:** Startseiten-Renderer wird nun `await`et; bei asynchronen Apps erscheint kein kurzzeitiges `[object Promise]` in `#main-content`

## 1.1.0 - 2026-07-23

- **ENH:** Datenabruf auf den Schalter `proxyAktiv` umgestellt; direkte Abrufe sind der Standard, der ODAS-Proxy wird nur noch bei `ja` verwendet
- **ENH:** Einfachen Standalone-Betrieb hinter Traefik mit derselben `odas-config/config.json` wie in der Entwicklung ergänzt
- **ENH:** Traefik-Anbindung auf das externe Netzwerk `proxynet`, den EntryPoint `websecure` und den Zertifikatsresolver `letsencrypt` festgelegt
- **FIX:** Proxy-Basispfad funktioniert jetzt auch bei URLs mit `index.html`; der Ziel-Pfad wird URL-kodiert
- **FIX:** Fetch-Helper auf die kanonische Portfolio-Fassung vereinheitlicht
- **DOC:** Start über `STANDALONE=true make up` dokumentiert

## 03.07.2026

- FIX: Datenquellen-Abschnitt der Beschreibungsseite als HTML-Absatz mit sauberer Linkliste formatiert.
- FIX: ODAS-Proxy-Endpunkt wird nun aus dem App-Verzeichnis gebildet, damit Live-URLs mit `/app/index.html` nicht fälschlich `/app/index.html/odp-data` aufrufen.
- FIX: Veraltete Greifswald-Resource-ID durch die aktuelle CKAN-Datastore-Resource `84b92272-86e5-4cd7-ad2f-4eff5a805823` ersetzt.
- FIX: Bestehende ODAS-Instanzkonfigurationen mit der alten Resource-ID werden beim Datenabruf automatisch auf die aktuelle Resource-ID migriert.

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
