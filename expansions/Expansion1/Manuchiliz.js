module.exports = {
  name: "Manuchiliz",
  cost: 6,
  type: "minion",
  attack: 5,
  health: 9,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Argentina",
  lore: "Its arrival shakes every creature on the field, ally and enemy alike.",
  image: "art/Manuchiliz.webp",
  abilities: [
    { trigger: "onPlay", effect: "damageAllMinions", value: 3 },
  ],
};
