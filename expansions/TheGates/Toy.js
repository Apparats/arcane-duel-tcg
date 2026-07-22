module.exports = {
  name: "Toy",
  cost: 5,
  type: "minion",
  attack: 5,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "mythic",
  country: "Portugal",
  lore: "On play and at the start of each of your turns, weaken an enemy minion for two turns.",
  image: "art/Toy.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "weakened", value: 3, turns: 2 },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "weakened", value: 3, turns: 2 },
  ],
};
