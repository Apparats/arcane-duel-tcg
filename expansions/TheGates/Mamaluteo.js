module.exports = {
  name: "Mamaluteo",
  cost: 7,
  type: "minion",
  attack: 5,
  health: 7,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Bolivia",
  lore: "On play, poison an enemy minion. The venom keeps working after the clash.",
  image: "art/mamaluteo.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "poisoned", value: 2, turns: 3 },
  ],
};
