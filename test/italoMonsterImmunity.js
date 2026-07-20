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
  return new Game("ITALO", "Italo", "Monster", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
  });
}

const italoCard = getCardById("expansion2:italo179");
assert(italoCard.abilities.some((ability) => ability.effect === "preventDamageFromRace" && ability.race === "Monster"), "Italo179 should prevent Monster damage.");
assert(italoCard.lore.includes("Monster cards"), "Italo179 should describe its Monster damage prevention.");

{
  const game = makeGame();
  const italo = minion("italo", "expansion2:italo179");
  game.players[0].board = [italo];

  game._damageMinion(0, italo, 3, { sourceRace: "Monster" });
  assert.strictEqual(italo.health, italoCard.health, "Italo179 should take no direct minion damage from Monster sources.");

  game._damageMinion(0, italo, 2, { sourceRace: "Human" });
  assert.strictEqual(italo.health, italoCard.health - 2, "Italo179 should still take damage from non-Monster sources.");
}

{
  const game = makeGame();
  const italo = minion("italo", "expansion2:italo179");
  const monster = minion("monster", "base:babu", { attack: 3, health: 10, maxHealth: 10 });
  game.players[0].board = [italo];
  game.players[1].board = [monster];
  game.turn = 1;

  game.attack(1, monster.instanceId, italo.instanceId);
  assert.strictEqual(italo.health, italoCard.health, "Italo179 should take no combat damage from Monster minions.");
  assert.strictEqual(monster.health, 10 - italo.attack, "Italo179 should still deal combat damage back.");
}

{
  const game = makeGame();
  const italo = minion("italo", "expansion2:italo179");
  game.players[0].hand = ["expansion1:manuchiliz"];
  game.players[0].manaCurrent = 10;
  game.players[1].board = [italo];

  game.playCard(0, 0, null);
  assert.strictEqual(italo.health, italoCard.health, "Italo179 should take no AoE damage from Monster cards.");
}

{
  const game = makeGame();
  const italo = minion("italo", "expansion2:italo179");
  game.players[0].hand = ["TheGates:mamaluteo"];
  game.players[0].manaCurrent = 10;
  game.players[1].board = [italo];

  game.playCard(0, 0, italo.instanceId);
  assert.strictEqual(italo.statuses[0]?.sourceRace, "Monster", "Monster-applied statuses should remember their damage source race.");
  game.endTurn(0);
  assert.strictEqual(italo.health, italoCard.health, "Italo179 should take no Poison damage applied by a Monster card.");
}

console.log("--- ITALO MONSTER IMMUNITY TEST OK ---");
