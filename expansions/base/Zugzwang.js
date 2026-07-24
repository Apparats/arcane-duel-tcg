module.exports = {
  name: "Zugzwang",
  cost: 6,
  type: "minion",
  attack: 5,
  health: 7,
  keywords: ["charge"],
  race: "Human",
  rarity: "legendary",
  country: "Bolivia",
  lore: "At the start of each of your turns, add a Minor Spark to your hand. This card can instantly attack when prepared.",
  image: "art/Zugzwang.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "addCardToHand", cardId: "expansion1:minorspark" },
  ],
};
