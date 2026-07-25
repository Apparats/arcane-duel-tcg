const assert = require("assert");
const fs = require("fs");
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
    ...overrides,
  };
}

function makeGame(randomInt = () => 0) {
  return new Game("ROADS", "Roads", "Target", {
    decks: [Array(25).fill("base:aleex"), Array(25).fill("base:aleex")],
    randomInt,
  });
}

function statusValue(minion, type) {
  return (minion.statuses || []).find((status) => status.type === type)?.value || 0;
}

function testRoadsCardsAreVisibleStageRewards() {
  const jubx4 = getCardById("roads:jubx4");
  const viper = getCardById("roads:grachtviper");
  const datapunkt = getCardById("roads:datapunkt");
  const louis = getCardById("roads:louisg-boulanger");
  const johnny = getCardById("roads:johnny");

  assert(jubx4, "Jubx4 should compile into Roads.");
  assert(viper, "GrachtViper should compile into Roads.");
  assert(datapunkt, "Datapunkt should compile into Roads.");
  assert(louis, "LouisG-Boulanger should compile into Roads.");
  assert(johnny, "Johnny should compile into Roads.");
  assert.strictEqual(jubx4.rarity, "legendary", "Jubx4 should be Legendary.");
  assert.strictEqual(jubx4.country, "Iraq", "Jubx4 should be from Iraq.");
  assert.strictEqual(jubx4.attack, 4, "Jubx4 should have 4 Attack.");
  assert.strictEqual(jubx4.health, 10, "Jubx4 should have 10 Health.");
  assert.strictEqual(jubx4.cost, 5, "Jubx4 should cost 5 Mana.");
  assert.notStrictEqual(jubx4.showInInventory, false, "Jubx4 should be visible now that Stage 3 can unlock it.");
  assert.strictEqual(viper.rarity, "legendary", "GrachtViper should be Legendary.");
  assert.strictEqual(viper.country, "Netherlands", "GrachtViper should be from Netherlands.");
  assert.strictEqual(viper.attack, 4, "GrachtViper should have 4 Attack.");
  assert.strictEqual(viper.health, 10, "GrachtViper should have 10 Health.");
  assert.strictEqual(viper.cost, 6, "GrachtViper should cost 6 Mana.");
  assert.notStrictEqual(viper.showInInventory, false, "GrachtViper should be visible now that Stage 3 can unlock it.");
  assert.strictEqual(datapunkt.rarity, "legendary", "Datapunkt should be Legendary.");
  assert.strictEqual(datapunkt.country, "Austria", "Datapunkt should be from Austria.");
  assert.strictEqual(datapunkt.attack, 3, "Datapunkt should have 3 Attack.");
  assert.strictEqual(datapunkt.health, 5, "Datapunkt should have 5 Health.");
  assert.strictEqual(datapunkt.cost, 4, "Datapunkt should cost 4 Mana.");
  assert.notStrictEqual(datapunkt.showInInventory, false, "Datapunkt should be visible now that Stage 3 can unlock it.");
  assert.strictEqual(louis.rarity, "common", "LouisG-Boulanger should be Common.");
  assert.strictEqual(louis.country, "Belgium", "LouisG-Boulanger should be from Belgium.");
  assert.strictEqual(louis.attack, 3, "LouisG-Boulanger should have 3 Attack.");
  assert.strictEqual(louis.health, 5, "LouisG-Boulanger should have 5 Health.");
  assert.strictEqual(louis.cost, 3, "LouisG-Boulanger should cost 3 Mana.");
  assert.notStrictEqual(louis.showInInventory, false, "LouisG-Boulanger should be visible now that Stage 3 can unlock it.");
  assert.strictEqual(johnny.rarity, "souvenir", "Johnny should be Souvenir.");
  assert.strictEqual(johnny.country, "Chile", "Johnny should be from Chile.");
  assert.strictEqual(johnny.attack, 1, "Johnny should have 1 Attack.");
  assert.strictEqual(johnny.health, 2, "Johnny should have 2 Health.");
  assert.strictEqual(johnny.cost, 1, "Johnny should cost 1 Mana.");
  assert.notStrictEqual(johnny.showInInventory, false, "Johnny should be visible now that Stage 3 can unlock it.");
  assert(jubx4.lore.includes("Whenever an enemy card dies from any source"), "Jubx4 should explain that any enemy death raises its Dodge.");
}

function testJubx4DodgeGrantAndScaling() {
  const game = makeGame();
  const ally = minion("ally", "base:barto");
  game.players[0].board = [ally];
  game.players[0].hand = ["roads:jubx4"];
  game.players[0].manaCurrent = 10;

  game.playCard(0, 0, null);
  const jubx4 = game.players[0].board.find((card) => card.cardId === "roads:jubx4");

  assert.strictEqual(statusValue(jubx4, "dodge"), 40, "Jubx4 should grant itself 40% Dodge on first play.");
  assert.strictEqual(statusValue(ally, "dodge"), 30, "Jubx4 should grant other allied minions 30% Dodge on first play.");

  game.randomInt = () => 39;
  const healthBefore = jubx4.health;
  game._damageMinion(0, jubx4, 4);
  assert.strictEqual(jubx4.health, healthBefore, "Dodge should prevent incoming damage when the chance succeeds.");

  game.randomInt = () => 99;
  game._damageMinion(0, jubx4, 1);
  assert.strictEqual(jubx4.health, healthBefore - 1, "Dodge should allow damage through when the chance fails.");

  const allyKiller = minion("ally-killer", "base:barto", { attack: 99 });
  game.players[0].board.push(allyKiller);
  const enemyKilledByAlly = minion("enemy-killed-by-ally", "base:aleex", { health: 1, maxHealth: 1 });
  game.players[1].board = [enemyKilledByAlly];
  game.attack(0, allyKiller.instanceId, enemyKilledByAlly.instanceId);
  assert.strictEqual(statusValue(jubx4, "dodge"), 45, "Jubx4's Dodge should increase when any allied card kills an enemy.");

  for (let index = 0; index < 5; index += 1) {
    const target = minion(`target-${index}`, "base:aleex", { attack: 0, health: 1, maxHealth: 1 });
    game.players[1].board = [target];
    jubx4.canAttack = true;
    game.attack(0, jubx4.instanceId, target.instanceId);
  }

  assert.strictEqual(statusValue(jubx4, "dodge"), 60, "Jubx4's Dodge should increase by kills but cap at 60%.");
}

function testGrachtViperStealsEnemyHandCardAndRevealsChoices() {
  const game = makeGame(() => 0);
  const stolenBase = getCardById("base:barto");
  game.players[0].hand = ["roads:grachtviper"];
  game.players[0].manaCurrent = 10;
  game.players[1].hand = ["expansion2:athena", "base:bloodgiver", "base:barto", "base:aleex"];

  game.playCard(0, 0, null);

  const stolenRef = game.players[0].hand.find((cardRef) => String(cardRef).startsWith("base:barto"));
  assert(stolenRef, "GrachtViper should steal a non-Mythic, non-Legendary card from the enemy hand.");
  assert(stolenRef.includes(`attack:${Math.ceil(stolenBase.attack * 0.3)}`), "GrachtViper should buff stolen minion Attack by 30%.");
  assert(stolenRef.includes(`health:${Math.ceil(stolenBase.health * 0.3)}`), "GrachtViper should buff stolen minion Health by 30%.");
  assert(stolenRef.includes("cost:-2"), "GrachtViper should reduce the stolen card's Cost by half.");
  assert(game.players[1].hand.includes("expansion2:athena"), "GrachtViper should not steal Mythic cards.");
  assert(game.players[1].hand.includes("base:bloodgiver"), "GrachtViper should not steal Legendary cards.");
  assert.strictEqual(game.getStateFor(0).me.hand.find((card) => card.id === "base:barto")?.cost, 2, "The stolen card should appear with reduced Cost.");

  const selfReveal = game.getStateFor(0).specialAbilityActivations.find((activation) => activation.effect === "stealRandomEnemyHandNonMythicCardBuffed");
  assert(selfReveal?.handReveal, "GrachtViper should expose a private hand reveal to the stealing player.");
  assert.strictEqual(selfReveal.handReveal.cards.length, 2, "GrachtViper should reveal all non-Mythic, non-Legendary enemy hand choices.");
  assert.strictEqual(selfReveal.handReveal.selectedIndex, 0, "GrachtViper should mark the stolen choice.");
  assert.strictEqual(selfReveal.handReveal.stolenCard.id, "base:barto", "GrachtViper should reveal the stolen card.");
  assert.strictEqual(selfReveal.handReveal.stolenCard.cost, 2, "GrachtViper should reveal the discounted stolen card.");

  const opponentReveal = game.getStateFor(1).specialAbilityActivations.find((activation) => activation.effect === "stealRandomEnemyHandNonMythicCardBuffed");
  assert(!opponentReveal?.handReveal, "GrachtViper should not reveal the enemy hand to the opponent.");
}

function testDatapunktReturnsChosenEnemyMinionToDeck() {
  const game = makeGame(() => 0);
  const target = minion("enemy-target", "base:barto");
  game.players[0].hand = ["roads:datapunkt"];
  game.players[0].manaCurrent = 10;
  game.players[1].board = [target];
  game.players[1].deck = [];

  game.playCard(0, 0, target.instanceId);

  assert.strictEqual(game.players[1].board.length, 0, "Datapunkt should remove the chosen enemy minion from the board.");
  assert.deepStrictEqual(game.players[1].deck, ["base:barto"], "Datapunkt should return the chosen minion to the enemy deck.");
}

function testJohnnyGrantsTemporaryMana() {
  const game = makeGame();
  game.players[0].hand = ["roads:johnny"];
  game.players[0].manaCurrent = 1;
  game.players[0].manaMax = 1;

  game.playCard(0, 0, null);

  assert.strictEqual(game.players[0].manaCurrent, 2, "Johnny should grant 2 temporary Mana after paying its 1 Mana Cost.");
  assert.strictEqual(game.players[0].manaMax, 1, "Johnny should not increase maximum Mana.");
}

function testRoadsClientSupport() {
  const clientSource = fs.readFileSync("public/client.js", "utf8");
  const boardCss = fs.readFileSync("public/css/board.css", "utf8");
  const indexHtml = fs.readFileSync("public/index.html", "utf8");
  assert(clientSource.includes("showHandStealReveal"), "Client should render the GrachtViper hand reveal.");
  assert(clientSource.includes('dodge: "Dodge"'), "Client should label Dodge status.");
  assert(indexHtml.includes('id="handRevealOverlay"'), "Game screen should include the hand reveal modal.");
  assert(/\.hand-reveal-cards\s*\{[\s\S]*?grid-template-rows: repeat\(2,/.test(boardCss), "Hand reveal cards should use two compact rows.");
}

testRoadsCardsAreVisibleStageRewards();
testJubx4DodgeGrantAndScaling();
testGrachtViperStealsEnemyHandCardAndRevealsChoices();
testDatapunktReturnsChosenEnemyMinionToDeck();
testJohnnyGrantsTemporaryMana();
testRoadsClientSupport();
console.log("--- ROADS CARDS TEST OK ---");
