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
    ["TheGates:toy", "weakened", "enemyMinion"],
    ["TheGates:jacquedebalsac", "frozen", "enemyMinion"],
    ["TheGates:chiorico", "marked", "enemyMinion"],
    ["TheGates:mamaluteo", "poisoned", "enemy"],
  ];

  cases.forEach(([cardId, status, target]) => {
    const card = getCardById(cardId);
    assert(card.abilities.some((ability) => ability.trigger === "onPlay" && ability.effect === "applyStatus" && ability.target === target && ability.status === status), `${card.name} should apply ${status} on play.`);
    assert(card.abilities.some((ability) => ability.trigger === "onTurnStart" && ability.effect === "applyStatusToRandomEnemyMinion" && ability.status === status && ability.oncePerMinion !== true), `${card.name} should apply ${status} repeatedly to a random enemy minion at turn start.`);
  });
}

function testStatusCardsApplyInitialTargetedEffect() {
  const cases = [
    ["TheGates:toy", "weakened"],
    ["TheGates:jacquedebalsac", "frozen"],
    ["TheGates:chiorico", "marked"],
  ];

  cases.forEach(([cardId, status]) => {
    const game = makeGame();
    const target = minion(`${status}-target`, "base:aleex", { attack: 6 });
    game.players[1].board = [target];
    game.players[0].hand.unshift(cardId);
    game.players[0].manaCurrent = 20;

    game.playCard(0, 0, target.instanceId);

    assert(target.statuses.some((item) => item.type === status), `${getCardById(cardId).name} should apply ${status} when played.`);
  });
}

function testCardinalSeverinSilencesAllEnemyMinionsOnPlayAndTurnStart() {
  const game = makeGame();
  const firstTarget = minion("target-1", "base:aleex", { keywords: ["charge"], canAttack: true });
  const secondTarget = minion("target-2", "base:babu", { keywords: ["taunt"], divineShield: true });
  game.players[1].board = [firstTarget, secondTarget];
  game.players[0].hand.unshift("TheGates:cardinal-severin");
  game.players[0].manaCurrent = 20;

  game.playCard(0, 0, null);

  assert(firstTarget.statuses.some((status) => status.type === "silenced"), "Cardinal Severin should silence the first enemy minion on play.");
  assert(secondTarget.statuses.some((status) => status.type === "silenced"), "Cardinal Severin should silence the second enemy minion on play.");
  assert.deepStrictEqual(firstTarget.keywords, [], "Silenced enemy minions should lose keywords.");
  assert.strictEqual(secondTarget.divineShield, false, "Silenced enemy minions should lose Divine Shield.");

  firstTarget.statuses = [];
  const freshTarget = minion("target-3", "base:dog", { keywords: ["charge"], canAttack: true });
  game.players[1].board = [firstTarget, freshTarget];

  advanceBackToPlayer(game);

  assert(firstTarget.statuses.some((status) => status.type === "silenced"), "Cardinal Severin should refresh Silence on existing enemies at turn start.");
  assert(freshTarget.statuses.some((status) => status.type === "silenced"), "Cardinal Severin should Silence new enemy minions at turn start.");
  assert.deepStrictEqual(freshTarget.keywords, [], "Turn-start Silence should remove keywords from new enemy minions.");
}

function testTurnAuraTargetsRandomEnemyMinion() {
  const picks = [1, 0];
  const game = makeGame();
  game.randomInt = () => picks.shift() ?? 0;
  const toy = minion("toy", "TheGates:toy");
  const firstTarget = minion("target-1", "base:aleex", { attack: 6 });
  const secondTarget = minion("target-2", "base:babu", { attack: 7 });
  game.players[0].board = [toy];
  game.players[1].board = [firstTarget, secondTarget];

  advanceBackToPlayer(game);

  assert.strictEqual(firstTarget.statuses.length, 0, "The first target should be skipped by deterministic random choice.");
  assert(secondTarget.statuses.some((status) => status.type === "weakened" && status.value === 3), "Toy should weaken a random enemy minion at turn start.");
  assert.strictEqual(secondTarget.attack, 4, "Weakened should reduce the random target's attack immediately.");

  advanceBackToPlayer(game);

  assert(firstTarget.statuses.some((status) => status.type === "weakened" && status.value === 3), "Toy should keep weakening a random enemy minion on later turn starts.");
}

function testTurnAuraIgnoresEmptyEnemyBoard() {
  const game = makeGame();
  game.players[0].board = [minion("jacque", "TheGates:jacquedebalsac")];
  game.players[1].board = [];

  advanceBackToPlayer(game);

  assert.strictEqual(game.players[1].board.length, 0, "Status turn auras should not create targets when the enemy board is empty.");
}

function testTurnAuraCardsCanBePlayedIntoEmptyEnemyBoard() {
  const cases = [
    "TheGates:toy",
    "TheGates:jacquedebalsac",
    "TheGates:chiorico",
  ];

  cases.forEach((cardId) => {
    const game = makeGame();
    game.players[1].board = [];
    game.players[0].hand.unshift(cardId);
    game.players[0].manaCurrent = 20;

    game.playCard(0, 0, null);

    assert.strictEqual(game.players[0].hand.includes(cardId), false, `${getCardById(cardId).name} should leave hand when played without an initial target.`);
    assert(game.players[0].board.some((minion) => minion.cardId === cardId), `${getCardById(cardId).name} should enter the board without an initial target.`);
    assert.strictEqual(game.players[1].board.length, 0, `${getCardById(cardId).name} should not create or require an enemy target on play.`);
  });
}

function testTurnAuraCardsStillRequireInitialTargetWhenAvailable() {
  const cases = [
    "TheGates:toy",
    "TheGates:jacquedebalsac",
    "TheGates:chiorico",
  ];

  cases.forEach((cardId) => {
    const game = makeGame();
    game.players[1].board = [minion("available-target", "base:aleex")];
    game.players[0].hand.unshift(cardId);
    game.players[0].manaCurrent = 20;

    assert.throws(
      () => game.playCard(0, 0, null),
      /Choose an enemy minion/,
      `${getCardById(cardId).name} should still require an initial target when one exists.`
    );
  });
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
testStatusCardsApplyInitialTargetedEffect();
testCardinalSeverinSilencesAllEnemyMinionsOnPlayAndTurnStart();
testTurnAuraTargetsRandomEnemyMinion();
testTurnAuraIgnoresEmptyEnemyBoard();
testTurnAuraCardsCanBePlayedIntoEmptyEnemyBoard();
testTurnAuraCardsStillRequireInitialTargetWhenAvailable();
testSilencedSourceDoesNotApplyTurnAura();
console.log("--- STATUS TURN AURAS TEST OK ---");
