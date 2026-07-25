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
  const game = new Game("NPC_UNIQUE_MYTHIC", "Player", "The Protector", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    playerConfigs: [{}, { uniqueMythicPlays: true }],
  });
  game.turn = 1;
  game.players[1].hand = ["base:lolflame2", "base:aleex"];
  game.players[1].playedCounts["base:lolflame2"] = 1;
  game.players[1].manaCurrent = 10;
  game.players[1].manaMax = 10;
  const play = chooseNpcPlayable(game);
  assert(play, "The Protector should still choose a valid non-Mythic play.");
  assert.strictEqual(play.card.id, "base:aleex", "The Protector should skip a Mythic it already played.");
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
  const game = new Game("NPC_GRACHTVIPER", "Player", "NPC", {
    decks: [Array(25).fill("base:aleex"), Array(25).fill("base:aleex")],
    randomInt: () => 0,
  });
  game.turn = 1;
  game.players[0].hand = ["expansion2:athena", "base:bloodgiver", "base:barto"];
  game.players[1].hand = ["roads:grachtviper"];
  game.players[1].manaCurrent = 8;
  game.players[1].manaMax = 8;

  const play = chooseNpcPlayable(game, { playerIdx: 1, limitMythics: false });
  assert(play, "NPC should consider GrachtViper playable without a manual target.");
  assert.strictEqual(play.card.id, "roads:grachtviper");
  assert.strictEqual(play.target, null, "GrachtViper should not require a UI target.");

  await npcTakeTurn(game, 1, { stepDelay: 0, limitMythics: false });
  assert(game.players[1].board.some((card) => card.cardId === "roads:grachtviper"), "NPC should play GrachtViper.");
  assert(game.players[1].board.some((card) => card.cardId === "base:barto" && card.cost === 2), "NPC should play the stolen discounted card when it has remaining mana.");
  assert(game.players[0].hand.includes("expansion2:athena"), "NPC GrachtViper should not steal Mythic cards.");
  assert(game.players[0].hand.includes("base:bloodgiver"), "NPC GrachtViper should not steal Legendary cards.");
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
