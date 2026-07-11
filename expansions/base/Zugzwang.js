module.exports = {
  name: "Zugzwang",
  cost: 9,
  type: "minion",
  attack: 10,
  health: 5,
  keywords: ["charge"], 
  race: "Human",
  rarity: "mythic",
  country: "Bolivia",
  lore: "I'm too sick for a pill! This card can instantly attack when prepared. This card also draws 3 more cards when played.",
  image: "art/Zugzwang.webp",
  abilities: [
    { trigger: "onPlay", effect: "drawCards", value: 3 },
  ],
};
