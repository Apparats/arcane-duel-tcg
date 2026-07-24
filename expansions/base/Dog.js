module.exports = {
  name: "Dog",
  cost: 5,
  type: "minion",
  attack: 3,
  health: 5,
  keywords: ["charge"],
  race: "Monster",
  rarity: "rare",
  country: "South Africa",
  lore: "Charge. The first time Dog is played, a random friendly non-Charge minion gains Charge.",
  image: "art/Dog.webp",
  abilities: [
    { trigger: "onPlay", effect: "grantChargeToRandomFriendlyNonCharge", firstPlayOnly: true },
  ],
};
