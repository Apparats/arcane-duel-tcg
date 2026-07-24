const assert = require("assert");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function minion(instanceId, cardId, overrides = {}) {
  const card = getCardById(cardId);
  return {
    instanceId,
    cardId,
    name: card.name,
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
    ...overrides,
  };
}

function makeGame(randomInt = () => 99) {
  return new Game("ATHENA", "Athena owner", "Opponent", {
    decks: [Array(25).fill("base:aleex"), Array(25).fill("base:aleex")],
    randomInt,
    startingPlayerIdx: 0,
  });
}

function testAthenaAppliesConfusionOnPlay() {
  const game = makeGame();
  const first = minion("enemy-1", "base:aleex");
  const second = minion("enemy-2", "base:barto");
  game.players[1].board = [first, second];
  game.players[0].hand = ["expansion2:athena"];
  game.players[0].manaCurrent = 10;

  game.playCard(0, 0, null);

  assert(first.statuses.some((status) => status.type === "confused" && status.value === 30), "Athena should Confuse enemy minions.");
  assert(second.statuses.some((status) => status.type === "confused" && status.turnsRemaining === 1), "Confusion should last through the enemy's next turn.");
}

function testConfusedMinionsCannotAttackNormallyNextTurn() {
  const game = makeGame();
  const target = minion("enemy", "base:aleex");
  game.players[1].board = [target];
  game.players[0].hand = ["expansion2:athena"];
  game.players[0].manaCurrent = 10;
  game.playCard(0, 0, null);

  game.endTurn(0);

  assert.strictEqual(target.canAttack, false, "A Confused minion should not be able to attack normally on its next turn.");
}

function testConfusionCanMakeAlliesAttackEachOther() {
  const game = makeGame(() => 0);
  const first = minion("enemy-1", "base:aleex", { attack: 2, health: 6, maxHealth: 6 });
  const second = minion("enemy-2", "base:barto", { attack: 1, health: 6, maxHealth: 6 });
  game.players[1].board = [first, second];
  game.players[0].hand = ["expansion2:athena"];
  game.players[0].manaCurrent = 10;
  game.playCard(0, 0, null);

  game.endTurn(0);

  assert(first.health < 6 || second.health < 6, "Confusion should be able to make enemy minions attack allied minions.");
}

const athena = getCardById("expansion2:athena");
assert(athena.abilities.length === 1 && athena.abilities[0].effect === "applyConfusionToAllEnemyMinions", "Athena should use Confusion instead of filtered draw.");
assert(athena.lore.includes("Confusion"), "Athena should describe Confusion.");

testAthenaAppliesConfusionOnPlay();
testConfusedMinionsCannotAttackNormallyNextTurn();
testConfusionCanMakeAlliesAttackEachOther();
console.log("--- ATHENA CONFUSION TEST OK ---");
