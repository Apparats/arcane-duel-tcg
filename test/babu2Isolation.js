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

function makeGame() {
  return new Game("BABU2", "Babu owner", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
  });
}

function testBabuReturnsAlliesAndCanEnterFullBoard() {
  const game = makeGame();
  game.players[0].hand = ["expansion2:Babu2"];
  game.players[0].manaCurrent = 10;
  game.players[0].board = [
    minion("ally-1", "base:aleex"),
    minion("ally-2", "base:babu", { returnCount: 2 }),
    minion("ally-3", "base:dog"),
    minion("ally-4", "base:fish"),
  ];

  game.playCard(0, 0, null);

  assert.strictEqual(game.players[0].board.length, 1, "Babu should be the only allied minion left on board.");
  assert.strictEqual(game.players[0].board[0].cardId, "expansion2:Babu2", "The remaining allied minion should be Babu.");
  assert.deepStrictEqual(
    game.players[0].hand.sort(),
    ["base:aleex", "base:babu|returns:2", "base:dog", "base:fish"].sort(),
    "Babu should return every other allied board card to its owner's hand."
  );
}

function testBabuBlocksMinionsButAllowsSpells() {
  const game = makeGame();
  game.players[0].board = [minion("babu", "expansion2:Babu2")];
  game.players[0].hand = ["base:aleex", "expansion1:minorfireball"];
  game.players[0].manaCurrent = 10;

  assert.throws(
    () => game.playCard(0, 0, null),
    /Babu prevents you from summoning more minions/,
    "Babu should block later minion cards."
  );
  assert.strictEqual(game.players[0].hand[0], "base:aleex", "A blocked minion should remain in hand.");
  assert.strictEqual(game.players[0].manaCurrent, 10, "A blocked minion should not spend mana.");

  game.playCard(0, 1, "faceEnemy");
  assert.strictEqual(game.players[1].health, 27, "Babu should still allow spell cards to be cast.");
  assert.deepStrictEqual(game.players[0].board.map((card) => card.cardId), ["expansion2:Babu2"], "Casting a spell should not disturb Babu's board lock.");
}

function testBabuNeedsHandSpaceForReturnedAllies() {
  const game = makeGame();
  game.players[0].hand = [
    "expansion2:Babu2",
    "base:aleex",
    "base:aleex",
    "base:aleex",
    "base:aleex",
    "base:aleex",
    "base:aleex",
    "base:aleex",
    "base:aleex",
    "base:aleex",
  ];
  game.players[0].manaCurrent = 10;
  game.players[0].board = [minion("ally-1", "base:dog"), minion("ally-2", "base:fish")];

  assert.throws(
    () => game.playCard(0, 0, null),
    /Not enough hand space/,
    "Babu should not be playable if the returned board cannot fit in hand."
  );
  assert.strictEqual(game.players[0].hand.length, 10, "A failed Babu play should not consume the card.");
  assert.strictEqual(game.players[0].board.length, 2, "A failed Babu play should not move board cards.");
}

const babu = getCardById("expansion2:Babu2");
assert(babu.abilities.some((ability) => ability.effect === "returnOtherFriendlyMinionsToHand"), "Babu2 should have the board isolation ability.");
assert(babu.lore.includes("cannot summon more minions"), "Babu2 should describe its minion lock.");

testBabuReturnsAlliesAndCanEnterFullBoard();
testBabuBlocksMinionsButAllowsSpells();
testBabuNeedsHandSpaceForReturnedAllies();
console.log("--- BABU2 ISOLATION TEST OK ---");
