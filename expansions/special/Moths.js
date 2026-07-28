module.exports = {
  name: "Moths",
  cost: 5,
  type: "minion",
  attack: 2,
  health: 2,
  keywords: ["divineShield"],
  race: "Monster",
  rarity: "mythic",
  country: "Arcana",
  lore: "A shielded moth! Every turn this card heals your board by 1!",
  image: "art/Moths.webp",
  showInInventory: false,
  abilities: [
    { trigger: "onTurnStart", effect: "buffAllFriendlyMinions", health: 1 },
  ],
};
