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
  lore: "While on the board, enemies cannot summon Taunt or Divine Shield minions. When this kills an enemy minion, it restores its Health up to 8.",
  image: "art/Antichristjesus2.webp",
  abilities: [
    { trigger: "passive", effect: "blockKeywordSummons", keywords: ["taunt", "divineShield"], enemyOnly: true },
    { trigger: "onKillMinion", effect: "restoreSelfHealthToValue", value: 8 },
  ],
};
