module.exports = {
  name: "Manuchiliz",
  cost: 5,
  type: "minion",
  attack: 5,
  health: 10,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Argentina",
  lore: "Its arrival makes 4 of damage to all cards on the board, ally and enemy alike.",
  image: "art/Manuchiliz.webp",
  abilities: [
    { trigger: "onPlay", effect: "damageAllMinions", value: 4 },
  ],
};
