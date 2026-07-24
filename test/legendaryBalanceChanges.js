const assert = require("assert");
const { getCardById } = require("../public/cards");

[
  "expansion1:crowley-the-penguin",
  "expansion1:manuchiliz",
  "expansion2:Aslani2",
  "expansion2:Babu2",
  "expansion2:high-inquisitor-knkl",
  "expansion2:lawrence-of-arabia",
  "expansion2:michiel-op-snuifari",
  "TheGates:cardinal-severin",
  "TheGates:chiorico",
  "TheGates:jacquedebalsac",
  "TheGates:kep",
  "TheGates:overseer",
  "TheGates:toy",
  "base:goldenwarerita",
  "base:humph",
  "base:zugzwang",
].forEach((cardId) => {
  assert.strictEqual(getCardById(cardId).rarity, "legendary", `${cardId} should be Legendary.`);
});

assert.strictEqual(getCardById("expansion1:aslani").rarity, "common", "The original Aslani should keep its rarity.");
assert.strictEqual(getCardById("base:babu").rarity, "rare", "The original Babu should keep its rarity.");
assert.strictEqual(getCardById("base:kep").rarity, "common", "The base Kep should keep its rarity.");

["TheGates:cardinal-severin", "TheGates:chiorico", "TheGates:jacquedebalsac", "TheGates:toy"].forEach((cardId) => {
  const card = getCardById(cardId);
  assert.strictEqual(card.abilities.length, 1, `${card.name} should have a single start-of-turn status ability.`);
  assert.strictEqual(card.abilities[0].trigger, "onTurnStart", `${card.name} should trigger at turn start.`);
  assert.strictEqual(card.abilities[0].oncePerMinion, true, `${card.name} should apply its turn-start effect once.`);
});

console.log("--- LEGENDARY BALANCE CHANGES TEST OK ---");
