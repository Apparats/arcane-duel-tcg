const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertThrows(fn, message) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(message);
}

function minion(instanceId, cardId, { attack = 3, health = 3 } = {}) {
  return {
    instanceId,
    cardId,
    name: cardId,
    attack,
    health,
    maxHealth: health,
    keywords: [],
    canAttack: false,
    divineShield: false,
    statuses: [],
  };
}

function gameWithDecks() {
  return new Game("ABILITY", "Player", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
  });
}

function main() {
  const fanexGame = gameWithDecks();
  fanexGame.players[0].hand = ["expansion1:fanex"];
  fanexGame.players[0].manaCurrent = 6;
  fanexGame.players[1].deck = ["base:babu", "base:humph"];

  fanexGame.playCard(0, 0, null);
  assert(fanexGame.players[0].board.some((card) => card.cardId === "expansion1:fanex"), "Fanex should enter its controller's board.");
  assert(fanexGame.players[0].hand.includes("base:babu"), "Fanex should steal a non-Mythic card into its controller's hand.");
  assert(!fanexGame.players[1].deck.includes("base:babu"), "Fanex should remove the stolen card from the enemy deck.");
  assert(fanexGame.players[1].deck.includes("base:humph"), "Fanex must not steal Mythic cards.");
  assert(getCardById("expansion1:fanex").rarity === "mythic", "Fanex should be Mythic.");

  const fullHandGame = gameWithDecks();
  fullHandGame.players[0].hand = [...Array(9).fill("base:aleex"), "expansion1:fanex"];
  fullHandGame.players[0].manaCurrent = 6;
  fullHandGame.players[1].deck = ["base:babu"];
  assertThrows(() => fullHandGame.playCard(0, 9, null), "Fanex must not be playable with a full hand.");

  const manuchilizGame = gameWithDecks();
  manuchilizGame.players[0].hand = ["expansion1:manuchiliz"];
  manuchilizGame.players[0].manaCurrent = 8;
  manuchilizGame.players[0].board = [minion("friendly", "base:aleex")];
  manuchilizGame.players[1].board = [minion("opponent", "base:babu")];
  manuchilizGame.playCard(0, 0, null);
  assert(manuchilizGame.players[0].board.length === 1, "Manuchiliz should also damage and remove friendly minions with 3 health.");
  assert(manuchilizGame.players[0].board[0].cardId === "expansion1:manuchiliz", "Manuchiliz should survive its own on-play damage.");
  const manuchiliz = getCardById("expansion1:manuchiliz");
  assert(manuchilizGame.players[0].board[0].health === manuchiliz.health - 3, "Manuchiliz should take 3 damage from its own effect.");
  assert(manuchilizGame.players[1].board.length === 0, "Manuchiliz should remove enemy minions with 3 health.");
  console.log("--- FANEX AND MANUCHILIZ TEST OK ---");
}

main();
