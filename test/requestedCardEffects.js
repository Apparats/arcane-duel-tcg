const assert = require("assert");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function minion(instanceId, cardId, overrides = {}) {
  const card = getCardById(cardId);
  assert(card, `Missing card fixture: ${cardId}`);
  return {
    instanceId,
    cardId,
    name: card.name,
    cost: card.cost,
    attack: card.attack,
    health: card.health,
    maxHealth: card.health,
    keywords: [...(card.keywords || [])],
    canAttack: false,
    divineShield: (card.keywords || []).includes("divineShield"),
    statuses: [],
    race: card.race,
    rarity: card.rarity,
    country: card.country,
    lore: card.lore,
    image: card.image || null,
    playedCount: 0,
    returnCount: 0,
    rebirthUsed: false,
    ...overrides,
  };
}

function game() {
  const g = new Game("REQUESTED", "Player", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
  });
  g.players.forEach((player) => {
    player.hand = [];
    player.deck = [];
    player.board = [];
    player.manaCurrent = 10;
  });
  return g;
}

function testBaatusMakesAttackersDrunk() {
  const g = game();
  const baatus = minion("baatus", "expansion1:baatus");
  const attacker = minion("attacker", "base:aleex", { canAttack: true });
  g.players[0].board = [baatus];
  g.players[1].board = [attacker];
  g.turn = 1;

  g.attack(1, "attacker", "baatus");

  assert(attacker.statuses.some((status) => status.type === "drunk" && status.turnsRemaining === 2), "Baatus should make attackers Drunk through their next turn.");
}

function testDantenieCleansesFriendlyMinion() {
  const g = game();
  const ally = minion("ally", "base:aleex", { attack: 0, statuses: [{ type: "weakened", value: 2, turnsRemaining: 1, appliedValue: 2 }, { type: "frozen", value: 1, turnsRemaining: 1 }] });
  g.players[0].board = [ally];
  g.players[0].hand = ["expansion1:dantenie83"];

  g.playCard(0, 0, "ally");

  assert.strictEqual(ally.attack, 2, "Dantenie83 should restore Attack lost to Weakened.");
  assert.deepStrictEqual(ally.statuses, [], "Dantenie83 should remove negative statuses from an allied minion.");
}

function testTucuquereGainsDivineShieldOnKill() {
  const g = game();
  const tucuquere = minion("tucuquere", "expansion1:tucuquere", { canAttack: true });
  const target = minion("target", "base:aleex", { attack: 0, health: 2 });
  g.players[0].board = [tucuquere];
  g.players[1].board = [target];

  g.attack(0, "tucuquere", "target");

  assert.strictEqual(tucuquere.divineShield, true, "Tucuquere should gain Divine Shield after destroying a minion.");
}

function testVatouDrawsTwoRandomDeckCards() {
  const g = game();
  const rolls = [1, 0];
  g.randomInt = () => rolls.shift() ?? 0;
  g.players[0].hand = ["expansion2:vatou"];
  g.players[0].deck = ["base:aleex", "base:dog", "base:babu"];

  g.playCard(0, 0, null);

  assert.deepStrictEqual(g.players[0].hand, ["base:dog", "base:aleex"], "Vatou should draw two random cards from its controller's deck.");
  assert.deepStrictEqual(g.players[0].deck, ["base:babu"], "Vatou should remove drawn cards from the deck.");
}

function testWeeklyBlocksChargeSummons() {
  const g = game();
  g.players[1].board = [minion("weekly", "expansion2:weekly-wackadoo")];
  g.players[0].hand = ["base:dog"];

  assert.throws(() => g.playCard(0, 0, null), /prevents keyword cards/, "Weekly_Wackadoo should block Charge minions while on board.");
}

function testAngelCanDestroyRandomEnemyOnDeath() {
  const g = game();
  const rolls = [0, 0];
  g.randomInt = () => rolls.shift() ?? 0;
  const angel = minion("angel", "base:angel");
  const target = minion("enemy-1", "base:aleex");
  g.players[0].board = [angel];
  g.players[1].board = [target, minion("enemy-2", "base:babu")];

  g._destroyMinion(0, angel);

  assert(!g.players[1].board.some((minion) => minion.instanceId === "enemy-1"), "Angel should be able to destroy a random enemy minion on death.");
}

function testDogGrantsChargeOnFirstPlay() {
  const g = game();
  const ally = minion("ally", "base:aleex");
  g.players[0].board = [ally];
  g.players[0].hand = ["base:dog"];

  g.playCard(0, 0, null);

  assert(ally.keywords.includes("charge"), "Dog should grant Charge to a random friendly non-Charge minion on first play.");
  assert.strictEqual(ally.canAttack, true, "A minion that gains Charge should be ready to attack.");
}

assert.strictEqual(getCardById("expansion1:tucuquere").rarity, "rare", "Tucuquere should now be Rare.");
assert.strictEqual(getCardById("expansion2:weekly-wackadoo").rarity, "rare", "Weekly_Wackadoo should now be Rare.");
assert(getCardById("expansion1:baatus").lore.includes("Drunk"), "Baatus should describe its Drunk retaliation.");
assert(getCardById("expansion1:dantenie83").lore.includes("cleanse"), "Dantenie83 should describe cleansing.");
assert(getCardById("expansion2:vatou").lore.includes("draw 2 random cards"), "Vatou should describe its random draw.");
assert(getCardById("base:angel").lore.includes("30%"), "Angel should describe its death chance.");
assert(getCardById("base:dog").lore.includes("first time"), "Dog should describe its first-play Charge grant.");

testBaatusMakesAttackersDrunk();
testDantenieCleansesFriendlyMinion();
testTucuquereGainsDivineShieldOnKill();
testVatouDrawsTwoRandomDeckCards();
testWeeklyBlocksChargeSummons();
testAngelCanDestroyRandomEnemyOnDeath();
testDogGrantsChargeOnFirstPlay();
console.log("--- REQUESTED CARD EFFECTS TEST OK ---");
