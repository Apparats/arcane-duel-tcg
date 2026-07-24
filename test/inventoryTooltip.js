const assert = require("assert");
const fs = require("fs");

const inventorySource = fs.readFileSync("public/inventory.js", "utf8");
const clientSource = fs.readFileSync("public/client.js", "utf8");

assert(clientSource.includes("function attachCardTooltip(el, card)"), "Shared card tooltip helper should exist.");
assert(clientSource.includes("startTouchCardTooltip"), "Shared tooltip helper should support touch hold.");
assert(inventorySource.includes("attachCardTooltip(el, card)"), "Inventory cards should attach the shared tooltip helper.");
assert(/if\s*\(\s*unlocked\s*\)\s*attachCardTooltip\(el,\s*card\)/.test(inventorySource), "Inventory should attach tooltips to unlocked card faces.");

console.log("--- INVENTORY TOOLTIP TEST OK ---");
