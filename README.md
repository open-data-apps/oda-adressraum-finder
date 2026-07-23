# ODAS-App „Adressraum-Finder"

Der **Adressraum-Finder** visualisiert die kommunalstatistischen Raumeinheiten einer Stadt – welche Adresse gehört zu welchem Stadtteil, statistischen Bezirk, Baublock, Spielraum, Wahlbereich und Stimmbezirk?

Die App ist für die Verwendung im [Open Data App Store](https://open-data-app-store.de/) gemacht
und entspricht der [Open Data App](https://open-data-apps.github.io/open-data-app-docs/open-data-app-spezifikation/).

Mehr zu Open Data Apps unter https://github.com/open-data-apps

---

## Funktionen

Die App ist eine Single Page Application (Webapp) mit:

- Logo-Anzeige
- Menü
- Seiten für Impressum, Datenschutz, Beschreibung, Kontakt, Hauptinhalt
- Inhaltsbereich
- Fußzeile

Die Konfiguration wird vom ODAS geladen. Die App zeigt folgende Inhalte:

- **Kennzahlen**: Adressen gesamt, Anzahl Stadtteile, Anzahl Spielräume, Anzahl Stimmbezirke – jeweils mit konfigurierbarem Kontexttext (Schale 4)
- **Struktur-Übersicht**: Umschaltbare Auswertung nach Gliederungsebene (Stadtteil, Statistischer Bezirk, Spielraum, Wahlbereich, Stimmbezirk) als horizontales Balkendiagramm (Chart.js)
- **Stadtteil-Filter**: Schränkt Diagramm und Tabelle auf einen ausgewählten Stadtteil ein
- **Adress-Auskunft**: Durchsuchbare Tabelle aller Adressen mit Freitextsuche und client-seitiger Pagination (25 Einträge pro Seite)
- **Methodikbox**: Ausklappbare Sektion mit Informationen zu Datenquelle und Datenstand (Schale 4, konfigurierbar)
- **Datenfrische-Indikator**: Anzeige des Datenstands aus dem Datensatz (Schale 4)
- **Weiterführende Links**: Konfigurierbarer Abschnitt für verwandte Datensätze (Schale 4)

---

## Für wen ist diese App?

Diese App richtet sich an Bürger:innen, die schnell herausfinden möchten, in welchem Stimmbezirk, Spielraum oder Wahlbereich ihre Adresse liegt. Sie eignet sich ebenso für die Stadtverwaltung und kommunalstatistisch Interessierte, die einen Überblick über die kleinräumige Gliederungsstruktur benötigen. Datenfachwissen ist nicht erforderlich – die Bedienung ist selbsterklärend.

---

## Datenformat

Die App bezieht ihre Daten über die **CKAN-Datastore-API** (JSON):

- **Endpunkt**: `/api/3/action/datastore_search?resource_id=...`
- **Antwortformat**: `{ "success": true, "result": { "records": [...], "total": N, "fields": [...] } }`
- **Pagination**: Alle 8.894 Datensätze werden mit `limit=9000` in einem Request geladen.

---

## Kompatible Datensätze

Die App ist kompatibel mit kommunalen Datensätzen zur kleinräumigen Gliederung, die folgende Kernfelder enthalten:

| Schema-Feld    | Beschreibung           | Beispiel (Greifswald)     |
|----------------|------------------------|---------------------------|
| `Adresse`      | Vollständige Adresse   | `Aalbruch 1`              |
| `STRN`         | Straßenname            | `Aalbruch`                |
| `HNR`          | Hausnummer             | `1`, `1a`                 |
| `PLZ`          | Postleitzahl           | `17489`                   |
| `Stadtteil`    | Stadtteil-Bezeichnung  | `Fettenvorstadt/...`     |
| `Stadtteil_Nr` | Stadtteil-Nummer       | `6`                       |
| `StatBezirk`   | Statistischer Bezirk   | `2`                       |
| `BAUBLOCK`     | Baublock-Nummer        | `20`                      |
| `BLK`          | Baublock-Kennung       | `062020`                  |
| `BLKS`         | Baublockseite          | `0620202`                 |
| `SPIELRAUM`    | Spielraum-Nummer       | `63`                      |
| `WABE`         | Wahlbereich            | `2`                       |
| `STIBZ`        | Stimmbezirk            | `061`                     |
| `Stand`        | Datenstand             | `2026-04-27`              |

### Systemvoraussetzungen

- Docker / Docker Compose
- Make

Die Entwicklung wurde getestet unter Windows und Ubuntu.

### Starten

```bash
make build up
```

Die App wird gestartet und steht auf Port 8089 zur Verfügung: http://localhost:8089

Weil die App mit localhost gestartet wird, wird die Konfiguration lokal geladen.

### Lokale Entwicklung mit VS Code Live Server

Alternativ kann die App mit VS Code Live Server aus der Projektwurzel gestartet werden. Öffne dann `http://127.0.0.1:<live-server-port>/app/`; Live Server nutzt standardmäßig Port `5500`.

Empfohlene ODAS-Einstellungen:

```json
{
  "liveServer.settings.host": "127.0.0.1",
  "liveServer.settings.root": "/",
  "liveServer.settings.file": "app/index.html"
}
```

Für lokale Tests muss in `app/app-base.js` der auskommentierte `getConfigUrl()`-Localhost-Block temporär aktiviert werden. Vor ZIP-Erstellung und ODAS-Live-Auslieferung muss dieser wieder auskommentiert werden.

### Aufbau der App

Der Inhaltsbereich wird in `app.js` erstellt. Dort ist die gesamte Visualisierungslogik implementiert: Datenladen, Normalisierung, Filterung, Aggregation, Chart.js-Diagramme, Tabellen-Pagination und Schale-4-Komponenten.

### Wichtige Dateien

| Datei                      | Beschreibung                                                            |
|----------------------------|-------------------------------------------------------------------------|
| `app.js`                   | Hauptlogik: Datenladen, Aufbereitung, Chart.js-Diagramm, Tabelle        |
| `app-package.json`         | App-Metadaten und Instanz-Konfigurationsfelder für den ODAS             |
| `schema.json`              | Frictionless Data Schema – allgemeingültiges Datenmodell                |
| `assets/odas-app-icon.svg` | App-Icon                                                                |
| `config.json`              | Lokale Konfiguration für die Entwicklung                                |

---

## ODAS-Proxy

Die App unterstützt den ODAS-Proxy für CORS-blockierte Datenquellen:

- `proxyAktiv: "nein"` lädt Daten direkt per `fetch`.
- `proxyAktiv: "ja"` lädt Daten über den ODAS-Proxy-Endpunkt `odp-data`.

Die Greifswalder Datenquelle sendet keine CORS-Header. Im ODAS-Live-System ist daher `proxyAktiv: "ja"` empfohlen. Echte Proxy-Aufrufe funktionieren nur im ODAS-Live-System – lokal kann nur die Verdrahtung geprüft werden.

## Konfiguration (Instanz)

Folgende Parameter werden bei der App-Instanziierung im ODAS konfiguriert:

| Parameter              | Typ        | Beschreibung                                              | Pflicht |
|------------------------|------------|-----------------------------------------------------------|---------|
| `apiurl`               | url        | CKAN-Datastore-Endpunkt des Datensatzes                   | ja      |
| `urlDaten`             | url        | URL zur Katalog-Seite des Datensatzes im ODP              | ja      |
| `proxyAktiv`           | dropdown   | ODAS-Proxy aktivieren (`ja`/`nein`)                       | ja      |
| `titel`                | string     | Anzeigetitel der App                                      | ja      |
| `seitentitel`          | string     | Browser-Tab-Titel                                         | ja      |
| `kpiKontext1`–`4`      | string     | Erklärtext unter den KPI-Werten (Schale 4)                | nein    |
| `datenquelleHinweis`   | markdown   | Methodik- und Datenquellen-Hinweis (Schale 4)             | nein    |
| `datenStand`           | string     | Freitext-Datenstand (Schale 4)                            | nein    |
| `weiterfuehrendeLinks` | markdown   | Verwandte Datensätze / Links (Schale 4)                   | nein    |

Was bei der App-Entwicklung beachtet werden sollte, steht in der ODA-Spezifikation.

---

## Betriebsarten

Die App kann lokal, eigenstaendig hinter einem Traefik-Reverse-Proxy oder ueber den ODAS
betrieben werden.

### Datenabruf: `proxyAktiv`

| Wert   | Bedeutung                                                                   |
| ------ | --------------------------------------------------------------------------- |
| `nein` | Direkter Abruf der Daten-URL. Standard fuer Entwicklung und Standalone.      |
| `ja`   | Abruf ueber den ODAS-Proxy `…/odp-data`. Nur im ODAS-Live-System verfuegbar. |

Bei `nein` muss die Datenquelle CORS freigeben.

### Standalone-Betrieb

Voraussetzung: ein laufender Traefik mit dem externen Docker-Netzwerk `proxynet`,
dem EntryPoint `websecure` und dem Zertifikatsresolver `letsencrypt`.

1. In `docker-compose.standalone.yml` den Platzhalter `app1.example.com` durch den
   echten FQDN ersetzen.
2. In `odas-config/config.json` `proxyAktiv` auf `nein` belassen.
3. Starten:

```bash
STANDALONE=true make up
STANDALONE=true make logs
STANDALONE=true make down
```

Im Standalone-Betrieb entfaellt die lokale Portfreigabe; Traefik terminiert TLS und
leitet auf den internen Nginx-Port 80 weiter. Die Konfiguration wird aus derselben
`odas-config/config.json` gelesen wie in der Entwicklung und von Nginx unter `/config`
ausgeliefert.

### Auslieferung an den ODAS

`make zip` erzeugt das Liefer-ZIP mit `app/`, `assets/`, `app-package.json` und
`CHANGELOG.md`. Die Infrastrukturdateien (`Dockerfile`, `docker-compose*.yml`,
`nginx.conf`, `Makefile`) sind nicht Teil der Auslieferung.

## Autor

© 2026, Ondics GmbH
