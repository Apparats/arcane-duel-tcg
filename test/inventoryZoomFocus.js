const assert = require("assert");
const fs = require("fs");

const inventorySource = fs.readFileSync("public/inventory.js", "utf8");
const inventoryCss = fs.readFileSync("public/css/inventory.css", "utf8");
const indexSource = fs.readFileSync("public/index.html", "utf8");
const zoomMetaTemplate = inventorySource.match(/\$\("zoomMeta"\)\.innerHTML = `([\s\S]*?)`;/)?.[1] || "";

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
  /\.card-zoom-panel::after\s*\{[\s\S]*?inset: 0;[\s\S]*?opacity: 0/.test(inventoryCss) &&
    /\.card-zoom-panel\.is-art-focus::after\s*\{[\s\S]*?opacity: 1/.test(inventoryCss),
  "Inventory zoom focus should darken the whole zoom panel around the art."
);
assert(
  /\.card-zoom-panel\.is-art-focus \.card-zoom-art \.card-cost,[\s\S]*?\.card-zoom-panel\.is-art-focus \.card-zoom-art \.card-footer\s*\{[\s\S]*?opacity: 0;[\s\S]*?visibility: hidden;/.test(inventoryCss),
  "Inventory zoom focus should hide card stats and badges while the art is focused."
);
assert(
  /\.card-zoom-panel\.is-art-focus \.card-zoom-details\s*\{[\s\S]*?opacity: 0\.12/.test(inventoryCss),
  "Inventory zoom focus should dim the card details while the art is focused."
);
assert(
  /\.card-zoom-art\s*\{[\s\S]*?width: clamp\(280px, 34vw, 360px\)/.test(inventoryCss) &&
    /@media \(max-width: 560px\)[\s\S]*?\.card-zoom-art \{ width: min\(78vw, 300px\); \}/.test(inventoryCss),
  "Inventory zoom should keep the established card art dimensions."
);
assert(
  /\.card-zoom-content\s*\{[\s\S]*?flex-direction: column;/.test(inventoryCss),
  "Inventory zoom should keep the zoomed card panel vertical on desktop and mobile."
);
assert(
  /\.card-zoom-panel\s*\{[\s\S]*?width: min\(94vw, 480px\);/.test(inventoryCss),
  "Inventory zoom panel should keep a narrow card-like rectangle on desktop."
);
assert(
  /\.zoom-name\s*\{[\s\S]*?max-width: 100%;[\s\S]*?font-size: clamp\(20px, 2\.8vw, 30px\);[\s\S]*?overflow-wrap: anywhere;/.test(inventoryCss),
  "Inventory zoom names should wrap safely instead of overflowing the details panel."
);
assert(
  indexSource.includes('id="btnCloseZoom" class="btn-link close-zoom" type="button" aria-label="Close card preview">x</button>'),
  "Inventory zoom close button should render as an accessible X button."
);
assert(
  /\.close-zoom\s*\{[\s\S]*?width: 32px;[\s\S]*?height: 32px;[\s\S]*?border-radius: 50%;/.test(inventoryCss),
  "Inventory zoom close button should be a compact styled X control."
);
assert(
  zoomMetaTemplate && !/\$\{card\.cost\} mana/.test(zoomMetaTemplate),
  "Inventory zoom metadata should not include a Mana chip."
);
assert(
  zoomMetaTemplate.includes("countryFlagHTML(card.country)") && zoomMetaTemplate.includes("zoom-chip zoom-country"),
  "Inventory zoom metadata should render the country with the shared non-emoji flag helper."
);
assert(
  !zoomMetaTemplate.includes("🏳"),
  "Inventory zoom metadata should not use platform-dependent flag emoji."
);
assert(
  indexSource.includes("css/inventory.css?v=1.7.3") && indexSource.includes("inventory.js?v=1.7.3"),
  "Inventory zoom country flag changes should be cache-busted."
);
["common", "rare", "legendary", "mythic", "souvenir"].forEach((rarity) => {
  assert(
    inventoryCss.includes(`.card-zoom-panel.rarity-${rarity}`),
    `Inventory zoom should style ${rarity} rarity panels.`
  );
});
assert(
  /--zoom-rarity-accent/.test(inventoryCss) &&
    /\.card-zoom-panel::before\s*\{[\s\S]*?var\(--zoom-rarity-accent\)/.test(inventoryCss),
  "Inventory zoom rarity panels should use shared rarity decoration variables."
);

console.log("--- INVENTORY ZOOM FOCUS TEST OK ---");
