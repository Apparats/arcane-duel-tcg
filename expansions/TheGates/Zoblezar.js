module.exports = {
  name: "Zoblezar",
  cost: 7,
  type: "minion",
  attack: 8,
  health: 9,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Uzbekistan",
  lore: "The first time this card dies, revive it with half of its maximum Health.",
  image: "art/Zoblezar.webp",
  abilities: [
    { trigger: "onDeath", effect: "rebirthWithHalfHealth" },
  ],
};
