const assert = require("assert");
const fs = require("fs");

const inventorySource = fs.readFileSync("public/inventory.js", "utf8");
const inventoryCss = fs.readFileSync("public/css/inventory.css", "utf8");

assert(
  inventorySource.includes("function setCardZoomArtFocus(active)"),
  "Inventory should have a dedicated zoom-art focus mode toggle."
);
assert(
  /cardZoomArt"\)\.addEventListener\("pointerenter"[\s\S]*?setCardZoomArtFocus\(true\)/.test(inventorySource),
  "Inventory zoom focus should activate only when hovering the zoom art element."
);
assert(
  /event\.pointerType === "touch"[\s\S]*?return/.test(inventorySource),
  "Inventory zoom focus should not activate on touch pointers."
);
assert(
  /function closeCardZoom\(\) \{[\s\S]*?setCardZoomArtFocus\(false\)/.test(inventorySource),
  "Inventory zoom focus should clear when the zoom overlay closes."
);
assert(
  /\.card-zoom-content\.is-art-focus::before\s*\{[\s\S]*?opacity: 1/.test(inventoryCss),
  "Inventory zoom focus should darken the zoom content around the art."
);
assert(
  /\.card-zoom-content\.is-art-focus \.card-zoom-art \.card-cost,[\s\S]*?\.card-zoom-content\.is-art-focus \.card-zoom-art \.card-footer\s*\{[\s\S]*?opacity: 0;[\s\S]*?visibility: hidden;/.test(inventoryCss),
  "Inventory zoom focus should hide card stats and badges while the art is focused."
);
assert(
  /\.card-zoom-content\.is-art-focus \.card-zoom-details\s*\{[\s\S]*?opacity: 0\.12/.test(inventoryCss),
  "Inventory zoom focus should dim the card details while the art is focused."
);

console.log("--- INVENTORY ZOOM FOCUS TEST OK ---");
