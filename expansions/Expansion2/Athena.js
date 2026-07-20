module.exports = {
  name: "Athena",
  cost: 5,
  type: "minion",
  attack: 5,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "mythic",
  country: "Bolivia",
  lore: "On play, move non-Mythic enemy board minions that can fit to your board. Does not affect Athena cards.",
  image: "art/Athena.webp",
  abilities: [
    { trigger: "onPlay", effect: "stealEnemyBoardNonMythicMinions" },
  ],
};
