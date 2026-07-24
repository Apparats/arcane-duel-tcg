module.exports = {
  name: "V for Vendetta",
  cost: 4,
  type: "minion",
  attack: 3,
  health: 6,
  keywords: ["taunt"],
  race: "Human",
  rarity: "rare",
  country: "Lithuania",
  lore: "Taunt. This card is immune to adverse effects.",
  image: "art/V_for_Vendetta.webp",
  abilities: [
    { trigger: "passive", effect: "immuneToAdverseEffects" },
  ],
};
