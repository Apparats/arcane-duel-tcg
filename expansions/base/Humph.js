module.exports = {
  name: "Humph",
  cost: 6,
  type: "minion",
  attack: 7,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Ireland",
  lore: "When this card dies, return every remaining minion on both boards to its owner's deck.",
  image: "art/Humph.webp",
  abilities: [
    { trigger: "onDeath", effect: "returnAllMinionsToDeck" },
  ],
};
