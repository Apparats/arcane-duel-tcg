module.exports = {
  name: "Jacque De Balsac",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Belgium",
  lore: "On play, freeze an enemy minion. At the start of your turns, freeze 1 random enemy minion.",
  image: "art/JacqueDeBalsac.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "frozen", turns: 1 },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "frozen", turns: 1 },
  ],
};
