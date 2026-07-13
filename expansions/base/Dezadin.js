module.exports = {
  name: "Dezadin",
  cost: 9,
  type: "minion",
  attack: 3,
  health: 5,
  keywords: [], 
  race: "Monster",
  rarity: "mythic",
  country: "Bolivia",
  lore: "You’re made of spare parts, aren’t you, bud?. This card buffs all already summoned cards by +2",
  image: "art/Dezadin.webp",
  abilities: [
    { trigger: "onPlay", effect: "buffAllFriendlyMinions", attack: 2, health: 2 },
  ],
};
