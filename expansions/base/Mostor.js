module.exports = {
  name: "Mostor",
  cost: 4,
  type: "minion",
  attack: 2,
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
