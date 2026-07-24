const assert = require("assert");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

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

{
  const game = new Game("TEST", "A", "B", { randomInt: () => 0 });
  const baatus = minion("baatus", "expansion1:baatus");
  const attacker = minion("attacker", "base:aleex", { canAttack: true });
  game.players[0].board = [baatus];
  game.players[1].board = [attacker];
  game.turn = 1;

  game.attack(1, attacker.instanceId, baatus.instanceId);

  const activation = game.getStateFor(0).specialAbilityActivations.find((item) => item.instanceId === baatus.instanceId);
  assert(activation, "Special ability activations should include the source minion instance.");
  assert.strictEqual(activation.cardId, baatus.cardId, "Special ability activations should include the source card id.");
  assert.strictEqual(activation.effect, "applyDrunkToAttacker", "Triggered abilities should expose their effect for visuals.");
  assert.strictEqual(activation.trigger, "onAttacked", "Triggered abilities should expose their trigger for visuals.");
}

{
  const game = new Game("TEST", "A", "B", { randomInt: () => 0 });
  const vendetta = minion("vendetta", "base:v-for-vendetta");
  game.players[1].board = [vendetta];

  game._damageMinion(1, vendetta, 2, { adverseEffect: true });

  const activation = game.getStateFor(0).specialAbilityActivations.find((item) => item.instanceId === vendetta.instanceId);
  assert(activation, "Passive adverse-effect immunity should emit a special ability activation.");
  assert.strictEqual(activation.effect, "immuneToAdverseEffects", "Passive activations should expose the passive effect.");
  assert.strictEqual(activation.trigger, "passive", "Passive activations should be marked as passive.");
}

console.log("--- SPECIAL ABILITY BADGE ACTIVATION TEST OK ---");
