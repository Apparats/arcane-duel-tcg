const assert = require("assert");
const fs = require("fs");

const inventorySource = fs.readFileSync("public/inventory.js", "utf8");
const clientSource = fs.readFileSync("public/client.js", "utf8");
const overlayCss = fs.readFileSync("public/css/overlay.css", "utf8");
const indexSource = fs.readFileSync("public/index.html", "utf8");

function frozenObjectAfter(source, marker, endMarker) {
  const start = source.indexOf(marker);
  assert(start >= 0, `${marker} should exist.`);
  const bodyStart = source.indexOf("Object.freeze(", start) + "Object.freeze(".length;
  const bodyEnd = source.indexOf(endMarker, bodyStart);
  assert(bodyStart >= 0 && bodyEnd > bodyStart, `${marker} should be parseable.`);
  return Function(`"use strict"; return (${source.slice(bodyStart, bodyEnd)});`)();
}

const countryCodeMap = frozenObjectAfter(clientSource, "const COUNTRY_CODE_BY_NAME", ");\nconst COUNTRY_FLAG_DESIGN_BY_CODE");
const countryDesignMap = frozenObjectAfter(clientSource, "const COUNTRY_FLAG_DESIGN_BY_CODE", ");\nconst BABU2_CARD_ID");

assert(clientSource.includes("function attachCardTooltip(el, card)"), "Shared card tooltip helper should exist.");
assert(clientSource.includes("startTouchCardTooltip"), "Shared tooltip helper should support touch hold.");
assert(clientSource.includes("card-tooltip-art"), "Tooltips should render a mini card face.");
assert(clientSource.includes("visualViewportBounds"), "Tooltips should position against the visible viewport.");
assert(clientSource.includes("chooseTooltipPosition"), "Tooltips should choose a viewport-safe side around the card.");
assert(clientSource.includes("function countryFlagHTML(country)"), "Shared card metadata should render non-emoji country flags.");
assert(clientSource.includes("function countryFlagSvg(code)"), "Country flags should be generated locally.");
assert(clientSource.includes("data:image/svg+xml"), "Country flags should use CSP-safe inline SVG image data.");
assert(!clientSource.includes("flagcdn.com"), "Country flags should not depend on an external flag host.");
assert(clientSource.includes('eeuu: "us"'), "Country flag mapping should support the existing EEUU card value.");
Object.values(countryCodeMap).forEach((code) => {
  assert(countryDesignMap[code], `Country flag design should exist for ${code}.`);
});
assert(clientSource.includes("country-flag-fallback"), "Country flags should have a non-emoji fallback for Arcana or unknown factions.");
assert(!clientSource.includes("🏳"), "Tooltips should not use the white flag emoji.");
assert(inventorySource.includes("attachCardTooltip(el, card)"), "Inventory cards should attach the shared tooltip helper.");
assert(/if\s*\(\s*unlocked\s*\)\s*attachCardTooltip\(el,\s*card\)/.test(inventorySource), "Inventory should attach tooltips to unlocked card faces.");
assert(inventorySource.includes("zoom-chip zoom-country"), "Inventory zoom should render country metadata as a flag chip.");
assert(inventorySource.includes("countryFlagHTML(card.country)"), "Inventory zoom should use the shared non-emoji flag renderer.");
assert(!inventorySource.includes("🏳"), "Inventory zoom should not use the white flag emoji.");
assert(/\.card-tooltip\s*\{[\s\S]*?z-index:\s*260/.test(overlayCss), "Card tooltip should sit above game UI.");
assert(/\.card-tooltip\s*\{[\s\S]*?width:\s*min\(90vw,\s*300px\)/.test(overlayCss), "Card tooltip should stay compact on desktop.");
assert(/\.card-tooltip-content\s*\{[\s\S]*?flex-direction:\s*column/.test(overlayCss), "Card tooltip should use a mini zoom-panel layout.");
assert(/\.card-tooltip-art\s*\{[\s\S]*?width:\s*clamp\(86px,\s*20vw,\s*112px\)/.test(overlayCss), "Card tooltip art should be small enough to fit inside the tip.");
assert(/\.card-tooltip-art\s*\{[\s\S]*?margin:\s*9px 10px 13px/.test(overlayCss), "Card tooltip art should reserve room for protruding cost, badges, and stats.");
assert(/\.card-tooltip-art \.card-cost\s*\{[\s\S]*?width:\s*21px/.test(overlayCss), "Card tooltip cost badge should be scaled for the tiny preview.");
assert(/\.card-tooltip-art \.card-stat\s*\{[\s\S]*?width:\s*18px/.test(overlayCss), "Card tooltip stats should be scaled for the tiny preview.");
assert(/\.country-flag\s*\{[\s\S]*?width:\s*18px;[\s\S]*?object-fit:\s*cover/.test(overlayCss), "Country flags should render as stable image boxes.");
assert(/\.country-flag-fallback\s*\{[\s\S]*?radial-gradient/.test(overlayCss), "Country flags should have a CSS fallback instead of emoji.");
assert(/\.tooltip-lore\s*\{[\s\S]*?font-size:\s*13\.5px/.test(overlayCss), "Tooltip description should remain legible.");
assert(/\.tooltip-lore\s*\{[\s\S]*?text-align:\s*center/.test(overlayCss), "Tooltip description should be centered.");
assert(indexSource.includes("css/overlay.css?v=1.7-v2"), "Overlay CSS cache bust should include the tooltip refresh.");
assert(indexSource.includes("client.js?v=1.7-v2"), "Client cache bust should include the tooltip refresh.");

console.log("--- INVENTORY TOOLTIP TEST OK ---");
