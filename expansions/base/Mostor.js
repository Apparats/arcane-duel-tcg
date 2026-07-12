module.exports = {
  name: "Mostor",
  cost: 6,
  type: "minion",
  attack: 3,
  health: 6,
  keywords: ["charge"],
  race: "Monster",
  rarity: "legendary",
  country: "Egypt",
  lore: "After dying, this card returns to the deck. This card can instantly attack when prepared.",
  image: "art/Mostor.webp",
  abilities: [
    { trigger: "onDeath", effect: "returnToDeckIfPlayedLessThan", value: 2 },
  ],
};
