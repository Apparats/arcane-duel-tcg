module.exports = {
  name: "Dezadin",
  cost: 7,
  type: "minion",
  attack: 4,
  health: 7,
  keywords: ["charge"], 
  race: "Monster",
  rarity: "mythic",
  country: "Bolivia",
  lore: "You’re made of spare parts, aren’t you, bud?. This card buffs all allied cards by +2",
  image: "art/Dezadin.webp",
  abilities: [
    { trigger: "onPlay", effect: "buffAllFriendlyMinions", attack: 2, health: 2 },
  ],
};
