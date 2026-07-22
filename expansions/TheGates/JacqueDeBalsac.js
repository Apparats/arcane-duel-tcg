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
  lore: "On play and at the start of each of your turns, freeze an enemy minion.",
  image: "art/JacqueDeBalsac.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "frozen", turns: 1 },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "frozen", turns: 1 },
  ],
};
