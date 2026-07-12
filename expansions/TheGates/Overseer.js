module.exports = {
  name: "Overseer",
  cost: 6,
  type: "minion",
  attack: 3,
  health: 6,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Oman",
  lore: "When this card dies, it deals 20 of damage to ALL cards on the board.",
  image: "art/Overseer.webp",
  abilities: [
    { trigger: "onDeath", effect: "damageAllMinions", value: 20 },
  ],
};
