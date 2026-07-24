module.exports = {
  name: "Toy",
  cost: 5,
  type: "minion",
  attack: 5,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Portugal",
  lore: "At the start of your next turn, weaken 1 random enemy minion once for two turns.",
  image: "art/Toy.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "weakened", value: 3, turns: 2, oncePerMinion: true },
  ],
};
