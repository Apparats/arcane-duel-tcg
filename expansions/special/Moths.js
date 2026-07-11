module.exports = {
  name: "Moths",
  cost: 5,
  type: "minion",
  attack: 1,
  health: 4,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Arcana",
  lore: "A moth! Every turn this card heals your board by 1!",
  image: "art/Moths.webp",
  showInInventory: false,
  abilities: [
    { trigger: "onTurnStart", effect: "buffAllFriendlyMinions", health: 1 },
  ],
};
