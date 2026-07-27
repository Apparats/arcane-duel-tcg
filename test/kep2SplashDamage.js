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
    attack: card.attack || 0,
    health: card.health || 1,
    maxHealth: card.health || 1,
    keywords: [...(card.keywords || [])],
    canAttack: false,
    divineShield: (card.keywords || []).includes("divineShield"),
    statuses: [],
    race: card.race,
    rarity: card.rarity,
    country: card.country,
    lore: card.lore,
    image: card.image || null,
    ...overrides,
  };
}

function makeGame(randomInt = () => 0) {
  const game = new Game("KEP2", "Kep", "Target", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt,
  });
  game.players.forEach((player) => {
    player.board = [];
    player.hand = [];
    player.deck = [];
  });
  game.turn = 0;
  return game;
}

{
  const game = makeGame(() => 0);
  const kep = minion("kep", "TheGates:kep", { canAttack: true });
  const attacked = minion("attacked", "base:babu", { health: 10, maxHealth: 10 });
  const splashTarget = minion("splash", "base:aleex", { health: 10, maxHealth: 10 });
  game.players[0].board = [kep];
  game.players[1].board = [attacked, splashTarget];

  game.attack(0, kep.instanceId, attacked.instanceId);

  assert.strictEqual(attacked.health, 5, "Kep should deal its 5 Attack to the attacked minion.");
  assert.strictEqual(splashTarget.health, 5, "Kep should repeat the same 5 damage to another enemy minion.");
}

{
  const game = makeGame(() => 0);
  const kep = minion("kep", "TheGates:kep", { canAttack: true });
  const attacked = minion("attacked", "base:babu", { health: 10, maxHealth: 10 });
  game.players[0].board = [kep];
  game.players[1].board = [attacked];

  game.attack(0, kep.instanceId, attacked.instanceId);

  assert.strictEqual(game.players[1].health, 25, "Kep should repeat the same 5 damage to the enemy hero when no other enemy minion exists.");
}

console.log("--- KEP2 SPLASH DAMAGE TEST OK ---");
