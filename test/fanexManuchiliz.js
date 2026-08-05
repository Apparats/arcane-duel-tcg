const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function minion(instanceId, cardId, { attack = 3, health = 3 } = {}) {
  const card = getCardById(cardId);
  return {
    instanceId,
    cardId,
    name: card?.name || cardId,
    cost: card?.cost || 0,
    attack,
    health,
    maxHealth: health,
    keywords: [...(card?.keywords || [])],
    canAttack: false,
    divineShield: false,
    statuses: [],
    race: card?.race,
    rarity: card?.rarity,
    country: card?.country,
    lore: card?.lore,
    image: card?.image || null,
    playedCount: 0,
    returnCount: 0,
    rebirthUsed: false,
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
  const enemyMinion = minion("enemy-babu", "base:babu", { attack: 5, health: 2 });
  enemyMinion.statuses = [{ type: "marked", value: 1 }];
  fanexGame.players[1].board = [enemyMinion, minion("enemy-humph", "base:humph")];

  fanexGame.playCard(0, 0, null);
  assert(fanexGame.players[0].board.some((card) => card.cardId === "expansion1:fanex"), "Fanex should enter its controller's board.");
  const stolenMinion = fanexGame.players[0].board.find((card) => card.instanceId === "enemy-babu");
  assert(stolenMinion === enemyMinion, "Fanex should move the stolen enemy minion instance onto its controller's board.");
  assert(stolenMinion.cardId === "base:babu", "Fanex should steal a random minion from the enemy board.");
  assert(stolenMinion.health === 2 && stolenMinion.statuses[0]?.type === "marked", "Fanex should preserve the stolen minion state.");
  assert(!fanexGame.players[1].board.some((card) => card.instanceId === "enemy-babu"), "Fanex should remove the stolen minion from the enemy board.");
  assert(fanexGame.players[1].board.some((card) => card.instanceId === "enemy-humph"), "Fanex should only steal one random enemy board minion.");
  assert(getCardById("expansion1:fanex").rarity === "legendary", "Fanex should be Legendary.");

  const fullBoardGame = new Game("ABILITY", "Player", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    playerConfigs: [{ boardRules: { maxMinions: 4, allowExtraSummonSlot: false } }],
    randomInt: () => 0,
  });
  fullBoardGame.players[0].hand = ["expansion1:fanex"];
  fullBoardGame.players[0].manaCurrent = 6;
  fullBoardGame.players[0].board = [
    minion("friendly-1", "base:aleex"),
    minion("friendly-2", "base:babu"),
    minion("friendly-3", "base:dog"),
  ];
  fullBoardGame.players[1].board = [minion("blocked-steal", "base:warerita")];
  fullBoardGame.playCard(0, 0, null);
  assert(fullBoardGame.players[0].board.length === 4, "Fanex should not overfill a board when the stolen minion cannot legally fit.");
  assert(fullBoardGame.players[1].board.some((card) => card.instanceId === "blocked-steal"), "Fanex should leave enemy minions in place when no legal allied slot exists.");

  const manuchilizGame = gameWithDecks();
  manuchilizGame.players[0].hand = ["expansion1:manuchiliz"];
  manuchilizGame.players[0].manaCurrent = 8;
  manuchilizGame.players[0].board = [minion("friendly", "base:aleex")];
  manuchilizGame.players[1].board = [minion("opponent", "base:babu")];
  manuchilizGame.playCard(0, 0, null);
  assert(manuchilizGame.players[0].board.length === 1, "Manuchiliz should also damage and remove friendly minions with 3 health.");
  assert(manuchilizGame.players[0].board[0].cardId === "expansion1:manuchiliz", "Manuchiliz should survive its own on-play damage.");
  const manuchiliz = getCardById("expansion1:manuchiliz");
  const manuchilizDamage = manuchiliz.abilities.find((ability) => ability.effect === "damageAllOtherMinions")?.value;
  assert(manuchilizDamage === 4, "Manuchiliz should deal 4 damage to other minions.");
  assert(manuchilizGame.players[0].board[0].health === manuchiliz.health, "Manuchiliz should not take damage from its own effect.");
  assert(manuchilizGame.players[1].board.length === 0, "Manuchiliz should remove enemy minions with 3 health.");
  console.log("--- FANEX AND MANUCHILIZ TEST OK ---");
}

main();
