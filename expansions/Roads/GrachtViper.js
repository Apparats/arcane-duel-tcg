module.exports = {
  name: "GrachtViper",
  cost: 6,
  type: "minion",
  attack: 4,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Netherlands",
  lore: "On play, steal a random non-Mythic, non-Legendary enemy hand card, halve its Cost, and buff minion stats by 30%.",
  image: "art/GrachtViper.webp",
  abilities: [
    { trigger: "onPlay", effect: "stealRandomEnemyHandNonMythicCardBuffed", buffPercent: 30 },
  ],
};
