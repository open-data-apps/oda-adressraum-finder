# Changelog

## 1.22.0 - 2026-08-21
- **CHG:** Skalares `apiurl` durch das Array-Feld `apiurls` ersetzt (`typ: "array"`, Eintrag `adressraum`). Neuer Standard portfolioweit; `apiurl` entfällt. `app.js` liest die Datenquelle jetzt über `getOdasApiUrl(configdata, "adressraum")`.

## 1.21.0 - 2026-08-20
- Markdown-Metadaten: Paketbeschreibungen auf echtes Markdown umgestellt, exakte Identität Top-Level/Instanz hergestellt, lokale HTML-Fixture semantisch gespiegelt.

## 1.20.0 - 2026-08-20
- FIX: Generierte IDs (u. a. `af-chart-container`, `af-layer-chart`, `af-table-wrapper`) tragen jetzt durchgängig die Instanzkennung (`uid`), nicht mehr nur die Bootstrap-Collapse-Ziele (F-71)

## 1.19.0 - 2026-08-17
- `fetchOdasJson()` wirft jetzt bei nicht-JSON-Antworten (CSV, HTML, leerer Body) eine sprechende Konfigurationsfehlermeldung statt der rohen `JSON.parse`-Parserfehlermeldung (F-66)

## 1.18.0 - 2026-08-17
- **CHG:** `instanz-config`-`category`-Vokabular auf Deutsch umgestellt (`allgemein`, `beschreibung`, `datenherkunft`, `kontakt-rechtliches`, `sonstiges`); die entfallenen Kategorien `metrics` und `advanced` wurden auf `beschreibung` bzw. `sonstiges` verteilt

## 1.17.0 - 2026-08-17
- FIX: Greifswald-Ressource auf die neu eingespielte `resource_id` migriert (`c486c6e5-…` statt `84b92272-…`, die jetzt 404 liefert) — die alte ID wandert in `LEGACY_RESOURCE_IDS`, Bestandsinstanzen heilen automatisch; `apiurl`-Default und `odas-config/config.json` mitgezogen
- FIX: Vom Portal kopierte Ressourcen-Download-Links (`/dataset/…/resource/<id>/download/…`) werden jetzt auf den zugehörigen `datastore_search`-Endpunkt umgeschrieben statt roh als Daten-URL verwendet
- FIX: Fehlschlagendes `JSON.parse` (z. B. bei CSV-/HTML-Antwort statt CKAN-JSON) zeigt jetzt eine verständliche Konfigurationsfehlermeldung statt der rohen Parser-Meldung
- CHG: `limit` von 9000 auf 50000 angehoben (Datensatz ist mit der neuen Ressource auf 8909 Zeilen gewachsen)

## 1.16.0 - 2026-08-13
- FIX: Lifecycle-Cleanup (F-57): je Instanz ein `disposed`-Flag plus iterierbare Cleanup-Registry; `onPageLeave` raeumt die Chart ab und verspaetete Daten-/Chart.js-Fortsetzungen bleiben nach einem Seitenwechsel wirkungslos

## 1.15.0 - 2026-08-12
- FIX: `app/index.html` auf den Template-Stand (F-47): Datei byte-gleich aus `oda-generic` übernommen — gültiges HTML, deutsche ARIA-Labels, Footer im Body; Titel und Fußzeile bleiben Platzhalter und werden zur Laufzeit aus der Instanz-Config überschrieben

## 1.14.0 - 2026-08-10
- FIX: Laufzeitzustand pro App-Instanz isolieren (F-34)

## 1.13.0 - 2026-08-08
- CHG: Bootstrap-Ziele instanzeindeutig (F-32): KPI-Kontext- und Methodik-Accordion-Ziele auf Portfolio-Stil umgestellt (`#kpi-kontext-<n>` → `#af-kpi-kontext-<n>-<afUid>`, `#methodikAccordion`/`#methodikBody` → `#af-methodik-acc-<afUid>`/`#af-methodik-body-<afUid>`) — mehrere Instanzen derselben App auf einer Seite klappen ihre Panels unabhängig auf

## 1.12.0 - 2026-08-06
- FIX: DOM-Zugriffe auf den App-Container gescopt; IDs der Diagramm- und Tabellen-Bereiche mit App-Praefix versehen (F-25)

## 1.11.0 - 2026-08-06
- FIX: Datenschutzangabe beschreibt den tatsaechlichen Stand nach dem Vendoring (Welle G)

## 1.10.0 - 2026-08-06
- FIX: Base auf Template oda-generic 1.6.0 vereinheitlicht (Hook renderPageOverride)

## 1.9.0 - 2026-08-04
- FIX: Datenschutzhinweis "Beim Aufruf kontaktierte Drittanbieter" an das Vendoring angepasst — jetzt lokal ausgelieferte Bibliotheken (Bootstrap/Leaflet/Chart.js) sind aus der Liste entfernt, weiterhin extern geladene Dienste (Kartenkacheln, Zusatzbibliotheken) bleiben genannt

## 1.8.0 - 2026-08-04
- FIX: Bootstrap, Chart.js vendored in `app/vendor/` statt von CDN geladen (F-07 Teil 2) — Standalone-Betrieb laedt diese Bibliotheken nicht mehr extern

## 1.7.0 - 2026-08-04
- FIX: Chart.js-Version vereinheitlicht auf 4.4.9 (vorher uneinheitlich gepinnt oder ganz ungepinnt, laedt bei jedem Aufruf die neueste Version) — Voraussetzung fuer das geplante Vendoring (F-07 Teil 2)

## 1.6.0 - 2026-08-04
- FIX: Drittanbieter (CDN, Kartendienste) in `datenschutz`-Default und README dokumentiert (F-07 Teil 1)
- FIX: Bootstrap CSS/JS auf einheitlich 5.3.8 gezogen (vorher gemischt 5.3.0/5.3.1 bzw. 5.3.0/5.3.0) (F-31)

## 1.5.0 - 2026-07-31
- DOC: Standalone-Anleitung individualisiert (F-10) - Abweichung zwischen Paket-Default
  (`ja`) und lokaler Konfiguration (`nein`) benannt; Austausch der Datenquelle ergaenzt
- DOC: Standalone als eingeschraenkt gekennzeichnet

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
