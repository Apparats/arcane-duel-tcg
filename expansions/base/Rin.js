module.exports = {
  name: "Rin",
  cost: 7,
  type: "minion",
  attack: 6,
  health: 8,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "Malaysia",
  lore: "Whenever Rin attacks, it loses 1 Health.",
  image: "art/Rin.webp",
  abilities: [
    { trigger: "onAttack", effect: "damageSelfOnAttack", value: 1 },
  ],
};
