module.exports = {
  name: "Zoblezar",
  cost: 10,
  type: "minion",
  attack: 8,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "mythic",
  country: "Uzbekistan",
  lore: "When this falls, draw three cards. Its final lesson is never wasted. This card avoids the first hit against him",
  image: "art/Zoblezar.webp",
  abilities: [
    { trigger: "onDeath", effect: "drawCards", value: 3 },
  ],
};
