module.exports = {
  name: "Fanex",
  cost: 4,
  type: "minion",
  attack: 6,
  health: 4,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Rwanda",
  lore: "A single heavy strike sends an enemy back into the unknown.",
  image: "art/Fanex.webp",
  abilities: [
    { trigger: "onPlay", effect: "returnEnemyMinionToDeck", target: "enemyMinion" },
  ],
};
