module.exports = {
  name: "Fanex",
  cost: 4,
  type: "minion",
  attack: 4,
  health: 5,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Rwanda",
  lore: "On play, steal a random minion from the enemy board and deploy it to your board.",
  image: "art/Fanex.webp",
  abilities: [
    { trigger: "onPlay", effect: "stealRandomEnemyBoardMinion" },
  ],
};
