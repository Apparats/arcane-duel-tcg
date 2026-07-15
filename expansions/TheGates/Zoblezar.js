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
  lore: "The first time this card dies, revive it with half of its maximum Health.",
  image: "art/Zoblezar.webp",
  abilities: [
    { trigger: "onDeath", effect: "rebirthWithHalfHealth" },
  ],
};
