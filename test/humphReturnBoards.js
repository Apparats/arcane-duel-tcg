const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function minion(instanceId, cardId) {
  return {
    instanceId,
    cardId,
    name: cardId,
    attack: 3,
    health: 3,
    maxHealth: 3,
    keywords: [],
    canAttack: false,
    divineShield: false,
    statuses: [],
  };
}

const humph = getCardById("base:humph");
assert(humph, "Humph must exist.");
assert(humph.keywords.length === 0, "Humph must not retain Divine Shield.");
assert(humph.lore.includes("both boards"), "Humph must describe the board-return effect.");

const game = new Game("HUMPH", "Humph owner", "Opponent", {
  decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  randomInt: () => 0,
});
game.players[0].deck = [];
game.players[1].deck = [];
game.players[0].hand = ["base:humph"];
game.players[0].manaCurrent = 10;
game.players[0].board = [minion("friendly", "base:aleex")];
game.players[1].board = [minion("enemy-one", "base:babu"), minion("enemy-two", "base:mike")];

game.playCard(0, 0, null);
const humphInPlay = game.players[0].board.find((card) => card.cardId === "base:humph");
assert(humphInPlay, "Humph must enter the board before dying.");
game._damageMinion(0, humphInPlay, 99);

assert(game.players[0].board.length === 0, "Humph's controller should have no remaining minions on board.");
assert(game.players[1].board.length === 0, "Humph's opponent should have no remaining minions on board.");
assert(game.players[0].deck.includes("base:aleex"), "Friendly minions should return to their owner's deck.");
assert(game.players[1].deck.includes("base:babu") && game.players[1].deck.includes("base:mike"), "Enemy minions should return to their owner's deck.");
assert(!game.players[0].deck.includes("base:humph"), "Humph itself should remain dead after its death trigger.");

console.log("--- HUMPH RETURN BOARDS TEST OK ---");
