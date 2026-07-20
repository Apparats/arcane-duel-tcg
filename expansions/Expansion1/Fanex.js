module.exports = {
  name: "Fanex",
  cost: 6,
  type: "minion",
  attack: 6,
  health: 10,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Rwanda",
  lore: "On play, steal a random minion from the enemy board and deploy it to your board.",
  image: "art/Fanex.webp",
  abilities: [
    { trigger: "onPlay", effect: "stealRandomEnemyBoardMinion" },
  ],
};
