module.exports = {
  name: "Angel",
  cost: 6,
  type: "minion",
  attack: 7,
  health: 5,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "South Korea",
  lore: "When Angel dies, it has a 30% chance to destroy a random enemy minion.",
  image: "art/Angel.webp",
  abilities: [
    { trigger: "onDeath", effect: "destroyRandomEnemyMinionChance", chance: 30 },
  ],
};
