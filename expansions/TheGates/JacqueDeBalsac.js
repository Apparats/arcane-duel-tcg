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
  lore: "At the start of your next turn, freeze 1 random enemy minion once.",
  image: "art/JacqueDeBalsac.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "frozen", turns: 1, oncePerMinion: true },
  ],
};
