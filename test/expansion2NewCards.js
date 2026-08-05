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
  ["expansion2:Antichristjesus2", "Antichristjesus", "legendary", "Sri Lanka", 4, 4, 8],
  ["expansion2:10", "10", "rare", "Norway", 3, 2, 4],
  ["expansion2:alfredo-cristiani", "alfredo_cristiani", "common", "El Salvador", 1, 2, 1],
  ["expansion2:asher", "asher", "rare", "Cambodia", 3, 3, 2],
  ["expansion2:brodocaldo", "BrodoCaldo", "common", "Mongolia", 5, 4, 7],
  ["expansion2:chivo", "Chivo", "common", "Liberia", 6, 6, 6],
  ["expansion2:corn", "CORN", "rare", "Canada", 6, 5, 7],
  ["expansion2:dempc", "dempc", "common", "Ireland", 7, 7, 7],
  ["expansion2:desumn", "desumn", "common", "France", 5, 1, 9],
  ["expansion2:dnalop", "dnalop", "common", "Greenland", 10, 4, 13],
  ["expansion2:ghoulli", "ghoulli", "rare", "Luxembourg", 4, 4, 5],
  ["expansion2:halbarad", "halbarad", "rare", "Luxembourg", 5, 4, 6],
  ["expansion2:jaume-primer", "jaume_primer", "rare", "Andorra", 5, 4, 6],
  ["expansion2:masterchief", "masterchief", "legendary", "Oman", 1, 2, 8],
  ["expansion2:naladarkclouds", "naladarkclouds", "common", "Chile", 4, 4, 6],
  ["expansion2:nootmuskater", "nootmuskater", "common", "Netherlands", 3, 3, 3],
  ["expansion2:polltrek", "polltrek", "common", "Norway", 5, 7, 3],
  ["expansion2:ravana", "ravana", "common", "Sri Lanka", 6, 2, 9],
  ["expansion2:sagukeju", "sagukeju", "common", "Laos", 2, 2, 5],
  ["expansion2:sinistersmiley", "sinistersmiley", "rare", "South Africa", 6, 6, 6],
  ["expansion2:snowman", "snowman", "rare", "Portugal", 6, 3, 8],
  ["expansion2:storamiaska", "storamiaska", "rare", "Saudi Arabia", 10, 5, 12],
  ["expansion2:vel", "Vel", "rare", "Mali", 3, 3, 2],
  ["expansion2:vorneburg", "vorneburg", "common", "Thailand", 10, 9, 5],
  ["expansion2:zugzwang2", "zugzwang", "common", "Bolivia", 4, 2, 5],
  ["expansion2:tomaswenzel", "tomaswenzel", "common", "Poland", 0, 1, 1],
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
assert.strictEqual(getCardById("expansion2:brodocaldo").lore, "", "Vanilla cards should not show description text.");

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
  const antichrist = minion("antichrist", "expansion2:Antichristjesus2");
  g.players[0].board = [antichrist];

  g._applyStatus(0, antichrist, { status: "poisoned", value: 1, turns: 2 });
  g._damageMinion(0, antichrist, 2, { adverseEffect: true });

  assert.strictEqual(antichrist.statuses.length, 0, "Antichristjesus should ignore adverse statuses.");
  assert.strictEqual(antichrist.health, 8, "Antichristjesus should ignore adverse effect damage.");
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

{
  const g = game();
  const monster = minion("monster", "base:aleex", { race: "Monster", health: 1, maxHealth: 5 });
  const human = minion("human", "base:warerita", { race: "Human", health: 1, maxHealth: 5 });
  g.players[0].board = [monster, human];
  g.players[0].hand = ["expansion2:asher"];

  g.playCard(0, 0, null);

  assert.strictEqual(monster.health, 2, "asher should heal friendly Monster cards.");
  assert.strictEqual(human.health, 1, "asher should not heal friendly Human cards.");
}

{
  const g = game();
  g.players[0].board = [minion("corn", "expansion2:corn")];
  g.players[0].hand = ["base:fish"];

  assert.throws(() => g.playCard(0, 0, null), /prevents keyword cards/, "CORN should block Taunt summons while on the board.");
}

{
  const g = game();
  g.players[0].hand = ["expansion2:ghoulli"];

  g.playCard(0, 0, null);

  assert(g.players[0].board[0].keywords.includes("taunt"), "ghoulli should gain one random keyword on play.");
}

{
  const g = game();
  g.players[0].hand = ["expansion2:halbarad"];

  g.playCard(0, 0, null);

  assert(g.players[0].hand.includes("expansion1:quickbandage"), "halbarad should add Quick Bandage to hand.");
}

{
  const g = game();
  g.players[0].hand = ["expansion2:jaume-primer"];

  g.playCard(0, 0, null);

  assert(g.players[0].hand.includes("expansion1:minorspark"), "jaume_primer should add Minor Spark to hand.");
}

{
  const g = game();
  const human = minion("human", "base:warerita", { race: "Human", attack: 2 });
  const monster = minion("monster", "base:aleex", { race: "Monster", attack: 2 });
  g.players[0].board = [human, monster];
  g.players[0].hand = ["expansion2:vel"];

  g.playCard(0, 0, null);

  assert.strictEqual(human.attack, 3, "Vel should give +1 Attack to friendly Human cards.");
  assert.strictEqual(monster.attack, 2, "Vel should not buff friendly Monster cards.");
}

{
  const g = game();
  const target = minion("target", "base:aleex");
  g.players[0].board = [target];
  g.players[0].hand = ["expansion2:sinistersmiley"];

  g.playCard(0, 0, target.instanceId);

  assert.strictEqual(target.divineShield, true, "sinistersmiley should grant Divine Shield to the chosen card.");
}

{
  const g = game();
  const snowman = minion("snowman", "expansion2:snowman");
  const attacker = minion("attacker", "base:barto", { canAttack: true, attack: 1, health: 20, maxHealth: 20 });
  g.players[0].board = [attacker];
  g.players[1].board = [snowman];

  g.attack(0, attacker.instanceId, snowman.instanceId);

  const frozen = attacker.statuses.find((status) => status.type === "frozen");
  assert(frozen, "snowman should Freeze the attacker.");
  assert.strictEqual(frozen.turnsRemaining, 2, "snowman should Freeze for 2 turns.");
}

{
  const g = game();
  const stora = minion("stora", "expansion2:storamiaska");
  g.players[0].board = [stora];
  g._damageMinion(0, stora, 4, { adverseEffect: true });
  assert.strictEqual(stora.health, 12, "storamiaska should ignore adverse damage from card effects.");

  g.players[0].hand = ["expansion2:sinistersmiley"];
  g.playCard(0, 0, stora.instanceId);
  assert.strictEqual(stora.divineShield, false, "storamiaska should ignore positive card effects too.");
}

{
  const g = game();
  g.players[0].hand = ["expansion2:masterchief"];
  g.playCard(0, 0, null);
  const chief = g.players[0].board[0];
  const target = minion("target", "base:aleex", { attack: 0, health: 1 });
  chief.canAttack = true;
  g.players[1].board = [target];
  g.attack(0, chief.instanceId, target.instanceId);
  assert.strictEqual(chief.divineShield, true, "masterchief should gain Divine Shield after killing a card.");

  chief.divineShield = false;
  chief.keywords = chief.keywords.filter((keyword) => keyword !== "divineShield");
  g.endTurn(0);
  g.endTurn(1);
  g.endTurn(0);
  g.endTurn(1);
  g.endTurn(0);
  g.endTurn(1);
  assert.strictEqual(chief.attack, 10, "masterchief should become 10 Attack after surviving 3 turns.");
  assert.strictEqual(chief.health, 10, "masterchief should become 10 Health after surviving 3 turns.");
  assert.strictEqual(chief.divineShield, true, "masterchief should gain Divine Shield when it transforms.");
}

console.log("--- EXPANSION 2 NEW CARDS TEST OK ---");
