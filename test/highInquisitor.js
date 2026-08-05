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

const card = getCardById("expansion2:high-inquisitor-knkl");
assert(card.abilities.some((ability) =>
  ability.effect === "buffSelf" &&
  ability.attack === 3 &&
  ability.health === 3 &&
  ability.maxApplications === 4 &&
  ability.maxAttack === undefined &&
  ability.maxHealth === undefined
), "High_Inquisitor_KnkL should buff only itself up to 4 times.");
assert(card.lore.includes("after this is summoned"), "High_Inquisitor_KnkL should describe that the buff happens on later turn starts.");
assert(card.lore.includes("up to 4 times"), "High_Inquisitor_KnkL should describe its activation cap.");

const game = new Game("INQUISITOR", "Inquisitor", "Opponent", {
  decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
});
const inquisitor = minion("inquisitor", "expansion2:high-inquisitor-knkl");
const ally = minion("ally", "base:aleex");
game.players[0].board = [inquisitor, ally];

game.endTurn(0);
assert.strictEqual(inquisitor.attack, card.attack, "High_Inquisitor_KnkL should not buff on the opponent's turn.");
assert.strictEqual(ally.attack, getCardById("base:aleex").attack, "Allied minions should not be buffed.");

game.endTurn(1);
assert.strictEqual(inquisitor.attack, card.attack + 3, "High_Inquisitor_KnkL should gain +3 Attack at the start of its controller's turn.");
assert.strictEqual(inquisitor.health, card.health + 3, "High_Inquisitor_KnkL should gain +3 Health at the start of its controller's turn.");
assert.strictEqual(inquisitor.maxHealth, card.health + 3, "High_Inquisitor_KnkL should gain +3 max Health too.");
assert.strictEqual(ally.attack, getCardById("base:aleex").attack, "The self-buff should not affect allied minions.");
assert.strictEqual(ally.health, getCardById("base:aleex").health, "The self-buff should not affect allied minions' Health.");

for (let i = 0; i < 5; i += 1) {
  game.endTurn(0);
  game.endTurn(1);
}
assert.strictEqual(inquisitor.attack, 12, "High_Inquisitor_KnkL should stop after 4 Attack buffs.");
assert.strictEqual(inquisitor.health, 15, "High_Inquisitor_KnkL should stop after 4 Health buffs.");
assert.strictEqual(inquisitor.maxHealth, 15, "High_Inquisitor_KnkL should stop after 4 max Health buffs.");

const overhealGame = new Game("INQUISITOR-OVERHEAL", "Inquisitor", "Opponent", {
  decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
});
const overhealed = minion("overhealed", "expansion2:high-inquisitor-knkl", { health: 20 });
overhealGame.players[0].board = [overhealed];
overhealGame.endTurn(0);
overhealGame.endTurn(1);
assert.strictEqual(overhealed.maxHealth, card.health + 3, "High_Inquisitor_KnkL should still gain max Health while overhealed.");
assert.strictEqual(overhealed.health, 23, "High_Inquisitor_KnkL should not reduce overhealed Health when buffing.");

console.log("--- HIGH INQUISITOR TEST OK ---");
