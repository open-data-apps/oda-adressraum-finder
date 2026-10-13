const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

// F-160: Nach Beschreibung→Start bleibt der Root verdrahtet, die neue Instanz bekommt eine neue UID.
test("Dropdowns wirken nach Rückkehr auf den aktuellen Instanz-State", () => {
  const context = vm.createContext({ console, window: {}, document: {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../app/app.js"), "utf8"), context);
  const calls = [];
  context.drawChart = st => calls.push(["chart", st.uid]);
  context.updateTable = st => calls.push(["table", st.uid]);
  const handlers = {};
  const root = { addEventListener: (type, fn) => { handlers[type] = fn; } };
  const erste = { root, uid: "i1", currentPage: 3 };
  vm.runInContext("(s) => afStates.set(s.root, s)", context)(erste);
  context.wireEvents(erste);
  const zweite = { root, uid: "i2", currentPage: 3, currentStadtteil: "", currentLayerKey: "stadtteil" };
  vm.runInContext("(s) => afStates.set(s.root, s)", context)(zweite);
  context.wireEvents(zweite);

  handlers.change({ target: { id: "stadtteil-filter-i2", value: "Ziel" } });
  handlers.change({ target: { id: "layer-select-i2", value: "statbezirk" } });

  assert.equal(zweite.currentStadtteil, "Ziel");
  assert.equal(zweite.currentPage, 1);
  assert.equal(zweite.currentLayerKey, "statbezirk");
  assert.deepEqual(calls, [["chart", "i2"], ["table", "i2"], ["chart", "i2"]]);
});
