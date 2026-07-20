module.exports = {
  name: "Moths",
  cost: 5,
  type: "minion",
  attack: 2,
  health: 3,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Arcana",
  lore: "A moth! Every turn this card heals your board by 2!",
  image: "art/Moths.webp",
  showInInventory: false,
  abilities: [
    { trigger: "onTurnStart", effect: "buffAllFriendlyMinions", health: 2 },
  ],
};
