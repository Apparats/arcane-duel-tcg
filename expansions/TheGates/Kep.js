module.exports = {
  name: "Kep",
  cost: 6,
  type: "minion",
  attack: 2,
  health: 15,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Portugal",
  lore: "Uzbekistan sympathizer. This card regenerates one of health on your side every turn.",
  image: "art/Keps.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "healAllFriendlyMinions", value: 1 },
  ],
};
