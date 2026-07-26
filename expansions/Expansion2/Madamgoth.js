module.exports = {
  name: "Madamgoth",
  cost: 6,
  type: "minion",
  attack: 2,
  health: 9,
  keywords: ["taunt"],
  race: "Monster",
  rarity: "rare",
  country: "South Africa",
  lore: "Taunt. When a card attacks Madamgoth, the attacker receives Burning.",
  image: "art/MadamGoth.webp",
  abilities: [
    { trigger: "onAttacked", effect: "applyBurningToAttacker", value: 1, turns: 1 },
  ],
};
