const assert = require("assert");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

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
    canAttack: true,
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

function makeGame() {
  return new Game("KNUD", "Knud", "Human", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
  });
}

const knudCard = getCardById("expansion2:knud-the-dorf");
assert(knudCard.abilities.some((ability) => ability.effect === "preventDamageFromRace" && ability.race === "Human"), "Knud_the_Dorf should prevent Human damage.");
assert(knudCard.lore.includes("Human cards"), "Knud_the_Dorf should describe its Human damage prevention.");

{
  const game = makeGame();
  const knud = minion("knud", "expansion2:knud-the-dorf");
  game.players[0].board = [knud];

  game._damageMinion(0, knud, 3, { sourceRace: "Human" });
  assert.strictEqual(knud.health, knudCard.health, "Knud_the_Dorf should take no direct minion damage from Human sources.");

  game._damageMinion(0, knud, 2, { sourceRace: "Monster" });
  assert.strictEqual(knud.health, knudCard.health - 2, "Knud_the_Dorf should still take damage from non-Human sources.");
}

{
  const game = makeGame();
  const knud = minion("knud", "expansion2:knud-the-dorf");
  const human = minion("human", "base:humph", { attack: 3, health: 10, maxHealth: 10 });
  game.players[0].board = [knud];
  game.players[1].board = [human];
  game.turn = 1;

  game.attack(1, human.instanceId, knud.instanceId);
  assert.strictEqual(knud.health, knudCard.health, "Knud_the_Dorf should take no combat damage from Human minions.");
  assert.strictEqual(human.health, 10 - knud.attack, "Knud_the_Dorf should still deal combat damage back.");
}

{
  const game = makeGame();
  const knud = minion("knud", "expansion2:knud-the-dorf");
  game.players[0].hand = ["TheGates:overseer"];
  game.players[0].manaCurrent = 10;
  game.players[0].board = [minion("ally", "base:aleex")];
  game.players[1].board = [knud];

  game.playCard(0, 0, null);
  const overseer = game.players[0].board.find((card) => card.cardId === "TheGates:overseer");
  assert(overseer, "Overseer should enter the board.");
  game._damageMinion(0, overseer, 99);
  assert.strictEqual(knud.health, knudCard.health - 20, "Knud_the_Dorf should still take damage from Monster card effects.");
}

console.log("--- KNUD HUMAN IMMUNITY TEST OK ---");
