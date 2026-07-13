const assert = require("assert");
const { CARDS } = require("../public/cards");
const { Game } = require("../public/engine");

const SPELL_IDS = [
  "expansion1:minorspark",
  "expansion1:minorfireball",
  "expansion1:greaterblessing",
  "expansion1:quickbandage",
  "expansion1:elementalfury",
  "expansion1:focusedbolt",
  "expansion1:devastatingmeteor",
  "expansion1:arcanereading",
];

const expansionSpells = CARDS.filter((card) => SPELL_IDS.includes(card.id));
assert.strictEqual(expansionSpells.length, SPELL_IDS.length, "Expansion 1 must include its eight spell cards.");
assert(expansionSpells.every((card) => card.type === "spell"), "Each new Expansion 1 card must be a spell.");

const game = new Game("SPELLS", "Caster", "Opponent", {
  decks: [Array(20).fill("expansion1:minorspark"), Array(20).fill("expansion1:minorspark")],
});

game.players[0].hand = ["expansion1:minorspark"];
game.players[0].manaCurrent = 10;
game.playCard(0, 0, "faceEnemy");
assert.strictEqual(game.players[1].health, 28, "Minor Spark should deal two damage to the enemy hero.");

game.players[0].health = 18;
game.players[0].hand = ["expansion1:greaterblessing"];
game.players[0].manaCurrent = 10;
game.playCard(0, 0, null);
assert.strictEqual(game.players[0].health, 24, "Greater Blessing should heal the caster for six.");

game.players[0].hand = ["expansion1:arcanereading"];
game.players[0].deck = ["expansion1:minorspark", "expansion1:quickbandage"];
game.players[0].manaCurrent = 10;
game.playCard(0, 0, null);
assert.strictEqual(game.players[0].hand.length, 2, "Arcane Reading should draw two cards.");

console.log("--- EXPANSION 1 SPELLS TEST OK ---");
