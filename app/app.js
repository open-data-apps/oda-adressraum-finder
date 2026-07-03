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

function isOdasProxyEnabled(configdata) {
  if (configdata === undefined) configdata = {};
  return String(configdata.proxyAktiv || "").trim().toLowerCase() === "ja";
}

function extractPathFromUrl(url) {
  try {
    var parsedUrl = new URL(url);
    return parsedUrl.pathname + parsedUrl.search;
  } catch (e) {
    return url;
  }
}

function getOdasAppBasePath() {
  var pathname = window.location.pathname || "/";
  if (pathname.indexOf("#") !== -1) {
    pathname = pathname.split("#")[0];
  }
  if (pathname.indexOf("?") !== -1) {
    pathname = pathname.split("?")[0];
  }
  if (!pathname.endsWith("/")) {
    var lastSlash = pathname.lastIndexOf("/");
    var lastSegment = lastSlash === -1 ? pathname : pathname.substring(lastSlash + 1);
    if (lastSegment.indexOf(".") !== -1 && lastSlash !== -1) {
      pathname = pathname.substring(0, lastSlash + 1);
    }
  }
  return pathname.replace(/\/+$/, "");
}

function getOdasProxyEndpoint(targetUrl) {
  var fullPath = getOdasAppBasePath();
  var apiPath = extractPathFromUrl(targetUrl);
  return fullPath + "/odp-data?path=" + encodeURIComponent(apiPath);
}

async function fetchViaOdasProxy(targetUrl) {
  var response = await fetch(getOdasProxyEndpoint(targetUrl), {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Proxy-Fehler: HTTP " + response.status);
  }

  var proxyData = await response.json();
  if (!proxyData || typeof proxyData.content !== "string") {
    throw new Error("Proxy-Antwort enthaelt keinen content-String");
  }

  return proxyData.content;
}

async function fetchOdasResource(targetUrl, configdata) {
  if (configdata === undefined) configdata = {};
  if (isOdasProxyEnabled(configdata)) {
    return fetchViaOdasProxy(targetUrl);
  }

  var response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error("HTTP-Fehler: " + response.status);
  }

  return response.text();
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
var CHARTJS_CDN = "https://cdn.jsdelivr.net/npm/chart.js@4";
var LEGACY_RESOURCE_IDS = ["68106345-abff-4454-97fa-76ff1b2a73c7"];
var CURRENT_RESOURCE_ID = "84b92272-86e5-4cd7-ad2f-4eff5a805823";

// ---- Modul-State ----

var allRecords = [];
var currentLayerKey = "Stadtteil";
var currentStadtteil = "__alle__";
var currentSearch = "";
var currentPage = 1;
var chartInstance = null;
var appConfig = {};
var appRootEl = null;
var chartJsPromise = null;
var eventsWired = false;

// ---- app(): synchron, wie Template ----

function app(configdata, enclosingHtmlDivElement) {
  if (configdata === undefined) configdata = {};
  appConfig = configdata;
  appRootEl = enclosingHtmlDivElement;

  if (allRecords.length) {
    renderApp();
    return;
  }

  enclosingHtmlDivElement.innerHTML =
    '<div class="text-center my-5">' +
    '<div class="spinner-border" role="status"></div>' +
    '<p class="mt-3">Daten werden geladen …</p></div>';

  initApp().catch(function (err) {
    console.error(err);
    enclosingHtmlDivElement.innerHTML =
      '<div class="alert alert-danger my-4"><h4 class="alert-heading">Fehler beim Laden der Daten</h4>' +
      '<p>' + escapeHtml(err.message) + '</p><hr>' +
      '<p class="mb-0">Bei aktivem ODAS-Proxy sind echte Abrufe nur im ODAS-Live-System möglich.</p></div>';
  });
}

async function initApp() {
  var url = buildDataUrl(appConfig.apiurl);
  var text = await fetchOdasResource(url, appConfig);
  var parsed = JSON.parse(text);

  if (!parsed || !parsed.success || !parsed.result) {
    throw new Error("Unerwartetes API-Antwortformat – erwartet CKAN datastore_search JSON.");
  }

  allRecords = (parsed.result.records || []).map(normalizeRecord);
  renderApp();
}

function buildDataUrl(apiurl) {
  var base = migrateLegacyResourceId(String(apiurl || "").trim());
  if (!base) throw new Error("Keine Daten-URL (apiurl) konfiguriert.");
  if (base.indexOf("limit=") !== -1) return base;
  return base + (base.indexOf("?") !== -1 ? "&" : "?") + "limit=9000";
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

function distinctSorted(key, numeric) {
  var arr = [];
  var i, val;
  for (i = 0; i < allRecords.length; i++) {
    val = allRecords[i][key];
    if (val !== "" && arr.indexOf(val) === -1) arr.push(val);
  }
  arr.sort(function (a, b) {
    return numeric ? Number(a) - Number(b) : a.localeCompare(b, "de");
  });
  return arr;
}

function getFilteredRecords() {
  var q = currentSearch.trim().toLowerCase();
  var i, r;
  var out = [];
  for (i = 0; i < allRecords.length; i++) {
    r = allRecords[i];
    if (currentStadtteil !== "__alle__" && r.Stadtteil !== currentStadtteil) continue;
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

function renderApp() {
  var html = "";
  html += renderFrischeLabel();
  html += renderKpis();
  html += renderStructureBlock();
  html += renderTableBlock();
  html += createMethodikBox(appConfig);
  html += createWeitereInfos(appConfig);
  appRootEl.innerHTML = html;
  wireEvents();
  drawChart();
  updateTable();
}

function renderFrischeLabel() {
  var stand = extractDatenStand();
  if (!stand) return "";
  return '<div class="text-muted small text-end mb-2">Aktualisiert: ' + escapeHtml(stand) + '</div>';
}

function extractDatenStand() {
  if (!allRecords.length) return null;
  var raw = allRecords[0].Stand;
  if (!raw) return null;
  var parts = raw.split("-");
  if (parts.length === 3) return parts[2] + "." + parts[1] + "." + parts[0];
  return raw;
}

function renderKpis() {
  var adressen = allRecords.length;
  var stadtteile = distinctSorted("Stadtteil", false).length;
  var spielraeume = distinctSorted("SPIELRAUM", true).length;
  var stimmbezirke = distinctSorted("STIBZ", false).length;

  return (
    '<div class="row mb-4">' +
    kpiCard("Adressen gesamt", formatNumber(adressen), appConfig.kpiKontext1, 1) +
    kpiCard("Stadtteile", stadtteile, appConfig.kpiKontext2, 2) +
    kpiCard("Spielräume", spielraeume, appConfig.kpiKontext3, 3) +
    kpiCard("Stimmbezirke", stimmbezirke, appConfig.kpiKontext4, 4) +
    '</div>'
  );
}

function kpiCard(label, wert, kontext, n) {
  return (
    '<div class="col-md-3 col-sm-6 mb-3">' +
    '<div class="card text-center h-100">' +
    '<div class="card-body">' +
    '<div class="text-muted small">' + escapeHtml(String(label)) + '</div>' +
    '<div class="fs-4 fw-semibold">' + escapeHtml(String(wert)) + '</div>' +
    createKpiContext(kontext, n) +
    '</div></div></div>'
  );
}

function createKpiContext(kontext, n) {
  var k = (kontext || "").trim();
  if (!k) return "";
  return (
    '<button class="btn btn-link btn-sm p-0 mt-1 collapsed text-decoration-none" type="button" ' +
    'data-bs-toggle="collapse" data-bs-target="#kpi-kontext-' + n + '" ' +
    'aria-expanded="false" aria-controls="kpi-kontext-' + n + '" ' +
    'aria-label="Erklärung zu diesem Wert">' +
    '<span aria-hidden="true">ⓘ</span></button>' +
    '<div id="kpi-kontext-' + n + '" class="collapse">' +
    '<div class="text-muted small mt-1">' + escapeHtml(k) + '</div></div>'
  );
}

function renderStructureBlock() {
  var layerOpts = "";
  for (var i = 0; i < DIMENSIONS.length; i++) {
    var dim = DIMENSIONS[i];
    var sel = dim.key === currentLayerKey ? " selected" : "";
    layerOpts += '<option value="' + dim.key + '"' + sel + '>' + escapeHtml(dim.label) + '</option>';
  }

  var stadtteile = distinctSorted("Stadtteil", false);
  var stadtOpts = '<option value="__alle__"' + (currentStadtteil === "__alle__" ? " selected" : "") + '>Alle Stadtteile</option>';
  for (var j = 0; j < stadtteile.length; j++) {
    var s = stadtteile[j];
    var ssel = s === currentStadtteil ? " selected" : "";
    stadtOpts += '<option value="' + escapeHtml(s) + '"' + ssel + '>' + escapeHtml(s) + '</option>';
  }

  return (
    '<section class="mb-4">' +
    '<h2 class="h5">Struktur-Übersicht</h2>' +
    '<div class="row mb-2">' +
    '<div class="col-md-6 mb-2">' +
    '<label for="layer-select" class="form-label small text-muted">Auswertung nach</label>' +
    '<select id="layer-select" class="form-select form-select-sm">' + layerOpts + '</select>' +
    '</div>' +
    '<div class="col-md-6 mb-2">' +
    '<label for="stadtteil-filter" class="form-label small text-muted">Eingrenzen auf</label>' +
    '<select id="stadtteil-filter" class="form-select form-select-sm">' + stadtOpts + '</select>' +
    '</div>' +
    '</div>' +
    '<div id="chart-container" style="height:300px;position:relative;">' +
    '<canvas id="layer-chart"></canvas>' +
    '</div>' +
    '</section>'
  );
}

function renderTableBlock() {
  return (
    '<section class="mb-4">' +
    '<h2 class="h5">Adress-Auskunft</h2>' +
    '<div class="mb-2">' +
    '<input id="adress-suche" type="text" class="form-control form-control-sm" ' +
    'placeholder="Adresse oder Straße suchen …" value="' + escapeHtml(currentSearch) + '">' +
    '</div>' +
    '<div id="table-wrapper"></div>' +
    '</section>'
  );
}

// ---- Schale 4: Methodikbox (TODO 2) ----

function createMethodikBox(configdata) {
  var hinweis = (configdata.datenquelleHinweis || "").trim();
  var stand = (configdata.datenStand || "").trim();
  if (!hinweis && !stand) return "";

  var standZeile = stand
    ? '<p class="text-muted small mb-2">' + escapeHtml(stand) + '</p>'
    : "";

  return (
    '<div class="accordion mb-4" id="methodikAccordion">' +
    '<div class="accordion-item">' +
    '<h2 class="accordion-header">' +
    '<button class="accordion-button collapsed" type="button" ' +
    'data-bs-toggle="collapse" data-bs-target="#methodikBody" ' +
    'aria-expanded="false" aria-controls="methodikBody">' +
    'Methodik &amp; Datenquelle' +
    '</button></h2>' +
    '<div id="methodikBody" class="accordion-collapse collapse" ' +
    'data-bs-parent="#methodikAccordion">' +
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

async function drawChart() {
  await loadChartJs();

  var dim = null;
  for (var i = 0; i < DIMENSIONS.length; i++) {
    if (DIMENSIONS[i].key === currentLayerKey) { dim = DIMENSIONS[i]; break; }
  }
  if (!dim) dim = DIMENSIONS[0];

  var data = aggregate(getFilteredRecords(), dim.key);
  var canvas = document.getElementById("layer-chart");
  if (!canvas) return;

  var wrap = document.getElementById("chart-container");
  if (wrap) {
    wrap.style.height = Math.max(260, data.length * 22 + 60) + "px";
  }

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas.getContext("2d"), {
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

function updateTable() {
  var wrapper = document.getElementById("table-wrapper");
  if (!wrapper) return;

  var filtered = getFilteredRecords();
  var total = filtered.length;
  var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = 1;
  var start = (currentPage - 1) * PAGE_SIZE;
  var page = filtered.slice(start, start + PAGE_SIZE);

  var html = "";

  html += '<div class="d-flex justify-content-between align-items-center mb-2">';
  html += '<span class="text-muted small">' + formatNumber(total) + ' Adresse' + (total !== 1 ? "n" : "") + ' gefunden</span>';
  if (totalPages > 1) {
    html += '<span class="text-muted small">Seite ' + currentPage + ' von ' + totalPages + '</span>';
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

    html += '<li class="page-item' + (currentPage <= 1 ? " disabled" : "") + '">';
    html += '<button class="page-link" data-page="' + (currentPage - 1) + '"' + (currentPage <= 1 ? " disabled" : "") + '>Zurück</button>';
    html += '</li>';

    var maxBtns = 7;
    var pgStart = Math.max(1, currentPage - Math.floor(maxBtns / 2));
    var pgEnd = Math.min(totalPages, pgStart + maxBtns - 1);
    if (pgEnd - pgStart < maxBtns - 1) pgStart = Math.max(1, pgEnd - maxBtns + 1);

    for (var p = pgStart; p <= pgEnd; p++) {
      html += '<li class="page-item' + (p === currentPage ? " active" : "") + '">';
      html += '<button class="page-link" data-page="' + p + '">' + p + '</button>';
      html += '</li>';
    }

    html += '<li class="page-item' + (currentPage >= totalPages ? " disabled" : "") + '">';
    html += '<button class="page-link" data-page="' + (currentPage + 1) + '"' + (currentPage >= totalPages ? " disabled" : "") + '>Weiter</button>';
    html += '</li>';

    html += '</ul></nav>';
  }

  wrapper.innerHTML = html;
}

// ---- Event-Listener (Delegation auf appRootEl) ----

function wireEvents() {
  if (eventsWired) return;
  eventsWired = true;

  appRootEl.addEventListener("change", function (e) {
    if (e.target.id === "layer-select") {
      currentLayerKey = e.target.value;
      drawChart();
    }
    if (e.target.id === "stadtteil-filter") {
      currentStadtteil = e.target.value;
      currentPage = 1;
      drawChart();
      updateTable();
    }
  });

  appRootEl.addEventListener("input", function (e) {
    if (e.target.id === "adress-suche") {
      currentSearch = e.target.value;
      currentPage = 1;
      updateTable();
    }
  });

  appRootEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    var pageNum = parseInt(btn.getAttribute("data-page"), 10);
    if (isNaN(pageNum)) return;
    currentPage = pageNum;
    updateTable();
  });
}

/*
 * Diese Funktion kann Bibliotheken und benötigte Skripte laden.
 * Chart.js wird dynamisch in loadChartJs() geladen, nicht hier.
 */
function addToHead() {}
