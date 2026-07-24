module.exports = {
  name: "Weekly_Wackadoo",
  cost: 6,
  type: "minion",
  attack: 6,
  health: 6,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "Netherlands",
  lore: "While Weekly_Wackadoo is on the board, Charge minions cannot be summoned.",
  image: "art/Weekly_Wackadoo.webp",
  abilities: [
    { trigger: "passive", effect: "blockChargeSummons" },
  ],
};
