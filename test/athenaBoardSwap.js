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

function makeGame(options = {}) {
  return new Game("ATHENA", "Athena owner", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
    ...options,
  });
}

function testAthenaMovesOnlyEligibleEnemyMinions() {
  const game = makeGame();
  const common = minion("enemy-common", "base:aleex", { health: 2 });
  const rareCharge = minion("enemy-charge", "base:dog", { canAttack: true });
  const mythic = minion("enemy-mythic", "base:humph");
  const enemyAthena = minion("enemy-athena", "expansion2:athena");
  common.statuses = [{ type: "marked", value: 1 }];
  game.players[0].hand = ["expansion2:athena"];
  game.players[0].manaCurrent = 10;
  game.players[1].board = [common, mythic, enemyAthena, rareCharge];

  game.playCard(0, 0, null);

  assert(game.players[0].board.some((card) => card.cardId === "expansion2:athena"), "Athena should enter its controller's board.");
  assert.strictEqual(game.players[0].board.find((card) => card.instanceId === "enemy-common"), common, "Athena should preserve moved minion instances.");
  assert.strictEqual(common.statuses[0]?.type, "marked", "Athena should preserve moved minion state.");
  assert.strictEqual(game.players[0].board.find((card) => card.instanceId === "enemy-charge"), rareCharge, "Athena should move non-Mythic enemy minions.");
  assert.strictEqual(rareCharge.canAttack, true, "Moved Charge minions should keep immediate attack readiness.");
  assert(game.players[1].board.some((card) => card.instanceId === "enemy-mythic"), "Athena should not move Mythic enemy minions.");
  assert(game.players[1].board.some((card) => card.instanceId === "enemy-athena"), "Athena should not move other Athena cards.");
  assert(!game.players[1].board.some((card) => card.instanceId === "enemy-common"), "Moved minions should leave the enemy board.");
}

function testAthenaDoesNotOverfillBoard() {
  const game = makeGame({
    playerConfigs: [{ boardRules: { maxMinions: 4, allowExtraSummonSlot: false } }],
  });
  game.players[0].hand = ["expansion2:athena"];
  game.players[0].manaCurrent = 10;
  game.players[0].board = [
    minion("ally-1", "base:aleex"),
    minion("ally-2", "base:aleex"),
    minion("ally-3", "base:aleex"),
  ];
  game.players[1].board = [minion("blocked-steal", "base:aleex")];

  game.playCard(0, 0, null);

  assert.strictEqual(game.players[0].board.length, 4, "Athena should not overfill the allied board.");
  assert(game.players[0].board.some((card) => card.cardId === "expansion2:athena"), "Athena should still be played when it fits.");
  assert(game.players[1].board.some((card) => card.instanceId === "blocked-steal"), "Enemy minions should stay in place when there is no legal allied slot.");
}

const athena = getCardById("expansion2:athena");
assert(athena.abilities.some((ability) => ability.effect === "stealEnemyBoardNonMythicMinions"), "Athena should have the enemy board move ability.");
assert(athena.lore.includes("non-Mythic enemy board minions"), "Athena should describe the board move restriction.");

testAthenaMovesOnlyEligibleEnemyMinions();
testAthenaDoesNotOverfillBoard();
console.log("--- ATHENA BOARD SWAP TEST OK ---");
