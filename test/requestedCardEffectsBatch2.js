const assert = require("assert");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function makeGame(randomInt = () => 0) {
  return new Game("BATCH2", "P1", "P2", {
    decks: [Array(25).fill("base:aleex"), Array(25).fill("base:aleex")],
    randomInt,
    startingPlayerIdx: 0,
  });
}

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
    canAttack: false,
    divineShield: (card.keywords || []).includes("divineShield"),
    statuses: [],
    race: card.race,
    rarity: card.rarity,
    ...overrides,
  };
}

function playFromHand(game, playerIdx, cardId) {
  game.turn = playerIdx;
  game.players[playerIdx].hand = [cardId];
  game.players[playerIdx].manaCurrent = 10;
  game.playCard(playerIdx, 0, null);
  return game.players[playerIdx].board.at(-1);
}

function testWareritaFirstPlayMana() {
  const game = makeGame();
  game.players[0].hand = ["base:warerita"];
  game.players[0].manaCurrent = 3;
  game.playCard(0, 0, null);
  assert.strictEqual(game.players[0].manaCurrent, 1, "Warerita should grant 1 temporary Mana on first play.");

  game.players[0].hand = ["base:warerita"];
  game.players[0].manaCurrent = 3;
  game.playCard(0, 0, null);
  assert.strictEqual(game.players[0].manaCurrent, 0, "Warerita should not grant temporary Mana after the first play.");
}

function testVendettaIgnoresAdverseEffects() {
  const game = makeGame();
  const vendetta = minion("v", "base:v-for-vendetta");
  game.players[0].board = [vendetta];
  game._applyStatus(0, vendetta, { status: "weakened", value: 2, turns: 1 });
  assert.strictEqual(vendetta.attack, 3, "V for Vendetta should ignore adverse status effects.");
  assert.deepStrictEqual(vendetta.statuses, [], "V for Vendetta should not receive adverse statuses.");

  game._damageMinion(0, vendetta, 2, { adverseEffect: true });
  assert.strictEqual(vendetta.health, 6, "V for Vendetta should ignore adverse effect damage.");

  game._damageMinion(0, vendetta, 2);
  assert.strictEqual(vendetta.health, 4, "V for Vendetta should still take normal combat-style damage.");
}

function testSzczwanyLisekDrainsEnemyHand() {
  const game = makeGame();
  game.players[1].hand = ["base:aleex"];
  const szczwany = playFromHand(game, 0, "base:szczwanylisek");
  assert.strictEqual(szczwany.attack, 6, "SzczwanyLisek should gain +1 Attack.");
  assert(game.players[1].hand[0].includes("health:-1"), "SzczwanyLisek should reduce a random enemy hand minion's Health.");

  game.turn = 1;
  game.players[1].manaCurrent = 10;
  game.playCard(1, 0, null);
  const drained = game.players[1].board[0];
  assert.strictEqual(drained.health, getCardById("base:aleex").health - 1, "The drained hand card should enter with 1 less Health.");
}

function testRinLosesHealthOnlyWhenAttacking() {
  const game = makeGame();
  const rin = minion("rin", "base:rin", { canAttack: true });
  game.players[0].board = [rin];
  game.attack(0, "rin", "face");
  assert.strictEqual(rin.health, 7, "Rin should lose 1 Health when it attacks.");

  const secondGame = makeGame();
  const defender = minion("rin-defender", "base:rin");
  const attacker = minion("attacker", "base:aleex", { attack: 1, health: 20, maxHealth: 20, canAttack: true });
  secondGame.players[0].board = [defender];
  secondGame.players[1].board = [attacker];
  secondGame.turn = 1;
  secondGame.attack(1, "attacker", "rin-defender");
  assert.strictEqual(defender.health, 7, "Rin should not lose an extra Health when it is attacked.");
}

function testOilBertDelayedBuff() {
  const game = makeGame();
  const oil = playFromHand(game, 0, "base:oil-bert");
  assert.strictEqual(oil.attack, 4, "Oil Bert should not buff immediately.");
  game.endTurn(0);
  game.endTurn(1);
  assert.strictEqual(oil.attack, 4, "Oil Bert should still be waiting after one survived turn.");
  game.endTurn(0);
  game.endTurn(1);
  assert.strictEqual(oil.attack, 6, "Oil Bert should gain +2 Attack after surviving 2 turns.");
  assert.strictEqual(oil.maxHealth, 8, "Oil Bert should gain +2 Health after surviving 2 turns.");
  game.endTurn(0);
  game.endTurn(1);
  assert.strictEqual(oil.attack, 6, "Oil Bert's delayed buff should happen only once.");
}

function testMrLabubuGainsTauntOnKill() {
  const game = makeGame();
  const labubu = minion("labubu", "base:mr-labubu", { canAttack: true });
  const target = minion("target", "base:aleex", { attack: 0, health: 1, maxHealth: 1 });
  game.players[0].board = [labubu];
  game.players[1].board = [target];
  game.attack(0, "labubu", "target");
  assert(labubu.keywords.includes("taunt"), "Mr Labubu should gain Taunt after killing and surviving.");
  assert(!labubu.keywords.includes("charge"), "Mr Labubu should not gain Charge anymore.");
}

function testMeow4glorySwapsStatsWithThreeAllies() {
  const game = makeGame();
  game.players[0].board = [
    minion("a", "base:aleex"),
    minion("b", "base:barto"),
    minion("c", "base:babu"),
  ];
  const meow = playFromHand(game, 0, "expansion1:meow4glory");
  assert.strictEqual(meow.attack, 8, "Meow4glory should swap to 8 Attack when played with 3 other allies.");
  assert.strictEqual(meow.health, 2, "Meow4glory should swap to 2 Health when played with 3 other allies.");
}

[
  "base:kurzemnieks",
  "base:kep",
  "base:fish",
  "base:alfred-longstocking",
  "expansion2:boba",
  "expansion2:johnny-sins",
  "expansion2:ancalego",
  "expansion1:rock",
  "expansion1:jeraxes",
  "expansion1:biertierchen",
  "expansion1:abo-amer",
].forEach((cardId) => {
  assert.strictEqual(getCardById(cardId).rarity, "common", `${cardId} should be Common.`);
});

testWareritaFirstPlayMana();
testVendettaIgnoresAdverseEffects();
testSzczwanyLisekDrainsEnemyHand();
testRinLosesHealthOnlyWhenAttacking();
testOilBertDelayedBuff();
testMrLabubuGainsTauntOnKill();
testMeow4glorySwapsStatsWithThreeAllies();

console.log("--- REQUESTED CARD EFFECTS BATCH 2 TEST OK ---");
