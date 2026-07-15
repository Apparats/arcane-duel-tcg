const { Game } = require("../public/engine");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function minion(instanceId, cardId) {
  return {
    instanceId,
    cardId,
    name: cardId,
    attack: 2,
    health: 3,
    maxHealth: 3,
    keywords: [],
    canAttack: false,
    divineShield: false,
    statuses: [],
  };
}

const game = new Game("GOLDEN", "Player", "Opponent", {
  decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  randomInt: () => 0,
});
game.players[0].deck = [];
game.players[0].hand = ["base:goldenwarerita"];
game.players[0].manaCurrent = 10;
game.players[0].board = [minion("left", "base:aleex")];
game.playCard(0, 0, null);
game.players[0].board.push(minion("right", "base:babu"));

const golden = game.players[0].board.find((card) => card.cardId === "base:goldenwarerita");
game._damageMinion(0, golden, 99);

assert(game.players[0].board.length === 3, "Golden Warerita should leave one replacement on the board.");
assert(game.players[0].board[1].cardId === "base:warerita", "Warerita should replace Golden Warerita in the same board position.");
assert(game.players[0].board[1].attack === 1 && game.players[0].board[1].health === 5, "The replacement must use normal Warerita stats.");
assert(game.players[0].board[0].instanceId === "left" && game.players[0].board[2].instanceId === "right", "The surrounding board order must stay intact.");

console.log("--- GOLDEN WARERITA TRANSFORM TEST OK ---");
