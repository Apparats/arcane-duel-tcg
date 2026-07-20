module.exports = {
  name: "Jacque De Balsac",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "mythic",
  country: "Belgium",
  lore: "On play, freeze an enemy minion before its next assault.",
  image: "art/JacqueDeBalsac.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "frozen", turns: 1 },
  ],
};
