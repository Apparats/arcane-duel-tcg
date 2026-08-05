module.exports = {
  name: "Manuchiliz",
  cost: 4,
  type: "minion",
  attack: 4,
  health: 6,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Argentina",
  lore: "On play, deals 4 damage to all other cards on the board.",
  image: "art/Manuchiliz.webp",
  abilities: [
    { trigger: "onPlay", effect: "damageAllOtherMinions", value: 4 },
  ],
};
