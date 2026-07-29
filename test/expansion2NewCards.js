const assert = require("assert");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function game() {
  const g = new Game("EXP2", "Player", "Opponent", { randomInt: () => 0 });
  g.players.forEach((player) => {
    player.manaMax = 10;
    player.manaCurrent = 10;
    player.hand = [];
    player.deck = [];
    player.board = [];
  });
  g.turn = 0;
  return g;
}

function minion(instanceId, cardId, overrides = {}) {
  const card = getCardById(cardId);
  return {
    instanceId,
    cardId,
    name: card.name,
    attack: card.attack || 0,
    health: card.health || 1,
    maxHealth: card.health || 1,
    keywords: [...(card.keywords || [])],
    canAttack: false,
    divineShield: (card.keywords || []).includes("divineShield"),
    statuses: [],
    race: card.race,
    rarity: card.rarity,
    country: card.country,
    lore: card.lore,
    image: card.image || null,
    playedCount: 1,
    returnCount: 0,
    ...overrides,
  };
}

[
  ["expansion2:napalmerino", "Napalmerino", "rare", "Germany", 3, 3, 3],
  ["expansion2:zafuriousak", "ZaFuriousAK", "common", "South Africa", 2, 1, 5],
  ["expansion2:madamgoth", "Madamgoth", "rare", "South Africa", 6, 2, 9],
  ["expansion2:lordgattorosso", "LordGattoRosso", "common", "Italy", 1, 2, 2],
  ["expansion2:excelsior97", "excelsior97", "common", "Portugal", 3, 3, 4],
  ["expansion2:deus-inu", "Deus_Inu", "common", "Tanzania", 4, 3, 3],
  ["expansion2:chewakkka", "Chewakkka", "common", "Spain", 7, 5, 8],
  ["expansion2:babun", "Babun", "common", "Lithuania", 5, 4, 7],
  ["expansion2:Antichristjesus2", "Antichristjesus", "legendary", "Sri Lanka", 4, 3, 8],
  ["expansion2:10", "10", "rare", "Norway", 3, 2, 4],
].forEach(([id, name, rarity, country, cost, attack, health]) => {
  const card = getCardById(id);
  assert(card, `${id} should exist.`);
  assert.strictEqual(card.name, name);
  assert.strictEqual(card.rarity, rarity);
  assert.strictEqual(card.country, country);
  assert.strictEqual(card.cost, cost);
  assert.strictEqual(card.attack, attack);
  assert.strictEqual(card.health, health);
  assert.strictEqual(card.type, "minion");
});

assert.strictEqual(getCardById("base:fish").cost, 5, "Fish should cost 5 Mana.");

{
  const g = game();
  const target = minion("ally", "base:aleex", { health: 2, maxHealth: 3 });
  g.players[0].board = [target];
  g.players[0].hand = ["expansion2:napalmerino"];

  g.playCard(0, 0, target.instanceId);

  assert.strictEqual(target.health, 4, "Napalmerino should overheal the selected minion by 2.");
}

{
  const g = game();
  const madamgoth = minion("madamgoth", "expansion2:madamgoth");
  const attacker = minion("attacker", "base:aleex", { canAttack: true });
  g.players[0].board = [attacker];
  g.players[1].board = [madamgoth];

  g.attack(0, attacker.instanceId, madamgoth.instanceId);

  const burning = attacker.statuses.find((status) => status.type === "burning");
  assert(burning, "Madamgoth should apply Burning to the attacker.");
  assert.strictEqual(burning.value, 1);
  assert.strictEqual(burning.turnsRemaining, 1);
}

{
  const g = game();
  g.players[1].board = [minion("antichrist", "expansion2:Antichristjesus2")];
  g.players[0].hand = ["base:fish"];

  assert.throws(() => g.playCard(0, 0, null), /prevents keyword cards/, "Antichristjesus should block enemy Taunt minions.");
}

{
  const g = game();
  g.players[1].board = [minion("antichrist", "expansion2:Antichristjesus2")];
  g.players[0].hand = ["special:moths"];

  assert.throws(() => g.playCard(0, 0, null), /prevents keyword cards/, "Antichristjesus should block enemy Divine Shield minions.");
}

{
  const g = game();
  g.players[1].board = [minion("antichrist", "expansion2:Antichristjesus2")];
  g.players[0].hand = ["base:dog"];

  g.playCard(0, 0, null);

  assert.strictEqual(g.players[0].board[0].cardId, "base:dog", "Antichristjesus should allow enemy Charge minions.");
}

{
  const g = game();
  g.players[0].board = [minion("antichrist", "expansion2:Antichristjesus2")];
  g.players[0].hand = ["base:fish"];

  g.playCard(0, 0, null);

  assert.strictEqual(g.players[0].board[1].cardId, "base:fish", "Antichristjesus should not block its controller's Taunt minions.");
}

{
  const g = game();
  const antichrist = minion("antichrist", "expansion2:Antichristjesus2", { canAttack: true, health: 4 });
  const target = minion("target", "base:aleex", { health: 3, attack: 0 });
  g.players[0].board = [antichrist];
  g.players[1].board = [target];

  g.attack(0, antichrist.instanceId, target.instanceId);

  assert.strictEqual(antichrist.health, 8, "Antichristjesus should restore Health up to 8 when it kills a minion.");
  assert.strictEqual(antichrist.divineShield, false, "Antichristjesus should not gain Divine Shield when it kills a minion.");
}

{
  const g = game();
  const ten = minion("ten", "expansion2:10");
  const attacker = minion("attacker", "base:aleex", { canAttack: true });
  g.players[0].board = [attacker];
  g.players[1].board = [ten];

  assert.throws(() => g.attack(0, attacker.instanceId, ten.instanceId), /cannot be attacked/, "10 should reject incoming attacks.");
}

{
  const g = game();
  const ten = minion("ten", "expansion2:10", { canAttack: true });
  const defender = minion("defender", "base:aleex");
  g.players[0].board = [ten];
  g.players[1].board = [defender];

  g.attack(0, ten.instanceId, defender.instanceId);

  assert.strictEqual(ten.health, 4, "10 should not take retaliation damage when attacking.");
}

{
  const g = game();
  const ten = minion("ten", "expansion2:10");
  g.players[0].board = [ten];
  g.turn = 1;

  g.endTurn(1);

  assert.strictEqual(ten.health, 3, "10 should lose 1 Health at the start of its controller's turn.");
}

console.log("--- EXPANSION 2 NEW CARDS TEST OK ---");
