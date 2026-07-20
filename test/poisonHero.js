const assert = require("assert");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function makeGame() {
  const game = new Game("POISON", "Venom", "Target", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  game.players[0].hand = ["TheGates:mamaluteo"];
  game.players[0].manaMax = 10;
  game.players[0].manaCurrent = 10;
  return game;
}

function minion(instanceId, cardId) {
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
    canAttack: true,
    divineShield: false,
    statuses: [],
    race: card.race,
    rarity: card.rarity,
    country: card.country,
    lore: card.lore,
    image: card.image || null,
  };
}

function testMamaluteoCanPoisonHero() {
  const game = makeGame();
  const mamaluteo = getCardById("TheGates:mamaluteo");
  const poison = mamaluteo.abilities.find((ability) => ability.effect === "applyStatus" && ability.status === "poisoned");
  assert(poison, "Mamaluteo should have a Poison ability.");
  assert.strictEqual(poison.target, "enemy", "Mamaluteo should target enemy minions or the enemy hero.");

  game.playCard(0, 0, "faceEnemy");
  assert.strictEqual(game.players[0].hand.length, 0, "Mamaluteo should leave hand after a valid hero target.");
  assert.deepStrictEqual(
    game.players[1].statuses,
    [{ type: "poisoned", value: poison.value, turnsRemaining: poison.turns }],
    "Poison should be stored on the enemy hero."
  );
  assert.deepStrictEqual(
    game.getStateFor(0).opponent.statuses,
    [{ type: "poisoned", value: poison.value, turnsRemaining: poison.turns }],
    "Hero Poison should be visible in public state."
  );

  game.endTurn(0);
  assert.strictEqual(game.players[1].health, 30 - poison.value, "Poison should damage the hero at the start of their turn.");
  assert.deepStrictEqual(
    game.players[1].statuses,
    [{ type: "poisoned", value: poison.value, turnsRemaining: poison.turns }],
    "Poison should expire after the affected turn ends, not before damage."
  );

  game.endTurn(1);
  assert.deepStrictEqual(
    game.players[1].statuses,
    [{ type: "poisoned", value: poison.value, turnsRemaining: poison.turns - 1 }],
    "Poison should lose one duration at the end of the affected turn."
  );
}

function testPoisonRefreshesInsteadOfStacking() {
  const game = makeGame();
  game._applyHeroStatus(1, { status: "poisoned", value: 2, turns: 2 });
  game._applyHeroStatus(1, { status: "poisoned", value: 4, turns: 6 });
  assert.deepStrictEqual(
    game.players[1].statuses,
    [{ type: "poisoned", value: 4, turnsRemaining: 6 }],
    "Reapplying Poison should replace the old Poison instead of stacking damage."
  );
}

function testMamaluteoStillPoisonsMinions() {
  const game = makeGame();
  const target = minion("poison-target", "base:aleex");
  game.players[1].board = [target];
  const poison = getCardById("TheGates:mamaluteo").abilities.find((ability) => ability.effect === "applyStatus" && ability.status === "poisoned");

  game.playCard(0, 0, target.instanceId);
  assert.deepStrictEqual(
    target.statuses,
    [{ type: "poisoned", value: poison.value, turnsRemaining: poison.turns }],
    "Mamaluteo should still be able to Poison enemy minions."
  );
}

testMamaluteoCanPoisonHero();
testPoisonRefreshesInsteadOfStacking();
testMamaluteoStillPoisonsMinions();
console.log("--- POISON HERO TEST OK ---");
