module.exports = {
  name: "Mostor",
  cost: 6,
  type: "minion",
  attack: 3,
  health: 7,
  keywords: ["charge"],
  race: "Monster",
  rarity: "rare",
  country: "Egypt",
  lore: "After dying, this card returns to the deck. This card can instantly attack when prepared.",
  image: "art/Mostor.webp",
  abilities: [
    { trigger: "onDeath", effect: "returnToDeckIfPlayedLessThan", value: 2 },
  ],
};
