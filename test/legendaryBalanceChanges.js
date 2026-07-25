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

["TheGates:chiorico", "TheGates:jacquedebalsac", "TheGates:toy"].forEach((cardId) => {
  const card = getCardById(cardId);
  assert.strictEqual(card.abilities.length, 2, `${card.name} should have an on-play status and a turn-start status ability.`);
  assert(card.abilities.some((ability) => ability.trigger === "onPlay" && ability.effect === "applyStatus"), `${card.name} should apply its status on play.`);
  assert(card.abilities.some((ability) => ability.trigger === "onTurnStart" && ability.effect === "applyStatusToRandomEnemyMinion" && ability.oncePerMinion !== true), `${card.name} should apply its turn-start effect repeatedly.`);
});

{
  const cardinal = getCardById("TheGates:cardinal-severin");
  assert.strictEqual(cardinal.abilities.length, 1, "Cardinal Severin should have a single silence ability.");
  assert.strictEqual(cardinal.abilities[0].trigger, "onPlay", "Cardinal Severin should silence on play.");
  assert.strictEqual(cardinal.abilities[0].effect, "applyStatusToAllEnemyMinions", "Cardinal Severin should affect all enemy minions.");
  assert.strictEqual(cardinal.abilities[0].status, "silenced", "Cardinal Severin should apply Silenced.");
  assert.strictEqual(cardinal.abilities[0].firstPlayOnly, true, "Cardinal Severin should silence only on first play.");
}

console.log("--- LEGENDARY BALANCE CHANGES TEST OK ---");
