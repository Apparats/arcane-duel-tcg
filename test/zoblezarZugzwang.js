const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gameWithDecks() {
  return new Game("NEW_ABILITIES", "Player", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
  });
}

const zoblezar = getCardById("TheGates:zoblezar");
assert(zoblezar.keywords.length === 0, "Zoblezar must not retain Divine Shield.");

const rebirthGame = gameWithDecks();
rebirthGame.players[0].deck = [];
rebirthGame.players[0].hand = ["TheGates:zoblezar"];
rebirthGame.players[0].manaCurrent = 10;
rebirthGame.playCard(0, 0, null);
let revived = rebirthGame.players[0].board[0];
rebirthGame._damageMinion(0, revived, 99);
assert(rebirthGame.players[0].board.length === 1, "Zoblezar must revive after its first death.");
revived = rebirthGame.players[0].board[0];
assert(revived.health === 5 && revived.maxHealth === 10, "Zoblezar must revive at half of its maximum Health.");
rebirthGame._damageMinion(0, revived, 99);
assert(rebirthGame.players[0].board.length === 0, "Zoblezar must only revive once.");

const overseerGame = gameWithDecks();
overseerGame.players[0].deck = [];
overseerGame.players[0].hand = ["TheGates:overseer"];
overseerGame.players[0].manaCurrent = 10;
overseerGame.playCard(0, 0, null);
let overseer = overseerGame.players[0].board[0];
overseerGame._damageMinion(0, overseer, 99);
assert(overseerGame.players[0].board.length === 1, "Overseer must return after its first death.");
overseer = overseerGame.players[0].board[0];
assert(overseer.health === 1 && overseer.rebirthUsed, "Overseer must return with 1 Health.");
const firstExplosionLogs = overseerGame.log.filter((entry) => entry.includes("Overseer deals 20 damage")).length;
overseerGame._damageMinion(0, overseer, 99);
const secondExplosionLogs = overseerGame.log.filter((entry) => entry.includes("Overseer deals 20 damage")).length;
assert(overseerGame.players[0].board.length === 0, "Overseer must not return after its second death.");
assert(firstExplosionLogs === 1 && secondExplosionLogs === 1, "Overseer's explosion must only trigger once.");

const zugzwang = getCardById("base:zugzwang");
assert(zugzwang.attack === 5 && zugzwang.health === 7, "Zugzwang must use the current 5/7 stats.");

const sparkGame = gameWithDecks();
sparkGame.players[0].deck = [];
sparkGame.players[0].hand = [];
sparkGame.players[0].board = [{
  instanceId: "zugzwang",
  cardId: "base:zugzwang",
  name: "Zugzwang",
  attack: zugzwang.attack,
  health: zugzwang.health,
  maxHealth: zugzwang.health,
  keywords: [...zugzwang.keywords],
  canAttack: false,
  divineShield: false,
  statuses: [],
}];
sparkGame._startTurn(0);
assert(sparkGame.players[0].hand.includes("expansion1:minorspark"), "Zugzwang must add Minor Spark at the start of its controller's turn.");

sparkGame.players[0].hand = Array(10).fill("base:aleex");
sparkGame._startTurn(0);
assert(sparkGame.players[0].hand.length === 10, "Zugzwang must not exceed the maximum hand size.");

console.log("--- ZOBLEZAR AND ZUGZWANG TEST OK ---");
