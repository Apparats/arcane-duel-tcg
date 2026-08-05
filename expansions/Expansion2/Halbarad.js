module.exports = {
  name: "halbarad",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 6,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "Luxembourg",
  lore: "On play, adds a Quick Bandage to your hand.",
  image: "art/Halbarad.webp",
  abilities: [
    { trigger: "onPlay", effect: "addCardToHand", cardId: "expansion1:quickbandage" },
  ],
};
