const assert = require("assert");
const { Game } = require("../public/engine");
const { CARDS, getCardById } = require("../public/cards");

function minion(instanceId, cardId, overrides = {}) {
  const card = getCardById(cardId);
  assert(card, `Missing card fixture: ${cardId}`);
  return {
    instanceId,
    cardId,
    name: card.name,
    cost: card.cost,
    attack: card.attack,
    health: card.health,
    maxHealth: card.health,
    keywords: [...(card.keywords || [])],
    canAttack: false,
    divineShield: false,
    statuses: [],
    race: card.race,
    rarity: card.rarity,
    country: card.country,
    lore: card.lore,
    image: card.image || null,
    playedCount: 0,
    returnCount: 0,
    rebirthUsed: false,
    ...overrides,
  };
}

function makeGame(randomInt = () => 0) {
  return new Game("LAWRENCE", "Lawrence", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt,
  });
}

const lawrenceId = "expansion2:lawrence-of-arabia";
const lawrence = getCardById(lawrenceId);
const visibleSpells = CARDS.filter((card) => card.type === "spell" && card.showInInventory !== false);

assert(lawrence.abilities.some((ability) => ability.effect === "addRandomSpellToHand"), "Lawrence-of-Arabia should add random spells.");
assert(lawrence.lore.includes("random spell"), "Lawrence-of-Arabia should describe its random spell generation.");
assert(visibleSpells.length > 0, "The card catalog should include visible spells.");

{
  const game = makeGame(() => 0);
  game.players[0].deck = [];
  game.players[1].deck = [];
  game.players[0].hand = [];
  game.players[1].hand = [];
  game.players[0].board = [minion("lawrence", lawrenceId)];

  game.endTurn(0);
  assert.strictEqual(game.players[0].hand.length, 0, "Lawrence should not add a spell on the opponent's turn.");

  game.endTurn(1);
  assert.strictEqual(game.players[0].hand.length, 1, "Lawrence should add one spell at the start of its controller's turn.");
  const generated = getCardById(game.players[0].hand[0]);
  assert(generated, "The generated card should exist.");
  assert.strictEqual(generated.type, "spell", "Lawrence should add a spell card.");
  assert.notStrictEqual(generated.showInInventory, false, "Lawrence should not add hidden technical spells.");
  assert.strictEqual(game.players[0].hand[0], visibleSpells[0].id, "Lawrence should use the engine random source to pick the spell.");
}

{
  const game = makeGame(() => visibleSpells.length - 1);
  game.players[0].deck = [];
  game.players[1].deck = [];
  game.players[0].hand = Array(10).fill("base:aleex");
  game.players[0].board = [minion("lawrence", lawrenceId)];

  game.endTurn(0);
  game.endTurn(1);
  assert.strictEqual(game.players[0].hand.length, 10, "Lawrence should not overfill the hand.");
  assert(game.players[0].hand.every((cardId) => cardId === "base:aleex"), "A full hand should remain unchanged.");
}

console.log("--- LAWRENCE RANDOM SPELL TEST OK ---");
