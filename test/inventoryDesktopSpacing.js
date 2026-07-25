const assert = require("assert");
const fs = require("fs");

const inventoryCss = fs.readFileSync("public/css/inventory.css", "utf8");
const desktopBlock = inventoryCss.split("@media (max-width: 560px)")[0] || "";

assert(
  /\.inventory-grid\s*\{[\s\S]*?column-gap: 16px;[\s\S]*?row-gap: 20px;/.test(desktopBlock),
  "Inventory desktop card grid should increase vertical spacing without changing horizontal spacing."
);
assert(
  /\.scraping-list\s*\{[\s\S]*?column-gap: 10px;[\s\S]*?row-gap: 14px;/.test(desktopBlock),
  "Inventory desktop scraping submenu should separate card rows vertically."
);

console.log("--- INVENTORY DESKTOP SPACING TEST OK ---");
