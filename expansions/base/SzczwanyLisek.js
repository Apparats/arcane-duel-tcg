module.exports = {
  name: "SzczwanyLisek",
  cost: 5,
  type: "minion",
  attack: 5,
  health: 5,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Poland",
  lore: "On play, steal 1 Health from a random minion in the enemy hand and gain +1 Attack.",
  image: "art/SzczwanyLisek.webp",
  abilities: [
    { trigger: "onPlay", effect: "stealHealthFromRandomEnemyHandMinionAsAttack" },
  ],
};
