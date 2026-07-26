module.exports = {
  name: "Toy",
  cost: 4,
  type: "minion",
  attack: 5,
  health: 8,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Portugal",
  lore: "On play, weaken an enemy minion. At the start of your turns, weaken 1 random enemy minion.",
  image: "art/Toy.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "weakened", value: 3, turns: 2 },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "weakened", value: 3, turns: 2 },
  ],
};
