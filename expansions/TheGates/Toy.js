module.exports = {
  name: "Toy",
  cost: 4,
  type: "minion",
  attack: 2,
  health: 8,
  keywords: ["taunt"],
  race: "Human",
  rarity: "mythic",
  country: "Portugal",
  lore: "On play, weaken an enemy minion for two turns.",
  image: "art/Toy.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "weakened", value: 3, turns: 2 },
  ],
};
