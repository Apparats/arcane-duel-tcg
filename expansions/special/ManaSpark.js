module.exports = {
  name: "Mana Spark",
  cost: 0,
  type: "spell",
  rarity: "common",
  country: "Arcana",
  lore: "Gain 1 temporary Mana this turn.",
  image: "art/MinorSpark.webp",
  showInInventory: false,
  abilities: [
    { trigger: "onPlay", effect: "gainTemporaryMana", value: 1 },
  ],
};
