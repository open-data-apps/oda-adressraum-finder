/*
 * ODAS-App „Adressraum-Finder"
 *
 * Diese Funktion ist für die Inhalte der Startseite zuständig.
 *
 * Der umschließende HTML code ist:
 *      <body>
 *      <div class="container mt-4" id="main-content">
 *          ...
 *      </div>
 *      </body>
 * Als CSS Framework wird Bootstrap 5.3 verwendet.
 *
 * @param {Object} configdata - Alle Konfigurationsdaten der App
 * @enclosingHtmlDivElement - HTML Knoten des umschließenden Tags
 * @returns {string | NULL} - darzustellendes HTML oder NULL wenn HTML Knoten direkt manipuliert wurde
 */

// ---- ODAS-Proxy-Helfer ----

function isOdasProxyEnabled(configdata = {}) {
  return String(configdata.proxyAktiv || "").trim().toLowerCase() === "ja";
}

function extractPathFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname + parsedUrl.search;
  } catch (_error) {
    return String(url || "");
  }
}

function getOdasAppBasePath(pathname) {
  let appPath =
    pathname === undefined
      ? typeof window !== "undefined"
        ? window.location.pathname
        : "/"
      : String(pathname || "/");

  if (!appPath.endsWith("/")) {
    const lastSlashIndex = appPath.lastIndexOf("/");
    const lastSegment = appPath.substring(lastSlashIndex + 1);
    if (lastSegment.includes(".")) {
      appPath = appPath.substring(0, lastSlashIndex + 1);
    }
  }

  return appPath.replace(/\/+$/, "");
}

function getOdasProxyEndpoint(targetUrl, pathname) {
  const appPath = getOdasAppBasePath(pathname);
  return `${appPath}/odp-data?path=${encodeURIComponent(
    extractPathFromUrl(targetUrl),
  )}`;
}

async function fetchViaOdasProxy(targetUrl) {
  const response = await fetch(getOdasProxyEndpoint(targetUrl), {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`ODAS-Proxy-Fehler: HTTP ${response.status}`);
  }

  const proxyData = await response.json();
  if (!proxyData || typeof proxyData.content !== "string") {
    throw new Error("ODAS-Proxy-Antwort enthält keinen content-String.");
  }

  return proxyData.content;
}

async function fetchOdasResource(targetUrl, configdata = {}) {
  if (isOdasProxyEnabled(configdata)) {
    return fetchViaOdasProxy(targetUrl);
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  } catch (error) {
    throw new Error(
      `Direkter Datenabruf fehlgeschlagen (${error.message}). Bitte prüfen Sie die Daten-URL und die CORS-Freigabe der Datenquelle.`,
    );
  }
}

/**
 * Löst eine benannte Datenressource aus configdata.apiurls auf.
 * Neue apiurls-Form (typ: "array"); das frühere skalare apiurl wird nicht mehr gelesen.
 * @returns {string} getrimmte URL, oder "" für den Zustand "keine Quelle konfiguriert"
 */
function getOdasApiUrl(configdata, name) {
  const liste = Array.isArray(configdata && configdata.apiurls) ? configdata.apiurls : [];
  const treffer = liste.find((eintrag) => eintrag && eintrag.name === name);
  return String((treffer && treffer.url) || "").trim();
}

async function fetchOdasJson(targetUrl, configdata = {}) {
  const rawContent = await fetchOdasResource(targetUrl, configdata);
  try {
    return JSON.parse(rawContent);
  } catch (_error) {
    throw new Error(
      `Die konfigurierte Daten-URL liefert kein JSON, sondern ${describeNonJsonPayload(rawContent)}. ` +
        "Bitte in der Instanzkonfiguration den API-Endpunkt der Datenquelle eintragen, " +
        "nicht den Datensatz- oder Download-Link.",
    );
  }
}

function describeNonJsonPayload(rawContent) {
  const text = String(rawContent == null ? "" : rawContent).trim();
  if (!text) return "eine leere Antwort";
  if (text.startsWith("<")) return "eine HTML-Seite";
  const firstLine = text.split(/\r?\n/, 1)[0];
  if (/[,;]/.test(firstLine)) return "eine CSV- oder Textdatei";
  return "unlesbaren Inhalt";
}

function escapeHtml(value) {
  value = value === undefined || value === null ? "" : value;
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---- App-Konstanten ----

var DIMENSIONS = [
  { key: "Stadtteil",  label: "Stadtteil",            numeric: false },
  { key: "StatBezirk", label: "Statistischer Bezirk", numeric: true  },
  { key: "SPIELRAUM",  label: "Spielraum",            numeric: true  },
  { key: "WABE",       label: "Wahlbereich",          numeric: false },
  { key: "STIBZ",      label: "Stimmbezirk",          numeric: false }
];

var TABLE_COLUMNS = [
  { key: "Adresse",    label: "Adresse" },
  { key: "PLZ",        label: "PLZ" },
  { key: "Stadtteil",  label: "Stadtteil" },
  { key: "StatBezirk", label: "Stat. Bezirk" },
  { key: "SPIELRAUM",  label: "Spielraum" },
  { key: "WABE",       label: "Wahlbereich" },
  { key: "STIBZ",      label: "Stimmbezirk" },
  { key: "BAUBLOCK",   label: "Baublock" }
];

var PAGE_SIZE = 25;
var CHARTJS_CDN = "vendor/chartjs/chart.umd.min.js";
var LEGACY_RESOURCE_IDS = [
  "68106345-abff-4454-97fa-76ff1b2a73c7",
  "84b92272-86e5-4cd7-ad2f-4eff5a805823"
];
var CURRENT_RESOURCE_ID = "c486c6e5-9a36-41e2-9c8e-9215959e03e3";

// ---- Instanz-State (je Container) ----

var afStates = new WeakMap();
var afWiredContainers = new WeakMap();

// Iterierbare Cleanup-Registry (F-57): je gemountetem Container ein Teardown.
// Die Base ruft onPageLeave() zu Beginn von loadPage() auf; die Registry
// bleibt bewusst eine echte Map, damit onPageLeave sie durchlaufen und jeden
// Eintrag loeschen kann (die WeakMaps afStates/afWiredContainers unten bleiben
// unveraendert als schwache Referenzhalter).
var afCleanups = new Map();

var chartJsPromise = null;
let afInstanzZaehler = 0;

function createAfState(configdata, container) {
  return {
    uid: "i" + ++afInstanzZaehler,
    allRecords: [],
    currentLayerKey: "Stadtteil",
    currentStadtteil: "__alle__",
    currentSearch: "",
    currentPage: 1,
    chartInstance: null,
    disposed: false,
    appConfig: configdata || {},
    root: container,
    requestVersion: 0,
  };
}

// Wird von app/app-base.js zu Beginn von loadPage() aufgerufen (F-57).
function onPageLeave(page) {
  afCleanups.forEach(function (cleanup, container) {
    try {
      cleanup();
    } catch (error) {
      console.warn("Fehler beim Abraeumen der Adressraum-Finder-Instanz:", error);
    }
    afCleanups.delete(container);
  });
}

// ---- app(): synchron, wie Template ----

function app(configdata, enclosingHtmlDivElement) {
  if (configdata === undefined) configdata = {};
  const previousState = afStates.get(enclosingHtmlDivElement);
  if (previousState && previousState.chartInstance) {
    previousState.chartInstance.destroy();
  }
  const state = createAfState(configdata, enclosingHtmlDivElement);
  state.requestVersion += 1;
  const requestVersion = state.requestVersion;
  afStates.set(enclosingHtmlDivElement, state);

  // F-57: Cleanup synchron unmittelbar nach afStates.set registrieren. Beim
  // Seitenwechsel setzt onPageLeave den disposed-Zustand, raeumt die Chart ab
  // und entfernt den afStates-Eintrag (nur, wenn er noch diese Instanz meint).
  afCleanups.set(enclosingHtmlDivElement, function () {
    state.disposed = true;
    if (state.chartInstance) {
      state.chartInstance.destroy();
      state.chartInstance = null;
    }
    if (afStates.get(enclosingHtmlDivElement) === state) {
      afStates.delete(enclosingHtmlDivElement);
    }
  });

  const quelle = getOdasApiUrl(configdata, "adressraum");
  if (!quelle || /^\{\{.*\}\}$/.test(quelle) || /^<.*>$/.test(quelle)) {
    enclosingHtmlDivElement.innerHTML =
      '<div class="alert alert-info" role="alert">Es ist keine Datenquelle konfiguriert.</div>';
    return;
  }

  enclosingHtmlDivElement.innerHTML =
    '<div class="text-center my-5">' +
    '<div class="spinner-border" role="status"></div>' +
    '<p class="mt-3">Daten werden geladen …</p></div>';

  initApp(state, requestVersion).catch(function (err) {
    if (state.disposed) return;
    if (afStates.get(enclosingHtmlDivElement) !== state) return;
    console.error(err);
    enclosingHtmlDivElement.innerHTML =
      '<div class="alert alert-danger my-4"><h4 class="alert-heading">Fehler beim Laden der Daten</h4>' +
      '<p>' + escapeHtml(err.message) + '</p><hr>' +
      '<p class="mb-0">Bei aktivem ODAS-Proxy sind echte Abrufe nur im ODAS-Live-System möglich.</p></div>';
  });
}

async function initApp(state, requestVersion) {
  var url = buildDataUrl(getOdasApiUrl(state.appConfig, "adressraum"));
  var text = await fetchOdasResource(url, state.appConfig);
  var parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_error) {
    throw new Error(
      "Die konfigurierte Daten-URL liefert kein CKAN-datastore_search-JSON (z. B. eine CSV- oder HTML-Seite). " +
      "Bitte in der Instanzkonfiguration den datastore_search-API-Endpunkt eintragen, nicht den Datensatz- " +
      "oder Download-Link."
    );
  }

  if (!parsed || !parsed.success || !parsed.result) {
    throw new Error("Unerwartetes API-Antwortformat – erwartet CKAN datastore_search JSON.");
  }

  if (requestVersion !== state.requestVersion || afStates.get(state.root) !== state || state.disposed) return;

  state.allRecords = (parsed.result.records || []).map(normalizeRecord);
  renderApp(state);
}

function buildDataUrl(apiurl) {
  var base = migrateLegacyResourceId(normalizeResourceDownloadUrl(String(apiurl || "").trim()));
  if (!base || /^\{\{.*\}\}$/.test(base) || /^<.*>$/.test(base)) {
    throw new Error("Keine Daten-URL (apiurls.adressraum) konfiguriert.");
  }
  if (base.indexOf("limit=") !== -1) return base;
  return base + (base.indexOf("?") !== -1 ? "&" : "?") + "limit=50000";
}

// Wandelt einen CKAN-Ressourcen-Download-Link (wie er beim Kopieren aus dem
// Open-Data-Portal entsteht) in den zugehörigen datastore_search-API-Endpunkt um.
// Andere URLs bleiben unverändert.
function normalizeResourceDownloadUrl(url) {
  var match = /^(https?:\/\/[^/]+)\/dataset\/[^/]+\/resource\/([0-9a-f-]{36})\/download\/.+$/i.exec(url);
  if (!match) return url;
  return match[1] + "/api/3/action/datastore_search?resource_id=" + match[2];
}

function migrateLegacyResourceId(url) {
  var i;
  for (i = 0; i < LEGACY_RESOURCE_IDS.length; i++) {
    if (url.indexOf(LEGACY_RESOURCE_IDS[i]) !== -1) {
      return url.split(LEGACY_RESOURCE_IDS[i]).join(CURRENT_RESOURCE_ID);
    }
  }
  return url;
}

function normalizeRecord(r) {
  function v(x) { return x === null || x === undefined ? "" : String(x).trim(); }
  return {
    Adresse: v(r.Adresse),
    STRN: v(r.STRN),
    HNR: v(r.HNR),
    PLZ: v(r.PLZ),
    Stadtteil: v(r.Stadtteil),
    Stadtteil_Nr: v(r.Stadtteil_Nr),
    StatBezirk: v(r.StatBezirk),
    BAUBLOCK: v(r.BAUBLOCK),
    BLK: v(r.BLK),
    BLKS: v(r.BLKS),
    SPIELRAUM: v(r.SPIELRAUM),
    WABE: v(r.WABE),
    STIBZ: v(r.STIBZ),
    Stand: v(r.Stand)
  };
}

function distinctSorted(state, key, numeric) {
  var arr = [];
  var i, val;
  for (i = 0; i < state.allRecords.length; i++) {
    val = state.allRecords[i][key];
    if (val !== "" && arr.indexOf(val) === -1) arr.push(val);
  }
  arr.sort(function (a, b) {
    return numeric ? Number(a) - Number(b) : a.localeCompare(b, "de");
  });
  return arr;
}

function getFilteredRecords(state) {
  var q = state.currentSearch.trim().toLowerCase();
  var i, r;
  var out = [];
  for (i = 0; i < state.allRecords.length; i++) {
    r = state.allRecords[i];
    if (state.currentStadtteil !== "__alle__" && r.Stadtteil !== state.currentStadtteil) continue;
    if (q && r.Adresse.toLowerCase().indexOf(q) === -1 && r.STRN.toLowerCase().indexOf(q) === -1) continue;
    out.push(r);
  }
  return out;
}

function aggregate(records, key) {
  var m = new Map();
  var i, r, val, count;
  for (i = 0; i < records.length; i++) {
    r = records[i];
    val = r[key];
    if (val === "") continue;
    count = m.get(val) || 0;
    m.set(val, count + 1);
  }
  var entries = [];
  m.forEach(function (c, v) { entries.push([v, c]); });
  entries.sort(function (a, b) { return b[1] - a[1]; });
  return entries;
}

function formatNumber(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ---- Render-Funktionen ----

function renderApp(state) {
  var html = "";
  html += renderFrischeLabel(state);
  html += renderKpis(state);
  html += renderStructureBlock(state);
  html += renderTableBlock(state);
  html += createMethodikBox(state);
  html += createWeitereInfos(state.appConfig);
  state.root.innerHTML = html;
  wireEvents(state);
  drawChart(state);
  updateTable(state);
}

function renderFrischeLabel(state) {
  var stand = extractDatenStand(state);
  if (!stand) return "";
  return '<div class="text-muted small text-end mb-2">Aktualisiert: ' + escapeHtml(stand) + '</div>';
}

function extractDatenStand(state) {
  if (!state.allRecords.length) return null;
  var raw = state.allRecords[0].Stand;
  if (!raw) return null;
  var parts = raw.split("-");
  if (parts.length === 3) return parts[2] + "." + parts[1] + "." + parts[0];
  return raw;
}

function renderKpis(state) {
  var adressen = state.allRecords.length;
  var stadtteile = distinctSorted(state, "Stadtteil", false).length;
  var spielraeume = distinctSorted(state, "SPIELRAUM", true).length;
  var stimmbezirke = distinctSorted(state, "STIBZ", false).length;

  return (
    '<div class="row mb-4">' +
    kpiCard(state, "Adressen gesamt", formatNumber(adressen), state.appConfig.kpiKontext1, 1) +
    kpiCard(state, "Stadtteile", stadtteile, state.appConfig.kpiKontext2, 2) +
    kpiCard(state, "Spielräume", spielraeume, state.appConfig.kpiKontext3, 3) +
    kpiCard(state, "Stimmbezirke", stimmbezirke, state.appConfig.kpiKontext4, 4) +
    '</div>'
  );
}

function kpiCard(state, label, wert, kontext, n) {
  return (
    '<div class="col-md-3 col-sm-6 mb-3">' +
    '<div class="card text-center h-100">' +
    '<div class="card-body">' +
    '<div class="text-muted small">' + escapeHtml(String(label)) + '</div>' +
    '<div class="fs-4 fw-semibold">' + escapeHtml(String(wert)) + '</div>' +
    createKpiContext(state, kontext, n) +
    '</div></div></div>'
  );
}

function createKpiContext(state, kontext, n) {
  var k = (kontext || "").trim();
  if (!k) return "";
  return (
    '<button class="btn btn-link btn-sm p-0 mt-1 collapsed text-decoration-none" type="button" ' +
    'data-bs-toggle="collapse" data-bs-target="#af-kpi-kontext-' + n + '-' + state.uid + '" ' +
    'aria-expanded="false" aria-controls="af-kpi-kontext-' + n + '-' + state.uid + '" ' +
    'aria-label="Erklärung zu diesem Wert">' +
    '<span aria-hidden="true">ⓘ</span></button>' +
    '<div id="af-kpi-kontext-' + n + '-' + state.uid + '" class="collapse">' +
    '<div class="text-muted small mt-1">' + escapeHtml(k) + '</div></div>'
  );
}

function renderStructureBlock(state) {
  var layerOpts = "";
  for (var i = 0; i < DIMENSIONS.length; i++) {
    var dim = DIMENSIONS[i];
    var sel = dim.key === state.currentLayerKey ? " selected" : "";
    layerOpts += '<option value="' + dim.key + '"' + sel + '>' + escapeHtml(dim.label) + '</option>';
  }

  var stadtteile = distinctSorted(state, "Stadtteil", false);
  var stadtOpts = '<option value="__alle__"' + (state.currentStadtteil === "__alle__" ? " selected" : "") + '>Alle Stadtteile</option>';
  for (var j = 0; j < stadtteile.length; j++) {
    var s = stadtteile[j];
    var ssel = s === state.currentStadtteil ? " selected" : "";
    stadtOpts += '<option value="' + escapeHtml(s) + '"' + ssel + '>' + escapeHtml(s) + '</option>';
  }

  return (
    '<section class="mb-4">' +
    '<h2 class="h5">Struktur-Übersicht</h2>' +
    '<div class="row mb-2">' +
    '<div class="col-md-6 mb-2">' +
    '<label for="layer-select-' + state.uid + '" class="form-label small text-muted">Auswertung nach</label>' +
    '<select id="layer-select-' + state.uid + '" class="form-select form-select-sm">' + layerOpts + '</select>' +
    '</div>' +
    '<div class="col-md-6 mb-2">' +
    '<label for="stadtteil-filter-' + state.uid + '" class="form-label small text-muted">Eingrenzen auf</label>' +
    '<select id="stadtteil-filter-' + state.uid + '" class="form-select form-select-sm">' + stadtOpts + '</select>' +
    '</div>' +
    '</div>' +
    '<div id="af-chart-container-' + state.uid + '" style="height:300px;position:relative;">' +
    '<canvas id="af-layer-chart-' + state.uid + '"></canvas>' +
    '</div>' +
    '</section>'
  );
}

function renderTableBlock(state) {
  return (
    '<section class="mb-4">' +
    '<h2 class="h5">Adress-Auskunft</h2>' +
    '<div class="mb-2">' +
    '<input id="adress-suche" type="text" class="form-control form-control-sm" ' +
    'placeholder="Adresse oder Straße suchen …" value="' + escapeHtml(state.currentSearch) + '">' +
    '</div>' +
    '<div id="af-table-wrapper-' + state.uid + '"></div>' +
    '</section>'
  );
}

// ---- Schale 4: Methodikbox (TODO 2) ----

function createMethodikBox(state) {
  var hinweis = (state.appConfig.datenquelleHinweis || "").trim();
  var stand = (state.appConfig.datenStand || "").trim();
  if (!hinweis && !stand) return "";

  var standZeile = stand
    ? '<p class="text-muted small mb-2">' + escapeHtml(stand) + '</p>'
    : "";

  return (
    '<div class="accordion mb-4" id="af-methodik-acc-' + state.uid + '">' +
    '<div class="accordion-item">' +
    '<h2 class="accordion-header">' +
    '<button class="accordion-button collapsed" type="button" ' +
    'data-bs-toggle="collapse" data-bs-target="#af-methodik-body-' + state.uid + '" ' +
    'aria-expanded="false" aria-controls="af-methodik-body-' + state.uid + '">' +
    'Methodik &amp; Datenquelle' +
    '</button></h2>' +
    '<div id="af-methodik-body-' + state.uid + '" class="accordion-collapse collapse" ' +
    'data-bs-parent="#af-methodik-acc-' + state.uid + '">' +
    '<div class="accordion-body">' +
    standZeile +
    hinweis +
    '</div></div></div></div>'
  );
}

// ---- Schale 4: Weitere Infos (TODO 4) ----

function createWeitereInfos(configdata) {
  var links = (configdata.weiterfuehrendeLinks || "").trim();
  if (!links) return "";
  return (
    '<section class="mt-4">' +
    '<h2 class="h5">Weitere Informationen</h2>' +
    '<div>' + links + '</div></section>'
  );
}

// ---- Chart.js dynamisch laden ----

function loadChartJs() {
  if (window.Chart) return Promise.resolve();
  if (chartJsPromise) return chartJsPromise;
  chartJsPromise = new Promise(function (resolve, reject) {
    var s = document.createElement("script");
    s.src = CHARTJS_CDN;
    s.onload = function () { resolve(); };
    s.onerror = function () { reject(new Error("Chart.js konnte nicht geladen werden.")); };
    document.head.appendChild(s);
  });
  return chartJsPromise;
}

async function drawChart(state) {
  await loadChartJs();
  if (state.disposed) return;
  if (afStates.get(state.root) !== state) return;

  var dim = null;
  for (var i = 0; i < DIMENSIONS.length; i++) {
    if (DIMENSIONS[i].key === state.currentLayerKey) { dim = DIMENSIONS[i]; break; }
  }
  if (!dim) dim = DIMENSIONS[0];

  var data = aggregate(getFilteredRecords(state), dim.key);
  var canvas = state.root.querySelector("#af-layer-chart-" + state.uid);
  if (!canvas) return;

  var wrap = state.root.querySelector("#af-chart-container-" + state.uid);
  if (wrap) {
    wrap.style.height = Math.max(260, data.length * 22 + 60) + "px";
  }

  if (state.chartInstance) state.chartInstance.destroy();

  state.chartInstance = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: data.map(function (d) { return d[0]; }),
      datasets: [{
        label: "Adressen",
        data: data.map(function (d) { return d[1]; }),
        backgroundColor: "#3d3fa5",
        borderRadius: 2
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });
}

// ---- Tabelle & Pagination ----

function updateTable(state) {
  var wrapper = state.root.querySelector("#af-table-wrapper-" + state.uid);
  if (!wrapper) return;

  var filtered = getFilteredRecords(state);
  var total = filtered.length;
  var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (state.currentPage > totalPages) state.currentPage = 1;
  var start = (state.currentPage - 1) * PAGE_SIZE;
  var page = filtered.slice(start, start + PAGE_SIZE);

  var html = "";

  html += '<div class="d-flex justify-content-between align-items-center mb-2">';
  html += '<span class="text-muted small">' + formatNumber(total) + ' Adresse' + (total !== 1 ? "n" : "") + ' gefunden</span>';
  if (totalPages > 1) {
    html += '<span class="text-muted small">Seite ' + state.currentPage + ' von ' + totalPages + '</span>';
  }
  html += '</div>';

  html += '<div class="table-responsive"><table class="table table-sm table-striped table-hover">';
  html += '<thead class="table-light"><tr>';
  for (var c = 0; c < TABLE_COLUMNS.length; c++) {
    html += '<th>' + escapeHtml(TABLE_COLUMNS[c].label) + '</th>';
  }
  html += '</tr></thead><tbody>';

  if (page.length === 0) {
    html += '<tr><td colspan="' + TABLE_COLUMNS.length + '" class="text-center text-muted py-3">Keine Ergebnisse</td></tr>';
  } else {
    for (var r = 0; r < page.length; r++) {
      var row = page[r];
      html += '<tr>';
      for (var k = 0; k < TABLE_COLUMNS.length; k++) {
        html += '<td>' + escapeHtml(row[TABLE_COLUMNS[k].key]) + '</td>';
      }
      html += '</tr>';
    }
  }
  html += '</tbody></table></div>';

  if (totalPages > 1) {
    html += '<nav><ul class="pagination pagination-sm justify-content-center flex-wrap">';

    html += '<li class="page-item' + (state.currentPage <= 1 ? " disabled" : "") + '">';
    html += '<button class="page-link" data-page="' + (state.currentPage - 1) + '"' + (state.currentPage <= 1 ? " disabled" : "") + '>Zurück</button>';
    html += '</li>';

    var maxBtns = 7;
    var pgStart = Math.max(1, state.currentPage - Math.floor(maxBtns / 2));
    var pgEnd = Math.min(totalPages, pgStart + maxBtns - 1);
    if (pgEnd - pgStart < maxBtns - 1) pgStart = Math.max(1, pgEnd - maxBtns + 1);

    for (var p = pgStart; p <= pgEnd; p++) {
      html += '<li class="page-item' + (p === state.currentPage ? " active" : "") + '">';
      html += '<button class="page-link" data-page="' + p + '">' + p + '</button>';
      html += '</li>';
    }

    html += '<li class="page-item' + (state.currentPage >= totalPages ? " disabled" : "") + '">';
    html += '<button class="page-link" data-page="' + (state.currentPage + 1) + '"' + (state.currentPage >= totalPages ? " disabled" : "") + '>Weiter</button>';
    html += '</li>';

    html += '</ul></nav>';
  }

  wrapper.innerHTML = html;
}

// ---- Event-Listener (Delegation auf root) ----

function wireEvents(state) {
  var root = state.root;
  if (afWiredContainers.get(root)) return;
  afWiredContainers.set(root, true);

  function readState() {
    return afStates.get(root) || state;
  }

  root.addEventListener("change", function (e) {
    var st = readState();
    if (e.target.id === "layer-select-" + state.uid) {
      st.currentLayerKey = e.target.value;
      drawChart(st);
    }
    if (e.target.id === "stadtteil-filter-" + state.uid) {
      st.currentStadtteil = e.target.value;
      st.currentPage = 1;
      drawChart(st);
      updateTable(st);
    }
  });

  root.addEventListener("input", function (e) {
    if (e.target.id === "adress-suche") {
      var st = readState();
      st.currentSearch = e.target.value;
      st.currentPage = 1;
      updateTable(st);
    }
  });

  root.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    var pageNum = parseInt(btn.getAttribute("data-page"), 10);
    if (isNaN(pageNum)) return;
    var st = readState();
    st.currentPage = pageNum;
    updateTable(st);
  });
}

/*
 * Diese Funktion kann Bibliotheken und benötigte Skripte laden.
 * Chart.js wird dynamisch in loadChartJs() geladen, nicht hier.
 */
function addToHead() {}
