module.exports = {
  name: "Humph",
  cost: 6,
  type: "minion",
  attack: 3,
  health: 6,
  keywords: [], 
  race: "Human",
  rarity: "mythic",
  country: "Ireland",
  lore: "Cork bai. When played this card buffs all friendly cards by 1.",
  image: "art/Humph.webp",
  abilities: [
    { trigger: "onPlay", effect: "buffAllFriendlyMinions", value: "attack", count: 1 },
  ],
};
