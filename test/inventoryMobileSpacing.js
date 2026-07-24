const assert = require("assert");
const fs = require("fs");

const inventoryCss = fs.readFileSync("public/css/inventory.css", "utf8");
const mobileBlock = inventoryCss.match(/@media \(max-width: 560px\) \{[\s\S]*?\n\}/)?.[0] || "";

assert(mobileBlock, "Inventory mobile media query should exist.");
assert(
  /\.inventory-grid\s*\{[\s\S]*?column-gap: 10px;[\s\S]*?row-gap: 18px;/.test(mobileBlock),
  "Inventory mobile card grid should increase vertical spacing without widening horizontal gaps."
);
assert(
  /\.scraping-list\s*\{ row-gap: 16px; \}/.test(mobileBlock),
  "Inventory scraping submenu should separate card rows vertically on mobile."
);

console.log("--- INVENTORY MOBILE SPACING TEST OK ---");
