module.exports = {
  name: "Michiel_op_Snuifari",
  cost: 6,
  type: "minion",
  attack: 4,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Nigeria",
  lore: "While this is on your board, non-Taunt allied minions revive once with 1 Health and half their Attack. This does not affect Michiel_op_Snuifari.",
  image: "art/Michiel_op_Snuifari.webp",
  abilities: [
    { trigger: "passive", effect: "reviveOtherFriendlyMinions" },
  ],
};
