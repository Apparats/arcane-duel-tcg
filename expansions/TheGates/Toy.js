module.exports = {
  name: "Toy",
  cost: 5,
  type: "minion",
  attack: 3,
  health: 8,
  keywords: [],
  race: "Human",
  rarity: "mythic",
  country: "Portugal",
  lore: "On play, weaken an enemy minion for two turns.",
  image: "art/Toy.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "weakened", value: 3, turns: 2 },
  ],
};
