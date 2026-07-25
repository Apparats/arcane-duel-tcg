module.exports = {
  name: "Datapunkt",
  cost: 4,
  type: "minion",
  attack: 3,
  health: 5,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Austria",
  lore: "On play, choose an enemy minion and return it to the enemy deck.",
  image: "art/Datapunkt.webp",
  abilities: [
    { trigger: "onPlay", effect: "returnEnemyMinionToDeck", target: "enemyMinion" },
  ],
};
