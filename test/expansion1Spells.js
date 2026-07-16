const assert = require("assert");
const { CARDS } = require("../public/cards");
const { Game } = require("../public/engine");
const { validateDeck } = require("../public/deckRules");

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

game.players[0].hand = ["expansion1:minorspark"];
game.players[0].manaCurrent = 10;
assert.throws(() => game.playCard(0, 0, "missing-minion"), /Invalid target/, "Damage spells should reject missing minion targets.");
assert.strictEqual(game.players[0].hand.length, 1, "Rejecting an invalid damage target must not consume the spell.");
assert.strictEqual(game.players[0].manaCurrent, 10, "Rejecting an invalid damage target must not spend mana.");

game.players[0].health = 28;
game.players[0].hand = ["expansion1:greaterblessing"];
game.players[0].manaCurrent = 10;
game.playCard(0, 0, null);
assert.strictEqual(game.players[0].health, 30, "Greater Blessing should not heal a hero above maximum Health.");

game.players[0].health = 12;
game.players[0].hand = ["expansion1:greaterblessing"];
game.players[0].manaCurrent = 10;
game.playCard(0, 0, "faceSelf");
assert.strictEqual(game.players[0].health, 18, "Greater Blessing should heal the selected friendly hero.");

const healedMinion = {
  instanceId: "healable-minion",
  cardId: "base:aleex",
  name: "Aleex",
  attack: 1,
  health: 2,
  maxHealth: 3,
  keywords: [],
  canAttack: false,
  divineShield: false,
  statuses: [],
};
game.players[0].board = [healedMinion];
game.players[0].hand = ["expansion1:quickbandage"];
game.players[0].manaCurrent = 10;
game.playCard(0, 0, healedMinion.instanceId);
assert.strictEqual(healedMinion.health, 5, "Quick Bandage should preserve healing overflow for minions.");

game.players[0].health = 25;
game.players[0].hand = ["expansion1:quickbandage"];
game.players[0].manaCurrent = 10;
game.playCard(0, 0, "faceSelf");
assert.strictEqual(game.players[0].health, 28, "Quick Bandage should heal the hero when it is selected as the target.");

game.players[0].hand = ["expansion1:quickbandage"];
game.players[0].manaCurrent = 10;
assert.throws(() => game.playCard(0, 0, "faceEnemy"), /Choose your own hero/, "Healing spells should reject the enemy hero.");
assert.strictEqual(game.players[0].hand.length, 1, "Rejecting an invalid healing target must not consume the spell.");
assert.strictEqual(game.players[0].manaCurrent, 10, "Rejecting an invalid healing target must not spend mana.");

game.players[0].hand = ["expansion1:arcanereading"];
game.players[0].deck = ["expansion1:minorspark", "expansion1:quickbandage"];
game.players[0].manaCurrent = 10;
game.playCard(0, 0, null);
assert.strictEqual(game.players[0].hand.length, 2, "Arcane Reading should draw two cards.");

const fillerIds = CARDS.filter((card) => card.type === "minion" && card.rarity === "common").slice(0, 9).map((card) => card.id);
const validDeck = [...fillerIds.slice(0, 8), ...fillerIds.slice(0, 8), fillerIds[8], ...SPELL_IDS.slice(0, 3)];
const invalidDeck = [...fillerIds.slice(0, 8), ...fillerIds.slice(0, 8), ...SPELL_IDS.slice(0, 4)];
const collection = [...new Set([...validDeck, ...invalidDeck])].reduce((counts, cardId) => {
  counts[cardId] = 2;
  return counts;
}, {});
assert(validateDeck(validDeck, { cardCollection: collection }).ok, "A deck with three spells should be valid.");
assert(
  validateDeck(invalidDeck, { cardCollection: collection }).errors.includes("Spell cards: max 3 total."),
  "A deck with four spells should be rejected."
);

console.log("--- EXPANSION 1 SPELLS TEST OK ---");
