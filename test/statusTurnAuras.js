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

function makeGame(randomInt = () => 0) {
  return new Game("STATUS-AURA", "Aura", "Target", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt,
  });
}

function advanceBackToPlayer(game) {
  game.endTurn(0);
  game.endTurn(1);
}

function testStatusCardsHaveTurnAuras() {
  const cases = [
    ["TheGates:toy", "weakened"],
    ["TheGates:jacquedebalsac", "frozen"],
    ["TheGates:cardinal-severin", "silenced"],
    ["TheGates:chiorico", "marked"],
  ];

  cases.forEach(([cardId, status]) => {
    const card = getCardById(cardId);
    assert(card.abilities.some((ability) => ability.effect === "applyStatus" && ability.status === status), `${card.name} should keep its on-play ${status}.`);
    assert(card.abilities.some((ability) => ability.trigger === "onTurnStart" && ability.effect === "applyStatusToRandomEnemyMinion" && ability.status === status), `${card.name} should apply ${status} at turn start.`);
  });
}

function testTurnAuraTargetsRandomEnemyMinion() {
  const game = makeGame(() => 1);
  const toy = minion("toy", "TheGates:toy");
  const firstTarget = minion("target-1", "base:aleex", { attack: 6 });
  const secondTarget = minion("target-2", "base:babu", { attack: 7 });
  game.players[0].board = [toy];
  game.players[1].board = [firstTarget, secondTarget];

  advanceBackToPlayer(game);

  assert.strictEqual(firstTarget.statuses.length, 0, "The first target should be skipped by deterministic random choice.");
  assert(secondTarget.statuses.some((status) => status.type === "weakened" && status.value === 3), "Toy should weaken a random enemy minion at turn start.");
  assert.strictEqual(secondTarget.attack, 4, "Weakened should reduce the random target's attack immediately.");
}

function testTurnAuraIgnoresEmptyEnemyBoard() {
  const game = makeGame();
  game.players[0].board = [minion("jacque", "TheGates:jacquedebalsac")];
  game.players[1].board = [];

  advanceBackToPlayer(game);

  assert.strictEqual(game.players[1].board.length, 0, "Status turn auras should not create targets when the enemy board is empty.");
}

function testSilencedSourceDoesNotApplyTurnAura() {
  const game = makeGame();
  const chiorico = minion("chiorico", "TheGates:chiorico", { statuses: [{ type: "silenced", value: 1, turnsRemaining: null }] });
  const target = minion("target", "base:aleex");
  game.players[0].board = [chiorico];
  game.players[1].board = [target];

  advanceBackToPlayer(game);

  assert.strictEqual(target.statuses.length, 0, "A silenced status-aura source should not apply turn-start statuses.");
}

testStatusCardsHaveTurnAuras();
testTurnAuraTargetsRandomEnemyMinion();
testTurnAuraIgnoresEmptyEnemyBoard();
testSilencedSourceDoesNotApplyTurnAura();
console.log("--- STATUS TURN AURAS TEST OK ---");
