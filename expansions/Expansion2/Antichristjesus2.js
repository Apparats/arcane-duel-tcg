module.exports = {
  id: "expansion2:Antichristjesus2",
  name: "Antichristjesus",
  cost: 4,
  type: "minion",
  attack: 3,
  health: 8,
  keywords: ["taunt"],
  race: "Human",
  rarity: "legendary",
  country: "Sri Lanka",
  lore: "While on the board, Taunt, Charge, and Divine Shield minions cannot be summoned. When this kills an enemy minion, it gains Divine Shield.",
  image: "art/Antichristjesus2.webp",
  abilities: [
    { trigger: "passive", effect: "blockKeywordSummons", keywords: ["taunt", "charge", "divineShield"] },
    { trigger: "onKillMinion", effect: "grantSelfDivineShield" },
  ],
};
