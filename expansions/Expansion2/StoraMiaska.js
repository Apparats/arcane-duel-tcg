module.exports = {
  name: "storamiaska",
  cost: 10,
  type: "minion",
  attack: 5,
  health: 12,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Saudi Arabia",
  lore: "This card cannot be affected by other cards' effects, positive or negative.",
  image: "art/StoraMiaska.webp",
  abilities: [
    { trigger: "passive", effect: "immuneToCardEffects" },
  ],
};
