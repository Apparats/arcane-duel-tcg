const assert = require("assert");
const { getCardById } = require("../public/cards");

function assertCardStats(cardId, expected) {
  const card = getCardById(cardId);
  assert(card, `${cardId} should exist.`);
  Object.entries(expected).forEach(([field, value]) => {
    assert.deepStrictEqual(card[field], value, `${card.name} should have ${field}=${JSON.stringify(value)}.`);
  });
}

[
  "expansion1:manuchiliz",
  "expansion2:Aslani2",
  "expansion2:Babu2",
  "expansion2:high-inquisitor-knkl",
  "expansion2:lawrence-of-arabia",
  "expansion2:michiel-op-snuifari",
  "TheGates:cardinal-severin",
  "TheGates:chiorico",
  "TheGates:jacquedebalsac",
  "TheGates:overseer",
  "TheGates:toy",
  "base:goldenwarerita",
  "base:humph",
  "base:zugzwang",
].forEach((cardId) => {
  assert.strictEqual(getCardById(cardId).rarity, "legendary", `${cardId} should be Legendary.`);
});

assert.strictEqual(getCardById("expansion1:crowley-the-penguin").rarity, "mythic", "Crowley_The_Penguin should be Mythic.");
assert.strictEqual(getCardById("TheGates:kep").rarity, "mythic", "The Gates Kep should be Mythic.");
assert.strictEqual(getCardById("expansion1:aslani").rarity, "common", "The original Aslani should keep its rarity.");
assert.strictEqual(getCardById("base:babu").rarity, "rare", "The original Babu should keep its rarity.");
assert.strictEqual(getCardById("base:kep").rarity, "common", "The base Kep should keep its rarity.");

assertCardStats("expansion1:crowley-the-penguin", { cost: 6, health: 12, rarity: "mythic" });
assertCardStats("base:multimaker", { cost: 6 });
assertCardStats("base:humph", { cost: 6, attack: 7 });
assertCardStats("base:gabibbo-ardito", { cost: 5 });
assertCardStats("TheGates:toy", { cost: 4, health: 8 });
assertCardStats("TheGates:overseer", { keywords: ["charge"] });
assertCardStats("TheGates:mamaluteo", { cost: 5 });
assertCardStats("TheGates:cardinal-severin", { cost: 4, health: 10 });
assertCardStats("expansion2:michiel-op-snuifari", { cost: 5, health: 9 });
assertCardStats("expansion2:lawrence-of-arabia", { cost: 5, attack: 3, health: 9 });
assertCardStats("expansion2:high-inquisitor-knkl", { health: 3 });
assertCardStats("expansion2:Babu2", { attack: 5 });
assertCardStats("expansion2:Baatus2", { cost: 4, attack: 3 });
assertCardStats("expansion2:athena", { attack: 4 });

assert.strictEqual(
  getCardById("base:bloodgiver").abilities.find((ability) => ability.effect === "healSelf")?.value,
  3,
  "Bloodgiver should heal itself by 3."
);

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
