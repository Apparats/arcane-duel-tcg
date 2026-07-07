module.exports = {
  name: "Penquin",
  cost: 4,
  type: "minion",
  attack: 2,
  health: 5,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "New Zealand",
  lore: "This card deals +2 damage to Human cards.",
  image: "art/Penquin.webp",
  damageBonuses: [
    { race: "Human", value: 2 },
  ],
};
