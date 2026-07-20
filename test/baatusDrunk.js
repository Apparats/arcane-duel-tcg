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

function makeGame(randomInt = () => 0) {
  return new Game("DRUNK", "Baatus", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt,
  });
}

function statusTypes(stateBoard) {
  return stateBoard.map((card) => card.statuses.map((status) => status.type));
}

const baatusId = "expansion2:Baatus2";
const baatusCard = getCardById(baatusId);
assert(baatusCard.abilities.some((ability) => ability.effect === "drunkAllMinions"), "Baatus2 should have the Drunk aura.");
assert(baatusCard.lore.includes("Drunk"), "Baatus2 should describe Drunk.");

{
  const game = makeGame(() => 0);
  const baatus = minion("baatus", baatusId);
  const ally = minion("ally", "base:aleex", { attack: 3, health: 10, maxHealth: 10 });
  const enemy = minion("enemy", "base:dog", { health: 10, maxHealth: 10 });
  game.players[0].board = [baatus, ally];
  game.players[1].board = [enemy];

  const state = game.getStateFor(0);
  assert.deepStrictEqual(statusTypes(state.me.board), [["drunk"], ["drunk"]], "All allied board minions should show Drunk while Baatus lives.");
  assert.deepStrictEqual(statusTypes(state.opponent.board), [["drunk"]], "Enemy board minions should show Drunk while Baatus lives.");

  game.attack(0, ally.instanceId, "face");
  assert.strictEqual(baatus.health, baatusCard.health - ally.attack, "A Drunk minion should be able to randomly attack an allied minion.");
  assert.strictEqual(game.players[1].health, 30, "The chosen face target should be ignored by Drunk.");
  assert.strictEqual(game.lastAction.targetInstanceId, baatus.instanceId, "The recorded attack target should be the random Drunk target.");
  assert.strictEqual(game.lastAction.randomTarget, true, "Drunk attacks should mark the recorded action as random.");
}

{
  const game = makeGame((max) => max - 1);
  const baatus = minion("baatus", baatusId);
  const ally = minion("ally", "base:aleex", { attack: 3, health: 10, maxHealth: 10 });
  const enemy = minion("enemy", "base:dog", { health: 10, maxHealth: 10 });
  game.players[0].board = [baatus, ally];
  game.players[1].board = [enemy];

  game.attack(0, ally.instanceId, baatus.instanceId);
  assert.strictEqual(enemy.health, 10 - ally.attack, "Drunk random targeting should also be able to hit enemy minions.");
}

{
  const game = makeGame(() => 0);
  const baatus = minion("baatus", baatusId, { statuses: [{ type: "silenced" }] });
  const ally = minion("ally", "base:aleex", { attack: 3, health: 10, maxHealth: 10 });
  game.players[0].board = [baatus, ally];
  game.players[1].board = [];

  const state = game.getStateFor(0);
  assert(!state.me.board.some((card) => card.statuses.some((status) => status.type === "drunk")), "A silenced Baatus should not apply Drunk.");
  game.attack(0, ally.instanceId, "face");
  assert.strictEqual(game.players[1].health, 27, "Without Drunk, attacks should resolve normally.");
}

{
  const game = makeGame(() => 0);
  const baatus = minion("baatus", baatusId);
  game.players[0].board = [baatus];

  assert.throws(() => game.attack(0, baatus.instanceId, "face"), /No Drunk target available/, "A lone Drunk minion should not consume an attack when no board target exists.");
  assert.strictEqual(baatus.canAttack, true, "A failed Drunk attack should not exhaust the attacker.");

  game._damageMinion(0, baatus, 99);
  assert(!game.getStateFor(0).me.board.some((card) => card.statuses.some((status) => status.type === "drunk")), "Drunk should disappear when Baatus leaves the board.");
}

console.log("--- BAATUS DRUNK TEST OK ---");
