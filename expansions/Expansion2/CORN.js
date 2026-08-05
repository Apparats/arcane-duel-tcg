module.exports = {
  name: "CORN",
  cost: 6,
  type: "minion",
  attack: 5,
  health: 7,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Canada",
  lore: "While this card is on the board, Taunt cards cannot be summoned.",
  image: "art/CORN.webp",
  abilities: [
    { trigger: "passive", effect: "blockKeywordSummons", keywords: ["taunt"] },
  ],
};
