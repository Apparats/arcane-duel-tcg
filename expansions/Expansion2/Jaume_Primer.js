module.exports = {
  name: "jaume_primer",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 6,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "Andorra",
  lore: "On play, adds a Minor Spark to your hand.",
  image: "art/Jaume_Primer.webp",
  abilities: [
    { trigger: "onPlay", effect: "addCardToHand", cardId: "expansion1:minorspark" },
  ],
};
