const assert = require("assert");
const fs = require("fs");

const clientSource = fs.readFileSync("public/client.js", "utf8");
const cardsCss = fs.readFileSync("public/css/cards.css", "utf8");

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
assert(clientSource.includes("special-ability-badge"), "Keyword badge rendering should include the special ability badge.");
assert(cardsCss.includes(".special-ability-badge"), "Special ability badge must have CSS.");
assert(cardsCss.includes("#8547d6") || cardsCss.includes("#3d176f"), "Special ability badge should use a purple palette.");

const cardsSource = fs.readFileSync("public/cards.js", "utf8");
assert(cardsSource.includes('"id": "expansion1:baatus"'), "Rare Baatus should exist in the card catalog.");
assert(/"id": "expansion1:baatus"[\s\S]*?"abilities": \[/.test(cardsSource), "Rare Baatus should be detected as a special-effect minion.");

console.log("--- SPECIAL ABILITY BADGE TEST OK ---");
