const assert = require("assert");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");
const { chooseNpcAttack, chooseNpcPlayable, npcCardTarget, npcTakeTurn } = require("../server/npcAi");

function minion(instanceId, cardId = "base:aleex") {
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
    statuses: [],
    race: card.race,
    rarity: card.rarity,
  };
}

function makeNpcMamaluteoGame() {
  const game = new Game("NPC_AI_TARGETING", "Player", "The Protector", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  game.turn = 1;
  game.players[1].hand = ["TheGates:mamaluteo"];
  game.players[1].manaCurrent = 10;
  game.players[1].manaMax = 10;
  return game;
}

async function main() {
{
  const game = makeNpcMamaluteoGame();
  const play = chooseNpcPlayable(game);
  assert(play, "The Protector should consider Mamaluteo playable without enemy minions.");
  assert.strictEqual(play.card.id, "TheGates:mamaluteo");
  assert.strictEqual(npcCardTarget(game, play.card), "faceEnemy", "Mamaluteo should target the enemy hero when no minion exists.");

  game.playCard(1, play.handIndex, npcCardTarget(game, play.card));
  assert.strictEqual(game.players[1].board.length, 1, "Mamaluteo should appear on The Protector's board.");
  assert.strictEqual(game.players[1].board[0].cardId, "TheGates:mamaluteo");
  assert.strictEqual(game.players[0].statuses[0]?.type, "poisoned", "Mamaluteo should poison the player hero.");
}

{
  const game = makeNpcMamaluteoGame();
  game.players[0].board = [minion("target-a", "base:aleex")];
  const play = chooseNpcPlayable(game);
  assert.strictEqual(npcCardTarget(game, play.card), "target-a", "Mamaluteo should prefer a strong enemy minion when one exists.");
}

{
  const game = new Game("NPC_MULTI_PLAY", "Player", "NPC", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  game.turn = 1;
  game.players[1].hand = ["base:aleex", "base:kep"];
  game.players[1].manaCurrent = 3;
  game.players[1].manaMax = 3;
  await npcTakeTurn(game, 1, { stepDelay: 0 });
  assert.strictEqual(game.players[1].board.length, 2, "NPC should play multiple useful cards when it has enough mana.");
  assert.strictEqual(game.turn, 0, "NPC should still end its turn after playing cards.");
}

{
  const game = new Game("NPC_TRADE", "Player", "NPC", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  game.turn = 1;
  game.players[0].board = [minion("threat", "base:aleex")];
  game.players[1].board = [minion("attacker", "base:bloodgiver")];
  game.players[1].board[0].canAttack = true;
  const attack = chooseNpcAttack(game, 1);
  assert.strictEqual(attack.targetInstanceId, "threat", "NPC should remove a valuable minion instead of always attacking face.");
}

{
  const game = new Game("NPC_LETHAL", "Player", "NPC", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  game.turn = 1;
  game.players[0].health = 3;
  game.players[1].board = [minion("lethal", "base:bloodgiver")];
  game.players[1].board[0].canAttack = true;
  const attack = chooseNpcAttack(game, 1);
  assert.strictEqual(attack.targetInstanceId, "face", "NPC should take lethal when it is available.");
}

console.log("--- NPC AI TARGETING TEST OK ---");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
