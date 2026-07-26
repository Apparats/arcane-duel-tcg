const assert = require("assert");
const { getCardById } = require("../public/cards");

[
  "base:radu",
  "base:penquin",
  "base:mostor",
  "base:jakal",
  "expansion2:italo179",
  "expansion2:knud-the-dorf",
  "expansion1:vlad",
  "expansion1:moonhammer",
].forEach((cardId) => {
  assert.strictEqual(getCardById(cardId).rarity, "rare", `${cardId} should be Rare.`);
});

assert.strictEqual(getCardById("expansion1:moonhammer").cost, 7, "Moonhammer should cost 7 Mana.");
assert.strictEqual(getCardById("expansion1:vlad").cost, 8, "Vlad should cost 8 Mana.");

console.log("--- RARE BALANCE CHANGES TEST OK ---");
