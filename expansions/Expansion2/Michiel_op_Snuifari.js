module.exports = {
  name: "Michiel_op_Snuifari",
  cost: 1,
  type: "minion",
  attack: 1,
  health: 1,
  keywords: [],
  race: "Human",
  rarity: "common",
  country: "Arcana",
  lore: "While this is on your board, allied minions that die afterward revive with 1 Health and half their Attack. This does not affect Michiel_op_Snuifari.",
  image: "art/Michiel_op_Snuifari.webp",
  abilities: [
    { trigger: "passive", effect: "reviveOtherFriendlyMinions" },
  ],
};
