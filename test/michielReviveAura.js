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
    playedCount: 0,
    returnCount: 0,
    rebirthUsed: false,
    ...overrides,
  };
}

function makeGame() {
  return new Game("MICHIEL", "Michiel", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
  });
}

const michielId = "expansion2:michiel-op-snuifari";
const michielCard = getCardById(michielId);
assert(michielCard.abilities.some((ability) => ability.effect === "reviveOtherFriendlyMinions"), "Michiel_op_Snuifari should have the revive aura.");
assert(michielCard.lore.includes("non-Taunt allied minions revive once"), "Michiel_op_Snuifari should describe the revive restrictions.");

{
  const game = makeGame();
  const michiel = minion("michiel", michielId);
  const ally = minion("ally", "base:aleex", { attack: 5, health: 2, maxHealth: 2, returnCount: 2 });
  game.players[0].board = [michiel, ally];

  game._damageMinion(0, ally, 99);

  assert.strictEqual(game.players[0].board.length, 2, "Michiel should revive a dead allied minion.");
  const revived = game.players[0].board.find((card) => card.cardId === "base:aleex");
  assert(revived, "The revived ally should return to the board.");
  assert.strictEqual(revived.health, 1, "The revived ally should have 1 Health.");
  assert.strictEqual(revived.maxHealth, 1, "The revived ally should have 1 max Health.");
  assert.strictEqual(revived.attack, 3, "The revived ally should have half its death Attack, rounded up.");
  assert.strictEqual(revived.canAttack, false, "The revived ally should not be ready to attack immediately.");
  assert.strictEqual(revived.returnCount, 2, "The revived ally should preserve return-count metadata.");
  assert.strictEqual(revived.friendlyReviveUsed, true, "The revived ally should be marked so it cannot revive again.");
  assert(game.players[0].board.some((card) => card.cardId === michielId), "Michiel should remain on board.");
}

{
  const game = makeGame();
  const michiel = minion("michiel", michielId);
  const ally = minion("ally", "base:aleex", { attack: 5, health: 2, maxHealth: 2 });
  game.players[0].board = [michiel, ally];

  game._damageMinion(0, ally, 99);
  const revived = game.players[0].board.find((card) => card.cardId === "base:aleex");
  assert(revived, "The normal ally should revive once.");

  game._damageMinion(0, revived, 99);
  assert.deepStrictEqual(game.players[0].board.map((card) => card.instanceId), ["michiel"], "Michiel should not revive the same card more than once.");
}

{
  const game = makeGame();
  const michiel = minion("michiel", michielId);
  const tauntAlly = minion("taunt-ally", "base:fish", { health: 2, maxHealth: 2 });
  game.players[0].board = [michiel, tauntAlly];

  game._damageMinion(0, tauntAlly, 99);
  assert.deepStrictEqual(game.players[0].board.map((card) => card.instanceId), ["michiel"], "Michiel should not revive Taunt allied minions.");
}

{
  const game = makeGame();
  const ally = minion("ally", "base:aleex", { attack: 5, health: 2, maxHealth: 2 });
  game.players[0].board = [ally];

  game._damageMinion(0, ally, 99);
  assert.strictEqual(game.players[0].board.length, 0, "Allies that die without Michiel on board should not revive.");
}

{
  const game = makeGame();
  const michielOne = minion("michiel-one", michielId);
  const michielTwo = minion("michiel-two", michielId);
  game.players[0].board = [michielOne, michielTwo];

  game._damageMinion(0, michielTwo, 99);
  assert.deepStrictEqual(game.players[0].board.map((card) => card.instanceId), ["michiel-one"], "Michiel should not revive another Michiel copy.");
}

{
  const game = makeGame();
  const michiel = minion("michiel", michielId, { statuses: [{ type: "silenced" }] });
  const ally = minion("ally", "base:aleex", { health: 2, maxHealth: 2 });
  game.players[0].board = [michiel, ally];

  game._damageMinion(0, ally, 99);
  assert.deepStrictEqual(game.players[0].board.map((card) => card.instanceId), ["michiel"], "A silenced Michiel should not revive allied minions.");
}

console.log("--- MICHIEL REVIVE AURA TEST OK ---");
