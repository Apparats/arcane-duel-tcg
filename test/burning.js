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
    canAttack: true,
    divineShield: false,
    statuses: [],
    race: card.race,
    rarity: card.rarity,
    country: card.country,
    lore: card.lore,
    image: card.image || null,
    ...overrides,
  };
}

function makeBurningGame() {
  return new Game("BURN", "Pyre", "Ash", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
}

function burningAbility() {
  const card = getCardById("expansion2:Aslani2");
  return card.abilities.find((ability) => ability.effect === "applyBurning");
}

function testHeroBurningStacks() {
  const game = makeBurningGame();
  const aslani = minion("aslani-hero", "expansion2:Aslani2");
  const attack = aslani.attack;
  const turns = burningAbility().turns || 1;
  game.players[0].board = [aslani];

  game.attack(0, aslani.instanceId, "face");
  assert.strictEqual(game.players[1].health, 30 - attack, "Aslani should still deal normal attack damage to the hero.");
  assert.deepStrictEqual(game.players[1].statuses, [{ type: "burning", value: 1, turnsRemaining: turns }], "A face attack should apply Burning.");
  assert.deepStrictEqual(game.getStateFor(0).opponent.statuses, [{ type: "burning", value: 1, turnsRemaining: turns }], "Hero Burning should be visible in public state.");

  aslani.canAttack = true;
  game.attack(0, aslani.instanceId, "face");
  assert.strictEqual(game.players[1].health, 30 - (attack * 2), "A second face attack should deal normal attack damage again.");
  assert.deepStrictEqual(game.players[1].statuses, [{ type: "burning", value: 2, turnsRemaining: turns * 2 }], "Repeated face attacks should increase Burning damage and duration.");

  game.endTurn(0);
  assert.strictEqual(game.players[1].health, 30 - (attack * 2) - 2, "Burning should damage the hero at the start of their turn.");
  assert.deepStrictEqual(game.players[1].statuses, [{ type: "burning", value: 2, turnsRemaining: turns * 2 }], "Burning should expire after the affected turn ends, not before damage.");

  game.endTurn(1);
  assert.deepStrictEqual(game.players[1].statuses, [{ type: "burning", value: 2, turnsRemaining: (turns * 2) - 1 }], "Burning should lose one duration at the end of the affected turn.");
}

function testMinionBurningStacksAndExpires() {
  const game = makeBurningGame();
  const aslani = minion("aslani-minion", "expansion2:Aslani2");
  const attack = aslani.attack;
  const turns = burningAbility().turns || 1;
  const target = minion("burn-target", "base:aleex", { attack: 0, health: 20, maxHealth: 20 });
  game.players[0].board = [aslani];
  game.players[1].board = [target];

  game.attack(0, aslani.instanceId, target.instanceId);
  assert.strictEqual(target.health, 20 - attack, "Aslani should deal normal combat damage to the minion.");
  assert.deepStrictEqual(target.statuses, [{ type: "burning", value: 1, turnsRemaining: turns }], "A minion attack should apply Burning.");

  aslani.canAttack = true;
  game.attack(0, aslani.instanceId, target.instanceId);
  assert.strictEqual(target.health, 20 - (attack * 2), "A second attack should deal normal combat damage again.");
  assert.deepStrictEqual(target.statuses, [{ type: "burning", value: 2, turnsRemaining: turns * 2 }], "Repeated minion attacks should increase Burning damage and duration.");

  game.endTurn(0);
  assert.strictEqual(target.health, 20 - (attack * 2) - 2, "Burning should damage minions at the start of their controller's turn.");
  game.endTurn(1);
  assert.deepStrictEqual(target.statuses, [{ type: "burning", value: 2, turnsRemaining: (turns * 2) - 1 }], "Burning should remain for the stacked extra turn.");
}

testHeroBurningStacks();
testMinionBurningStacksAndExpires();
console.log("--- BURNING TEST OK ---");
