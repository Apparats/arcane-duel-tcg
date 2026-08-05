module.exports = {
  name: "Athena",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 7,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Bolivia",
  lore: "On play, enemy minions gain Confusion for their next turn. They cannot attack normally and each has a 30% chance to attack an allied minion.",
  image: "art/Athena.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyConfusionToAllEnemyMinions", turns: 1, chance: 30 },
  ],
};
