module.exports = {
  name: "Dantenie83",
  cost: 4,
  type: "minion",
  attack: 2,
  health: 7,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "Romania",
  lore: "On play, cleanse negative effects from a friendly minion.",
  image: "art/Dantenie83.webp",
  abilities: [
    { trigger: "onPlay", effect: "cleanseFriendlyMinion", target: "friendlyMinion" },
  ],
};
