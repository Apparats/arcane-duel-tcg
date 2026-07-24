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

console.log("--- RARE BALANCE CHANGES TEST OK ---");
