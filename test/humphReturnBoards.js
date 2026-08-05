const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function minion(instanceId, cardId, overrides = {}) {
  const card = getCardById(cardId);
  return {
    instanceId,
    cardId,
    name: card.name,
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
  const game = new Game("HUMPH", "Humph owner", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    randomInt: () => 0,
  });
  game.players.forEach((player) => {
    player.deck = Array(20).fill("base:aleex");
    player.hand = [];
    player.board = [];
    player.manaMax = 4;
    player.manaCurrent = 4;
  });
  game.turn = 0;
  return game;
}

const humph = getCardById("base:humph");
assert(humph, "Humph must exist.");
assert(humph.cost === 5 && humph.attack === 5 && humph.health === 8, "Humph must keep the requested 5 Mana 5/8 stats.");
assert(humph.lore.includes("extra Mana"), "Humph must describe its next-turn Mana effect.");
assert(humph.abilities.some((ability) => ability.trigger === "onKillMinion" && ability.effect === "grantNextTurnTemporaryMana" && ability.value === 2), "Humph must grant 2 extra Mana next turn on kill.");

{
  const game = makeGame();
  const humphInPlay = minion("humph", "base:humph");
  const target = minion("target", "base:aleex", { health: 3, maxHealth: 3, attack: 0 });
  game.players[0].board = [humphInPlay];
  game.players[1].board = [target];

  game.attack(0, humphInPlay.instanceId, target.instanceId);

  assert(game.players[1].board.length === 0, "Humph should kill the target minion.");
  assert(game.players[0].nextTurnManaBonus === 2, "Humph should queue 2 extra Mana for its controller's next turn.");

  game.endTurn(0);
  game.endTurn(1);

  assert(game.players[0].manaMax === 5, "Humph's bonus should not increase base Mana.");
  assert(game.players[0].manaCurrent === 7, "Humph's queued bonus should be added as extra Mana on the next turn.");
  assert(game.players[0].nextTurnManaBonus === 0, "Humph's queued bonus should be consumed at turn start.");
}

{
  const game = makeGame();
  const silencedHumph = minion("humph", "base:humph", { statuses: [{ type: "silenced" }] });
  const target = minion("target", "base:aleex", { health: 3, maxHealth: 3, attack: 0 });
  game.players[0].board = [silencedHumph];
  game.players[1].board = [target];

  game.attack(0, silencedHumph.instanceId, target.instanceId);

  assert(game.players[0].nextTurnManaBonus === 0, "Silenced Humph should not queue extra Mana.");
}

console.log("--- HUMPH NEXT TURN MANA TEST OK ---");
