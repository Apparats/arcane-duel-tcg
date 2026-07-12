module.exports = {
  name: "Kep",
  cost: 10,
  type: "minion",
  attack: 2,
  health: 14,
  keywords: [],
  race: "Human",
  rarity: "mythic",
  country: "Portugal",
  lore: "Uzbekistan sympathizer. This card regenerates two of health on your side every turn.",
  image: "art/Keps.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "healAllFriendlyMinions", value: 2 },
  ],
};
