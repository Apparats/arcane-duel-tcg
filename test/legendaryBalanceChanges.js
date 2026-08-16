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
  "expansion1:red",
  "expansion1:manuchiliz",
  "expansion2:Aslani2",
  "expansion2:Babu2",
  "expansion2:high-inquisitor-knkl",
  "expansion2:lawrence-of-arabia",
  "expansion2:michiel-op-snuifari",
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

assert.strictEqual(getCardById("expansion1:crowley-the-penguin").rarity, "mythic", "Crowley_The_Penguin should be Mythic.");
assert.strictEqual(getCardById("TheGates:cardinal-severin").rarity, "mythic", "Cardinal Severin should be Mythic.");
assert.strictEqual(getCardById("expansion1:aslani").rarity, "common", "The original Aslani should keep its rarity.");
assert.strictEqual(getCardById("base:babu").rarity, "rare", "The original Babu should keep its rarity.");
assert.strictEqual(getCardById("base:kep").rarity, "common", "The base Kep should keep its rarity.");

assertCardStats("expansion1:fanex", { cost: 4, attack: 4, health: 5 });
assertCardStats("expansion1:manuchiliz", { cost: 4, attack: 4, health: 6 });
assertCardStats("expansion1:red", { cost: 5 });
assertCardStats("expansion1:crowley-the-penguin", { cost: 6, health: 12, rarity: "mythic" });
assertCardStats("base:multimaker", { cost: 6 });
assertCardStats("base:humph", { cost: 5, attack: 5, health: 8 });
assertCardStats("base:gabibbo-ardito", { cost: 5 });
assertCardStats("TheGates:toy", { cost: 4, attack: 4, health: 7 });
assertCardStats("TheGates:overseer", { attack: 3, health: 6, keywords: ["charge"] });
assertCardStats("TheGates:mamaluteo", { cost: 5, attack: 5, health: 9 });
assertCardStats("TheGates:cardinal-severin", { cost: 5, health: 10, rarity: "mythic", keywords: [] });
assertCardStats("TheGates:jacquedebalsac", { health: 6 });
assertCardStats("TheGates:kep", { cost: 5, attack: 5, health: 8, rarity: "legendary" });
assertCardStats("expansion2:michiel-op-snuifari", { cost: 5, health: 9 });
assertCardStats("expansion2:lawrence-of-arabia", { cost: 4, attack: 2, health: 10 });
assertCardStats("expansion2:high-inquisitor-knkl", { health: 3 });
assertCardStats("expansion2:Babu2", { attack: 5 });
assertCardStats("expansion2:Baatus2", { cost: 5, attack: 3, health: 9 });
assertCardStats("expansion2:athena", { attack: 4, health: 7 });
assertCardStats("expansion2:Antichristjesus2", { cost: 4, attack: 4, health: 8 });
assertCardStats("TheGates:chiorico", { attack: 4, health: 7 });
assertCardStats("base:zugzwang", { cost: 5 });

assert.strictEqual(
  getCardById("base:bloodgiver").abilities.find((ability) => ability.effect === "healSelf")?.value,
  3,
  "Bloodgiver should heal itself by 3."
);

assert.deepStrictEqual(getCardById("special:moths").keywords, ["divineShield"], "Moths should have Divine Shield.");

["TheGates:jacquedebalsac", "TheGates:toy"].forEach((cardId) => {
  const card = getCardById(cardId);
  assert.strictEqual(card.abilities.length, 2, `${card.name} should have an on-play status and a turn-start status ability.`);
  assert(card.abilities.some((ability) => ability.trigger === "onPlay" && ability.effect === "applyStatus"), `${card.name} should apply its status on play.`);
  assert(card.abilities.some((ability) => ability.trigger === "onTurnStart" && ability.effect === "applyStatusToRandomEnemyMinion" && ability.oncePerMinion !== true), `${card.name} should apply its turn-start effect repeatedly.`);
});

{
  const chiorico = getCardById("TheGates:chiorico");
  assert.strictEqual(chiorico.abilities.length, 2, "Chiorico should have on-play and turn-start mark abilities.");
  assert(chiorico.abilities.some((ability) => ability.trigger === "onPlay" && ability.effect === "applyStatusToAllEnemyMinions" && ability.status === "marked"), "Chiorico should Mark all enemy minions on play.");
  assert(chiorico.abilities.some((ability) => ability.trigger === "onTurnStart" && ability.effect === "applyStatusToAllEnemyMinions" && ability.status === "marked"), "Chiorico should Mark all enemy minions at turn start.");
}

{
  const highInquisitor = getCardById("expansion2:high-inquisitor-knkl");
  assert(highInquisitor.abilities.some((ability) => ability.trigger === "onTurnStart" && ability.effect === "buffSelf" && ability.attack === 3 && ability.health === 3 && ability.maxApplications === 4), "High_Inquisitor_KnkL should gain +3/+3 up to 4 times.");
}

{
  const antichrist = getCardById("expansion2:Antichristjesus2");
  assert(antichrist.abilities.some((ability) => ability.effect === "immuneToAdverseEffects"), "Antichristjesus should be immune to adverse effects.");
}

{
  const cardinal = getCardById("TheGates:cardinal-severin");
  assert.strictEqual(cardinal.abilities.length, 2, "Cardinal Severin should have play and turn-start silence abilities.");
  assert.strictEqual(cardinal.abilities[0].trigger, "onPlay", "Cardinal Severin should silence on play.");
  assert.strictEqual(cardinal.abilities[0].effect, "applyStatusToAllEnemyMinions", "Cardinal Severin should affect all enemy minions.");
  assert.strictEqual(cardinal.abilities[1].trigger, "onTurnStart", "Cardinal Severin should silence a random enemy minion at turn start.");
  assert.strictEqual(cardinal.abilities[1].effect, "applyStatusToRandomEnemyMinion", "Cardinal Severin's turn-start effect should affect a random enemy minion.");
  assert.strictEqual(cardinal.abilities[1].status, "silenced", "Cardinal Severin's turn-start effect should apply Silenced.");
}

{
  const humph = getCardById("base:humph");
  assert(humph.abilities.some((ability) => ability.trigger === "onKillMinion" && ability.effect === "grantNextTurnTemporaryMana" && ability.value === 2), "Humph should grant 2 extra Mana next turn after killing a minion.");
}

{
  const kep = getCardById("TheGates:kep");
  assert(kep.abilities.some((ability) => ability.trigger === "onAttackMinion" && ability.effect === "damageRandomOtherEnemyMinionOrHero"), "Kep should repeat attack damage after attacking a minion.");
}

console.log("--- LEGENDARY BALANCE CHANGES TEST OK ---");
