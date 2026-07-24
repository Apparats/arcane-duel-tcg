const assert = require("assert");
const fs = require("fs");

const clientSource = fs.readFileSync("public/client.js", "utf8");
const cardsCss = fs.readFileSync("public/css/cards.css", "utf8");
const fxCss = fs.readFileSync("public/css/fx.css", "utf8");

assert(clientSource.includes("function cardHasSpecialEffect(card)"), "Client should expose a special-effect badge predicate.");
assert(clientSource.includes("function rarityClass(card)"), "Client should expose a rarity class helper.");
assert(
  clientSource.includes("catalogCard?.rarity || card?.rarity || \"common\""),
  "Rarity class should resolve catalog rarity before falling back to common."
);
assert(clientSource.includes('source?.type !== "minion"'), "Special badge should only apply to minion cards.");
assert(clientSource.includes("card?.cardId") && clientSource.includes("TCGCards.getCardById(card.cardId)"), "Special badge should resolve live board minions through their cardId.");
assert(!/cardHasSpecialEffect[\s\S]{0,500}card\?\.effect/.test(clientSource), "Special badge should not cover spell effects.");
assert(clientSource.includes("source?.damageBonuses"), "Special badge should cover damage bonuses.");
assert(clientSource.includes("source?.abilities"), "Special badge should cover abilities and passives.");
assert(!/cardHasSpecialEffect[\s\S]{0,400}keywords/.test(clientSource), "Special badge predicate should not depend on Taunt, Charge, or Divine Shield keywords.");
assert(clientSource.includes("function specialAbilityBadgeHTML(card)"), "Special ability badge should render through its own card badge helper.");
const keywordBadgeFunction = clientSource.match(/function keywordBadgesHTML\(card\) \{[\s\S]*?\n\}/)?.[0] || "";
assert(keywordBadgeFunction, "Keyword badge renderer should exist.");
assert(!keywordBadgeFunction.includes("special-ability-badge"), "Special ability badge should not be stacked with keyword badges.");
assert(clientSource.includes("${specialAbilityBadgeHTML(card)}") || clientSource.includes("${specialAbilityBadgeHTML(minion)}"), "Card markup should include the special ability badge helper.");
assert(fs.readFileSync("public/inventory.js", "utf8").includes("${specialAbilityBadgeHTML(card)}"), "Inventory card faces should include the special ability badge helper.");
assert(fs.readFileSync("public/packOpening.js", "utf8").includes("${specialAbilityBadgeHTML(card)}"), "Pack opening card faces should include the special ability badge helper.");
assert(cardsCss.includes(".special-ability-badge"), "Special ability badge must have CSS.");
assert(cardsCss.includes("#8547d6") || cardsCss.includes("#3d176f"), "Special ability badge should use a purple palette.");
assert(/\.special-ability-badge\s*\{[\s\S]*?position: absolute/.test(cardsCss), "Special ability badge should be positioned like an overhanging card marker.");
assert(/\.special-ability-badge\s*\{[\s\S]*?bottom: -12px[\s\S]*?left: 50%/.test(cardsCss), "Special ability badge should sit at the bottom center of the card.");
assert(/\.special-ability-badge\s*\{[\s\S]*?width: 16px[\s\S]*?height: 16px/.test(cardsCss), "Special ability badge should be 16px square.");
assert(/#screen-game \.minion-card \.special-ability-badge\s*\{[\s\S]*?bottom: -12px;[\s\S]*?z-index: 35;[\s\S]*?translateX\(-50%\) translateZ\(24px\)/.test(cardsCss), "Board special ability badge should sit on the lower edge above card UI layers.");
assert(/\.card-badges\s*\{[\s\S]*?top: -6px[\s\S]*?left: 50%[\s\S]*?flex-direction: row/.test(cardsCss), "Keyword badges should sit as top rectangular markers with limited overhang.");
assert(/\.keyword-badge\s*\{[\s\S]*?width: 34px[\s\S]*?height: 16px[\s\S]*?border-radius: 6px 6px 4px 4px/.test(cardsCss), "Keyword badges should be longer compact rectangles.");
assert(cardsCss.includes(".card-status-badges"), "Board statuses should stay separate from top keyword badges.");
assert(clientSource.includes('<div class="card-status-badges">${statusBadgesHTML(minion)}</div>'), "Board status badges should render in their own container.");
assert(clientSource.includes("function flashSpecialAbilityBadge(instanceId)"), "Client should flash the special ability badge by board instance.");
assert(clientSource.includes("next.specialAbilityActivations"), "Client should consume special ability activation events from state.");
assert(clientSource.includes("pendingSpecialActivations"), "Client should retry special badge flashes after rendering newly summoned minions.");
assert(fxCss.includes(".special-ability-badge.is-activating"), "Special ability badge should have an activation glow class.");
assert(fxCss.includes("@keyframes special-ability-badge-activate"), "Special ability badge should define a glow animation.");

const cardsSource = fs.readFileSync("public/cards.js", "utf8");
assert(cardsSource.includes('"id": "expansion1:baatus"'), "Rare Baatus should exist in the card catalog.");
assert(/"id": "expansion1:baatus"[\s\S]*?"abilities": \[/.test(cardsSource), "Rare Baatus should be detected as a special-effect minion.");

console.log("--- SPECIAL ABILITY BADGE TEST OK ---");
